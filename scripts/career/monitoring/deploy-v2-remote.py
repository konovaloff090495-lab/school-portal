#!/usr/bin/env python3
"""Small telemetry release. Run as root on the verified production host only."""
from pathlib import Path
import datetime,fcntl,hashlib,json,os,shutil,sqlite3,subprocess,time,urllib.request
BASE=Path('/srv/portfolio/proschools/static/career')
IN=BASE/'monitoring-incoming'
DEST=Path('/usr/local/lib/proschools-career')
NAV=Path('/srv/portfolio/proschools/current/public/site-navigation/navigation.js')
CURRENT=BASE/'current'
def run(*a):return subprocess.run(a,check=True,capture_output=True,text=True)
def atomic(p,data):
 st=p.stat() if p.exists() else None
 t=p.with_name(p.name+'.measurement-next');t.write_bytes(data)
 os.chmod(t,(st.st_mode&0o777) if st else 0o644)
 if st:os.chown(t,st.st_uid,st.st_gid)
 os.replace(t,p)
def health():
 for n in range(20):
  try:
   with urllib.request.urlopen('http://127.0.0.1:8795/api/career/health/',timeout=3) as r:
    assert r.status==200 and json.load(r)['ok'];return
  except Exception:
   if n==19:raise
   time.sleep(.5)
assert os.geteuid()==0 and run('hostname').stdout.strip()=='portfolio-reserve-20261102'
m=json.loads((IN/'manifest.json').read_text());assert m['version']=='20261106.2'
release=BASE/'releases'/m['version'];assert not release.exists(),'Immutable release already exists'
for f in m['files']:
 p=(IN/'release'/f['path']).resolve();assert (IN/'release').resolve() in p.parents
 assert hashlib.sha256(p.read_bytes()).hexdigest()==f['sha256']
assert shutil.disk_usage(BASE).free>20*1024*1024
with open('/var/lock/proschools-career-release.lock','w') as lock:
 fcntl.flock(lock,fcntl.LOCK_EX)
 backup=BASE/'backups'/('measurement-'+datetime.datetime.now().strftime('%Y%m%d-%H%M%S'));backup.mkdir(mode=0o700)
 files=[DEST/'server.mjs',DEST/'store.mjs',DEST/'measurement-paths.json',NAV]
 originals={p:p.read_bytes() if p.exists() else None for p in files}
 oldlink=os.readlink(CURRENT);(backup/'previous-current.txt').write_text(oldlink)
 for i,(p,data) in enumerate(originals.items()):
  if data is not None:(backup/str(i)).write_bytes(data)
 (backup/'files.json').write_text(json.dumps([str(p) for p in files]))
 db=sqlite3.connect('file:/var/lib/proschools-career/career.sqlite3?mode=ro',uri=True)
 copy=sqlite3.connect(backup/'pre-migration.sqlite3');db.backup(copy);copy.close();db.close()
 os.chmod(backup/'pre-migration.sqlite3',0o600)
 try:
  for name in ['server.mjs','store.mjs','measurement-paths.json']:atomic(DEST/name,(IN/'service'/name).read_bytes())
  run('systemctl','restart','proschools-career');health()
  shutil.copytree(IN/'release',release)
  bootstrap=(IN/'legacy-bootstrap.js').read_text();raw=originals[NAV].decode()
  assert 'PS_CAREER_MEASUREMENT_BEGIN' not in raw
  atomic(NAV,(raw+'\n'+bootstrap).encode())
  link=BASE/'current.measurement-next';link.unlink(missing_ok=True);link.symlink_to(release);os.replace(link,CURRENT)
  for path in ['/proforientaciya/','/career-assets/client.js','/career-assets/legacy-entry.js','/proforientaciya/obrabotka-dannyh/']:
   with urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:8080'+path,headers={'Host':'pro-schools.ru'}),timeout=20) as r:assert r.status==200
  db=sqlite3.connect('file:/var/lib/proschools-career/career.sqlite3?mode=ro',uri=True)
  meta=dict(db.execute('SELECT key,value FROM funnel_meta'));db.close()
  report={'version':m['version'],'verified':True,'backup':str(backup),'tracking_meta':meta,'legacy_bootstrap_pages':9,'service_restarted':True,'site_restarted':False}
  (BASE/'measurement-deployed.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
 except Exception:
  for p,data in originals.items():
   if data is None:p.unlink(missing_ok=True)
   else:atomic(p,data)
  link=BASE/'current.rollback';link.unlink(missing_ok=True);link.symlink_to(oldlink);os.replace(link,CURRENT)
  run('systemctl','restart','proschools-career');health()
  raise
