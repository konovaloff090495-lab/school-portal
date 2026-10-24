import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
const actions=new Set(['enroll','confirm','unsubscribe','reserve-welcome']);let active=0;
/** Website writers can invoke bounded operations, never list or export subscribers. */
export async function mailer(cfg,site,action,input){
 if(!cfg.mailer||cfg.mailer.site!==site||!actions.has(action)||!input||typeof input!=='object'||Array.isArray(input))throw Error('mail_operation_not_allowed');
 if(cfg.mailer.ready_file&&!existsSync(cfg.mailer.ready_file))throw Error('mail_operation_not_ready');
 if(active>=2)throw Error('mail_operation_busy');active++;
 try{return await new Promise((resolve,reject)=>{
  const m=cfg.mailer,child=spawn('/usr/bin/python3',[m.script,action],{cwd:m.cwd,env:{PATH:'/usr/bin:/bin',NODE_ENV:'production',CRM_MAILER_DB:m.db,PII_FIELDS_KEY_PATH:m.field_key,CRM_MAILER_PAUSE_PATH:m.pause,PROSCHOOLS_SMTP_PASSWORD:m.smtp_password||''},stdio:['pipe','pipe','pipe']});
  let output='',bytes=0;const timeout=setTimeout(()=>child.kill('SIGKILL'),4000);
  child.stdout.on('data',b=>{output+=b;bytes+=b.length;if(bytes>32768)child.kill('SIGKILL')});child.stderr.on('data',b=>{bytes+=b.length;if(bytes>65536)child.kill('SIGKILL')});
  child.on('error',()=>{clearTimeout(timeout);reject(Error('mail_operation_failed'))});
  child.on('close',code=>{clearTimeout(timeout);if(code!==0)return reject(Error('mail_operation_failed'));try{
   const value=JSON.parse(output);if(typeof value.status!=='string')throw Error('invalid_receipt');const result={status:value.status};
   if(value.token!==undefined&&value.token!==null){if(!/^[A-Za-z0-9_-]{16,128}$/.test(value.token))throw Error('invalid_receipt');result.token=value.token}
   resolve(result);
  }catch{reject(Error('mail_operation_failed'))}});
  child.stdin.on('error',()=>{});child.stdin.end(JSON.stringify(input));
 })}finally{active--}
}
