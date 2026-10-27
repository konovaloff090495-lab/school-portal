#!/usr/bin/env python3
"""Collect source text and candidate official images; never mutates catalog data."""
import concurrent.futures, hashlib, json, pathlib, re, urllib.parse
import requests
from bs4 import BeautifulSoup

OUT=pathlib.Path('work/externat/sources'); OUT.mkdir(parents=True,exist_ok=True)
sources=json.loads(pathlib.Path('work/externat/source-input.json').read_text())
def run(item):
    row=dict(item)
    try:
        r=requests.get(item['url'],timeout=30);r.raise_for_status()
        s=BeautifulSoup(r.content,'html.parser')
        images=[]
        for tag in s.select('meta[property="og:image"],meta[name="twitter:image"]'):
            if tag.get('content'): images.append({'url':urllib.parse.urljoin(r.url,tag['content']),'kind':'og'})
        for tag in s.select('img[src],img[data-original],img[data-src]'):
            for attr in ['data-original','data-src','src']:
                u=tag.get(attr,'')
                if u and not u.startswith('data:'):
                    images.append({'url':urllib.parse.urljoin(r.url,u),'kind':'img','alt':tag.get('alt','')[:150]});break
        for tag in s.select('[data-original]'):
            u=tag.get('data-original','')
            if u.startswith('http'):images.append({'url':u,'kind':'background'})
        for tag in s(['script','style','noscript','svg']):tag.decompose()
        text=s.get_text(' ',strip=True).replace('\xa0',' ')
        (OUT/(item['key']+'.txt')).write_text(text)
        excerpts=[]
        for m in re.finditer(r'экстерн|аттестаци|семейн',text,re.I):
            x=text[max(0,m.start()-80):m.end()+220]
            if x not in excerpts:excerpts.append(x)
            if len(excerpts)>=16:break
        row.update(status=r.status_code,finalUrl=r.url,sha256=hashlib.sha256(r.content).hexdigest(),title=s.title.get_text(' ',strip=True)if s.title else '',excerpts=excerpts,images=list({x['url']:x for x in images}.values()))
    except Exception as e:row.update(status='error',error=str(e)[:200])
    return row
with concurrent.futures.ThreadPoolExecutor(max_workers=6)as p:rows=list(p.map(run,sources))
(OUT/'collected.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
print(json.dumps({'sources':len(rows),'ok':sum(r['status']==200 for r in rows)},ensure_ascii=False))
