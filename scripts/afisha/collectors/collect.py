import os

import os
"""Public Culture.ru catalogue reader. No account, partner keys or private endpoints.
Caches only event/locale facts, not website runtime configuration. Three requests max.
"""
import urllib.request,urllib.parse,urllib.error,json,time,pathlib,concurrent.futures,datetime,threading,argparse
from bs4 import BeautifulSoup
W=pathlib.Path(os.environ.get('AFISHA_SCALE_WORK',str(pathlib.Path(__file__).resolve().parent)));C=W/'cache';C.mkdir(exist_ok=True)
BASE='https://www.culture.ru'; BUILD='JY25hBfzUpj7O-EnYYLQp'
lock=threading.Lock()
def log(*v):
 with lock:print(*v,flush=True)
def get(url):
 for attempt in range(3):
  try:
   time.sleep(.3)
   with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'ProSchools Catalogue Research/1.0','Accept':'application/json,text/html'}),timeout=35) as r:raw=r.read()
   if raw.lstrip().startswith(b'{'):return json.loads(raw)
   node=BeautifulSoup(raw,'html.parser').select_one('#__NEXT_DATA__')
   if not node:raise ValueError('No public catalogue data')
   return json.loads(node.string)
  except urllib.error.HTTPError as e:
   if e.code in (401,403,404):raise
   if attempt==2:raise
   time.sleep(2**attempt*2)
  except Exception:
   if attempt==2:raise
   time.sleep(2**attempt*2)
def norm(s):return s.lower().replace('ё','е').strip()
def resolve(city):
 f=C/('locale-'+city['name']+'.json')
 try:
  if f.exists():result=json.loads(f.read_text())
  else:
   j=get(BASE+'/api-next/locales?'+urllib.parse.urlencode({'query':city['name'].replace('ё','е').replace('Ё','Е')}))
   matches=[r for r in j.get('items',[]) if norm(r.get('title',''))==norm(city['name']) and r.get('sysName') not in ['moskva-i-podmoskove','krym-i-sevastopol']]
   matches=[r for r in matches if not r.get('sysName','').startswith(('doneckaya-','luganskaya-'))]
   if not matches and city.get('region')=='Московская область':
    matches=[r for r in j.get('items',[])if r.get('sysName','').startswith('moskovskaya-oblast-')and any(x in r.get('sysName','')for x in ['gorod','rayon','raion'])]
    matches.sort(key=lambda r:('gorodskoi'not in r.get('sysName',''),r.get('sysName','')))
    if matches:matches=[{**matches[0],'virtual':True}]
   if len(matches)!=1:raise ValueError('ambiguous/no exact city: '+str([(r['title'],r.get('sysName')) for r in j.get('items',[])]))
   result=matches[0];f.write_text(json.dumps(result,ensure_ascii=False))
  return {**city,'culture_locale':result['sysName'],'culture_locale_id':result['_id'],'timezone':result.get('timezone'),'city_coords':result.get('location'),'source_scope':('district_requires_exact_city_address' if result.get('virtual') else result.get('_proschools_scope','exact_city'))}
 except Exception as e:return {**city,'error':str(e)}
def page(city,n):
 slug=city['culture_locale'];f=C/(slug+'-'+str(n)+'.json')
 if f.exists() and time.time()-f.stat().st_mtime<6*3600:return json.loads(f.read_text())
 url=BASE+f'/frontend-next/_next/data/{BUILD}/afisha/{slug}/tags-dlya-detei.json?'+urllib.parse.urlencode({'page':n,'locale':slug})
 try:j=get(url)
 except urllib.error.HTTPError as e:
  if e.code!=404:raise
  j=get(BASE+f'/afisha/{slug}/tags-dlya-detei?page={n}')
 p=j.get('pageProps',j.get('props',{}).get('pageProps',{}))
 if p.get('urlParams',{}).get('tags')!='dlya-detei':raise ValueError('Child filter not applied: '+str(p.get('urlParams')))
 e=p.get('events')
 if not isinstance(e,dict):raise ValueError('Missing events')
 result={'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source_url':BASE+f'/afisha/{slug}/tags-dlya-detei?page={n}','city':city['name'],'params':p['urlParams'],'events':e}
 tmp=f.with_suffix('.tmp');tmp.write_text(json.dumps(result,ensure_ascii=False));tmp.replace(f)
 return result
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--first-only',action='store_true');ap.add_argument('--max-pages',type=int,default=10000);args=ap.parse_args()
 cities=json.loads((W/'cities.json').read_text());log('Resolving cities',len(cities))
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:resolved=list(pool.map(resolve,cities))
 (W/'cities-resolved.json').write_text(json.dumps(resolved,ensure_ascii=False,indent=2));ok=[c for c in resolved if 'culture_locale' in c];log('Resolved',len(ok),'issues',[(c['name'],c['error']) for c in resolved if 'error' in c])
 failures=[]
 def safe(c,n):
  try:
   p=page(c,n);return (c,n,p)
  except Exception as e:failures.append({'city':c['name'],'page':n,'error':str(e)});log('ERROR',c['name'],n,str(e));return(c,n,None)
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
  first=list(pool.map(lambda c:safe(c,1),ok))
  for c,n,p in first:
   if p:log('CITY',c['name'],'published',p['events']['total'],'pages',p['events'].get('pagination'))
  tasks=[]
  if not args.first_only:
   for c,n,p in first:
    if p:
     total=p['events'].get('pagination',{}).get('total',1)
     for n in range(2,min(total,args.max_pages)+1):tasks.append((c,n))
   log('Remaining pages',len(tasks))
   for i,(c,n,p) in enumerate(pool.map(lambda cn:safe(*cn),tasks)):
    if i%30==0:log('PROGRESS',i+1,'/',len(tasks))
 (W/'run-result.json').write_text(json.dumps({'finished_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'failures':failures,'resolved':len(ok),'target':len(cities)},ensure_ascii=False,indent=2))
 log('COMPLETE','failures',len(failures))
 if failures:raise SystemExit(2)
