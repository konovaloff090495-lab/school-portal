#!/usr/bin/env python3
"""Prevent standalone pages from silently restoring a different site navigation."""
from pathlib import Path
import json
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
chrome=json.loads((ROOT/'src/site-navigation/chrome.json').read_text())
assert "<Header />" in (ROOT/'src/app/layout.tsx').read_text()
assert "<Footer />" in (ROOT/'src/app/layout.tsx').read_text()
assert 'chrome.header' in (ROOT/'src/components/Header.tsx').read_text()
assert 'chrome.footer' in (ROOT/'src/components/Footer.tsx').read_text()
expected={part:BeautifulSoup(chrome[part],'html.parser').get_text(' ',strip=True) for part in ['header','footer']}
count=0
for file in list((ROOT/'public/kursy').rglob('index.html'))+list((ROOT/'work/programming/release').rglob('index.html')):
 doc=BeautifulSoup(file.read_text(),'html.parser')
 for part in ['header','footer']:
  wrapper=doc.select_one('.ps-chrome-'+part)
  assert wrapper is not None,(str(file),'Missing shared '+part)
  assert wrapper.get('data-navigation-version')==chrome['version'],(str(file),'Stale version')
  assert wrapper.get_text(' ',strip=True)==expected[part],(str(file),'Diverged '+part)
 assert len(doc.select('header'))==1 and len(doc.select('footer'))==1,str(file)
 assert doc.select_one('script[src^="/site-navigation/navigation.js"]'),str(file)
 count+=1
print(f'Navigation contract OK: root layout + {count} course pages, {chrome["version"]}')
