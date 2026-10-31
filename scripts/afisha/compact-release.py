import pathlib,gzip,os,sys
base=pathlib.Path('/srv/portfolio/proschools/static/afisha/releases')
for name in sys.argv[1:]:
 root=base/name
 assert root.resolve().is_relative_to(base.resolve())
 saved=0
 for folder,pattern in [(root/'afisha/data','*.json'),(root/'afisha/assets/apps','*.js')]:
  for p in folder.glob(pattern):
   if not p.stat().st_size:continue
   b=p.read_bytes();q=p.with_suffix(p.suffix+'.gz');tmp=q.with_suffix(q.suffix+'.compact');tmp.write_bytes(gzip.compress(b,compresslevel=6,mtime=0));tmp.replace(q);p.write_bytes(b'');saved+=len(b)-q.stat().st_size
 print(name,'saved',saved//1048576,'MiB',flush=True)
