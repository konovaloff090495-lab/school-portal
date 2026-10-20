"""Atomically publish a checked programming-only release, with rollback."""
import json,os,subprocess,shlex,time,hashlib,fcntl
from pathlib import Path
from datetime import datetime
import requests
ROOT=Path(__file__).resolve().parents[2];WORK=ROOT/'work/programming';HOST='root@45.80.70.209';REMOTE='/var/www/school-portal'
def run(args,**kw):return subprocess.run(args,check=True,text=True,**kw)
lock=(WORK/'deploy.lock').open('w')
fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
socket=os.environ.get('PROGRAMMING_SSH_SOCKET','/tmp/proschools-prog-20261019.sock')
SSH=['ssh','-S',socket,'-o','ControlMaster=no','-o','ConnectTimeout=20','-i',str(Path.home()/'.ssh/id_ed25519')]
def remote(cmd,capture=False):return run(SSH+[HOST,cmd],capture_output=capture)
run(['python3','scripts/programming/check.py'],cwd=ROOT)
release=REMOTE+'/programming-releases/'+datetime.now().strftime('%Y%m%d-%H%M%S')
remote('mkdir -p '+release+' '+REMOTE+'/programming-runtime/scripts/programming')
run(['rsync','-az','--checksum','-e',shlex.join(SSH),str(WORK/'release')+'/',HOST+':'+release+'/'])
run(['rsync','-az','--exclude=__pycache__/','-e',shlex.join(SSH),str(ROOT/'scripts/programming')+'/',HOST+':'+REMOTE+'/programming-runtime/scripts/programming/'])
remote('python3 '+REMOTE+'/programming-runtime/scripts/programming/refresh-sitemap.py --release '+release)
previous=remote('readlink -f '+REMOTE+'/programming-current || true',True).stdout.strip()
remote('ln -s '+release+' '+REMOTE+'/programming-current.next && mv -Tf '+REMOTE+'/programming-current.next '+REMOTE+'/programming-current')
try:
 remote('python3 '+REMOTE+'/programming-runtime/scripts/programming/install-nginx.py')
 expected=hashlib.sha256((WORK/'release/shkoly/tipy/programmirovanie/index.html').read_bytes()).hexdigest()
 for i in range(4):
  r=requests.get('https://pro-schools.ru/shkoly/tipy/programmirovanie/',timeout=40,headers={'Connection':'close'})
  if r.ok and hashlib.sha256(r.content).hexdigest()==expected:break
  if i<3:time.sleep(1)
 r.raise_for_status()
 if hashlib.sha256(r.content).hexdigest()!=expected:raise ValueError('Live HTML does not match programming release')
except Exception:
 if previous and previous!=REMOTE+'/programming-current':remote('ln -s '+shlex.quote(previous)+' '+REMOTE+'/programming-current.rollback && mv -Tf '+REMOTE+'/programming-current.rollback '+REMOTE+'/programming-current')
 raise
report={'release':release,'previous':previous,'htmlSha256':expected}
(WORK/'deployment.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
