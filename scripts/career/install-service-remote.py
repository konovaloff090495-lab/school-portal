#!/usr/bin/env python3
"""Install reviewed sidecar on the current host. Secrets stay on the server."""
from pathlib import Path
import json,os,secrets,shlex,shutil,subprocess,time,urllib.request
BASE=Path('/srv/portfolio/proschools/static/career')
SOURCE=BASE/'service-incoming'
DEST=Path('/usr/local/lib/proschools-career')
ENV=Path('/etc/proschools-career.env')
def read_env(path):
    result={}
    for line in Path(path).read_text().splitlines():
        if not line.strip() or line.lstrip().startswith('#') or '=' not in line:continue
        key,value=line.split('=',1)
        try: value=' '.join(shlex.split(value))
        except ValueError:raise RuntimeError('Invalid environment configuration')
        result[key.strip()]=value
    return result
def run(*args):return subprocess.run(args,check=True,capture_output=True,text=True)
assert os.geteuid()==0
assert run('hostname').stdout.strip()=='portfolio-reserve-20261102','Unexpected host'
assert shutil.disk_usage(BASE).free>30*1024*1024,'Insufficient room for small service'
old_env=read_env(ENV) if ENV.exists() else {}
gifts=read_env('/etc/portfolio/education-gifts/runtime.env')
site=read_env('/etc/portfolio/proschools/runtime.env')
settings={**old_env,'CAREER_ORIGIN':'https://pro-schools.ru','CAREER_PORT':'8795','CAREER_DB':'/var/lib/proschools-career/career.sqlite3','CAREER_KEY_HEX':old_env.get('CAREER_KEY_HEX') or secrets.token_hex(32),
 'EASYCODE_WEBHOOK_URL':gifts['EASYCODE_WEBHOOK_URL'],'UKIDS_WEBHOOK_URL':gifts['UKIDS_WEBHOOK_URL'],
 'SYNERGY_GRAPHQL_URL':'https://api.school.synergy.ru/graphql','SYNERGY_LAND_CODE':'mo_tilda_online_school',
 'CAREER_CRM_TIMEOUT_MS':'60000','CAREER_NODE_MODULE_ROOT':'/usr/local/lib/proschools-career',
 'CAREER_SMTP_HOST':'smtp.beget.com','CAREER_SMTP_PORT':'2525','CAREER_SMTP_SECURE':'false','CAREER_SMTP_USER':'hello@pro-schools.ru','CAREER_SMTP_PASSWORD':site['PROSCHOOLS_SMTP_PASSWORD'],'CAREER_SMTP_FROM':'ProSchools <hello@pro-schools.ru>'}
backup=BASE/'backups'/('service-'+time.strftime('%Y%m%d-%H%M%S'))
backup.mkdir(parents=True,mode=0o700)
if ENV.exists():shutil.copy2(ENV,backup/'runtime.env');os.chmod(backup/'runtime.env',0o600)
if DEST.exists():shutil.copytree(DEST,backup/'service',dirs_exist_ok=True)
unit=Path('/etc/systemd/system/proschools-career.service')
if unit.exists():shutil.copy2(unit,backup/'proschools-career.service')
def quote(v):return '"'+str(v).replace('\\','\\\\').replace('"','\\"').replace('\n','\\n')+'"'
temp=ENV.with_suffix('.incoming');temp.write_text('\n'.join(k+'='+quote(v) for k,v in settings.items())+'\n');os.chmod(temp,0o600);os.replace(temp,ENV)
DEST.mkdir(parents=True,exist_ok=True)
mailer_source=Path('/srv/portfolio/proschools/current/node_modules/nodemailer').resolve()
assert mailer_source.is_dir()
shutil.copytree(mailer_source,DEST/'node_modules/nodemailer',dirs_exist_ok=True)
(DEST/'package.json').write_text('{"name":"proschools-career","private":true,"type":"module"}')
for item in (DEST/'node_modules').rglob('*'):os.chmod(item,0o755 if item.is_dir() else 0o644)
for p in SOURCE.glob('*.mjs'):
    if p.name.endswith('.test.mjs'):continue
    shutil.copy2(p,DEST/p.name);os.chmod(DEST/p.name,0o644)
shutil.copy2(SOURCE/'questions.json',DEST/'questions.json')
shutil.copy2(SOURCE/'proschools-career.service',unit)
try:
    run('systemctl','daemon-reload');run('systemctl','enable','--now','proschools-career.service');run('systemctl','restart','proschools-career.service')
    for i in range(20):
        try:
            with urllib.request.urlopen('http://127.0.0.1:8795/api/career/health/',timeout=3) as r:assert r.status==200 and json.load(r)['ok']
            break
        except Exception:
            if i==19:raise RuntimeError('Career service health check failed')
            time.sleep(.5)
    print(json.dumps({'installed':True,'service':'proschools-career','backup':str(backup),'smtp_configured':bool(settings.get('CAREER_SMTP_PASSWORD')),'partners_configured':['easycode','ukids','synergy']}))
except Exception:
    if (backup/'service').exists():
        for p in (backup/'service').iterdir():shutil.copy2(p,DEST/p.name)
    if (backup/'runtime.env').exists():shutil.copy2(backup/'runtime.env',ENV)
    if (backup/'proschools-career.service').exists():shutil.copy2(backup/'proschools-career.service',unit)
    run('systemctl','daemon-reload')
    if (backup/'service').exists():run('systemctl','restart','proschools-career.service')
    else:subprocess.run(['systemctl','disable','--now','proschools-career.service'],capture_output=True)
    raise
