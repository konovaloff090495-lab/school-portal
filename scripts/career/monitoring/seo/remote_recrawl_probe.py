"""Read/write network fallback through the already-used trusted VPS; no files there."""
from common import *
import shlex,subprocess
code='''import json,sys,urllib.request,urllib.error,datetime
x=json.load(sys.stdin);base='https://api.webmaster.yandex.net/v4/user/'+x['user']+'/hosts/https:pro-schools.ru:443/'
def api(path,body=None):
 req=urllib.request.Request(base+path,data=json.dumps(body).encode() if body is not None else None,headers={'Authorization':'OAuth '+x['token'],'Content-Type':'application/json'},method='POST' if body is not None else 'GET')
 try:
  with urllib.request.urlopen(req,timeout=25) as r:return {'status':r.status,'data':json.load(r)}
 except urllib.error.HTTPError as e:return {'status':e.code,'error':e.read().decode()[:120]}
 except Exception as e:return {'status':None,'error':type(e).__name__}
q=api('recrawl/quota');out={'quota_before':q,'url':x['url'],'retrieved_at':datetime.datetime.now(datetime.timezone.utc).isoformat()}
if q.get('status')==200 and q.get('data',{}).get('quota_remainder',0)>20:out['post']=api('recrawl/queue',{'url':x['url']})
out['quota_after']=api('recrawl/quota');print(json.dumps(out))
'''
payload={'user':tvmod.YWM_USER,'token':tvmod.YWM_TOKEN,'url':SITE+'/proforientaciya/'}
p=subprocess.run(['ssh','-B','en0','-i',str(Path.home()/'.ssh/portfolio_security_20261024'),'-o','ControlPath=/tmp/ps-career-20261106.sock','-o','ConnectTimeout=15','-o','BatchMode=yes','portfolio-admin@90.156.159.51','sudo -n python3 -c '+shlex.quote(code)],input=json.dumps(payload),text=True,capture_output=True,timeout=75)
try:r=json.loads(p.stdout)
except ValueError:r={'status':None,'error':'ssh_network_or_auth','returncode':p.returncode}
save('submission/ywm-remote-probe.json',r);print(json.dumps(r,ensure_ascii=False))
