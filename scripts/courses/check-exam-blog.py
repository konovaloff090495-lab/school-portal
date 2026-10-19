#!/usr/bin/env python3
"""Check exam/subject relevance, complete card coverage and reciprocal links."""
import html
import json
import re
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
BLOG=ROOT/'content/blog'
HUBS={'ege':'kursy-podgotovki-k-ege-luchshie','oge':'luchshie-kursy-podgotovki-k-oge'}


class Links(HTMLParser):
    def __init__(self):super().__init__();self.urls=[]
    def handle_starttag(self,tag,attrs):
        if tag=='a':self.urls.append(dict(attrs).get('href',''))


def words(body):
    body=re.sub('<style.*?</style>','',body,flags=re.S)
    return re.findall(r'\w+',html.unescape(re.sub('<[^>]+>',' ',body)).lower())


def main():
    G=json.loads((ROOT/'data/courses/exam-blog-guides.json').read_text())
    C={c['id']:c for c in json.loads((ROOT/'data/courses/catalog.json').read_text()) if c.get('active')}
    manifest={p['slug']:p for p in json.loads((BLOG/'index.json').read_text())}
    errors=[];cards=set();passages=[];counts=[]
    pairs={(g['exam'],g['subjectId']) for g in G}
    assert len(G)==len(pairs)==22
    for field in ['slug','title','excerpt']:
        assert all(n==1 for n in Counter(g[field] for g in G).values()),field
    for g in G:
        def check(condition,message):
            if not condition:errors.append((g['slug'],message))
        exam,subject=g['exam'],g['subjectId'];p=json.loads((BLOG/(g['slug']+'.json')).read_text())
        check(p['title']==g['title'] and p['excerpt']==g['excerpt'],'Metadata differs from brief')
        check(manifest.get(g['slug'],{}).get('title')==g['title'],'Manifest mismatch')
        check(not p.get('suProduct'),'Unexpected direct lead banner')
        check(re.fullmatch('[a-z0-9-]+',g['slug']) and len(g['slug'])<100,'Unsafe slug')
        check(len(p['excerpt'])<=210,'Description too long')
        check(len(words(p['content']))>=400,'Short comparison')
        check(not re.search(r'\d[\d\s]*\s[₽€$]|\ufffd|lorem ipsum|placeholder|\+a\(',p['content'],re.I),'Price/placeholder leakage')
        links=Links();links.feed(p['content'])
        linked={u.rstrip('/').split('/')[-1] for u in links.urls if u.startswith('/kursy/kurs/')}
        expected={c['id'] for c in C.values() if exam in c['tags'] and subject in c['tags']}
        check(linked==set(g['courseIds'])==expected,'Exam/subject course coverage mismatch')
        cards |= linked
        check(g['catalogPath'] in links.urls,'Missing selection')
        check('https://fipi.ru/'+exam+'/demoversii-specifikacii-kodifikatory' in links.urls,'Wrong official exam source')
        for u in links.urls:
            if u.startswith('/blog/'):
                slug=u.rstrip('/').split('/')[-1]
                check(slug in manifest and (BLOG/(slug+'.json')).exists(),'Broken blog link '+u)
            elif u.startswith('/kursy/'):
                check((ROOT/'public'/u.lstrip('/')/'index.html').exists(),'Broken catalog link '+u)
        href='/blog/'+g['slug']+'/'
        facet=ROOT/'public'/g['catalogPath'].lstrip('/')/'index.html'
        check(href in facet.read_text(),'Missing reciprocal selection link')
        for cid in linked:
            check(href in (ROOT/'public/kursy/kurs'/cid/'index.html').read_text(),'Missing reciprocal card link '+cid)
        hub=json.loads((BLOG/(HUBS[exam]+'.json')).read_text())
        check(href in hub['content'],'Orphaned from exam hub')
        check(href in (ROOT/'public/kursy'/exam/'index.html').read_text(),'Missing exam root link')
        tokens=words(p['content'].split('<h2>Другие обзоры')[0]);passages.append(set(zip(*(tokens[i:] for i in range(5)))));counts.append(len(words(p['content'])))
    comparisons=[]
    for i,a in enumerate(passages):
        novelty,j=min((1-len(a&b)/len(a),j) for j,b in enumerate(passages) if i!=j)
        comparisons.append(dict(slug=G[i]['slug'],closest=G[j]['slug'],distinctPassagesPercent=round(novelty*100,1)))
        if novelty<.40:errors.append((G[i]['slug'],'Excessive repeated passages'))
    report=dict(guides=len(G),subjects=len({g['subjectId'] for g in G}),distinctCards=len(cards),words=dict(min=min(counts),max=max(counts)),errors=errors,nearestComparisons=sorted(comparisons,key=lambda x:x['distinctPassagesPercent'])[:5])
    out=ROOT/'work/courses/exam-blog-review.json';out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k!='nearestComparisons'},ensure_ascii=False))
    raise SystemExit(bool(errors))


if __name__=='__main__':main()
