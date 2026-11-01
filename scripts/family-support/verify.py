#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json,urllib.request,time,hashlib,xml.etree.ElementTree as ET
from pathlib import Path
from bs4 import BeautifulSoup
R=Path(__file__).resolve().parents[2];O=R/'work/family-support';posts=json.loads((O/'posts.json').read_text());report=[];images=set();base='https://pro-schools.ru'
def get(path):
 with urllib.request.urlopen(base+path if path.startswith('/') else path,timeout=45) as r:return r.status,r.read(),r.headers.get('Content-Type','')
for p in posts:
 path='/blog/'+p['slug']+'/'
 for attempt in range(3):
  status,b,typ=get(path);s=BeautifulSoup(b,'html.parser');h=s.select('h1')
  if len(h)==1 and h[0].get_text(' ',strip=True)==p['title']:break
  time.sleep(2)
 assert status==200 and len(h)==1 and h[0].get_text(' ',strip=True)==p['title'],path
 assert s.select_one('link[rel=canonical]')['href']==base+path,path
 assert not s.select('input[type=tel]'),path
 assert s.select_one('a[href="/podderzhka-semej/"]'),path
 assert 'noindex' not in ' '.join(x.get('content','') for x in s.select('meta[name=robots]')),path
 for img in BeautifulSoup(p['content'],'html.parser').select('img[src]'):images.add(img['src'])
 images.add(p['imageUrl']);report.append({'url':base+path,'http':status,'canonical':'self','h1':1,'telephoneForms':0})
for image in images:
 status,b,typ=get(image);assert status==200 and typ.startswith('image/'),(image,status,typ)
status,b,_=get('/podderzhka-semej/');assert b==(R/'public/podderzhka-semej/index.html').read_bytes(),'Catalog SHA mismatch'
catalog=BeautifulSoup(b,'html.parser');assert len(catalog.select('.help-card'))==len(posts)
_,sm,_=get('/sitemap.xml');tree=ET.fromstring(sm);urls={e.text for e in tree.iter() if e.tag.endswith('}loc')}
for path in ['/podderzhka-semej/']+['/blog/'+p['slug']+'/' for p in posts]:assert base+path in urls,path
_,search,_=get('/site-navigation/search-index.js');prefix='window.PRO_SEARCH_INDEX=';entries=json.loads(search.decode().removeprefix(prefix).strip().removesuffix(';'));search_paths={r['u'].removeprefix(base) for r in entries}
for path in ['/podderzhka-semej/']+['/blog/'+p['slug']+'/' for p in posts]:assert path in search_paths,path
for path in ['/','/blog/','/shkoly/','/poisk/']:
 status,_,_=get(path);assert status==200,path
result={'articles':report,'catalog':'HTTP200+SHA256 match','images':len(images),'sitemap':len(urls),'search':len(entries),'allURLsInSitemapAndSearch':True,'existingRoutes':'4 HTTP200'}
(O/'live-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print('PASS',len(report),'articles + catalogue;',len(images),'images; sitemap/search; 4 existing routes')
