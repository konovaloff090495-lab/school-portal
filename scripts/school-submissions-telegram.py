"""Owner-only Telegram moderation, durable cards and private photo uploads."""
import contextlib,fcntl,hashlib,html,json,os,re,secrets,urllib.request

def revision(row):return hashlib.sha256((row['id']+':'+str(row['revision'])).encode()).hexdigest()[:16]

def tables(c):
    c.executescript('''CREATE TABLE IF NOT EXISTS telegram_cards(application TEXT,revision TEXT,message_id INTEGER,photos_sent INTEGER DEFAULT 0,attempts INTEGER DEFAULT 0,next_at INTEGER DEFAULT 0,error TEXT,body TEXT,details_sent INTEGER DEFAULT 0,PRIMARY KEY(application,revision)); CREATE TABLE IF NOT EXISTS telegram_feedback(application TEXT PRIMARY KEY,sent_digest TEXT,pending_digest TEXT,attempts INTEGER DEFAULT 0,due INTEGER DEFAULT 0);''')

def api(method,payload,files=None):
    token=os.environ.get('TELEGRAM_BOT_TOKEN','')
    if not token:raise RuntimeError('Telegram is not configured')
    if files:
        boundary='school-'+secrets.token_hex(16);parts=[]
        for key,value in payload.items():
            value=json.dumps(value,ensure_ascii=False) if isinstance(value,(dict,list)) else str(value)
            parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode())
        for key,path in files.items():
            mime='image/jpeg' if path.suffix=='.jpg' else 'text/plain; charset=utf-8'
            parts.extend([f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"; filename="{path.name}"\r\nContent-Type: {mime}\r\n\r\n'.encode(),path.read_bytes(),b'\r\n'])
        parts.append(f'--{boundary}--\r\n'.encode());data=b''.join(parts);content_type='multipart/form-data; boundary='+boundary
    else:data=json.dumps(payload,ensure_ascii=False).encode();content_type='application/json'
    request=urllib.request.Request('https://api.telegram.org/bot'+token+'/'+method,data=data,headers={'Content-Type':content_type})
    try:
        with urllib.request.urlopen(request,timeout=35 if files else 4) as response:result=json.load(response)
    except Exception:raise RuntimeError('Telegram transport failed') from None
    if not result.get('ok'):raise RuntimeError('Telegram request rejected')
    return result['result']

def safe_api(method,payload):
    try:return api(method,payload)
    except RuntimeError:return None

def admin():
    chat=os.environ.get('TELEGRAM_CHAT_ID','');owner=os.environ.get('TELEGRAM_ADMIN_ID',chat)
    if not chat.isdigit() or not owner.isdigit():raise PermissionError('Configure the private owner chat')
    return chat,owner

def body(row):
    d=json.loads(row['data']);e=lambda v:html.escape(str(v or ''))
    lines=['🏫 <b>'+('Правки школы на модерации' if row['revision'] else 'Новая школа на модерации')+'</b>','<b>'+e(d['school'])+'</b>',e(d.get('city'))+' · '+e(d.get('address')),e(d.get('type'))+' · '+e(d.get('format'))]
    for title,key,limit in [('Классы / возраст','age',100),('Стоимость','price',180),('Сайт','website',250),('Лицензия','license',180)]:
        value=', '.join(map(str,d.get('grades',[]))) if key=='age' and d.get('grades') else d.get(key)
        if value:lines.append('<b>'+title+':</b> '+e(value[:limit]))
    lines.extend(['','<b>О школе:</b> '+e(d.get('description','')[:900])])
    for title,key in [('Программы','features'),('Поступление','admission')]:
        if d.get(key):lines.append('<b>'+title+':</b> '+e(d[key][:180]))
    lines.extend(['','<b>Представитель:</b> '+e(d.get('name'))+' · '+e(d.get('role')),e(d.get('email')),'Фото: '+str(len(json.loads(row['photos']))),'', 'Выберите решение кнопкой ниже. Чтобы вернуть на доработку или уточнить причину отказа — ответьте на это сообщение текстом.','#school_'+row['id']])
    result='\n'.join(lines)
    plain=html.unescape(re.sub(r'</?b>','',result))
    if len(plain.encode('utf-16-le'))>5600:
        plain=plain.encode('utf-16-le')[:5100].decode('utf-16-le',errors='ignore')+'\n\nПолные сведения — в приложенном файле.\n#school_'+row['id']
        result=html.escape(plain)
    return result

def full_details(row):
    d=json.loads(row['data']);labels={'school':'Школа','type':'Тип','format':'Формат','city':'Город','address':'Адрес','grades':'Классы','age':'Возраст','price':'Стоимость','license':'Лицензия','website':'Сайт','schoolPhone':'Телефон школы','schoolEmail':'Почта школы','description':'О школе','features':'Программы','admission':'Как поступить','name':'Представитель','role':'Должность','email':'Почта представителя'}
    return '\n\n'.join(label+':\n'+(', '.join(map(str,d.get(key,[]))) if key=='grades' else str(d.get(key,''))) for key,label in labels.items())

def feedback(m,c,chat):
    sent=0;tried=0
    for row in c.execute('SELECT * FROM applications WHERE confirmed IS NOT NULL AND score IS NOT NULL ORDER BY updated DESC LIMIT 300').fetchall():
        digest=hashlib.sha256((str(row['score'])+':'+(row['feedback'] or '')).encode()).hexdigest()
        c.execute('INSERT OR IGNORE INTO telegram_feedback(application) VALUES(?)',(row['id'],));c.commit()
        job=dict(c.execute('SELECT * FROM telegram_feedback WHERE application=?',(row['id'],)).fetchone())
        if job['sent_digest']==digest:continue
        if job['pending_digest']!=digest:
            c.execute('UPDATE telegram_feedback SET pending_digest=?,attempts=0,due=0 WHERE application=?',(digest,row['id']));c.commit();job.update(attempts=0,due=0)
        if job['due']>m.now() or job['attempts']>=8:continue
        school=json.loads(row['data'])['school'];note=(row['feedback'] or '').encode('utf-16-le')[:5500].decode('utf-16-le',errors='ignore')
        tried+=1
        try:
            api('sendMessage',{'chat_id':chat,'text':'⭐ Удобство добавления школы: '+str(row['score'])+'/5\n'+school+'\n\n'+note+'\n\n#school_'+row['id'],'link_preview_options':{'is_disabled':True}})
            c.execute('UPDATE telegram_feedback SET sent_digest=?,attempts=0,due=0 WHERE application=?',(digest,row['id']));c.commit();sent+=1
        except RuntimeError:
            c.execute('UPDATE telegram_feedback SET attempts=attempts+1,due=? WHERE application=?',(m.now()+min(3600,60*2**(job['attempts']+1)),row['id']));c.commit()
        if tried>=5:break
    return sent

def run(m):
    if not os.environ.get('TELEGRAM_BOT_TOKEN') or not os.environ.get('TELEGRAM_CHAT_ID'):return {'configured':False}
    chat,_=admin();m.STORE.mkdir(parents=True,exist_ok=True,mode=0o700)
    with (m.STORE/'telegram.lock').open('a') as lock:
        os.chmod(m.STORE/'telegram.lock',0o600)
        try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except BlockingIOError:return {'busy':True}
        c=m.db();tables(c);sent=0;failed=0
        try:
            rows=[dict(r) for r in c.execute('SELECT * FROM applications WHERE status="pending" AND confirmed IS NOT NULL ORDER BY updated LIMIT 300')]
            for row in rows:
                rev=revision(row);c.execute('INSERT OR IGNORE INTO telegram_cards(application,revision) VALUES(?,?)',(row['id'],rev));c.commit()
                job=dict(c.execute('SELECT * FROM telegram_cards WHERE application=? AND revision=?',(row['id'],rev)).fetchone())
                if job['message_id'] or job['next_at']>m.now() or job['attempts']>=8:continue
                if sent+failed>=5:break
                try:
                    photos=json.loads(row['photos'])
                    if photos and not job['photos_sent']:
                        files={};media=[]
                        for i,photo in enumerate(photos):
                            if not re.fullmatch(r'[a-f0-9]{32}\.jpg',photo['file']):raise ValueError('Invalid photo')
                            files['photo'+str(i)]=m.STORE/'photos'/row['id']/photo['file']
                            media.append({'type':'photo','media':'attach://photo'+str(i),'caption':(json.loads(row['data'])['school']+' · '+photo.get('caption',''))[:1000]})
                        if len(media)==1:api('sendPhoto',{'chat_id':chat,'photo':'attach://photo0','caption':media[0]['caption']},files)
                        else:api('sendMediaGroup',{'chat_id':chat,'media':media},files)
                        c.execute('UPDATE telegram_cards SET photos_sent=1 WHERE application=? AND revision=?',(row['id'],rev));c.commit()
                    data=json.loads(row['data'])
                    if not job['details_sent']:
                        directory=m.STORE/'telegram-details';directory.mkdir(mode=0o700,exist_ok=True)
                        document=directory/(row['id']+'-'+rev+'.txt')
                        fd=os.open(document,os.O_WRONLY|os.O_CREAT|os.O_TRUNC,0o600)
                        with os.fdopen(fd,'w') as f:f.write(full_details(row))
                        api('sendDocument',{'chat_id':chat,'document':'attach://details','caption':('Полная заявка: '+data['school'])[:900]},{'details':document})
                        c.execute('UPDATE telegram_cards SET details_sent=1 WHERE application=? AND revision=?',(row['id'],rev));c.commit()
                    text=body(row)
                    result=api('sendMessage',{'chat_id':chat,'text':text,'parse_mode':'HTML','link_preview_options':{'is_disabled':True},'reply_markup':{'inline_keyboard':[[{'text':'✅ Опубликовать','callback_data':'ps:p:'+row['id']+':'+rev},{'text':'🚫 Отклонить','callback_data':'ps:r:'+row['id']+':'+rev}]]}})
                    c.execute('UPDATE telegram_cards SET message_id=?,body=?,error=NULL WHERE application=? AND revision=?',(result['message_id'],text,row['id'],rev));c.commit();sent+=1
                except Exception as error:
                    c.execute('UPDATE telegram_cards SET attempts=attempts+1,next_at=?,error=? WHERE application=? AND revision=?',(m.now()+min(3600,60*2**(job['attempts']+1)),type(error).__name__,row['id'],rev));c.commit();failed+=1
            return {'sent':sent,'failed':failed,'feedback_sent':feedback(m,c,chat)}
        finally:c.close()

def handle(m,update):
    chat,owner=admin();callback=update.get('callback_query');message=(callback or {}).get('message') if callback else update.get('message')
    sender=(callback or message or {}).get('from',{})
    if not message or str(sender.get('id'))!=owner or str(message.get('chat',{}).get('id'))!=chat:
        return {'ignored':True}
    c=m.db();tables(c)
    try:
        if callback:
            match=re.fullmatch(r'ps:([pr]):([a-f0-9]{32}):([a-f0-9]{16})',callback.get('data',''))
            if not match:return {'ignored':True}
            action,id,rev=match.groups()
            card=c.execute('SELECT * FROM telegram_cards WHERE application=? AND revision=? AND message_id=?',(id,rev,message.get('message_id'))).fetchone()
        else:
            reply=message.get('reply_to_message',{});text=message.get('text','').strip()
            if not reply or not text or len(text)>3000:return {'ignored':True}
            card=c.execute('SELECT * FROM telegram_cards WHERE message_id=?',(reply.get('message_id'),)).fetchone()
            if card:id,rev=card['application'],card['revision']
        if not card:return {'ignored':True}
        card=dict(card);row=m.application(c,id)
        if revision(row)!=rev:
            if callback:safe_api('answerCallbackQuery',{'callback_query_id':callback['id'],'text':'Пришла новая версия заявки. Используйте её карточку.','show_alert':True})
            return {'stale':True}
    finally:c.close()
    if callback:
        status='published' if action=='p' else 'rejected'
        if row['status']=='pending':
            m.operate('moderate',{'id':id,'status':status,'comment':'' if status=='published' else 'Заявка отклонена редакцией. Уточните сведения о школе и отправьте заявку повторно.','expected_revision':rev,'update_id':str(update['update_id'])})
        else:status=row['status']
        label={'published':'✅ ОПУБЛИКОВАНО','rejected':'🚫 ОТКЛОНЕНО','changes':'✏️ НА ДОРАБОТКЕ'}.get(status,status)
        url=m.BASE+'/shkola/s-'+id+'/'
        safe_api('answerCallbackQuery',{'callback_query_id':callback['id'],'text':label})
        markup={'inline_keyboard':[[{'text':'Открыть опубликованную школу','url':url}]] if status=='published' else []}
        safe_api('editMessageText',{'chat_id':chat,'message_id':card['message_id'],'text':card['body']+'\n\n<b>'+label+'</b>','parse_mode':'HTML','reply_markup':markup,'link_preview_options':{'is_disabled':True}})
    else:
        if row['status']=='pending':m.operate('moderate',{'id':id,'status':'changes','comment':text,'expected_revision':rev,'update_id':str(update['update_id'])})
        elif row['status'] in ('rejected','changes'):m.operate('moderation-note',{'id':id,'comment':text,'expected_revision':rev,'update_id':str(update['update_id'])})
        else:
            safe_api('sendMessage',{'chat_id':chat,'text':'Школа уже опубликована. Для нового решения нужна новая версия заявки.'});return {'ignored':True}
        label='🚫 ОТКЛОНЕНО' if row['status']=='rejected' else '✏️ НА ДОРАБОТКЕ'
        safe_api('editMessageText',{'chat_id':chat,'message_id':card['message_id'],'text':card['body']+'\n\n<b>'+label+'</b>\n'+html.escape(text[:600]),'parse_mode':'HTML','reply_markup':{'inline_keyboard':[]},'link_preview_options':{'is_disabled':True}})
        safe_api('sendMessage',{'chat_id':chat,'text':'Комментарий сохранён и поставлен в очередь письма представителю школы.'})
    return {'id':id,'ok':True}
