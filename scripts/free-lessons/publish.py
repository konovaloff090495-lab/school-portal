#!/usr/bin/env python3
"""Publish checked static events atomically; never restart Next or modify shared chrome."""
import argparse,hashlib,json,os,re,shutil,time,subprocess,fcntl
from pathlib import Path
from datetime import datetime
import requests
from bs4 import BeautifulSoup
from update import ROOT,MSK,read,write
from render import build

def digest(events,version):
 data=[{k:v for k,v in e.items() if k not in ['scheduleVerifiedAt','lastSeen','sourceMissingCount']} for e in events]
 return hashlib.sha256(json.dumps([data,version],ensure_ascii=False,sort_keys=True).encode()).hexdigest()
def validate(dest):
 metadata=read(dest/'metadata.json',{});pages=list((dest/'besplatnye-uroki').rglob('index.html'));assert len(pages)==len(metadata)
 titles=set();descriptions=set()
 for p in pages:
  d=BeautifulSoup(p.read_text(),'html.parser');route='/'+str(p.parent.relative_to(dest))+'/'
  assert route in metadata and d.select_one('link[rel=canonical]')['href']=='https://pro-schools.ru'+route
  assert len(d.select('h1'))==len(d.select('header'))==len(d.select('footer'))==1
  titles.add(d.title.text);descriptions.add(d.select_one('meta[name=description]')['content'])
  for a in d.select('[href],[src]'):
   u=a.get('href') or a.get('src')
   if u.startswith('/besplatnye-uroki/'):
    u=u.split('?')[0].split('#')[0];target=dest/u.lstrip('/')
    if u.endswith('/'):target=target/'index.html'
    assert target.exists(),(route,u)
  for s in d.select('script[type="application/ld+json"]'):json.loads(s.string)
 assert len(titles)==len(descriptions)==len(metadata)
 return len(pages)

def main():
 p=argparse.ArgumentParser();p.add_argument('--state-dir',type=Path,default=ROOT/'work/free-lessons/state');p.add_argument('--baseline',type=Path,default=ROOT/'public');p.add_argument('--output',type=Path);p.add_argument('--live-root',type=Path);a=p.parse_args();D=a.state_dir
 if (D/'PAUSED').exists():print('Publisher paused');return
 D.mkdir(parents=True,exist_ok=True);lock=(D/'publish.lock').open('w')
 try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
 except BlockingIOError:print('Publisher busy');return
 events=read(D/'catalog.json',[]);assert events,'No refreshed catalogue';version=read(ROOT/'src/site-navigation/chrome.json',{})['version'];new_hash=digest(events,version);last=read(D/'published.json',{})
 if not a.output and last.get('contentHash')==new_hash:print('No publication changes');return
 now=datetime.now(MSK);stamp=now.strftime('%Y%m%d-%H%M%S')+'-'+new_hash[:7]
 if a.live_root:
  assert a.live_root.resolve()==Path('/var/www/school-portal'),'Live root must be the established project'
  r=requests.get('https://pro-schools.ru/',timeout=20);r.raise_for_status()
  if 'data-navigation-version="'+version+'"' not in r.text:raise ValueError('Canonical chrome differs from deployed homepage; deferred')
  dest=a.live_root/'free-lessons-releases'/stamp;baseline=(a.live_root/'free-lessons-current').resolve()
 else:dest=a.output or ROOT/'work/free-lessons/preview';baseline=a.baseline
 if dest.exists():
  if a.live_root:raise ValueError('Release already exists; refusing overwrite')
  shutil.rmtree(dest)
 result=build(events,dest,baseline,now,read(D/'state.json',{}).get('lastFetchAt'));result['pagesChecked']=validate(dest)
 # The service has UMask0077; only the explicitly public subtree is world-readable.
 os.chmod(dest,0o755)
 for p in (dest/'besplatnye-uroki').rglob('*'):
  os.chmod(p,0o755 if p.is_dir() else 0o644)
 os.chmod(dest/'besplatnye-uroki',0o755)
 if not a.live_root:print(json.dumps(result));return
 # Store files and history outside the public /besplatnye-uroki/ location.
 link=a.live_root/'free-lessons-current';previous=str(link.resolve());tmp=a.live_root/'free-lessons-current.pending';assert not tmp.exists();os.symlink(dest,tmp);os.replace(tmp,link)
 try:
  for route in ['/besplatnye-uroki/','/besplatnye-uroki/sitemap.xml','/besplatnye-uroki/search-index.json']:
   r=requests.get('https://pro-schools.ru'+route,timeout=20);r.raise_for_status()
   if route.endswith('/'):
    assert hashlib.sha256(r.content).hexdigest()==hashlib.sha256((dest/'besplatnye-uroki/index.html').read_bytes()).hexdigest(),'Live hash mismatch'
 except Exception:
  rollback=a.live_root/'free-lessons-current.rollback';os.symlink(previous,rollback);os.replace(rollback,link);raise
 result.update(contentHash=new_hash,publishedAt=now.isoformat(),release=str(dest),previous=previous);write(D/'published.json',result)
 with (D/'publications.jsonl').open('a') as f:f.write(json.dumps(result)+'\n')
 # Prune only rebuildable releases from this updater; keep data history and manual releases.
 generated=sorted([p for p in (a.live_root/'free-lessons-releases').iterdir() if p.is_dir() and not p.is_symlink() and re.fullmatch(r'\d{8}-\d{6}-[a-f0-9]{7}',p.name)],reverse=True)
 for p in generated[20:]:
  if str(p) not in [str(dest),previous] and p.resolve().parent==(a.live_root/'free-lessons-releases').resolve():shutil.rmtree(p)
 print(json.dumps(result))
if __name__=='__main__':main()
