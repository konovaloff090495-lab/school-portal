"""Whole-release integrity checks before switching the production pointer."""
import pathlib,sys,json,gzip,re,html,urllib.parse,xml.etree.ElementTree as ET,subprocess,collections
R=pathlib.Path(sys.argv[1]);OLD=pathlib.Path(sys.argv[2])if len(sys.argv)>2 else None
read=lambda p:gzip.decompress(p.with_name(p.name+'.gz').read_bytes()).decode()if p.with_name(p.name+'.gz').exists()else p.read_text()
def sitemap_urls(root,path):
 t=ET.parse(path).getroot()
 if t.tag.endswith('sitemapindex'):return sum([sitemap_urls(root,root/next(x.text for x in n if x.tag.endswith('loc')).replace('https://pro-schools.ru/',''))for n in t],[])
 return[next(x.text for x in n if x.tag.endswith('loc'))for n in t]
urls=sitemap_urls(R,R/'afisha/sitemap.xml');assert len(urls)==len(set(urls))
if OLD:
 old=sitemap_urls(OLD,OLD/'afisha/sitemap.xml');missing=set(old)-set(urls);assert not missing,sorted(missing)[:20]
links=set();event_count=0;schema_count=collections.Counter()
for i,url in enumerate(urls):
 path=urllib.parse.urlsplit(url).path;p=R/path.strip('/')/'index.html';assert p.exists(),path;s=read(p);assert len(re.findall('<h1(?:>| )',s))==1,path;assert '<meta name="description" content="'in s and '<link rel="canonical" href="'+url+'"'in s,path
 ld=json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>',s,re.S)[1]);schema_count[ld['@type']]+=1
 if ld['@type']=='Event':assert ld.get('startDate')and ld.get('location'),path
 for link in re.findall(r'href="([^"]+)"',s):
  u=urllib.parse.urlsplit(html.unescape(link));value=u.path
  if value.startswith('/afisha/')and(not u.netloc or u.netloc=='pro-schools.ru'):links.add(value)
 if'/sobytie/'in path:event_count+=1
 if i and i%10000==0:print(json.dumps({'html_checked':i}),flush=True)
for link in links:
 p=R/link.strip('/');assert p.exists()or(p/'index.html').exists(),link
apps=list((R/'afisha/assets/apps').glob('*.js.gz'));assert len(apps)==227
for p in apps:subprocess.run(['node','--check'],input=gzip.decompress(p.read_bytes()),stdout=subprocess.DEVNULL,check=True)
metrics=collections.Counter();rows=json.loads(read(R/'afisha/data/russia-catalog.json'))
for e in rows:
 assert e.get('ageRestriction')is None or e['ageRestriction']<18
 for k in ['about','dates','duration','recommendedAge','bookingUrl','coordinates','ageConflict','setting']:
  if e.get(k):metrics[k]+=1
 if e['priceData'].get('unit'):metrics['price_unit']+=1
for p in(R/'afisha/data').glob('*.json.gz'):
 if p.name.endswith('-catalog.json.gz'):continue
 j=json.loads(gzip.decompress(p.read_bytes()));full=json.loads(read(R/urllib.parse.urlsplit(j['catalogData']).path.strip('/')));assert len(full)==j['total'];assert len(j['items'])<=48
report={'pages':len(urls),'event_urls':event_count,'old_urls_preserved':len(old)if OLD else None,'internal_destinations_checked':len(links),'apps_syntax_checked':len(apps),'active_events':len(rows),'facts':dict(metrics),'schema_types':dict(schema_count),'root_first_payload_gzip_bytes':(R/'afisha/data/russia.json.gz').stat().st_size}
(R/'afisha/release-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False),flush=True)
