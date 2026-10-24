#!/usr/bin/python3
import pathlib,tarfile,io,datetime as dt,os,json,base64,hashlib,subprocess
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import boto3
from botocore.config import Config
os.umask(0o077);master=pathlib.Path('/root/portfolio-backup.key').read_bytes().strip();out=io.BytesIO()
with tarfile.open(fileobj=out,mode='w') as archive:
 archive.add('/root/portfolio-gifts-volume.key',arcname='recovery/volume.key')
 archive.add('/etc/portfolio/education-gifts',arcname='recovery/config')
 if pathlib.Path('/root/portfolio-gifts-volume.json').exists():archive.add('/root/portfolio-gifts-volume.json',arcname='recovery/volume.json')
raw=out.getvalue();salt=os.urandom(16);nonce=os.urandom(12);stamp=dt.datetime.now(dt.timezone.utc);key=hashlib.scrypt(master,salt=b'portfolio-gifts-recovery-v1:'+salt,n=32768,r=8,p=1,dklen=32,maxmem=64*1024*1024);aad=('portfolio-gifts-recovery-v1\n'+stamp.isoformat()).encode();cipher=AESGCM(key).encrypt(nonce,raw,aad)
payload=json.dumps({'v':1,'created_at':stamp.isoformat(),'salt':base64.b64encode(salt).decode(),'nonce':base64.b64encode(nonce).decode(),'ciphertext':base64.b64encode(cipher).decode(),'sha256':hashlib.sha256(raw).hexdigest()}).encode();cfg=json.loads(pathlib.Path('/root/portfolio-selectel.json').read_text());s3=boto3.client('s3',endpoint_url=cfg['endpoint'],region_name=cfg['region'],aws_access_key_id=cfg['access_key'],aws_secret_access_key=cfg['secret_key'],config=Config(s3={'addressing_style':'virtual'},connect_timeout=15,read_timeout=30));name='gifts-recovery/'+stamp.strftime('%Y%m%dT%H%M%SZ')+'.json'
s3.put_object(Bucket=cfg['bucket'],Key=name,Body=payload,ContentMD5=base64.b64encode(hashlib.md5(payload).digest()).decode(),ObjectLockMode='COMPLIANCE',ObjectLockRetainUntilDate=stamp+dt.timedelta(days=31));version=s3.head_object(Bucket=cfg['bucket'],Key=name)['VersionId'];download=s3.get_object(Bucket=cfg['bucket'],Key=name,VersionId=version)['Body'].read();assert download==payload;assert AESGCM(key).decrypt(nonce,cipher,aad)==raw
pathlib.Path('/var/backups/portfolio/gifts-recovery-status.json').write_text(json.dumps({'verified_at':stamp.isoformat(),'object_key':name,'version':version,'original_owner_master_required':True}));print('Gift storage key and service configuration recovered from pinned S3 capsule; operator remains separate')
