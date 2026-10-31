import os,pathlib,gzip,json
root=pathlib.Path(os.environ['AFISHA_ROOT'])/'work/excursion-donors/tripster-schedules';saved=0;count=0
for p in root.glob('*.json'):
 b=p.read_bytes();json.loads(b);st=p.stat();q=p.with_suffix('.json.gz');q.write_bytes(gzip.compress(b,mtime=0));os.utime(q,(st.st_atime,st.st_mtime));saved+=len(b)-q.stat().st_size;p.unlink();count+=1
print('Public calendar cache compressed:',count,'files;',saved//1048576,'MiB saved')
