# -*- coding: utf-8 -*-
import unittest
from expansion_prices import price

class ExpansionPriceTests(unittest.TestCase):
    def parse(self,brand,text,path='course'):
        return price(dict(brandId=brand,text=text,sourceUrl='https://example.com/'+path,checkedAt='2026-10-19'))
    def test_package_total_not_per_lesson_or_monthly_instalment(self):
        p=self.parse('hello-world','6 занятий ДЛЯ СТАРТА 2150 ₽ за занятие 12 900 ₽ / абонемент Можно в рассрочку от 7483 ₽/мес')
        self.assertEqual((p['amount'],p['unit']),(12900,'курс'))
    def test_foreign_currency_does_not_become_rubles(self):
        self.assertIsNone(self.parse('hello-world','6 занятий ДЛЯ СТАРТА €30 за занятие €177 / абонемент'))
    def test_music_does_not_use_free_trial_or_recommended_course(self):
        text='Наши тарифы Пробный урок 30 минут За курс 0 руб. 4 занятия 55 минут В школе Онлайн За урок 2 975 руб. За курс 11 900 руб. Похожие курсы от 1317 руб.'
        self.assertEqual(self.parse('virtuozy-msk',text)['amount'],11900)
        self.assertIsNone(self.parse('virtuozy-msk',text.replace('4 занятия 55 минут','4 занятия 40 минут')))
    def test_recommendations_are_outside_own_tariff(self):
        self.assertIsNone(self.parse('virtuozy-msk','Наши тарифы Цена по запросу Похожие курсы 4 занятия 55 минут В школе Онлайн За урок 2 975 руб. За курс 11 900 руб.'))
    def test_video_access_has_month_unit(self):
        p=self.parse('deutsch-online','Оплатите 1 месяц видеокурса - 999 ₽',path='interaktivnyy-videokurs')
        self.assertEqual((p['amount'],p['unit']),(999,'мес'))
        self.assertIsNone(self.parse('deutsch-online','Оплатите 1 месяц видеокурса - 999 ₽',path='individualnye-uroki'))
if __name__=='__main__':unittest.main()
