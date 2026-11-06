# -*- coding: utf-8 -*-
from pathlib import Path
import json,re,hashlib,xml.etree.ElementTree as ET
from urllib.parse import urlsplit
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'work/career/release'
M=json.loads((ROOT/'work/career/release-manifest.json').read_text())
P=json.loads((ROOT/'content/career/pages.json').read_text())
if isinstance(P,dict):P=P['pages']
assert len(P)==69 and len({p['path'] for p in P})==69  # plus retained /test/
existing={p['path'] for p in P if p.get('original_mode')=='append' or p['path'].startswith('/blog/')}
assert len(existing)==9
assert len(M['pages'])==60 and len(M['support_pages'])==4
assert set(M['pages'])=={p['path'] for p in P}-existing-{'/test/'}
assert not any(p.startswith('/blog/') for p in M['pages'])
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls=[x.text for x in ET.parse(OUT/'sitemap-career.xml').findall('.//s:loc',ns)]
assert len(urls)==60 and set(urls)=={'https://pro-schools.ru'+p for p in M['pages']}
hashes=set();titles=set();docs=[];wordcounts=[]
for path in M['pages']+M['support_pages']:
 f=OUT/path.strip('/')/'index.html';s=f.read_text();d=BeautifulSoup(s,'html.parser')
 assert len(d.select('h1'))==1,path
 title=d.title.get_text();assert title not in titles,(path,'duplicate title');titles.add(title)
 assert d.select_one('link[rel="canonical"]')['href']=='https://pro-schools.ru'+path,path
 assert len(d.select_one('meta[name="description"]')['content'])>15,path
 private=path in M['support_pages'];robots=d.select_one('meta[name="robots"]')['content']
 assert ('noindex' in robots)==private,path
 if private:
  assert not d.select('script[src^="http"]'),path
  assert not d.select('script[src^="/site-navigation/navigation.js"]'),path
  assert d.select_one('script[src^="/career-assets/privacy-navigation.js"]'),path
 else:
  ld=d.select_one('script[type="application/ld+json"]');assert ld,path
  json.loads(ld.get_text())
  main=d.select_one('article') or d.select_one('main');txt=main.get_text(' ',strip=True)
  digest=hashlib.sha256(txt.encode()).hexdigest();assert digest not in hashes,(path,'duplicate body');hashes.add(digest)
  wordcounts.append({'path':path,'words':len(re.findall(r'[А-Яа-яЁёA-Za-z]+',txt))})
  assert len(txt)>500,(path,'missing content')
 for a in d.select('[href]'):
  href=a.get('href','')
  assert not href.lower().startswith(('javascript:','data:')),path
  target=urlsplit(href).path
  if target.startswith('/career-assets/'):assert (OUT/target.lstrip('/')).is_file(),(path,href)
  if target.startswith('/proforientaciya/'):assert target in M['pages']+M['support_pages'],(path,href)
 assert 'Дизайн-концепция' not in s and 'mock-transport' not in s,path
 docs.append({'path':path,'ok':True,'private':private})
for p in P:
 if p['path']=='/test/':continue
 assert p.get('sections'),p['path']
 for s in p['sections']:
  assert s.get('heading') and s.get('html'),p['path']
for f in M['files']:
 assert hashlib.sha256((OUT/f['path']).read_bytes()).hexdigest()==f['sha256'],f['path']
report={'mapped_urls':70,'new_indexable':60,'existing_native_blog_updates':9,'retained_test':1,'private_support':4,'pages':docs,'word_counts':wordcounts,'bytes':sum(f['bytes'] for f in M['files']),'ok':True}
(ROOT/'work/career/check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({k:report[k] for k in ['mapped_urls','new_indexable','existing_native_blog_updates','retained_test','private_support','bytes','ok']}))
