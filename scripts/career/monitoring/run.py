#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Sequential, aggregate-only weekly career report. Never collects partner sales."""
import argparse,datetime as dt,json,math,subprocess,sys
from pathlib import Path
from zoneinfo import ZoneInfo
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
OUT=ROOT/'work/career/monitoring'
BASELINE_DATE='2026-11-06'

def load(path):
 try:return json.loads(Path(path).read_text())
 except (OSError,ValueError):return None

def write(path,value):
 path=Path(path);path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')

def number(value):
 return value if isinstance(value,(int,float)) and not isinstance(value,bool) and math.isfinite(value) else None

def fmt(value,percent=False):
 if value is None:return 'нет данных'
 if isinstance(value,(int,float)):return (f'{value:.2f}%' if percent else str(round(value,2)).removesuffix('.0'))
 return str(value)

def execute(label,command,jobs):
 start=dt.datetime.now(dt.timezone.utc);print('Collecting '+label+'…',flush=True)
 try:
  result=subprocess.run(command,cwd=ROOT,text=True,capture_output=True,timeout=900)
  job={'name':label,'status':'ok' if result.returncode==0 else 'failed','returncode':result.returncode,'started_at_utc':start.isoformat(),'finished_at_utc':dt.datetime.now(dt.timezone.utc).isoformat()}
 except subprocess.TimeoutExpired:job={'name':label,'status':'timeout','started_at_utc':start.isoformat(),'finished_at_utc':dt.datetime.now(dt.timezone.utc).isoformat()}
 except OSError:job={'name':label,'status':'unavailable','started_at_utc':start.isoformat(),'finished_at_utc':dt.datetime.now(dt.timezone.utc).isoformat()}
 # No arbitrary child stdout/stderr enters the report: only known aggregate files
 # are parsed below. This avoids accidentally persisting diagnostics with PII.
 jobs.append(job);print(label+': '+job['status'],flush=True);return job['status']=='ok'

def traffic_report(date1,date2,label):
 expected=OUT/'traffic'/f'{label}-{date1}-{date2}.json'
 if expected.exists():return load(expected),expected
 for p in sorted((OUT/'traffic').glob('*.json')):
  value=load(p)
  if value and value.get('date1')==date1 and value.get('date2')==date2:return value,p
 return None,None

def traffic_summary(data):
 if not data:return {'status':'unavailable','groups':None}
 out={'status':'available','source':'Yandex Metrika','timezone':data.get('timezone'),'collected_at':data.get('collected_at'),'groups':{}}
 for group in ['career_content','new_content','existing_articles','legacy_test_control']:
  source=data.get('groups',{}).get(group,{})
  out['groups'][group]={}
  for channel in ['all','organic']:
   row=source.get(channel,{})
   out['groups'][group][channel]={'status':'available' if row.get('available') else 'unavailable','totals':{key:number(row.get('totals',{}).get(key)) for key in ['visits','visitors','pageviews','bounce_rate_pct','visit_duration_seconds','page_depth']} if row.get('available') else None,'sampled':row.get('sampled'),'sample_share':number(row.get('sample_share')),'truncated':row.get('truncated')}
   if not row.get('available'):out['status']='partly_unavailable'
 return out

def activation_date(meta):
 value=(meta or {}).get('activated_at_utc')
 if value is None:return None
 try:
  stamp=dt.datetime.fromtimestamp(float(value)/1000,dt.timezone.utc) if str(value).isdigit() else dt.datetime.fromisoformat(str(value).replace('Z','+00:00'))
  if stamp.tzinfo is None:stamp=stamp.replace(tzinfo=dt.timezone.utc)
  return stamp.astimezone(ZoneInfo('Europe/Moscow')).date().isoformat()
 except (ValueError,TypeError,OverflowError):return None

