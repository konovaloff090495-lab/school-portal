#!/usr/bin/env python3
"""Read-only aggregate export/report. No contact, answer, token or journey hashes leave VPS."""
import argparse,datetime,json,pathlib,subprocess,sys
HERE=pathlib.Path(__file__).resolve().parent
EVENTS=['career_landing_view','career_cta_click','career_test_start','career_question_view','career_question_answered','career_test_complete','career_gate_view','career_result_saved','career_result_view','career_offer_view','career_offer_select','career_partner_request_saved','career_crm_delivered','career_crm_rejected','career_crm_uncertain','career_crm_configuration_error','career_feedback_easy','career_feedback_difficult']
REMOTE=r'''
import sqlite3,json,datetime
cfg=__CONFIG__
c=sqlite3.connect('file:/var/lib/proschools-career/career.sqlite3?mode=ro',uri=True);c.row_factory=sqlite3.Row
rows=lambda q,p=():[dict(r)for r in c.execute(q,p)]
tables={r[0]for r in c.execute("SELECT name FROM sqlite_master WHERE type='table'")}
a,b=cfg['date1'],cfg['date2'];paths=cfg['paths'];marks=','.join('?'for _ in paths)
out={'schema':'career-funnel-export-v2','checked_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'date1':a,'date2':b,'timezone':'Europe/Moscow','public_paths_count':len(paths),'tracking_v2_available':'funnel_counts'in tables,'retained_results':c.execute('SELECT count(*) FROM results').fetchone()[0],'retained_requests':rows('SELECT offer_id,status,count(*) AS count FROM requests GROUP BY offer_id,status'),'legacy_unclassified_events':rows('SELECT * FROM event_counts WHERE day>=? AND day<=? ORDER BY day,event,landing',(a,b)),'known_engineering_qa_before_cutover':3,'history_warning':'Retained result/request rows are not lifetime leads; deleted QA records cannot be reconstructed. Legacy event_counts do not distinguish QA/real.'}
safe_paths=set(paths)|{'/proforientaciya/karta-interesov/','/proforientaciya/rezultat/','/proforientaciya/unattributed/'}
legacy_grouped={}
for r in out['legacy_unclassified_events']:
 if r['landing']not in safe_paths:r['landing']='/proforientaciya/unattributed/'
 key=(r['day'],r['event'],r['landing'],r['offer_id'],r['grade'])
 if key in legacy_grouped:legacy_grouped[key]['count']+=r['count']
 else:legacy_grouped[key]=r
out['legacy_unclassified_events']=list(legacy_grouped.values())
if 'funnel_counts'in tables:
 out['tracking_meta']={r['key']:r['value']for r in rows('SELECT key,value FROM funnel_meta')}
 out['counts']=rows('SELECT * FROM funnel_counts WHERE day>=? AND day<=? AND count>0 ORDER BY day,event,cohort,landing,offer_id,step',(a,b))
 v2={}
 for r in out['counts']:
  key=(r['day'],r['event'],r['landing'],r['offer_id'],r['grade']);v2[key]=v2.get(key,0)+r['count']
 residual=[]
 for r in out['legacy_unclassified_events']:
  n=max(0,r['count']-v2.get((r['day'],r['event'],r['landing'],r['offer_id'],r['grade']),0))
  if n:residual.append({**r,'count':n})
 out['legacy_unclassified_events']=residual
 out['without_journey']=rows("SELECT event,cohort,is_test,count(*) AS events FROM funnel_events WHERE day>=? AND day<=? AND journey_hash='' GROUP BY event,cohort,is_test",(a,b))
 out['journey_totals']=rows("SELECT event,cohort,is_test,count(*) AS events,count(DISTINCT NULLIF(journey_hash,'')) AS journeys FROM funnel_events WHERE day>=? AND day<=? GROUP BY event,cohort,is_test",(a,b))
 # Cohort denominator: first measured public landing of this anonymous browser journey.
 cte="WITH ranked AS(SELECT journey_hash,occurred,day,landing,cohort,row_number()OVER(PARTITION BY journey_hash ORDER BY occurred,event_key) AS rn FROM funnel_events WHERE journey_hash<>'' AND event='career_landing_view' AND is_test=0 AND landing IN("+marks+")), entrants AS(SELECT * FROM ranked WHERE rn=1 AND day>=? AND day<=?) "
 params=paths+[a,b]
 out['eligible_entries']=rows(cte+'SELECT cohort,landing,count(*) AS journeys FROM entrants GROUP BY cohort,landing',params)
 join=" FROM entrants e JOIN funnel_events f ON f.journey_hash=e.journey_hash AND f.occurred>=e.occurred AND f.day<=? AND f.is_test=0 "
 out['eligible_stages']=rows(cte+'SELECT e.cohort,f.event,count(*) AS events,count(DISTINCT e.journey_hash) AS journeys'+join+'GROUP BY e.cohort,f.event',params+[b])
 out['eligible_partners']=rows(cte+"SELECT e.cohort,f.offer_id,f.event,count(*) AS events,count(DISTINCT e.journey_hash) AS journeys"+join+"WHERE f.offer_id<>'' GROUP BY e.cohort,f.offer_id,f.event",params+[b])
 out['offer_conversions']=rows(cte+", viewers AS(SELECT DISTINCT e.cohort,e.journey_hash,e.occurred,f.offer_id FROM entrants e JOIN funnel_events f ON f.journey_hash=e.journey_hash AND f.occurred>=e.occurred AND f.day<=? AND f.is_test=0 AND f.event='career_offer_view') SELECT v.cohort,v.offer_id,count(DISTINCT v.journey_hash) AS offer_view_journeys,count(DISTINCT CASE WHEN f.event='career_partner_request_saved' THEN v.journey_hash END) AS request_journeys,count(DISTINCT CASE WHEN f.event='career_crm_delivered' THEN v.journey_hash END) AS delivered_journeys FROM viewers v LEFT JOIN funnel_events f ON f.journey_hash=v.journey_hash AND f.offer_id=v.offer_id AND f.occurred>=v.occurred AND f.day<=? AND f.is_test=0 GROUP BY v.cohort,v.offer_id",params+[b,b])
 out['question_steps']=rows(cte+"SELECT e.cohort,f.step,count(DISTINCT CASE WHEN f.event='career_question_view' THEN e.journey_hash END) AS viewed_journeys,count(DISTINCT CASE WHEN f.event='career_question_answered' THEN e.journey_hash END) AS answered_journeys,count(DISTINCT CASE WHEN f.event='career_question_view' AND NOT EXISTS(SELECT 1 FROM funnel_events a WHERE a.journey_hash=f.journey_hash AND a.event='career_question_answered' AND a.step=f.step AND a.occurred>=e.occurred AND a.day<=? AND a.is_test=0) THEN e.journey_hash END) AS observed_without_answer"+join+"WHERE f.event IN('career_question_view','career_question_answered') GROUP BY e.cohort,f.step ORDER BY e.cohort,f.step",params+[b,b])
 out['completion_elapsed']=rows(cte+"SELECT e.cohort,f.elapsed_bucket,count(*) AS completions,count(DISTINCT e.journey_hash) AS journeys"+join+"WHERE f.event='career_test_complete' GROUP BY e.cohort,f.elapsed_bucket",params+[b])
 # All counts above are aggregates; never return event_key or journey_hash.
print(json.dumps(out,ensure_ascii=False))
'''
def snapshot(args):
 pages=json.loads((HERE.parents[3]/'content/career/pages.json').read_text());pages=pages['pages']if isinstance(pages,dict)else pages
 cfg={'date1':args.date1,'date2':args.date2,'paths':sorted(p['path']for p in pages if not p.get('noindex'))}
 code=REMOTE.replace('__CONFIG__',repr(cfg));command=['ssh','-B','en0','-i',str(pathlib.Path('~/.ssh/portfolio_security_20261024').expanduser()),'-o','ControlPath=/tmp/ps-career-20261106.sock','-o','ConnectTimeout=15','portfolio-admin@90.156.159.51','sudo python3 -']
 r=subprocess.run(command,input=code,text=True,capture_output=True,timeout=60)
 if r.returncode:raise RuntimeError('Read-only SSH export failed; exit '+str(r.returncode))
 data=json.loads(r.stdout);write(args.output,data);print('Aggregate snapshot:',args.output)
