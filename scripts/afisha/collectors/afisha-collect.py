import os

import os
# -*- coding: utf-8 -*-
import json,pathlib,urllib.request,time,datetime,concurrent.futures,urllib.error
from bs4 import BeautifulSoup
W=pathlib.Path(os.environ.get('AFISHA_SCALE_WORK',str(pathlib.Path(__file__).resolve().parent)));C=W/'afisha-cache';C.mkdir(exist_ok=True)
def model(raw):
 soup=BeautifulSoup(raw,'html.parser');node=next((x.string for x in soup.select('script')if x.string and x.string.strip().startswith('(window.__nrp')),None)
 if not node:raise ValueError('Public catalogue model absent')
 data=json.JSONDecoder().raw_decode(node.split("['root'] = ",1)[1])[0]['model'];return data
selector=json.loads((W/'afisha-selector.json').read_text());allcities=selector['MainCities']+sum([g['Cities']for g in selector['OnLetterNamedCityGroups']],[])
def norm(s):return s.lower().replace('ё','е').replace('-',' ')
mapcity={norm(c['Name']):c for c in allcities};cities=json.loads((W/'cities.json').read_text());mapped=[];errors=[]
for c in cities:
 r=mapcity.get(norm(c['name']))
 if r:mapped.append({'name':c['name'],'slug':r['Url'].strip('/').split('/')[0],'id':r['ID']})
 else:errors.append({'city':c['name'],'reason':'not_in_city_selector'})
(W/'afisha-city-map.json').write_text(json.dumps(mapped,ensure_ascii=False,indent=2))
def fetch(city,n):
 file=C/(city['slug']+'-'+str(n)+'.json')
 if file.exists() and time.time()-file.stat().st_mtime<6*3600:
  cached=json.loads(file.read_text())
  if cached.get('media_version')==1:return cached
 u='https://www.afisha.ru/'+city['slug']+'/events/kids/'+('page'+str(n)+'/'if n>1 else '')
 for attempt in range(2):
  try:
   time.sleep(.35)
   raw=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'ProSchools Catalogue Research/1.0'}),timeout=30).read();m=model(raw);sw=m['ScheduleWidget']
   current=m.get('Context',{}).get('CurrentCity',{});items=[]
   for e in sw['Items']:
    item={k:e.get(k)for k in ['ID','Name','Url','Type','Notice','Genres','ScheduleInfo','IsItemFromAnotherCity','DisplayType','Image16x9','Image1x1']}
    items.append(item)
   result={'media_version':1,'city':city['name'],'city_slug':city['slug'],'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source_url':u,'pager':sw.get('Pager'),'items':items,'current_city':{k:current.get(k)for k in ['ID','Name','Url']}}
   tmp=file.with_suffix('.tmp');tmp.write_text(json.dumps(result,ensure_ascii=False));tmp.replace(file);return result
  except urllib.error.HTTPError as e:
   if e.code in [401,403,404]or attempt==1:raise
  except Exception:
   if attempt==1:raise
  time.sleep(2)
def safe(c,n):
 try:return(c,n,fetch(c,n))
 except Exception as e:
  errors.append({'city':c['name'],'page':n,'reason':str(e)});print('ERROR',c['name'],n,str(e),flush=True);return(c,n,None)
print('CITIES',len(mapped),flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=3)as pool:
 first=list(pool.map(lambda c:safe(c,1),mapped));tasks=[]
 for c,n,p in first:
  if p:
   pager=p.get('pager')or{};print('CITY',c['name'],pager.get('ItemsCount'),flush=True)
   for n in range(2,pager.get('PagesCount',1)+1):tasks.append((c,n))
 print('ADDITIONAL PAGES',len(tasks),flush=True)
 for i,r in enumerate(pool.map(lambda cn:safe(*cn),tasks)):
  if i%30==0:print('PROGRESS',i+1,'/',len(tasks),flush=True)
(W/'afisha-run.json').write_text(json.dumps({'errors':errors,'target':len(cities),'mapped':len(mapped),'finished_at':datetime.datetime.now(datetime.timezone.utc).isoformat()},ensure_ascii=False,indent=2));print('COMPLETE errors',len(errors),flush=True)
