# -*- coding: utf-8 -*-
import unittest
from copy import deepcopy
from source_prices import parse_product,parse_library,parse_service

class SourcePriceTests(unittest.TestCase):
    def setUp(self):
        self.c=dict(pricingProductId=237,pricingSourceTitle='Абонемент на 1 месяц школьной программы',pricingPeriodMonths=1,pricingSourceUrl='https://lc.rt.ru/backend/api/v2/products/237',sourceUrl='https://lc.rt.ru/l/school-subscription')
        self.data=dict(id=237,name=self.c['pricingSourceTitle'],landing=self.c['sourceUrl'],billingType='periodic',prices=dict(currentPrice=399))
    def test_shared_monthly_price_keeps_subscription_condition(self):
        p=parse_product(self.data,self.c,'2026-10-19');self.assertEqual((p['amount'],p['unit']),(399,'мес'));self.assertIn('другие предметы',p['condition'])
    def test_different_product_cannot_lend_its_price(self):
        for key,value in [('id',239),('name','Другая программа'),('landing','https://lc.rt.ru/l/other')]:
            x=deepcopy(self.data);x[key]=value;self.assertIsNone(parse_product(x,self.c,'2026-10-19'))
    def test_annual_package_is_not_monthly_price(self):
        x=deepcopy(self.data);x['name']='Абонемент на 12 месяцев школьной программы';c={**self.c,'pricingSourceTitle':x['name']};self.assertIsNone(parse_product(x,c,'2026-10-19'))
    def test_free_needs_explicit_product_type_and_evidence(self):
        x=deepcopy(self.data);x.update(billingType='free',prices=dict(currentPrice=0))
        self.assertIsNone(parse_product(x,self.c,'2026-10-19'))
        c={**self.c,'freeAccessEvidence':{'url':'source'}};self.assertEqual(parse_product(x,c,'2026-10-19')['amount'],0)
        x['billingType']='one_time';self.assertIsNone(parse_product(x,c,'2026-10-19'))
    def test_library_requires_single_pass_and_duration(self):
        c=dict(pricingSourceTitle='Библиотека',pricingSourceUrl='https://interneturok.ru/kursy_i_uslugi/biblioteka_videourokov/')
        s=dict(status=200,h1='Библиотека',text='Абонемент даёт доступ к видеоурокам 400 / мес. Оплатить Абонемент единый Доступ 30 дней')
        p=parse_library(s,c,'2026-10-19');self.assertEqual(p['amount'],400);self.assertIn('всех классов',p['condition'])
        self.assertIsNone(parse_library({**s,'text':s['text'].replace('Абонемент единый','Выберите предмет')},c,'2026-10-19'))
        self.assertIsNone(parse_library({**s,'h1':'Другая библиотека'},c,'2026-10-19'))
    def test_service_uses_whole_package_not_per_lesson(self):
        s=dict(text='Абонемент на 8 занятий 9 600 1 200 / 1 занятие Оплатить',checkedAt='2026-10-19')
        p=parse_service(s);self.assertEqual(p['amount'],9600)
        self.assertIsNone(parse_service({**s,'text':s['text'].replace('9 600','19 600')}))
    def test_recommended_tariff_and_instalment_not_used(self):
        s=dict(text='Основной курс — сумму уточнить. Дополнительные возможности Абонемент на 8 занятий 9 600 1 200 / 1 занятие',checkedAt='2026-10-19')
        self.assertIsNone(parse_service(s))
        self.assertIsNone(parse_service({**s,'text':'От 17 194 ₽ в месяц. В рассрочку за всю программу.'}))
if __name__=='__main__':unittest.main()
