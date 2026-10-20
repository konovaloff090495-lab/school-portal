#!/usr/bin/env python3
"""State transitions, access isolation, revision publishing and mail reliability; no real sends."""
import importlib.util, json, os, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('applications',Path(__file__).with_name('school-submissions.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class ApplicationTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();m.STORE=Path(self.temp.name);self.id='a'*32
  self.data={'school':'Школа <Тест>','email':'owner@example.test','name':'Анна','city':'Москва','marketing_agreed':True,'description':'Описание школы','pd_agreed':True,'rights':True}
  self.photo={'file':'b'*32+'.jpg','caption':'Класс'}
  self.payload={'id':self.id,'request_id':'12345678-1234-1234-1234-123456789012','data':self.data,'photos':[self.photo],'ip':'test-ip'}
  self.receipt=m.operate('create',self.payload);self.auth={'id':self.id,'token':self.receipt['token']}
 def tearDown(self):self.temp.cleanup()
 def confirm(self):m.operate('confirm',{**self.auth,'confirmation':m.token(self.id,'confirm')})
 def test_separate_email_proof_and_access(self):
  with self.assertRaises(PermissionError):m.operate('get',{'id':self.id,'token':'wrong'})
  with self.assertRaises(PermissionError):m.operate('confirm',self.auth)
  with self.assertRaises(ValueError):m.operate('moderate',{'id':self.id,'status':'published'})
  self.assertEqual(m.operate('public',{}),[]);self.confirm()
  self.assertEqual(m.operate('get',self.auth)['status'],'pending')
 def test_private_images_and_feedback(self):
  with self.assertRaises(PermissionError):m.operate('image',{'id':self.id,'photo':self.photo['file']})
  self.assertFalse(m.operate('image',{**self.auth,'photo':self.photo['file']})['public'])
  m.operate('feedback',{**self.auth,'score':4,'text':'Удобно'})
  self.assertEqual(m.operate('get',self.auth)['score'],4)
  with self.assertRaises(ValueError):m.operate('feedback',{**self.auth,'score':8})
 def test_moderation_and_live_revision(self):
  self.confirm()
  with self.assertRaises(ValueError):m.operate('moderate',{'id':self.id,'status':'changes'})
  m.operate('moderate',{'id':self.id,'status':'changes','comment':'Уточните цену'})
  updated={**self.payload,**self.auth,'request_id':'2'*32,'data':{**self.data,'school':'Новое имя'}}
  m.operate('resubmit',updated);m.operate('moderate',{'id':self.id,'status':'published'})
  published=m.operate('public',{});self.assertEqual(published[0]['data']['school'],'Новое имя')
  m.operate('resubmit',{**updated,'request_id':'3'*32,'data':{**self.data,'school':'Неодобренное имя'}})
  self.assertEqual(m.operate('public',{})[0]['data']['school'],'Новое имя')
  m.operate('moderate',{'id':self.id,'status':'rejected','comment':'Нужна проверка'})
  self.assertEqual(m.operate('public',{})[0]['data']['school'],'Новое имя')
 def test_retry_create_is_idempotent(self):
  again=m.operate('create',{**self.payload,'id':'c'*32})
  self.assertEqual(again['id'],self.id)
  c=m.db();self.assertEqual(c.execute('SELECT COUNT(*) FROM applications').fetchone()[0],1);self.assertEqual(c.execute('SELECT COUNT(*) FROM mail').fetchone()[0],1);c.close()
 def test_marketing_separate_optin_unsubscribe(self):
  self.confirm()
  with self.assertRaises(PermissionError):m.operate('subscribe',self.auth)
  m.operate('subscribe',{**self.auth,'subscription':m.token(self.id,'subscribe')})
  c=m.db();self.assertEqual(c.execute('SELECT COUNT(*) FROM mail WHERE kind IN ("tips","refresh")').fetchone()[0],2);c.close()
  m.operate('unsubscribe',{'id':self.id,'token':m.token(self.id,'unsubscribe')})
  c=m.db();self.assertEqual(c.execute('SELECT COUNT(*) FROM mail WHERE kind IN ("tips","refresh") AND state="queued"').fetchone()[0],0);c.close()
 def test_marketing_reoptin_requires_fresh_confirmation(self):
  self.confirm();m.operate('subscribe',{**self.auth,'subscription':m.token(self.id,'subscribe')})
  m.operate('unsubscribe',{'id':self.id,'token':m.token(self.id,'unsubscribe')})
  m.operate('resubmit',{**self.payload,**self.auth,'request_id':'reoptin'})
  row=m.operate('get',self.auth);self.assertEqual(row['marketing'],1);self.assertIsNone(row['subscribed']);self.assertIsNone(row['unsubscribed'])
  c=m.db();self.assertEqual(c.execute('SELECT COUNT(*) FROM mail WHERE kind="subscribe" AND state="queued"').fetchone()[0],1);c.close()
  m.operate('subscribe',{**self.auth,'subscription':m.token(self.id,'subscribe')})
  c=m.db();self.assertEqual(c.execute('SELECT COUNT(*) FROM mail WHERE kind IN ("tips","refresh") AND state="queued"').fetchone()[0],2);c.close()
 def telegram(self):
  spec=importlib.util.spec_from_file_location('telegram',Path(__file__).with_name('school-submissions-telegram.py'));t=importlib.util.module_from_spec(spec);spec.loader.exec_module(t);return t
 def telegram_card(self,t):
  self.confirm();calls=[]
  def fake(method,payload,files=None):calls.append((method,payload,files));return {'message_id':123}
  with patch.dict(os.environ,{'TELEGRAM_BOT_TOKEN':'test','TELEGRAM_CHAT_ID':'111'}),patch.object(t,'api',side_effect=fake):
   self.assertEqual(t.run(m)['sent'],1);self.assertEqual(t.run(m)['sent'],0)
  c=m.db();row=m.application(c,self.id);c.close();return calls,t.revision(row)
 def telegram_update(self,rev,action='p',owner=111,msgid=123):return {'update_id':100,'callback_query':{'id':'callback','from':{'id':owner},'data':'ps:'+action+':'+self.id+':'+rev,'message':{'message_id':msgid,'chat':{'id':111}}}}
 def test_telegram_notification_photos_and_owner_only_buttons(self):
  t=self.telegram();calls,rev=self.telegram_card(t)
  self.assertEqual(calls[0][0],'sendPhoto');self.assertTrue(calls[0][2]);self.assertNotIn('https://pro-schools.ru/api/school-submissions/images/',str(calls))
  buttons=calls[-1][1]['reply_markup']['inline_keyboard'][0];self.assertEqual([b['text'] for b in buttons],['✅ Опубликовать','🚫 Отклонить']);self.assertTrue(all(len(b['callback_data'].encode())<=64 for b in buttons))
  with patch.dict(os.environ,{'TELEGRAM_CHAT_ID':'111'}),patch.object(t,'api',return_value={'message_id':123}):
   self.assertTrue(t.handle(m,self.telegram_update(rev,owner=222))['ignored']);self.assertTrue(t.handle(m,self.telegram_update(rev,msgid=999))['ignored'])
   t.handle(m,self.telegram_update(rev));t.handle(m,self.telegram_update(rev))
  c=m.db();self.assertEqual(m.application(c,self.id)['status'],'published');self.assertEqual(c.execute('SELECT COUNT(*) FROM mail WHERE kind="published"').fetchone()[0],1);c.close()
 def test_telegram_stale_revision_and_rejection_reply(self):
  t=self.telegram();_,rev=self.telegram_card(t)
  with patch.dict(os.environ,{'TELEGRAM_CHAT_ID':'111'}),patch.object(t,'api',return_value={'message_id':123}):
   t.handle(m,self.telegram_update(rev,action='r'))
   note={'update_id':101,'message':{'from':{'id':111},'chat':{'id':111},'text':'Уточните лицензию','reply_to_message':{'message_id':123}}}
   t.handle(m,note);t.handle(m,note)
   self.assertEqual(m.operate('get',self.auth)['comment'],'Уточните лицензию')
   m.operate('resubmit',{**self.payload,**self.auth,'request_id':'new-revision'})
   self.assertTrue(t.handle(m,self.telegram_update(rev))['stale']);self.assertEqual(m.operate('get',self.auth)['status'],'pending')
 def test_telegram_reply_returns_pending_school_for_revision(self):
  t=self.telegram();_,rev=self.telegram_card(t)
  note={'update_id':102,'message':{'from':{'id':111},'chat':{'id':111},'text':'Добавьте стоимость','reply_to_message':{'message_id':123}}}
  with patch.dict(os.environ,{'TELEGRAM_CHAT_ID':'111'}),patch.object(t,'api',return_value={'message_id':123}):t.handle(m,note);t.handle(m,note)
  self.assertEqual(m.operate('get',self.auth)['status'],'changes')
  c=m.db();self.assertEqual(c.execute('SELECT COUNT(*) FROM mail WHERE kind="changes"').fetchone()[0],1);c.close()
 def test_telegram_outage_retries_notification(self):
  t=self.telegram();self.confirm()
  with patch.dict(os.environ,{'TELEGRAM_BOT_TOKEN':'test','TELEGRAM_CHAT_ID':'111'}),patch.object(t,'api',side_effect=RuntimeError('offline')):
   self.assertEqual(t.run(m)['failed'],1);self.assertEqual(t.run(m)['failed'],0)
  c=m.db();self.assertEqual(c.execute('SELECT attempts FROM telegram_cards').fetchone()[0],1);c.close()
 def test_transport_queue_and_html_escaping(self):
  captured=[]
  class SMTP:
   def __init__(self,*a,**kw):pass
   def __enter__(self):return self
   def __exit__(self,*a):pass
   def login(self,*a):pass
   def send_message(self,message):captured.append(message)
  with patch.dict(os.environ,{'PROSCHOOLS_SMTP_PASSWORD':'test-not-real'}),patch.object(m.smtplib,'SMTP_SSL',SMTP):
   self.assertEqual(m.run_mail()['smtp_accepted'],1);self.assertEqual(m.run_mail()['smtp_accepted'],0)
  self.assertIn('&lt;Тест&gt;',captured[0].get_body(preferencelist=('html',)).get_content())
  self.assertIn('?confirm=',captured[0].get_body(preferencelist=('html',)).get_content())
 def test_transport_failure_keeps_retry(self):
  with patch.dict(os.environ,{'PROSCHOOLS_SMTP_PASSWORD':'test-not-real'}),patch.object(m.smtplib,'SMTP_SSL',side_effect=OSError('offline')):
   self.assertEqual(m.run_mail()['failed_attempts'],1)
  c=m.db();row=c.execute('SELECT state,attempts,error FROM mail').fetchone();c.close();self.assertEqual((row['state'],row['attempts'],row['error']),('queued',1,'OSError'))
if __name__=='__main__':unittest.main()
