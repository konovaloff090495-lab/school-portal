"""Apply verified source facts uniformly across every geographical catalogue."""
import pathlib,json,datetime,re,sqlite3
from zoneinfo import ZoneInfo
from content_facts import extract,excerpt

def load(p):return json.loads(p.read_text())if p.exists()else{}
class SqliteFacts:
 def __init__(self,p):self.db=sqlite3.connect('file:'+str(p)+'?mode=ro',uri=True,timeout=30)
 def get(self,key,default=None):
  row=self.db.execute('SELECT content FROM facts WHERE key=?',(key,)).fetchone();return json.loads(row[0])if row else default
 def close(self):self.db.close()
def enrich(rows,root,national,byname):
 p=pathlib.Path(root)/'work/afisha-production';culture=SqliteFacts(p/'content-facts.sqlite')if(p/'content-facts.sqlite').exists()else load(p/'content-facts.json');afisha=load(p/'afisha-content-facts.json');sources={e['id']:e for e in national.get('events',[])};now=datetime.datetime.now(datetime.timezone.utc)
 for e in rows:
  n=sources.get(e['id'],{});vid=str(n.get('venue',{}).get('source_id',''));facts={}
  matches=[]
  for s in e.get('sources',[]):
   g=culture.get(str(s['id'])+'|'+vid)or afisha.get(str(s['id']))or{}
   if g:matches.append(g)
   if g.get('about')and len(g.get('about',''))>len(facts.get('about','')):facts=g
  if matches:
   facts={**facts,'seances':[{**x,'source':g.get('contentSource')}for g in matches for x in g.get('seances',[])]}
   mins=[g['priceMin']for g in matches if isinstance(g.get('priceMin'),(int,float))and g['priceMin']>=0];maxs=[g['priceMax']for g in matches if isinstance(g.get('priceMax'),(int,float))and g['priceMax']>=0];ages={g['sourceAgeRestriction']for g in matches if isinstance(g.get('sourceAgeRestriction'),int)}
   if mins:facts['priceMin']=min(mins)
   if maxs:facts['priceMax']=max(maxs)
   if ages:facts['sourceAgeRestriction']=max(ages)
   facts['ageSourceConflict']=len(ages)>1
  if e.get('sourceProvider')=='Tripster'and isinstance(e.get('duration'),(int,float)):
   e['durationMinutes']=round(e['duration']*60);e['duration']=str(e['durationMinutes'])+' мин · по данным Tripster'
  if not facts and e.get('about'):facts={**extract(e['about']),'about':excerpt(e['about']),'contentSource':e['sources'][0]['url']}
  if facts.get('about'):facts={**facts,**extract((e.get('title')or'')+' '+facts['about'])}
  for k in ['about','result','duration','durationMinutes','recommendedAge','recommendedAgeLabel','declaredAdmissionAge','priceNote','attendanceNote','preparation','setting','materialsIncluded','takeHome','adultRequired','independentAllowed','contentSource','contentChecked','venueSchedule']:
   if facts.get(k)not in [None,'',[]]:e[k]=facts[k]
  pmin,pmax=facts.get('priceMin'),facts.get('priceMax');pd=e['priceData'];pd['fixedConfirmed']=bool(e.get('sourceProvider')=='Tripster'and pd.get('max')is not None and pd.get('min')==pd.get('max'))
  if isinstance(pmin,(int,float))and pmin>=0:pd['min']=pmin;e['price']=pmin
  if isinstance(pmax,(int,float))and pmax>=0:pd['max']=pmax
  if pd.get('min')!=0 or pd.get('max')!=0:pd['free_confirmed']=False
  if pd.get('min')==0 and pd.get('max')in[0,None]and not pd.get('free_confirmed'):pd['publishedMin']=0;pd['min']=None;e['price']=None
  if e.get('priceNote')and re.search(r'1\s*реб[её]нк\w*\s*и\s*1\s*взросл',e['priceNote'],re.I):pd['unit']='за ребёнка и взрослого'
  if facts.get('sourceAgeRestriction')is not None:e['ageRestriction']=facts['sourceAgeRestriction']
  recommended=e.get('recommendedAge');e['ageConflict']=bool(facts.get('ageSourceConflict')or recommended and e.get('ageRestriction')is not None and (recommended[0]<e['ageRestriction'] or facts.get('declaredAdmissionAge',e['ageRestriction'])!=e['ageRestriction']))
  if facts.get('bookingUrl')and re.match(r'^https?://[^\s]+$',facts['bookingUrl']):e['bookingUrl']=facts['bookingUrl']
  zone=byname.get(e['city'],{}).get('timezone')or'Europe/Moscow';e['timezone']=zone;dates={}if any('seances'in g and'culture.ru/'in(g.get('contentSource')or'')for g in matches)else{d.get('iso')or d['date']+'T'+d['time']:d for d in e.get('dates',[])if d.get('date','')>=now.astimezone(ZoneInfo(zone)).strftime('%Y-%m-%d')};durations=[];periods=[]
  for s in facts.get('seances',[]):
   try:
    start=datetime.datetime.fromisoformat(s['startDate'].replace('Z','+00:00'));end=datetime.datetime.fromisoformat(s['endDate'].replace('Z','+00:00'));local=start.astimezone(ZoneInfo(zone));minutes=(end-start).total_seconds()/60
    if end<now:continue
    if 0<minutes<=480:
     dates[local.isoformat()]={'date':local.strftime('%Y-%m-%d'),'time':local.strftime('%H:%M'),'iso':local.isoformat(),'endIso':end.astimezone(ZoneInfo(zone)).isoformat(),'source':s.get('source')or facts['contentSource']};durations.append(int(minutes))
    elif minutes>480:periods.append({'from':local.strftime('%Y-%m-%d'),'to':end.astimezone(ZoneInfo(zone)).strftime('%Y-%m-%d')})
   except (ValueError,KeyError,TypeError):continue
  # Multiple source rows can describe the same occurrence. Date+time+zone is identity.
  e['dates']=list({(d['date'],d['time']):{**d,'iso':d.get('iso')or datetime.datetime.fromisoformat(d['date']+'T'+d['time'][:5]).replace(tzinfo=ZoneInfo(zone)).isoformat()} for d in sorted(dates.values(),key=lambda d:d['date']+'T'+d['time'])}.values())
  if e['dates']:e['date']=e['dates'][0]['date'];e['time']=e['dates'][0]['time'];e['slots']=[d['iso']for d in e['dates']]
  else:e['date']='';e['time']='';e['slots']=[]
  if not e.get('duration')and durations and len(set(durations))==1:e['durationMinutes']=durations[0];e['duration']=str(durations[0])+' мин · по сеансу'
  if periods:e['availablePeriods']=periods
  for d in e['dates']:
   if '–'in d['time']or '—'in d['time']:d['kind']='booking_window'
  e['scheduleStatus']='sessions'if e['dates']else'period'if periods or e.get('schedule',{}).get('mode')=='until'else'by_organizer'
  try:
   published_end=datetime.datetime.fromisoformat((e.get('schedule',{}).get('source_end')or'').replace('Z','+00:00'));e['finished']=not e['dates']and not periods and published_end<now
  except(ValueError,TypeError):e['finished']=False
  if e['finished']:e['listingStatus']='published_dates_finished'
  if not e.get('about'):e['contentStatus']='not_published'
  else:e['contentStatus']='source_excerpt'
 if isinstance(culture,SqliteFacts):culture.close()
 return rows
