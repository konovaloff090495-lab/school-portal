#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Read-only Yandex URL statistics for the exact 69-page career scope."""
from common import *
import argparse,csv
parser=argparse.ArgumentParser();parser.add_argument('--as-of',default=dt.datetime.now(dt.timezone(dt.timedelta(hours=3))).date().isoformat());args=parser.parse_args();day=dt.date.fromisoformat(args.as_of);start=(day-dt.timedelta(days=7)).isoformat();end=(day-dt.timedelta(days=1)).isoformat();m=manifest();allowed={SITE+p for p in m['pages']+m['existing_blog_updates']};assert len(allowed)==69
filters=['/proforientaciya/']+m['existing_blog_updates'];rows={};requests=[];all_dates=[];stopped=False
for n,needle in enumerate(filters,1):
 offset=0
 while True:
  payload={'offset':offset,'limit':500,'device_type_indicator':'ALL','search_location':'WEB_LOCATION','text_indicator':'URL','filters':{'text_filters':[{'text_indicator':'URL','operation':'TEXT_CONTAINS','value':needle}]}}
  response=ywm('hosts/https:pro-schools.ru:443/query-analytics/list','POST',payload);requests.append({'filter':needle,'offset':offset,'http_status':response.get('status'),'retrieved_at':response['retrieved_at']});data=response.get('data')or{}
  if response.get('status')!=200:
   stopped=response.get('status')==429;break
  found=data.get('text_indicator_to_statistics',[])
  for item in found:
   raw=item.get('text_indicator',{}).get('value','');u=urllib.parse.urlsplit(raw if raw.startswith('http') else SITE+raw if raw.startswith('/') else 'https://'+raw)
   canonical=urllib.parse.urlunsplit(('https',u.netloc.removeprefix('www.'),u.path if u.path.endswith('/') else u.path+'/',u.query,''))
   if canonical not in allowed:continue
   stats=[{'date':x.get('date'),'field':x.get('field'),'value':x.get('value')} for x in item.get('statistics',[]) if x.get('field')in ['CLICKS','IMPRESSIONS','POSITION']]
   rows[canonical]=stats;all_dates.extend(x['date'] for x in stats if x.get('date'))
  if len(found)<500 or offset>=1000:break
  offset+=500
 if stopped:break
result=[]
for url in sorted(allowed):
 stats=[x for x in rows.get(url,[]) if x.get('date') and start<=x['date']<=end];clicks=[x['value']for x in stats if x['field']=='CLICKS'];impressions=[x['value']for x in stats if x['field']=='IMPRESSIONS'];c=sum(clicks)if clicks else None;i=sum(impressions)if impressions else None
 result.append({'url':url,'status':'reported'if stats else 'not_reported','clicks':c,'impressions':i,'ctr':c/i if i and c is not None else None,'dates':sorted({x['date']for x in stats})})
known=[r for r in result if r['status']=='reported'];clicks=sum(r['clicks']for r in known if r['clicks']is not None)if known else None;impressions=sum(r['impressions']for r in known if r['impressions']is not None)if known else None
summary={'source':'Yandex Webmaster query-analytics/list','retrieved_at':now(),'requested_window':{'start':start,'end':end},'scope_url_count':69,'source_window':'API returns latest two weeks; response dates are filtered locally, not replaced by the requested dates.','regions':'all; not fixed-region independent SERP positions','devices':'ALL','http_statuses':sorted(set(str(r['http_status'])for r in requests)),'api_available':bool(requests)and all(r['http_status']==200 for r in requests),'status':'available'if known else 'not_reported_scope'if requests and all(r['http_status']==200 for r in requests)else 'unavailable','reported_pages':len(known),'clicks':clicks,'impressions':impressions,'ctr':clicks/impressions if impressions and clicks is not None else None,'min_source_date':min(all_dates,default=None),'max_source_date':max(all_dates,default=None),'absent_rows_are_not_zero':True,'host_statistics_substituted':False,'requests':requests}
if all_dates and max(all_dates)<start:summary['status']='stale_source_dates'
save('yandex-ctr/'+args.as_of+'/summary.json',summary);save('yandex-ctr/'+args.as_of+'/pages.json',result);save('yandex-ctr/'+args.as_of+'/scoped-source-statistics.json',rows)
with (OUT/'yandex-ctr'/args.as_of/'pages.csv').open('w',encoding='utf-8-sig',newline='')as f:w=csv.DictWriter(f,fieldnames=result[0]);w.writeheader();w.writerows(result)
print(json.dumps(summary,ensure_ascii=False))
