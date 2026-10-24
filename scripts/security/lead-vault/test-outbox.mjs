import {generateKeyPairSync,createHash,scryptSync} from 'node:crypto';
import {mkdtempSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {join} from 'node:path';import {tmpdir} from 'node:os';
import {spawn} from 'node:child_process';import {once} from 'node:events';
import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import {seal} from './crypto.mjs';
const dir=mkdtempSync(join(tmpdir(),'lead-outbox-synthetic-'));let child;
async function start(fast=false){
 child=spawn(process.execPath,['--import',join(dir,fast?'fast.mjs':'fake.mjs'),new URL('./server.mjs',import.meta.url).pathname,join(dir,'config.json')],{stdio:['ignore','pipe','pipe']});
 return await new Promise((resolve,reject)=>{let s='';child.stdout.on('data',b=>{s+=b;try{resolve(JSON.parse(s.split('\n')[0]).port)}catch{}});child.once('exit',()=>reject(Error('startup failed')));setTimeout(()=>reject(Error('startup timeout')),5000).unref()});
}
async function stop(){if(child&&child.exitCode===null){const p=once(child,'exit');child.kill();await p}}
try{
 const {publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
 writeFileSync(join(dir,'public.pem'),publicKey);writeFileSync(join(dir,'private.pem'),privateKey);
 const cfg={operator:'konovalov',label:'Synthetic',port:0,state:join(dir,'state'),public_key:join(dir,'public.pem'),private_key:join(dir,'private.pem'),ingest:{cardopen:createHash('sha256').update('synthetic-writer').digest('hex')},admin_user:'synthetic',admin_salt:'synthetic',admin_hash:scryptSync('synthetic','synthetic',32).toString('hex'),admin_url:'https://example.invalid/private/',notifications:{cardopen:{token:'synthetic-only',chat_id:'synthetic-only'}},bank_notification:{use_cardopen_token:true,chat_id:'bank-synthetic-only'}};writeFileSync(join(dir,'config.json'),JSON.stringify(cfg));
 const fake="import{appendFileSync}from'node:fs';globalThis.fetch=async(url,opts)=>{if(!url.startsWith('https://api.telegram.org/botsynthetic-only/'))throw Error('unexpected transport');appendFileSync("+JSON.stringify(join(dir,'sent.jsonl'))+",opts.body+'\\n');return Response.json({ok:true})};";
 writeFileSync(join(dir,'fake.mjs'),fake);writeFileSync(join(dir,'fast.mjs'),fake+"const original=globalThis.setInterval;globalThis.setInterval=(fn,ms)=>original(fn,Math.min(ms,25));");
 let port=await start();const envelope=seal({email:'fake@example.invalid',name:'Synthetic person',pd_agreed:true,_vault_notification:'silent'},{publicKey,operator:'konovalov',site:'cardopen'});
 assert.equal((await fetch('http://127.0.0.1:'+port+'/ingest',{method:'POST',headers:{Authorization:'Bearer synthetic-writer','Content-Type':'application/json'},body:JSON.stringify(envelope)})).status,201);await stop();
 let db=new DatabaseSync(join(dir,'state/leads.sqlite3'));assert.equal(db.prepare("SELECT count(*) AS n FROM jobs WHERE status='pending'").get().n,1);db.close();
 port=await start(true);
 for(let i=0;i<100&&!existsSync(join(dir,'sent.jsonl'));i++)await new Promise(r=>setTimeout(r,20));
 await stop();const sent=readFileSync(join(dir,'sent.jsonl'),'utf8');assert(!sent.includes('fake@example.invalid')&&!sent.includes('Synthetic person'));assert(sent.includes(envelope.id));assert.equal(sent.trim().split('\n').length,1);
 db=new DatabaseSync(join(dir,'state/leads.sqlite3'));assert.equal(db.prepare("SELECT count(*) AS n FROM jobs WHERE status='sent'").get().n,1);db.close();
 port=await start(true);const bank=seal({kind:'bank_postback',record:{status:'approved',order_id:'synthetic-private-order',click_id:'synthetic-private-click'}},{publicKey,operator:'konovalov',site:'cardopen'});const duplicate=seal({kind:'bank_postback',_vault_notification:'silent',record:{status:'approved'}},{publicKey,operator:'konovalov',site:'cardopen'});
 const macro=seal({kind:'bank_postback',record:{status:'approved',raw_macro:1,order_id:'synthetic-private-macro'}},{publicKey,operator:'konovalov',site:'cardopen'});
 for(const value of [bank,duplicate,macro])assert.equal((await fetch('http://127.0.0.1:'+port+'/ingest',{method:'POST',headers:{Authorization:'Bearer synthetic-writer','Content-Type':'application/json'},body:JSON.stringify(value)})).status,201);
 for(let i=0;i<100;i++){if(readFileSync(join(dir,'sent.jsonl'),'utf8').trim().split('\n').length===3)break;await new Promise(r=>setTimeout(r,20))}await stop();const notices=readFileSync(join(dir,'sent.jsonl'),'utf8');assert.equal(notices.trim().split('\n').length,3);assert(notices.includes('bank-synthetic-only'));assert(!notices.includes('synthetic-private-order')&&!notices.includes('synthetic-private-click')&&!notices.includes('synthetic-private-macro'));const warning=notices.trim().split('\n').map(x=>JSON.parse(x).text).find(x=>x.includes(macro.id));assert(warning.includes('макрос')&&!warning.includes('карта выпущена'));
 console.log('Outbox survives a process restart and sends one private-link notice without contacts; Bank notices preserve their recipient, reuse the active token and suppress duplicates; transport mocked locally.');
}finally{await stop();rmSync(dir,{recursive:true,force:true})}
