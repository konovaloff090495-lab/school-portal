import {DatabaseSync} from 'node:sqlite';
import {randomBytes,randomUUID,createHash,createHmac,createCipheriv,createDecipheriv} from 'node:crypto';
import {mkdirSync,chmodSync,readFileSync} from 'node:fs';
import {dirname} from 'node:path';
const DAY=86400000;
export const MEASUREMENT_PATHS=new Set(JSON.parse(readFileSync(new URL('./measurement-paths.json',import.meta.url),'utf8')));
export const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const token=()=>randomBytes(32).toString('base64url');
export const hash=v=>createHash('sha256').update(v).digest('hex');

export const ELAPSED_BUCKETS=['under_1m','1_3m','3_7m','7_15m','15_30m','30m_plus','unknown'];
export function makeMeasurement(raw,utm={},knownTest=false){
 const m=raw||{},u={...utm,...(m.visit_utm||{})},medium=String(u.utm_medium||'').toLowerCase(),host=String(m.referrer_host||'').toLowerCase();
 const qa=knownTest||Object.values(u).some(v=>typeof v==='string'&&/^qa[_-]/i.test(v));
 let cohort='unknown';
 if(qa)cohort='qa';else if(u.yclid||u.gclid||/^(cpc|ppc|paid|paid_social|social_paid|cpm|display|retargeting)$/.test(medium))cohort='paid';
 else if(medium==='organic')cohort='organic';else if(/(^|\.)(google\.(?:com|ru|co\.uk|de|fr|kz|by|ca|es|it|co\.in|com\.tr|com\.br|com\.ua)|yandex\.(?:ru|com|by|kz|uz|com\.tr)|ya\.ru|bing\.com|duckduckgo\.com|search\.mail\.ru)$/.test(host))cohort='organic';
 else if(u.utm_source)cohort='campaign';else if(host&&host!=='pro-schools.ru'&&host!=='www.pro-schools.ru')cohort='referral';else if(raw)cohort=host?'internal':'direct';
 return {journey_id:uuid.test(m.journey_id||'')?m.journey_id:null,referrer_host:host,cohort,is_test:qa,elapsed_bucket:ELAPSED_BUCKETS.includes(m.elapsed_bucket)?m.elapsed_bucket:'unknown'};
}

