import pathlib,gzip,os,subprocess
base=pathlib.Path('/srv/portfolio/proschools/static/afisha/current/afisha/assets/apps');count=0
for p in base.glob('*.js.gz'):
 s=gzip.decompress(p.read_bytes()).decode();new=s.replace('Постоянная программа · график у площадки','Даты и график у площадки')
 if new!=s:
  q=p.with_suffix(p.suffix+'.label');q.write_bytes(gzip.compress(new.encode(),mtime=0));q.replace(p);count+=1
p=base/'moskva.js.gz';subprocess.run(['node','--check'],input=gzip.decompress(p.read_bytes()),check=True);print('Schedule wording corrected in',count,'city apps')
