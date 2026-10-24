#!/usr/bin/python3
"""Compatibility client. Database and encryption keys belong to the private operator."""
import os,sys,json,pathlib,fcntl,urllib.request,subprocess,re
configpath=pathlib.Path(os.environ.get('SCHOOL_BRIDGE_CONFIG','/etc/portfolio/proschools/school-bridge.json'))
cfg=json.loads(configpath.read_text());action=sys.argv[1];lock=os.open(cfg['lock'],os.O_RDWR|os.O_CREAT,0o600);os.set_inheritable(lock,True);fcntl.flock(lock,fcntl.LOCK_SH);cfg=json.loads(configpath.read_text())
if cfg['mode']=='legacy':
 env=dict(os.environ);os.execve(sys.executable,[sys.executable,cfg['legacy_script'],action],env)
if action not in ['create','public','get','admin-list','rate','image','confirm','resend','resubmit','feedback','moderate','moderation-note','subscribe','unsubscribe','telegram-secret','telegram-update','telegram-run']:raise SystemExit('Use the private scheduled worker for maintenance')
raw=b'{}' if action=='telegram-run' else sys.stdin.buffer.read(160001)
if len(raw)>160000:raise SystemExit('School operation too large')
payload=json.loads(raw)
# Grant the private moderator read access only to new validated photo files.
if action in ['create','resubmit']:
 id=payload.get('id','');assert re.fullmatch('[a-f0-9]{32}',id)
 root=pathlib.Path(cfg['photos']);directory=root/id
 if directory.is_dir():
  subprocess.run(['/usr/bin/setfacl','-m','u:lead-gerasimov:rx',str(directory)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
  for photo in payload.get('photos',[]):
   name=photo['file'];assert re.fullmatch('[a-f0-9]{32}\.jpg',name);p=directory/name
   if p.is_file() and not p.is_symlink():subprocess.run(['/usr/bin/setfacl','-m','u:lead-gerasimov:r',str(p)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
writer=json.loads(pathlib.Path(cfg['writer_config']).read_text());request=urllib.request.Request(writer['endpoint']+'/school/'+action,data=raw,headers={'Content-Type':'application/json','Authorization':'Bearer '+writer['ingest_token']})
try:
 with urllib.request.urlopen(request,timeout=95 if action=='telegram-run' else 13) as response:result=response.read(2*1024*1024+1)
 if len(result)>2*1024*1024:raise ValueError('Response too large')
 json.loads(result);sys.stdout.buffer.write(result)
except Exception:raise SystemExit('Private school operation temporarily unavailable')
finally:os.close(lock)
