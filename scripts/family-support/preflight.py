#!/usr/bin/env python3
import json,hashlib
from pathlib import Path
from transport import run
R=Path(__file__).resolve().parents[2];O=R/'work/family-support'
posts=json.loads((O/'posts.json').read_text());slugs=[p['slug'] for p in posts]
code='slugs='+repr(slugs)+'\n'+r'''
import json,hashlib,subprocess
from pathlib import Path
base=Path('/srv/portfolio/proschools');root=(base/'current').resolve()
pid=subprocess.check_output(['systemctl','show','portfolio-site@proschools.service','-p','MainPID','--value']).decode().strip()
assert Path('/proc/'+pid+'/cwd').resolve()==root
items={}
for slug in slugs:
 p=root/'content/blog'/(slug+'.json');items[slug]={'exists':p.exists(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else None,'data':json.loads(p.read_text()) if p.exists() else None}
print(json.dumps({'root':str(root),'pid':pid,'posts':items,'chrome_sha':hashlib.sha256((root/'src/site-navigation/chrome.json').read_bytes()).hexdigest()},ensure_ascii=False))
'''
data=json.loads(run(code));(O/'preflight.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
assert data['chrome_sha']==hashlib.sha256((R/'src/site-navigation/chrome.json').read_bytes()).hexdigest(),'Canonical navigation changed on live host'
baseline=json.loads((O/'baseline-continued.json').read_text())['posts']
for slug,item in data['posts'].items():
 if slug in baseline:
  assert item['sha256']==baseline[slug]['sha256'],'Published article changed concurrently: '+slug
 else:
  assert not item['exists'],'New slug conflicts with existing article: '+slug
print('Preflight OK:',len(posts),'articles;',len(baseline),'reviewed published versions; navigation matches')
