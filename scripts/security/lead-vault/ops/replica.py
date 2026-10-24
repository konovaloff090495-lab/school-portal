#!/usr/bin/python3
"""Replicate a completed restic repository without temporary locks; never delete."""
import base64
import datetime as dt
import hashlib
import json
import pathlib
import os
import shutil
import sys
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

OPERATOR = sys.argv[1]
assert OPERATOR in ('gerasimov', 'konovalov')
REPO = pathlib.Path('/var/backups/portfolio-leads') / OPERATOR / 'restic'
CREDS = pathlib.Path('/root/portfolio-selectel.json')
PREFIX = 'repositories/lead-vault-' + OPERATOR + '-v1/'
c = json.loads(CREDS.read_text())
os.environ.setdefault('RESTIC_CACHE_DIR', '/var/cache/portfolio-restic')
s3 = boto3.client('s3', endpoint_url=c['endpoint'], region_name=c['region'],
                  aws_access_key_id=c['access_key'], aws_secret_access_key=c['secret_key'],
                  config=Config(s3={'addressing_style': 'virtual'}, connect_timeout=20,
                                read_timeout=120, retries={'max_attempts': 4}))
bucket = c['bucket']
now = dt.datetime.now(dt.timezone.utc)
until = now + dt.timedelta(days=31)
lock = s3.get_object_lock_configuration(Bucket=bucket)['ObjectLockConfiguration']
assert lock['ObjectLockEnabled'] == 'Enabled'
assert lock['Rule']['DefaultRetention']['Mode'] == 'COMPLIANCE'
assert lock['Rule']['DefaultRetention']['Days'] >= 30
assert s3.get_bucket_versioning(Bucket=bucket)['Status'] == 'Enabled'
if any((REPO / 'locks').glob('*')):
    raise RuntimeError('Repository is still locked; refusing incomplete replication')
paths = sorted(p for p in REPO.rglob('*') if p.is_file() and p.relative_to(REPO).parts[0] != 'locks')
if not paths or sum(p.stat().st_size for p in paths) > 2 * 1024**3:
    raise RuntimeError('Empty repository or 2 GiB safety limit reached')
manifest = {'started': now.isoformat(), 'repository': PREFIX, 'objects': [], 'uploaded': 0}
for p in paths:
    relative = p.relative_to(REPO).as_posix()
    if relative.startswith('.') or p.is_symlink():
        raise RuntimeError('Unexpected repository entry')
    key = PREFIX + relative
    sha = hashlib.sha256()
    md5 = hashlib.md5()
    with p.open('rb') as f:
        for chunk in iter(lambda: f.read(1024*1024), b''):
            sha.update(chunk)
            md5.update(chunk)
    digest = sha.hexdigest()
    try:
        head = s3.head_object(Bucket=bucket, Key=key)
    except ClientError as e:
        if e.response['Error']['Code'] not in ('404', 'NoSuchKey', 'NotFound'):
            raise
        head = None
    if head is None:
        data = p.read_bytes()
        s3.put_object(Bucket=bucket, Key=key, Body=data,
                      ContentMD5=base64.b64encode(md5.digest()).decode(),
                      Metadata={'sha256': digest}, ObjectLockMode='COMPLIANCE',
                      ObjectLockRetainUntilDate=until)
        manifest['uploaded'] += 1
        head = s3.head_object(Bucket=bucket, Key=key)
    if head['ContentLength'] != p.stat().st_size or head.get('Metadata', {}).get('sha256') != digest:
        raise RuntimeError('Remote repository conflict: ' + relative)
    # Every upload here is a single PUT. Verify the provider's payload-derived
    # ETag too, so a forged user-controlled sha256 metadata field is insufficient.
    if head.get('ETag', '').strip('"') != md5.hexdigest():
        raise RuntimeError('Remote payload checksum conflict: ' + relative)
    version = head['VersionId']
    retention = s3.get_object_retention(Bucket=bucket, Key=key, VersionId=version)['Retention']
    if retention['Mode'] != 'COMPLIANCE':
        raise RuntimeError('Unexpected protection mode')
    if retention['RetainUntilDate'] < now + dt.timedelta(days=30):
        s3.put_object_retention(Bucket=bucket, Key=key, VersionId=version,
                               Retention={'Mode': 'COMPLIANCE', 'RetainUntilDate': until})
    manifest['objects'].append({'path': relative, 'key': key, 'version': version,
                                'size': p.stat().st_size, 'sha256': digest})
