import unittest
from copy import deepcopy
from sirius_source import from_course,price

class SiriusSourceTests(unittest.TestCase):
    def setUp(self):
        self.raw=dict(name='Алгебра. 8 класс. v1.12',module=[{'title':'Теорема Виета'}],landingBlocks=[{'text':'<p>Углублённые задачи</p>'}],isPublic=True,openDate='2026-07-14',attendUntil='2026-10-31T20:59:00Z',closeDate='2026-11-15T20:59:00Z')
        self.s=from_course(self.raw,'https://edu.sirius.online/course/2970','2026-10-19');self.s['enrolmentOpen']=True
        self.c=dict(sourceTitle=self.s['h1'],freeAccessEvidence={'url':'official'})
    def test_open_free_course_keeps_two_distinct_deadlines(self):
        p=price(self.s,self.c,'2026-10-19',True)
        self.assertEqual(p['amount'],0);self.assertIn('2026-10-31',p['condition']);self.assertIn('2026-11-15',p['condition'])
    def test_closed_or_expired_enrolment_cannot_retain_free_offer(self):
        self.assertIsNone(price({**self.s,'enrolmentOpen':False},self.c,'2026-10-19',True))
        self.assertIsNone(price(self.s,self.c,'2026-11-01',True))
    def test_free_price_requires_public_identity_and_official_evidence(self):
        self.assertIsNone(price({**self.s,'isPublic':False},self.c,'2026-10-19',True))
        self.assertIsNone(price({**self.s,'h1':'Другой курс'},self.c,'2026-10-19',True))
        self.assertIsNone(price(self.s,self.c,'2026-10-19',False))
        self.assertIsNone(price(self.s,{**self.c,'freeAccessEvidence':None},'2026-10-19',True))
    def test_syllabus_and_dates_change_fingerprint(self):
        for key,value in [('attendUntil','2026-10-20'),('module',[{'title':'Другой раздел'}])]:
            d=deepcopy(self.raw);d[key]=value
            self.assertNotEqual(from_course(d,self.s['sourceUrl'],'2026-10-19')['contentHash'],self.s['contentHash'])
    def test_check_timestamp_does_not_change_content_fingerprint(self):
        d=from_course(self.raw,self.s['sourceUrl'],'2026-10-20')
        self.assertEqual(d['contentHash'],self.s['contentHash'])

if __name__=='__main__':unittest.main()
