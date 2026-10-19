# -*- coding: utf-8 -*-
"""Prices from a separate public product/subscription source, with identity checks."""
import re
from datetime import datetime,timezone
from urllib.parse import urlparse
import requests
from prepare import clean

def parse_product(data,course,checked):
    if data.get('id')!=course.get('pricingProductId') or clean(data.get('name',''))!=course.get('pricingSourceTitle'):return None
    if data.get('landing')!=course.get('sourceUrl'):return None
    kind=data.get('billingType');amount=data.get('prices',{}).get('currentPrice')
    if not isinstance(amount,(float,int)) or isinstance(amount,bool) or amount<0 or amount>500000:return None
    if amount==0 and kind!='free':return None
    if kind=='free':
        if amount!=0 or not course.get('freeAccessEvidence'):return None
        condition='Бесплатная программа после регистрации; ознакомительный курс не включает платное продолжение'
    elif kind=='periodic':
        if course.get('pricingPeriodMonths')!=1 or not re.search(r'на 1 месяц',data['name'],re.I):return None
        condition='Общая школьная подписка на 1 месяц, включая другие предметы; это не отдельная оплата одного курса'
    elif kind=='one_time':condition='Полная цена отдельной видеопрограммы в каталоге Лицея; состав и срок доступа уточнить до оплаты'
    else:return None
    return dict(amount=amount,unit='мес' if kind=='periodic' else 'курс',**{'from':False},condition=condition,evidence='Публичный каталог: '+data['name']+'; currentPrice='+str(amount),checkedAt=checked,sourceUrl=course['pricingSourceUrl'])

def parse_library(source,course,checked):
    if source.get('status')!=200 or clean(source.get('h1',''))!=course.get('pricingSourceTitle'):return None
    text=clean(source.get('text',''))
    if 'Абонемент единый' not in text or not re.search(r'(?:30|тридцати) дней',text):return None
    m=re.search(r'Абонемент да[её]т доступ.{0,250}?([\d\s]+)\s*/\s*мес\.?\s*Оплатить',text,re.I)
    if not m:return None
    amount=int(re.sub(r'\D','',m[1]))
    if not 100<=amount<=50000:return None
    return dict(amount=amount,unit='мес',**{'from':False},condition='Единый абонемент на 30 дней на библиотеку всех классов и предметов; это не цена одного предмета',evidence=clean(m[0]),checkedAt=checked,sourceUrl=course['pricingSourceUrl'])

def fetch_price(course,cache=None):
    cache=cache if cache is not None else {};url=course['pricingSourceUrl'];kind=course.get('pricingSourceType');checked=datetime.now(timezone.utc).date().isoformat()
    try:
        if kind=='sirius-free':
            if url!=course['sourceUrl']:return None
            from sirius_source import harvest_public,price,free_terms
            if url not in cache:cache[url]=harvest_public(course)
            return price(cache[url],course,checked,free_terms())
        if kind=='rostelecom-product':
            p=urlparse(url)
            if p.scheme!='https' or p.netloc!='lc.rt.ru' or not re.fullmatch(r'/backend/api/v2/products/\d+',p.path):return None
            if url not in cache:
                r=requests.get(url,timeout=30);r.raise_for_status();cache[url]=r.json()
            return parse_product(cache[url],course,checked)
        if kind=='interneturok-library':
            if url!='https://interneturok.ru/kursy_i_uslugi/biblioteka_videourokov/':return None
            if url not in cache:
                from harvest import harvest
                cache[url]=harvest(dict(brandId='interneturok',brand='ИнтернетУрок',sourceUrl=url,navLabel='Библиотека видеоуроков'),use_cache=False)
            return parse_library(cache[url],course,checked)
    except (requests.RequestException,ValueError,KeyError,TypeError):return None
    return None

def parse_service(source):
    """A complete lesson package, before any unrelated recommendations."""
    text=clean(source['text']);own=text.split('Дополнительные возможности')[0].split('Узнайте подробнее:')[0]
    n=r'(?:\d{1,3}(?: \d{3})+|\d{3,6})'
    m=re.search(r'Абонемент на 8 занятий ('+n+r') ('+n+r') / 1 занятие',own)
    if m:
        total=int(m[1].replace(' ',''));per=int(m[2].replace(' ',''));lessons=8
        if abs(total-8*per)>8:return None
    else:
        m=re.search(r'Абонемент на 16 занятий ('+n+r') ₽ за один урок ('+n+r') Оплатить',own)
        if not m:return None
        per=int(m[1].replace(' ',''));total=int(m[2].replace(' ',''));lessons=16
        if abs(total-lessons*per)>lessons:return None
    if not 1000<=total<=500000:return None
    return dict(amount=total,unit='курс',**{'from':False},condition='Абонемент на '+str(lessons)+' занятий выбранного направления; не весь годовой маршрут',evidence=m[0],checkedAt=source['checkedAt'][:10])
