#!/usr/bin/env python3
"""Conservative server-only verification and publication preparation. No AI credentials.
Unrecognised/ambiguous sources remain pending. Only explicit facts may become cards.
"""
import argparse,copy,hashlib,json,re,fcntl
from pathlib import Path
from datetime import datetime,timedelta
from urllib.parse import urlsplit,urlencode
from bs4 import BeautifulSoup
from adapters import Reader,SourceError,structured_free_events
from update import ROOT,MSK,read,write,iso,lifecycle
from approve import approve
from cover_art import create_cover
class NeedsReview(Exception):pass
ALIASES={
 'matematika':['математик','алгебр','геометр'], 'russkiy-yazyk':['русскому языку','русский язык','русского языка'],
 'fizika':['физике','физика','физики'], 'himiya':['химии','химия'], 'biologiya':['биологии','биология'],
 'informatika':['информатик'], 'istoriya':['истории','история'], 'obshchestvoznanie':['обществознани'],
 'geografiya':['географии','география'], 'literatura':['литератур'], 'angliyskiy-yazyk':['английск'],
 'fizkultura':['физре','физкультур'], 'shahmaty':['шахмат'], 'programmirovanie':['программирован'],
 'neyroseti':['нейросет'],'izo':['рисован','изобразительн']}
def plain(s):return re.sub(r'\s+',' ',s).strip()
def subject(title,taxonomy):
 found=[k for k,words in ALIASES.items() if k in taxonomy and any(w in title.lower() for w in words)]
 if len(found)!=1:raise NeedsReview('Subject is ambiguous or unsupported')
 return found[0]
def grades_from_title(title):
 m=re.search(r'(?<!\d)(1[01]|[1-9])(?:\s*[–—-]\s*(1[01]|[1-9]))?\s*класс',title,re.I)
 if not m:return []
 a=int(m[1]);b=int(m[2] or a)
 if a>b:return []
 return list(range(a,b+1))
def base(candidate,title,topic,grades,now):
 eid=candidate['id'];slug=eid;source=candidate['sourceUrl'];own=eid.startswith('su-')
 return {'id':eid,'slug':slug,'title':title,'shortTitle':title,'url':'/besplatnye-uroki/zanyatiya/'+slug+'/',
 'organizer':candidate['organizer'],'publicOrganizer':'Бесплатные уроки' if own else candidate['organizer'],
 'sourceUrl':source,'outboundUrl':source+('?' if '?' not in source else '&')+urlencode({'utm_source':'gerasimov_lav','utm_medium':'referral','utm_campaign':'proschools_free_lessons','utm_content':eid}),
 'topics':[topic],'grades':grades,'ages':None,'duration':None,'start':None,'price':0,'currency':'RUB',
 'eventType':'lesson','format':'online','verification':{'freeConfirmed':True,'childAudienceConfirmed':True,'detailPage':source,'verifiedAt':now.isoformat(),'method':'strict-server-adapter-v1'}}
