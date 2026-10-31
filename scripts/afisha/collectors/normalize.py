import os
import json,pathlib,datetime,re,collections,hashlib
from zoneinfo import ZoneInfo
W=pathlib.Path(os.environ.get('AFISHA_SCALE_WORK',str(pathlib.Path(__file__).resolve().parent)));OUT=W.parent.parent/'outputs';OUT.mkdir(exist_ok=True)
now=datetime.datetime.now(datetime.timezone.utc)
def dt(s):
 try:return datetime.datetime.fromisoformat(s.replace('Z','+00:00'))
 except:return None
def normal(s):return re.sub(r'[^\w]+',' ',(s or '').lower().replace('ё','е')).strip()
def category(e):
 tags={t.get('name') for t in e.get('tags',[])};title=e.get('title','').lower();g=[x.get('name')for x in e.get('genres',[])]
 if 'мастер-класс' in title or 'мастер класс' in title or 'master-klassy' in tags:return 'Мастер-классы'
 if any(x in title for x in ['квест','квиз','викторин']):return 'Квесты и игры'
 if 'spektakli'in g:return 'Спектакли'
 if 'vistavki'in g:return 'Выставки и музеи'
 if 'ekskursii'in g:return 'Экскурсии'
 if 'kino'in g:return 'Кино'
 if 'kontserti'in g:return 'Концерты'
 if 'prazdniki'in g:return 'Праздники и фестивали'
 if 'obuchenie'in g:return 'Занятия и обучение'
 return 'Встречи и программы'
cities=json.loads((W/'cities.json').read_text());resolved={c['name']:c for c in json.loads((W/'cities-resolved.json').read_text())}
raw={};pageinfo=collections.defaultdict(list);reject=collections.Counter()
for f in sorted((W/'cache').glob('*-[0-9]*.json')):
 j=json.loads(f.read_text());city=j['city']
 first=f.parent/(f.name.rsplit('-',1)[0]+'-1.json')
 if first.exists():
  expected=max(1,json.loads(first.read_text())['events'].get('pagination',{}).get('total',1))
  if int(f.stem.rsplit('-',1)[1])>expected:continue
 pageinfo[city].append({'events':{'total':j['events'].get('total',0),'pagination':j['events'].get('pagination',{})}})
 for e in j['events']['items']:
  key=(city,str(e['_id']));compact={k:e.get(k)for k in ['_id','title','name','urlEventId','tags','genres','ageRestriction','selectedLocalePlace','nearestSeancePlace','seanceEndDate','cardSchedule','price']}
  try:compact['microdata']=json.dumps({'url':json.loads(e.get('microdata')or'{}').get('url')})
  except Exception:compact['microdata']='{}'
  raw[key]=(compact,j['checked_at'])
merged={};donors={};held=[]
for (city,id),(e,checked) in raw.items():
 tags={t.get('name') for t in e.get('tags',[])}
 if 'dlya-detei' not in tags:reject['no_child_tag']+=1;continue
 if e.get('ageRestriction') is not None and e['ageRestriction']>=18:reject['adult_18_plus']+=1;continue
 place=e.get('selectedLocalePlace') or e.get('nearestSeancePlace') or {};locale=place.get('locale') or {};expected=resolved.get(city,{}).get('culture_locale_id')
 # Moscow districts are integral city districts. Do not include other cities.
 actual=locale.get('_id');sys=locale.get('sysName','');district_scope=resolved.get(city,{}).get('source_scope')=='district_requires_exact_city_address';city_ok=(city=='Московская область'and sys.startswith('moskovskaya-oblast'))or(actual==expected and not district_scope) or (city=='Москва' and sys.startswith('moskva-') and sys not in ['moskva-i-podmoskove']) or (city=='Санкт-Петербург' and sys.startswith('sankt-peterburg-'))
 if district_scope or not city_ok:
  addr=normal(place.get('address',''));cn=normal(city)
  city_ok=normal(locale.get('title',''))==cn or bool(re.search(r'(?:^| )г(?:ород)? '+re.escape(cn)+r'(?: |$)',addr))
 if not city_ok:
  held.append({'city':city,'source_id':id,'title':e['title'],'reason':'place_city_mismatch','source_locale':locale});continue
 end=dt(e.get('seanceEndDate',''))
 if end and end<now:reject['expired']+=1;continue
 micro={}
 try:micro=json.loads(e.get('microdata','{}'))
 except:pass
 source=micro.get('url') or f"https://www.culture.ru/events/{e.get('urlEventId',id)}/{e.get('name','')}"
 source=re.sub(r'(https://www\.culture\.ru/events/\d+)_\d+',r'\1',source)
 inst=place.get('institute') or {};pid=str(place.get('_id',''));group=(city,normal(e['title']),str(inst.get('_id') or pid),normal(place.get('title','')))
 schedule=e.get('cardSchedule') or {};mode=schedule.get('mode');primary=schedule.get('primaryDate');pdt=dt(primary or '')
 session=[]
 if mode=='single' and pdt and pdt>=now:
  session=[{'start':primary,'end':e.get('seanceEndDate'),'source_url':source,'timezone':resolved.get(city,{}).get('timezone')}]
 price=e.get('price') or {};mi=price.get('min');ma=price.get('max');free='besplatno'in tags and ma==0
 if group not in merged:
  uid='ps-'+hashlib.sha256('|'.join(group[1:]).encode()).hexdigest()[:18]
  merged[group]={'id':uid,'city':city,'title':e['title'],'category':category(e),'source_genres':e.get('genres',[]),'age_restriction':e.get('ageRestriction'),'recommended_age':None,'price':{'min':mi,'max':ma,'currency':'RUB','free_confirmed':free,'availability':'not_checked','scope':'published_by_source'},'venue':{'source_id':pid,'title':place.get('title'),'address':place.get('address'),'locale':locale,'institution':inst,'coordinates':None},'sessions':[],'source_schedules':[],'source_records':[],'source_checked_at':checked,'editorial_status':'source_facts_imported','media_status':'not_licensed_for_republication','description':None}
  if inst.get('_id'):donors[(city,str(inst['_id']))]={'city':city,'institution_id':inst['_id'],'name':inst.get('title'),'example_source_url':source,'events':0}
 item=merged[group];item['source_records'].append({'id':id,'url':source});item['sessions'].extend(session);item['source_schedules'].append({'mode':mode,'primaryDate':primary,'secondaryDate':schedule.get('secondaryDate'),'source_end':e.get('seanceEndDate'),'source_url':source});item['source_checked_at']=max(item['source_checked_at'],checked)
 if len(item['source_records'])>1:
  vals=[v for v in [item['price']['min'],mi]if v is not None];item['price']['min']=min(vals) if vals else None
  vals=[v for v in [item['price']['max'],ma]if v is not None];item['price']['max']=max(vals) if vals else None
  item['price']['free_confirmed']=item['price']['free_confirmed'] and free