def funnel_summary(report,date2):
 if not report:return {'status':'unavailable','metrics':None,'sales_in_scope':False}
 source=report.get('summary',{})
 if not source.get('available'):return {'status':'historical_tracking_unavailable','metrics':None,'legacy_unclassified_event_count':number(source.get('legacy_unclassified_events')),'sales_in_scope':False}
 meta={k:v for k,v in (source.get('tracking_meta')or{}).items() if k in ['activated_at_utc','schema_version','measurement_version','version']}
 activation=activation_date(meta)
 if activation and date2<activation:return {'status':'before_tracking_activation','activation_date_moscow':activation,'tracking_meta':meta,'metrics':None,'sales_in_scope':False}
 # Only the measurement module's aggregate whitelist is copied. No retained raw
 # records, contact, answer, access token, cookie or anonymous journey hash.
 metrics={key:source.get(key) for key in ['counts_nonqa','counts_qa','cohorts','partners','question_steps','completion_elapsed','ux_pulse','unlinked_request_events','without_journey']}
 return {'status':'available','activation_date_moscow':activation,'tracking_meta':meta,'metrics':metrics,'sales_in_scope':False}

def rank_summary(rows,engine):
 if rows is None:return {'status':'unavailable','engine':engine,'total_queries':None,'found':None,'not_found_within_depth':None,'unavailable':None}
 selected=[r for r in rows if engine!='Google' or r.get('engine')=='Google']
 return {'status':'available' if selected else 'not_reported','engine':engine,'total_queries':len(selected),'found':sum(r.get('status')=='found' for r in selected),'not_found_within_depth':sum(str(r.get('status','')).startswith('not_found_within_') for r in selected),'unavailable':sum(r.get('status') in ['unavailable','not_reported'] for r in selected),'depth':10 if engine=='Google' else 100,'region_key':225,'source':'Topvisor, desktop' if engine=='Google' else 'Yandex Cloud Search API RU, API default profile'}

def ratio(n,d):return round(100*n/d,2) if d and n<=d else None

def partner_totals(snapshot,date2):
 if not snapshot or not snapshot.get('tracking_v2_available') or 'counts'not in snapshot:return None
 activated=activation_date(snapshot.get('tracking_meta'))
 if activated and date2<activated:return None
 rows=[r for r in snapshot['counts']if not r.get('is_test')and r.get('cohort')!='qa']
 offers={}
 for offer in ['easycode-trial','ukids-diagnostic','synergy-school']:
  offers[offer]={name:sum(r.get('count',0)for r in rows if r.get('offer_id')==offer and r.get('event')==event)for name,event in [('applications_saved','career_partner_request_saved'),('crm_delivered','career_crm_delivered'),('crm_rejected','career_crm_rejected'),('crm_uncertain','career_crm_uncertain'),('crm_configuration_error','career_crm_configuration_error')]}
 return {'scope':'nonqa_server_events_in_period','independent_of_offer_views_and_entry_cohort':True,'per_partner':offers,'all_applications_saved':sum(x['applications_saved']for x in offers.values()),'all_crm_delivered':sum(x['crm_delivered']for x in offers.values())}

