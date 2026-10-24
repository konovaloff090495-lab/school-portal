/** Offline operator import. Input contains authenticated envelopes, never queues notifications. */
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {open} from './crypto.mjs';
const cfg=JSON.parse(readFileSync(process.argv[2],'utf8')),publicKey=readFileSync(cfg.public_key,'utf8'),privateKey=readFileSync(cfg.private_key,'utf8');
let raw='';for await(const chunk of process.stdin){raw+=chunk;if(raw.length>32*1024*1024)throw Error('import_limit')}
const rows=JSON.parse(raw),db=new DatabaseSync(cfg.state+'/leads.sqlite3');
db.exec('PRAGMA synchronous=FULL; PRAGMA busy_timeout=10000; BEGIN IMMEDIATE');let imported=0;
try{for(const row of rows){
 const envelope=row.envelope;open(envelope,{privateKey,publicKey,operator:cfg.operator,sites:Object.keys(cfg.ingest)});
 if(db.prepare('SELECT 1 FROM leads WHERE id=?').get(envelope.id))continue;
 const value=JSON.stringify(envelope),status=['sent','failed','unknown'].includes(row.status)?row.status:'unknown';
 db.prepare('INSERT INTO leads(id,site,created_at,received_at,envelope,digest,delivery) VALUES(?,?,?,?,?,?,?)').run(envelope.id,envelope.site,envelope.created_at,new Date().toISOString(),value,createHash('sha256').update(value).digest('hex'),JSON.stringify({crm:{status,imported:true}}));
 db.prepare('INSERT INTO audit(at,action,lead_id,actor) VALUES(?,?,?,?)').run(new Date().toISOString(),'historical_import',envelope.id,'migration');imported++;
}db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}finally{db.close()}
console.log(JSON.stringify({imported,total:rows.length,notifications_sent:0}));
