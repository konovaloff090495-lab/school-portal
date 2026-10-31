import os

import os
# -*- coding: utf-8 -*-
"""First local Quick Tickets connector: Seversk child theatre, public DOM facts."""
import pathlib,json,urllib.request,datetime,re,os,hashlib,collections
from zoneinfo import ZoneInfo
from bs4 import BeautifulSoup
W=pathlib.Path(os.environ.get('AFISHA_SCALE_WORK',str(pathlib.Path(__file__).resolve().parent)));target=pathlib.Path(os.environ.get('AFISHA_OUTPUT',str(W.parent.parent/'outputs/ProSchools-afisha-national.json')));j=json.loads(target.read_text());url='https://quicktickets.ru/seversk-teatr-dyu'
raw=urllib.request.urlopen(url,timeout=25).read();soup=BeautifulSoup(raw,'html.parser');now=datetime.datetime.now(datetime.timezone.utc);added=[]
for card in soup.select('.quick-tickets-event-card'):
 title=card.get('data-filter-name');h=card.select_one('h3 a');description=card.select_one('.quick-tickets-event-card__description');desc=description.get_text(' ',strip=True)if description else''
 if not title or not h or not any(x in desc.lower()for x in ['сказ','дет','малыш','фантазия игра','для семей']):continue
 age=card.select_one('.ageRestriction');age_match=re.search(r'\d+',age.get_text()if age else'');age=int(age_match.group())if age_match else None
 if age is not None and age>=18:continue
 metadata={n.get('data-session-id'):n for n in card.select('.event-filter-session')};sessions=[];maxprices=[]
 for loc in card.select('.quick-tickets-event-location'):
  text=loc.get_text(' ',strip=True)
  if 'Томск' in text or 'Самусь' in text:continue
  group=loc.get('data-event-filter-session-group')
  sessionlist=card.select_one('.quick-tickets-session-list[data-event-filter-session-group="'+group+'"]')if group else None
  for a in (sessionlist.select('a[href]')if sessionlist else []):
   m=re.search(r'/s(\d+)$',a['href']);tm=re.search(r'\b(\d{2}:\d{2})\b',a.get_text());meta=metadata.get(m.group(1))if m else None
   if meta is None or not tm:continue
   date=meta.get('data-date');d=datetime.datetime.fromisoformat(date+'T'+tm.group(1)).replace(tzinfo=ZoneInfo('Asia/Tomsk'))
   if d<now:continue
   sessions.append({'start':d.isoformat(),'end':None,'source_url':'https://quicktickets.ru'+a['href'],'timezone':'Asia/Tomsk'})
   if meta.get('data-max-price-quick-tickets'):maxprices.append(float(meta['data-max-price-quick-tickets']))
 if not sessions:continue
 source='https://quicktickets.ru'+h['href'];ident='ps-qt-'+hashlib.sha256(source.encode()).hexdigest()[:18]
 added.append({'id':ident,'city':'Северск','cities':['Северск'],'title':title,'category':'Спектакли','source_genres':[],'age_restriction':age,'recommended_age':None,'price':{'min':None,'max':max(maxprices)if maxprices else None,'currency':'RUB','free_confirmed':False,'availability':'not_checked','scope':'published_maximum_by_session'},'venue':{'source_id':'seversk-teatr-dyu','title':'Северский театр для детей и юношества','address':'Северск, проспект Коммунистический, 48','locale':{'title':'Северск'},'institution':{},'coordinates':None},'sessions':sessions,'source_schedules':[{'mode':'between','primaryDate':min(x['start']for x in sessions),'secondaryDate':max(x['start']for x in sessions),'source_url':source}],'source_records':[{'id':'qt-'+h['href'].split('/')[-1],'url':source}],'source_checked_at':now.isoformat(),'editorial_status':'source_facts_imported','media_status':'not_licensed_for_republication','description':None})
ids={e['id']for e in added};j['events']=[e for e in j['events']if not e['id'].startswith('ps-qt-')]+added
j['counts']['quicktickets_added']=len(added);j['counts']['unique_events']=len(j['events']);j['counts']['confirmed_future_sessions']=sum(len(e['sessions'])for e in j['events'])
for c in j['coverage']:
 es=[e for e in j['events']if c['name']in e['cities']];c['unique_events']=len(es);c['categories']=dict(collections.Counter(e['category']for e in es))
 if c['name']=='Северск':c['quicktickets']={'source_url':url,'unique_events':len(added),'refreshed_at':now.isoformat()}
j['counts']['cities_with_events']=sum(c['unique_events']>0for c in j['coverage']);j['counts']['city_event_listings']=sum(c['unique_events']for c in j['coverage'])
j['donors']=[d for d in j['donors']if d.get('institution_id')!='qt:seversk-teatr-dyu']+[{'city':'Северск','institution_id':'qt:seversk-teatr-dyu','name':'Северский театр для детей и юношества','example_source_url':url,'events':len(added)}]
tmp=target.with_suffix('.tmp');tmp.write_text(json.dumps(j,ensure_ascii=False,separators=(',',':')));tmp.replace(target);print('Quick Tickets Seversk events',len(added))
