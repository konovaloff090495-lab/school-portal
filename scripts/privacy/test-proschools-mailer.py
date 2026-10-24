"""Synthetic storage migration and delivery checks. SMTP is replaced in memory."""
import pathlib,tempfile,os,sys,importlib.util,datetime as dt,hashlib,json,sqlite3,contextlib,io
sys.path.insert(0,str(pathlib.Path(__file__).parent))
from pii_fields import Fields
with tempfile.TemporaryDirectory(prefix='mailer-privacy-synthetic-') as folder:
    folder=pathlib.Path(folder);key=folder/'fields.key';Fields.create(key,'gerasimov','proschools')
    os.environ.update({'CRM_MAILER_DB':str(folder/'mailer.sqlite3'),'CRM_MAILER_PAUSE_PATH':str(folder/'paused'),'PII_FIELDS_KEY_PATH':str(key),'NODE_ENV':'production','PROSCHOOLS_SMTP_PASSWORD':'synthetic-only'})
    spec=importlib.util.spec_from_file_location('synthetic_mailer',pathlib.Path(__file__).resolve().parents[1]/'crm-mailer.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
    db=m.connect();db.create_function('pii_index',1,lambda value:m.fields().index(value,'welcome'))
    assert m.enroll(db,{'email':'synthetic@example.invalid','consent':False})['status']=='no-consent'
    result=m.enroll(db,{'email':'synthetic@example.invalid','name':'Synthetic Person','source':'/synthetic?contact=synthetic@example.invalid','consent':True});token=result['token'];assert result['status']=='pending'
    assert m.confirm(db,token)['status']=='active'
    db.execute('UPDATE subscribers SET next_at=? WHERE token=?',((m.now()-dt.timedelta(days=1)).isoformat(),token));db.commit()
    sent=[]
    class SMTP:
        def __init__(self,*a,**k):pass
        def __enter__(self):return self
        def __exit__(self,*a):pass
        def login(self,user,password):assert password=='synthetic-only'
        def send_message(self,message):sent.append(message)
    m.smtplib.SMTP_SSL=SMTP;m.time.sleep=lambda _:None
    with contextlib.redirect_stdout(io.StringIO()):m.run(db)
    assert len(sent)==1 and sent[0]['To']=='synthetic@example.invalid' and 'Synthetic' in sent[0].get_body(preferencelist=('plain',)).get_content()
    assert db.execute('SELECT step FROM subscribers WHERE token=?',(token,)).fetchone()[0]==1
    assert m.unsubscribe(db,token)['status']=='unsubscribed'
    assert m.enroll(db,{'email':'synthetic@example.invalid','name':'Other','consent':True})=={'status':'unsubscribed','token':None}
    legacy='legacy@example.invalid';legacy_token='synthetic-preserved-token'
    db.execute('INSERT INTO subscribers(email,first_name,token,status,consent_at,consent_source) VALUES(?,?,?,?,?,?)',(legacy.upper(),'Legacy synthetic',legacy_token,'unsubscribed',m.now().isoformat(),'/legacy?email='+legacy))
    old_hash=hashlib.sha256(legacy.encode()).hexdigest();db.execute('INSERT INTO welcome_sends(sent_at,recipient_hash) VALUES(?,?)',(m.time.time(),old_hash));db.commit()
    assert m.enroll(db,{'email':legacy,'consent':True})=={'status':'unsubscribed','token':None}
    response=m.encrypt_state(db);assert response['subscribers_preserved']==2
    row=db.execute('SELECT * FROM subscribers WHERE token=?',(legacy_token,)).fetchone();assert row['email']==legacy and row['first_name']=='Legacy synthetic' and row['status']=='unsubscribed'
    assert m.enroll(db,{'email':legacy,'consent':True})=={'status':'unsubscribed','token':None}
    assert m.reserve_welcome(db,{'email':legacy})['status']=='allowed'
    assert m.reserve_welcome(db,{'email':legacy})['status']=='allowed'
    assert m.reserve_welcome(db,{'email':legacy})['status']=='limited'
    again=m.encrypt_state(db);assert again['subscribers_preserved']==2
    db.close()
    with sqlite3.connect(folder/'mailer.sqlite3') as raw:
        rows=raw.execute('SELECT email,email_cipher,first_name,consent_source FROM subscribers').fetchall();assert len(rows)==2
        assert all(row[0].startswith('h1:') and row[1].startswith('pf1:') for row in rows)
    for file in folder.glob('mailer.sqlite3*'):
        content=file.read_bytes()
        for value in [legacy,'synthetic@example.invalid','Legacy synthetic','Synthetic']:
            assert value.encode() not in content,'Open contact remains in SQLite data/WAL'
print('ProSchools newsletter: enrollment, confirmation, mocked delivery, opt-out, historical migration and encrypted SQLite passed; no messages sent.')
