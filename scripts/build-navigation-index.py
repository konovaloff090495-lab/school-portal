#!/usr/bin/env python3
"""Refresh public course records in the lazy navigation index at release time."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
f=ROOT/'public/site-navigation/search-index.js'
items=json.loads(f.read_text().removeprefix('window.PRO_SEARCH_INDEX=').rstrip(';'))
items=[x for x in items if x['y']!='course']
for c in json.loads((ROOT/'data/courses/catalog.json').read_text()):
 if c.get('active'):
  items.append({'t':c['title'],'u':'https://pro-schools.ru/kursy/kurs/'+c['id']+'/','y':'course','s':c.get('brand','')+' · Курс для детей','k':'курсы '+str(c.get('category',''))+' '+str(c.get('grade',''))+' '+str(c.get('summary',''))[:180],'region':''})
career=ROOT/'content/career/pages.json'
if career.exists():
 pages=json.loads(career.read_text())
 if isinstance(pages,dict):pages=pages['pages']
 urls={'https://pro-schools.ru'+p['path'] for p in pages}
 items=[x for x in items if x.get('u') not in urls]
 for p in pages:
  if p.get('noindex'):continue
  items.append({'t':p['title'],'u':'https://pro-schools.ru'+p['path'],'y':'page','s':'Профориентация · '+p.get('audience',''),'k':p.get('description',''),'region':''})
f.write_text('window.PRO_SEARCH_INDEX='+json.dumps(items,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')+';')
print('Navigation index:',len(items),'records')
