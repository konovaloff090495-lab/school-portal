#!/usr/bin/env python3
"""Bounded source refresh, rolling Moscow dates, and lossless event lifecycle."""
import argparse,copy,hashlib,json,os,re,time
from datetime import datetime,timedelta,timezone
from pathlib import Path
from urllib.parse import urljoin,urlsplit
from zoneinfo import ZoneInfo
from adapters import Reader,SourceError,weeks_from_html,um_candidates,structured_free_events
MSK=ZoneInfo('Europe/Moscow');ROOT=Path(__file__).resolve().parents[2]
def read(p,default):return json.loads(Path(p).read_text()) if Path(p).exists() else copy.deepcopy(default)
def write(p,x):
 p=Path(p);p.parent.mkdir(parents=True,exist_ok=True);tmp=p.with_suffix(p.suffix+'.tmp');tmp.write_text(json.dumps(x,ensure_ascii=False,indent=2));os.replace(tmp,p)
def iso(s):
 d=datetime.fromisoformat(s.replace('Z','+00:00'))
 if d.tzinfo is None:raise ValueError('timezone required')
 return d

def lifecycle(events,now,max_age=7):
 for e in events:
  if e.get('status')=='withdrawn':continue
  if e['id'].startswith('su-'):
   verified=iso(e.get('scheduleVerifiedAt',e['checkedAt']+'T00:00:00+03:00'))
   if now-verified>timedelta(days=max_age):e['status']='unverified';e['occurrences']=[];e['start']=None;continue
   occurrences=[]
   for offset in range(22):
    day=now.astimezone(MSK).date()+timedelta(days=offset)
    for s in e.get('slots',[]):
     if day.weekday()!=s['day']:continue
     start=iso(str(day)+'T'+s['from']+':00+03:00');end=iso(str(day)+'T'+s['to']+':00+03:00')
     if end>now:occurrences.append({'start':start.isoformat(),'end':end.isoformat(),'grades':s['grades'],'teacher':s.get('teacher','')})
   e['occurrences']=sorted(occurrences,key=lambda o:o['start']);e['start']=e['occurrences'][0]['start'] if occurrences else None;e['status']='active' if occurrences else 'unverified'
  elif e['kind']=='scheduled':
   try:end=iso(e.get('end') or e['start'])+(timedelta(minutes=e.get('duration') or 0) if not e.get('end') else timedelta())
   except (ValueError,TypeError,KeyError):e['status']='unverified';continue
   e['status']='expired' if end<=now else 'active'
  else:e['status']='active' # Recordings and appointments do not expire by an invented date.
 return events

