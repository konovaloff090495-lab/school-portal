import http from 'node:http';
import {readFileSync,mkdirSync,chmodSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createHash,timingSafeEqual,scryptSync} from 'node:crypto';
import {open} from './crypto.mjs';
const cfg=JSON.parse(readFileSync(process.argv[2],'utf8')),publicKey=readFileSync(cfg.public_key,'utf8'),privateKey=readFileSync(cfg.private_key,'utf8');
mkdirSync(cfg.state,{recursive:true,mode:0o700});
const db=new DatabaseSync(cfg.state+'/leads.sqlite3');chmodSync(cfg.state+'/leads.sqlite3',0o600);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS leads(id TEXT PRIMARY KEY,site TEXT NOT NULL,created_at TEXT NOT NULL,received_at TEXT NOT NULL,envelope TEXT NOT NULL,digest TEXT NOT NULL,delivery TEXT NOT NULL DEFAULT '{}');
CREATE TABLE IF NOT EXISTS jobs(lead_id TEXT NOT NULL,channel TEXT NOT NULL,site TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',attempts INTEGER NOT NULL DEFAULT 0,next_at INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(lead_id,channel));
CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,at TEXT NOT NULL,action TEXT NOT NULL,lead_id TEXT,actor TEXT NOT NULL);
`);
const digest=s=>createHash('sha256').update(s).digest('hex');
const equal=(a,b)=>timingSafeEqual(Buffer.from(digest(a)),Buffer.from(digest(b)));
const audit=(action,id,actor)=>db.prepare('INSERT INTO audit(at,action,lead_id,actor) VALUES(?,?,?,?)').run(new Date().toISOString(),action,id,actor);
function writer(req){const token=String(req.headers.authorization||'').replace(/^Bearer /,'');return Object.entries(cfg.ingest).find(([,v])=>equal(digest(token),v))?.[0]}
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
const page=body=>'<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Закрытые заявки</title><body><h1>'+escape(cfg.label)+'</h1>'+body+'</body></html>';
const server=http.createServer({maxHeaderSize:8192},async(req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'; form-action 'none'");
 const json=(status,obj)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(obj))};
 try{
  const path=new URL(req.url,'http://local').pathname;
  if(path==='/health'&&req.method==='GET')return json(200,{status:'ok',operator:cfg.operator});
  if(req.method==='POST'&&(path==='/ingest'||path==='/delivery')){
   const site=writer(req);if(!site)return json(401,{error:'unauthorized'});
   const input=await body(req);
   if(path==='/delivery'){
    if(!/^[a-f0-9-]{36}$/i.test(input.id||'')||!['crm','telegram','email'].includes(input.channel)||!['sent','pending','failed','unknown'].includes(input.status))return json(400,{error:'invalid_status'});
    const row=db.prepare('SELECT delivery FROM leads WHERE id=? AND site=?').get(input.id,site);if(!row)return json(404,{error:'not_found'});
    const status=JSON.parse(row.delivery);status[input.channel]={status:input.status,at:new Date().toISOString()};
    db.prepare('UPDATE leads SET delivery=? WHERE id=? AND site=?').run(JSON.stringify(status),input.id,site);return json(200,{stored:true});
   }
   if(input.site!==site)return json(403,{error:'wrong_site'});
   open(input,{privateKey,publicKey,operator:cfg.operator,sites:Object.keys(cfg.ingest)});
   const value=JSON.stringify(input),hash=digest(value),old=db.prepare('SELECT digest FROM leads WHERE id=?').get(input.id);
   if(old)return json(old.digest===hash?200:409,old.digest===hash?{id:input.id,stored:true,duplicate:true}:{error:'conflict'});
   db.exec('BEGIN IMMEDIATE');try{
    db.prepare('INSERT INTO leads(id,site,created_at,received_at,envelope,digest) VALUES(?,?,?,?,?,?)').run(input.id,site,input.created_at,new Date().toISOString(),value,hash);audit('stored',input.id,site);if(cfg.notifications?.[site])db.prepare("INSERT INTO jobs(lead_id,channel,site) VALUES(?,'telegram',?)").run(input.id,site);db.exec('COMMIT');
   }catch(e){db.exec('ROLLBACK');throw e}
   return json(201,{id:input.id,stored:true});
  }
  if(req.method==='GET'&&(path==='/'||/^\/[a-f0-9-]{36}$/.test(path))){
   if(!admin(req)){res.setHeader('WWW-Authenticate','Basic realm="Private operator leads"');return json(401,{error:'unauthorized'})}
   res.setHeader('Content-Type','text/html; charset=utf-8');
   if(path==='/'){
    audit('list',null,cfg.admin_user);const rows=db.prepare('SELECT id,site,created_at,delivery FROM leads ORDER BY received_at DESC LIMIT 100').all();
    res.end(page('<p>Контакты открываются только в отдельной карточке. Все просмотры учитываются.</p><ul>'+rows.map(x=>'<li><a href="./'+escape(x.id)+'">'+escape(x.created_at)+' · '+escape(x.site)+' · '+escape(x.id)+'</a> · '+escape(JSON.stringify(JSON.parse(x.delivery)))+'</li>').join('')+'</ul>'));return;
   }
   const row=db.prepare('SELECT envelope FROM leads WHERE id=?').get(path.slice(1));if(!row)return json(404,{error:'not_found'});
   const payload=open(JSON.parse(row.envelope),{privateKey,publicKey,operator:cfg.operator,sites:Object.keys(cfg.ingest)});audit('view',path.slice(1),cfg.admin_user);res.end(page('<p><a href="./">К списку</a></p><pre>'+escape(JSON.stringify(payload,null,2))+'</pre>'));return;
  }
  return json(404,{error:'not_found'});
 }catch{json(400,{error:'request_not_accepted'})}
});
server.requestTimeout=15000;server.headersTimeout=10000;server.listen(cfg.port,'127.0.0.1',()=>console.log(JSON.stringify({event:'started',operator:cfg.operator,port:server.address().port})));
let sending=false;
async function notifications(){
 if(sending)return;sending=true;
 try{for(const job of db.prepare("SELECT * FROM jobs WHERE status='pending' AND next_at<=? ORDER BY next_at LIMIT 10").all(Date.now())){
  const target=cfg.notifications?.[job.site];if(!target)continue;
  db.prepare('UPDATE jobs SET attempts=attempts+1,next_at=? WHERE lead_id=? AND channel=?').run(Date.now()+Math.min(3600000,30000*2**Math.min(job.attempts,7)),job.lead_id,job.channel);
  try{
   const text='Новая заявка · '+job.site+'\nНомер: '+job.lead_id+'\nЗакрытая карточка: '+cfg.admin_url+job.lead_id;
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
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.close(()=>{db.close();process.exit(0)}));
