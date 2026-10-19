# -*- coding: utf-8 -*-
"""Conservative tariffs from the programme's own purchase block."""
import re

def price(c):
    t=re.sub(r'\s+',' ',c['text']);b=c['brandId'];u=c['sourceUrl']
    amount=None;unit='курс';condition='';is_from=False;m=None
    if b=='hello-world':
        m=re.search(r'6 занятий ДЛЯ СТАРТА [\d ]+ ₽ за занятие ([\d ]+) ₽ / абонемент',t)
        condition='Абонемент на 6 занятий; длительность и полный маршрут уточнить для выбранной программы'
    elif b=='virtuozy-msk' and 'Наши тарифы' in t:
        own=t.split('Наши тарифы',1)[1].split('Похожие курсы',1)[0]
        m=re.search(r'4 занятия 55 минут В школе Онлайн За урок [\d ]+ руб\. За курс ([\d ]+) руб\.',own)
        condition='Пакет из 4 индивидуальных занятий по 55 минут; онлайн или в московской школе'
    elif b=='deutsch-online' and 'interaktivnyy-videokurs' in u:
        m=re.search(r'Оплатите 1 месяц видеокурса\s*[-—–]\s*([\d ]+) ₽',t)
        unit='мес';condition='Месяц доступа к самостоятельному видеокурсу; живые индивидуальные уроки в эту сумму не входят'
    elif b=='yes-online':
        m=re.search(r'От ([\d ]+) р/урок с педагогом',t,re.I)
        unit='урок';is_from=True;condition='Начальная цена за урок из заголовка программы; длительность, пакет и итоговую сумму подтвердите у школы'
    if m:
        amount=int(re.sub(r'\D','',m[1]))
        if 200<=amount<=500000:
            return dict(amount=amount,unit=unit,condition=condition,**{'from':is_from},evidence=m[0],checkedAt=c['checkedAt'][:10])
    return None
