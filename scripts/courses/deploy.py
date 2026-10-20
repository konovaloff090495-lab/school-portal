#!/usr/bin/env python3
"""Publish only the standalone /kursy/ release, preserving the Next runtime."""
import argparse, hashlib, json, os, shlex, subprocess, time
from datetime import datetime
from pathlib import Path
import requests

ROOT=Path(__file__).resolve().parents[2]
REMOTE='/var/www/school-portal'
HOST='root@45.80.70.209'
def run(args,**kw):return subprocess.run(args,check=True,text=True,**kw)

def deploy(socket):
    ssh=['ssh','-i',str(Path.home()/'.ssh/id_ed25519'),'-o','ConnectTimeout=20']
    if socket:ssh+=['-S',socket]
    def remote(cmd,capture=False):return run(ssh+[HOST,cmd],capture_output=capture)
    runtime=REMOTE+'/courses-runtime'
    remote(f'mkdir -p {runtime}/scripts/courses {runtime}/data/courses {runtime}/work/courses')
    # Never replace a more recently verified live price with an old local snapshot.
    live=remote(f'if test -f {runtime}/data/courses/catalog.json; then cat {runtime}/data/courses/catalog.json; fi',True).stdout
    if live:
        live_by_id={c['id']:c for c in json.loads(live)}
        local_path=ROOT/'data/courses/catalog.json';local=json.loads(local_path.read_text());changed=False
        for c in local:
            old=live_by_id.get(c['id'])
            if not old or old.get('sourceTitle')!=c.get('sourceTitle'):continue
            for field in ['price','offer']:
                a=old.get(field);b=c.get(field)
                if a and a.get('checkedAt','')>(b or {}).get('checkedAt',''):
                    c[field]=a;changed=True
        if changed:local_path.write_text(json.dumps(local,ensure_ascii=False,indent=2)+'\n')
    run(['python3','scripts/courses/build.py'],cwd=ROOT)
    run(['python3','scripts/courses/check.py'],cwd=ROOT)
    release=REMOTE+'/courses-releases/'+datetime.now().strftime('%Y%m%d-%H%M%S')+'-catalog'
    remote(f'mkdir -p {release}/kursy')
    rsync_ssh=shlex.join(ssh)
    run(['rsync','-az','--checksum','-e',rsync_ssh,str(ROOT/'public/kursy')+'/',HOST+':'+release+'/kursy/'])
    remote(f'mkdir -p {runtime}/src/site-navigation')
    run(['rsync','-az','-e',rsync_ssh,str(ROOT/'src/site-navigation')+'/',HOST+':'+runtime+'/src/site-navigation/'])
    run(['rsync','-az','--exclude=__pycache__/','-e',rsync_ssh,str(ROOT/'scripts/courses')+'/',HOST+':'+runtime+'/scripts/courses/'])
    run(['rsync','-az','--exclude=review-queue.json','-e',rsync_ssh,str(ROOT/'data/courses')+'/',HOST+':'+runtime+'/data/courses/'])
    robots=requests.get('https://pro-schools.ru/robots.txt',timeout=30)
    robots.raise_for_status()
    if 'User-Agent:' not in robots.text:raise ValueError('Invalid current robots.txt')
    robots_text=robots.text
    if 'https://pro-schools.ru/kursy/sitemap.xml' not in robots_text:robots_text+='\nSitemap: https://pro-schools.ru/kursy/sitemap.xml\n'
    if 'https://pro-schools.ru/sitemap-course-articles.xml' not in robots_text:robots_text+='\nSitemap: https://pro-schools.ru/sitemap-course-articles.xml\n'
    robots_path=ROOT/'work/courses/robots.txt';robots_path.write_text(robots_text)
    run(['rsync','-az','-e',rsync_ssh,str(robots_path),HOST+':'+release+'/robots.txt'])
    remote(f'cd {runtime} && COURSES_CHECK_DIR={release}/kursy .venv/bin/python scripts/courses/check.py')
    previous=remote(f'readlink -f {REMOTE}/courses-current || true',True).stdout.strip()
    remote(f'ln -s {release} {REMOTE}/courses-current.next && mv -Tf {REMOTE}/courses-current.next {REMOTE}/courses-current')
    install=remote(f'python3 {runtime}/scripts/courses/install-nginx.py',True)
    print(install.stdout)
    try:
        expected=hashlib.sha256((ROOT/'public/kursy/index.html').read_bytes()).hexdigest()
        # A graceful nginx reload returns before the new workers accept traffic.
        for attempt in range(4):
            response=requests.get('https://pro-schools.ru/kursy/',timeout=40,headers={'Connection':'close'})
            if response.ok and hashlib.sha256(response.content).hexdigest()==expected:break
            if attempt<3:time.sleep(1)
        response.raise_for_status()
        if hashlib.sha256(response.content).hexdigest()!=expected:raise ValueError('Published HTML hash does not match the release')
    except Exception:
        if previous and previous!=REMOTE+'/courses-current':remote(f'ln -s {shlex.quote(previous)} {REMOTE}/courses-current.rollback && mv -Tf {REMOTE}/courses-current.rollback {REMOTE}/courses-current')
        raise
    report={'release':release,'previous':previous,'htmlSha256':expected,'url':'https://pro-schools.ru/kursy/'}
    (ROOT/'work/courses/deployment.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--socket',default=os.environ.get('COURSES_SSH_SOCKET'));args=parser.parse_args();deploy(args.socket)
