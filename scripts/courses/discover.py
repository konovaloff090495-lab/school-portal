"""Discover first-party course landing pages. Raw HTML is kept outside Git."""
import concurrent.futures as cf
import json, re, sys, time
from pathlib import Path
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / 'work/courses'
WORK.mkdir(parents=True, exist_ok=True)
BRANDS = [
 ('skysmart','Skysmart','https://skysmart.ru/courses'),
 ('foxford','Фоксфорд','https://foxford.ru/'),
 ('umschool','Умскул','https://umschool.net/'),
 ('sotka','Сотка','https://sotkaonline.ru/'),
 ('100points','100балльный репетитор','https://100points.ru/'),
 ('synergy','Синергия','https://school-university.com/'),
 ('algoritmika','Алгоритмика','https://algoritmika.org/ru'),
 ('kodland','Kodland','https://www.kodland.org/ru'),
 ('pixel','Пиксель','https://clubpixel.ru/'),
 ('coddy','CODDY','https://coddyschool.com/courses/'),
 ('easycode','EasyCode','https://easycode.tech/'),
 ('rebotica','Реботика','https://rebotica.ru/'),
 ('uchi','Учи.ру','https://uchi.ru/'),
 ('uchi-doma','Учи.Дома','https://doma.uchi.ru/'),
 ('teatrika','Тетрика','https://tetrika-school.ru/'),
 ('novakid','Novakid','https://www.novakid.ru/'),
 ('allright','All Right','https://allright.com/ru'),
 ('chess','ChessFirst','https://chessfirst.ru/'),
 ('artfox','Художка Онлайн','https://hudozhka.online/'),
 ('lil','Логопотам','https://logopotam.ru/'),
 ('iqsha','Айкьюша','https://iqsha.ru/'),
 ('logiclike','LogicLike','https://logiclike.com/'),
 ('wakadoo','Умназия','https://umnazia.ru/'),
 ('advance','Advance','https://advance-club.ru/'),
 ('amakids','AMAKids','https://amakids.ru/'),
]

def fetch(url):
    r=requests.get(url,timeout=25,headers={'User-Agent':'Mozilla/5.0 (compatible; ProSchoolsCatalog/1.0; +https://pro-schools.ru/)'})
    r.raise_for_status()
    r.encoding=r.apparent_encoding if r.encoding == 'ISO-8859-1' else r.encoding
    return r

def discover(brand):
    key,name,url=brand
    try:
        r=fetch(url); soup=BeautifulSoup(r.text,'html.parser')
        (WORK/f'{key}-root.html').write_text(r.text)
        links={}
        domain=urlparse(r.url).netloc.removeprefix('www.')
        for a in soup.select('a[href]'):
            href=urljoin(r.url,a['href']).split('#')[0].split('?')[0]
            text=a.get_text(' ',strip=True)
            if urlparse(href).netloc.removeprefix('www.')==domain and text and len(text)<180:
                links[href]=text
        return {'id':key,'name':name,'url':r.url,'title':soup.title.get_text(' ',strip=True) if soup.title else '', 'links':links,'status':r.status_code}
    except Exception as e:
        return {'id':key,'name':name,'url':url,'error':str(e)[:180]}

if __name__=='__main__':
    with cf.ThreadPoolExecutor(max_workers=4) as pool:
        results=list(pool.map(discover,BRANDS))
    (WORK/'discovery.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
    for b in results:
        print(b['id'],b.get('status',b.get('error')),len(b.get('links',{})),b.get('title','')[:110])
