#!/usr/bin/env python3
"""Independent read-only checks. Secrets stay in Actions; no successful heartbeat messages."""
import base64,datetime as dt,hashlib,json,os,pathlib,urllib.request,urllib.parse
UTC=dt.timezone.utc
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):return None

def inspect(fetch,now):
 issues=[];health=None
 try:
  health=fetch('health');stamp=dt.datetime.fromisoformat(health['checked_at'].replace('Z','+00:00'))
  age=(now-stamp).total_seconds()
  if age>35*60 or age < -300:issues.append('heartbeat_stale')
 except Exception:issues.append('heartbeat_unavailable')
 known=set(health.get('issues',[])) if health and 'heartbeat_stale' not in issues else set()
 for label in ['proschools','delomba','cardopen']:
  code={'proschools':'website_https_unavailable','delomba':'dela_mba_https_unavailable','cardopen':'card_open_https_unavailable'}[label]
  try:fetch(label)
  except Exception:
   if code not in known:issues.append(code)
 return sorted(set(issues))

def transition(previous,issues):
 fingerprint=hashlib.sha256(json.dumps(issues).encode()).hexdigest()
 return fingerprint, previous.get('fingerprint')!=fingerprint and bool(issues or previous.get('issues'))

def main():
 urls={'health':os.environ['PORTFOLIO_MONITOR_URL'],'proschools':'https://pro-schools.ru/','delomba':'https://delo.mba/','cardopen':'https://card-open.ru/'}
 auth=base64.b64encode((os.environ['PORTFOLIO_MONITOR_USER']+':'+os.environ['PORTFOLIO_MONITOR_PASSWORD']).encode()).decode()
 def fetch(label):
  req=urllib.request.Request(urls[label],headers={'User-Agent':'Portfolio-independent-watch/1.0',**({'Authorization':'Basic '+auth} if label=='health' else {})},method='GET' if label=='health' else 'HEAD')
  opener=urllib.request.build_opener(NoRedirect()) if label=='health' else urllib.request.build_opener()
  with opener.open(req,timeout=20) as r:
   if r.status!=200:raise ValueError('not_healthy')
   return json.loads(r.read(16384)) if label=='health' else True
 issues=inspect(fetch,dt.datetime.now(UTC));file=pathlib.Path('.portfolio-monitor/state.json');file.parent.mkdir(exist_ok=True)
 previous=json.loads(file.read_text()) if file.exists() else {};fingerprint,send=transition(previous,issues)
 if send:
  labels={'heartbeat_unavailable':'Не удалось связаться с рабочим сервером','heartbeat_stale':'Рабочий сервер перестал обновлять состояние защиты','website_https_unavailable':'ProSchools недоступен извне','dela_mba_https_unavailable':'DELA MBA недоступен извне','card_open_https_unavailable':'Card Open недоступен извне'}
  message='Независимый контроль сайтов: '+('\n'+'\n'.join('• '+labels[x] for x in issues) if issues else 'связь и доступность восстановлены.')
  req=urllib.request.Request('https://api.telegram.org/bot'+os.environ['PORTFOLIO_ALERT_BOT_TOKEN']+'/sendMessage',data=urllib.parse.urlencode({'chat_id':os.environ['PORTFOLIO_ALERT_CHAT_ID'],'text':message}).encode())
  try:
   with urllib.request.urlopen(req,timeout=20) as r:assert json.load(r).get('ok')
  except Exception:raise SystemExit('Alert delivery failed; credentials omitted')
 file.write_text(json.dumps({'checked_at':dt.datetime.now(UTC).isoformat(),'issues':issues,'fingerprint':fingerprint}))
 print(json.dumps({'healthy':not issues,'issues':issues,'notification_sent':send}))
if __name__=='__main__':main()
