from common import *
import subprocess

def curl(url,method='GET',body=None,headers=None):
 def esc(x):return str(x).replace('\\','\\\\').replace('"','\\"')
 lines=['url = "'+esc(url)+'"','request = "'+method+'"','max-time = 35','connect-timeout = 15']
 for k,v in (headers or {}).items():lines.append('header = "'+esc(k+': '+v)+'"')
 if body is not None:lines+=['header = "Content-Type: application/json"','data = "'+esc(json.dumps(body,ensure_ascii=False))+'"']
 elif method=='PUT':lines.append('header = "Content-Length: 0"')
 try:
  p=subprocess.run(['curl','--silent','--show-error','--interface','en0','--config','-','--write-out','\n%{http_code}'],input='\n'.join(lines),text=True,capture_output=True,timeout=45)
  raw,_,code=p.stdout.rpartition('\n');data=None
  try:data=json.loads(raw) if raw else None
  except ValueError:pass
  return {'status':int(code) if code.isdigit() and int(code)>0 else None,'data':data,'text':raw if data is None else None,'error':p.stderr[:200] if p.returncode else None,'retrieved_at':now(),'transport':'curl-interface-en0'}
 except Exception as e:return {'status':None,'error':type(e).__name__,'retrieved_at':now()}
if __name__=='__main__':
 r=curl('https://api.webmaster.yandex.net/v4/user/'+tvmod.YWM_USER+'/hosts/https:pro-schools.ru:443/recrawl/queue','POST',{'url':SITE+'/proforientaciya/'},{'Authorization':'OAuth '+tvmod.YWM_TOKEN});save('probe/ywm-curl-write.json',r);print('YWM',r,flush=True)
 ping=module('career_ping_curl',PORTFOLIO/'seo-tools/ping_sitemap.py');token=ping.token();es=urllib.parse.quote('sc-domain:pro-schools.ru',safe='');ef=urllib.parse.quote(SITEMAP,safe='');r=curl('https://www.googleapis.com/webmasters/v3/sites/'+es+'/sitemaps/'+ef,'PUT',None,{'Authorization':'Bearer '+token});save('probe/gsc-curl-write.json',r);print('GSC',r,flush=True)
