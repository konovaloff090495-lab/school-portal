#!/usr/bin/python3
import pathlib,os,hashlib
root=pathlib.Path('/srv/portfolio/proschools/releases');release=pathlib.Path('/srv/portfolio/proschools/current').resolve(strict=True)
assert release.parent==root
script=release/'scripts/crm-mailer.py';client=pathlib.Path('/opt/portfolio-mailer/proschools/mailer-client.py');saved=pathlib.Path('/opt/portfolio-mailer/proschools/source-history');saved.mkdir(exist_ok=True,mode=0o700)
if not script.is_symlink():
 data=script.read_bytes();backup=saved/(hashlib.sha256(data).hexdigest()+'.py')
 if not backup.exists():backup.write_bytes(data);backup.chmod(0o600)
 temp=script.with_name('.crm-mailer-bridge.tmp');temp.symlink_to(client);os.replace(temp,script)
else:assert script.resolve()==client
