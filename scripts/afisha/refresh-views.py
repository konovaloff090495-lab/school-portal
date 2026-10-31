"""Roll date-based HTML forward from the published snapshot, without fetching sources."""
import pathlib,os,fcntl,json,datetime,subprocess
R=pathlib.Path(os.environ['AFISHA_ROOT']);H=pathlib.Path(__file__).resolve().parent;S=pathlib.Path('/srv/portfolio/proschools/static/afisha');lock=open(R/'refresh.lock','a')
try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
except BlockingIOError:print('Source refresh running; view refresh skipped');raise SystemExit(0)
current=(S/'current').resolve();env={**os.environ,'AFISHA_TEMPORAL_ONLY':'1','AFISHA_RELEASE':str(current)};subprocess.run(['/usr/bin/python3',str(H/'build.py')],env=env,check=True,cwd=R)
report={'rendered_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source_requests':0,'source_refresh_interval_hours':48};p=current/'afisha/views-status.json';temp=p.with_suffix('.incoming');temp.write_text(json.dumps(report,ensure_ascii=False));temp.replace(p);print(json.dumps(report),flush=True)