def verify(candidate,text,taxonomy,now):
 d=BeautifulSoup(text,'html.parser');h=d.select_one('h1')
 if h is None:raise NeedsReview('No programme heading')
 title=plain(h.get_text(' ',strip=True))
 if not re.fullmatch('[a-z0-9-]+',candidate['id']) or len(title)>400:raise NeedsReview('Invalid identifier or oversized heading')
 topic=subject(title,taxonomy);grades=grades_from_title(title)
 # No sidebar/footer text can provide proof of a free main offer.
 for el in d(['script','style','nav','footer','header']):el.decompose()
 whole=plain(d.get_text(' ',strip=True));at=whole.find(title);main=whole[at+len(title):];main=main.split('Другие курсы')[0];hero=re.split(r'Преподаватель|Отзывы учеников|Переживать не',main)[0][:5000]
 own=candidate['id'].startswith('su-');host=urlsplit(candidate['sourceUrl']).hostname
 if host=='umschool.net':
  if not (re.search(r'\bБесплатный курс\b',title,re.I) and re.search(r'(?:^|[^\d])\b0\s*₽\s*/\s*курс',hero) and not re.search(r'[1-9]\d*[\s\u00a0]*₽\s*/\s*курс',hero)):raise NeedsReview('No explicit zero-price main course')
  if not grades:
   # A playful fitness course is not assigned an invented school grade.
   raise NeedsReview('No explicit school audience in main heading')
  if not re.search(r'Старт\s+В любое время',hero,re.I) or not re.search(r'Длительность\s+В сво[её]м темпе',hero,re.I):raise NeedsReview('Self-paced access not confirmed; no dates guessed')
  m=re.search(r'Количество занятий\s+(\d{1,3})\b',hero)
  if not m or not 1<=int(m[1])<=100:raise NeedsReview('No explicit lesson count')
  count=int(m[1]);label=taxonomy[topic];grade_label=str(grades[0]) if len(grades)==1 else str(grades[0])+'–'+str(grades[-1])
  detail=title.split(':',1)[1].strip() if ':' in title else ''
  if not detail:
   # A generic H1 may omit the programme. Only use catalogue specifics if the
   # main detail-page introduction independently confirms every meaningful stem.
   proposed=candidate.get('title','').split(':',1)[-1].strip() if ':' in candidate.get('title','') else ''
   stems=[w[:-2] for w in re.findall(r'[а-яё]{5,}',proposed.lower())]
   if stems and all(w in hero.lower() for w in stems):detail=proposed
   else:detail='подготовка к ОГЭ' if 'ОГЭ' in title else 'подготовка к ЕГЭ' if 'ЕГЭ' in title else 'открытый курс'
  detail=re.sub(r'^Бесплатный курс\s*','',detail,flags=re.I)
  short=label+': '+detail[0].upper()+detail[1:]+', '+grade_label+' класс'
  if len(short)>145:short=label+': открытый курс, '+grade_label+' класс'
  e=base(candidate,short,topic,grades,now);e.update(kind='recording',eventType='minicourse',lessonCount=count,freeScope=f'Бесплатный курс: {count} '+('занятие' if count%10==1 and count%100!=11 else 'занятия' if count%10 in [2,3,4] and count%100 not in [12,13,14] else 'занятий'))
  e['description']=f'Бесплатные занятия от «{candidate["organizer"]}» для {grade_label} класса. Тема: {detail.rstrip(".")}. В курс входит {count} '+('занятие' if count==1 else 'занятия' if count in [2,3,4] else 'занятий')+'. Начать можно в любое время и заниматься в своём темпе. Доступ и регистрация — на сайте организатора.'
  e['verification'].update(catalogueTitle=candidate.get('title',''),startAnytime=True,selfPaced=True,heading=title,priceEvidence='0 ₽/курс',lessonCount=count,gradeEvidence=grades)
 elif own and host=='school-university.com':
  if not candidate.get('slots') or not candidate.get('scheduleVerifiedAt') or now-iso(candidate['scheduleVerifiedAt'])>timedelta(hours=12):raise NeedsReview('No fresh complete weekly schedule')
  if 'бесплатн' not in hero.lower() or 'бесплатн' not in (title+' '+main).lower():raise NeedsReview('Free main lesson not confirmed')
  grades=candidate['grades'];e=base(candidate,title,topic,grades,now);e.update(kind='scheduled',slots=candidate['slots'],scheduleVerifiedAt=candidate['scheduleVerifiedAt'],freeScope='Бесплатное открытое занятие по расписанию')
  e['description']=f'Бесплатное онлайн-занятие «{title}» для школьников. Урок проходит по расписанию, опубликованному организатором. Выберите подходящие класс и время, затем оставьте заявку на участие. Ссылка на подключение придёт после регистрации.'
 else:
  if not grades:raise NeedsReview('Structured event has no explicit school grade in heading')
  rows=[x for x in structured_free_events(text,candidate['sourceUrl']) if x['id']==candidate['id'] and not x.get('cancelled')]
  if len(rows)!=1 or iso(rows[0]['start'])<=now:raise NeedsReview('No confirmed future free event')
  item=rows[0];e=base(candidate,title,topic,grades,now);e.update(kind='scheduled',start=item['start'],end=item.get('end'),freeScope='Бесплатное открытое занятие')
  e['description']=f'Бесплатное онлайн-занятие «{title}» для школьников от «{candidate["organizer"]}». Дата и время подтверждены на странице организатора. Участие и регистрация — на сайте организатора; перед записью ознакомьтесь с программой и условиями подключения.'
 e['verification']['sourceSha256']=hashlib.sha256(text.encode()).hexdigest();return e

