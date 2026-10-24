import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
const allowed=new Set(['create','public','get','admin-list','rate','image','confirm','resend','resubmit','feedback','moderate','moderation-note','subscribe','unsubscribe','telegram-secret','telegram-update','telegram-run']);let active=0;
export async function school(cfg,site,action,input,internal=false){
 if(!cfg.school||site!==cfg.school.site||!(allowed.has(action)||(internal&&action==='admin-get'))||!input||typeof input!=='object'||Array.isArray(input))throw Error('school_operation_not_allowed');
 if(cfg.school.ready_file&&!existsSync(cfg.school.ready_file))throw Error('school_not_ready');
 if(active>=2)throw Error('school_busy');active++;
 try{return await new Promise((resolve,reject)=>{
  const m=cfg.school,child=spawn('/usr/bin/python3',[m.script,action],{cwd:m.cwd,env:{PATH:'/usr/bin:/bin',NODE_ENV:'production',...m.env},stdio:['pipe','pipe','pipe']});
  let data='',size=0;const timer=setTimeout(()=>child.kill('SIGKILL'),action==='telegram-run'?90000:12000);
  child.stdout.on('data',b=>{data+=b;size+=b.length;if(size>8*1024*1024)child.kill('SIGKILL')});child.stderr.on('data',b=>{size+=b.length;if(size>9*1024*1024)child.kill('SIGKILL')});child.on('error',()=>{clearTimeout(timer);reject(Error('school_worker_unavailable'))});child.on('close',code=>{clearTimeout(timer);try{const value=JSON.parse(data);if(code!==0&&!value.error)throw Error('worker_failed');resolve(value)}catch{reject(Error('school_worker_failed'))}});child.stdin.on('error',()=>{});child.stdin.end(JSON.stringify(input));
 })}finally{active--}
}
