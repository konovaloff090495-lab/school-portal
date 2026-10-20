"""Read only allowlisted public sources; parse data, never execute donor scripts."""
import json,re,time,hashlib
from pathlib import Path
from urllib.parse import urlsplit,urljoin,urlunsplit
from urllib.robotparser import RobotFileParser
import requests
from bs4 import BeautifulSoup
USER_AGENT='ProSchoolsEvents/1.0 (+https://pro-schools.ru/besplatnye-uroki/)'
class SourceError(Exception):pass
class Reader:
 def __init__(self,hosts,cache):self.hosts=set(hosts);self.cache=Path(cache);self.cache.mkdir(parents=True,exist_ok=True);self.robots={};self.last={}
 def url(self,url):
  u=urlsplit(url)
  if u.scheme!='https' or u.hostname not in self.hosts or u.username or u.password or u.port not in [None,443]:raise SourceError('URL outside approved HTTPS hosts')
  return urlunsplit((u.scheme,u.netloc,u.path,u.query,''))
 def raw(self,url,limit=4_000_000):
  url=self.url(url)
  for _ in range(4):
   host=urlsplit(url).hostname;delay=0.6-(time.monotonic()-self.last.get(host,0))
   if delay>0:time.sleep(delay)
   self.last[host]=time.monotonic()
   try:r=requests.get(url,headers={'User-Agent':USER_AGENT},timeout=(5,12),allow_redirects=False,stream=True)
   except requests.RequestException as e:raise SourceError(type(e).__name__)
   if r.status_code in [301,302,303,307,308]:
    new=self.url(urljoin(url,r.headers.get('Location','')));r.close();url=new;continue
   if r.status_code!=200:
    status=r.status_code;r.close();raise SourceError('HTTP '+str(status))
   b=bytearray()
   for chunk in r.iter_content(65536):
    b.extend(chunk)
    if len(b)>limit:r.close();raise SourceError('source too large')
   encoding=r.encoding if r.encoding and r.encoding.lower()!='iso-8859-1' else 'utf-8';r.close();return bytes(b).decode(encoding,errors='replace')
  raise SourceError('redirect limit')
 def get(self,url):
  url=self.url(url);u=urlsplit(url);origin='https://'+u.netloc
  if origin not in self.robots:
   rp=RobotFileParser();rp.set_url(origin+'/robots.txt')
   try:rp.parse(self.raw(origin+'/robots.txt',512000).splitlines())
   except SourceError as e:
    if str(e)=='HTTP 404':rp.parse([])
    else:raise SourceError('robots unavailable: '+str(e))
   self.robots[origin]=rp
  if not self.robots[origin].can_fetch(USER_AGENT,url):raise SourceError('robots disallows automated access')
  text=self.raw(url);key=hashlib.sha256(url.encode()).hexdigest()[:20];(self.cache/(key+'.html')).write_text(text);return text

def weeks_from_html(text):
 chunks=[text]
 for m in re.finditer(r'self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)',text):
  try:chunks.append(json.loads(m[1]))
  except ValueError:continue
 for chunk in chunks:
  i=chunk.find('"weeks":')
  if i<0:continue
  try:weeks=json.JSONDecoder().raw_decode(chunk[i+8:].lstrip())[0]
  except ValueError:continue
  if not isinstance(weeks,list) or {w.get('grade') for w in weeks}!={5,6,7,8,9,10,11}:continue
  groups={}
  for w in weeks:
   for day in w.get('days',[]):
    if not isinstance(day.get('day'),int) or not 0<=day['day']<=6:raise SourceError('invalid weekday')
    for item in day.get('items',[]):
     slug=item.get('slug','')
     if not re.fullmatch(r'[a-z0-9-]+',slug):raise SourceError('invalid source slug')
     for field in ['from','to']:
      if not re.fullmatch(r'(?:[01]\d|2[0-3]):[0-5]\d',item.get(field,'')):raise SourceError('invalid schedule time')
     if item['to']<=item['from']:raise SourceError('invalid schedule interval')
     g=groups.setdefault(slug,{'title':item['name'],'slots':{}});key=(day['day'],item['from'],item['to'],item.get('teacher',''))
     g['slots'].setdefault(key,[]).append(w['grade'])
  if not 10<=len(groups)<=80:raise SourceError('unexpected weekly inventory size')
  return {slug:{'title':g['title'],'slots':[{'day':k[0],'from':k[1],'to':k[2],'teacher':k[3],'grades':sorted(set(v))} for k,v in sorted(g['slots'].items())]} for slug,g in groups.items()}
 raise SourceError('complete weekly schedule not found')

def um_candidates(text,url):
 d=BeautifulSoup(text,'html.parser');found={}
 for h in d.select('h3'):
  a=h.find('a',href=True)
  if a and 'бесплатн' in a.get_text(' ',strip=True).lower():
   u=urljoin(url,a['href'])
   if urlsplit(u).hostname=='umschool.net' and urlsplit(u).path.startswith('/course/'):
    found[u]={'id':'um-'+urlsplit(u).path.strip('/').split('/')[-1],'title':a.get_text(' ',strip=True),'sourceUrl':u,'organizer':'Умскул','kind':'recording','reason':'Listed in official free catalogue; verify recording/access on detail page before approval'}
 if not found:raise SourceError('free catalogue selector returned no records')
 pages=set()
 for a in d.select('a[href]'):
  u=urljoin(url,a['href'])
  if re.fullmatch(r'/courses/free/(?:\d+/)?',urlsplit(u).path) and urlsplit(u).hostname=='umschool.net':pages.add(u)
 return list(found.values()),pages

def structured_free_events(text,url):
 d=BeautifulSoup(text,'html.parser');objects=[]
 def visit(x):
  if isinstance(x,list):
   for a in x:visit(a)
  elif isinstance(x,dict):
   types=x.get('@type',[]);types=types if isinstance(types,list) else [types]
   if 'Event' in types or 'EducationEvent' in types:objects.append(x)
   for k in ['@graph','itemListElement','item']: 
    if k in x:visit(x[k])
 for s in d.select('script[type="application/ld+json"]'):
  try:visit(json.loads(s.string or s.get_text()))
  except (ValueError,TypeError):continue
 out=[]
 for x in objects:
  offers=x.get('offers',[]);offers=offers if isinstance(offers,list) else [offers]
  free=x.get('isAccessibleForFree') is True or any(str(o.get('price')) in ['0','0.0','0.00'] for o in offers if isinstance(o,dict))
  if not free or not x.get('startDate') or not x.get('name'):continue
  start=x['startDate']
  if not re.search(r'(?:Z|[+-]\d\d:\d\d)$',start):continue # Never guess year/timezone.
  target=urljoin(url,x.get('url') or url);eid='feed-'+hashlib.sha256(target.encode()).hexdigest()[:14]
  if urlsplit(target).hostname=='foxford.ru':
   m=re.fullmatch(r'/events/(\d+)/?',urlsplit(target).path)
   if m:eid='fox-'+m[1]
  out.append({'id':eid,'title':x['name'],'sourceUrl':target,'kind':'scheduled','start':start,'end':x.get('endDate'),'cancelled':str(x.get('eventStatus','')).endswith('EventCancelled'),'description':BeautifulSoup(x.get('description',''),'html.parser').get_text(' ',strip=True)[:1200],'freeScope':'Бесплатное открытое занятие','reason':'Explicit free Event JSON-LD; verify child audience and unique cover before publication'})
 return out
