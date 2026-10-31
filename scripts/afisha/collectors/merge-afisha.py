import os

import os
# -*- coding: utf-8 -*-
import json,pathlib,datetime,re,hashlib,collections,os
W=pathlib.Path(os.environ.get('AFISHA_SCALE_WORK',str(pathlib.Path(__file__).resolve().parent)));target=pathlib.Path(os.environ.get('AFISHA_OUTPUT',str(W.parent.parent/'outputs/ProSchools-afisha-national.json')));j=json.loads(target.read_text());now=datetime.datetime.now(datetime.timezone.utc)
def norm(s):return re.sub(r'[^\w]+',' ',(s or '').lower().replace('ё','е')).strip()
def base(s):
 s=norm(s)
 for p in ['спектакль ','балет ','программа ','экскурсия ','выставка ','концерт ','фэнтези спектакль ']:
  if s.startswith(p):s=s[len(p):]
 return s
known={(city,base(e['title']))for e in j['events']for city in e['cities']};added={};held=[];rejected=collections.Counter();pages=collections.defaultdict(list);venues={}
city_info={c['name']:c for c in json.loads((W/'cities-resolved.json').read_text())}
for f in sorted((W/'afisha-cache').glob('*.json')):
 p=json.loads(f.read_text());city=p['city'];slug=p['city_slug']
 first=f.parent/(slug+'-1.json')
 if first.exists():
  expected=max(1,(json.loads(first.read_text()).get('pager')or{}).get('PagesCount',1))
  if int(f.stem.rsplit('-',1)[1])>expected:continue
 pages[city].append(p)
 for e in p['items']:
  notice=e.get('Notice')or{};place=notice.get('Place')or{};schedule=e.get('ScheduleInfo')or{};source='https://www.afisha.ru'+(e.get('Url')or'')
  reason=None
  if e.get('IsItemFromAnotherCity')or notice.get('AnotherCity')or notice.get('FromAnotherCities'):reason='other_city_recommendation'
  elif not place.get('Url','').startswith('/'+slug+'/'):reason='exact_local_venue_missing'
  elif not schedule.get('MaxScheduleDate'):reason='no_published_date'
  if reason:rejected[reason]+=1;continue
  offset=schedule.get('TimeZoneOffset')or''
  def date(v):
   if not v:return None
   d=datetime.datetime.fromisoformat(v)
   if d.tzinfo is None:
    if not offset:return None
    d=datetime.datetime.fromisoformat(v+offset)
   return d
  end=date(schedule['MaxScheduleDate']);start=date(schedule.get('MinScheduleDate'))
  if not end or end<now:rejected['expired_or_no_timezone']+=1;continue
  if (city,base(e['Name']))in known:
   held.append({'city':city,'title':e['Name'],'source_url':source,'reason':'title_collision_requires_cross_source_dedup','source_venue':place});continue
  key=(city,e['Type'],str(e['ID']),place['Url']);ident='ps-af-'+hashlib.sha256('|'.join(key).encode()).hexdigest()[:18]
  if ident in added:continue
  genre=[x.get('Name','')for x in (e.get('Genres')or{}).get('Links',[])];cat='Спектакли'if e.get('Type')=='Performance' else 'Концерты'if e.get('DisplayType')=='концерт'else 'Праздники и фестивали'
  if '/exhibition/' in source:cat='Выставки и музеи'
  elif '/excursion/' in source:cat='Экскурсии'
  elif '/sport/' in source:cat='Спорт'
  elif '/concert/' in source:cat='Концерты'
  elif 'цирк' in e['Name'].lower() or 'circus' in str(e.get('Genres')).lower():cat='Цирк и шоу'
  if 'мастер' in e['Name'].lower():cat='Мастер-классы'
  sessions=[]
  if start and start==end and start>=now:sessions=[{'start':start.isoformat(),'end':None,'source_url':source,'timezone':city_info.get(city,{}).get('timezone')}]
  price=schedule.get('MinPrice');address=(place.get('Address')or'')
  item={'id':ident,'city':city,'cities':[city],'title':e['Name'],'category':cat,'source_genres':genre,'age_restriction':None,'recommended_age':None,'price':{'min':price,'max':None,'currency':'RUB','free_confirmed':False,'availability':'source_lists_tickets'if schedule.get('HasTickets')else'not_checked','scope':'published_by_source'},'venue':{'source_id':place['Url'],'title':place.get('Name'),'address':address,'locale':{'title':city},'institution':{},'coordinates':None},'sessions':sessions,'source_schedules':[{'mode':'single'if start==end else'between','primaryDate':start.isoformat()if start else None,'secondaryDate':end.isoformat(),'source_end':end.isoformat(),'source_url':source}],'source_records':[{'id':'afisha-'+str(e['ID']),'url':source}],'source_checked_at':p['checked_at'],'editorial_status':'needs_age_verification','media_status':'not_licensed_for_republication','description':None}
  added[ident]=item;venues[(city,place['Url'])]={'city':city,'institution_id':'afisha:'+place['Url'],'name':place.get('Name'),'example_source_url':source,'events':0}
for item in added.values():venues[(item['city'],item['venue']['source_id'])]['events']+=1
j['events']+=list(added.values());j['donors']+=list(venues.values());j['held']+=held
for c in j['coverage']:
 ps=pages.get(c['name'],[]);expected=max([max(1,(x.get('pager')or{}).get('PagesCount',1))for x in ps]or[0]);indices={(x.get('pager')or{}).get('CurrentPage',1)or 1 for x in ps};cityevents=[e for e in j['events']if c['name']in e['cities']]
 c['afisha_ru']={'pages_loaded':len(indices),'pages_expected':expected,'pagination_complete':bool(expected)and indices>=set(range(1,expected+1)),'added_unique':sum(c['name']in e['cities']for e in added.values())}
 c['unique_events']=len(cityevents);c['categories']=dict(collections.Counter(e['category']for e in cityevents));c['institutions']+=sum(city==c['name']for city,_ in venues)
j['counts']['cities_with_events']=sum(c['unique_events']>0for c in j['coverage']);j['counts']['unique_events']=len(j['events']);j['counts']['city_event_listings']=sum(c['unique_events']for c in j['coverage']);j['counts']['afisha_ru_added']=len(added);j['counts']['afisha_ru_title_collisions_held']=len(held);j['counts']['afisha_ru_rejected']=dict(rejected);j['counts']['afisha_ru_cities_loaded']=len(pages);j['counts']['afisha_ru_cities_complete']=sum(c['afisha_ru']['pagination_complete']for c in j['coverage']);j['counts']['confirmed_future_sessions']=sum(len(e['sessions'])for e in j['events']);j['source']='Culture.ru explicit Для детей and Afisha.ru kids catalogues; only source facts. Culture default minimum-ticket ceiling 5000 RUB. Afisha ages require detail verification.'
j['counts']['additional_afisha_venue_records']=len(venues)
j['limitations'].append('Afisha.ru additions have an explicit kids category but age restrictions need detail verification. Title collisions are held, not counted as additional unique events.')
tmp=target.with_suffix('.tmp');tmp.write_text(json.dumps(j,ensure_ascii=False,separators=(',',':')));tmp.replace(target);print('AFISHA MERGE',json.dumps(j['counts'],ensure_ascii=False))
