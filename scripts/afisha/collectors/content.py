"""Refresh public programme facts with bounded memory and persistent checkpoints."""
import pathlib,sys,os,json,datetime,urllib.request,concurrent.futures,time,fcntl,argparse,sqlite3,subprocess
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parent.parent))
from content_facts import culture
R=pathlib.Path(os.environ['AFISHA_ROOT']);W=R/'work/afisha-production';W.mkdir(exist_ok=True);lock=open(W/'content.lock','w');fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
a=argparse.ArgumentParser();a.add_argument('--limit',type=int,default=100000);args=a.parse_args();
if(W/'content-facts.json').exists()and not(W/'content-facts.sqlite').exists():subprocess.run([sys.executable,str(pathlib.Path(__file__).resolve().parent.parent/'migrate-content-cache.py')],check=True)
db=sqlite3.connect(W/'content-facts.sqlite',timeout=30);db.execute('PRAGMA journal_mode=WAL');db.execute('PRAGMA cache_size=-4096');db.execute('CREATE TABLE IF NOT EXISTS facts(key TEXT PRIMARY KEY, content TEXT NOT NULL, checked TEXT NOT NULL)');db.commit();now=datetime.datetime.now(datetime.timezone.utc);national=json.loads((R/'outputs/ProSchools-afisha-national.json').read_text());tasks={}
for e in national['events']:
 for s in e['source_records']:
  if 'culture.ru/events/'not in s['url']:continue
  key=str(s['id'])+'|'+str(e['venue']['source_id']);row=db.execute('SELECT content,checked FROM facts WHERE key=?',(key,)).fetchone();fresh=False
  if row:
   try:fresh=not json.loads(row[0]).get('needsRefresh')and(now-datetime.datetime.fromisoformat(row[1])).total_seconds()<48*3600
   except Exception:pass
  if not fresh:tasks[key]=(s,e['venue']['source_id'])
del national
import gc;gc.collect()
def one(pair):
 key,(s,v)=pair;time.sleep(.2)
 for attempt in range(2):
  try:
   req=urllib.request.Request('https://www.culture.ru/api-next/events/'+str(s['id']),headers={'User-Agent':'ProSchools public programme verification/1.0'});j=json.load(urllib.request.urlopen(req,timeout=18));return key,culture(j,v,s['url'],now.isoformat())
  except Exception:
   if attempt:return key,None
   time.sleep(1)
errors=0;tasks=list(tasks.items())[:args.limit];print(json.dumps({'requested':len(tasks),'cached':db.execute('SELECT count(*) FROM facts').fetchone()[0]}),flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=3)as pool:
 i=0
 for offset in range(0,len(tasks),25):
  for key,row in pool.map(one,tasks[offset:offset+25]):
   i+=1
   if row:db.execute('INSERT OR REPLACE INTO facts VALUES(?,?,?)',(key,json.dumps(row,ensure_ascii=False,separators=(',',':')),row['contentChecked']))
   else:errors+=1
  db.commit()
  if i%100==0:print(json.dumps({'processed':i,'requested':len(tasks),'errors':errors,'cached':db.execute('SELECT count(*) FROM facts').fetchone()[0]}),flush=True)
db.execute('PRAGMA wal_checkpoint(TRUNCATE)');print(json.dumps({'done':True,'requested':len(tasks),'cached':db.execute('SELECT count(*) FROM facts').fetchone()[0],'errors':errors}),flush=True);db.close()
