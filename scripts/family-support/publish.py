#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Publish scoped catalogue + native posts; merge live indexes under their existing lock."""
from pathlib import Path
import json,subprocess,hashlib
from transport import SSH,run
R=Path(__file__).resolve().parents[2];O=R/'work/family-support'
pre=json.loads((O/'preflight.json').read_text());posts=json.loads((O/'posts.json').read_text())
payload={'root':pre['root'],'chrome_sha':pre['chrome_sha'],'posts':posts,'before':{k:v['sha256'] for k,v in pre['posts'].items()},'catalog':(R/'public/podderzhka-semej/index.html').read_text(),'source_commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=R).decode().strip()}
remote='/tmp/proschools-family-support-20261031.json'
r=subprocess.run(SSH+['cat > '+remote],input=json.dumps(payload,ensure_ascii=False).encode(),capture_output=True);assert r.returncode==0,r.stderr
code=r'''
import json,hashlib,fcntl,os,subprocess,shutil,time,xml.etree.ElementTree as ET
from pathlib import Path
base=Path('/srv/portfolio/proschools');lock=(base/'blog-content-publish.lock').open('a');fcntl.flock(lock,fcntl.LOCK_EX)
data=json.loads(Path('/tmp/proschools-family-support-20261031.json').read_text());root=(base/'current').resolve();assert str(root)==data['root'],'Release changed'
pid=subprocess.check_output(['systemctl','show','portfolio-site@proschools.service','-p','MainPID','--value']).decode().strip();assert Path('/proc/'+pid+'/cwd').resolve()==root,'Runtime root mismatch'
assert hashlib.sha256((root/'src/site-navigation/chrome.json').read_bytes()).hexdigest()==data['chrome_sha'],'Canonical navigation changed after preflight'
for p in data['posts']:
 f=root/'content/blog'/(p['slug']+'.json');before=data['before'][p['slug']]
 assert (before is None and not f.exists()) or (before and f.exists() and hashlib.sha256(f.read_bytes()).hexdigest()==before),'Concurrent article change: '+p['slug']
attempt=time.strftime('%H%M%S',time.gmtime());backup=base/'archives'/('family-support-20261031-'+attempt);backup.mkdir(exist_ok=False)
def write(f,b):
 f=f.resolve();f.parent.mkdir(parents=True,exist_ok=True);tmp=f.with_name(f.name+'.family-tmp');tmp.write_bytes(b if isinstance(b,bytes) else b.encode());tmp.chmod(0o644);os.replace(tmp,f)
def dump(x):return json.dumps(x,ensure_ascii=False,indent=2)+'\n'
paths=['content/blog/'+p['slug']+'.json' for p in data['posts']]+['content/blog/index.json','public/site-navigation/search-index.js']
resolved={}
for name in paths:
 f=root/name;resolved[name]=str(f.resolve());dest=backup/name
 if f.exists():dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(f,dest)
sitemap=base/'static-runtime/work/programming/release/sitemap.xml';sm_before=sitemap.read_bytes();(backup/'sitemap-before.xml').write_bytes(sm_before)
nginx=Path('/etc/nginx/sites-enabled/proschools-clean').resolve();nginx_before=nginx.read_text();(backup/'nginx-before.conf').write_text(nginx_before)
snippet=Path('/etc/nginx/snippets/proschools-family-support.conf');snippet_before=snippet.read_text() if snippet.exists() else None
catalog_base=base/'static/family-support';catalog_base.mkdir(parents=True,exist_ok=True);catalog_base.chmod(0o755);release=catalog_base/('releases/20261031-'+attempt);release.mkdir(parents=True,exist_ok=False);release.parent.chmod(0o755);release.chmod(0o755);write(release/'index.html',data['catalog'])
link=catalog_base/'current';previous_catalog=str(link.resolve()) if link.exists() else None
served_search=base/'static/navigation/site-navigation/search-index.js'
served_search_before=served_search.read_bytes() if served_search.exists() and served_search.resolve()!=(root/'public/site-navigation/search-index.js').resolve() else None
if served_search_before is not None:(backup/'served-search-before.js').write_bytes(served_search_before)
try:
 by={p['slug']:p for p in data['posts']}
 for slug,p in by.items():write(root/'content/blog'/(slug+'.json'),dump(p))
 f=root/'content/blog/index.json';rows=json.loads(f.read_text());before_slugs={p['slug'] for p in rows};assert len(rows)==len(before_slugs)
 rows=[{k:v for k,v in by.get(p['slug'],p).items() if k not in ['content','suProduct','suPath']} for p in rows]
 rows.extend({k:v for k,v in p.items() if k not in ['content','suProduct','suPath']} for slug,p in by.items() if slug not in before_slugs)
 assert before_slugs<={p['slug'] for p in rows};assert len(rows)==len(before_slugs)+sum(slug not in before_slugs for slug in by);write(f,dump(rows));manifest_count=len(rows)
 f=root/'public/site-navigation/search-index.js';prefix='window.PRO_SEARCH_INDEX=';rows=json.loads(f.read_text().removeprefix(prefix).rstrip(';\n'));before_urls={p['u'] for p in rows};normalized={u.replace('https://pro-schools.ru',''):i for i,u in enumerate(p['u'] for p in rows)}
 for slug,p in by.items():
  u='/blog/'+slug+'/';entry=dict(t=p['title'],u=u,y='page',s='Помощь семьям',k=' '.join(p['tags']),region='')
  if u in normalized:rows[normalized[u]]={**rows[normalized[u]],**entry,'u':rows[normalized[u]]['u']}
  else:rows.append(entry)
 if '/podderzhka-semej/' not in normalized:rows.append(dict(t='Пособия, льготы и субсидии семьям с детьми',u='/podderzhka-semej/',y='page',s='Помощь семьям',k='поддержка пособия льготы выплаты дети семья',region=''))
 assert before_urls<={p['u'] for p in rows};write(f,prefix+json.dumps(rows,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')+';\n');search_count=len(rows)
 if served_search_before is not None:
  assert served_search.read_bytes()==served_search_before,'Concurrent served search writer'
  prefix='window.PRO_SEARCH_INDEX=';current=json.loads(served_search_before.decode().removeprefix(prefix).rstrip(';\n'));known={x['u'].replace('https://pro-schools.ru',''):i for i,x in enumerate(current)};urls_kept={x['u'] for x in current}
  for slug,p in by.items():
   path='/blog/'+slug+'/';entry=dict(t=p['title'],u=path,y='page',s='Помощь семьям',k=' '.join(p['tags']),region='')
   if path in known:current[known[path]]={**current[known[path]],**entry,'u':current[known[path]]['u']}
   else:current.append(entry)
  if '/podderzhka-semej/' not in known:current.append(dict(t='Пособия, льготы и субсидии семьям с детьми',u='/podderzhka-semej/',y='page',s='Помощь семьям',k='поддержка пособия льготы выплаты дети семья',region=''))
  assert urls_kept<={x['u'] for x in current};write(served_search,prefix+json.dumps(current,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')+';\n');search_count=len(current)
 ns='http://www.sitemaps.org/schemas/sitemap/0.9';ET.register_namespace('',ns);tree=ET.fromstring(sm_before);elems={e.find('{'+ns+'}loc').text:e for e in tree};urls_before=set(elems)
 for path in ['/podderzhka-semej/']+['/blog/'+slug+'/' for slug in by]:
  u='https://pro-schools.ru'+path
  if u not in elems:
   e=ET.SubElement(tree,'{'+ns+'}url');ET.SubElement(e,'{'+ns+'}loc').text=u;elems[u]=e
  e=elems[u];lm=e.find('{'+ns+'}lastmod')
  if lm is None:lm=ET.SubElement(e,'{'+ns+'}lastmod')
  lm.text='2026-10-31'
 assert urls_before<=set(elems);assert sitemap.read_bytes()==sm_before,'Concurrent sitemap writer';write(sitemap,ET.tostring(tree,encoding='utf-8',xml_declaration=True))
 temp=catalog_base/'current.next';temp.symlink_to(release);os.replace(temp,link)
 write(snippet,'location = /podderzhka-semej { return 301 /podderzhka-semej/$is_args$args; }\nlocation = /podderzhka-semej/index.html { return 301 /podderzhka-semej/$is_args$args; }\nlocation = /podderzhka-semej/ {\n root /srv/portfolio/proschools/static/family-support/current;\n try_files /index.html =404;\n default_type text/html;\n add_header Cache-Control "public, max-age=300, must-revalidate" always;\n add_header X-Content-Type-Options nosniff always;\n add_header Referrer-Policy strict-origin-when-cross-origin always;\n}\n')
 include='include /etc/nginx/snippets/proschools-family-support.conf;'
 if include not in nginx_before:
  anchor=' include /etc/nginx/snippets/proschools-language-practice.conf;';assert nginx_before.count(anchor)==1;assert nginx.read_text()==nginx_before,'Concurrent nginx editor';write(nginx,nginx_before.replace(anchor,anchor+'\n '+include))
 subprocess.run(['nginx','-t'],check=True,capture_output=True);subprocess.run(['systemctl','reload','nginx'],check=True)
 valid=False
 for check in range(10):
  probe=subprocess.run(['curl','--fail','--silent','--show-error','--max-time','20','--resolve','pro-schools.ru:443:127.0.0.1','https://pro-schools.ru/podderzhka-semej/'],capture_output=True)
  if probe.returncode==0 and hashlib.sha256(probe.stdout).hexdigest()==hashlib.sha256(data['catalog'].encode()).hexdigest():valid=True;break
  time.sleep(0.5)
 assert valid,'Catalogue response did not match after Nginx reload'
 assert (base/'current').resolve()==root
except Exception:
 for name in paths:
  dest=Path(resolved[name])
  if (backup/name).exists():shutil.copy2(backup/name,dest)
  elif dest.exists():dest.unlink()
 sitemap.write_bytes(sm_before)
 if served_search_before is not None:served_search.write_bytes(served_search_before)
 if previous_catalog:
  temp=catalog_base/'rollback.next';temp.symlink_to(previous_catalog);os.replace(temp,link)
 elif link.exists():link.unlink()
 nginx.write_text(nginx_before)
 if snippet_before is not None:snippet.write_text(snippet_before)
 elif snippet.exists():snippet.unlink()
 subprocess.run(['nginx','-t'],check=True,capture_output=True);subprocess.run(['systemctl','reload','nginx'],check=True);raise
env={}
for line in Path('/etc/portfolio/proschools/runtime.env').read_text().splitlines():
 if '=' in line:k,v=line.split('=',1);env[k]=v.strip().strip('"').strip("'")
config='header = "Authorization: '+env['ADMIN_SECRET']+'"\n';revalidated=[]
for i,p in enumerate(data['posts']):
 if i:time.sleep(3.2)
 r=subprocess.run(['curl','--config','-','--resolve','pro-schools.ru:443:127.0.0.1','--silent','--show-error','--max-time','25','-X','POST','-H','Content-Type: application/json','--data',json.dumps({'slug':p['slug']}),'https://pro-schools.ru/api/revalidate/','-w','\n%{http_code}'],input=config,text=True,capture_output=True)
 revalidated.append({'slug':p['slug'],'http':r.stdout.rsplit('\n',1)[-1],'exit':r.returncode})
status={'source_commit':data['source_commit'],'root':str(root),'backup':str(backup),'catalog':str(release),'posts':len(by),'new':sum(v is None for v in data['before'].values()),'updated':sum(v is not None for v in data['before'].values()),'manifest':manifest_count,'search':search_count,'sitemap_before':len(urls_before),'sitemap_after':len(elems),'sitemap_lost':len(urls_before-set(elems)),'revalidated':revalidated}
(backup/'deployment.json').write_text(dump(status));print(json.dumps(status,ensure_ascii=False))
'''
status=run(code);(O/'deployment.json').write_text(status);d=json.loads(status);print('Published',d['posts'],'articles; catalogue; sitemap lost',d['sitemap_lost'],'revalidation failures',[x for x in d['revalidated'] if x['http']!='200'])
