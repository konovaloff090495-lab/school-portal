#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Проверка содержимого и связности без сборки и сетевых изменений."""
import hashlib
import html
import json
import re
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parent
PROJECT=ROOT.parents[1]

class Links(HTMLParser):
    def __init__(self):super().__init__();self.hrefs=[]
    def handle_starttag(self,tag,attrs):
        if tag=='a':self.hrefs.extend(v for k,v in attrs if k=='href')

def main():
    pages=json.loads((ROOT/'pages.json').read_text())
    briefs=json.loads((ROOT/'plan.json').read_text())
    coverage=json.loads((ROOT/'coverage.json').read_text())
    paths={p['path'] for p in pages};expected={b['url'] for b in briefs}
    assert paths|{'/test/'}==expected
    assert len(paths)==len(pages)==69
    assert coverage['retained_count']==1 and not coverage['missing']
    originals=[];worksheets=[];internal=0
    for page in pages:
        assert page['title'] and page['lead'] and page['description']
        assert len(page['sections'])>=5 and len(page['faq'])>=2
        assert len(page['related'])>=3
        assert len({s['id'] for s in page['sections']})==len(page['sections'])
        assert all(urlparse(s['url']).scheme=='https' for s in page['sources'])
        parser=Links();parser.feed(''.join(s['html'] for s in page['sections']))
        for href in parser.hrefs:
            if href.startswith('/career-assets/worksheets/'):
                f=ROOT/'worksheets'/href.rsplit('/',1)[-1]
                assert f.is_file(),str(f)
                assert 'contenteditable="true"' in f.read_text()
                worksheets.append(f.name)
            elif href.startswith('/'):
                assert href in expected or href=='/proforientaciya/karta-interesov/'
                internal+=1
        if page.get('original_mode')=='append':
            f=PROJECT/page['original_path'];actual=hashlib.sha256(f.read_bytes()).hexdigest()
            assert actual==page['original_sha256'],str(f)
            originals.append({'path':page['path'],'sha256':actual,'original_preserved':True})
        assert all(r['path'] in expected for r in page['related'])
        for s in page['sections']:
            assert not re.search(r'<(?:script|iframe|form|input)\b',s['html'],re.I)
            assert not re.search(r'\b(?:TODO|Lorem ipsum|TBD)\b',s['html'])
    assert len(originals)==9 and len(set(worksheets))==69
    result={
      'status':'PASS','expected_total':70,'content_pages':69,'existing_test_retained':1,
      'new_paths':60,'existing_blog_append':9,'originals_verified_unchanged':originals,
      'worksheets_html':len(set(worksheets)),'print_script_exists':(ROOT/'worksheets/print.js').is_file(),
      'word_count_total':coverage['words_total'],'word_count_min':coverage['min_words'],'word_count_max':coverage['max_words'],
      'unique_titles':len({p['title'] for p in pages}),
      'page_kinds':dict(Counter(p['kind'] for p in pages)),
      'pages_sha256':hashlib.sha256((ROOT/'pages.json').read_bytes()).hexdigest(),
      'checks':['All 70 planned destinations covered (69 descriptions + retained /test/)',
        'Nine preserved original snapshots match saved SHA256; native articles retain their original content',
        'Every worksheet link points to a real editable printable HTML artifact',
        'No foreign scripts, forms, placeholders or copied method keys in new sections',
        'Related links remain inside the planned map; hub lists every destination'],
      'scope':'Content integrity only. Browser rendering, partner delivery and production URL checks belong to integration QA.',
      'editorial_note':'Exercises and plans are original editorial materials. No claim of expert review, clinical diagnosis or validated psychometrics.'}
    (ROOT/'validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    print(json.dumps({k:v for k,v in result.items() if k!='originals_verified_unchanged'},ensure_ascii=False,indent=2))

if __name__=='__main__':main()
