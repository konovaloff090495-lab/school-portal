import unittest,importlib.util,pathlib,sqlite3,datetime
spec=importlib.util.spec_from_file_location('site_indexnow',pathlib.Path(__file__).with_name('notify-site-indexnow.py'));module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class QueueTests(unittest.TestCase):
 def test_new_url_without_lastmod_is_detected_after_baseline(self):
  db=sqlite3.connect(':memory:');now=datetime.datetime(2026,11,1,tzinfo=datetime.timezone.utc)
  module.prepare(db,{'https://pro-schools.ru/old/':''},set(),now)
  self.assertEqual(db.execute('SELECT COUNT(*) FROM pending').fetchone()[0],0)
  module.prepare(db,{'https://pro-schools.ru/old/':'','https://pro-schools.ru/new/':''},set(),now)
  self.assertEqual(db.execute('SELECT url FROM pending').fetchall(),[('https://pro-schools.ru/new/',)])
 def test_pending_survives_rescan_and_missing_sitemap_url(self):
  db=sqlite3.connect(':memory:');now=datetime.datetime(2026,11,1,tzinfo=datetime.timezone.utc);url='https://pro-schools.ru/new/'
  module.prepare(db,{url:''},{url},now);module.prepare(db,{},set(),now)
  self.assertEqual(db.execute('SELECT url FROM pending').fetchall(),[(url,)])
 def test_only_changed_lastmod_is_enqueued(self):
  db=sqlite3.connect(':memory:');now=datetime.datetime(2026,11,1,tzinfo=datetime.timezone.utc);url='https://pro-schools.ru/page/'
  module.prepare(db,{url:'2026-05-01'},set(),now);module.prepare(db,{url:'2026-05-01'},set(),now);self.assertEqual(db.execute('SELECT COUNT(*) FROM pending').fetchone()[0],0)
  module.prepare(db,{url:'2026-10-20'},set(),now);self.assertEqual(db.execute('SELECT COUNT(*) FROM pending').fetchone()[0],1)
if __name__=='__main__':unittest.main()
