#!/usr/bin/env python3
import datetime as dt,importlib.util,json,sys,time,urllib.request,urllib.error,urllib.parse
from pathlib import Path
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
PORTFOLIO=ROOT.parent
OUT=ROOT/'work/career/monitoring/seo';OUT.mkdir(parents=True,exist_ok=True)
SITE='https://pro-schools.ru';SITEMAP=SITE+'/sitemap-career.xml'
def module(name,file):
 spec=importlib.util.spec_from_file_location(name,file);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
tvmod=module('career_tv',PORTFOLIO/'seo-tools/tv.py')
gscmod=module('career_gsc',PORTFOLIO/'seo-tools/gsc.py')
indexmod=module('career_indexnow',PORTFOLIO/'seo-tools/indexnow.py')
def now():return dt.datetime.now(dt.timezone.utc).isoformat()
def save(name,obj):
 p=OUT/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(obj,ensure_ascii=False,indent=2));return p
def http(url,method='GET',body=None,headers=None,timeout=40):
 h={'User-Agent':'ProSchoolsCareerMonitor/1.0',**(headers or {})}
 if body is not None:h['Content-Type']='application/json; charset=utf-8';body=json.dumps(body,ensure_ascii=False).encode()
 req=urllib.request.Request(url,data=body,headers=h,method=method)
 try:
  with urllib.request.urlopen(req,timeout=timeout) as r:
   raw=r.read();ctype=r.headers.get('Content-Type','');data=None
   try:data=json.loads(raw)
   except (ValueError,UnicodeDecodeError):pass
   return {'status':r.status,'url':r.url,'data':data,'text':raw.decode('utf-8','replace') if data is None else None,'retrieved_at':now()}
 except urllib.error.HTTPError as e:
  raw=e.read().decode('utf-8','replace');data=None
  try:data=json.loads(raw)
  except ValueError:pass
  return {'status':e.code,'data':data,'error':raw[:400],'retrieved_at':now()}
 except Exception as e:return {'status':None,'error':type(e).__name__+': '+str(getattr(e,'reason',''))[:180],'retrieved_at':now()}
_last=[0.]
def tv(method,payload=None):
 delay=1.6-(time.monotonic()-_last[0])
 if delay>0:time.sleep(delay)
 _last[0]=time.monotonic()
 return http('https://api.topvisor.ru/v2/json/'+method,'POST',payload or {},{'User-Id':tvmod.ENV['TOPVISOR_USER_ID'],'Authorization':'bearer '+tvmod.ENV['TOPVISOR_API_KEY']},55)
def ywm(path,method='GET',body=None):return http('https://api.webmaster.yandex.net/v4/user/'+tvmod.YWM_USER+'/'+path,method,body,{'Authorization':'OAuth '+tvmod.YWM_TOKEN},35)
def gsc(path,token,method='GET',body=None):return http('https://www.googleapis.com/webmasters/v3/'+path,method,body,{'Authorization':'Bearer '+token},45)
def manifest():return json.loads((ROOT/'work/career/release-manifest.json').read_text())
