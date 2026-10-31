import os,pathlib,json,subprocess,datetime,gzip,shutil
H=pathlib.Path(__file__).resolve().parent;R=pathlib.Path(os.environ['AFISHA_ROOT']);S=pathlib.Path(os.environ['AFISHA_STATIC']);tag=os.environ['AFISHA_RESUME_RELEASE'];stage=S/'releases'/tag
assert stage.is_dir()and(stage/'afisha/status.json').exists()
env={**os.environ,'AFISHA_RELEASE':str(stage),'AFISHA_ONLY_ASSETS':'1'}
subprocess.run(['/usr/bin/python3',str(H/'build.py')],env=env,check=True)
report=json.loads((stage/'afisha/status.json').read_text());assert report['cities']==225 and report['moscow_oblast_cities']==74
for name in ['moskva','kazan','balashikha','russia']:
 js=stage/'afisha/assets/apps'/f'{name}.js';body=js.read_bytes()if js.stat().st_size else gzip.decompress(js.with_suffix('.js.gz').read_bytes());subprocess.run(['node','--check'],input=body,check=True)
for name in ['moskva','sankt-peterburg','moskovskaya-oblast','moskovskaya-oblast/balashikha']:
 p=stage/'afisha'/name/'index.html.gz';assert'<h1>'in gzip.decompress(p.read_bytes()).decode()
current=S/'current';old=current.resolve()if current.exists()else None
status=json.loads((R/'last-refresh.json').read_text());status.update({'success':True,'finished_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'release':tag,'events':report['unique_events'],'cities':225,'moscow_oblast_cities':74,'interval_hours':48,'promotion_retry_verified':True});status.pop('error',None);status.pop('previous_release_preserved',None)
(stage/'afisha/refresh-status.json').write_text(json.dumps(status,ensure_ascii=False,indent=2));link=S/('promote-'+tag);link.symlink_to(stage);link.replace(current);(R/'last-refresh.json').write_text(json.dumps(status,ensure_ascii=False,indent=2))
for other in(S/'releases').iterdir():
 if other.is_dir()and other.resolve()not in [old,stage.resolve()]:shutil.rmtree(other)
print(json.dumps(status,ensure_ascii=False),flush=True)
