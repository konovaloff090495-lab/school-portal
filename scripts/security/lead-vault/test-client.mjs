import {mkdtempSync,writeFileSync,readFileSync,readdirSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {generateKeyPairSync} from 'node:crypto';
import assert from 'node:assert/strict';
import {open} from './crypto.mjs';
import {captureLeadSubmission} from '../../../src/lib/lead-vault.ts';
const dir=mkdtempSync(join(tmpdir(),'lead-client-synthetic-'));
const {publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
const originalFetch=globalThis.fetch,originalConfig=process.env.LEAD_VAULT_CONFIG;
try{
 writeFileSync(join(dir,'public.pem'),publicKey);process.env.LEAD_VAULT_CONFIG=join(dir,'config.json');writeFileSync(process.env.LEAD_VAULT_CONFIG,JSON.stringify({operator:'gerasimov',site:'proschools',public_key:join(dir,'public.pem'),endpoint:'http://127.0.0.1:1',ingest_token:'synthetic',spool:join(dir,'spool')}));
 const payload={name:'Synthetic',email:'synthetic@example.invalid',pd_agreed:true};
 globalThis.fetch=async()=>{throw Error('synthetic outage')};
 const id=await captureLeadSubmission(payload);const pending=join(dir,'spool',id+'.pending');assert.ok(readFileSync(pending));const e=JSON.parse(readFileSync(pending));assert.deepEqual(open(e,{privateKey,publicKey,operator:'gerasimov',sites:['proschools']}),payload);assert.ok(!readFileSync(pending,'utf8').includes(payload.email));
 globalThis.fetch=async(_url,opts)=>Response.json({id:JSON.parse(opts.body).id,stored:true});
 const id2=await captureLeadSubmission(payload);assert.ok(readdirSync(join(dir,'spool')).includes(id2+'.json'));
 process.env.LEAD_VAULT_CONFIG=join(dir,'missing.json');let requests=0;globalThis.fetch=async()=>{requests++;return Response.json({})};await assert.rejects(()=>captureLeadSubmission(payload));assert.equal(requests,0);
 console.log('Next client: ciphertext fsynced before relay; outage retained; committed receipt recognized; missing storage fails before external delivery.');
}finally{globalThis.fetch=originalFetch;if(originalConfig)process.env.LEAD_VAULT_CONFIG=originalConfig;else delete process.env.LEAD_VAULT_CONFIG;rmSync(dir,{recursive:true,force:true})}
