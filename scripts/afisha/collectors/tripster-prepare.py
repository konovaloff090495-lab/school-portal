import os,gzip
import os
import json,pathlib,datetime,re,collections
W=pathlib.Path(os.environ['AFISHA_ROOT'])/'work/excursion-donors';D=W.parent/'moscow-preview';now=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=3)));today=now.date();end=today+datetime.timedelta(days=90)
rows=[]
for e in json.load(open(W/'tripster-catalog.json')):
 tags=e.get('tag_slugs')or[t['slug']for t in e.get('tags',[])];title=e['title'];workshop='master-klassy-dlya-detej'in tags or bool(re.search(r'мастер.класс|мастерская|лепк|гончар',title,re.I));quest='kvesty-dlya-detej'in tags or bool(re.search('квест',title,re.I));cat='Мастер-классы'if workshop else'Квесты и игры'if quest else'Экскурсии';cats=[cat]
 if cat!='Экскурсии'and re.search(r'экскурс|прогулк|музе|кремл|галере',title,re.I):cats.append('Экскурсии')
 if workshop and quest:cats.append('Квесты и игры')
 file=W/'tripster-schedules'/f"{e['id']}.json";sched=json.load(open(file))if file.exists()else json.loads(gzip.decompress(file.with_suffix('.json.gz').read_bytes()))if file.with_suffix('.json.gz').exists()else{};dates=[]
 for date,slots in sorted((sched.get('schedule')or{}).items()):
  if not(today.isoformat()<=date<=end.isoformat()):continue
  available=[p for p in slots if p.get('available_persons',sched.get('defaults',{}).get('available_persons',1)-p.get('booked_persons',0))>0]
  if date==today.isoformat():available=[p for p in available if (p.get('time_end')or p.get('time')or p.get('time_start')or'23:59')>=now.strftime('%H:%M')]
  if not available:continue
  p=available[0];time=p.get('time')or p.get('time_start')or''
  if e.get('schedule_type')=='weekly_range'and len(available)>1:
   last=available[-1].get('time')or available[-1].get('time_end')or''
   if last and last!=time:time+='–'+last
  dates.append({'date':date,'time':time+('–'+p['time_end']if p.get('type')=='range'and p.get('time_end')else''),'source':e['url'],'availability':'booking_calendar'})
 if not dates:
  for d in e.get('schedule',{}).get('upcoming_events',[]):
   if today.isoformat()<=d[:10]<=end.isoformat():dates.append({'date':d[:10],'time':d[11:16],'source':e['url'],'availability':'upcoming'})
 price=e.get('price')or{};value=price.get('value')if price.get('currency')=='RUB'else None;gallery=[{'url':p.get('medium')or p.get('thumbnail'),'credit':'Гид / Tripster','source_url':e['url'],'kind':'source_event_image'}for p in e.get('photos',[])if p.get('is_legal',True)and(p.get('medium')or p.get('thumbnail'))]
 meeting=(e.get('meeting_point')or{}).get('text')or'Место встречи уточняется у гида'
 rows.append({'id':'ps-tripster-'+str(e['id']),'title':title,'type':cat,'categories':cats,'format':cat,'image':'','city':'Москва','district':'','okrug':'','metro':'','place':'Tripster · '+meeting,'address':meeting,'coordinates':None,'media':gallery,'date':dates[0]['date']if dates else'','time':dates[0]['time']if dates else'','slots':[],'dates':dates,'age':[0,17],'ageRestriction':None,'price':value,'priceData':{'min':value,'max':None if price.get('price_from')else value,'free_confirmed':False,'unit':price.get('unit_string',''),'currency':price.get('currency')},'duration':e.get('duration'),'family':True,'sources':[{'id':'tripster-'+str(e['id']),'url':e['url'],'provider':'Tripster'}],'schedule':{'mode':'appointment'if not dates else'booking_calendar','primaryDate':None,'secondaryDate':None,'source_url':e['url']},'checked':now.isoformat(),'about':e.get('tagline')or'','result':'','bookingType':e.get('type'),'sourceProvider':'Tripster'})
(D/'extra-events.json').write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':')))
print('Prepared',len(rows),'Tripster products',dict(collections.Counter(e['type']for e in rows)),'with calendar',sum(bool(e['dates'])for e in rows))
