import unittest,datetime,tempfile,pathlib,json
from content_facts import extract,excerpt,culture
from enrich import enrich
class ContentTests(unittest.TestCase):
 def test_admission_is_not_recommendation(self):
  f=extract('Занятие для детей от 4 до 8 лет. Продолжительность: 1 час 30 минут.');self.assertEqual(f['recommendedAge'],[4,8]);self.assertEqual(f['durationMinutes'],90);self.assertNotIn('declaredAdmissionAge',f)
 def test_explicit_admission_conflict(self):
  f=extract('Возраст 14+, Билет дает право посещения 1 ребенка и 1 взрослого.');self.assertEqual(f['declaredAdmissionAge'],14);self.assertIn('взрослого',f['priceNote'])
 def test_no_age_from_censor_alone(self):
  self.assertNotIn('recommendedAge',extract('Спектакль 0+. Приходите всей семьей.'))
 def test_bounded_excerpt(self):
  text='Предложение о программе. '*200;self.assertLessEqual(len(excerpt(text)),900)
 def test_only_matching_future_venue(self):
  n=datetime.datetime.now(datetime.timezone.utc);future=(n+datetime.timedelta(days=5)).isoformat();past=(n-datetime.timedelta(days=5)).isoformat();j={'text':'Программа.','seances':[{'placeId':'A','startDate':future,'endDate':future},{'placeId':'B','startDate':future,'endDate':future},{'placeId':'A','startDate':past,'endDate':past}]};f=culture(j,'A','https://example.test',n.isoformat());self.assertEqual(len(f['seances']),1);self.assertNotIn('creatorId',f)
if __name__=='__main__':unittest.main()

class EnrichmentTests(unittest.TestCase):
 def fixture(self,restriction,text):
  tmp=tempfile.TemporaryDirectory();root=pathlib.Path(tmp.name);p=root/'work/afisha-production';p.mkdir(parents=True);checked=datetime.datetime.now(datetime.timezone.utc).isoformat();facts={'about':text,'contentSource':'https://www.culture.ru/events/1/x','contentChecked':checked,'sourceAgeRestriction':restriction,'priceMin':500,'priceMax':500,'seances':[]};(p/'content-facts.json').write_text(json.dumps({'1|V':facts}));row={'id':'E','city':'Город','sources':[{'id':'1','url':facts['contentSource']}],'priceData':{'min':500,'max':500,'free_confirmed':False},'dates':[],'schedule':{},'ageRestriction':restriction};national={'events':[{'id':'E','venue':{'source_id':'V'}}]};return tmp,enrich([row],root,national,{})[0]
 def test_censor_zero_recommended_four_is_valid(self):
  tmp,e=self.fixture(0,'Занятие для детей от 4 до 8 лет.');self.assertFalse(e['ageConflict']);self.assertEqual(e['recommendedAgeLabel'],'4–8 лет');tmp.cleanup()
 def test_body_admission_differs_from_header(self):
  tmp,e=self.fixture(12,'Возраст 14+, Билет дает право посещения 1 ребенка и 1 взрослого.');self.assertTrue(e['ageConflict']);self.assertEqual(e['priceData']['unit'],'за ребёнка и взрослого');tmp.cleanup()