def run(state_dir,assets,now,force=False):
 config=read(ROOT/'scripts/free-lessons/sources.json',{});settings=config['serverCuration'];log=read(state_dir/'curation.json',{});today=now.date().isoformat()
 if log.get('day')!=today:log['day']=today;log['publishedToday']=0
 if not force and log.get('lastRun') and now-iso(log['lastRun'])<timedelta(hours=settings['intervalHours']):return {'skipped':'not due'}
 budget=max(0,min(settings['perRunLimit'],settings['dailyLimit']-log.get('publishedToday',0)));state=read(state_dir/'state.json',{});events=read(state_dir/'catalog.json',[]);taxonomy={x['slug']:x['name'] for x in read(ROOT/'data/free-lessons/taxonomy.json',[])};reader=Reader(config['allowedHosts'],state_dir/'source-cache');reviews=[];issues=[];attempts=log.setdefault('attempts',{});known={e['id'] for e in events}
 if not settings['enabled'] or not budget:return {'skipped':'disabled or daily limit'}
 for candidate in list(state.get('pending',{}).values()):
  eid=candidate['id']
  if eid in known:state['pending'].pop(eid,None);continue
  previous=attempts.get(eid,{})
  if not force and previous.get('time') and now-iso(previous['time'])<timedelta(hours=24):continue
  if len(issues)+len(reviews)>=settings['maxChecksPerRun'] or len(reviews)>=budget:break
  try:
   e=verify(candidate,reader.get(candidate['sourceUrl']),taxonomy,now);e['cover']=create_cover(e,taxonomy[e['topics'][0]],assets,state_dir)
   approve([e],copy.deepcopy(events+reviews),config['allowedHosts'],assets);reviews.append(e);attempts.pop(eid,None)
  except (NeedsReview,SourceError,ValueError,AssertionError) as err:
   reason=str(err)[:220] or type(err).__name__;attempts[eid]={'time':now.isoformat(),'reason':reason};issues.append({'id':eid,'reason':reason})
 if reviews:
  # Validated batch, persistent journal before import. Pipeline lock held throughout.
  stamp=now.strftime('%Y%m%d-%H%M%S');write(state_dir/'reviews'/(stamp+'.json'),reviews);updated=approve(reviews,copy.deepcopy(events),config['allowedHosts'],assets);updated=lifecycle(updated,now,config['weeklyScheduleMaxAgeDays']);write(state_dir/'catalog.json',updated)
  for e in reviews:state['pending'].pop(e['id'],None)
  log['publishedToday']+=len(reviews)
 write(state_dir/'state.json',state)
 log.update(lastRun=now.isoformat(),added=[e['id'] for e in reviews],issues=issues,pending=len(state.get('pending',{})));write(state_dir/'curation.json',log)
 with (state_dir/'curation-runs.jsonl').open('a') as f:f.write(json.dumps({k:v for k,v in log.items() if k!='attempts'},ensure_ascii=False)+'\n')
 # Keep public operational counts aligned with the post-curation catalogue.
 last=read(state_dir/'last-run.json',{});last.update(total=len(events)+len(reviews),active=sum(e.get('status')=='active' for e in events)+len(reviews),pending=len(state.get('pending',{})),newlyAdded=len(reviews));write(state_dir/'last-run.json',last)
 return {k:v for k,v in log.items() if k!='attempts'}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--state-dir',type=Path,required=True);p.add_argument('--assets-root',type=Path,required=True);p.add_argument('--lock-held',action='store_true');p.add_argument('--force',action='store_true');args=p.parse_args()
 if (args.state_dir/'PAUSED').exists():raise SystemExit(0)
 if not args.lock_held:
  lock=(args.state_dir/'pipeline.lock').open('w');fcntl.flock(lock,fcntl.LOCK_EX)
 try:
  result=run(args.state_dir,args.assets_root,datetime.now(MSK),args.force)
  (args.state_dir/'curation-error.json').unlink(missing_ok=True)
  print(json.dumps(result,ensure_ascii=False))
 except Exception as err:
  write(args.state_dir/'curation-error.json',{'time':datetime.now(MSK).isoformat(),'errorType':type(err).__name__,'action':'New cards deferred; existing schedule publication continues'})
  raise
