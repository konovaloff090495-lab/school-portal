# coding:utf-8
import os,sys,pathlib,json,subprocess,fcntl,datetime,shutil,gzip,time
H=pathlib.Path(__file__).resolve().parent;R=pathlib.Path(os.environ['AFISHA_ROOT']);S=pathlib.Path(os.environ.get('AFISHA_STATIC','/srv/portfolio/proschools/static/afisha'));W=R/'work/afisha-scale';R.mkdir(parents=True,exist_ok=True);W.mkdir(parents=True,exist_ok=True)
lock=open(R/'refresh.lock','w');fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB);started=datetime.datetime.now(datetime.timezone.utc).isoformat();tag=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ');stage=S/'releases'/tag;warnings=[]
env={**os.environ,'AFISHA_SCALE_WORK':str(W),'AFISHA_OUTPUT':str(W/'candidate.json'),'AFISHA_RELEASE':str(stage)}
def run(path,optional=False):
 print('RUN',path.name,flush=True);r=subprocess.run([sys.executable,str(path)],env=env,cwd=R)
 if r.returncode:
  if optional:warnings.append({'source':path.name,'exit':r.returncode});return False
  raise RuntimeError(path.name+' failed: '+str(r.returncode))
 return True
status={'started_at':started,'success':False}
try:
 if shutil.disk_usage(S).free<550*1024*1024:raise RuntimeError('Insufficient space for a safe candidate; current catalogue retained')
 if '--cached'not in sys.argv:
  ok=run(H/'collectors/collect.py',optional=True)
  run(H/'collectors/afisha-collect.py',optional=True)
  report_file=W/'afisha-run.json'
  if report_file.exists():
   issues=json.loads(report_file.read_text()).get('errors',[])
   if issues:warnings.append({'source':'Afisha.ru','source_issues':len(issues),'previous_source_records_preserved':True})
  if not ok:raise RuntimeError('Incomplete Culture source refresh; current catalogue retained')
 run(H/'collectors/normalize.py');run(H/'collectors/merge-afisha.py');run(H/'collectors/afisha-age.py')
 run(H/'collectors/quicktickets.py',optional=True);run(H/'collectors/vidnoe.py',optional=True)
 candidate=json.loads((W/'candidate.json').read_text());events=candidate['events'];ids=[e['id']for e in events]
 if not ids or len(ids)!=len(set(ids)):raise RuntimeError('Empty catalogue or duplicate IDs')
 if any(e['age_restriction']is not None and e['age_restriction']>=18 for e in events):raise RuntimeError('Adult event in child catalogue')
 target=R/'outputs/ProSchools-afisha-national.json';target.parent.mkdir(exist_ok=True);previous=json.loads(target.read_text())if target.exists()else None
 if previous and len(events)<len(previous['events'])*.65:raise RuntimeError('Unexpected source coverage drop; previous catalogue retained')
 temp=target.with_suffix('.incoming');shutil.copy2(W/'candidate.json',temp);temp.replace(target)
 if os.environ.get('TRIPSTER_PUBLIC_CONFIG'):
  if run(H/'collectors/tripster.py',optional=True):run(H/'collectors/tripster-prepare.py',optional=True)
 run(H/'collectors/venue-geo.py',optional=True)
 run(H/'data.py')
 # Retain previously published event URLs and their original facts when a donor delists one.
 current=S/'current';previous_current=current.resolve()if current.exists()else None
 if current.exists():
  for p in current.rglob('index.html.gz'):
   rel=p.relative_to(current)
   if 'sobytie'in rel.parts:
    dest=stage/rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest);dest.with_suffix('').touch()
 run(H/'build.py')
 report=json.loads((stage/'afisha/status.json').read_text())
 if report['cities']<225 or report['moscow_oblast_cities']!=74:raise RuntimeError('City or Moscow Oblast coverage mismatch')
 for city in ['moskva','sankt-peterburg','moskovskaya-oblast/balashikha','moskovskaya-oblast']:
  p=stage/'afisha'/city/'index.html.gz'
  if not p.exists()or'<h1>'not in gzip.decompress(p.read_bytes()).decode():raise RuntimeError('Invalid city page: '+city)
 for name in ['moskva','sankt-peterburg','kazan','balashikha']:
  js=stage/'afisha/assets/apps'/f'{name}.js';body=js.read_bytes()if js.stat().st_size else gzip.decompress(js.with_suffix('.js.gz').read_bytes());subprocess.run(['node','--check'],input=body,check=True)
 status.update({'success':True,'finished_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'release':tag,'events':report['unique_events'],'cities':report['cities'],'moscow_oblast_cities':74,'warnings':warnings,'interval_hours':48})
 (stage/'afisha/refresh-status.json').write_text(json.dumps(status,ensure_ascii=False,indent=2))
 link=S/('current-'+tag);link.symlink_to(stage);link.replace(current)
 releases=sorted([p for p in(S/'releases').iterdir()if p.is_dir()and p.name[0].isdigit()],key=lambda p:p.name,reverse=True)
 for old in releases:
  if old.resolve()not in [current.resolve(),previous_current]:shutil.rmtree(old)
 (R/'last-refresh.json').write_text(json.dumps(status,ensure_ascii=False,indent=2));print(json.dumps(status,ensure_ascii=False),flush=True)
except Exception as error:
 status.update({'finished_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'error':str(error),'previous_release_preserved':True,'warnings':warnings});(R/'last-refresh.json').write_text(json.dumps(status,ensure_ascii=False,indent=2));print(json.dumps(status,ensure_ascii=False),flush=True);raise
