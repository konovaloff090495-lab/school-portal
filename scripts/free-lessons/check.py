#!/usr/bin/env python3
"""Validate published standalone routes and the existing lead helper contract."""
from pathlib import Path
from bs4 import BeautifulSoup
import hashlib,json
R=Path(__file__).resolve().parents[2]
M=json.loads((R/'data/free-lessons/seo-metadata.json').read_text())
E=json.loads((R/'public/besplatnye-uroki/assets/events.json').read_text())
pages=list((R/'public/besplatnye-uroki').rglob('index.html'))
assert len(pages)==len(M),'Unexpected/orphan pages'
titles=set();descriptions=set();hashes=set()
for p in pages:
 d=BeautifulSoup(p.read_text(),'html.parser');route='/'+str(p.parent.relative_to(R/'public'))+'/'
 assert route in M,route
 assert d.select_one('link[rel=canonical]')['href']=='https://pro-schools.ru'+route,route
 assert d.select_one('meta[name=robots]')['content'] in ['index,follow','noindex,follow'],route
 assert len(d.select('h1'))==1,route
 titles.add(d.title.text);descriptions.add(d.select_one('meta[name=description]')['content'])
 for s in d.select('script[type="application/ld+json"]'):json.loads(s.string)
 for a in d.select('[href],[src]'):
  u=a.get('href') or a.get('src')
  if not u.startswith('/besplatnye-uroki/'):continue
  u=u.split('?')[0].split('#')[0];target=R/'public'/u.lstrip('/')
  if u.endswith('/'):target=target/'index.html'
  assert target.exists(),(route,u)
for e in E:hashes.add(hashlib.sha256((R/'public'/e['cover'].lstrip('/')).read_bytes()).hexdigest())
assert len(titles)==len(descriptions)==len(pages)
assert len(hashes)==len(E)
form=(R/'public/besplatnye-uroki/assets/lead-form.js').read_text()
assert "import { submitLead }" in form and 'await submitLead(' in form
assert 'marketing_agreed:form.elements.marketing.checked' in form
assert 'crm:true' in form
print(f'Free lessons OK:{len(pages)} canonical pages,{len(E)} unique covers,shared submitLead,separate consents')
