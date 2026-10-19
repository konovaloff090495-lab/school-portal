# -*- coding: utf-8 -*-
"""Validate the brand → review → selection/course linking graph."""
import json,re
from pathlib import Path
from bs4 import BeautifulSoup
from build import ROOT,COURSES,BRAND_GUIDES
BLOG=ROOT/'content/blog';OUT=ROOT/'public/kursy';errors=[]
manifest={p['slug'] for p in json.loads((BLOG/'index.json').read_text())}
assert {c['brandId'] for c in COURSES}==set(BRAND_GUIDES)
hub=json.loads((BLOG/'obzory-onlayn-shkol-dlya-detej.json').read_text())
for b,g in BRAND_GUIDES.items():
 post=json.loads((BLOG/(g['slug']+'.json')).read_text());s=BeautifulSoup(post['content'],'html.parser');links={a['href'] for a in s.select('a[href]')}
 if len(s.get_text(' ',strip=True).split())<330:errors.append((b,'Short school overview'))
 if g['slug'] not in manifest or '/blog/'+g['slug']+'/' not in hub['content']:errors.append((b,'Review orphaned from hub/manifest'))
 if len(post['excerpt'])>210 or post.get('suProduct'):errors.append((b,'Incorrect metadata or direct lead banner'))
 if '/kursy/shkoly/'+b+'/' not in links:errors.append((b,'Missing school catalog'))
 ids={url.rstrip('/').split('/')[-1] for url in links if url.startswith('/kursy/kurs/')}
 if ids!=set(g['courseIds']):errors.append((b,'Course links mismatch reviewed selection'))
 if not all(any(c['id']==id and c['brandId']==b for c in COURSES) for id in ids):errors.append((b,'Wrong school course'))
 for href in links:
  if href.startswith('/kursy/') and not (ROOT/'public'/href.lstrip('/')/'index.html').exists():errors.append((b,'Missing selection '+href))
  if href.startswith('/blog/') and href.rstrip('/').split('/')[-1] not in manifest:errors.append((b,'Missing article '+href))
 path='/blog/'+g['slug']+'/'
 if path not in (OUT/'shkoly'/b/'index.html').read_text():errors.append((b,'Missing school reciprocal link'))
 for c in COURSES:
  if c['brandId']==b and path not in (OUT/'kurs'/c['id']/'index.html').read_text():errors.append((c['id'],'Missing course reciprocal link'))
report=dict(brandReviews=len(BRAND_GUIDES),reciprocalSchoolLinks=len(BRAND_GUIDES),reciprocalCourseLinks=len(COURSES),errors=errors)
(ROOT/'work/courses/market/brand-blog-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False));raise SystemExit(bool(errors))
