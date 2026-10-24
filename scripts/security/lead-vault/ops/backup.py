#!/usr/bin/python3
"""Consistent, separately encrypted operator backups. Never prunes or deletes remote objects."""
import pathlib,subprocess,sqlite3,os,shutil,datetime,json,sys
os.umask(0o077)
operator=sys.argv[1]
assert operator in ('gerasimov','konovalov')
base=pathlib.Path('/var/backups/portfolio-leads')/operator;base.mkdir(parents=True,exist_ok=True)
repo=base/'restic';stage=base/'stage';stage.mkdir(exist_ok=True)
config=pathlib.Path('/etc/portfolio-leads')/operator
state=pathlib.Path('/var/lib/portfolio-leads')/operator
if shutil.disk_usage(base).free < 20*1024**3:raise RuntimeError('Free disk guard: need 20 GiB')
with sqlite3.connect('file:'+str(state/'leads.sqlite3')+'?mode=ro',uri=True) as source,sqlite3.connect(stage/'leads.sqlite3') as target:source.backup(target)
with sqlite3.connect(stage/'leads.sqlite3') as db:assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
# Operational newsletter state belongs only to the Gerasimov contour.
if operator=='gerasimov':
    operational=state/'crm-mailer.sqlite3'
    if operational.exists():
        with sqlite3.connect('file:'+str(operational)+'?mode=ro',uri=True) as source,sqlite3.connect(stage/'mailer.sqlite3') as target:source.backup(target)
        with sqlite3.connect(stage/'mailer.sqlite3') as check:assert check.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
password=config/'backup.key'
if not password.exists():
 import secrets
 password.write_text(secrets.token_urlsafe(48)+'\n');password.chmod(0o600)
args=['restic','-r',str(repo),'--password-file',str(password)]
if not (repo/'config').exists():subprocess.run(args+['init'],check=True,stdout=subprocess.DEVNULL)
subprocess.run(args+['backup','--tag','lead-vault-'+operator,str(stage),str(config)],check=True,stdout=subprocess.DEVNULL)
subprocess.run(['/usr/local/sbin/portfolio-lead-replica',operator],check=True)
subprocess.run(['/usr/local/sbin/portfolio-lead-recovery',operator],check=True)
(base/'last-success.json').write_text(json.dumps({'operator':operator,'completed':datetime.datetime.now(datetime.timezone.utc).isoformat()}))
print('Separated operator backup and immutable replica complete: '+operator)
