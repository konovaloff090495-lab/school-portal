# coding:utf-8
"""Fallback to the event's own published place, including branch venues."""
import pathlib,os,json,urllib.request,re,datetime,concurrent.futures,time,fcntl
R=pathlib.Path(os.environ['AFISHA_ROOT']);W=R/'work/afisha-production';target=W/'event-venue-geography.json';lock=open(W/'event-venue-geography.lock','a');fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
cache=json.loads(target.read_text())if target.exists()else{};inst=json.loads((W/'venue-geography.json').read_text())if(W/'venue-geography.json').exists()else{};j=json.loads((R/'outputs/ProSchools-afisha-national.json').read_text());now=datetime.datetime.now(datetime.timezone.utc)
def norm(v):return re.sub('[^а-я0-9]','',(v or'').lower().replace('ё','е'))
todo={}
for e in j['events']:
 v=e['venue'];key=str(v['source_id']);g=inst.get(str((v.get('institution')or{}).get('_id')),{});old=cache.get(key,{})
 if key.startswith('/')or(g.get('coordinates')and norm(g.get('address'))==norm(v.get('address'))):continue
 if old.get('coordinates')and (now-datetime.datetime.fromisoformat(old['checked'])).days<30:continue
 source=next((s for s in e['source_records']if 'culture.ru/events/'in s['url']),None)
 if source:todo[key]=(v,source)
def one(pair):
 key,(v,source)=pair;time.sleep(.15)
 try:
  u='https://www.culture.ru/api-next/events/'+str(source['id']);req=urllib.request.Request(u,headers={'User-Agent':'ProSchools venue data verification/1.0'});j=json.load(urllib.request.urlopen(req,timeout=20));places=j.get('places')or[];place=next((p for p in places if str(p.get('_id'))==key),None)
  if not place:place=next((p for p in places if norm(p.get('address'))==norm(v.get('address'))and norm(p.get('title'))==norm(v.get('title'))),None)
  pt=(place.get('location')or{}).get('coordinates')if place else None
  if not pt or len(pt)!=2:return key,None
  return key,{'coordinates':pt,'address':place.get('address'),'title':place.get('title'),'source':source['url'],'metadata_source':u,'checked':now.isoformat(),'match':'published_event_place'}
 except Exception:return key,None
print(json.dumps({'requested':len(todo)}),flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=3)as pool:
 for i,(key,row)in enumerate(pool.map(one,todo.items()),1):
  if row:cache[key]=row
  if i%20==0:
   t=target.with_suffix('.incoming');t.write_text(json.dumps(cache,ensure_ascii=False));t.replace(target)
  if i%100==0:print(json.dumps({'processed':i,'requested':len(todo),'located':len(cache)}),flush=True)
t=target.with_suffix('.incoming');t.write_text(json.dumps(cache,ensure_ascii=False));t.replace(target)
print(json.dumps({'requested':len(todo),'venues_with_coordinates':len(cache)}),flush=True)
