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
