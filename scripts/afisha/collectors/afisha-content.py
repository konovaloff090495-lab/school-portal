"""Public main-event description and declared duration, excluding recommendations."""
import pathlib,sys,os,json,datetime,urllib.request,concurrent.futures,time,fcntl,re,subprocess
from bs4 import BeautifulSoup
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parent.parent))
from content_facts import extract,excerpt,plain
R=pathlib.Path(os.environ['AFISHA_ROOT']);W=R/'work/afisha-production';lock=open(W/'afisha-content.lock','w');fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB);target=W/'afisha-content-facts.json';cache=json.loads(target.read_text())if target.exists()else{};now=datetime.datetime.now(datetime.timezone.utc);national=json.loads((R/'outputs/ProSchools-afisha-national.json').read_text());tasks={}
for e in national['events']:
 for s in e['source_records']:
  if 'www.afisha.ru/'not in s['url']:continue
  key=str(s['id']);old=cache.get(key,{})
  try:fresh=(now-datetime.datetime.fromisoformat(old['contentChecked'])).total_seconds()<48*3600
  except Exception:fresh=False
  if not fresh:tasks[key]=s

def one(pair):
 key,s=pair;time.sleep(.25)
 try:
  raw=subprocess.run(['curl','--fail','--location','--silent','--show-error','--max-time','25','--connect-timeout','8','--max-filesize','8000000','--user-agent','ProSchools public programme verification/1.0',s['url']],capture_output=True,timeout=30,check=True).stdout;soup=BeautifulSoup(raw,'html.parser');node=next((x.string for x in soup.select('script')if x.string and x.string.strip().startswith('(window.__nrp')),None)
  if not node:return key,None
  model=json.JSONDecoder().raw_decode(node.split("['root'] = ",1)[1])[0]['model'];main=next((v for k,v in model.items()if k in ['PerformanceInfo','ConcertInfo','MovieInfo','EventInfo','ExhibitionInfo','QuestInfo','ShowInfo']and isinstance(v,dict)),None)
  if not main:return key,None
  text=plain(main.get('Description'));row={**extract(text),'about':excerpt(text),'contentSource':s['url'],'contentChecked':now.isoformat()};duration=plain(main.get('Duration'))
  if duration:
   row['duration']=duration[:180];h=re.search(r'(\d+)\s*час',duration);m=re.search(r'(\d+)\s*мин',duration);minutes=(int(h[1])*60 if h else 0)+(int(m[1])if m else 0)
   if 0<minutes<=480:row['durationMinutes']=minutes
  age=re.search(r'^(\d+)\+',str(main.get('AgeRestriction')or''))
  if age:row['sourceAgeRestriction']=int(age[1])
  return key,row
 except Exception:return key,None

def save():
 p=target.with_suffix('.incoming');p.write_text(json.dumps(cache,ensure_ascii=False,separators=(',',':')));p.replace(target)
print(json.dumps({'requested':len(tasks)}),flush=True);errors=0
tasks=list(tasks.items())
with concurrent.futures.ThreadPoolExecutor(max_workers=3)as pool:
 i=0
 for offset in range(0,len(tasks),25):
  for key,row in pool.map(one,tasks[offset:offset+25]):
   i+=1
   if row:cache[key]=row
   else:errors+=1
  save();print(json.dumps({'processed':i,'requested':len(tasks),'errors':errors}),flush=True)
save();print(json.dumps({'done':True,'cached':len(cache),'errors':errors}),flush=True)
