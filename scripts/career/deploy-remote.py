#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Atomic exact-module rollout on the existing production host, with rollback."""
from pathlib import Path
import datetime,fcntl,hashlib,html,json,os,re,shutil,subprocess,time,urllib.request,xml.etree.ElementTree as ET
BASE=Path('/srv/portfolio/proschools/static/career')
MANIFEST=json.loads((BASE/'incoming-manifest.json').read_text())
VERSION=MANIFEST['version']
assert re.fullmatch(r'[0-9.]+',VERSION)
RELEASE=BASE/'releases'/VERSION
CURRENT=BASE/'current'
CONFIG=Path('/etc/nginx/sites-available/portfolio-restored')
SNIPPET=Path('/etc/nginx/snippets/proschools-career.conf')
INDEX=Path('/srv/portfolio/proschools/sitemaps/index.xml')
PUBLIC=Path('/srv/portfolio/proschools/current/public')
BLOG=Path('/srv/portfolio/proschools/current/content/blog')

def atomic(path,data):
    tmp=path.with_name(path.name+'.career-incoming')
    oldstat=path.stat() if path.exists() else None
    mode=oldstat.st_mode&0o777 if oldstat else 0o644
    tmp.write_bytes(data if isinstance(data,bytes) else data.encode());os.chmod(tmp,mode)
    if oldstat:os.chown(tmp,oldstat.st_uid,oldstat.st_gid)
    os.replace(tmp,path)
def command(*args):return subprocess.run(args,check=True,capture_output=True,text=True)
def request(path,method='GET',data=None,headers=None):
    h={'Host':'pro-schools.ru',**(headers or {})}
    if data is not None:h['Content-Type']='application/json'
    req=urllib.request.Request('http://127.0.0.1:8080'+path,method=method,data=json.dumps(data).encode() if data is not None else None,headers=h)
    with urllib.request.urlopen(req,timeout=30) as response:return response.status,response.read()
def env_key(path,key):
    import shlex
    for line in Path(path).read_text().splitlines():
        if line.startswith(key+'='):return ' '.join(shlex.split(line.split('=',1)[1]))
    raise RuntimeError('Required server credential missing')
def revalidate(paths):
    key=env_key('/etc/portfolio/proschools/runtime.env','ADMIN_SECRET')
    for path in paths:
        status,_=request('/api/revalidate/','POST',{'slug':path.strip('/').split('/')[-1]},{'Authorization':key})
        assert status==200

assert os.geteuid()==0
assert command('hostname').stdout.strip()=='portfolio-reserve-20261102'
for item in MANIFEST['files']:
    f=(RELEASE/item['path']).resolve()
    assert RELEASE.resolve() in f.parents and f.is_file()
    assert hashlib.sha256(f.read_bytes()).hexdigest()==item['sha256'],item['path']
assert len(MANIFEST['pages'])==60,'Expected every new mapped page'
assert all(p.startswith('/proforientaciya/') and p.endswith('/') for p in MANIFEST['pages'])

