"""Stream-compaction of the reproducible source cache, preserving a gzip snapshot."""
import os,pathlib,json,gzip,shutil,datetime
R=pathlib.Path(os.environ['AFISHA_ROOT']);p=R/'work/afisha-production/content-facts.json';backup=p.with_name('content-facts-before-calendar-trim.json.gz')
if not backup.exists():
 with p.open('rb')as src,gzip.open(backup,'wb',compresslevel=4)as dst:shutil.copyfileobj(src,dst,1024*1024)
now=datetime.datetime.now(datetime.timezone.utc).date();end=str(now+datetime.timedelta(days=370));start=str(now);decoder=json.JSONDecoder();incoming=p.with_suffix('.compacted-incoming');count=0;trimmed=0
with p.open()as src,incoming.open('w')as out:
 buffer='';pos=0
 def more():
  global buffer,pos
  buffer=buffer[pos:]+src.read(65536);pos=0
 def spaces():
  global pos
  while True:
   while pos<len(buffer)and buffer[pos].isspace():pos+=1
   if pos<len(buffer):return
   more()
 def char():
  global pos
  spaces();c=buffer[pos];pos+=1;return c
 def value():
  global pos
  while True:
   spaces()
   try:v,n=decoder.raw_decode(buffer,pos);pos=n;return v
   except json.JSONDecodeError:more()
 assert char()=='{';out.write('{');first=True
 while True:
  spaces()
  if buffer[pos]=='}':break
  if not first:assert char()==','
  key=value();assert char()==':';v=value();old=v.get('seances',[]);v['seances']=[{k:s.get(k)for k in ['startDate','endDate']}for s in old if(s.get('endDate')or s.get('startDate')or'')>=start and(s.get('startDate')or'')<end];trimmed+=len(old)-len(v['seances'])
  if len(old)>=1500:v['needsRefresh']=True
  if not first:out.write(',')
  out.write(json.dumps(key)+':'+json.dumps(v,ensure_ascii=False,separators=(',',':')));count+=1;first=False
 out.write('}')
incoming.replace(p);print(json.dumps({'records':count,'past_seances_removed':trimmed,'cache_bytes':p.stat().st_size}),flush=True)