def write(path,data):
 p=pathlib.Path(path);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def ratio(n,d):return None if not d else round(100*n/d,2)
def summarize(data):
 if not data.get('tracking_v2_available'):return {'available':False,'reason':'Tracking v2 not activated at snapshot time; historical non-QA funnel is unknown, not zero.','legacy_unclassified_events':sum(r['count']for r in data.get('legacy_unclassified_events',[])),'known_pre_cutover_engineering_qa':data.get('known_engineering_qa_before_cutover',3)}
 rows=data.get('counts',[]);real=[r for r in rows if not r['is_test'] and r['cohort']!='qa'];qa=[r for r in rows if r['is_test']or r['cohort']=='qa'];stages=data.get('eligible_stages',[])
 out={'available':True,'tracking_meta':data.get('tracking_meta',{}),'counts_nonqa':{e:sum(r['count']for r in real if r['event']==e)for e in EVENTS},'counts_qa':{e:sum(r['count']for r in qa if r['event']==e)for e in EVENTS},'cohorts':{},'partners':[],'question_steps':data.get('question_steps',[]),'completion_elapsed':data.get('completion_elapsed',[])}
 cohorts=sorted(set(r['cohort']for r in data.get('eligible_entries',[]))|{'organic'})
 for cohort in cohorts:
  entries=sum(r['journeys']for r in data.get('eligible_entries',[])if r['cohort']==cohort)
  values={e:sum(r['journeys']for r in stages if r['cohort']==cohort and r['event']==e)for e in EVENTS}
  out['cohorts'][cohort]={'entry_journeys':entries,'stage_journeys':values,'unique_request_conversion_pct':ratio(values['career_partner_request_saved'],entries),'unique_delivered_conversion_pct':ratio(values['career_crm_delivered'],entries),'note':'Anonymous browser journeys, not Metrika people. Numerator intersects journeys with first measured eligible public entry in this window.'}
 for r in data.get('offer_conversions',[]):out['partners'].append({**r,'request_conversion_pct':ratio(r['request_journeys'],r['offer_view_journeys']),'delivered_conversion_pct':ratio(r['delivered_journeys'],r['offer_view_journeys'])})
 out['unlinked_request_events']=max(0,out['counts_nonqa']['career_partner_request_saved']-sum(r['events']for r in stages if r['event']=='career_partner_request_saved'));out['without_journey']=data.get('without_journey',[])
 n=out['counts_nonqa']['career_feedback_easy']+out['counts_nonqa']['career_feedback_difficult'];out['ux_pulse']={'responses':n,'easy':out['counts_nonqa']['career_feedback_easy'],'difficult':out['counts_nonqa']['career_feedback_difficult'],'easy_share_pct':ratio(out['counts_nonqa']['career_feedback_easy'],n),'interpretation':'Voluntary feedback; small or self-selected samples do not prove usability. Inspect step dropoff and elapsed buckets separately.'}
 return out
