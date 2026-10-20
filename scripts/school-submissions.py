#!/usr/bin/env python3
"""Private school applications, moderation, audit, durable transactional mail queue."""
import contextlib, datetime as dt, email.utils, fcntl, hashlib, hmac, html, json, os, re, secrets, smtplib, sqlite3, ssl, sys, time
from email.message import EmailMessage
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
STORE = Path(os.environ.get('SCHOOL_SUBMISSIONS_DIR', '/var/lib/school-portal/school-submissions' if os.environ.get('NODE_ENV') == 'production' else ROOT / 'data-private/school-submissions'))
BASE = 'https://pro-schools.ru'
FROM = 'hello@pro-schools.ru'

def now(): return int(time.time())
def load_env():
    for name in ('.env.local', '.env'):
        p = ROOT / name
        if p.exists():
            for line in p.read_text().splitlines():
                k, sep, v = line.partition('=')
                if sep and re.fullmatch(r'[A-Z][A-Z0-9_]*', k):
                    value=v.strip()
                    if value.startswith('"'):
                        try:value=json.loads(value)
                        except ValueError:continue
                    else:value=value.strip("'")
                    os.environ.setdefault(k,value)

def secret():
    STORE.mkdir(parents=True, exist_ok=True, mode=0o700)
    p = STORE / 'secret'
    temporary = STORE / ('.secret-'+secrets.token_hex(12))
    fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    try:
        with os.fdopen(fd, 'w') as f: f.write(secrets.token_hex(32))
        try: os.link(temporary,p)
        except FileExistsError: pass
    finally: temporary.unlink(missing_ok=True)
    return p.read_text().strip().encode()

def token(id, purpose='owner'): return hmac.new(secret(), (purpose+':'+id).encode(), hashlib.sha256).hexdigest()
def authorized(id, candidate, purpose='owner'): return bool(re.fullmatch(r'[a-f0-9]{32}', id or '') and isinstance(candidate,str) and hmac.compare_digest(token(id,purpose),candidate))
def db():
    STORE.mkdir(parents=True, exist_ok=True, mode=0o700)
    con = sqlite3.connect(STORE/'applications.sqlite3', timeout=15)
    os.chmod(STORE/'applications.sqlite3', 0o600)
    con.row_factory = sqlite3.Row
    con.executescript('''PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS applications(id TEXT PRIMARY KEY,request_id TEXT UNIQUE NOT NULL,data TEXT NOT NULL,photos TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'unconfirmed',confirmed INTEGER,created INTEGER NOT NULL,updated INTEGER NOT NULL,comment TEXT NOT NULL DEFAULT '',live_data TEXT,live_photos TEXT,published INTEGER,marketing INTEGER NOT NULL DEFAULT 0,subscribed INTEGER,unsubscribed INTEGER,score INTEGER,feedback TEXT,ip TEXT,last_request TEXT);
    CREATE TABLE IF NOT EXISTS audit(seq INTEGER PRIMARY KEY,id TEXT,event TEXT,at INTEGER,detail TEXT);
    CREATE TABLE IF NOT EXISTS mail(id INTEGER PRIMARY KEY,application TEXT NOT NULL,kind TEXT NOT NULL,dedupe TEXT UNIQUE NOT NULL,due INTEGER NOT NULL,state TEXT DEFAULT 'queued',attempts INTEGER DEFAULT 0,lease INTEGER,error TEXT,sent INTEGER);
    CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY,count INTEGER,until INTEGER);
    ''')
    return con

def audit(c,id,event,detail=''): c.execute('INSERT INTO audit(id,event,at,detail) VALUES(?,?,?,?)',(id,event,now(),detail[:2000]))
def enqueue(c,id,kind,key,due=None): c.execute('INSERT OR IGNORE INTO mail(application,kind,dedupe,due) VALUES(?,?,?,?)',(id,kind,key,due or now()))
def limited(c,key,cap,window):
    row=c.execute('SELECT * FROM limits WHERE key=?',(key,)).fetchone()
    count=row['count'] if row and row['until']>now() else 0
    if count>=cap: raise ValueError('Слишком много попыток. Попробуйте позже.')
    c.execute('INSERT OR REPLACE INTO limits VALUES(?,?,?)',(key,count+1,row['until'] if row and row['until']>now() else now()+window))

