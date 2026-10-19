import json, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
import refresh

class RefreshTests(unittest.TestCase):
    def run_case(self,new,old_amount=1000):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);(root/'data/courses').mkdir(parents=True);(root/'work/courses').mkdir(parents=True)
            c={'id':'sample','title':'Курс','sourceTitle':'Курс','brand':'Синергия','brandId':'synergy','sourceUrl':'https://school-university.com/test/','active':True,'contentHash':'old','checkedAt':'2026-10-19','price':{'amount':old_amount,'unit':'урок','checkedAt':'2026-10-19'},'offer':None}
            path=root/'data/courses/catalog.json';path.write_text(json.dumps([c]))
            with patch.object(refresh,'ROOT',root),patch.object(refresh,'WORK',root/'work/courses'),patch.object(refresh,'harvest',return_value=new):refresh.refresh()
            return json.loads(path.read_text())[0]
    def source(self,**kw):
        return {'status':200,'sourceUrl':'https://school-university.com/test/','h1':'Курс','text':'Стоимость от 1 100 ₽ за урок','brandId':'synergy','checkedAt':'2026-10-20T10:00:00+00:00','contentHash':'new','headings':[],**kw}
    def test_valid_price_change(self):self.assertEqual(self.run_case(self.source())['price']['amount'],1100)
    def test_changed_course_cannot_inherit_price(self):self.assertIsNone(self.run_case(self.source(h1='Совсем другая программа'))['price'])
    def test_missing_price_is_hidden(self):self.assertIsNone(self.run_case(self.source(text='Стоимость сообщим при записи'))['price'])
    def test_large_change_needs_review(self):self.assertIsNone(self.run_case(self.source(text='Стоимость от 9 000 ₽ за урок'))['price'])
    def test_outage_preserves_known_fact_until_ttl(self):self.assertEqual(self.run_case({'error':'Timeout','sourceUrl':'https://school-university.com/test/'})['price']['amount'],1000)
if __name__=='__main__':unittest.main()
