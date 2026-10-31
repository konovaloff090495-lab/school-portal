import os

import os
# -*- coding: utf-8 -*-
import json,pathlib,os,urllib.request,urllib.error,time,datetime,concurrent.futures,re
from bs4 import BeautifulSoup
W=pathlib.Path(os.environ.get('AFISHA_SCALE_WORK',str(pathlib.Path(__file__).resolve().parent)));C=W/'afisha-details';C.mkdir(exist_ok=True);target=pathlib.Path(os.environ.get('AFISHA_OUTPUT',str(W.parent.parent/'outputs/ProSchools-afisha-national.json')));j=json.loads(target.read_text());urls=sorted({e['source_records'][0]['url']for e in j['events']if e['id'].startswith('ps-af-')});errors=[]
def fetch(u):
 id=u.rstrip('/').split('/')[-1];f=C/(id+'.json')
 if f.exists()and time.time()-f.stat().st_mtime<7*86400:return json.loads(f.read_text())
 try:
  time.sleep(.4);raw=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'ProSchools Catalogue Research/1.0'}),timeout=25).read();s=BeautifulSoup(raw,'html.parser');sc=next(x.string for x in s.select('script')if x.string and x.string.strip().startswith('(window.__nrp'));m=json.JSONDecoder().raw_decode(sc.split("['root'] = ",1)[1])[0]['model'];ages=[]
  for key in ['PerformanceInfo','ConcertInfo','ExhibitionInfo','EventInfo','SportInfo','ExcursionInfo']:
   v=m.get(key)
   if isinstance(v,dict)and v.get('AgeRestriction')is not None:ages.append(v['AgeRestriction'])
  values=[]
  for a in ages:
   match=re.search(r'\d+',str(a))
   if match:values.append(int(match.group()))
  result={'url':u,'age_restriction':max(values)if values else None,'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat()};f.write_text(json.dumps(result,ensure_ascii=False));return result
 except Exception as e:errors.append({'url':u,'error':str(e)});return None
print('URLS',len(urls),flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=3)as pool:
 results=[]
 for i,r in enumerate(pool.map(fetch,urls)):
  if r:results.append(r)
  if i%100==0:print('AGE',i+1,'/',len(urls),flush=True)
byurl={r['url']:r for r in results};removed=[];verified=0
for e in j['events']:
 if not e['id'].startswith('ps-af-'):continue
 r=byurl.get(e['source_records'][0]['url'])
 if r and r['age_restriction']is not None:
  e['age_restriction']=r['age_restriction'];e['age_source_checked_at']=r['checked_at'];e['editorial_status']='source_facts_imported';verified+=1
  if r['age_restriction']>=18:removed.append(e['id'])
j['events']=[e for e in j['events']if e['id']not in removed]
for c in j['coverage']:
 es=[e for e in j['events']if c['name']in e['cities']];c['unique_events']=len(es)
 from collections import Counter
 c['categories']=dict(Counter(e['category']for e in es))
j['counts'].update({'unique_events':len(j['events']),'city_event_listings':sum(c['unique_events']for c in j['coverage']),'afisha_age_verified':verified-len(removed),'afisha_adult_excluded':len(removed),'afisha_age_unknown':sum(e['id'].startswith('ps-af-')and e['age_restriction']is None for e in j['events'])});j['counts']['cities_with_events']=sum(c['unique_events']>0for c in j['coverage']);j['counts']['confirmed_future_sessions']=sum(len(e['sessions'])for e in j['events'])
tmp=target.with_suffix('.tmp');tmp.write_text(json.dumps(j,ensure_ascii=False,separators=(',',':')));tmp.replace(target);(W/'afisha-age-run.json').write_text(json.dumps({'checked':len(results),'errors':errors,'verified_records':verified,'adult_removed':len(removed)},ensure_ascii=False,indent=2));print('COMPLETE',verified,'adults excluded',len(removed),'errors',len(errors),flush=True)
