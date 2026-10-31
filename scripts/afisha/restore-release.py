"""Restore a verified logical-gzip .tar.zst archive without expanding its disk footprint."""
import pathlib,subprocess,tarfile,gzip,hashlib,os,sys
archive=pathlib.Path(sys.argv[1]);dest=pathlib.Path(sys.argv[2]);assert not dest.exists();dest.mkdir(parents=True);proc=subprocess.Popen(['zstd','-q','-d','-c',str(archive)],stdout=subprocess.PIPE);count=0
with tarfile.open(fileobj=proc.stdout,mode='r|')as tar:
 for member in tar:
  path=(dest/member.name).resolve();assert path.is_relative_to(dest.resolve());data=tar.extractfile(member).read();assert hashlib.sha256(data).hexdigest()==member.pax_headers['afisha.sha256'];path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(gzip.compress(data,compresslevel=6,mtime=0)if member.pax_headers.get('afisha.gzip')=='1'else data);os.chmod(path,member.mode&0o777);os.utime(path,(member.mtime,member.mtime));count+=1
assert proc.wait()==0;print({'restored_files':count},flush=True)
