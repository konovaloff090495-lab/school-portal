"""Publish catalog HTML/assets on the clean host, retaining native school pages and sitemap.

No build, service restart, Nginx edit, or access to runtime credentials is needed.
The previous directory/release is retained for rollback.
"""
import io, json, os, subprocess, tarfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HOST = 'portfolio-admin@155.212.140.76'
SSH = ['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=20', '-i', str(Path.home()/'.ssh/portfolio_security_20261024')]
if os.environ.get('PROGRAMMING_SSH_SOCKET'):
    SSH += ['-S', os.environ['PROGRAMMING_SSH_SOCKET']]
stamp = datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')+'-catalog'
package = ROOT/'work/programming'/('publish-'+stamp+'.tar.gz')
subprocess.run(['python3', 'scripts/programming/check.py'], cwd=ROOT, check=True)
with tarfile.open(package, 'w:gz') as tar:
    for part in ['shkoly', '_programming']:
        tar.add(ROOT/'work/programming/release'/part, arcname='public/'+part)
    for part in ['build.py', 'assets', 'README.md', 'publish-clean.py']:
        tar.add(ROOT/'scripts/programming'/part, arcname='source/'+part)
remote_package='/tmp/proschools-programming-'+stamp+'.tar.gz'
with package.open('rb') as stream:
    subprocess.run(SSH+[HOST, 'cat > '+remote_package], stdin=stream, check=True)
remote = r'''
import ctypes,hashlib,json,os,re,shutil,subprocess,tarfile
from pathlib import Path
base=Path('/srv/portfolio/proschools');runtime=base/'static-runtime';current=runtime/'work/programming/release'
stamp=STAMP;package=Path(PACKAGE);root=base/'static/programming-releases'/stamp;payload=root/'payload';candidate=root/'public'
root.mkdir(parents=True,exist_ok=False);root.parent.chmod(0o755);payload.mkdir()
with tarfile.open(package) as t:t.extractall(payload,filter='data')
shutil.copytree(current,candidate,symlinks=True)
shutil.copytree(payload/'public',candidate,dirs_exist_ok=True)
oldpaths={p.relative_to(current) for p in (current/'shkoly').rglob('index.html')}
newpaths={p.relative_to(candidate) for p in (candidate/'shkoly').rglob('index.html')}
assert oldpaths==newpaths,'Catalog paths changed'
def seo(p):
 s=p.read_text()
 return [re.findall(x,s) for x in [r'<title>.*?</title>',r'<meta name="(?:description|robots)"[^>]*>',r'<link rel="canonical"[^>]*>',r'<h1>.*?</h1>',r'<script type="application/ld\+json">.*?</script>']]
for p in oldpaths:assert seo(current/p)==seo(candidate/p),'SEO changed: '+str(p)
assert (current/'sitemap.xml').read_bytes()==(candidate/'sitemap.xml').read_bytes(),'Sitemap changed'
for p in candidate.rglob('*'):
 if not p.is_symlink():p.chmod(0o755 if p.is_dir() else 0o644)
candidate.chmod(0o755);root.chmod(0o755)
previous=str(current.resolve())
link=current.with_name('release.next-'+stamp);link.symlink_to(candidate)
if current.is_symlink():os.replace(link,current)
else:
 libc=ctypes.CDLL(None,use_errno=True)
 result=libc.renameat2(-100,os.fsencode(link),-100,os.fsencode(current),2)
 if result:raise OSError(ctypes.get_errno(),'Atomic directory exchange failed')
 previous=str(current.with_name('release.before-'+stamp));os.rename(link,previous)
try:
 for path in ['/shkoly/tomsk/programmirovanie/','/shkoly/moskva/programmirovanie/','/shkoly/tipy/programmirovanie/online/','/_programming/fonts.css']:
  data=subprocess.check_output(['curl','--fail','--silent','--show-error','--max-time','30','--resolve','pro-schools.ru:443:127.0.0.1','https://pro-schools.ru'+path])
  local=candidate/path.lstrip('/')
  if local.is_dir():local=local/'index.html'
  assert hashlib.sha256(data).digest()==hashlib.sha256(local.read_bytes()).digest(),'Live content mismatch: '+path
except Exception:
 rollback=current.with_name('release.rollback-'+stamp);rollback.symlink_to(previous);os.replace(rollback,current);raise
shutil.copytree(payload/'source',runtime/'scripts/programming',dirs_exist_ok=True)
print(json.dumps({'release':str(candidate),'previous':previous,'catalogPages':len(oldpaths),'sitemap':'unchanged'}))
'''.replace('STAMP', repr(stamp)).replace('PACKAGE',repr(remote_package))
result=subprocess.run(SSH+[HOST, 'sudo -n python3 -'], input=remote, text=True, check=True, capture_output=True)
print(result.stdout.strip())
(ROOT/'work/programming/deployment-clean.json').write_text(result.stdout)
