# -*- coding: utf-8 -*-
from pathlib import Path
import json,urllib.request,urllib.error,time,concurrent.futures
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[2]
M=json.loads((ROOT/'work/career/release-manifest.json').read_text())
BASE='https://pro-schools.ru'
def get(path,method='GET',headers=None,data=None):
 req=urllib.request.Request(BASE+path,method=method,headers=headers or {},data=data)
 try:
  with urllib.request.urlopen(req,timeout=30) as r:return r.status,r.headers,r.read()
 except urllib.error.HTTPError as e:return e.code,e.headers,e.read()
def check(path):
 status,h,body=get(path);assert status==200,(path,status)
 d=BeautifulSoup(body,'html.parser');assert len(d.select('h1'))==1,path
 assert d.select_one('link[rel="canonical"]')['href']==BASE+path,path
 private=path in M['support_pages']
 if private:
  assert 'noindex' in h.get('X-Robots-Tag',''),path
  assert 'no-store' in h.get('Cache-Control',''),path
  assert h.get('Referrer-Policy')=='no-referrer',path
  assert "script-src 'self'" in h.get('Content-Security-Policy',''),path
 else:assert 'noindex' not in d.select_one('meta[name="robots"]')['content'],path
 return {'path':path,'status':status,'title':d.title.get_text(),'private':private}
result={'pages':[],'baseline':[],'api':{}}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 result['pages']=list(pool.map(check,M['pages']+M['support_pages']))
baseline=json.loads((ROOT/'work/career/baseline/pages.json').read_text())
for old in baseline:
 status,_,body=get(old['path']);assert status==200,(old['path'],status)
 d=BeautifulSoup(body,'html.parser');before_doc=BeautifulSoup(old['html'],'html.parser')
 assert d.title.get_text()==before_doc.title.get_text(),(old['path'],'title changed')
 assert ' '.join(d.select_one('h1').get_text(' ',strip=True).split())==' '.join(old['h1'].split()),(old['path'],'H1 changed')
 canonical=d.select_one('link[rel="canonical"]');old_canonical=before_doc.select_one('link[rel="canonical"]');assert (canonical['href'] if canonical else '')==(old_canonical['href'] if old_canonical else ''),(old['path'],'canonical changed')
 if old['path'].startswith('/blog/'):
  assert 'data-career-release' in body.decode(),old['path']
  before=BeautifulSoup(old['html'],'html.parser').select_one('main')
  newtext=d.select_one('main').get_text(' ',strip=True)
  oldparas=[p.get_text(' ',strip=True) for p in before.select('p') if len(p.get_text(' ',strip=True))>=30]
  missing=[s for s in oldparas if s not in newtext]
  assert not missing,(old['path'],'original paragraphs missing',missing[:2])
 result['baseline'].append({'path':old['path'],'metadata_preserved':True,'original_paragraphs_preserved':True})
status,_,body=get('/api/career/health/');assert status==200 and json.loads(body)['ok'];result['api']['health']=True
status,_,_=get('/api/career/results/current/');assert status==401;result['api']['unauthenticated_denied']=True
status,headers,_=get('/api/career/access/','POST',{'Origin':'https://untrusted.invalid','Content-Type':'application/json'},b'{"token":"invalid"}');assert status==403 and not headers.get('Access-Control-Allow-Origin');result['api']['cross_origin_denied']=True
status,_,body=get('/sitemap-career.xml');assert status==200 and body.count(b'<loc>')==60;result['sitemap']=60
status,_,body=get('/sitemap.xml');assert status==200 and b'sitemap-career.xml' in body;result['sitemap_index']=True
result['ok']=True
(ROOT/'work/career/public-check.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps({'ok':True,'pages':len(result['pages']),'baseline_routes':len(result['baseline']),'api':result['api'],'sitemap':60}))