def application(c,id):
    row=c.execute('SELECT * FROM applications WHERE id=?',(id,)).fetchone()
    if not row: raise ValueError('Заявка не найдена')
    return dict(row)

def private(c,row,owner=True):
    result={k:row[k] for k in ['id','status','created','updated','confirmed','comment','published','marketing','subscribed','unsubscribed','score','feedback']}
    result.update(data=json.loads(row['data']),photos=json.loads(row['photos']),url=BASE+'/shkola/s-'+row['id']+'/' if row['published'] else None)
    result['emails']=[dict(r) for r in c.execute('SELECT kind,state,attempts,sent,error FROM mail WHERE application=? ORDER BY id DESC LIMIT 15',(row['id'],))]
    if not owner: result['history']=[dict(r) for r in c.execute('SELECT event,at,detail FROM audit WHERE id=? ORDER BY seq DESC LIMIT 30',(row['id'],))]
    return result

def operate(action,p):
    # Public catalogue reads during builds need no database or secret.
    if action=='public' and not (STORE/'applications.sqlite3').exists(): return []
    c=db()
    try:
        c.execute('BEGIN IMMEDIATE' if action not in ('public','get','admin-list','image') else 'BEGIN')
        id=p.get('id','')
        if action=='create':
            prev=c.execute('SELECT * FROM applications WHERE request_id=?',(p['request_id'],)).fetchone()
            if prev:
                if prev['ip']!=p['ip']: raise ValueError('Повторите отправку с новой страницы')
                return {'id':prev['id'],'token':token(prev['id']),'duplicate':True}
            limited(c,'new-ip:'+p['ip'],5,86400)
            limited(c,'new-email:'+p['data']['email'].lower(),3,86400)
            c.execute('INSERT INTO applications(id,request_id,data,photos,created,updated,marketing,ip) VALUES(?,?,?,?,?,?,?,?)',(id,p['request_id'],json.dumps(p['data'],ensure_ascii=False),json.dumps(p['photos'],ensure_ascii=False),now(),now(),int(p['data']['marketing_agreed']),p['ip']))
            audit(c,id,'created');enqueue(c,id,'confirm','confirm:'+id)
            return {'id':id,'token':token(id)}
        if action=='public':
            rows=c.execute('SELECT id,live_data,live_photos,published FROM applications WHERE published IS NOT NULL ORDER BY published DESC').fetchall()
            return [{'id':r['id'],'data':json.loads(r['live_data']),'photos':json.loads(r['live_photos']),'published':r['published']} for r in rows if not p.get('id') or r['id']==p['id']]
        if action=='admin-list':
            return [private(c,dict(r),False) for r in c.execute('SELECT * FROM applications ORDER BY CASE status WHEN "pending" THEN 0 WHEN "changes" THEN 1 ELSE 2 END,updated DESC LIMIT 300')]
        if action=='rate':
            limited(c,p['key'],int(p['cap']),int(p['window']));return {'ok':True}
        row=application(c,id)
        if action not in ('moderate','image') and not authorized(id,p.get('token'),'unsubscribe' if action=='unsubscribe' else 'owner'): raise PermissionError('Недействительная ссылка заявки')
        if action=='get': return private(c,row)
        if action=='image':
            allowed=json.loads(row['live_photos'] or '[]')
            if p.get('admin') or authorized(id,p.get('token')): allowed=json.loads(row['photos'])+allowed
            found=next((photo for photo in allowed if photo['file']==p['photo']),None)
            if not found: raise PermissionError('Фотография недоступна')
            return {'file':found['file'],'public':any(x['file']==p['photo'] for x in json.loads(row['live_photos'] or '[]'))}
        if action=='confirm':
            if not authorized(id,p.get('confirmation'),'confirm'):raise PermissionError('Подтвердите почту по ссылке из письма')
            if row['status']=='unconfirmed':
                c.execute('UPDATE applications SET status="pending",confirmed=?,updated=? WHERE id=?',(now(),now(),id));audit(c,id,'email_confirmed');enqueue(c,id,'pending','pending:first:'+id)
                if row['marketing']: enqueue(c,id,'subscribe','subscribe:'+id)
            return {'ok':True}
        if action=='resend':
            limited(c,'resend:'+id,3,3600)
            if row['status']=='unconfirmed':enqueue(c,id,'confirm','confirm:'+id+':'+str(now()//180))
            return {'ok':True}
        if action=='resubmit':
            if row['last_request']==p['request_id']:return {'id':id,'token':p['token']}
            if row['status']=='unconfirmed': raise ValueError('Сначала подтвердите почту')
            limited(c,'edit:'+id,10,3600)
            if p['data']['email'].lower()!=json.loads(row['data'])['email'].lower(): raise ValueError('Для смены почты обратитесь в редакцию')
            c.execute('UPDATE applications SET data=?,photos=?,status="pending",updated=?,comment="",marketing=?,last_request=? WHERE id=?',(json.dumps(p['data'],ensure_ascii=False),json.dumps(p['photos'],ensure_ascii=False),now(),int(p['data']['marketing_agreed']),p['request_id'],id));audit(c,id,'resubmitted');enqueue(c,id,'pending','pending:'+id+':'+p['request_id'])
            if p['data']['marketing_agreed'] and not row['subscribed']:enqueue(c,id,'subscribe','subscribe:'+id)
            if not p['data']['marketing_agreed']:
                c.execute('UPDATE applications SET unsubscribed=? WHERE id=?',(now(),id));c.execute('UPDATE mail SET state="cancelled" WHERE application=? AND kind IN ("tips","refresh","subscribe") AND state="queued"',(id,))
            return {'id':id,'token':p['token']}
        if action=='feedback':
            score=p.get('score');text=p.get('text','')
            if type(score)!=int or score not in range(1,6) or not isinstance(text,str) or len(text)>2000:raise ValueError('Выберите оценку от 1 до 5')
            c.execute('UPDATE applications SET score=?,feedback=? WHERE id=?',(score,text,id));audit(c,id,'feedback',str(score));return {'ok':True}
        if action=='moderate':
            status=p.get('status');comment=p.get('comment','').strip()
            if not row['confirmed'] or row['status']=='unconfirmed': raise ValueError('Почта представителя ещё не подтверждена')
            if status not in ('published','changes','rejected'): raise ValueError('Неизвестное решение')
            if row['status']!='pending': raise ValueError('Решение уже принято. Обновите список заявок.')
            if status!='published' and not comment: raise ValueError('Напишите, что нужно исправить или почему заявка отклонена')
            if len(comment)>3000:raise ValueError('Комментарий слишком длинный')
            c.execute('UPDATE applications SET status=?,comment=?,updated=? WHERE id=?',(status,comment,now(),id))
            if status=='published':c.execute('UPDATE applications SET live_data=data,live_photos=photos,published=? WHERE id=?',(now(),id))
            audit(c,id,status,comment);enqueue(c,id,status,status+':'+id+':'+str(now()));return {'ok':True,'url':BASE+'/shkola/s-'+id+'/'}
        if action=='subscribe':
            if not authorized(id,p.get('subscription'),'subscribe'):raise PermissionError('Подтвердите подписку по отдельной ссылке из письма')
            if not row['confirmed'] or not row['marketing']:raise ValueError('Сначала подтвердите заявку и согласие на рассылку')
            if not row['subscribed']:
                c.execute('UPDATE applications SET subscribed=?,unsubscribed=NULL WHERE id=?',(now(),id));audit(c,id,'subscribed');enqueue(c,id,'tips','tips:'+id);enqueue(c,id,'refresh','refresh:'+id,now()+14*86400)
            return {'ok':True}
        if action=='unsubscribe':
            c.execute('UPDATE applications SET unsubscribed=?,marketing=0 WHERE id=?',(now(),id));c.execute('UPDATE mail SET state="cancelled" WHERE application=? AND kind IN ("tips","refresh","subscribe") AND state="queued"',(id,));audit(c,id,'unsubscribed');return {'ok':True}
        raise ValueError('Неизвестное действие')
    finally:
        if sys.exc_info()[0]: c.rollback()
        else:c.commit()
        c.close()

def render_mail(row,kind):
    d=json.loads(row['data']);link=BASE+'/dobavit-shkolu/zayavka/#'+row['id']+'.'+token(row['id'])
    name=d['school'];contact=d['name'].strip().split()[0]
    messages={
      'confirm':('Подтвердите заявку на добавление школы','Подтвердим, что это вы?',f'{contact}, вы отправили заявку на добавление школы «{name}». Откройте заявку по кнопке и подтвердите почту. Затем редакция начнёт проверку.','Подтвердить почту','Если вы не подавали заявку, проигнорируйте это письмо.'),
      'pending':(f'{name}: заявка на модерации','Школа уже на проверке',f'{contact}, заявка поступила редакции. Мы проверим информацию и фотографии. Если потребуются уточнения, напишем вам. Повторно отправлять заявку не нужно.','Посмотреть статус','Решение принимает редакция. До одобрения новая карточка не публикуется.'),
      'changes':(f'{name}: нужны уточнения','Осталось немного уточнить',row['comment'],'Доработать заявку','Данные и фотографии сохранены. После изменений отправьте заявку на повторную проверку.'),
      'published':(f'{name} теперь на Про-Скул','Ваша школа теперь в каталоге!',f'{contact}, редакция проверила и опубликовала вашу школу. Родители смогут прочитать описание, посмотреть фотографии и связаться со школой.','Открыть страницу школы','Сохраните личную ссылку заявки для обновления данных: '+link),
      'rejected':(f'{name}: решение по заявке','Пока не можем опубликовать заявку',row['comment'],'Открыть заявку','Если произошла ошибка, исправьте сведения и отправьте заявку на повторное рассмотрение.'),
      'subscribe':('Подтвердите подписку для представителей школ','Полезные письма для вашей школы',f'{contact}, вы согласились получать советы по оформлению карточки и новости размещения. Подтвердите подписку отдельно на странице заявки.','Подтвердить подписку','Если не подтвердите, рассылки не будет. Служебные статусы заявки приходят независимо от подписки.'),
      'tips':('Как сделать карточку школы полезнее родителям','Три детали, которые помогут выбору','Расскажите о реальном учебном дне. Покажите классы и места отдыха. Укажите стоимость, период оплаты и что входит в цену. Конкретные сведения помогают родителям понять, подходит ли им школа.','Открыть свою заявку','Изменения проходят проверку редакции.'),
      'refresh':('Проверьте актуальность страницы вашей школы','Родителям важны свежие данные','Проверьте контакты, условия приёма и стоимость. Если что-то изменилось, предложите обновление через заявку. После проверки редакцией информация появится в каталоге.','Обновить сведения','Вы подписаны на письма для представителей школ.')
    }
    subject,title,text,label,note=messages[kind]
    target=BASE+'/shkola/s-'+row['id']+'/' if kind=='published' else link
    if kind=='confirm':target=link+'?confirm='+token(row['id'],'confirm')
    if kind=='subscribe':target=link+'?subscribe='+token(row['id'],'subscribe')
    unsubscribe=BASE+'/api/school-submissions/unsubscribe/?id='+row['id']+'&token='+token(row['id'],'unsubscribe')
    marketing=kind in ('subscribe','tips','refresh')
    e=html.escape
    content=f'''<!doctype html><html lang="ru"><meta charset="utf-8"><body style="margin:0;background:#fff8f0;font-family:Arial,sans-serif;color:#26251f"><div style="max-width:600px;margin:24px auto;background:#fffdf8;padding:32px;border:1px solid #e7ded1;border-radius:16px"><div style="font-size:23px;font-weight:bold">pro<span style="color:#b24526">·</span>school.ru</div><h1 style="font-size:25px;margin-top:28px">{e(title)}</h1><p style="font-size:15px;line-height:1.8">{e(text)}</p><p style="margin:28px 0"><a href="{e(target)}" style="display:inline-block;padding:14px 20px;background:#fa754b;color:#26251f;text-decoration:none;border-radius:9px;font-weight:bold">{e(label)} →</a></p><p style="font-size:13px;line-height:1.8;color:#726b60">{e(note)}</p><hr style="border:0;border-top:1px solid #e7ded1"><p style="font-size:12px;line-height:1.8;color:#726b60">Про-Скул · Заявка № {e(row['id'][:8])}<br>Вопросы: <a href="mailto:{FROM}">{FROM}</a><br>Личная ссылка предназначена только представителю школы.</p>{f'<p style="font-size:12px"><a href="{e(unsubscribe)}">Отписаться от рассылки</a></p>' if marketing else ''}</div></body></html>'''
    plain=f'{title}\n\n{text}\n\n{label}: {target}\n\n{note}\n\nВопросы: {FROM}'
    return subject,content,plain,unsubscribe if marketing else None

def run_mail():
    load_env();password=os.environ.get('PROSCHOOLS_SMTP_PASSWORD')
    if not password:raise RuntimeError('SMTP password not configured')
    STORE.mkdir(parents=True,exist_ok=True,mode=0o700)
    with (STORE/'mail.lock').open('a') as lock:
        try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except BlockingIOError:return {'busy':True}
        c=db();sent=0;failed=0
        for _ in range(10):
            c.execute('BEGIN IMMEDIATE')
            c.execute('UPDATE mail SET state="queued" WHERE state="sending" AND lease<?',(now()-600,))
            if c.execute('SELECT count(*) FROM mail WHERE sent>?',(now()-86400,)).fetchone()[0]>=100:c.commit();break
            job=c.execute('SELECT * FROM mail WHERE state="queued" AND due<=? ORDER BY id LIMIT 1',(now(),)).fetchone()
            if not job:c.commit();break
            row=application(c,job['application'])
            if job['kind'] in ('confirm','pending','changes','rejected') and row['status']!= {'confirm':'unconfirmed','pending':'pending','changes':'changes','rejected':'rejected'}[job['kind']]:
                c.execute('UPDATE mail SET state="cancelled" WHERE id=?',(job['id'],));c.commit();continue
            if job['kind'] in ('subscribe','tips','refresh') and (not row['marketing'] or row['unsubscribed'] or (job['kind']!='subscribe' and not row['subscribed'])):
                c.execute('UPDATE mail SET state="cancelled" WHERE id=?',(job['id'],));c.commit();continue
            c.execute('UPDATE mail SET state="sending",attempts=attempts+1,lease=? WHERE id=?',(now(),job['id']));c.commit()
            try:
                subject,content,plain,unsubscribe=render_mail(row,job['kind'])
                message=EmailMessage();message['From']='Про-Скул <'+FROM+'>';message['To']=json.loads(row['data'])['email'];message['Subject']=' '.join(subject.split())[:250];message['Date']=email.utils.formatdate(localtime=False);message['Message-ID']=f'<school-{job["id"]}-{row["id"]}@pro-schools.ru>'
                if unsubscribe:message['List-Unsubscribe']='<'+unsubscribe+'>';message['List-Unsubscribe-Post']='List-Unsubscribe=One-Click'
                message.set_content(plain);message.add_alternative(content,subtype='html')
                with smtplib.SMTP_SSL('smtp.beget.com',465,context=ssl.create_default_context(),timeout=25) as smtp:
                    smtp.login(FROM,password);smtp.send_message(message)
                c.execute('UPDATE mail SET state="sent",sent=?,error=NULL WHERE id=?',(now(),job['id']));c.commit();sent+=1
            except (smtplib.SMTPException,OSError,ValueError,KeyError) as error:
                attempt=job['attempts']+1
                c.execute('UPDATE mail SET state=?,due=?,error=? WHERE id=?',('failed' if attempt>=8 else 'queued',now()+min(86400,300*2**attempt),type(error).__name__,job['id']));c.commit();failed+=1
        c.close();return {'smtp_accepted':sent,'failed_attempts':failed}

if __name__=='__main__':
    try:
        action=sys.argv[1]
        if action=='mail-run':result=run_mail()
        else:result=operate(action,json.load(sys.stdin))
        print(json.dumps(result,ensure_ascii=False))
    except (ValueError,PermissionError) as error:
        print(json.dumps({'error':str(error),'forbidden':isinstance(error,PermissionError)},ensure_ascii=False));sys.exit(2)
