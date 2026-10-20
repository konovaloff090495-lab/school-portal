#!/usr/bin/env python3
"""Replace only canonical chrome wrappers, preserving all bytes of page content."""
import argparse,json,re
from html.parser import HTMLParser
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
class Wrappers(HTMLParser):
 def __init__(self,text):
  super().__init__(convert_charrefs=False);self.text=text;self.offsets=[0];self.depth=0;self.current=None;self.ranges=[]
  for m in re.finditer('\n',text):self.offsets.append(m.end())
  self.feed(text)
 def pos(self):line,col=self.getpos();return self.offsets[line-1]+col
 def handle_starttag(self,tag,attrs):
  if tag!='div':return
  values=dict(attrs);classes=values.get('class','').split()
  if self.current:self.depth+=1
  elif 'ps-chrome-header' in classes or 'ps-chrome-footer' in classes:
   self.current=('header' if 'ps-chrome-header' in classes else 'footer',self.pos());self.depth=1
 def handle_endtag(self,tag):
  if tag!='div' or not self.current:return
  self.depth-=1
  if self.depth==0:
   part,start=self.current;end=self.text.index('>',self.pos())+1;self.ranges.append((start,end,part));self.current=None

def replace(text,chrome):
 ranges=Wrappers(text).ranges
 if sorted(r[2] for r in ranges)!=['footer','header']:raise ValueError('Expected one header and footer')
 for start,end,part in sorted(ranges,reverse=True):
  replacement='<div class="ps-chrome ps-chrome-'+part+'" data-navigation-version="'+chrome['version']+'">'+chrome[part]+'</div>'
  text=text[:start]+replacement+text[end:]
 return text

def main():
 parser=argparse.ArgumentParser();parser.add_argument('folders',nargs='*',type=Path);parser.add_argument('--chrome',type=Path,default=ROOT/'src/site-navigation/chrome.json');parser.add_argument('--check',action='store_true');args=parser.parse_args();chrome=json.loads(args.chrome.read_text());count=0;changed=0
 for folder in args.folders or [ROOT/'public/kursy',ROOT/'public/besplatnye-uroki']:
  for file in folder.rglob('index.html'):
   text=file.read_text()
   if 'ps-chrome-header' not in text:continue
   updated=replace(text,chrome);count+=1
   if updated!=text:
    changed+=1
    if not args.check:file.write_text(updated)
 print(json.dumps({'checked':count,'changed':changed,'version':chrome['version']}))
 if args.check and changed:raise SystemExit(1)
if __name__=='__main__':main()
