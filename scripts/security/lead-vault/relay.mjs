import {readFile,readdir,rename} from 'node:fs/promises';
import {join} from 'node:path';
const cfg=JSON.parse(await readFile(process.argv[2],'utf8'));
const files=await readdir(cfg.spool).catch(()=>[]);
for(const suffix of ['.pending','.delivery'])for(const name of files.filter(n=>/^[0-9a-f-]{36}\.(pending|delivery)$/.test(n)&&n.endsWith(suffix)).slice(0,30)){
 try{
  const value=await readFile(join(cfg.spool,name),'utf8'),input=JSON.parse(value);
  if(!name.startsWith(input.id+'.')||value.length>160000)continue;
  const response=await fetch(cfg.endpoint+(suffix==='.pending'?'/ingest':'/delivery'),{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+cfg.ingest_token},body:value,signal:AbortSignal.timeout(3000)});
  const receipt=await response.json();
  if(response.ok&&receipt.stored&&(suffix!=='.pending'||receipt.id===input.id))await rename(join(cfg.spool,name),join(cfg.spool,name.replace(suffix,suffix==='.pending'?'.json':'.delivery.json')));
 }catch{console.log(JSON.stringify({event:'relay_pending',site:cfg.site}));break}
}
