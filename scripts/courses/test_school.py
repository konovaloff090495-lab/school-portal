#!/usr/bin/env python3
"""Regression cases for curriculum intent and explicit class matching."""
import copy,importlib.util,json,unittest
from pathlib import Path
from unittest.mock import patch
import school
ROOT=Path(__file__).resolve().parents[2]
CS=json.loads((ROOT/'data/courses/catalog.json').read_text())
class SchoolTests(unittest.TestCase):
 def test_exam_cannot_enter_regular_school_facet(self):
  c=copy.deepcopy(next(c for c in CS if 'ege' in c['tags'] and 'himiya' in c['tags']))
  c.update(learningGoal='school',schoolSubjects=['himiya'],grades=[10])
  self.assertFalse(school.matches(c,'himiya',10))
 def test_no_grade_inference_from_age_or_generic_tutor(self):
  c=copy.deepcopy(next(c for c in CS if c['brandId']=='teatrika' and c.get('learningGoal')=='school'))
  c['grades']=[];c.pop('schoolSubjectGrades',None)
  self.assertTrue(school.matches(c,c['schoolSubjects'][0]))
  self.assertFalse(school.matches(c,c['schoolSubjects'][0],10))
 def test_noncontinuous_classes_are_not_expanded(self):
  c=copy.deepcopy(next(c for c in CS if c.get('learningGoal')=='school'));c['grades']=[5,7]
  self.assertFalse(school.matches(c,grade=6))
 def test_chemistry_ten_uses_actual_school_courses(self):
  actual=[c for c in CS if school.matches(c,'himiya',10)]
  self.assertTrue({'foxford','teatrika','tutoronline'}.issubset({c['brandId'] for c in actual}))
  self.assertTrue(all(c['schoolEvidence'] and 10 in c['grades'] for c in actual))
 def test_subject_scope_does_not_put_algebra_in_primary_school(self):
  c=next(c for c in CS if c['brandId']=='teatrika' and 'algebra' in c.get('schoolSubjects',[]))
  self.assertTrue(school.matches(c,'matematika',1))
  self.assertFalse(school.matches(c,'algebra',1))
  self.assertTrue(school.matches(c,'algebra',10))
 def test_combined_sotka_course_matches_both_subjects(self):
  c=next(c for c in CS if c['brandId']=='sotka' and '/7class/algebra-i-geometria' in c['sourceUrl'])
  for sub in ['matematika','algebra','geometriya']:self.assertTrue(school.matches(c,sub,7))
  self.assertFalse(school.matches(c,'algebra',8))
 def test_olympiad_teacher_is_not_olympiad_course(self):
  c=next(c for c in CS if c['brandId']=='sotka' and 'Биология 8' in c['title'])
  self.assertTrue(school.matches(c,'biologiya',8))
 def test_single_offer_class_is_accessible_but_noindex(self):
  single=[next(c for c in CS if school.matches(c,'fizika',11))]
  p=next(p for p in school.selections(single) if p['id']=='shkolnaya-programma/fizika/11-klass')
  self.assertFalse(p['allowIndex'])
 def test_public_browser_price_snapshot_is_conservative(self):
  spec=importlib.util.spec_from_file_location('browser_price',Path(__file__).with_name('refresh-browser.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
  snapshot={'sourceUrl':'https://foxford.ru/catalog/courses/externship','checkedAt':m.date.today().isoformat(),'cards':[{'url':'https://foxford.ru/courses/'+c['sourceUrl'].split('/')[4],'title':c['sourceTitle'],'text':'Освоить школьную программу '+str(c['price']['amount'])+' ₽ за курс'} for c in CS if c.get('verificationMethod')=='public-browser'][:10]}
  report=m.update(snapshot);self.assertEqual(report['confirmed'],10);self.assertEqual(len(report['pendingReview']),145)
  row=snapshot['cards'][0];row['title']='Another programme'
  report=m.update(snapshot);self.assertEqual(report['confirmed'],9);self.assertEqual(len(report['pendingReview']),146)
  self.assertFalse(report['applied'])
if __name__=='__main__':unittest.main()
