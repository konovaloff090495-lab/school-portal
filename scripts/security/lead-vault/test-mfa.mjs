import assert from 'node:assert/strict';import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {createHash} from 'node:crypto';import {mfa,totp} from './mfa.mjs';
const secret='GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';for(const [time,value] of [[59,'94287082'],[1111111109,'07081804'],[1111111111,'14050471'],[1234567890,'89005924'],[2000000000,'69279037'],[20000000000,'65353130']])assert.equal(totp(secret,Math.floor(time/30),8),value);
const dir=mkdtempSync(join(tmpdir(),'mfa-synthetic-'));const recovery='1234567890abcdef12345678',salt='synthetic-salt';const cfg={state:dir,admin_user:'synthetic',mfa:{secret,recovery_salt:salt,recovery_hashes:[createHash('sha256').update(salt+':'+recovery).digest('hex')]}};let audits=[];
try{const factor=mfa(cfg,(x)=>audits.push(x));assert(!factor.active());const req={headers:{host:'vault.example.test',origin:'https://vault.example.test','x-real-ip':'127.0.0.1'},socket:{remoteAddress:'127.0.0.1'}};let headers={};const res={setHeader:(k,v)=>headers[k]=v};
 function challenge(){factor.form(req,res);const nonce=headers['Set-Cookie'].split(';')[0].split('=')[1];req.headers.cookie='__Host-vault-challenge='+nonce;return nonce}
 let nonce=challenge();assert(!factor.verify({...req,headers:{...req.headers,origin:'https://public.example.test'}},{nonce,code:totp(secret,Math.floor(Date.now()/30000))}));
 assert(factor.verify(req,{nonce,code:totp(secret,Math.floor(Date.now()/30000))}));assert(factor.active());factor.session(res);req.headers.cookie=headers['Set-Cookie'][0].split(';')[0];assert(factor.valid(req));assert(!factor.valid({...req,headers:{cookie:'__Host-vault-session=bad'}}));
 nonce=challenge();assert(!factor.verify(req,{nonce,code:totp(secret,Math.floor(Date.now()/30000))}));
 nonce=challenge();assert(factor.verify(req,{nonce,code:recovery}));nonce=challenge();assert(!factor.verify(req,{nonce,code:recovery}));
 const restored=mfa(cfg,()=>{});assert(restored.active());
 const secondRecovery='abcdef1234567890abcdef12';cfg.mfa.recovery_hashes.push(createHash('sha256').update(salt+':'+secondRecovery).digest('hex'));
 for(let i=0;i<5;i++){nonce=challenge();assert(!factor.verify({...req,headers:{...req.headers,'x-real-ip':'192.0.2.'+String(i+1)}},{nonce,code:'invalid-format'}))}
 nonce=challenge();assert(!factor.verify({...req,headers:{...req.headers,'x-real-ip':'198.51.100.1'}},{nonce,code:secondRecovery}));assert(audits.includes('mfa_login')&&audits.includes('mfa_failed'));
 console.log('MFA: RFC6238 vectors, cross-origin rejection, activation, replay rejection, one-use recovery codes, distributed-guessing lockout and persisted state passed; synthetic only');
}finally{rmSync(dir,{recursive:true,force:true})}
