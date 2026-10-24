#!/usr/bin/python3
"""Fixed encrypted data volume. Never falls back to an unencrypted directory."""
import pathlib,subprocess,os,sys,json
assert os.geteuid()==0
config=json.loads(pathlib.Path('/root/portfolio-gifts-volume.json').read_text());image=pathlib.Path(config['image']);key='/root/portfolio-gifts-volume.key';mapper='/dev/mapper/portfolio_gifts';target='/var/lib/portfolio/education-gifts'
assert image.is_file() and not image.is_symlink()
if sys.argv[1]=='open':
 if not pathlib.Path(mapper).exists():subprocess.run(['cryptsetup','open','--key-file',key,str(image),'portfolio_gifts'],check=True)
 assert subprocess.check_output(['blkid','-s','UUID','-o','value',mapper]).decode().strip()==config['uuid'],'Wrong encrypted filesystem'
 if subprocess.run(['mountpoint','-q',target]).returncode:subprocess.run(['mount','-o','nodev,nosuid,noexec',mapper,target],check=True)
 source=subprocess.check_output(['findmnt','-n','-o','SOURCE','--mountpoint',target]).decode().strip();assert os.path.realpath(source)==os.path.realpath(mapper),'Wrong mounted device'
elif sys.argv[1]=='close':
 if subprocess.run(['mountpoint','-q',target]).returncode==0:subprocess.run(['umount',target],check=True)
 if pathlib.Path(mapper).exists():subprocess.run(['cryptsetup','close','portfolio_gifts'],check=True)
else:raise SystemExit('Only open/close supported')
