#!/usr/bin/env python3
"""Check class guide coverage, relevant links, editorial differentiation and SEO.

The five-word passage comparison is an editorial duplication signal, not a
prediction of search rankings. Navigation is excluded from that comparison.
"""
import html
import json
import re
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import school

ROOT = Path(__file__).resolve().parents[2]
BLOG = ROOT / 'content/blog'
HUB = 'luchshie-kursy-po-predmetam-i-klassam'


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'a':
            self.urls.append(attrs.get('href', ''))


def words(body):
    body = re.sub(r'<style.*?</style>', '', body, flags=re.S)
    return re.findall(r'\w+', html.unescape(re.sub('<[^>]*>', ' ', body)).lower())


def main():
    guides = json.loads((ROOT / 'data/courses/school-blog-guides.json').read_text())
    courses = {c['id']: c for c in json.loads((ROOT / 'data/courses/catalog.json').read_text()) if c.get('active')}
    manifest = {p['slug']:p for p in json.loads((BLOG / 'index.json').read_text())}
    errors, passages, counts, all_cards = [], [], [], set()
    hub = json.loads((BLOG / (HUB + '.json')).read_text())
    for g in guides:
        subject, grade = g['subjectId'], g['grade']
        p = json.loads((BLOG / (g['slug'] + '.json')).read_text())
        def check(condition, message):
            if not condition:
                errors.append((g['slug'], message))
        check(p['slug'] == g['slug'] and p['title'] == g['title'], 'Slug/title mismatch')
        check(manifest.get(g['slug'], {}).get('excerpt') == p['excerpt'], 'Manifest mismatch')
        check(not p.get('suProduct'), 'Unexpected direct school lead banner')
        check(str(grade) + ' класса' in p['title'], 'Missing class in title')
        check(len(p['excerpt']) <= 210, 'Description too long')
        check(len(words(p['content'])) >= 300, 'Review short content')
        check(not re.search(r'\d[\d\s]*\s[₽€$]|placeholder|lorem ipsum|\ufffd|\+a\(', p['content'], re.I), 'Stale price/placeholder')
        check('/blog/' + g['slug'] + '/' in hub['content'], 'Orphaned from hub')
        links = Links(); links.feed(p['content'])
        check(g['catalogPath'] in links.urls, 'Missing subject/class selection')
        ids = {url.rstrip('/').split('/')[-1] for url in links.urls if url.startswith('/kursy/kurs/')}
        check(ids == set(g['courseIds']), 'Card links differ from reviewed choices')
        all_cards |= ids
        for cid in ids:
            check(cid in courses and school.matches(courses[cid], subject, grade), 'Unrelated course: ' + cid)
        for url in links.urls:
            if url.startswith('/blog/'):
                slug = url.rstrip('/').split('/')[-1]
                check(slug in manifest and (BLOG / (slug + '.json')).exists(), 'Broken blog link: ' + url)
            elif url.startswith('/kursy/'):
                check((ROOT / 'public' / url.lstrip('/') / 'index.html').exists(), 'Broken catalog link: ' + url)
        selection = ROOT / 'public' / g['catalogPath'].lstrip('/') / 'index.html'
        check('/blog/' + g['slug'] + '/' in selection.read_text(), 'Missing reciprocal selection link')
        # Editorial body, excluding common series navigation and source footer.
        mainbody = p['content'].split('<h2>Другие классы')[0]
        tokens = words(mainbody)
        passages.append(set(zip(*(tokens[i:] for i in range(5)))))
        counts.append(len(words(p['content'])))
    for key in ['title', 'excerpt', 'slug']:
        dupes = [value for value,count in Counter(g[key] for g in guides).items() if count > 1]
        if dupes:
            errors.append((key, 'Duplicates: ' + str(dupes)))
    nearest = []
    for i, a in enumerate(passages):
        novelty, j = min((1-len(a & b)/len(a), j) for j,b in enumerate(passages) if i != j)
        nearest.append({'slug':guides[i]['slug'],'closest':guides[j]['slug'],'distinctPassagesPercent':round(novelty*100,1)})
        if novelty < .40:
            errors.append((guides[i]['slug'], 'Excessive shared passages with ' + guides[j]['slug']))
    report = dict(guides=len(guides), subjects=len({g['subjectId'] for g in guides}),
                  distinctCourseCards=len(all_cards), courseSelections=sum(len(g['courseIds']) for g in guides),
                  words={'min':min(counts),'max':max(counts)},
                  nearestComparisons=sorted(nearest,key=lambda x:x['distinctPassagesPercent'])[:12],
                  errors=errors)
    out = ROOT / 'work/courses/school-blog-review.json'
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k!='nearestComparisons'},ensure_ascii=False))
    raise SystemExit(bool(errors))


if __name__ == '__main__':
    main()
