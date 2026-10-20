#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fetch public official evidence only. No catalog mutation or deployment.

The cache is deliberately separate from the published registry. Failed requests
are recorded and do not silently confirm a program. Browser/tool captures may be
added to the same cache with transport='web', their real URL and capture date.
"""
import argparse
import concurrent.futures
import hashlib
import json
import pathlib
import re
import sys
from datetime import datetime, timezone
from urllib.parse import urljoin, urldefrag

import requests
from bs4 import BeautifulSoup

ROOT = pathlib.Path(__file__).resolve().parents[2]
CACHE = ROOT / 'work/programming-online/source-cache.json'
SEED_URLS = [
    'https://kids.skillbox.ru/catalog/programming',
    'https://kvantastica.ru/', 'https://www.progkids.com/',
    'https://www.rts.school/', 'https://www.rts.school/for-progkids',
    'https://lesson.codim.online/', 'https://informatics.ru/',
    'https://vc.informatics.ru/', 'https://www.online.informatics.ru/',
    'https://foxford.ru/catalog/courses/learn-to-code',
    'https://skysmart.ru/programmirovanie-dlya-detej/',
    'https://online.algoritmika.org/', 'https://coddyschool.com/online/',
    'https://easycode.tech/', 'https://rebotica.ru/',
    'https://clubpixel.ru/online', 'https://hwschool.online/',
    'https://lc.rt.ru/', 'https://itgen.io/',
    'https://sochisirius.ru/obuchenie/distant', 'https://sotkaonline.ru/',
    'https://www.kodland.org/ru/courses/coding',
]


def norm(text):
    return re.sub(r'\s+', ' ', text).strip()


def fetch(url):
    checked = datetime.now(timezone.utc).isoformat(timespec='seconds')
    try:
        response = requests.get(url, timeout=28, headers={
            'User-Agent': 'Mozilla/5.0 (compatible; ProSchoolsSourceVerification/1.0)'
        })
        response.encoding = 'utf-8'
        soup = BeautifulSoup(response.text, 'html.parser')
        title = soup.title.get_text(' ', strip=True) if soup.title else ''
        for element in soup(['script', 'style', 'noscript']):
            element.decompose()
        text = soup.get_text('\n', strip=True)
        return {
            'url': url, 'finalUrl': response.url, 'status': response.status_code,
            'checkedAt': checked, 'transport': 'http', 'title': title,
            'text': text,
            'contentHash': hashlib.sha256(text.encode()).hexdigest(),
            'headings': [norm(x.get_text(' ', strip=True)) for x in soup.select('h1,h2,h3')],
            'links': [{'text': norm(a.get_text(' ', strip=True)),
                       'url': urljoin(response.url, a['href'])}
                      for a in soup.select('a[href]')],
            'verified': response.status_code == 200 and len(text) > 500,
        }
    except requests.RequestException as error:
        return {'url': url, 'checkedAt': checked, 'transport': 'http',
                'verified': False, 'error': str(error)}


def candidate_links(cache):
    urls = set()
    for key, source in cache.items():
        for link in source.get('links', []):
            url = urldefrag(link['url'])[0]
            if key == 'https://kids.skillbox.ru/catalog/programming':
                # Only the eight actual programming cards, not footer cross-sells.
                if '/courses/' in url and any(x in link['text'] for x in ['месяц', 'месяцев']):
                    urls.add(url)
            elif key == 'https://lesson.codim.online/':
                # Marketing marathon bundles and B2B teacher kits are excluded.
                if (link['text'] == 'Подробнее' and 'codim.online/' in url
                        and not any(x in url for x in ['marafon', 'popup', 'teachers'])):
                    urls.add(url)
            elif key == 'https://www.rts.school/':
                if '/ru/' in url and any(x in link['text'].lower() for x in [
                    'python', 'unity', 'scratch', 'junior', 'minecraft', 'roblox',
                    'веб', 'нейросет', 'ai start', 'графический', 'цифровое']):
                    urls.add(url)
            elif key == 'https://foxford.ru/catalog/courses/learn-to-code':
                if re.search(r'foxford\.ru/(?:courses|mini_groups)/\d+', url):
                    urls.add(url if url.endswith('/landing') else url.rstrip('/') + '/landing')
    return urls


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache', type=pathlib.Path, default=CACHE)
    parser.add_argument('--url', action='append', default=[])
    parser.add_argument('--refresh', action='store_true')
    parser.add_argument('--discover', action='store_true')
    args = parser.parse_args()
    cache = json.loads(args.cache.read_text()) if args.cache.exists() else {}
    urls = set(args.url or SEED_URLS)
    if args.discover:
        urls |= candidate_links(cache)
    todo = sorted(urls if args.refresh else (url for url in urls if not cache.get(url, {}).get('verified')))
    # Bounded concurrency avoids overloading either the Mac or the source sites.
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for source in pool.map(fetch, todo):
            previous = cache.get(source['url'])
            if not source['verified'] and previous and previous.get('verified'):
                previous['lastFailedAttempt'] = {k: v for k, v in source.items() if k not in ['text', 'links']}
            else:
                cache[source['url']] = source
            print(source['url'], source.get('status'), source['verified'])
    args.cache.parent.mkdir(parents=True, exist_ok=True)
    args.cache.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + '\n')
    failures = [url for url in urls if not cache.get(url, {}).get('verified')]
    print(f'{len(cache)} cached sources; {len(failures)} selected sources need review')
    return 0


if __name__ == '__main__':
    sys.exit(main())
