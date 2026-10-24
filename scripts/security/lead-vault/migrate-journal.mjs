/** Run as root only after the website switched its receipt path. Retains all historical records encrypted. */
import {readFileSync,writeFileSync,renameSync,chmodSync,chownSync,statSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {randomUUID,createHash} from 'node:crypto';
import {seal} from './crypto.mjs';
const path=process.argv[2];if(path!=='/var/lib/portfolio/proschools/lead-journal.jsonl')throw Error('unexpected_source');
const before=readFileSync(path,'utf8'),metadata=statSync(path),cfg=JSON.parse(readFileSync('/etc/portfolio-leads/gerasimov/config.json','utf8')),publicKey=readFileSync(cfg.public_key,'utf8');
const entries=before.split('\n').filter(Boolean).map(x=>JSON.parse(x));
const rows=entries.map(entry=>({envelope:seal(entry,{publicKey,operator:'gerasimov',site:'proschools',id:/^[0-9a-f-]{36}$/i.test(entry.event_id||'')?entry.event_id:randomUUID(),created_at:entry.ts||new Date().toISOString()}),status:entry.crm?.status==='accepted'?'sent':entry.crm?.status==='failed'?'failed':'unknown'}));
const imported=spawnSync('runuser',['-u','lead-gerasimov','--','/usr/local/bin/node','/opt/portfolio-lead-vault/import.mjs','/etc/portfolio-leads/gerasimov/config.json'],{input:JSON.stringify(rows),encoding:'utf8',timeout:60000});if(imported.status!==0)throw Error('import_failed');
for(const cmd of [['/usr/local/sbin/portfolio-lead-archive'],['/usr/local/sbin/portfolio-lead-backup','gerasimov'],['/usr/local/sbin/portfolio-lead-replica','gerasimov','--verify']]){
 const result=spawnSync(cmd[0],cmd.slice(1),{encoding:'utf8',timeout:180000});if(result.status!==0)throw Error('verified_backup_required');
}
if(createHash('sha256').update(readFileSync(path)).digest('hex')!==createHash('sha256').update(before).digest('hex'))throw Error('source_still_receiving_writes');
const receipts=entries.map((entry,i)=>JSON.stringify({event_id:rows[i].envelope.id,ts:entry.ts,site:'pro-schools.ru',crm:{status:entry.crm?.status,id:entry.crm?.id??null},encrypted_in_operator_vault:true})).join('\n')+'\n';
writeFileSync(path+'.encrypted-migration',receipts,{mode:0o600});chownSync(path+'.encrypted-migration',metadata.uid,metadata.gid);chmodSync(path+'.encrypted-migration',0o600);renameSync(path+'.encrypted-migration',path);
console.log(JSON.stringify({migrated:entries.length,original_contacts_encrypted:true,pinned_s3_restore_verified:true,notifications_sent:0}));
