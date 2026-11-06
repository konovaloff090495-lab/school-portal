# -*- coding: utf-8 -*-
"""Scoped Yandex Metrika traffic, without persisting raw URLs or credentials."""
import argparse,ast,datetime,json,re,time,urllib.parse,urllib.request,urllib.error
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
BASE=ROOT.parent
OUT=ROOT/'work/career/monitoring/traffic'
COUNTER='108789843'
METRICS=['ym:s:visits','ym:s:users','ym:s:pageviews','ym:s:bounceRate','ym:s:avgVisitDurationSeconds','ym:s:pageDepth']
NAMES=['visits','visitors','pageviews','bounce_rate_pct','visit_duration_seconds','page_depth']

def token():
    tree=ast.parse((BASE/'yandex-direct/dashboard/fetch_proschools.py').read_text())
    for node in tree.body:
        if isinstance(node,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='METRIKA_TOKEN' for t in node.targets):
            value=ast.literal_eval(node.value)
            if isinstance(value,str) and value:return value
    raise RuntimeError('Existing read credential not available')

def api(params,secret):
    params={'ids':COUNTER,'accuracy':'full','limit':10000,**params}
    req=urllib.request.Request('https://api-metrika.yandex.net/stat/v1/data?'+urllib.parse.urlencode(params),headers={'Authorization':'OAuth '+secret})
    for attempt in range(2):
        try:
            with urllib.request.urlopen(req,timeout=45) as r:return json.load(r)
        except urllib.error.HTTPError as e:
            try:detail=json.loads(e.read()).get('errors',[{}])[0].get('message','')
            except Exception:detail=''
            raise RuntimeError('Metrika HTTP '+str(e.code)+' '+str(detail).replace(secret,'[redacted]')[:180])
        except (TimeoutError,urllib.error.URLError):
            if attempt:raise RuntimeError('Metrika network unavailable')
            time.sleep(.5)

def scopes():
    pages=json.loads((ROOT/'content/career/pages.json').read_text())
    if isinstance(pages,dict):pages=pages['pages']
    old=[p['path'] for p in pages if p['path'].startswith('/blog/')]
    new="ym:s:startURL=@'/proforientaciya/'"
    legacy='('+' OR '.join("ym:s:startURL=@'"+p+"'" for p in old)+')'
    test="ym:s:startURL=~'^https://pro-schools.ru/test/([?].*)?$'"

    return {'career_content':f'({new} OR {legacy})','new_content':new,'existing_articles':legacy,'legacy_test_control':test}

def collect(date1,date2,label):
    secret=token();report={'source':'Yandex Metrika','counter':COUNTER,'date1':date1,'date2':date2,'timezone':'Europe/Moscow','collected_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'label':label,'groups':{},'notes':[
        'Visitors come from API totals; do not sum unique visitors across dates, landing pages or channels.',
        'Visits are scoped by entry URL; pageviews mean all pages viewed inside those scoped visits.',
        'Legacy /test/ is a separate control, not automatically credited to the new partner funnel.',
        'Private test/result pages intentionally do not load Metrika. Funnel stages are first-party.',
        'The launch day is partial; API success with no rows is zero, API failure is unavailable.'
    ]}
    for name,flt in scopes().items():
        group={}
        for channel in ['all','organic']:
            filters='('+flt+") AND NOT(ym:s:startURL=@'utm_source=qa_') AND NOT(ym:s:startURL=@'utm_source=integration_test')"
            if channel=='organic':filters+=" AND ym:s:lastTrafficSource=='organic'"
            try:
                result=api({'date1':date1,'date2':date2,'metrics':','.join(METRICS),'dimensions':'ym:s:date,ym:s:startURL,ym:s:lastTrafficSource,ym:s:lastSearchEngineRoot,ym:s:deviceCategory','filters':filters},secret)
                rows=[]
                for item in result.get('data',[]):
                    d=item['dimensions'];url=d[1].get('name','')
                    rows.append({'date':d[0].get('name'),'landing_path':urllib.parse.urlsplit(url).path,'traffic_source':d[2].get('id') or d[2].get('name'),'search_engine':d[3].get('name'),'device':d[4].get('id') or d[4].get('name'),**dict(zip(NAMES,item['metrics']))})
                group[channel]={'available':True,'totals':dict(zip(NAMES,result.get('totals',[0]*len(NAMES)))),'rows':rows,'total_rows':result.get('total_rows'),'truncated':result.get('total_rows',0)>len(rows),'sampled':result.get('sampled',False),'sample_share':result.get('sample_share'),'data_source':'live_api'}
            except Exception as e:group[channel]={'available':False,'totals':None,'reason':str(e)}
        report['groups'][name]=group
    try:
        control=api({'date1':date1,'date2':date2,'metrics':'ym:s:visits,ym:s:users'},secret)
        report['counter_control']={'available':True,'visits':control['totals'][0],'visitors':control['totals'][1]}
    except Exception as e:report['counter_control']={'available':False,'reason':str(e)}
    OUT.mkdir(parents=True,exist_ok=True)
    f=OUT/f'{label}-{date1}-{date2}.json';f.write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print(json.dumps({'file':str(f),'groups':{k:{c:{'available':v[c]['available'],'totals':v[c].get('totals')}for c in v}for k,v in report['groups'].items()},'counter_control':report['counter_control']},ensure_ascii=False))
    return report

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--date1',required=True);p.add_argument('--date2',required=True);p.add_argument('--label',default='snapshot');args=p.parse_args();collect(args.date1,args.date2,args.label)
