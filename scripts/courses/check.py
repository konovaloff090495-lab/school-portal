#!/usr/bin/env python3
"""Check generated SEO, links, prices and outbound attribution before release."""
import hashlib, json, os, re
from pathlib import Path
from urllib.parse import urlparse, parse_qs
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from build import ROOT, BASE, COURSES, SCHOOL_PAGES, indexable, partner_url
import school

OUT=Path(os.environ.get('COURSES_CHECK_DIR',str(ROOT/'public/kursy')))
errors=[]
pages=list(OUT.rglob('index.html'))
if len(pages)>=500:
    # The previous 459-page batch remains bounded by its course-id fingerprint.
    # Expansion requires reviewed sources and an explicit inventory of facets.
    review=json.loads((ROOT/'data/courses/school-review.json').read_text())
    reviewed={r['courseId'] for r in review['verifiedSourcePages']}
    expansion_path=ROOT/'data/courses/market-review.json'
    expansion=json.loads(expansion_path.read_text()) if expansion_path.exists() else {}
    current={c['id']:c for c in COURSES}
    for record in expansion.get('verifiedSourcePages',[]):
        c=current[record['courseId']]
        assert c['sourceUrl']==record['sourceUrl'] and c['contentHash']==record['sourceHash'],'Expansion evidence mismatch'
        reviewed.add(c['id'])
    baseline=sorted(c['id'] for c in COURSES if c['id'] not in reviewed)
    assert hashlib.sha256('\n'.join(baseline).encode()).hexdigest()==review['baselineCourseIdsSha256'],'Unreviewed course expansion'
    selections=set(review['reviewedSelectionIds'])|set(expansion.get('reviewedSelectionIds',[]))
    assert {p['id'] for p in SCHOOL_PAGES}.issubset(selections),'Unreviewed school selection'
    extra=set(expansion.get('reviewedExtraLandingIds',[]))
    assert len(pages)<=review['baselinePageCount']+len(reviewed)+len(selections)+len(extra)+1,'Unreviewed page expansion'
sitemap={e.text for e in ET.parse(OUT/'sitemap.xml').iter() if e.tag.endswith('}loc')}
articles={e.text for e in ET.parse(OUT/'articles-sitemap.xml').iter() if e.tag.endswith('}loc')}
registered=json.loads((ROOT/'data/courses/article-sitemap.json').read_text())
assert articles=={BASE+'/blog/'+r['slug']+'/' for r in registered},'Article sitemap differs from reviewed registry'
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
    if c.get('price') and (c['price']['amount']<0 or (c['price']['amount']==0 and not c.get('freeAccessEvidence'))):errors.append((c['id'],'Invalid or unverified free price'))
    if c.get('learningGoal')=='school':
        if set(c['tags'])&{'ege','oge'}:errors.append((c['id'],'Exam substituted for school programme'))
        if not c.get('schoolEvidence'):errors.append((c['id'],'Missing school classification evidence'))
        if any(not 1<=n<=11 for n in c.get('grades',[])):errors.append((c['id'],'Invalid explicit school grade'))
        if not set(c.get('schoolSubjects',[])).issubset(school.SUBJECT_MAP):errors.append((c['id'],'Unknown school subject'))
        for subject,grades in c.get('schoolSubjectGrades',{}).items():
            if subject not in c.get('schoolSubjects',[]) or not set(grades).issubset(c.get('grades',[])):errors.append((c['id'],'Invalid subject-specific grade evidence'))
    for package in c.get('packages',[]):
        if package['lessons']<=0 or (package.get('price') and package['price']['unit']!='курс'):errors.append((c['id'],'Invalid lesson package'))
        partner_url({**c,'sourceUrl':package['sourceUrl']})
    if c['brandId']=='sotka' and c.get('price') and 'четыр' not in c['price']['condition']:errors.append((c['id'],'Missing bundle condition'))
    partner_url(c)
report={'pages':len(pages),'courses':len(COURSES),'indexablePages':len(sitemap),'indexableCourses':sum(indexable(c) for c in COURSES),'errors':errors}
(ROOT/'work/courses/check-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False))
raise SystemExit(bool(errors))
