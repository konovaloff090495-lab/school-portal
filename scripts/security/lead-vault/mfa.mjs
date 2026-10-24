import {createHmac,createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {chmodSync} from 'node:fs';
const hash=s=>createHash('sha256').update(s).digest('hex');
const eq=(a,b)=>timingSafeEqual(Buffer.from(hash(a)),Buffer.from(hash(b)));
export function decode32(s){let bits='';for(const c of s.toUpperCase().replace(/=+$/,'')){const n='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(c);if(n<0)throw Error('invalid_secret');bits+=n.toString(2).padStart(5,'0')}return Buffer.from(bits.match(/.{8}/g).map(x=>parseInt(x,2)))}
export function totp(secret,counter,digits=6){const b=Buffer.alloc(8);b.writeBigUInt64BE(BigInt(counter));const h=createHmac('sha1',decode32(secret)).update(b).digest(),o=h.at(-1)&15;return String((h.readUInt32BE(o)&0x7fffffff)%10**digits).padStart(digits,'0')}
export function mfa(cfg,audit){
 if(!cfg.mfa)return null;
 const db=new DatabaseSync(cfg.state+'/auth.sqlite3');chmodSync(cfg.state+'/auth.sqlite3',0o600);
 db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS state(k TEXT PRIMARY KEY,v TEXT); CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,expires INTEGER); CREATE TABLE IF NOT EXISTS challenges(token TEXT PRIMARY KEY,expires INTEGER); CREATE TABLE IF NOT EXISTS attempts(ip TEXT PRIMARY KEY,n INTEGER,until INTEGER); CREATE TABLE IF NOT EXISTS used_recovery(hash TEXT PRIMARY KEY);');
 const cookie=req=>Object.fromEntries(String(req.headers.cookie||'').split(';').map(s=>s.trim().split('=')));
 const enabled=()=>db.prepare("SELECT v FROM state WHERE k='enabled'").get()?.v==='1';
 const prune=()=>{const now=Date.now();for(const t of ['sessions','challenges'])db.prepare('DELETE FROM '+t+' WHERE expires<?').run(now);db.prepare('DELETE FROM attempts WHERE until<?').run(now)};
 return {
  active:enabled,
  valid(req){const t=cookie(req)['__Host-vault-session'];return typeof t==='string'&&/^[a-f0-9]{64}$/.test(t)&&!!db.prepare('SELECT token FROM sessions WHERE token=? AND expires>?').get(hash(t),Date.now())},
  form(req,res){prune();const nonce=randomBytes(32).toString('hex');db.prepare('INSERT INTO challenges VALUES(?,?)').run(hash(nonce),Date.now()+600000);res.setHeader('Set-Cookie','__Host-vault-challenge='+nonce+'; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=600');return '<h2>'+ (enabled()?'Двухфакторный вход':'Подключение двухфакторного входа')+'</h2><p>Введите код приложения-аутентификатора'+(enabled()?' или одноразовый резервный код.':'. Ключ подключения находится в локальном файле владельца. До подтверждения карточки закрыты.')+'</p><form method="post" action="/auth/login"><input type="hidden" name="nonce" value="'+nonce+'"><label>Логин <input name="username" autocomplete="username" required maxlength="64"></label><label>Пароль <input name="password" type="password" autocomplete="current-password" required maxlength="256"></label><label>Код <input name="code" autocomplete="one-time-code" inputmode="numeric" required maxlength="32"></label><button type="submit">'+(enabled()?'Войти':'Подтвердить подключение')+'</button></form>'},
  verify(req,input){
   const host=String(req.headers.host||'').toLowerCase();if(req.headers.origin!=='https://'+host)return false;
   const nonce=cookie(req)['__Host-vault-challenge'];if(!nonce||!eq(nonce,String(input.nonce||'')))return false;
   if(!db.prepare('DELETE FROM challenges WHERE token=? AND expires>?').run(hash(nonce),Date.now()).changes)return false;
   const ip=String(req.headers['x-real-ip']||req.socket.remoteAddress),account='@account:'+cfg.admin_user,now=Date.now();const actors=[ip,account].map(key=>({key,state:db.prepare('SELECT n,until FROM attempts WHERE ip=?').get(key)}));if(actors.some(({state})=>state&&state.until>now&&state.n>=5))return false;
   const code=String(input.code||'').trim().replace(/[ -]/g,'');let success=false;
   db.exec('BEGIN IMMEDIATE');try{
    const last=Number(db.prepare("SELECT v FROM state WHERE k='last_counter'").get()?.v||'-1'),step=Math.floor(now/30000);
    if(/^\d{6}$/.test(code)){for(const c of [step-1,step,step+1])if(c>last&&eq(totp(cfg.mfa.secret,c),code)){db.prepare("INSERT INTO state VALUES('last_counter',?) ON CONFLICT(k) DO UPDATE SET v=excluded.v").run(String(c));success=true;break}}
    else if(enabled()&&/^[a-f0-9]{24}$/.test(code)){const h=hash(cfg.mfa.recovery_salt+':'+code);if(cfg.mfa.recovery_hashes.includes(h)&&!db.prepare('SELECT hash FROM used_recovery WHERE hash=?').get(h)){db.prepare('INSERT INTO used_recovery VALUES(?)').run(h);success=true}}
    if(success){db.prepare("INSERT INTO state VALUES('enabled','1') ON CONFLICT(k) DO UPDATE SET v='1'").run();db.prepare('DELETE FROM attempts WHERE ip IN (?,?)').run(ip,account)}
    else for(const {key,state} of actors)db.prepare('INSERT INTO attempts VALUES(?,?,?) ON CONFLICT(ip) DO UPDATE SET n=excluded.n,until=excluded.until').run(key,state&&state.until>now?state.n+1:1,now+900000);
    db.exec('COMMIT');
   }catch(e){db.exec('ROLLBACK');throw e}
   audit(success?'mfa_login':'mfa_failed',null,cfg.admin_user);return success;
  },
  logout(req,res){const token=cookie(req)['__Host-vault-session'];if(token)db.prepare('DELETE FROM sessions WHERE token=?').run(hash(token));res.setHeader('Set-Cookie','__Host-vault-session=; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=0')},
  session(res){const token=randomBytes(32).toString('hex');db.prepare('INSERT INTO sessions VALUES(?,?)').run(hash(token),Date.now()+7200000);res.setHeader('Set-Cookie',['__Host-vault-session='+token+'; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=7200','__Host-vault-challenge=; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'])}
 };
}
