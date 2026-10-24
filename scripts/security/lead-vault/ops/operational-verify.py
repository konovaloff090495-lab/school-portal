#!/usr/bin/python3
import pathlib,json,datetime as dt,hashlib,base64,io,tarfile,tempfile,sqlite3,hmac
import boto3
from botocore.config import Config
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
cfg=json.loads(pathlib.Path('/root/portfolio-selectel.json').read_text());client=boto3.client('s3',endpoint_url=cfg['endpoint'],region_name=cfg['region'],aws_access_key_id=cfg['access_key'],aws_secret_access_key=cfg['secret_key'],config=Config(s3={'addressing_style':'virtual'},connect_timeout=15,read_timeout=30));results={}
for operator in ['gerasimov','konovalov','education-gifts']:
 folder=pathlib.Path('/var/backups/portfolio-leads')/operator;status=json.loads((folder/'last-ops-archive.json').read_text());payload=client.get_object(Bucket=cfg['bucket'],Key=status['object_key'],VersionId=status['version'])['Body'].read();e=json.loads(payload);assert e['operator']==operator
 key=hmac.new(bytes.fromhex(pathlib.Path('/root/portfolio-gifts-volume.key').read_text().strip()),b'portfolio-gifts-archive-v1',hashlib.sha256).digest() if operator=='education-gifts' else bytes.fromhex((pathlib.Path('/etc/portfolio-leads')/operator/'ops-archive.key').read_text().strip());aad=('portfolio-operational-v1\n'+operator+'\n'+e['created_at']).encode();raw=AESGCM(key).decrypt(base64.b64decode(e['nonce']),base64.b64decode(e['ciphertext']),aad);assert hashlib.sha256(raw).hexdigest()==e['sha256'];count=0
 with tempfile.TemporaryDirectory(prefix='ops-verify-') as temp,tarfile.open(fileobj=io.BytesIO(raw)) as archive:
  for member in archive:
   if member.isfile() and member.name.endswith(('.sqlite','.sqlite3')):
    p=pathlib.Path(temp)/('check-'+str(count)+'.sqlite');p.write_bytes(archive.extractfile(member).read())
    with sqlite3.connect(p) as db:assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
    count+=1
 assert count>=1;results[operator]={'pinned_download_decrypted':True,'sqlite_integrity_verified':count};(folder/'ops-restore-verified.json').write_text(json.dumps({'verified_at':dt.datetime.now(dt.timezone.utc).isoformat(),**results[operator]}))
print(json.dumps(results))
