#!/usr/bin/env python3
"""Read-only discovery: follow the official city list and its attestation links.

Never imports by city slug alone. Review the snapshots before adding a campus.
"""
import concurrent.futures, hashlib, json, pathlib, re, urllib.parse
import requests
from bs4 import BeautifulSoup

OUT = pathlib.Path('work/externat/top')
OUT.mkdir(parents=True, exist_ok=True)
BASE = 'https://topitschool.ru'
session = requests.Session()
# Use the default requests user agent; some generic browser strings are blocked.

def fetch(url):
    response = session.get(url, timeout=35)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')
    for node in soup(['script', 'style']): node.decompose()
    return response, soup

try:
    _, seed = fetch(BASE + '/tomsk')
except requests.RequestException:
    seed = BeautifulSoup((OUT / 'tomsk.html').read_text(), 'html.parser')
cities = {}
for a in seed.select('a[href]'):
    href, name = a.get('href'), a.get_text(' ', strip=True)
    if re.fullmatch(r'/[a-z-]+', href or '') and len(name) > 2 and re.fullmatch(r'[А-ЯЁ][а-яёА-ЯЁ -]+', name):
        if href not in ['/online', '/about', '/attestaciya', '/contacts', '/feedback']:
            cities[href] = name

def run(pair):
    href, city = pair
    slug = href.strip('/')
    row = {'city': city, 'cityPage': BASE + href, 'slug': slug, 'checkedAt': '2026-10-27'}
    try:
        response, home = fetch(BASE + href)
        links = [urllib.parse.urljoin(BASE + href, a['href']) for a in home.select('a[href]') if 'attestaciya' in a['href']]
        links = [u for u in links if urllib.parse.urlparse(u).path == href + '/attestaciya']
        if not links:
            return {**row, 'status': 'no-local-attestation-link'}
        url = links[0]
        soup = home
        text = soup.get_text('\n', strip=True).replace('\xa0', ' ')
        import gzip
        with gzip.open(OUT / (slug + '.html.gz'), 'wt') as f: f.write(response.text)
        (OUT / (slug + '.txt')).write_text(text)
        footer = text[text.find('Приемная комиссия:') - 80:]
        footer = footer.split('Запишитесь на экскурсию')[0]
        lines = [x.strip() for x in footer.splitlines()]
        addresses = [x for x in lines if re.search(r'(?i)(ул\.?|улица|просп|пр-кт|переул|пер\.|шоссе|набереж|бульвар|площадь|[а-яё]+\s+\d)', x) and not re.search(r'(?i)(телефон|будням|\+7|email|@|202[0-9])', x)]
        row.update(sourceUrl=url, finalUrl=response.url, footer=footer[:1600], addresses=addresses,
                   sha256=hashlib.sha256(response.content).hexdigest(),
                   evidence='На городской странице есть отдельная ссылка «Аттестация». Общая программа: прикрепление к московской школе ТОП, промежуточная аттестация.',
                   title=soup.title.get_text(' ', strip=True) if soup.title else '')
        row['status'] = 'review' if addresses and city.lower() in footer.lower() else 'needs-review'
    except Exception as e:
        row.update(status='error', error=str(e)[:180])
    return row

with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    rows = list(pool.map(run, cities.items()))
(OUT / 'discovery.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2))
from collections import Counter
print(json.dumps({'cities': len(rows), 'statuses': dict(Counter(r['status'] for r in rows))}, ensure_ascii=False))
