"""Verify the production UI boundary, shared chrome and every image reference."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import hashlib

class Assets(HTMLParser):
    def __init__(self):super().__init__();self.refs=[];self.marked=False
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='body':self.marked=a.get('data-catalog-design')=='compact-v3'
        if tag=='img':self.refs.append(a.get('src',''))
        if tag in ['script','link']:self.refs.append(a.get('src',a.get('href','')))

def validate(out):
    out=Path(out);errors=[];chrome={};count=0
    for file in out.rglob('index.html'):
        count+=1;s=file.read_text();p=Assets();p.feed(s)
        if not p.marked:errors.append((str(file),'Missing approved design marker'))
        for forbidden in ['chatgpt.site','/design-system/','/research.html','Приватный дизайн-макет','noindex,nofollow','href="/assets/','src="/assets/']:
            if forbidden in s:errors.append((str(file),'Prototype leakage: '+forbidden))
        for ref in p.refs:
            path=urlsplit(ref).path
            if path.startswith('/kursy/assets/') and not (out/path.removeprefix('/kursy/')).is_file():errors.append((str(file),'Missing UI asset '+path))
        for tag in ['header','footer']:
            import re
            found=re.search('<'+tag+r'\b.*?</'+tag+'>',s,re.S)
            digest=hashlib.sha256((found.group() if found else '').encode()).hexdigest()
            if tag not in chrome:chrome[tag]=digest
            elif chrome[tag]!=digest:errors.append((str(file),'Inconsistent shared '+tag))
    return errors

if __name__=='__main__':
    import argparse,json
    p=argparse.ArgumentParser();p.add_argument('out');args=p.parse_args();errors=validate(args.out);print(json.dumps({'designErrors':errors},ensure_ascii=False));raise SystemExit(bool(errors))
