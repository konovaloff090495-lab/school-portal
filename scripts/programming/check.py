"""Verify canonical paths, inventory, pagination, provenance and link coverage."""
import json,re,sys
from pathlib import Path
from urllib.parse import urlparse
from bs4 import BeautifulSoup
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[2];WORK=ROOT/'work/programming';OUT=WORK/'release'
D=json.loads((WORK/'runtime.json').read_text());M=json.loads((OUT/'_programming/manifest.json').read_text());index=set(M['indexable']);paths=set(M['allPaths']);errors=[]
targets=set();titles={}
for path in paths:
 f=OUT/path.lstrip('/')/'index.html';page=BeautifulSoup(f.read_text(),'html.parser')
 if len(page.select('h1'))!=1:errors.append((path,'h1'))
 if page.select_one('link[rel=canonical]')['href']!='https://pro-schools.ru'+path:errors.append((path,'canonical'))
 title=page.title.get_text()
 if title in titles:errors.append((path,'duplicate title '+titles[title]))
 titles[title]=path
 if ('noindex' not in page.select_one('meta[name=robots]')['content'])!=(path in index):errors.append((path,'robots'))
 for s in page.select('script[type="application/ld+json"]'):
  payload=json.loads(s.string)
  if 'aggregateRating' in payload:errors.append((path,'Unverified own rating'))
 for a in page.select('a[href]'):
  p=urlparse(a['href']).path
  if p.startswith('/shkola/') or ('/programmirovanie/' in p and p.startswith('/shkoly/')):
   targets.add(p)
   if p not in paths:errors.append((path,'missing link '+p))
 for s in page.select('link[rel=stylesheet],script[src]'):
  p=urlparse(s.get('href') or s.get('src')).path
  if p.startswith('/_programming/') and not (OUT/p.lstrip('/')).exists():errors.append((path,'asset '+p))
 if '+a(' in f.read_text():errors.append((path,'Literal placeholder'))
for s in D['physical']:
 p='/shkola/'+s['slug']+'/'
 if p not in paths or p not in targets:errors.append((p,'Unreachable school'))
 if s.get('sourceUrl') and not s['sourceUrl'].startswith('https://'):errors.append((p,'source URL'))
ids=[s['slug'] for s in D['physical']]
if len(set(ids))!=len(ids):errors.append(('inventory','Duplicate slug'))
root=BeautifulSoup((OUT/'shkoly/tipy/programmirovanie/index.html').read_text(),'html.parser')
second=BeautifulSoup((OUT/'shkoly/tipy/programmirovanie/stranica/2/index.html').read_text(),'html.parser')
firstlinks={x['href'] for x in root.select('[data-card] h3 a')};secondlinks={x['href'] for x in second.select('[data-card] h3 a')}
if firstlinks&secondlinks:errors.append(('pagination','Repeated cards'))
report={'pages':len(paths),'indexable':len(index),'physical':len(ids),'online':len(D['online']),'regions':len(set(s['region'] for s in D['physical'])),'errors':errors}
(WORK/'check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False));raise SystemExit(bool(errors))
