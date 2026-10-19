import json, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
import refresh
from prepare import price_fact

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
    def test_verified_free_price_does_not_divide_by_zero(self):
        result=self.run_case(self.source(),old_amount=0)
        self.assertIsNone(result['price']) # A new paid amount requires review.

class NewSourcePriceTests(unittest.TestCase):
    def sky(self,text):return price_fact({'brandId':'skysmart','sourceUrl':'https://skysmart.ru/courses/test/kids-selfstudy-math','h1':'Математика, 7 класс','text':text,'checkedAt':'2026-10-19'})
    def test_annual_uses_cash_total_instead_of_instalment(self):
        p=self.sky('Математика, 7 класс Видеокурс от 2 855 ₽ в мес. всего 17 130 ₽ за 6 месяцев · 14 900 ₽ при оплате сразу Купить Что входит в тариф')
        self.assertEqual((p['amount'],p['unit']),(14900,'курс'))
    def test_intensive_uses_actual_tariff_before_old_price(self):
        p=self.sky('Математика, 7 класс Видеокурс Предпродажа 4 490 ₽ 5 990 ₽ Купить Что входит в тариф')
        self.assertEqual(p['amount'],4490)
    def test_recommendation_price_is_not_programme_price(self):
        self.assertIsNone(self.sky('Математика, 7 класс Цена уточняется Вам могут понравиться Видеокурс 4 490 ₽'))
    def test_free_requires_explicit_source_text(self):
        c={'brandId':'naukacity','text':'Бесплатно — подписка на десять онлайн-курсов без ограничения по времени.','checkedAt':'2026-10-19'}
        self.assertEqual(price_fact(c)['amount'],0)
        c['text']='Записаться бесплатно'
        self.assertIsNone(price_fact(c))
if __name__=='__main__':unittest.main()
