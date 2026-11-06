#!/usr/bin/env python3
"""Career-only GSC and rank panel. No HTML edits, whole-project checks or top-ups."""
from common import *
import argparse,csv,re,subprocess
parser=argparse.ArgumentParser();parser.add_argument('--as-of',default=dt.datetime.now(dt.timezone(dt.timedelta(hours=3))).date().isoformat());parser.add_argument('--check-positions',action='store_true');parser.add_argument('--yandex-cloud',action='store_true');args=parser.parse_args();asof=dt.date.fromisoformat(args.as_of)
m=manifest();urls=[SITE+p for p in m['pages']+m['existing_blog_updates']];assert len(urls)==69 and len(set(urls))==69
start=(asof-dt.timedelta(days=7)).isoformat();end=(asof-dt.timedelta(days=1)).isoformat();prefix='gsc/'+args.as_of
report={'retrieved_at':now(),'as_of_moscow_date':args.as_of,'requested_window':{'start':start,'end':end},'url_count':len(urls),'site_property':'sc-domain:pro-schools.ru','search_type':'web','source_date_timezone':'America/Los_Angeles','data_state':'all','caveats':['GSC average position is impression-weighted, not independent fixed-region SERP rank.','GSC data may lag and suppress rare queries; an absent row is not a measured zero.','Publication date: 2026-11-06. The 2026-11-06 baseline requests a pre-publication window; later reports use their stated dates.']}
try:
 token=gscmod.access_token();site=urllib.parse.quote(report['site_property'],safe='');expression='^('+'|'.join(re.escape(u) for u in urls)+')$';assert len(expression)<4096
 def query(dimensions,label):
  body={'startDate':start,'endDate':end,'dimensions':dimensions,'rowLimit':25000,'dataState':'all','type':'web','dimensionFilterGroups':[{'groupType':'and','filters':[{'dimension':'page','operator':'includingRegex','expression':expression}]}]}
  response=None
  for attempt in range(3):
   response=gsc('sites/'+site+'/searchAnalytics/query',token,'POST',body)
   if response.get('status')==200 or response.get('status') in (400,401,403):break
   time.sleep(2)
  save(prefix+'/'+label+'-raw.json',response);return response
 pages=query(['page'],'pages');queries=query(['query','page'],'queries');daily=query(['date'],'daily')
 report['http_statuses']={'pages':pages.get('status'),'queries':queries.get('status'),'daily':daily.get('status')};report['metadata']={k:(v.get('data') or {}).get('metadata') for k,v in [('pages',pages),('queries',queries),('daily',daily)]}
 by={x['keys'][0]:x for x in (pages.get('data') or {}).get('rows',[])};page_rows=[]
 for u in urls:
  row=by.get(u);page_rows.append({'url':u,'status':'reported' if row else 'not_reported' if pages.get('status')==200 else 'unavailable','clicks':row.get('clicks') if row else None,'impressions':row.get('impressions') if row else None,'ctr':row.get('ctr') if row else None,'average_position':row.get('position') if row else None,'start':start,'end':end})
 dailyrows=(daily.get('data') or {}).get('rows',[]);report['last_returned_date']=max((x['keys'][0] for x in dailyrows),default=None);report['first_returned_date']=min((x['keys'][0] for x in dailyrows),default=None);report['pages_reported']=len(by);report['query_page_rows']=len((queries.get('data') or {}).get('rows',[]));report['status']='available' if all(x==200 for x in report['http_statuses'].values()) else 'partly_unavailable'
 for label,rows in [('pages',page_rows),('queries',[{'query':x['keys'][0],'url':x['keys'][1],'clicks':x['clicks'],'impressions':x['impressions'],'ctr':x['ctr'],'average_position':x['position']} for x in (queries.get('data') or {}).get('rows',[])]),('daily',[{'date':x['keys'][0],'clicks':x['clicks'],'impressions':x['impressions'],'ctr':x['ctr'],'average_position':x['position']} for x in dailyrows])]:
  save(prefix+'/'+label+'.json',rows)
  if rows:
   with (OUT/prefix/(label+'.csv')).open('w',encoding='utf-8-sig',newline='') as f:w=csv.DictWriter(f,fieldnames=rows[0]);w.writeheader();w.writerows(rows)
except Exception as e:report.update(status='unavailable',error=type(e).__name__)
save(prefix+'/report.json',report);print('GSC',report,flush=True)
subprocess.run([sys.executable,str(HERE/'yandex_ctr.py'),'--as-of',args.as_of],check=False)
cmd=[sys.executable,str(HERE/'positions.py'),'--date',args.as_of]
if args.check_positions:cmd.append('--check')
r=subprocess.run(cmd,check=False);report['topvisor_command_exit']=r.returncode
if args.yandex_cloud:
 r=subprocess.run([sys.executable,str(HERE/'yandex_positions.py'),'--date',args.as_of],check=False);report['yandex_cloud_command_exit']=r.returncode
 if args.check_positions:subprocess.run([sys.executable,str(HERE/'positions.py'),'--date',args.as_of],check=False)
save('refresh/'+args.as_of+'.json',report)