def make_report(asof,date1,date2,dest,jobs,aggregate_only,period_kind='weekly'):
 traffic,tpath=traffic_report(date1,date2,('weekly-'if period_kind=='weekly'else'current-day-')+asof)
 t=traffic_summary(traffic)
 seo=load(OUT/'seo'/f'summary-{asof}.json')
 gsc=load(OUT/'seo'/'gsc'/asof/'report.json')
 gsc_pages=load(OUT/'seo'/'gsc'/asof/'pages.json')
 if gsc and gsc.get('requested_window')!={'start':date1,'end':date2}:gsc=None;gsc_pages=None
 known=[r for r in (gsc_pages or []) if r.get('status')=='reported']
 clicks=sum(r['clicks'] for r in known) if known else None
 impressions=sum(r['impressions'] for r in known) if known else None
 g={'status':gsc.get('status') if gsc else 'unavailable','requested_window':gsc.get('requested_window') if gsc else None,'source_date_timezone':'America/Los_Angeles','last_returned_date':gsc.get('last_returned_date') if gsc else None,'metadata':gsc.get('metadata') if gsc else None,'reported_pages':len(known) if gsc_pages is not None else None,'scope_url_count':69,'clicks_returned_rows':clicks,'impressions_returned_rows':impressions,'ctr_pct_returned_rows':100*clicks/impressions if impressions else None,'absent_rows_are_not_zero':True}
 ranks={'google':rank_summary(load(OUT/'seo'/'topvisor'/asof/'positions.json'),'Google'),'yandex':rank_summary(load(OUT/'seo'/'yandex-cloud'/asof/'positions.json'),'Yandex')}
 funnel_file=dest/'funnel-report.json';funnel=load(funnel_file)
 if funnel is None and asof==BASELINE_DATE:funnel_file=HERE/'funnel/baseline-report.json';funnel=load(funnel_file)
 f=funnel_summary(funnel,date2)
 snapshot_meta=load(dest/'funnel-snapshot.json') or {}
 f['collected_at_utc']=snapshot_meta.get('checked_at_utc')
 f['nonqa_partner_totals']=partner_totals(snapshot_meta,date2)
 if f.get('metrics'):
  for row in (f['metrics'].get('cohorts')or{}).values():
   stage=row.get('stage_journeys')or{};entries=row.get('entry_journeys') or 0
   row['clickability']={'landing_cta_click_pct':ratio(stage.get('career_cta_click',0),entries),'landing_test_start_pct':ratio(stage.get('career_test_start',0),entries),'test_completion_pct':ratio(stage.get('career_test_complete',0),stage.get('career_test_start',0)),'gate_to_result_save_pct':ratio(stage.get('career_result_saved',0),stage.get('career_gate_view',0)),'result_to_offer_select_pct':ratio(stage.get('career_offer_select',0),stage.get('career_result_view',0))}
 yandex_ctr=load(OUT/'seo'/'yandex-ctr'/asof/'summary.json')
 if yandex_ctr and yandex_ctr.get('requested_window')!={'start':date1,'end':date2}:yandex_ctr=None
 report={'schema':'proschools-career-weekly-v1','as_of':asof,'generated_at_utc':dt.datetime.now(dt.timezone.utc).isoformat(),'run_timezone':'Europe/Moscow','period_kind':period_kind,'window':{'date1':date1,'date2':date2,'days':(dt.date.fromisoformat(date2)-dt.date.fromisoformat(date1)).days+1,'partial_current_day':period_kind!='weekly'},'scope':'applications_only','partner_sales_collected':False,'collection_mode':'aggregate_existing_only' if aggregate_only else 'sequential_live_reads','jobs':jobs,'traffic':t,'gsc':g,'yandex_webmaster_ctr':yandex_ctr or {'status':'unavailable','clicks':None,'impressions':None,'ctr':None,'host_statistics_substituted':False},'positions':ranks,'funnel':f,'indexing':seo.get('submission') if seo else None,'baseline':{'date':BASELINE_DATE,'prelaunch_window':['2026-10-30','2026-11-05'],'launch_day':'2026-11-06','launch_day_is_partial':True,'historical_first_party_funnel':'unknown before telemetry v2 activation, never zero-filled','seo_summary_path':str(OUT/'seo'/f'summary-{BASELINE_DATE}.json'),'funnel_baseline_path':str(HERE/'funnel/baseline-report.json')},'sources':{'traffic':str(tpath) if tpath else None,'seo_summary':str(OUT/'seo'/f'summary-{asof}.json'),'funnel_report':str(funnel_file)},'limits':[
 'All partner sales, deal statuses, payments and revenue are outside scope. No sales API or sales importer is run.',
 'Metrika visits/users cover 69 public URLs including 9 old articles. Funnel partner requests cover the new career flow only, excluding previous embedded LeadForm and old /test/. Never report their ratio as total site conversion.',
 'Metrika successful empty response can be a measured zero. Missing/failed data and a zero conversion denominator remain null.',
 'GSC dates use America/Los_Angeles; Metrika and funnel dates use Europe/Moscow. Recent GSC dates can be partial.',
 'GSC average position is not a fixed-query independent SERP position. Google Topvisor TOP10 and Yandex Cloud TOP100 are compared only within their own sources over time.',
 'Sitemap contents[].indexed is deprecated and is not an indexed URL count. IndexNow/sitemap acceptance is not proof of indexing.',
 'Launch day is partial. Precise funnel measurement starts at telemetry v2 activation, not midnight; legacy QA/real counts are unclassified.',
 'Question-step dropoff, elapsed buckets and voluntary UX feedback are signals for investigation, not causal proof of usability.'
 ]}
 text=['# ProSchools: недельный замер профориентации',f'Окно: {date1} — {date2}. Дата замера: {asof}.', 'Текущий неполный день показан отдельно и не включён в недельные коэффициенты.'if period_kind!='weekly'else'', '', 'Измеряем трафик, заявки и подтверждение передачи заявок. Продажи всех партнёров, сделки, оплаты и выручка не собираются.', '', '## Трафик Метрики', '', '| Группа | Канал | Визиты | Посетители | Просмотры внутри визитов |', '|---|---|---:|---:|---:|']
 groups=t.get('groups')or{}
 labels={'career_content':'Все 69 публичных страниц','new_content':'Новый раздел','existing_articles':'9 существующих статей','legacy_test_control':'Старый /test/: контроль'}
 for name,label in labels.items():
  for channel in ['all','organic']:
   values=groups.get(name,{}).get(channel,{}).get('totals')or{}
   text.append(f"| {label} | {'Все' if channel=='all' else 'Поиск'} | {fmt(values.get('visits'))} | {fmt(values.get('visitors'))} | {fmt(values.get('pageviews'))} |")
 text+=['','Посетителей разных групп и дней не суммируем. Просмотры — все страницы внутри визитов, начавшихся с выбранной посадочной; это не просмотры только одного раздела. Трафик включает 9 старых статей, а заявки ниже — только новый career-flow. Прежние LeadForm и старый /test/ в эти заявки не входят; общей конверсией всего трафика это не является.','','## Google Search Console','',f"Возвращено страниц со строками: {fmt(g['reported_pages'])}/69. Клики: {fmt(clicks)}; показы: {fmt(impressions)}; CTR по возвращённым строкам: {fmt(g['ctr_pct_returned_rows'],True)}.",f"Последняя возвращённая дата: {g['last_returned_date'] or 'нет данных'}. Метаданные неполных дат: {json.dumps(g['metadata'],ensure_ascii=False)}.",'GSC использует даты America/Los_Angeles. Нет строки — нет измеренного значения, а не 0. Последние дни могут быть неполными.','','## Позиции фиксированной панели','','| Источник | Глубина | Найдены | Не найдены в пределах глубины | Недоступны |','|---|---:|---:|---:|---:|']
 for key,label in [('google','Google · Топвизор · desktop'),('yandex','Яндекс · Cloud API')]:
  r=ranks[key];text.append(f"| {label} | {fmt(r.get('depth'))} | {fmt(r.get('found'))} | {fmt(r.get('not_found_within_depth'))} | {fmt(r.get('unavailable'))} |")
 text+=['','Панель 55 запросов, регион Россия 225. Глубина Google 10 и Яндекс 100 различается; сравниваем даты внутри одного источника. Не найден в ТОП‑10 не означает позицию 101 или отсутствие в индексе.','','## Яндекс: показы, клики и CTR','']
 if yandex_ctr and yandex_ctr.get('status')=='available':text+=[f"Вебмастер, точные 69 URL: клики {fmt(yandex_ctr.get('clicks'))}, показы {fmt(yandex_ctr.get('impressions'))}, CTR {fmt(100*yandex_ctr['ctr']if yandex_ctr.get('ctr')is not None else None,True)}. Даты источника: {yandex_ctr.get('min_source_date')} — {yandex_ctr.get('max_source_date')}."]
 else:text+=['Яндекс CTR для выбранного раздела пока недоступен: API не вернул строки периода или запрос не выполнен. Общая статистика хоста и Google вместо неё не подставляются.',f"Даты возвращённого источника: {(yandex_ctr or {}).get('min_source_date') or 'нет данных'} — {(yandex_ctr or {}).get('max_source_date') or 'нет данных'}."]
 text+=['','## Все боевые заявки по партнёрам','']
 totals=f.get('nonqa_partner_totals')
 if totals:
  text+=['Без требования наблюдаемого входа или показа предложения: это серверные события всех боевых заявок в периоде. QA исключён.','','| Партнёр | Заявки сохранены | Доставка подтверждена | Отклонено | Доставка неясна | Ошибка подключения |','|---|---:|---:|---:|---:|---:|']
  for offer,row in totals['per_partner'].items():text.append(f"| {offer} | {fmt(row['applications_saved'])} | {fmt(row['crm_delivered'])} | {fmt(row['crm_rejected'])} | {fmt(row['crm_uncertain'])} | {fmt(row['crm_configuration_error'])} |")
 else:text+=['Боевые серверные итоги за этот период не измерены; неизвестные исторические заявки не заменяются нулями.']
 text+=['','## Заявки и CJM по наблюдаемой когорте','']
 metrics=f.get('metrics')
 if f['status']!='available' or not metrics:text+=['Точная воронка недоступна для выбранного периода или ещё не была включена. Исторические заявки/конверсии не заменяем нулями.']
 else:
  text+=['| Когорта | Входы, journey | С заявкой | С подтверждённой доставкой | Конверсия в заявку |','|---|---:|---:|---:|---:|']
  for cohort,row in (metrics.get('cohorts')or{}).items():
   stages=row.get('stage_journeys')or{};text.append(f"| {cohort} | {fmt(row.get('entry_journeys'))} | {fmt(stages.get('career_partner_request_saved'))} | {fmt(stages.get('career_crm_delivered'))} | {fmt(row.get('unique_request_conversion_pct'),True)} |")
  text+=['','### Кликабельность и переходы','','| Когорта | CTA / вход | Старт / вход | Завершение / старт | Сохранение / форма | Выбор предложения / результат |','|---|---:|---:|---:|---:|---:|']
  for cohort,row in (metrics.get('cohorts')or{}).items():
   c=row.get('clickability')or{};text.append(f"| {cohort} | {fmt(c.get('landing_cta_click_pct'),True)} | {fmt(c.get('landing_test_start_pct'),True)} | {fmt(c.get('test_completion_pct'),True)} | {fmt(c.get('gate_to_result_save_pct'),True)} | {fmt(c.get('result_to_offer_select_pct'),True)} |")
  text+=['','Journey — анонимное прохождение в браузере, не человек и не посетитель Метрики. Нулевой знаменатель означает отсутствие коэффициента. Доставка в CRM не является продажей.','','| Партнёрское предложение | Когорта | Видели | С заявкой | Доставлено | Заявка / видели |','|---|---|---:|---:|---:|---:|']
  for row in metrics.get('partners')or[]:text.append(f"| {row.get('offer_id')} | {row.get('cohort')} | {fmt(row.get('offer_view_journeys'))} | {fmt(row.get('request_journeys'))} | {fmt(row.get('delivered_journeys'))} | {fmt(row.get('request_conversion_pct'),True)} |")
  ux=metrics.get('ux_pulse')or{};text+=['',f"Добровольных UX-оценок: {fmt(ux.get('responses'))}; удобно: {fmt(ux.get('easy'))}, трудности: {fmt(ux.get('difficult'))}. Малое число ответов и самоотбор не доказывают удобство CJM. Разбивка по 24 шагам и диапазонам времени сохранена в JSON и отдельном отчёте воронки."]
 text+=['',f'[Подробная воронка, 24 шага и интервалы времени]({dest / "funnel-report.md"})','','## База и ограничения','','База зафиксирована 6 ноября 2026: SEO/Метрика до запуска —30 октября–5 ноября;6 ноября — неполный день. Историческая боевая first-party воронка до включенияv2 неизвестна. Для оценки изменения не сравнивать неполный стартовый день с полной неделей и не объявлять изменение причинным эффектом.','','Прямой POST переобхода Яндекса 6 ноября возвращал 504, в том числе с production VPS; квота не потрачена. Все 60 новых URL приняты IndexNow, sitemap Google принят и скачан. Устаревшее поле indexed не интерпретируем как число URL в индексе.','','Платные проверки позиций запускаются только флагом --check-positions; Cloud-срез — только --yandex-cloud. В отчёте нет контактов, ответов опроса, токенов доступа и хешей journey.']
 write(dest/'report.json',report);(dest/'report.md').write_text('\n'.join(text)+'\n');return report

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--as-of',default=dt.datetime.now(ZoneInfo('Europe/Moscow')).date().isoformat());parser.add_argument('--check-positions',action='store_true');parser.add_argument('--yandex-cloud',action='store_true');parser.add_argument('--include-current-day',action='store_true',help='Collect a separate partial-day traffic/funnel report; never merge it into the weekly window');parser.add_argument('--aggregate-only',action='store_true',help='Read existing dated aggregates; do not call any API or SSH');args=parser.parse_args()
 asof=dt.date.fromisoformat(args.as_of);date1=(asof-dt.timedelta(days=7)).isoformat();date2=(asof-dt.timedelta(days=1)).isoformat();dest=OUT/'weekly'/args.as_of;dest.mkdir(parents=True,exist_ok=True);jobs=[]
 if args.aggregate_only and (args.check_positions or args.yandex_cloud):parser.error('--aggregate-only cannot be combined with collection flags')
 if not args.aggregate_only:
  execute('traffic',[sys.executable,str(HERE/'traffic.py'),'--date1',date1,'--date2',date2,'--label','weekly-'+args.as_of],jobs)
  command=[sys.executable,str(HERE/'seo/refresh.py'),'--as-of',args.as_of]
  if args.check_positions:command.append('--check-positions')
  if args.yandex_cloud:command.append('--yandex-cloud')
  execute('seo',command,jobs)
  execute('seo-summary',[sys.executable,str(HERE/'seo/summarize.py'),'--date',args.as_of],jobs)
  ok=execute('funnel-snapshot',[sys.executable,str(HERE/'funnel/measurement.py'),'snapshot','--date1',date1,'--date2',date2,'--output',str(dest/'funnel-snapshot.json')],jobs)
  if ok:execute('funnel-report',[sys.executable,str(HERE/'funnel/measurement.py'),'report','--snapshot',str(dest/'funnel-snapshot.json'),'--output',str(dest/'funnel-report')],jobs)
 report=make_report(args.as_of,date1,date2,dest,jobs,args.aggregate_only)
 if args.include_current_day:
  today_jobs=[];today_dest=dest/'current-day';today_dest.mkdir(parents=True,exist_ok=True)
  if not args.aggregate_only:
   execute('current-day-traffic',[sys.executable,str(HERE/'traffic.py'),'--date1',args.as_of,'--date2',args.as_of,'--label','current-day-'+args.as_of],today_jobs)
   ok=execute('current-day-funnel-snapshot',[sys.executable,str(HERE/'funnel/measurement.py'),'snapshot','--date1',args.as_of,'--date2',args.as_of,'--output',str(today_dest/'funnel-snapshot.json')],today_jobs)
   if ok:execute('current-day-funnel-report',[sys.executable,str(HERE/'funnel/measurement.py'),'report','--snapshot',str(today_dest/'funnel-snapshot.json'),'--output',str(today_dest/'funnel-report')],today_jobs)
  make_report(args.as_of,args.as_of,args.as_of,today_dest,today_jobs,args.aggregate_only,'current_day_partial')
  report['separate_current_day_report']=str(today_dest/'report.json');write(dest/'report.json',report)
  with (dest/'report.md').open('a')as f:f.write('\n[Текущий неполный день — отдельно]('+str(today_dest/'report.md')+'). В недельные итоги не включён.\n')
  jobs.extend(today_jobs)
 print(json.dumps({'report':str(dest/'report.md'),'json':str(dest/'report.json'),'window':report['window'],'scope':report['scope'],'partner_sales_collected':False,'jobs':jobs},ensure_ascii=False))
 return 1 if any(j['status']!='ok' for j in jobs) else 0
if __name__=='__main__':raise SystemExit(main())
