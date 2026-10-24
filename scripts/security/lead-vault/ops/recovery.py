#!/usr/bin/python3
"""Recover new operator keys with the owner's already saved original recovery password."""
import sys,subprocess,pathlib,json,hashlib,base64,datetime as dt,tempfile,tarfile,io,os
import boto3
from botocore.config import Config
os.umask(0o077);operator=sys.argv[1];assert operator in ('gerasimov','konovalov')
node='/usr/local/bin/node';script='/opt/portfolio-lead-vault/recovery.mjs'
payload=subprocess.check_output([node,script,operator]);stamp=dt.datetime.now(dt.timezone.utc);digest=hashlib.sha256(payload).hexdigest();key='lead-recovery/'+operator+'/'+stamp.strftime('%Y%m%dT%H%M%SZ')+'-'+digest[:12]+'.json'
c=json.loads(pathlib.Path('/root/portfolio-selectel.json').read_text());s3=boto3.client('s3',endpoint_url=c['endpoint'],region_name=c['region'],aws_access_key_id=c['access_key'],aws_secret_access_key=c['secret_key'],config=Config(s3={'addressing_style':'virtual'},connect_timeout=15,read_timeout=30,retries={'max_attempts':3}))
s3.put_object(Bucket=c['bucket'],Key=key,Body=payload,ContentMD5=base64.b64encode(hashlib.md5(payload).digest()).decode(),ObjectLockMode='COMPLIANCE',ObjectLockRetainUntilDate=stamp+dt.timedelta(days=31))
head=s3.head_object(Bucket=c['bucket'],Key=key);version=head['VersionId'];download=s3.get_object(Bucket=c['bucket'],Key=key,VersionId=version)['Body'].read();assert hashlib.sha256(download).hexdigest()==digest
protection=s3.get_object_retention(Bucket=c['bucket'],Key=key,VersionId=version)['Retention'];assert protection['Mode']=='COMPLIANCE' and protection['RetainUntilDate']>stamp+dt.timedelta(days=30)
restored=subprocess.run([node,script,operator,'--verify'],input=download,capture_output=True,check=True).stdout
with tarfile.open(fileobj=io.BytesIO(restored)) as archive:
 members={x.name:x for x in archive.getmembers()};assert operator+'/private.pem' in members and operator+'/backup.key' in members
 for member in members.values():assert member.name.startswith(operator+'/') or member.name==operator;assert not member.issym() and not member.islnk()
 private=archive.extractfile(members[operator+'/private.pem']).read();public=archive.extractfile(members[operator+'/public.pem']).read()
 result=subprocess.run(['openssl','pkey','-pubout'],input=private,capture_output=True,check=True).stdout;assert result.strip()==public.strip()
folder=pathlib.Path('/var/backups/portfolio-leads')/operator
(folder/'last-owner-recovery.json').write_text(json.dumps({'operator':operator,'verified_at':stamp.isoformat(),'object_key':key,'version':version,'sha256':digest,'uses_original_owner_recovery_password':True}))
print('Owner recovery capsule uploaded, decrypted and private/public key pairing verified: '+operator)
