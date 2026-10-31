"""Recoverable compact archive of an immutable release; logical gzip bytes are deduplicated."""
import pathlib,subprocess,tarfile,gzip,hashlib,io,os,sys,shutil,argparse
p=argparse.ArgumentParser();p.add_argument('--release',required=True);p.add_argument('--archive',required=True);p.add_argument('--retire',action='store_true');args=p.parse_args();release=pathlib.Path(args.release).resolve();archive=pathlib.Path(args.archive);current=release.parent.parent/'current';assert release.parent.name=='releases'and release!=current.resolve();archive.parent.mkdir(exist_ok=True);temp=archive.with_name(archive.name+'.incoming');count=0
with temp.open('wb')as output:
 proc=subprocess.Popen(['zstd','-q','-3','-T1','--long=25','-c'],stdin=subprocess.PIPE,stdout=output)
 with tarfile.open(fileobj=proc.stdin,mode='w|')as tar:
  for path in sorted(release.rglob('*')):
   if not path.is_file()or path.is_symlink():continue
   raw=path.read_bytes();logical=gzip.decompress(raw)if path.suffix=='.gz'else raw;info=tarfile.TarInfo(str(path.relative_to(release)));info.size=len(logical);info.mode=path.stat().st_mode&0o777;info.mtime=int(path.stat().st_mtime);info.pax_headers={'afisha.sha256':hashlib.sha256(logical).hexdigest(),'afisha.gzip':'1'if path.suffix=='.gz'else'0'};tar.addfile(info,io.BytesIO(logical));count+=1
 proc.stdin.close();assert proc.wait()==0
verified=0
proc=subprocess.Popen(['zstd','-q','-d','-c',str(temp)],stdout=subprocess.PIPE)
with tarfile.open(fileobj=proc.stdout,mode='r|')as tar:
 for member in tar:
  data=tar.extractfile(member).read();assert hashlib.sha256(data).hexdigest()==member.pax_headers['afisha.sha256'];verified+=1
assert proc.wait()==0 and verified==count;temp.replace(archive)
# The current release and candidate are never retired by this operation.
if args.retire:
 assert archive.exists()and release!=current.resolve();shutil.rmtree(release)
print({'archived_files':count,'verified_files':verified,'archive_bytes':archive.stat().st_size,'retired':args.retire},flush=True)
