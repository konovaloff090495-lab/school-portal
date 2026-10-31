# coding:utf-8
"""Publish coordinate corrections without rebuilding content or changing event URLs."""
import os,pathlib,json,gzip,collections,datetime,shutil,subprocess
from geodata import source_index,apply,valid
H=pathlib.Path(__file__).resolve().parent;R=pathlib.Path(os.environ['AFISHA_ROOT']);A=pathlib.Path(os.environ.get('AFISHA_ASSETS','/srv/portfolio/proschools/static/afisha/current/afisha/assets'));release=A.parent.parent
index=source_index(R);detail=(H/'detail-map.production.js').read_text();catalog=(H/'map.production.js').read_text();template=(H/'style.template.css').read_text()
def atomic(path,text,compressed=False):
 st=path.stat()if path.exists()else None;t=path.with_name(path.name+'.geo-incoming');t.write_bytes(gzip.compress(text.encode(),compresslevel=6,mtime=0)if compressed else text.encode());os.chmod(t,st.st_mode&0o777 if st else 0o644)
 if st and os.geteuid()==0:os.chown(t,st.st_uid,st.st_gid)
 t.replace(path)
# Check all app replacements before changing any live file.
apps=list((A/'apps').glob('*.js.gz'));assert len(apps)==227
for p in apps:
 s=gzip.decompress(p.read_bytes()).decode();a=s.index('function drawVenueMap()');b=s.index('function renderLocation()',a);s=s[:a]+detail+'\n'+s[b:];a=s.index('function renderMap(a)');b=s.index('function renderContext(a)',a);s=s[:a]+catalog+'\n'+s[b:];subprocess.run(['node','--check'],input=s.encode(),check=True,stdout=subprocess.DEVNULL)
# Snapshot only own files being replaced; callers guard disk and preserve prior release.
backup=H/'backups'/datetime.datetime.now(datetime.timezone.utc).strftime('geo-%Y%m%dT%H%M%SZ');backup.mkdir(parents=True)
for folder in [A/'apps',release/'afisha/data']:
 for p in folder.glob('*.gz'):
  dest=backup/p.relative_to(release);dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest)
shutil.copy2(A/'style.css',backup/'style.css')
bycity={};national=[]
for p in (release/'afisha/data').glob('*.json.gz'):
 j=json.loads(gzip.decompress(p.read_bytes()));apply(j['items'],index);apply(j.get('alternatives',[]),index);name=j['config']['name'];bycity[name]={'events':len(j['items']),'with_point':sum(valid(e.get('coordinates'))for e in j['items']),'without_point':sum(not valid(e.get('coordinates'))for e in j['items'])}
 if name=='Россия':national=j['items']
 atomic(p,json.dumps(j,ensure_ascii=False,separators=(',',':')),True)
for p in apps:
 s=gzip.decompress(p.read_bytes()).decode();a=s.index('function drawVenueMap()');b=s.index('function renderLocation()',a);s=s[:a]+detail+'\n'+s[b:];a=s.index('function renderMap(a)');b=s.index('function renderContext(a)',a);s=s[:a]+catalog+'\n'+s[b:];assert 'map-widget/v1/?text='not in s and 'z=16&text='not in s;atomic(p,s,True)
css=(A/'style.css').read_text();suffix=css[css.index('\n#ps-afisha-mock{border:0!important'):];atomic(A/'style.css',template+suffix)
unknown=[{k:e.get(k)for k in ['id','city','place','address','coordinate_status','sources']}for e in national if not valid(e.get('coordinates'))];report={'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'events':len(national),'with_point':len(national)-len(unknown),'without_point':len(unknown),'cities':bycity,'unresolved':unknown,'rule':'Only published venue/place coordinates, exact source identity and matching address. No city-centre or search fallback.'}
atomic(release/'afisha/coordinate-audit.json',json.dumps(report,ensure_ascii=False,indent=2));atomic(R/'work/afisha-production/coordinate-audit.json',json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in report.items()if k not in ['cities','unresolved']}),flush=True)
