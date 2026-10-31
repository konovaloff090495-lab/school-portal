# coding:utf-8
"""Import only venue coordinates published by Culture.ru, never a city centroid."""
import pathlib,os,json,re,urllib.request,datetime,concurrent.futures,argparse,time,fcntl
p=argparse.ArgumentParser();p.add_argument('--city');p.add_argument('--limit',type=int,default=10000);args=p.parse_args()
R=pathlib.Path(os.environ.get('AFISHA_ROOT',pathlib.Path(__file__).resolve().parents[3]));W=R/'work/afisha-production';W.mkdir(parents=True,exist_ok=True)
lock=open(W/'venue-geography.lock','a');fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
target=W/'venue-geography.json';cache=json.loads(target.read_text())if target.exists()else{}
events=json.loads((R/'outputs/ProSchools-afisha-national.json').read_text())['events'];venues={}
for e in events:
 i=e['venue'].get('institution')
 if i and i.get('name') and (not args.city or args.city in e['cities']):venues[str(i['_id'])]=i
seed=pathlib.Path(__file__).resolve().parent.parent/'seeds/verified-venue-locations.json'
for v in json.loads(seed.read_text())if seed.exists()else[]:
 if v.get('institution_id')and(not args.city or v['city']==args.city):venues[str(v['institution_id'])]={'name':v['institution_name']}
now=datetime.datetime.now(datetime.timezone.utc);todo=[]
for key,i in venues.items():
 old=cache.get(key,{})
 try:fresh=(now-datetime.datetime.fromisoformat(old['checked'])).days<(30 if old.get('coordinates')else 2)
 except (KeyError,ValueError):fresh=False
 if not fresh:todo.append((key,i))
todo=todo[:args.limit]
def get(url):
 req=urllib.request.Request(url,headers={'User-Agent':'ProSchools venue data verification/1.0'})
 return urllib.request.urlopen(req,timeout=20).read().decode()
if todo:
 def one(pair):
  time.sleep(.15);key,i=pair;url='https://www.culture.ru/institutes/'+key+'/'+i['name']
  try:
   v=json.loads(get('https://www.culture.ru/api-next/institutes/'+key));pt=(v.get('location')or{}).get('coordinates')
   if not isinstance(pt,list)or len(pt)!=2 or not all(isinstance(n,(int,float))for n in pt)or not(-180<=pt[0]<=180 and -90<=pt[1]<=90):return key,None
   return key,{'coordinates':pt,'address':v.get('address'),'title':v.get('title'),'source':url,'checked':now.isoformat()}
  except Exception:return key,None
 done=0
 with concurrent.futures.ThreadPoolExecutor(max_workers=4)as pool:
  for key,row in pool.map(one,todo):
   if row:cache[key]=row
   elif not cache.get(key,{}).get('coordinates'):cache[key]={'checked':now.isoformat(),'status':'not_resolved'}
   done+=1
   if done%20==0:
    tmp=target.with_suffix('.incoming');tmp.write_text(json.dumps(cache,ensure_ascii=False));tmp.replace(target)
   if done%100==0:print(json.dumps({'processed':done,'requested':len(todo),'located':sum(bool(v.get('coordinates'))for v in cache.values())}),flush=True)
 tmp=target.with_suffix('.incoming');tmp.write_text(json.dumps(cache,ensure_ascii=False));tmp.replace(target)
print(json.dumps({'requested':len(todo),'venues_with_coordinates':sum(bool(v.get('coordinates'))for v in cache.values())},ensure_ascii=False))
