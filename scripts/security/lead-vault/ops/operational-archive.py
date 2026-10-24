#!/usr/bin/python3
"""Minute encrypted snapshots of operational state; uploads only changed content."""
import os,pathlib,json,datetime as dt,sqlite3,tarfile,tempfile,io,hashlib,base64,subprocess,fcntl,pwd,contextlib,hmac
import boto3
from botocore.config import Config
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
os.umask(0o077)
lock=open('/var/backups/portfolio-leads/ops-archive.lock','a')
try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
except BlockingIOError:raise SystemExit(0)
config=json.loads(pathlib.Path('/root/portfolio-selectel.json').read_text());client=boto3.client('s3',endpoint_url=config['endpoint'],region_name=config['region'],aws_access_key_id=config['access_key'],aws_secret_access_key=config['secret_key'],config=Config(s3={'addressing_style':'virtual'},connect_timeout=12,read_timeout=25,retries={'max_attempts':2}))
@contextlib.contextmanager
def operator_temporary(username='lead-gerasimov'):
 with tempfile.TemporaryDirectory(prefix='ops-consistent-') as folder:
  account=pwd.getpwnam(username);os.chown(folder,account.pw_uid,account.pw_gid)
  try:yield folder
  finally:os.chown(folder,0,0)
now=dt.datetime.now(dt.timezone.utc);failed=[]
operators=['gerasimov','konovalov']
if pathlib.Path('/etc/portfolio/education-gifts/encrypted-storage-ready').exists():operators.append('education-gifts')
for operator in operators:
 try:
  state=pathlib.Path('/var/lib/portfolio-leads')/operator;folder=pathlib.Path('/var/backups/portfolio-leads')/operator;folder.mkdir(mode=0o700,exist_ok=True)
  key=hmac.new(bytes.fromhex(pathlib.Path('/root/portfolio-gifts-volume.key').read_text().strip()),b'portfolio-gifts-archive-v1',hashlib.sha256).digest() if operator=='education-gifts' else bytes.fromhex((pathlib.Path('/etc/portfolio-leads')/operator/'ops-archive.key').read_text().strip());aes=AESGCM(key)
  if operator in ('gerasimov','education-gifts'):
   username='lead-gerasimov' if operator=='gerasimov' else 'site-education-gifts'
   sources=[('newsletter.sqlite3',state/'crm-mailer.sqlite3'),('schools.sqlite3',state/'school-submissions/applications.sqlite3')] if operator=='gerasimov' else [('contest.sqlite3',pathlib.Path('/var/lib/portfolio/education-gifts/contest.sqlite'))]
   with operator_temporary(username) as temporary:
    output=io.BytesIO()
    with tarfile.open(fileobj=output,mode='w') as archive:
     for name,source in sources:
      if not source.exists():continue
      target=pathlib.Path(temporary)/name
      snapshot="import sqlite3,sys; a=sqlite3.connect('file:'+sys.argv[1]+'?mode=ro',uri=True);b=sqlite3.connect(sys.argv[2]);a.backup(b);assert b.execute('PRAGMA integrity_check').fetchone()[0]=='ok';b.close();a.close()"
      subprocess.run(['runuser','-u',username,'--','/usr/bin/python3','-c',snapshot,str(source),str(target)],check=True,capture_output=True,timeout=15)
      data=target.read_bytes();item=tarfile.TarInfo(name);item.mode=0o600;item.size=len(data);archive.addfile(item,io.BytesIO(data))
    raw=output.getvalue()
  else:
   command=['ssh','-i','/home/portfolio-admin/migration/beget-reader','-o','IdentitiesOnly=yes','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','UserKnownHostsFile=/root/portfolio-beget-known-hosts','-o','ConnectTimeout=15','kvantb7q@kvantb7q.beget.tech','delomba-records']
   result=subprocess.run(command,capture_output=True,timeout=45);assert result.returncode==0,'Shared snapshot failed';raw=result.stdout
  if operator in ('gerasimov','konovalov'):
   username='lead-'+operator
   with operator_temporary(username) as temporary:
    source=state/'auth.sqlite3';target=pathlib.Path(temporary)/'auth.sqlite3'
    snapshot="import sqlite3,sys; a=sqlite3.connect('file:'+sys.argv[1]+'?mode=ro',uri=True);b=sqlite3.connect(sys.argv[2]);a.backup(b);assert b.execute('PRAGMA integrity_check').fetchone()[0]=='ok';b.close();a.close()"
    subprocess.run(['runuser','-u',username,'--','/usr/bin/python3','-c',snapshot,str(source),str(target)],check=True,capture_output=True,timeout=15)
    content=target.read_bytes();buffer=io.BytesIO(raw)
    with tarfile.open(fileobj=buffer,mode='a') as archive:
     member=tarfile.TarInfo('operator-auth.sqlite3');member.mode=0o600;member.size=len(content);archive.addfile(member,io.BytesIO(content))
    raw=buffer.getvalue()
  assert len(raw)<16*1024*1024,'Operational snapshot exceeds size guard'
  # Tar metadata is deterministic except the source manifest and SQLite temp mtime.
  normalized=hashlib.sha256()
  with tarfile.open(fileobj=io.BytesIO(raw)) as archive:
   for member in sorted(archive.getmembers(),key=lambda x:x.name):
    if member.isfile() and member.name!='PORTFOLIO-BACKUP-MANIFEST.json':normalized.update(member.name.encode()+b'\x00'+archive.extractfile(member).read())
  content_hash=normalized.hexdigest();path=folder/'last-ops-archive.json';previous=json.loads(path.read_text()) if path.exists() else {}
  if previous.get('content_sha256')==content_hash:
   previous['checked_at']=now.isoformat();path.write_text(json.dumps(previous));continue
  aad=('portfolio-operational-v1\n'+operator+'\n'+now.isoformat()).encode();nonce=os.urandom(12);cipher=aes.encrypt(nonce,raw,aad)
  envelope={'v':1,'operator':operator,'created_at':now.isoformat(),'nonce':base64.b64encode(nonce).decode(),'ciphertext':base64.b64encode(cipher).decode(),'sha256':hashlib.sha256(raw).hexdigest()};payload=json.dumps(envelope).encode();object_key='operational-records/'+operator+'/'+now.strftime('%Y%m%dT%H%M%SZ')+'-'+content_hash[:16]+'.json'
  client.put_object(Bucket=config['bucket'],Key=object_key,Body=payload,ContentMD5=base64.b64encode(hashlib.md5(payload).digest()).decode(),ObjectLockMode='COMPLIANCE',ObjectLockRetainUntilDate=now+dt.timedelta(days=31))
  version=client.head_object(Bucket=config['bucket'],Key=object_key)['VersionId'];download=client.get_object(Bucket=config['bucket'],Key=object_key,VersionId=version)['Body'].read();assert download==payload
  receipt=json.loads(download);restored=aes.decrypt(base64.b64decode(receipt['nonce']),base64.b64decode(receipt['ciphertext']),aad);assert restored==raw
  retention=client.get_object_retention(Bucket=config['bucket'],Key=object_key,VersionId=version)['Retention'];assert retention['Mode']=='COMPLIANCE' and retention['RetainUntilDate']>now+dt.timedelta(days=30)
  path.write_text(json.dumps({'operator':operator,'checked_at':now.isoformat(),'archived_at':now.isoformat(),'content_sha256':content_hash,'object_key':object_key,'version':version,'restoration_verified':True,'bytes':len(raw)}));path.chmod(0o600)
 except Exception as error:
  failed.append(operator+':'+type(error).__name__)
print(json.dumps({'operational_archives_checked':len(operators),'failed':failed}));raise SystemExit(bool(failed))
