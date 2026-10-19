#!/usr/bin/env python3
"""Check generated SEO, links, prices and outbound attribution before release."""
import json, os, re
from pathlib import Path
from urllib.parse import urlparse, parse_qs
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from build import ROOT, BASE, COURSES, indexable, partner_url

OUT=Path(os.environ.get('COURSES_CHECK_DIR',str(ROOT/'public/kursy')))
errors=[]
pages=list(OUT.rglob('index.html'))
assert len(pages)<500,'Content audit required before 500+ pages'
sitemap={e.text for e in ET.parse(OUT/'sitemap.xml').iter() if e.tag.endswith('}loc')}
titles={};descriptions={};seen_course_ids=set()
for file in pages:
    relative=file.relative_to(OUT).parent.as_posix()
    path='/kursy/'+('' if relative=='.' else relative+'/')
    page=BeautifulSoup(file.read_text(),'html.parser')
    if len(page.select('h1'))!=1:errors.append((path,'Expected one H1'))
    title=page.title.get_text() if page.title else ''
    if title in titles:errors.append((path,'Duplicate title: '+titles[title]))
    titles[title]=path
    canonical=page.select_one('link[rel=canonical]')
    if not canonical or canonical.get('href')!=BASE+path:errors.append((path,'Incorrect canonical'))
    desc=page.select_one('meta[name=description]')
    if not desc or len(desc.get('content',''))<50:errors.append((path,'Missing or short description'))
    elif desc['content'] in descriptions:errors.append((path,'Duplicate description'))
    else:descriptions[desc['content']]=path
    robots=page.select_one('meta[name=robots]')['content']
    if ('noindex' not in robots)!=(BASE+path in sitemap):errors.append((path,'Sitemap / robots mismatch'))
    for s in page.select('script[type="application/ld+json"]'):
        try:json.loads(s.string)
        except Exception:errors.append((path,'Invalid JSON-LD'))
    for asset in page.select('script[src],link[rel=stylesheet]'):
        asset_url=asset.get('src') or asset.get('href')
        asset_path=urlparse(asset_url).path
        if asset_path.startswith('/kursy/') and not (OUT/asset_path.removeprefix('/kursy/')).is_file():errors.append((path,'Missing asset '+asset_url))
    for a in page.select('a[href]'):
        href=a['href'];u=urlparse(href)
        if u.path.startswith('/kursy/') and not u.netloc:
            dest=OUT/u.path.removeprefix('/kursy/')
            if not dest.is_file() and not (dest/'index.html').is_file():errors.append((path,'Missing internal link '+href))
        if a.has_attr('data-partner-link'):
            if u.scheme!='https':errors.append((path,'Unsafe external URL'))
            q=parse_qs(u.query)
            if q.get('utm_source')!=['gerasimov_lav'] or q.get('utm_campaign')!=['proschools_courses']:errors.append((path,'Missing UTM'))
            if not {'sponsored','nofollow','noopener'}.issubset(set(a.get('rel',[]))):errors.append((path,'Missing rel'))
for c in COURSES:
    if c['id'] in seen_course_ids:errors.append((c['id'],'Duplicate id'))
    seen_course_ids.add(c['id'])
    if not re.fullmatch('[a-z0-9-]+',c['id']):errors.append((c['id'],'Invalid slug'))
    if len('/kursy/kurs/'+c['id']+'/')>=100:errors.append((c['id'],'Long URL'))
    if c.get('ageRange') and not 2<=c['ageRange'][0]<=c['ageRange'][1]<=18:errors.append((c['id'],'Invalid age'))
    if c.get('price') and c['price']['amount']<=0:errors.append((c['id'],'Invalid price'))
    if c['brandId']=='sotka' and c.get('price') and 'четыр' not in c['price']['condition']:errors.append((c['id'],'Missing bundle condition'))
    partner_url(c)
report={'pages':len(pages),'courses':len(COURSES),'indexablePages':len(sitemap),'indexableCourses':sum(indexable(c) for c in COURSES),'errors':errors}
(ROOT/'work/courses/check-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False))
raise SystemExit(bool(errors))