export class Store {
 constructor(path,key,now=()=>Date.now()) {
  if(!/^[0-9a-f]{64}$/i.test(key||''))throw Error('CAREER_KEY_HEX must be 32 random bytes');
  this.key=Buffer.from(key,'hex');this.now=now;
  mkdirSync(dirname(path),{recursive:true,mode:0o700});
  this.db=new DatabaseSync(path);chmodSync(path,0o600);
  this.db.exec(`PRAGMA journal_mode=WAL;PRAGMA foreign_keys=ON;PRAGMA busy_timeout=5000;
  CREATE TABLE IF NOT EXISTS results(id TEXT PRIMARY KEY,request_id TEXT UNIQUE NOT NULL,fingerprint TEXT NOT NULL,sealed TEXT NOT NULL,recovery_hash TEXT UNIQUE NOT NULL,recovery_expires INTEGER NOT NULL,created INTEGER NOT NULL,expires INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY,result_id TEXT REFERENCES results(id) ON DELETE CASCADE,expires INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS requests(id TEXT PRIMARY KEY,result_id TEXT REFERENCES results(id) ON DELETE CASCADE,request_id TEXT NOT NULL,fingerprint TEXT NOT NULL,offer_id TEXT NOT NULL,sealed TEXT NOT NULL,status TEXT NOT NULL,remote_id TEXT,created INTEGER NOT NULL,updated INTEGER NOT NULL,attempts INTEGER DEFAULT 0,UNIQUE(result_id,request_id));
  CREATE TABLE IF NOT EXISTS rates(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS event_counts(day TEXT NOT NULL,event TEXT NOT NULL,landing TEXT NOT NULL,offer_id TEXT NOT NULL,grade INTEGER NOT NULL,count INTEGER NOT NULL,PRIMARY KEY(day,event,landing,offer_id,grade));
  CREATE TABLE IF NOT EXISTS event_seen(hash TEXT PRIMARY KEY,expires INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS funnel_meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS funnel_events(event_key TEXT PRIMARY KEY,journey_hash TEXT NOT NULL,occurred INTEGER NOT NULL,day TEXT NOT NULL,event TEXT NOT NULL,landing TEXT NOT NULL,offer_id TEXT NOT NULL,grade INTEGER NOT NULL,cohort TEXT NOT NULL,is_test INTEGER NOT NULL,step INTEGER NOT NULL,elapsed_bucket TEXT NOT NULL,expires INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS funnel_counts(day TEXT NOT NULL,event TEXT NOT NULL,landing TEXT NOT NULL,offer_id TEXT NOT NULL,grade INTEGER NOT NULL,cohort TEXT NOT NULL,is_test INTEGER NOT NULL,step INTEGER NOT NULL,elapsed_bucket TEXT NOT NULL,count INTEGER NOT NULL,PRIMARY KEY(day,event,landing,offer_id,grade,cohort,is_test,step,elapsed_bucket));
  CREATE INDEX IF NOT EXISTS funnel_events_journey ON funnel_events(journey_hash,event,step);
  CREATE INDEX IF NOT EXISTS funnel_events_period ON funnel_events(day,event,cohort,is_test);
  CREATE INDEX IF NOT EXISTS funnel_events_expiry ON funnel_events(expires);
  CREATE INDEX IF NOT EXISTS requests_pending ON requests(status,created);`);
  this.db.prepare('INSERT OR IGNORE INTO funnel_meta VALUES(?,?)').run('schema_version','2');this.db.prepare('INSERT OR IGNORE INTO funnel_meta VALUES(?,?)').run('activated_at_utc',new Date(now()).toISOString());
  for(const row of this.db.prepare("SELECT * FROM requests WHERE status='sending'").all())this.finish(row.id,'uncertain');
  this.cleanup();
 }
 hmac(s){return createHmac('sha256',this.key).update(s).digest('hex')}
 seal(value,aad){const nonce=randomBytes(12),c=createCipheriv('aes-256-gcm',this.key,nonce);c.setAAD(Buffer.from(aad));const out=Buffer.concat([c.update(JSON.stringify(value),'utf8'),c.final()]);return Buffer.concat([nonce,c.getAuthTag(),out]).toString('base64')}
 open(sealed,aad){const b=Buffer.from(sealed,'base64'),d=createDecipheriv('aes-256-gcm',this.key,b.subarray(0,12));d.setAAD(Buffer.from(aad));d.setAuthTag(b.subarray(12,28));return JSON.parse(Buffer.concat([d.update(b.subarray(28)),d.final()]).toString())}
 transaction(fn){this.db.exec('BEGIN IMMEDIATE');try{const v=fn();this.db.exec('COMMIT');return v}catch(e){this.db.exec('ROLLBACK');throw e}}
 cleanup(){const n=this.now();this.db.prepare('DELETE FROM results WHERE expires<=?').run(n);this.db.prepare('DELETE FROM sessions WHERE expires<=?').run(n);this.db.prepare('DELETE FROM rates WHERE expires<=?').run(n);this.db.prepare('DELETE FROM event_seen WHERE expires<=?').run(n);this.db.prepare('DELETE FROM funnel_events WHERE expires<=?').run(n)}
 rate(key,max=20,window=3600000){return this.transaction(()=>{const k=this.hmac('rate:'+key),n=this.now();this.db.prepare('DELETE FROM rates WHERE key=? AND expires<=?').run(k,n);this.db.prepare('INSERT INTO rates(key,count,expires)VALUES(?,1,?) ON CONFLICT(key)DO UPDATE SET count=count+1').run(k,n+window);return this.db.prepare('SELECT count FROM rates WHERE key=?').get(k).count<=max})}
 metric(event,eventId,context,landing,offerId='',grade=0,step=0,elapsed='unknown'){
  landing=MEASUREMENT_PATHS.has(landing)?landing:'/proforientaciya/unattributed/';
  const n=this.now(),day=new Date(n+3*3600000).toISOString().slice(0,10),m=context||makeMeasurement(null),key=this.hmac(event.startsWith('career_feedback_')&&m.journey_id?'metric-feedback:'+m.journey_id:'metric-event:'+event+':'+eventId);
  let isTest=m.is_test===true;const journey=m.journey_id?this.hmac('metric-journey:'+m.journey_id):'',bucket=ELAPSED_BUCKETS.includes(elapsed)?elapsed:'unknown';
  if(journey&&this.db.prepare('SELECT 1 FROM funnel_events WHERE journey_hash=? AND is_test=1 LIMIT 1').get(journey))isTest=true;
  if(journey&&isTest){for(const old of this.db.prepare('SELECT day,event,landing,offer_id,grade,cohort,step,elapsed_bucket,count(*) AS n FROM funnel_events WHERE journey_hash=? AND is_test=0 GROUP BY day,event,landing,offer_id,grade,cohort,step,elapsed_bucket').all(journey)){
   this.db.prepare('UPDATE funnel_counts SET count=count-? WHERE day=? AND event=? AND landing=? AND offer_id=? AND grade=? AND cohort=? AND is_test=0 AND step=? AND elapsed_bucket=?').run(old.n,old.day,old.event,old.landing,old.offer_id,old.grade,old.cohort,old.step,old.elapsed_bucket);
   this.db.prepare('INSERT INTO funnel_counts VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(day,event,landing,offer_id,grade,cohort,is_test,step,elapsed_bucket)DO UPDATE SET count=count+excluded.count').run(old.day,old.event,old.landing,old.offer_id,old.grade,'qa',1,old.step,old.elapsed_bucket,old.n);
  }this.db.prepare("UPDATE funnel_events SET is_test=1,cohort='qa' WHERE journey_hash=? AND is_test=0").run(journey);}
  const cohort=isTest?'qa':m.cohort||'unknown';
  const inserted=this.db.prepare('INSERT OR IGNORE INTO funnel_events VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').run(key,journey,n,day,event,landing,offerId,grade,cohort,isTest?1:0,step,bucket,n+30*DAY).changes;
  if(inserted)this.db.prepare('INSERT INTO funnel_counts VALUES(?,?,?,?,?,?,?,?,?,1) ON CONFLICT(day,event,landing,offer_id,grade,cohort,is_test,step,elapsed_bucket)DO UPDATE SET count=count+1').run(day,event,landing,offerId,grade,cohort,isTest?1:0,step,bucket);
  return !inserted;
 }
 recordEvent(event){return this.transaction(()=>{
  const n=this.now(),day=new Date(n+3*3600000).toISOString().slice(0,10),seen=this.hmac('event:'+event.event_id);this.db.prepare('DELETE FROM event_seen WHERE expires<=?').run(n);if(this.db.prepare('SELECT 1 FROM event_seen WHERE hash=?').get(seen))return true;
  this.db.prepare('INSERT INTO event_seen VALUES(?,?)').run(seen,n+DAY);
  const metricDuplicate=this.metric(event.event,event.event_id,makeMeasurement(event.measurement),event.landing,event.offer_id||'',event.grade||0,event.step||0,event.elapsed_bucket||event.measurement?.elapsed_bucket||'unknown');
  if(event.event.startsWith('career_feedback_')&&metricDuplicate)return true;
  this.db.prepare('INSERT INTO event_counts(day,event,landing,offer_id,grade,count)VALUES(?,?,?,?,?,1) ON CONFLICT(day,event,landing,offer_id,grade)DO UPDATE SET count=count+1').run(day,event.event,event.landing,event.offer_id||'',event.grade||0);return false;
 })}

