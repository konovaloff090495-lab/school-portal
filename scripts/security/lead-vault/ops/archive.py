#!/usr/bin/python3
"""Mirror ciphertext only, without exposing provider credentials to either website."""
import json,pathlib,sqlite3,os,hashlib,base64,datetime as dt,fcntl
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
os.umask(0o077)
base=pathlib.Path('/var/backups/portfolio-leads');base.mkdir(exist_ok=True,mode=0o700)
lock=(base/'archive.lock').open('w');fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
creds=json.loads(pathlib.Path('/root/portfolio-selectel.json').read_text())
s3=boto3.client('s3',endpoint_url=creds['endpoint'],region_name=creds['region'],aws_access_key_id=creds['access_key'],aws_secret_access_key=creds['secret_key'],config=Config(s3={'addressing_style':'virtual'},connect_timeout=10,read_timeout=20,retries={'max_attempts':2}))
now=dt.datetime.now(dt.timezone.utc);until=now+dt.timedelta(days=31)
for operator in ('gerasimov','konovalov'):
 folder=base/operator;folder.mkdir(exist_ok=True)
 ledger=sqlite3.connect(folder/'archive-receipts.sqlite3');ledger.execute('CREATE TABLE IF NOT EXISTS receipts(id TEXT PRIMARY KEY,digest TEXT NOT NULL,object_key TEXT NOT NULL,version TEXT NOT NULL,verified_at TEXT NOT NULL)')
 with sqlite3.connect('file:/var/lib/portfolio-leads/'+operator+'/leads.sqlite3?mode=ro',uri=True) as source:
  rows=source.execute('SELECT id,envelope,digest FROM leads ORDER BY received_at').fetchall()
 pending=[row for row in rows if not ledger.execute('SELECT 1 FROM receipts WHERE id=? AND digest=?', (row[0],row[2])).fetchone()]
 if pending:
  cfg=s3.get_object_lock_configuration(Bucket=creds['bucket'])['ObjectLockConfiguration'];assert cfg['ObjectLockEnabled']=='Enabled' and cfg['Rule']['DefaultRetention']['Mode']=='COMPLIANCE'
 for id,envelope,digest in pending[:200]:
  value=envelope.encode();assert hashlib.sha256(value).hexdigest()==digest
  item=json.loads(value);assert item['operator']==operator and item['id']==id and len(value)<160000
  key='lead-records/'+operator+'/v1/'+id+'.json'
  try:head=s3.head_object(Bucket=creds['bucket'],Key=key)
  except ClientError as e:
   if e.response['Error']['Code'] not in ('404','NoSuchKey','NotFound'):raise
   head=None
  if head is None:
   s3.put_object(Bucket=creds['bucket'],Key=key,Body=value,ContentMD5=base64.b64encode(hashlib.md5(value).digest()).decode(),Metadata={'sha256':digest},ObjectLockMode='COMPLIANCE',ObjectLockRetainUntilDate=until)
   head=s3.head_object(Bucket=creds['bucket'],Key=key)
  assert head['ContentLength']==len(value) and head.get('Metadata',{}).get('sha256')==digest
  version=head['VersionId'];protection=s3.get_object_retention(Bucket=creds['bucket'],Key=key,VersionId=version)['Retention'];assert protection['Mode']=='COMPLIANCE' and protection['RetainUntilDate']>now+dt.timedelta(days=30)
  downloaded=s3.get_object(Bucket=creds['bucket'],Key=key,VersionId=version)['Body'].read();assert hashlib.sha256(downloaded).hexdigest()==digest
  ledger.execute('INSERT INTO receipts VALUES(?,?,?,?,?)',(id,digest,key,version,now.isoformat()));ledger.commit()
 remaining=max(0,len(pending)-200);ledger.close()
 (folder/'last-archive.json').write_text(json.dumps({'operator':operator,'checked_at':now.isoformat(),'total':len(rows),'copied':min(200,len(pending)),'remaining':remaining}))
 print(json.dumps({'operator':operator,'archived':min(200,len(pending)),'remaining':remaining}))
