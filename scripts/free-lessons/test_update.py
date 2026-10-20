#!/usr/bin/env python3
import unittest,copy,json,tempfile
from pathlib import Path
from unittest.mock import patch
from datetime import timedelta
from update import lifecycle,iso,refresh,read,ROOT
from adapters import Reader,SourceError,weeks_from_html,um_candidates,structured_free_events
from publish import digest,validate
from render import build
from approve import approve
class UpdaterTests(unittest.TestCase):
 def setUp(self):self.events=read(ROOT/'data/free-lessons/catalog.json',[])
 def test_recurring_moves_forward_and_filters_grade(self):
  now=iso('2026-10-20T16:00:00+03:00');e=next(e for e in self.events if e['id']=='su-olimpiadnaya-matematika');e['scheduleVerifiedAt']=now.isoformat();out=lifecycle([e],now)[0]
  self.assertEqual(out['start'],'2026-10-27T15:00:00+03:00');self.assertTrue(all(iso(o['end'])>now for o in out['occurrences']));self.assertEqual(out['occurrences'][0]['grades'],[5,6])
 def test_expired_one_off_archived_not_recordings(self):
  now=iso('2026-10-22T23:00:00+03:00');out=lifecycle(self.events,now)
  self.assertTrue(all(e['status']=='expired' for e in out if e['id'].startswith('fox-')));self.assertTrue(all(e['status']=='active' for e in out if e['kind'] in ['recording','appointment']))
 def test_unverified_weekly_does_not_fabricate_forever(self):
  out=lifecycle(self.events,iso('2026-11-20T12:00:00+03:00'));self.assertTrue(all(e['status']=='unverified' and not e['occurrences'] for e in out if e['id'].startswith('su-')))
 def test_timeouts_never_remove_data(self):
  class Failed:
   def get(self,url):raise SourceError('ReadTimeout')
  before=copy.deepcopy(self.events);state={};out=refresh(self.events,state,Failed(),{},iso('2026-10-20T12:00:00+03:00'))
  self.assertEqual(out,before);self.assertTrue(all(not c['ok'] for c in state['sourceChecks']))
 def test_idempotency(self):
  now=iso('2026-10-20T12:00:00+03:00');a=lifecycle(copy.deepcopy(self.events),now);b=lifecycle(copy.deepcopy(a),now);self.assertEqual(digest(a,'v'),digest(b,'v'))
 def test_allowlist_blocks_redirect_escape(self):
  with tempfile.TemporaryDirectory() as d:
   r=Reader(['school-university.com'],d)
   for u in ['http://school-university.com/','https://127.0.0.1/','https://school-university.com.evil.test/','https://x@school-university.com/','https://school-university.com:444/']:
    with self.assertRaises(SourceError):r.url(u)
 def test_flight_schedule_parser_and_drop_guard(self):
  weeks=[{'grade':g,'days':[{'day':0,'items':[{'slug':'lesson-'+str(i),'name':'Урок '+str(i),'from':'15:00','to':'15:40','teacher':'Учитель'} for i in range(12)]}]} for g in range(5,12)]
  flight='x:'+json.dumps({'weeks':weeks},ensure_ascii=False);doc='<script>self.__next_f.push([1,'+json.dumps(flight)+'])</script>';groups=weeks_from_html(doc);self.assertEqual(len(groups),12);self.assertEqual(groups['lesson-1']['slots'][0]['grades'],list(range(5,12)))
  with self.assertRaises(SourceError):weeks_from_html('<html>Loading...</html>')
 def test_free_discovery_and_timezone(self):
  records,_=um_candidates('<h3><a href="/course/test/">Бесплатный курс математики</a></h3>','https://umschool.net/courses/free/');self.assertEqual(records[0]['id'],'um-test')
  def event(price,start):return '<script type="application/ld+json">'+json.dumps({'@type':'Event','name':'Тест','startDate':start,'offers':{'price':price}})+'</script>'
  self.assertEqual(structured_free_events(event(100,'2026-10-21T15:00:00+03:00'),'https://foxford.ru/events/123'),[])
  self.assertEqual(structured_free_events(event(0,'2026-10-21T15:00:00'),'https://foxford.ru/events/123'),[])
  self.assertEqual(structured_free_events(event(0,'2026-10-21T15:00:00+03:00'),'https://foxford.ru/events/123')[0]['id'],'fox-123')
 def test_archive_render_preserves_routes_and_removes_cta(self):
  from bs4 import BeautifulSoup
  now=iso('2026-11-20T12:00:00+03:00');events=lifecycle(self.events,now)
  with tempfile.TemporaryDirectory() as d:
   out=Path(d);result=build(events,out,ROOT/'public',now);validate(out)
   e=next(e for e in events if e['id']=='fox-5052');doc=BeautifulSoup((out/e['url'].lstrip('/')/'index.html').read_text(),'html.parser')
   self.assertEqual(doc.select_one('meta[name=robots]')['content'],'noindex,follow');self.assertIn('завершилось',doc.select_one('.lesson-status').text);self.assertFalse(doc.select('[data-lektoriy]'));self.assertNotIn(e['url'],(out/'besplatnye-uroki/search-index.json').read_text())
   su=next(e for e in events if e['id'].startswith('su-'));doc=BeautifulSoup((out/su['url'].lstrip('/')/'index.html').read_text(),'html.parser');self.assertFalse(doc.select('[data-lektoriy]'));self.assertEqual(result['active'],sum(e['kind'] in ['recording','appointment'] for e in events))
if __name__=='__main__':unittest.main()