 createResult(data,result){return this.transaction(()=>{const {measurement:_measurement,...identity}=data;const fp=this.hmac(JSON.stringify(identity)),n=this.now();let row=this.db.prepare('SELECT * FROM results WHERE request_id=?').get(data.request_id);
  if(row&&row.expires<=n){this.db.prepare('DELETE FROM results WHERE id=?').run(row.id);row=null}
  if(row&&row.fingerprint!==fp)throw Object.assign(Error('conflict'),{status:409});
  const id=row?.id||randomBytes(16).toString('hex'),recovery=Buffer.from(this.hmac('career-recovery:'+id),'hex').toString('base64url');
  if(!row){this.db.prepare('INSERT INTO results VALUES(?,?,?,?,?,?,?,?)').run(id,data.request_id,fp,this.seal({data,result},'result:'+id),hash(recovery),n+90*DAY,n,n+180*DAY);this.metric('career_result_saved',id,data.measurement,data.landing,'',data.grade,0,data.measurement?.elapsed_bucket)}
  // Same idempotent request returns the same secret link without storing its plaintext; expiry is never extended.
  const session=this.session(id);return {id,recovery,session,result:row?this.open(row.sealed,'result:'+id).result:result,duplicate:!!row};})}
 session(id){const s=token();this.db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(s),id,this.now()+30*DAY);return s}
 authenticate(s){if(!s||!/^[A-Za-z0-9_-]{43}$/.test(s))return null;const r=this.db.prepare('SELECT r.* FROM results r JOIN sessions s ON s.result_id=r.id WHERE s.hash=? AND s.expires>? AND r.expires>?').get(hash(s),this.now(),this.now());return r?{...r,...this.open(r.sealed,'result:'+r.id)}:null}
 recoveryUrl(user){if(!user||user.recovery_expires<=this.now()||user.expires<=this.now())return null;const secret=Buffer.from(this.hmac('career-recovery:'+user.id),'hex').toString('base64url');if(hash(secret)!==user.recovery_hash)return null;return '/proforientaciya/rezultat/#token='+secret}
 recover(t){if(typeof t!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(t))return null;const row=this.db.prepare('SELECT id FROM results WHERE recovery_hash=? AND recovery_expires>? AND expires>?').get(hash(t),this.now(),this.now());return row?{id:row.id,session:this.session(row.id)}:null}
 requests(id){return this.db.prepare('SELECT request_id,offer_id,status FROM requests WHERE result_id=? ORDER BY created').all(id)}
 request(result,payload){return this.transaction(()=>{const {measurement:_measurement,...identity}=payload;const fp=this.hmac(JSON.stringify(identity));const old=this.db.prepare('SELECT * FROM requests WHERE result_id=? AND request_id=?').get(result.id,payload.request_id);if(old){if(old.fingerprint!==fp)throw Object.assign(Error('conflict'),{status:409});return {row:old,duplicate:true}}
 const existing=this.db.prepare('SELECT * FROM requests WHERE result_id=? AND offer_id=? ORDER BY created LIMIT 1').get(result.id,payload.offer_id);if(existing)return {row:existing,duplicate:true};
 const id=randomBytes(16).toString('hex'),n=this.now();const contact={...payload,measurement:payload.measurement||result.data.measurement||makeMeasurement(null),email:result.data.email,landing:result.data.landing,visit_utm:result.data.visit_utm,result_id:result.id,age:result.data.age,grade:result.data.grade,consent_version:'career-2026-11-06-v2',pd_default_selected:true,marketing_default_selected:false};
 this.db.prepare('INSERT INTO requests(id,result_id,request_id,fingerprint,offer_id,sealed,status,created,updated)VALUES(?,?,?,?,?,?,\'pending\',?,?)').run(id,result.id,payload.request_id,fp,payload.offer_id,this.seal(contact,'request:'+id),n,n);this.metric('career_partner_request_saved',id,contact.measurement,contact.landing,payload.offer_id,contact.grade,0,contact.measurement?.elapsed_bucket);return {row:this.db.prepare('SELECT * FROM requests WHERE id=?').get(id),duplicate:false};})}
 claim(){return this.transaction(()=>{const row=this.db.prepare("SELECT * FROM requests WHERE status='pending' ORDER BY created LIMIT 1").get();if(!row)return null;this.db.prepare("UPDATE requests SET status='sending',attempts=attempts+1,updated=? WHERE id=? AND status='pending'").run(this.now(),row.id);return {...row,contact:this.open(row.sealed,'request:'+row.id)}})}
 finish(id,status,remote=null){return this.transaction(()=>{const row=this.db.prepare("SELECT * FROM requests WHERE id=? AND status='sending'").get(id);if(!row)return;this.db.prepare("UPDATE requests SET status=?,remote_id=?,updated=? WHERE id=? AND status='sending'").run(status,remote,this.now(),id);if(['delivered','rejected','uncertain','configuration_error'].includes(status)){const c=this.open(row.sealed,'request:'+id);this.metric('career_crm_'+status,id,c.measurement,c.landing,row.offer_id,c.grade,0,c.measurement?.elapsed_bucket)}})}
 delete(id){this.db.prepare('DELETE FROM results WHERE id=?').run(id)}
 close(){this.db.close()}
}
