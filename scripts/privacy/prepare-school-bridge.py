#!/usr/bin/python3
import pathlib,os,hashlib
root=pathlib.Path('/srv/portfolio/proschools/releases');release=pathlib.Path('/srv/portfolio/proschools/current').resolve(strict=True);assert release.parent==root
script=release/'scripts/school-submissions.py';client=pathlib.Path('/opt/portfolio-school/proschools/client.py');saved=pathlib.Path('/opt/portfolio-school/proschools/source-history');saved.mkdir(exist_ok=True,mode=0o700)
if not script.is_symlink():
 data=script.read_bytes();backup=saved/(hashlib.sha256(data).hexdigest()+'.py')
 if not backup.exists():backup.write_bytes(data);backup.chmod(0o600)
 temp=script.with_name('.school-bridge.pending');temp.symlink_to(client);os.replace(temp,script)
else:assert script.resolve()==client
