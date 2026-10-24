#!/usr/bin/python3
"""Compatibility bridge. Public Next never receives the subscriber decryption key."""
import os,sys,json,fcntl,pathlib,urllib.request
p=pathlib.Path(os.environ.get('MAILER_BRIDGE_CONFIG','/etc/portfolio/proschools/mailer-bridge.json'))
config=json.loads(p.read_text())
if len(sys.argv)!=2:raise SystemExit('Unsupported mail operation')
action=sys.argv[1]
lock=os.open(config['lock'],os.O_RDWR|os.O_CREAT,0o600);os.set_inheritable(lock,True);fcntl.flock(lock,fcntl.LOCK_SH)
# Reload after obtaining the shared lock: a completed handoff may have changed modes.
config=json.loads(p.read_text())
if config['mode']=='legacy':
 if action not in ('enroll','confirm','unsubscribe','reserve-welcome','run','status'):raise SystemExit('Unsupported mail operation')
 env=dict(os.environ);env['CRM_MAILER_DB']=config['legacy_db'];os.execve(sys.executable,[sys.executable,config['legacy_script'],action],env)
if config['mode']!='private' or action not in ('enroll','confirm','unsubscribe','reserve-welcome'):raise SystemExit('Use the private operator service for maintenance')
writer=json.loads(pathlib.Path(config['writer_config']).read_text());body=sys.stdin.buffer.read(65537)
if len(body)>65536:raise SystemExit('Mail operation too large')
try:
 req=urllib.request.Request(writer['endpoint']+'/mail/'+action,data=body,headers={'Content-Type':'application/json','Authorization':'Bearer '+writer['ingest_token']})
 with urllib.request.urlopen(req,timeout=3.5) as response:result=json.load(response)
 if not isinstance(result.get('status'),str):raise ValueError('Invalid receipt')
 print(json.dumps(result,ensure_ascii=False))
except Exception:raise SystemExit('Private mail operation temporarily unavailable')
finally:os.close(lock)
