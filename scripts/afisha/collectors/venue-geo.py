# coding:utf-8
"""Import only venue coordinates published by Culture.ru, never a city centroid."""
import pathlib,os,json,re,urllib.request,datetime,concurrent.futures,argparse
p=argparse.ArgumentParser();p.add_argument('--city');p.add_argument('--limit',type=int,default=500);args=p.parse_args()
R=pathlib.Path(os.environ.get('AFISHA_ROOT',pathlib.Path(__file__).resolve().parents[3]));W=R/'work/afisha-production';W.mkdir(parents=True,exist_ok=True)
target=W/'venue-geography.json';cache=json.loads(target.read_text())if target.exists()else{}
events=json.loads((R/'outputs/ProSchools-afisha-national.json').read_text())['events'];venues={}
for e in events:
 i=e['venue'].get('institution')
 if i and i.get('name') and (not args.city or args.city in e['cities']):venues[str(i['_id'])]=i
now=datetime.datetime.now(datetime.timezone.utc);todo=[]
for key,i in venues.items():
 old=cache.get(key,{})
 try:fresh=(now-datetime.datetime.fromisoformat(old['checked'])).days<30
 except (KeyError,ValueError):fresh=False
 if not fresh:todo.append((key,i))
todo=todo[:args.limit]
def get(url):
 req=urllib.request.Request(url,headers={'User-Agent':'ProSchools venue data verification/1.0'})
 return urllib.request.urlopen(req,timeout=20).read().decode()
if todo:
 key,i=todo[0];page=get('https://www.culture.ru/institutes/'+key+'/'+i['name']);m=re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>',page,re.S);j=json.loads(m[1]);build=j['buildId']
 def one(pair):
  key,i=pair;url='https://www.culture.ru/institutes/'+key+'/'+i['name']
  try:
   j=json.loads(get('https://www.culture.ru/frontend-next/_next/data/'+build+'/institutes/'+key+'/'+i['name']+'.json'));v=j['pageProps']['institute'];pt=(v.get('location')or{}).get('coordinates')
   if not isinstance(pt,list)or len(pt)!=2 or not all(isinstance(n,(int,float))for n in pt)or not(-180<=pt[0]<=180 and -90<=pt[1]<=90):return key,None
   return key,{'coordinates':pt,'address':v.get('address'),'title':v.get('title'),'source':url,'checked':now.isoformat()}
  except Exception:return key,None
 with concurrent.futures.ThreadPoolExecutor(max_workers=4)as pool:
  for key,row in pool.map(one,todo):
   if row:cache[key]=row
 tmp=target.with_suffix('.incoming');tmp.write_text(json.dumps(cache,ensure_ascii=False));tmp.replace(target)
print(json.dumps({'requested':len(todo),'venues_with_coordinates':len(cache)},ensure_ascii=False))