def report(args):
 data=json.loads(pathlib.Path(args.snapshot).read_text());summary=summarize(data);out=pathlib.Path(args.output);write(out.with_suffix('.json'),{'snapshot':args.snapshot,'period':[data['date1'],data['date2']],'summary':summary,'limits':['No sales, payments, revenue or deal status for any of the three partners. CRM delivered is not sale.','No PII/answer/token/journey hash in this report.','First-party journey is per tab/sessionStorage; different devices/new sessions can split a person.','Exact first-party cohort starts at v2 activation; legacy counts unclassified.','Facts expire after30days; durable event aggregates survive delete and retention.','Metrika visits/visitors are independent denominators; do not join them to journeys as if identities matched.','Question views without answers are observed missing next actions, not proof of difficulty; elapsed includes idle and reload time.']})
 text=['# ProSchools: измерение профориентационной воронки',f"Период: {data['date1']} — {data['date2']}; снимок {data['checked_at_utc']}.",'']
 if not summary['available']:text+=['Трекинг v2 на момент снимка ещё не включён. Историческая боевая воронка неизвестна; это не нулевые конверсии.',f"Старых неразмеченных просмотров: {summary['legacy_unclassified_events']}. Известно служебных CRM-лидов до нового учёта: {summary['known_pre_cutover_engineering_qa']}; удалены из текущей базы, в боевые показатели не входят."]
 else:
  text+=['Основная конверсия — доля отдельных анонимных прохождений с сохранённой заявкой среди прохождений, впервые вошедших на публичную страницу в этом периоде. Одна заявка каждому из трёх партнёров не превращается в300% конверсии.','', '| Когорта | Первых входов (journey) | С заявкой | CRM доставлена | Конверсия в заявку |','|---|---:|---:|---:|---:|']
  fmt=lambda x:'нет знаменателя'if x is None else str(x)+'%'
  for name,r in summary['cohorts'].items():text.append(f"| {name} | {r['entry_journeys']} | {r['stage_journeys']['career_partner_request_saved']} | {r['stage_journeys']['career_crm_delivered']} | {fmt(r['unique_request_conversion_pct'])} |")
  text+=['','## События, отдельно от уникальных прохождений','','| Этап | Боевые события | QA |','|---|---:|---:|']
  for e in EVENTS:text.append(f"| {e} | {summary['counts_nonqa'][e]} | {summary['counts_qa'][e]} |")
  text+=['','## Партнёры','','| Когорта | Предложение | Видели | С заявкой | Доставлено | Заявка / видели |','|---|---|---:|---:|---:|---:|']
  for r in summary['partners']:text.append(f"| {r['cohort']} | {r['offer_id']} | {r['offer_view_journeys']} | {r['request_journeys']} | {r['delivered_journeys']} | {fmt(r['request_conversion_pct'])} |")
  text+=['',f"Заявок без наблюдаемого входа в эту когорту: {summary['unlinked_request_events']}. Добровольных UX-оценок: {summary['ux_pulse']['responses']}; удобно: {summary['ux_pulse']['easy']}, трудности: {summary['ux_pulse']['difficult']}. Это самоотбор, а не доказательство удобства."]
 text+=['','## Ограничения','','CRM-доставка не является продажей. Продажи, оплаты и статусы сделок всех трёх партнёров не запрашиваются. Метрика считает визиты и посетителей; journey — отдельная техническая единица, не человек. Первые точные события начинаются с момента включения v2. Старые события до v2 не размечены QA/real; их остаток показан отдельно, без переноса в боевые показатели. Шаги без следующего действия и длительность используются как сигналы для проверки, без автоматического вывода об удобстве.']
 out.with_suffix('.md').write_text('\n'.join(text)+'\n');print('Report:',out.with_suffix('.md'))
def main():
 p=argparse.ArgumentParser();sp=p.add_subparsers(dest='command',required=True);q=sp.add_parser('snapshot');q.add_argument('--date1',default='2026-11-06');q.add_argument('--date2',default='2026-11-12');q.add_argument('--output',required=True);q.set_defaults(fn=snapshot);q=sp.add_parser('report');q.add_argument('--snapshot',required=True);q.add_argument('--output',required=True);q.set_defaults(fn=report);a=p.parse_args();a.fn(a)
if __name__=='__main__':main()
