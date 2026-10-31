import os,gzip
import os
import requests,re,json,pathlib
W=pathlib.Path(os.environ['AFISHA_ROOT'])/'work/excursion-donors';W.mkdir(parents=True,exist_ok=True)
import os,time
config=json.loads(os.environ['TRIPSTER_PUBLIC_CONFIG'])
s=requests.Session();s.headers['User-Agent']='ProSchools-source-research/1.0'
r=s.post('https://experience.tripster.ru/api/auth/obtain_token/partner/',json=config,timeout=25)
print('Public documented partner access:',r.status_code)
if r.status_code!=200:raise SystemExit(1)
token=r.json().get('token') or r.json().get('access');assert token
s.headers['Authorization']='Token '+token
u='https://experience.tripster.ru/api/partners/'+config['partner']+'/search/experiences/'

from concurrent.futures import ThreadPoolExecutor
allitems={}
for tag in ['dlya-detej','master-klassy-dlya-detej','kvesty-dlya-detej']:
 params={'city__slug':'Moscow','tag__slugs':tag,'detailed':'true','need_upcoming_events':'true','per_page':100}
 page=1
 while True:
  params['page']=page;r=s.get(u,params=params,timeout=45);r.raise_for_status();j=r.json()
  for e in j['results']:
   if e.get('status')=='active' and e.get('is_visible'):allitems[e['id']]=e
  print(tag,'page',page,'source total',j['count'],flush=True)
  if not j.get('next'):break
  page+=1
(W/'tripster-catalog.json').write_text(json.dumps(list(allitems.values()),ensure_ascii=False))
S=W/'tripster-schedules';S.mkdir(exist_ok=True)
def schedule(e):
 p=S/(str(e['id'])+'.json')
 gz=p.with_suffix('.json.gz')
 if gz.exists() and time.time()-gz.stat().st_mtime<47*3600:return True
 if p.exists() and time.time()-p.stat().st_mtime<47*3600:return True
 url='https://experience.tripster.ru/api/partners/'+config['partner']+'/experiences/'+str(e['id'])+'/schedule/'
 try:
  r=s.get(url,timeout=25)
  if r.status_code==200:
   gz.write_bytes(gzip.compress(json.dumps(r.json(),ensure_ascii=False).encode(),mtime=0));p.unlink(missing_ok=True);return True
  return False
 except requests.RequestException:return False
with ThreadPoolExecutor(max_workers=2)as pool:
 results=list(pool.map(schedule,allitems.values()))
print('Collected',len(allitems),'products;',sum(results),'schedules',flush=True)
