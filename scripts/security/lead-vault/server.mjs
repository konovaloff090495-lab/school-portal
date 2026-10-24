import http from 'node:http';
import {readFileSync,mkdirSync,chmodSync,realpathSync,openSync,fstatSync,closeSync,constants} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createHash,timingSafeEqual,scryptSync} from 'node:crypto';
import {open} from './crypto.mjs';
import {mailer} from './mailer.mjs';
import {mfa} from './mfa.mjs';
import {school} from './school.mjs';
const cfg=JSON.parse(readFileSync(process.argv[2],'utf8')),publicKey=readFileSync(cfg.public_key,'utf8'),privateKey=readFileSync(cfg.private_key,'utf8');
mkdirSync(cfg.state,{recursive:true,mode:0o700});
const db=new DatabaseSync(cfg.state+'/leads.sqlite3');chmodSync(cfg.state+'/leads.sqlite3',0o600);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS leads(id TEXT PRIMARY KEY,site TEXT NOT NULL,created_at TEXT NOT NULL,received_at TEXT NOT NULL,envelope TEXT NOT NULL,digest TEXT NOT NULL,delivery TEXT NOT NULL DEFAULT '{}');
CREATE TABLE IF NOT EXISTS jobs(lead_id TEXT NOT NULL,channel TEXT NOT NULL,site TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',attempts INTEGER NOT NULL DEFAULT 0,next_at INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(lead_id,channel));
CREATE TABLE IF NOT EXISTS heartbeat(site TEXT PRIMARY KEY,at TEXT NOT NULL,pending INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,at TEXT NOT NULL,action TEXT NOT NULL,lead_id TEXT,actor TEXT NOT NULL);
`);
const digest=s=>createHash('sha256').update(s).digest('hex');
const equal=(a,b)=>timingSafeEqual(Buffer.from(digest(a)),Buffer.from(digest(b)));
const audit=(action,id,actor)=>db.prepare('INSERT INTO audit(at,action,lead_id,actor) VALUES(?,?,?,?)').run(new Date().toISOString(),action,id,actor);
function writer(req){const token=String(req.headers.authorization||'').replace(/^Bearer /,'');return Object.entries(cfg.ingest).find(([,v])=>equal(digest(token),v))?.[0]}
const factor=mfa(cfg,audit);
const attempts=new Map();
function admin(req){
 const ip=req.headers['x-real-ip']||req.socket.remoteAddress,now=Date.now(),state=attempts.get(ip);
 if(state&&state.until>now&&state.n>=5)return false;
 if(attempts.size>10000)attempts.clear();
 const a=String(req.headers.authorization||'');if(!a.startsWith('Basic '))return false;
 const raw=Buffer.from(a.slice(6),'base64').toString('utf8'),i=raw.indexOf(':');
 const valid=i>0&&raw.slice(0,i)===cfg.admin_user&&equal(scryptSync(raw.slice(i+1),cfg.admin_salt,32).toString('hex'),cfg.admin_hash);
 if(!valid)attempts.set(ip,{n:state&&state.until>now?state.n+1:1,until:now+900000});else attempts.delete(ip);return valid;
}
async function body(req){let n=0;const chunks=[];for await(const chunk of req){n+=chunk.length;if(n>160000)throw Error('too_large');chunks.push(chunk)}return JSON.parse(Buffer.concat(chunks).toString('utf8'))}
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const page=(body,authenticated=false)=>'<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Закрытые заявки</title><body><h1>'+escape(cfg.label)+'</h1>'+body+(authenticated&&cfg.mfa?'<form method="post" action="/auth/logout"><button type="submit">Выйти</button></form>':'')+'</body></html>';
const server=http.createServer({maxHeaderSize:8192},async(req,res)=>{
 res.setHeader('Cross-Origin-Resource-Policy','same-origin');res.setHeader('Cross-Origin-Opener-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'; form-action 'self'");
 const json=(status,obj)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(obj))};
 try{
  const url=new URL(req.url,'http://local'),path=url.pathname;
  if(path==='/health'&&req.method==='GET')return json(200,{status:'ok',operator:cfg.operator});
  if(req.method==='POST'&&(path==='/ingest'||path==='/delivery'||path==='/heartbeat'||path.startsWith('/mail/')||path.startsWith('/school/'))){
   const site=writer(req);if(!site)return json(401,{error:'unauthorized'});
   const input=await body(req);
   if(path.startsWith('/school/')){
    try{const result=await school(cfg,site,path.slice(8),input);return json(200,result)}catch{return json(503,{error:'school_operation_unavailable'})}
   }
   if(path.startsWith('/mail/')){
    if(!cfg.mailer||cfg.mailer.site!==site||!['enroll','confirm','unsubscribe','reserve-welcome'].includes(path.slice(6)))return json(404,{error:'operation_not_allowed'});
    try{const result=await mailer(cfg,site,path.slice(6),input);audit('mailer_ok',null,site);return json(200,result)}
    catch{audit('mailer_failed',null,site);return json(503,{error:'mail_operation_unavailable'})}
   }
   if(path==='/heartbeat'){
    if(!Number.isSafeInteger(input.pending)||input.pending<0||input.pending>10000000)return json(400,{error:'invalid_heartbeat'});
    db.prepare('INSERT INTO heartbeat(site,at,pending) VALUES(?,?,?) ON CONFLICT(site) DO UPDATE SET at=excluded.at,pending=excluded.pending').run(site,new Date().toISOString(),input.pending);
    return json(200,{stored:true});
   }
   if(path==='/delivery'){
    if(!/^[a-f0-9-]{36}$/i.test(input.id||'')||!['crm','telegram','email'].includes(input.channel)||!['sent','pending','failed','unknown'].includes(input.status))return json(400,{error:'invalid_status'});
    const row=db.prepare('SELECT delivery FROM leads WHERE id=? AND site=?').get(input.id,site);if(!row)return json(404,{error:'not_found'});
    const status=JSON.parse(row.delivery);status[input.channel]={status:input.status,at:new Date().toISOString()};
    db.prepare('UPDATE leads SET delivery=? WHERE id=? AND site=?').run(JSON.stringify(status),input.id,site);return json(200,{stored:true});
   }
   if(input.site!==site)return json(403,{error:'wrong_site'});
   const captured=open(input,{privateKey,publicKey,operator:cfg.operator,sites:Object.keys(cfg.ingest)});
   const value=JSON.stringify(input),hash=digest(value),old=db.prepare('SELECT digest FROM leads WHERE id=?').get(input.id);
   if(old)return json(old.digest===hash?200:409,old.digest===hash?{id:input.id,stored:true,duplicate:true}:{error:'conflict'});
   db.exec('BEGIN IMMEDIATE');try{
    db.prepare('INSERT INTO leads(id,site,created_at,received_at,envelope,digest) VALUES(?,?,?,?,?,?)').run(input.id,site,input.created_at,new Date().toISOString(),value,hash);audit('stored',input.id,site);if(cfg.notifications?.[site]&&!(site==='cardopen'&&captured?.kind==='bank_postback'&&captured?._vault_notification==='silent'))db.prepare("INSERT INTO jobs(lead_id,channel,site) VALUES(?,'telegram',?)").run(input.id,site);db.exec('COMMIT');
   }catch(e){db.exec('ROLLBACK');throw e}
   return json(201,{id:input.id,stored:true});
  }
  if(path==='/auth/logout'&&req.method==='POST'&&factor){
   if(!cfg.admin_hosts?.includes(String(req.headers.host||'').toLowerCase().split(':')[0])||req.headers.origin!=='https://'+req.headers.host||!factor.valid(req))return json(403,{error:'forbidden'});
   factor.logout(req,res);res.writeHead(303,{Location:'/'});res.end();return;
  }
  if(path==='/auth/login'&&req.method==='POST'&&factor){
   if(!cfg.admin_hosts?.includes(String(req.headers.host||'').toLowerCase().split(':')[0]))return json(421,{error:'private_origin_required'});
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>2048)return json(400,{error:'too_large'})}
   const input=Object.fromEntries(new URLSearchParams(raw));
   const passwordRequest={headers:{...req.headers,authorization:'Basic '+Buffer.from(String(input.username||'')+':'+String(input.password||'')).toString('base64')},socket:req.socket};
   if(!admin(passwordRequest)||!factor.verify(req,input)){res.writeHead(403,{'Content-Type':'text/html; charset=utf-8'});res.end(page('<p>Не удалось войти. Проверьте логин, пароль и текущий код приложения.</p><p><a href="/">Открыть форму входа заново</a></p>'));return;}
   factor.session(res);res.writeHead(303,{Location:'/'});res.end();return;
  }
  if(req.method==='GET'&&(path==='/'||/^\/[a-f0-9-]{36}$/.test(path)||/^\/schools\/[a-f0-9]{32}(?:\/photo\/[a-f0-9]{32}\.jpg)?$/.test(path))){
   if(cfg.admin_hosts&&!cfg.admin_hosts.includes(String(req.headers.host||'').toLowerCase().split(':')[0]))return json(421,{error:'private_origin_required'});
   if(!factor&&!admin(req)){res.setHeader('WWW-Authenticate','Basic realm="Private leads '+cfg.operator+'"');return json(401,{error:'unauthorized'})}
   res.setHeader('Content-Type','text/html; charset=utf-8');
   if(factor&&!factor.valid(req)){res.end(page(factor.form(req,res)));return}
   if(path.startsWith('/schools/')){
    const parts=path.split('/'),row=await school(cfg,'proschools','admin-get',{id:parts[2]},true);if(row.error)return json(404,{error:'not_found'});
    if(parts[3]==='photo'){
     if(!row.photos?.some(x=>x.file===parts[4]))return json(404,{error:'photo_not_found'});
     const expected=cfg.school.photos+'/'+parts[2]+'/'+parts[4];if(realpathSync(expected)!==expected)return json(404,{error:'photo_not_found'});const fd=openSync(expected,constants.O_RDONLY|constants.O_NOFOLLOW);let bytes;try{const stat=fstatSync(fd);if(!stat.isFile()||stat.size>16*1024*1024)throw Error('invalid_photo');bytes=readFileSync(fd)}finally{closeSync(fd)}audit('school_photo_view',parts[2],cfg.admin_user);res.setHeader('Content-Type','image/jpeg');res.end(bytes);return;
    }
    audit('school_view',parts[2],cfg.admin_user);res.end(page('<p><a href="/">К списку заявок</a></p><h2>Заявка школы</h2><pre>'+escape(JSON.stringify(row,null,2))+'</pre><p>'+row.photos.map((x,i)=>'<a href="'+path+'/photo/'+escape(x.file)+'">Фото '+String(i+1)+'</a>').join(' · ')+'</p>',true));return;
   }
   if(path==='/'){
    audit('list',null,cfg.admin_user);const value=url.searchParams.get('page')||'0';if(!/^[0-9]{1,5}$/.test(value))return json(400,{error:'invalid_page'});const offset=Number(value)*100;const rows=db.prepare('SELECT id,site,created_at,delivery FROM leads ORDER BY received_at DESC LIMIT 100 OFFSET ?').all(offset);const total=db.prepare('SELECT COUNT(*) AS n FROM leads').get().n;const navigation='<p>'+ (offset>0?'<a href="?page='+String(Number(value)-1)+'">← Новее</a> · ':'')+'Страница '+String(Number(value)+1)+' · Всего '+String(total)+(offset+100<total?' · <a href="?page='+String(Number(value)+1)+'">Старее →</a>':'')+'</p>';
    res.end(page(navigation+'<p>Контакты открываются только в отдельной карточке. Все просмотры учитываются.</p><ul>'+rows.map(x=>'<li><a href="./'+escape(x.id)+'">'+escape(x.created_at)+' · '+escape(x.site)+' · '+escape(x.id)+'</a> · '+escape(JSON.stringify(JSON.parse(x.delivery)))+'</li>').join('')+'</ul>',true));return;
   }
   const row=db.prepare('SELECT envelope FROM leads WHERE id=?').get(path.slice(1));if(!row)return json(404,{error:'not_found'});
   const payload=open(JSON.parse(row.envelope),{privateKey,publicKey,operator:cfg.operator,sites:Object.keys(cfg.ingest)});audit('view',path.slice(1),cfg.admin_user);res.end(page('<p><a href="./">К списку</a></p><pre>'+escape(JSON.stringify(payload,null,2))+'</pre>',true));return;
  }
  return json(404,{error:'not_found'});
 }catch{json(400,{error:'request_not_accepted'})}
});
server.requestTimeout=15000;server.headersTimeout=10000;server.listen(cfg.port,'127.0.0.1',()=>console.log(JSON.stringify({event:'started',operator:cfg.operator,port:server.address().port})));
let sending=false,stopping=false;
async function notifications(){
 if(sending||stopping)return;sending=true;
 try{for(const job of db.prepare("SELECT * FROM jobs WHERE status='pending' AND next_at<=? ORDER BY next_at LIMIT 10").all(Date.now())){
  if(stopping)break;const stored=db.prepare('SELECT envelope FROM leads WHERE id=?').get(job.lead_id);const payload=open(JSON.parse(stored.envelope),{privateKey,publicKey,operator:cfg.operator,sites:Object.keys(cfg.ingest)});const bank=job.site==='cardopen'&&payload.kind==='bank_postback';const bankTarget=cfg.bank_notification||cfg.notifications?.cardopen;const target=bank?(bankTarget?.use_cardopen_token?{...bankTarget,token:cfg.notifications?.cardopen?.token}:bankTarget):cfg.notifications?.[job.site];if(!target?.token)continue;
  db.prepare('UPDATE jobs SET attempts=attempts+1,next_at=? WHERE lead_id=? AND channel=?').run(Date.now()+Math.min(3600000,30000*2**Math.min(job.attempts,7)),job.lead_id,job.channel);
  try{
   const label=bank?(payload.record?.raw_macro?'Card Open: проверьте настройку банковского события (незаменённый макрос)':'Card Open: событие банка · '+({'pending':'заявка','approved':'карта выпущена','rejected':'отказ'}[payload.record?.status]||'новое событие')):'Новая заявка · '+job.site;const text=label+'\nНомер: '+job.lead_id+'\nЗакрытая карточка: '+cfg.admin_url+job.lead_id;
   const response=await fetch('https://api.telegram.org/bot'+target.token+'/sendMessage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:target.chat_id,text,disable_web_page_preview:true}),signal:AbortSignal.timeout(15000)});
   const receipt=await response.json();if(!response.ok||!receipt.ok)throw Error('retry');
   db.exec('BEGIN IMMEDIATE');try{
    db.prepare("UPDATE jobs SET status='sent' WHERE lead_id=? AND channel=?").run(job.lead_id,job.channel);
    const row=db.prepare('SELECT delivery FROM leads WHERE id=?').get(job.lead_id),delivery=JSON.parse(row.delivery);delivery.telegram={status:'sent',at:new Date().toISOString()};db.prepare('UPDATE leads SET delivery=? WHERE id=?').run(JSON.stringify(delivery),job.lead_id);audit('notification_sent',job.lead_id,'worker');db.exec('COMMIT');
   }catch(e){db.exec('ROLLBACK');throw e}
  }catch{console.log(JSON.stringify({event:'notification_retry',id:job.lead_id}))}
 }}finally{sending=false}
}
if(cfg.notifications){setInterval(()=>notifications().catch(()=>{}),15000).unref();}
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{stopping=true;server.close(async()=>{const until=Date.now()+20000;while(sending&&Date.now()<until)await new Promise(resolve=>setTimeout(resolve,25));db.close();process.exit(0)})});
