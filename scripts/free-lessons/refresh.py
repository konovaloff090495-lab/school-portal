#!/usr/bin/env python3
"""Refresh canonical chrome on the maintained standalone free-lesson pages."""
from pathlib import Path
import json
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[2]
chrome=json.loads((ROOT/'src/site-navigation/chrome.json').read_text())
metrika=(ROOT/'scripts/courses/design/metrika.html').read_text()
def refresh(folder):
 count=0
 for p in Path(folder).rglob('index.html'):
  d=BeautifulSoup(p.read_text(),'html.parser')
  for part in ['header','footer']:
   w=d.select_one('.ps-chrome-'+part)
   if w is None:raise ValueError(str(p)+' lacks shared '+part)
   w.clear();w.append(BeautifulSoup(chrome[part],'html.parser'));w['data-navigation-version']=chrome['version']
  if '/besplatnye-uroki/' in str(p) and not d.find('script',string=lambda s:s and "ym(108789843,'init'" in s):d.body.append(BeautifulSoup(metrika,'html.parser'))
  p.write_text(str(d));count+=1
 return count
if __name__=='__main__':
 import sys
 folders=sys.argv[1:] or [ROOT/'public/besplatnye-uroki',ROOT/'public/kursy',ROOT/'work/programming/release']
 print('Canonical chrome refreshed:',sum(refresh(f) for f in folders),'pages,',chrome['version'])
