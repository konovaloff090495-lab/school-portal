#!/usr/bin/env python3
"""Validate canonical IA without dependencies or a Next build."""
from html.parser import HTMLParser
from pathlib import Path
import json
R=Path(__file__).resolve().parents[1]
class Node:
 def __init__(self,tag='',attrs=(),parent=None):self.tag=tag;self.attrs=dict(attrs);self.parent=parent;self.children=[];self.words=[]
 def all(self,tag):
  return [child for child in self.children if child.tag==tag]+[n for child in self.children for n in child.all(tag)]
 def text(self):return ' '.join(self.words+ [child.text() for child in self.children]).strip()
class Parser(HTMLParser):
 def __init__(self):super().__init__();self.root=Node();self.current=self.root
 def handle_starttag(self,tag,attrs):
  node=Node(tag,attrs,self.current);self.current.children.append(node)
  if tag not in {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}:self.current=node
 def handle_endtag(self,tag):
  node=self.current
  while node.parent:
   if node.tag==tag:self.current=node.parent;return
   node=node.parent
 def handle_data(self,data):
  if data.strip():self.current.words.append(data.strip())
def parse(s):p=Parser();p.feed(s);return p.root
def clean(s):return ' '.join(s.replace('↗','').replace('→','').split())
c=json.loads((R/'src/site-navigation/chrome.json').read_text());p=json.loads((R/'docs/navigation/sections-policy.json').read_text());h=parse(c['header']);f=parse(c['footer'])
nav=next(n for n in h.all('nav') if n.attrs.get('aria-label')=='Главная навигация')
mobile=next(n for n in h.all('nav') if n.attrs.get('aria-label')=='Мобильная навигация')
primary=[n for n in nav.children if n.attrs.get('data-section')]
assert len(primary)<=p['max_top_sections'],'Top level is full: review the architecture first'
assert [n.attrs['data-section'] for n in primary]==[s['id'] for s in p['sections']],'Desktop section order differs from policy'
def label(n):
 if n.tag=='details':return clean(n.all('summary')[0].text())
 if n.tag=='a':return clean(n.text())
 return clean(next(x for x in n.children if x.tag in ['a','button']).text())
labels=[s['label'] for s in p['sections']]
assert [label(n) for n in primary]==labels,'Desktop labels differ from policy'
assert [label(n) for n in mobile.children if n.tag in ['a','details']]==labels,'Mobile labels/order differ from desktop'
footer_paths={n.attrs.get('href') for n in f.all('a')}
for s in p['sections']:
 assert set(s['footer_paths'])<=footer_paths,'Missing footer destination for '+s['id']
for n in h.all('a')+f.all('a'):
 href=n.attrs.get('href','')
 assert href and not href.lower().startswith(('javascript:','data:')),'Unsafe/empty navigation URL'
for renderer in ['scripts/courses/design/render.py','scripts/programming/build.py','scripts/free-lessons/refresh.py','scripts/family-support/build.py']:
 assert 'src/site-navigation/chrome.json' in (R/renderer).read_text(),'Renderer must use canonical navigation: '+renderer
print('Navigation policy OK: desktop/mobile order, labels, footer destinations, 5 renderers')
