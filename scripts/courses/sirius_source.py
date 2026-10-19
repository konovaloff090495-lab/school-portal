"""Public Sirius catalogue and syllabus, with current enrolment checks."""
import hashlib,json,re
from datetime import datetime,timezone
from functools import lru_cache
import requests
from bs4 import BeautifulSoup

BASE='https://edu.sirius.online/noo-back'
FREE_SOURCE='https://sochisirius.ru/obuchenie/distant'

def get_json(url):
    r=requests.get(url,timeout=30);r.raise_for_status();return r.json()

def plain(value):
    return re.sub(r'\s+',' ',BeautifulSoup(value,'html.parser').get_text(' ',strip=True)).strip()

def texts(value):
    if isinstance(value,dict):
        return [s for k,v in value.items() for s in ([plain(v)] if k in ('text','title','caption') and isinstance(v,str) else texts(v))]
    if isinstance(value,list):return [s for v in value for s in texts(v)]
    return []

@lru_cache(maxsize=1)
def opened():return {p['id'] for p in get_json(BASE+'/course/list-full')['opened']}

@lru_cache(maxsize=1)
def free_terms():
    r=requests.get(FREE_SOURCE,timeout=30);r.raise_for_status()
    return bool(re.search(r'бесплатных курсов',plain(r.text),re.I))

def from_course(course,url,checked):
    name=plain(course['name'])
    headings=[plain(m['title']) for m in course.get('module',[])]
    body=' '.join([name]+texts(course.get('landingBlocks',[]))+headings)
    # Dates and syllabus determine the fingerprint, not volatile enrolment counts.
    fingerprint=json.dumps(dict(name=name,body=body,openDate=course.get('openDate'),closeDate=course.get('closeDate'),attendUntil=course.get('attendUntil')),ensure_ascii=False,sort_keys=True)
    return dict(sourceUrl=url,h1=name,meta='',headings=headings,priceContexts=[],ageEvidence=[],text=body,contentHash=hashlib.sha256(fingerprint.encode()).hexdigest(),checkedAt=checked,status=200,accessUntil=course.get('attendUntil','')[:10],courseCloseDate=course.get('closeDate','')[:10],isPublic=course.get('isPublic') is True)

def harvest_public(c):
    url=c['sourceUrl'];m=re.fullmatch(r'https://edu\.sirius\.online/course/(\d+)/?',url)
    if not m:return {**c,'error':'Not a Sirius course URL'}
    try:
        id=int(m[1]);link=get_json(BASE+'/course/'+str(id))
        if link.get('id')!=id:raise ValueError('Course identity mismatch')
        data=get_json(BASE+'/api/v2/content/'+link['hash'])['course']
        result=from_course(data,url,datetime.now(timezone.utc).isoformat())
        result['enrolmentOpen']=id in opened()
        return {**c,**result}
    except (requests.RequestException,ValueError,KeyError,TypeError) as e:return {**c,'error':str(e)[:200]}

def price(source,course,checked,free_confirmed):
    if source.get('status')!=200 or source.get('h1')!=course.get('sourceTitle') or not source.get('isPublic') or not source.get('enrolmentOpen') or not free_confirmed or not course.get('freeAccessEvidence'):return None
    if not source.get('accessUntil') or source['accessUntil']<checked:return None
    return dict(amount=0,unit='курс',**{'from':False},condition='Бесплатное самостоятельное обучение после регистрации. Набор до '+source['accessUntil']+', завершение потока до '+source.get('courseCloseDate','')+'.',evidence='Официальный центр подтверждает бесплатные курсы; программа есть в открытом наборе публичного каталога',checkedAt=checked,sourceUrl=FREE_SOURCE)