def refresh(events,state,reader,config,now):
 known={e['id']:e for e in events};pending=state.setdefault('pending',{});checks=[]
 def candidate(item):
  if item['id'] in known:return
  old=pending.get(item['id'],{});pending[item['id']]={**old,**item,'firstSeen':old.get('firstSeen',now.isoformat()),'lastSeen':now.isoformat()}
 try:
  schedule=weeks_from_html(reader.get('https://school-university.com/lektoriy/'))
  old={e['id'][3:] for e in events if e['id'].startswith('su-')}
  if len(old-set(schedule))>max(3,len(old)//5):raise SourceError('unexpected schedule inventory drop; kept last verified data')
  for slug,x in schedule.items():
   eid='su-'+slug
   if eid in known:
    e=known[eid];e['slots']=x['slots'];lengths={(int(s['to'][:2])*60+int(s['to'][3:]))-(int(s['from'][:2])*60+int(s['from'][3:])) for s in x['slots']};e['duration']=next(iter(lengths)) if len(lengths)==1 else None;e['grades']=sorted({g for s in x['slots'] for g in s['grades']});e['scheduleVerifiedAt']=now.isoformat();e['checkedAt']=now.date().isoformat();e['status']='active';e.pop('sourceMissingCount',None)
   else:candidate({'id':eid,'title':x['title'],'organizer':'Лекторий Синергии','sourceUrl':'https://school-university.com/lektoriy/'+slug+'/','slots':x['slots'],'grades':sorted({g for s in x['slots'] for g in s['grades']}),'scheduleVerifiedAt':now.isoformat(),'kind':'scheduled','reason':'New lesson in complete official weekly schedule; needs programme/topic/unique cover'})
  for slug in old-set(schedule):
   e=known['su-'+slug];e['sourceMissingCount']=e.get('sourceMissingCount',0)+1
   if e['sourceMissingCount']>=2:e['status']='withdrawn'
  checks.append({'source':'su','ok':True,'count':len(schedule)})
 except SourceError as x:checks.append({'source':'su','ok':False,'error':str(x)})
 # Follow only actual free-catalogue pagination, bounded to 20 pages.
 queue=['https://umschool.net/courses/free/'];seen=set();umfound=0
 while queue and len(seen)<20:
  url=queue.pop(0)
  if url in seen:continue
  seen.add(url)
  try:
   found,pages=um_candidates(reader.get(url),url)
   for item in found:candidate(item)
   umfound+=len(found);queue.extend(sorted(pages-seen-set(queue)))
   checks.append({'source':'umschool','url':url,'ok':True,'count':len(found)})
  except SourceError as x:checks.append({'source':'umschool','url':url,'ok':False,'error':str(x)})
 # JSON-LD discovery never invents dates, price, year, or timezone.
 targets={'https://foxford.ru/catalog/events/online':'Фоксфорд'}
 for e in events:
  if not e['id'].startswith(('su-','um-','fox-')):targets[e['sourceUrl']]=e['organizer']
 for url,organizer in targets.items():
  try:
   text=reader.get(url);found=structured_free_events(text,url)
   for item in found:
    item['organizer']=organizer
    if item['id'] in known:
     e=known[item['id']];e.update({k:v for k,v in item.items() if k in ['start','end'] and v});e['checkedAt']=now.date().isoformat();e['status']='withdrawn' if item.get('cancelled') else 'active'
    else:candidate(item)
   if organizer=='Фоксфорд':
    doc=__import__('bs4').BeautifulSoup(text,'html.parser');links={urljoin(url,a['href']) for a in doc.select('a[href]') if re.fullmatch(r'/events/\d+/?',urlsplit(urljoin(url,a['href'])).path)}
    for detail in sorted(links)[:20]:
     try:
      for item in structured_free_events(reader.get(detail),detail):
       item['organizer']=organizer
       if item['id'] in known:known[item['id']].update({**{k:v for k,v in item.items() if k in ['start','end'] and v},'status':'withdrawn' if item.get('cancelled') else 'active'})
       else:candidate(item)
     except SourceError:pass
   checks.append({'source':organizer,'url':url,'ok':True,'events':len(found)})
  except SourceError as x:checks.append({'source':organizer,'url':url,'ok':False,'error':str(x)})
 state['sourceChecks']=checks;state['lastFetchAt']=now.isoformat();return events

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--state-dir',type=Path,default=ROOT/'work/free-lessons/state');ap.add_argument('--no-fetch',action='store_true');ap.add_argument('--force-fetch',action='store_true');ap.add_argument('--now');args=ap.parse_args()
 now=iso(args.now) if args.now else datetime.now(MSK);D=args.state_dir;D.mkdir(parents=True,exist_ok=True)
 if (D/'PAUSED').exists():print('Free lessons updater paused');return
 import fcntl
 lock=(D/'update.lock').open('w')
 try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
 except BlockingIOError:print('Another update is running');return
 config=read(ROOT/'scripts/free-lessons/sources.json',{});events=read(D/'catalog.json',read(ROOT/'data/free-lessons/catalog.json',[]));state=read(D/'state.json',{})
 due=not state.get('lastFetchAt') or now-iso(state['lastFetchAt'])>=timedelta(hours=config['fetchIntervalHours'])
 if not args.no_fetch and (due or args.force_fetch):events=refresh(events,state,Reader(config['allowedHosts'],D/'source-cache'),config,now)
 events=lifecycle(events,now,config['weeklyScheduleMaxAgeDays']);write(D/'catalog.json',events);write(D/'state.json',state)
 snapshot=hashlib.sha256(json.dumps(events,sort_keys=True,ensure_ascii=False).encode()).hexdigest()[:16]
 if not (D/'history'/(snapshot+'.json')).exists():write(D/'history'/(snapshot+'.json'),events)
 active=[e for e in events if e.get('status')=='active'];summary={'time':now.isoformat(),'total':len(events),'active':len(active),'expired':sum(e.get('status')=='expired' for e in events),'unverified':sum(e.get('status')=='unverified' for e in events),'withdrawn':sum(e.get('status')=='withdrawn' for e in events),'pending':len(state.get('pending',{})),'sourceFailures':sum(not c['ok'] for c in state.get('sourceChecks',[]))}
 write(D/'last-run.json',summary)
 with (D/'runs.jsonl').open('a') as f:f.write(json.dumps(summary,ensure_ascii=False)+'\n')
 print(json.dumps(summary,ensure_ascii=False))
if __name__=='__main__':main()