with open('/var/lock/proschools-career-release.lock','w') as lock:
    fcntl.flock(lock,fcntl.LOCK_EX)
    backup=BASE/'backups'/('release-'+datetime.datetime.now().strftime('%Y%m%d-%H%M%S'))
    backup.mkdir(parents=True,mode=0o700)
    originals={CONFIG:CONFIG.read_bytes(),INDEX:INDEX.read_bytes()}
    if SNIPPET.exists():originals[SNIPPET]=SNIPPET.read_bytes()
    search=PUBLIC/'site-navigation/search-index.js';originals[search]=search.read_bytes()
    oldlink=os.readlink(CURRENT) if CURRENT.is_symlink() else None
    (backup/'previous-current.txt').write_text(oldlink or '')
    updates=json.loads((BASE/'blog-updates.json').read_text())
    assert len(updates)==9 and all(re.fullmatch(r'/blog/[a-z0-9-]+/',p['path']) for p in updates)
    for p in updates:
        f=BLOG/(p['path'].strip('/').split('/')[-1]+'.json');originals[f]=f.read_bytes()
    for i,(f,data) in enumerate(originals.items()):
        (backup/str(i)).write_bytes(data)
    (backup/'files.json').write_text(json.dumps([str(p) for p in originals],indent=2))
    blog_proof=[]
    try:
        # Runtime blog JSON is extended; the working template, lead forms and ads stay intact.
        for p in updates:
            f=BLOG/(p['path'].strip('/').split('/')[-1]+'.json')
            a=json.loads(originals[f]);old=a['content'];assert isinstance(old,str)
            marker='<section data-career-release="20261106.1">'
            appendix=marker+p['html']+'</section>'
            if marker not in old:a['content']=old+appendix
            assert a['content'].startswith(old)
            assert all(a.get(k)==json.loads(originals[f]).get(k) for k in ['title','excerpt','publishedAt','author','suProduct'])
            atomic(f,json.dumps(a,ensure_ascii=False,indent=2))
            blog_proof.append({'path':p['path'],'original_content_sha256':hashlib.sha256(old.encode()).hexdigest(),'preserved':True})

        # Merge the live search index, retaining records published by other chats.
        raw=originals[search].decode();prefix='window.PRO_SEARCH_INDEX='
        assert raw.startswith(prefix)
        records=json.loads(raw[len(prefix):].rstrip().rstrip(';'))
        additions=json.loads((BASE/'search-records.json').read_text());urls={r['u'] for r in additions}
        records=[r for r in records if r.get('u') not in urls]+additions
        atomic(search,prefix+json.dumps(records,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')+';')

        root=str(CURRENT)
        lines=[f'location ^~ /career-assets/ {{ root {root}; try_files $uri =404; add_header X-Content-Type-Options nosniff always; }}',
          f'location = /sitemap-career.xml {{ alias {root}/sitemap-career.xml; default_type application/xml; }}',
          'location = /proforientaciya { return 301 /proforientaciya/$is_args$args; }',
          f'location ^~ /proforientaciya/ {{ root {root}; if ($uri !~ "/$") {{ return 301 $uri/$is_args$args; }} try_files $uri/index.html =404; add_header X-Content-Type-Options nosniff always; }}',
          'location ^~ /api/career/ { client_max_body_size 16k; proxy_pass http://127.0.0.1:8795; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; proxy_set_header X-Forwarded-Proto https; proxy_read_timeout 30s; proxy_connect_timeout 3s; proxy_buffering off; add_header X-Robots-Tag "noindex, nofollow" always; }']
        csp="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
        for path in MANIFEST['support_pages']:
            assert re.fullmatch(r'/proforientaciya/[a-z0-9-]+/',path)
            lines.append(f'''location = {path} {{ root {root}; try_files $uri/index.html =404; add_header Cache-Control "private, no-store" always; add_header Referrer-Policy no-referrer always; add_header X-Robots-Tag "noindex, nofollow, noarchive" always; add_header Content-Security-Policy "{csp}" always; add_header X-Content-Type-Options nosniff always; }}''')
        atomic(SNIPPET,'\n'.join(lines)+'\n')
        text=originals[CONFIG].decode();include=' include /etc/nginx/snippets/proschools-career.conf;'
        if include.strip() not in text:
            anchor=' include /etc/nginx/snippets/proschools-exam-prep.conf;'
            assert text.count(anchor)==2
            text=text.replace(anchor,anchor+'\n'+include)
        assert CONFIG.read_bytes()==originals[CONFIG],'Concurrent nginx edit; retry from current state'
        atomic(CONFIG,text)
        nextlink=BASE/'current.next';nextlink.unlink(missing_ok=True);nextlink.symlink_to(RELEASE);os.replace(nextlink,CURRENT)
        ns='http://www.sitemaps.org/schemas/sitemap/0.9';ET.register_namespace('',ns);tree=ET.fromstring(originals[INDEX]);url='https://pro-schools.ru/sitemap-career.xml'
        if url not in [e.text for e in tree.iter('{'+ns+'}loc')]:ET.SubElement(ET.SubElement(tree,'{'+ns+'}sitemap'),'{'+ns+'}loc').text=url
        atomic(INDEX,ET.tostring(tree,encoding='utf-8',xml_declaration=True))
        command('nginx','-t');command('systemctl','reload','nginx')
        revalidate([p['path'] for p in updates])
        for path in MANIFEST['pages']+MANIFEST['support_pages']+['/sitemap-career.xml','/api/career/health/']:
            for attempt in range(12):
                try:
                    status,data=request(path);assert status==200 and data;break
                except Exception:
                    if attempt==11:raise
                    time.sleep(.5)
        for p in updates:
            for attempt in range(5):
                _,s=request(p['path'])
                if b'data-career-release' in s:break
                if attempt==4:raise RuntimeError('Updated blog content not visible: '+p['path'])
                time.sleep(1)
        for p in ['/','/test/','/test/extended/','/shkoly/moskva/','/kursy/','/ege/','/oge/','/metodichki/itogovoe-sochinenie-2026/']:
            assert request(p)[0]==200,p
        report={'version':VERSION,'new_pages':60,'existing_updated':9,'retained_test':True,'support_pages':len(MANIFEST['support_pages']),'backup':str(backup),'blog_preservation':blog_proof,'verified':True}
        (BASE/'deployed.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
        print(json.dumps(report,ensure_ascii=False))
    except Exception:
        for f,data in originals.items():atomic(f,data)
        if SNIPPET not in originals:SNIPPET.unlink(missing_ok=True)
        CURRENT.unlink(missing_ok=True)
        if oldlink:CURRENT.symlink_to(oldlink)
        command('nginx','-t');command('systemctl','reload','nginx')
        try:revalidate([p['path'] for p in updates])
        except Exception:pass
        raise