manifest['finished'] = dt.datetime.now(dt.timezone.utc).isoformat()
payload = json.dumps(manifest, indent=2).encode()
run_key = 'lead-vault-runs/' + OPERATOR + '/' + now.strftime('%Y%m%dT%H%M%SZ') + '.json'
s3.put_object(Bucket=bucket, Key=run_key, Body=payload,
              ContentMD5=base64.b64encode(hashlib.md5(payload).digest()).decode(),
              ObjectLockMode='COMPLIANCE', ObjectLockRetainUntilDate=until)
status = pathlib.Path('/var/backups/portfolio-leads') / OPERATOR / 'last-replica.json'
status.write_bytes(payload)
status.chmod(0o600)
print(json.dumps({'complete': True, 'objects': len(paths), 'uploaded': manifest['uploaded'],
                  'bytes': sum(x['size'] for x in manifest['objects']), 'manifest': run_key}))

if '--verify' in sys.argv:
    import tempfile, subprocess, sqlite3
    with tempfile.TemporaryDirectory(prefix='lead-vault-restore-',dir='/var/backups/portfolio-leads') as temporary:
        temporary=pathlib.Path(temporary);download=temporary/'repo';download.mkdir()
        for item in manifest['objects']:
            payload=s3.get_object(Bucket=bucket,Key=item['key'],VersionId=item['version'])['Body'].read()
            assert hashlib.sha256(payload).hexdigest()==item['sha256']
            target=download/item['path'];target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(payload)
        args=['restic','-r',str(download),'--password-file','/etc/portfolio-leads/'+OPERATOR+'/backup.key']
        subprocess.run(args+['check','--read-data'],check=True,stdout=subprocess.DEVNULL)
        restored=temporary/'restored'
        subprocess.run(args+['restore','latest','--target',str(restored)],check=True,stdout=subprocess.DEVNULL)
        databases=list(restored.rglob('leads.sqlite3'));assert len(databases)==1
        for database in restored.rglob('*.sqlite3'):
            with sqlite3.connect(database) as db:assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
        # Verify the restored DELA archive itself, including field-key decryption.
        for archive_path in restored.rglob('delomba-private.tar'):
            import tarfile, importlib.util
            spec=importlib.util.spec_from_file_location('private_fields','/opt/portfolio-lead-vault/field_crypto.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
            keys=list(restored.rglob('legacy-delomba-fields.key'));assert len(keys)==1;codec=module.Fields(keys[0])
            with tarfile.open(archive_path) as archive:
                members=archive.getmembers();database=next(x for x in members if x.name.endswith('/.crm/crm.sqlite'));target=temporary/'delomba-check.sqlite';target.write_bytes(archive.extractfile(database).read())
                with sqlite3.connect(target) as db:
                    db.row_factory=sqlite3.Row;assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
                    for row in db.execute('SELECT * FROM subscribers'):
                        assert row['email'].startswith('pf1:');assert '@' in codec.open(row['email'],'deLomBa.email')
                        for key in ['ip','ua','src','note']:codec.open(row[key],'deLomBa.'+key)
                    for row in db.execute('SELECT data FROM log'):codec.open(row['data'],'deLomBa.data')
                for member in members:
                    if member.isfile() and member.name.endswith('.json') and ('/.submissions/' in member.name or '/.franchise_submissions/' in member.name):
                        value=json.loads(archive.extractfile(member).read());assert value['format']=='pf-json-v1';assert isinstance(json.loads(codec.open(value['data'],'deLomBa.record')),dict)
        for archive_path in restored.rglob('cardopen-postbacks.tar'):
            import tarfile,importlib.util
            spec=importlib.util.spec_from_file_location('private_fields','/opt/portfolio-lead-vault/field_crypto.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);keys=list(restored.rglob('legacy-cardopen-fields.key'));assert len(keys)==1;codec=module.Fields(keys[0])
            with tarfile.open(archive_path) as archive:
                for line in archive.extractfile('card-open.ru/ppm_postbacks.jsonl').read().splitlines():
                    value=json.loads(line);assert value['format']=='pf-jsonl-v1';assert isinstance(json.loads(codec.open(value['data'],'cardopen.postback')),dict)
        assert len(list(restored.rglob('private.pem')))==1
        (status.parent/'restore-verified.json').write_text(json.dumps({'operator':OPERATOR,'verified':dt.datetime.now(dt.timezone.utc).isoformat(),'objects':len(manifest['objects'])}))
        print('Pinned S3 download, restic read-data and SQLite/key restoration verified: '+OPERATOR)
