#!/usr/bin/env python3
import copy,json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
from curate import verify,NeedsReview,run
from cover_art import create_cover,svg_scene,distance
from update import ROOT,read,write,iso
NOW=iso('2026-10-20T16:00:00+03:00')
TAX={e['slug']:e['name'] for e in read(ROOT/'data/free-lessons/taxonomy.json',[])}
C={'id':'um-free-course-physics-11-class-3','sourceUrl':'https://umschool.net/course/free-course-physics-11-class-3/','organizer':'Умскул','title':'Каталог: 9 класс'}
def page(price='0',grade='11',start='В любое время',duration='В своём темпе',free=True):
 return f'<h1>{"Бесплатный курс" if free else "Курс"} по физике ({grade} класс): статика и волны</h1><p>Описание</p><p>Старт {start} Количество занятий 2 Длительность {duration} {price} ₽/курс Получить курс</p><h2>Преподаватель</h2><footer>Бесплатный курс 0 ₽/курс</footer>'
class CurationTests(unittest.TestCase):
 def test_detail_grade_wins_and_partner_routing(self):
  e=verify(C,page(),TAX,NOW);self.assertEqual(e['grades'],[11]);self.assertEqual(e['kind'],'recording');self.assertIsNone(e['start']);self.assertEqual(e['lessonCount'],2);self.assertIn('utm_source=gerasimov_lav',e['outboundUrl']);self.assertEqual(e['organizer'],'Умскул');self.assertTrue(e['verification']['freeConfirmed']);self.assertEqual(len(e['verification']['sourceSha256']),64)
 def test_paid_or_ambiguous_main_offer_cannot_borrow_footer_free_claim(self):
  for text in [page('1000'),page('100'),page(free=False),page(grade='взрослый'),page(start='1 ноября'),page(duration='6 месяцев'),page().replace('Количество занятий 2','Количество занятий неизвестно'),page().replace('0 ₽/курс','Бесплатная консультация')]:
   with self.subTest(text=text):
    with self.assertRaises(NeedsReview):verify(C,text,TAX,NOW)
 def test_event_dates_require_future_timezone_and_school_audience(self):
  c={'id':'fox-99999','sourceUrl':'https://foxford.ru/events/99999','organizer':'Фоксфорд'}
  def event(start,price=0,heading='Физика, 8 класс'):
   return '<h1>'+heading+'</h1><script type="application/ld+json">'+json.dumps({'@type':'Event','url':c['sourceUrl'],'name':heading,'startDate':start,'offers':{'price':price}})+'</script>'
  e=verify(c,event('2026-10-21T18:00:00+03:00'),TAX,NOW);self.assertEqual(e['start'],'2026-10-21T18:00:00+03:00')
  for t in [event('2026-10-19T18:00:00+03:00'),event('2026-10-21T18:00:00'),event('2026-10-21T18:00:00+03:00',200),event('2026-10-21T18:00:00+03:00',0,'Физика для родителей')]:
   with self.assertRaises(NeedsReview):verify(c,t,TAX,NOW)
 def test_weekly_new_lesson_requires_fresh_complete_schedule(self):
  c={'id':'su-fizika-novaya','sourceUrl':'https://school-university.com/lektoriy/fizika-novaya/','organizer':'Лекторий Синергии','slots':[{'day':2,'from':'16:00','to':'16:40','grades':[7]}],'grades':[7],'scheduleVerifiedAt':NOW.isoformat()}
  e=verify(c,'<h1>Физика</h1><p>Бесплатное занятие для школьников</p>',TAX,NOW);self.assertEqual(e['publicOrganizer'],'Бесплатные уроки');self.assertEqual(e['slots'],c['slots'])
  c['scheduleVerifiedAt']='2026-10-01T00:00:00+03:00'
  with self.assertRaises(NeedsReview):verify(c,'<h1>Физика</h1><p>Бесплатное занятие</p>',TAX,NOW)
 def test_cover_immutable_unique_and_visually_different(self):
  with tempfile.TemporaryDirectory() as d:
   d=Path(d);e=verify(C,page(),TAX,NOW);a=create_cover(e,'Физика',d/'public',d/'state');sha=(d/'public'/a.lstrip('/')).read_bytes();self.assertEqual(create_cover(e,'Физика',d/'public',d/'state'),a);self.assertEqual((d/'public'/a.lstrip('/')).read_bytes(),sha)
   other=copy.deepcopy(e);other.update(id='um-physics-other',title='Физика: три главных темы');b=create_cover(other,'Физика',d/'public',d/'state');self.assertNotEqual(sha,(d/'public'/b.lstrip('/')).read_bytes());manifests=[read(p,{}) for p in (d/'state/artwork').glob('*.json')];self.assertGreaterEqual(distance(*[int(m['fingerprint'],16) for m in manifests]),10)
 def test_source_failure_is_pending_and_retry_does_not_duplicate(self):
  class Good:
   def __init__(self,*a):pass
   def get(self,url):return page()
  class Bad(Good):
   def get(self,url):
    from adapters import SourceError
    raise SourceError('HTTP 403')
  with tempfile.TemporaryDirectory() as d:
   d=Path(d);write(d/'catalog.json',[]);write(d/'state.json',{'pending':{C['id']:C}})
   with patch('curate.Reader',Bad):r=run(d,d/'public',NOW,True)
   self.assertEqual(r['pending'],1);self.assertFalse(read(d/'catalog.json',[]))
   with patch('curate.Reader',Good):r=run(d,d/'public',NOW,True);again=run(d,d/'public',NOW,True)
   self.assertEqual(r['added'],[C['id']]);self.assertEqual(again['added'],[]);self.assertEqual(len(read(d/'catalog.json',[])),1);self.assertEqual(again['publishedToday'],1)
 def test_daily_limit_makes_no_source_requests(self):
  with tempfile.TemporaryDirectory() as d:
   d=Path(d);write(d/'curation.json',{'day':NOW.date().isoformat(),'publishedToday':10})
   with patch('curate.Reader') as reader:r=run(d,d/'public',NOW,True)
   self.assertIn('limit',r['skipped']);reader.return_value.get.assert_not_called()
if __name__=='__main__':unittest.main()
