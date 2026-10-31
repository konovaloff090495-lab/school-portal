import os

import os
# -*- coding: utf-8 -*-
"""Official monthly DK Vidnoe plan; hold family/age/price editorial checks."""
import urllib.request,pathlib,json,datetime,re,hashlib,os,collections
from zoneinfo import ZoneInfo
from bs4 import BeautifulSoup
W=pathlib.Path(os.environ.get('AFISHA_SCALE_WORK',str(pathlib.Path(__file__).resolve().parent)));target=pathlib.Path(os.environ.get('AFISHA_OUTPUT',str(W.parent.parent/'outputs/ProSchools-afisha-national.json')));j=json.loads(target.read_text());home='http://dkvidnoe.ru/';root=BeautifulSoup(urllib.request.urlopen(home,timeout=25).read(),'html.parser');link=next(a for a in root.select('a[href]')if 'План работы' in a.get_text());url=link['href'];s=BeautifulSoup(urllib.request.urlopen(url,timeout=25).read(),'html.parser');content=s.select_one('.entry-content');text=content.get_text(' ',strip=True);ym=re.search(r'на\s+\w+\s+(20\d{2})\s+года',text);now=datetime.datetime.now(ZoneInfo('Europe/Moscow'));year=int(ym.group(1))if ym else None;added=[]
if year:
 for tr in content.select('tr'):
  cells=[c.get_text(' ',strip=True)for c in tr.select('td')]
  if len(cells)!=5:continue
  dates,title,address,st,et=cells;low=title.lower()
  # Direct child wording OR an educational local-history museum exhibition.
  if not(any(w in low for w in ['для детей','для школьник','детск','сказк'])or('выставк'in low and 'видновский край'in low)):continue
  if 'г. Видное'not in address or 'целевая аудитория'in low or 'по согласованию'in st:continue
  pairs=re.findall(r'(\d{2})\.(\d{2})',dates)
  if not pairs:continue
  d1,m1=map(int,pairs[0]);d2,m2=map(int,pairs[-1]);is_range=len(pairs)>1
  end_day=datetime.date(year,m2,d2)
  if end_day<now.date():continue
  sessions=[];primary=None;secondary=None
  if not is_range and re.fullmatch(r'\d{1,2}[.:]\d{2}',st):
   hh,mm=map(int,re.split('[.:]',st));start=datetime.datetime(year,m1,d1,hh,mm,tzinfo=now.tzinfo)
   if start<now:continue
   sessions=[{'start':start.isoformat(),'end':None,'source_url':url,'timezone':'Europe/Moscow'}];primary=start.isoformat()
  else:primary=datetime.date(year,m1,d1).isoformat();secondary=end_day.isoformat()
  uid='ps-vidnoe-'+hashlib.sha256((title+str(year)+str(m1)).encode()).hexdigest()[:18]
  added.append({'id':uid,'city':'Видное','cities':['Видное'],'title':title,'category':'Выставки и музеи'if 'выставк'in low else'Встречи и программы','source_genres':[],'age_restriction':None,'recommended_age':None,'price':{'min':None,'max':None,'currency':'RUB','free_confirmed':False,'availability':'not_checked','scope':'price_not_published'},'venue':{'source_id':'dkvidnoe-ikvc','title':'Историко-культурный выставочный центр'if 'ИКВЦ'in address else'ДК «Видное»','address':address,'locale':{'title':'Видное'},'institution':{},'coordinates':None},'sessions':sessions,'source_schedules':[{'mode':'between'if is_range else'single','primaryDate':primary,'secondaryDate':secondary,'source_url':url,'published_opening_hours':st,'published_closing_hours':et}],'source_records':[{'id':uid,'url':url}],'source_checked_at':now.isoformat(),'editorial_status':'needs_age_price_and_family_suitability_verification','audience_basis':'explicit_child_wording'if any(w in low for w in ['для детей','для школьник','детск','сказк'])else'educational_museum_candidate','media_status':'not_licensed_for_republication','description':None})
j['events']=[e for e in j['events']if not e['id'].startswith('ps-vidnoe-')]
j['editorial_candidates']=[e for e in j.get('editorial_candidates',[])if not e['id'].startswith('ps-vidnoe-')]+added
for c in j['coverage']:
 es=[e for e in j['events']if c['name']in e['cities']];c['unique_events']=len(es);c['categories']=dict(collections.Counter(e['category']for e in es))
 if c['name']=='Видное':c['local_donor']={'source_url':url,'refreshed_at':now.isoformat(),'candidate_events':len(added),'publication_requires_editorial_verification':True}
j['counts'].update({'vidnoe_local_candidates':len(added),'unique_events':len(j['events']),'city_event_listings':sum(c['unique_events']for c in j['coverage']),'cities_with_events':sum(c['unique_events']>0for c in j['coverage'])})
j['donors']=[d for d in j['donors']if d.get('institution_id')!='local:dkvidnoe']+[{'city':'Видное','institution_id':'local:dkvidnoe','name':'ДК «Видное» — официальный ежемесячный план','example_source_url':url,'events':len(added)}]
tmp=target.with_suffix('.tmp');tmp.write_text(json.dumps(j,ensure_ascii=False,separators=(',',':')));tmp.replace(target);print('Vidnoe local candidates',len(added))
