import {readFileSync} from 'node:fs';import {spawnSync} from 'node:child_process';
import {randomBytes,scryptSync,createCipheriv,createDecipheriv,createHash} from 'node:crypto';
const operator=process.argv[2];if(!['gerasimov','konovalov'].includes(operator))throw Error('operator');
const master=readFileSync('/root/portfolio-backup.key','utf8').trim();
function derive(salt){return scryptSync(master,'portfolio-lead-recovery-v1:'+operator+':'+salt,32,{N:32768,r:8,p:1,maxmem:64*1024*1024})}
if(process.argv[3]==='--verify'){
 let raw='';for await(const part of process.stdin)raw+=part;const e=JSON.parse(raw);if(e.v!==1||e.operator!==operator)throw Error('wrong_operator');
 const decipher=createDecipheriv('aes-256-gcm',derive(e.salt),Buffer.from(e.iv,'base64'));decipher.setAAD(Buffer.from('portfolio-lead-recovery-v1\n'+operator+'\n'+e.created_at));decipher.setAuthTag(Buffer.from(e.tag,'base64'));
 const tar=Buffer.concat([decipher.update(Buffer.from(e.data,'base64')),decipher.final()]);if(createHash('sha256').update(tar).digest('hex')!==e.sha256)throw Error('wrong_digest');
 process.stdout.write(tar);
}else{
 const result=spawnSync('tar',['cf','-','-C','/etc/portfolio-leads',operator],{maxBuffer:1024*1024});if(result.status!==0)throw Error('archive_failed');
 const e={v:1,operator,created_at:new Date().toISOString(),salt:randomBytes(16).toString('base64'),iv:randomBytes(12).toString('base64'),sha256:createHash('sha256').update(result.stdout).digest('hex')};
 const cipher=createCipheriv('aes-256-gcm',derive(e.salt),Buffer.from(e.iv,'base64'));cipher.setAAD(Buffer.from('portfolio-lead-recovery-v1\n'+operator+'\n'+e.created_at));e.data=Buffer.concat([cipher.update(result.stdout),cipher.final()]).toString('base64');e.tag=cipher.getAuthTag().toString('base64');console.log(JSON.stringify(e));
}