for item in merged.values():
 dkey=(item['city'],str(item['venue']['institution'].get('_id')))
 if dkey in donors:donors[dkey]['events']+=1
 item['sessions']=list({s['start']:s for s in item['sessions']}.values())
coverage=[]
for c in cities:
 city=c['name'];pages=pageinfo.get(city,[]);required=max([max(1,p['events'].get('pagination',{}).get('total',1)) for p in pages] or [0]);indices={(p['events'].get('pagination',{}).get('current',1)or 1)for p in pages};items=[x for x in merged.values() if x['city']==city]
 coverage.append({**c,'culture_locale':resolved.get(city,{}).get('culture_locale'),'pages_loaded':len(indices),'pages_expected':required,'pagination_complete':bool(required) and indices>=set(range(1,required+1)),'source_reported_entries':max([p['events']['total']for p in pages]or[0]),'unique_events':len(items),'confirmed_future_sessions':sum(len(x['sessions'])for x in items),'institutions':sum(1 for k in donors if k[0]==city),'categories':dict(collections.Counter(x['category']for x in items)),'issue':resolved.get(city,{}).get('error')})
national={}
for item in merged.values():
 if item['id'] not in national:
  national[item['id']]={**item,'cities':[item['city']]}
 else:
  national[item['id']]['cities'].append(item['city'])
  national[item['id']]['source_records']=list({x['id']:x for x in national[item['id']]['source_records']+item['source_records']}.values())
report={'generated_at':now.isoformat(),'scope':'Cities above 100000 residents, Rosstat city settlements at 2025-01-01; includes constituent cities of Saint Petersburg; overlap not population additive.','source':'Culture.ru public catalogue, explicit Для детей tag; price ceiling is source default 5000 RUB (catalogue incomplete above this price).','counts':{'target_cities':len(cities),'cities_with_events':sum(c['unique_events']>0 for c in coverage),'cities_pagination_complete':sum(c['pagination_complete']for c in coverage),'source_records':len(raw),'unique_events':len({x['id'] for x in merged.values()}),'city_event_listings':len(merged),'confirmed_future_sessions':sum(len(x['sessions'])for x in merged.values()),'institutions':len({v['institution_id'] for v in donors.values()}),'held_city_mismatch':len(held),'rejected':dict(reject)},'coverage':coverage,'events':list(national.values()),'donors':list(donors.values()),'held':held,'publication_status':'collection_and_verification_not_live','limitations':['Source age restriction is not a recommended age.','Nearest single sessions and published ranges are not a full timetable.','A source listing does not confirm ticket stock.','Photos and descriptions are not cleared/imported.','Incomplete source cities remain explicit coverage gaps.']}
import os
target=pathlib.Path(os.environ.get('AFISHA_OUTPUT',str(OUT/'ProSchools-afisha-national.json')));tmp=target.with_suffix('.tmp');tmp.write_text(json.dumps(report,ensure_ascii=False,separators=(',',':')));tmp.replace(target)
(W/'coverage.json').write_text(json.dumps({'counts':report['counts'],'coverage':coverage},ensure_ascii=False,indent=2));print(json.dumps(report['counts'],ensure_ascii=False))
