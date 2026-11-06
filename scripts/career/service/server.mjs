import http from 'node:http';
import {pathToFileURL} from 'node:url';
import {Store,uuid} from './store.mjs';
import {calculate} from './scoring.mjs';
import {Delivery,OFFERS} from './delivery.mjs';
import {sendRecoveryMail} from './mail.mjs';
const EMAIL=/^[^\s@<>]{1,64}@[^\s@<>.][^\s@<>]{0,180}\.[A-Za-zА-Яа-я]{2,24}$/;
const COOKIE='__Host-ps_career';
const EVENTS=new Set(['career_landing_view','career_test_start','career_test_complete','career_gate_view','career_result_view','career_offer_view','career_offer_select']);
const canonicalPath=p=>typeof p==='string'&&p.length<=300&&/^\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]*\/?$/.test(p);
export function normalizePhone(raw){if(typeof raw!=='string'||raw.length>40)return null;const d=raw.replace(/[\s()+-]/g,'');const n=d.length===11&&/^[78]/.test(d)?'7'+d.slice(1):d.length===10?'7'+d:null;return n&&/^7[3489]\d{9}$/.test(n)&&!/^7(\d)\1{9}$/.test(n)?'+'+n:null}
const fail=(status=400)=>{throw Object.assign(Error('request_rejected'),{status})};
const boolean=b=>typeof b==='boolean';
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
function object(b,allowed){if(!plain(b)||Object.keys(b).some(k=>!allowed.includes(k)))fail();if(b.website!==undefined&&b.website!=='')fail()}
function resultBody(b){object(b,['request_id','email','age','grade','answers','pd_agreed','adult_confirmed','marketing_agreed','landing','visit_utm','website','source']);if(b.source!==undefined&&b.source!=='career_result_save')fail();if(!uuid.test(b.request_id||'')||typeof b.email!=='string'||!EMAIL.test(b.email)||b.email.length>254||!Number.isInteger(b.age)||b.age<10||b.age>18||!Number.isInteger(b.grade)||b.grade<5||b.grade>11||!Array.isArray(b.answers)||b.answers.length!==24||b.answers.some(v=>v!==null&&v!==0&&v!==1&&v!==2)||b.pd_agreed!==true||b.adult_confirmed!==true||!boolean(b.marketing_agreed))fail();
 if(!canonicalPath(b.landing))fail();const utm=b.visit_utm??{};if(!plain(utm)||Object.keys(utm).length>9)fail();for(const[k,v]of Object.entries(utm))if(!['utm_source','utm_medium','utm_campaign','utm_content','utm_term','yclid','gclid','referrer','ym_client_id'].includes(k)||typeof v!=='string'||v.length>500||/[\r\n\0]/.test(v))fail();
 return {request_id:b.request_id,email:b.email.trim().toLowerCase(),age:b.age,grade:b.grade,answers:b.answers,pd_agreed:true,adult_confirmed:true,marketing_agreed:b.marketing_agreed,landing:b.landing,visit_utm:utm,source:'career_result_save',consent_version:'career-2026-11-06-v1',pd_default_selected:true,marketing_default_selected:false};
}
function partnerBody(b){object(b,['request_id','offer_id','name','phone','pd_agreed','marketing_agreed','website','source']);if(b.source!==undefined&&b.source!=='career_partner_'+b.offer_id)fail();const phone=normalizePhone(b.phone);if(!uuid.test(b.request_id||'')||typeof b.name!=='string'||b.name.trim().length<2||b.name.length>100||/[<>\r\n\0]/.test(b.name)||!phone||b.pd_agreed!==true||!boolean(b.marketing_agreed)||!OFFERS.some(o=>o.id===b.offer_id))fail();return {request_id:b.request_id,offer_id:b.offer_id,name:b.name.trim(),phone,pd_agreed:true,marketing_agreed:b.marketing_agreed,source:'career_partner_'+b.offer_id}}
async function body(req){if(req.headers['content-type']?.split(';')[0]!=='application/json')fail(415);const length=Number(req.headers['content-length']||0);if(length>16384)fail(413);let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>16384)fail(413);chunks.push(chunk)}try{return JSON.parse(Buffer.concat(chunks).toString())}catch{fail()}}
export function createCareerServer({env=process.env,transport=fetch,mail=sendRecoveryMail,now=()=>Date.now()}={}){
 const origin=env.CAREER_ORIGIN||'https://pro-schools.ru';if(!/^https:\/\/[a-z0-9.-]+$/.test(origin))throw Error('invalid_origin');
 const store=new Store(env.CAREER_DB||'/var/lib/proschools-career/career.sqlite3',env.CAREER_KEY_HEX,now),delivery=new Delivery(store,env,transport);
 const cookie=(value,clear=false)=>`${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${clear?0:2592000}`;
 const server=http.createServer(async(req,res)=>{res.setHeader('Cache-Control','private, no-store');res.setHeader('Pragma','no-cache');res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cross-Origin-Resource-Policy','same-origin');
 const send=(status,data)=>{res.writeHead(status);res.end(JSON.stringify(data))};
 try{if(!req.url?.startsWith('/api/career/')||req.url.length>600)fail(404);const url=new URL(req.url,'http://localhost'),path=url.pathname,mutate=['POST','DELETE'].includes(req.method);
 if(mutate&&req.headers.origin!==origin)fail(403);if(req.headers.origin&&req.headers.origin!==origin)fail(403);if(req.headers['sec-fetch-site']==='cross-site')fail(403);
 const ip=req.socket.remoteAddress?.replace('::ffff:','');const address=['127.0.0.1','::1'].includes(ip)?String(req.headers['x-real-ip']||ip):ip;
 const session=req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);let user;
 if(path==='/api/career/health/'&&req.method==='GET'){store.db.prepare('SELECT 1').get();return send(200,{ok:true})}
 if(!store.rate(`${address}:${mutate?'write':'read'}`,mutate?Number(env.CAREER_WRITE_LIMIT||40):240,600000))fail(429);
 if(path==='/api/career/events/'&&req.method==='POST'){
  if(!store.rate(address+':events',80,600000))fail(429);const b=await body(req);object(b,['event','event_id','landing','grade','offer_id']);if(!EVENTS.has(b.event)||!uuid.test(b.event_id||'')||!canonicalPath(b.landing)||(b.grade!==undefined&&(!Number.isInteger(b.grade)||b.grade<5||b.grade>11))||(b.offer_id!==undefined&&!OFFERS.some(o=>o.id===b.offer_id)))fail();const duplicate=store.recordEvent(b);return send(200,{ok:true,duplicate});
 }
 user=store.authenticate(session);
 if(path==='/api/career/results/'&&req.method==='POST'){
  if(!store.rate(address+':results',Number(env.CAREER_SAVE_LIMIT||10),3600000))fail(429);const data=resultBody(await body(req)),saved=store.createResult(data,calculate(data.answers,data.grade,now()));
  res.setHeader('Set-Cookie',cookie(saved.session));const recovery_url=`/proforientaciya/rezultat/#token=${saved.recovery}`;const mail_sent=saved.duplicate?false:await mail(data.email,origin+recovery_url,env);
  return send(200,{ok:true,result_id:saved.id,result:saved.result,recovery_url,mail_sent,duplicate:saved.duplicate});
 }
 if(path==='/api/career/access/'&&req.method==='POST'){if(!store.rate(address+':access',15,3600000))fail(429);const b=await body(req);object(b,['token']);const recovered=store.recover(b.token);if(!recovered)fail(401);res.setHeader('Set-Cookie',cookie(recovered.session));return send(200,{ok:true,result_id:recovered.id})}
 if(!user)fail(401);
 if(path==='/api/career/results/current/'&&req.method==='GET')return send(200,{ok:true,result_id:user.id,result:user.result,recovery_url:store.recoveryUrl(user),email_masked:user.data.email.replace(/^(.).+(@.+)$/,'$1***$2'),requests:store.requests(user.id)});
 if(path==='/api/career/offers/'&&req.method==='GET')return send(200,{ok:true,offers:delivery.offers(user.data.age)});
 if(path==='/api/career/partner/'&&req.method==='POST'){
  if(!store.rate(user.id+':partners',15,3600000))fail(429);const b=partnerBody(await body(req)),offer=OFFERS.find(o=>o.id===b.offer_id);if(user.data.age<offer.age_min||user.data.age>offer.age_max)fail(400);if(!delivery.available(offer))fail(503);
  const saved=store.request(user,b);send(saved.duplicate?200:202,{ok:true,request_id:saved.row.request_id,status:saved.row.status,duplicate:saved.duplicate});void delivery.drain();return;
 }
 if(path==='/api/career/requests/status/'&&req.method==='GET'){const id=url.searchParams.get('request_id');if(!uuid.test(id||''))fail();const r=store.requests(user.id).find(r=>r.request_id===id);if(!r)fail(404);return send(200,{ok:true,...r})}
 if((path==='/api/career/results/current/'&&req.method==='DELETE')||(path==='/api/career/delete/'&&req.method==='POST')){if(req.method==='POST'){const b=await body(req);object(b,[])}store.delete(user.id);res.setHeader('Set-Cookie',cookie('',true));return send(200,{ok:true})}
 fail(404);
 }catch(e){if(!res.headersSent){const status=e.status||500;if(status===500)console.error(JSON.stringify({event:'career_api_error',code:'internal'}));if(status===429)res.setHeader('Retry-After','600');send(status,{ok:false,error:status===401?'Доступ не найден или истёк.':status===503?'Предложение временно недоступно.':'Не удалось выполнить запрос. Проверьте данные и повторите.'})}else res.end()}
 });
 const timer=setInterval(()=>{try{store.cleanup();void delivery.drain().catch(()=>{})}catch{console.error('{"event":"career_maintenance_error"}')}},30000);timer.unref();server.requestTimeout=15000;server.headersTimeout=10000;server.keepAliveTimeout=5000;
 return {server,store,delivery,close:()=>{clearInterval(timer);server.close();store.close()}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const app=createCareerServer();app.server.listen(Number(process.env.CAREER_PORT||8795),'127.0.0.1',()=>console.info('{"event":"career_service_ready"}'));process.on('SIGTERM',()=>{app.server.close(()=>{app.store.close();process.exit(0)})})}
