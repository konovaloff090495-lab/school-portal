#!/usr/bin/env python3
"""
Парсер условий задач с gdz.ru.
Берёт реальные условия из учебников, сохраняет в JSON.
Решения генерируем сами — это делает контент уникальным.
"""

import requests
import json
import time
import re
import random
from pathlib import Path
from bs4 import BeautifulSoup

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                  'AppleWebKit/537.36 (KHTML, like Gecko) '
                  'Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
}
BASE = 'https://gdz.ru'
OUT_DIR = Path(__file__).parent / 'gdz-conditions'
OUT_DIR.mkdir(exist_ok=True)

# URL patterns:
#   'task'     → /{n}-task/
#   'nom'      → /{n}-nom/
#   'bare'     → /{n}/
#   'task-pre' → /task-{n}/
#   'rzdl'     → /1-rzdl-{n}/
#   's'        → /{n}-s/   (spotlight - pages, not task numbers)
#   'class10'  → /10-class-{n}/
#   'class11'  → /11-class-{n}/
#
# Tuple: (klass_for_url, gdz-path, pattern)
BOOKS = {
    'makarychev-7':    (7,  'algebra/makarichev-18',                            'task'),
    'merzlyak-7':      (7,  'algebra/merzlyak-polonskij',                       'nom'),
    'makarychev-8':    (8,  'algebra/makarychev-8',                             'nom'),
    'merzlyak-8':      (8,  'algebra/merzlyak',                                 'bare'),
    'makarychev-9':    (9,  'algebra/makarichev-14',                            'task-pre'),
    'merzlyak-9':      (9,  'algebra/merzlyak',                                 'nom'),
    'merzlyak-5':      (5,  'matematika/merzlyak-polonskiy',                    'nom'),
    'merzlyak-6':      (6,  'matematika/a-g-merzlyak',                          'rzdl'),
    'kolmogorov-10':   (11, 'algebra/kolmogorov',                               'nom'),
    'kolmogorov-11':   (11, 'algebra/kolmogorov',                               'nom'),
    'atanasyan-10':    (10, 'geometria/atanasyan-10-11',                        'class10'),
    'atanasyan-11':    (10, 'geometria/atanasyan-10-11',                        'class11'),
    'ladyzhenskaya-6': (6,  'russkii_yazik/baranov-2008',                       'nom'),
    'ladyzhenskaya-7': (7,  'russkii_yazik/baranova',                           'nom'),
    'ladyzhenskaya-8': (8,  'russkii_yazik/trostencova-8',                      'nom'),
    'baranov-5':       (5,  'russkii_yazik/ladyzhenskaya-t-a',                  'nom'),
    'spotlight-6':     (6,  'english/reshebnik-angliyskiy-v-fokuse-spotlight',  's'),
    # Пропускаем книги со сложной структурой URL (главы, разделы):
    # atanasyan-7/8/9 → {chapter}-chapter-{n} (нужна таблица глав)
    # vilenkin-5/6    → {section}-{type}-item-{n}
    # peryshkin-7/8   → {section}-{type}-item-{n}
}

# Номера задач для парсинга — точные номера из gdz.ts для максимального покрытия
SAMPLE_NUMBERS = {
    'makarychev-7': [
        1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,
        21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,
        45,60,65,70,115,120,125,175,180,185,190,235,240,245,250,
        295,300,305,310,315,320,325,330,335,350,360,370,375,380,385
    ],
    'makarychev-8': [
        1,5,10,15,20,30,40,50,60,68,72,80,86,90,95,100,105,110,115,125,130,
        166,168,170,175,180,185,190,195,202,210,251,255,260,270,280,288,295,
        326,330,340,350,362,368,386,390,395
    ],
    'makarychev-9': [
        1,5,10,15,20,25,32,36,40,71,75,80,85,90,95,103,108,156,165,172,180,
        246,250,255,260,265,273,278,301,305,315,325,332,360,361,370,375,380,416,420
    ],
    'ladyzhenskaya-6': [
        1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,
        21,22,23,24,25,30,40,50,85,95,105,145,155,165,225,235,245,255,265
    ],
    'ladyzhenskaya-7': [
        1,5,10,20,25,30,56,60,70,75,80,166,170,175,180,
        236,240,245,248,250,391,400,441,450,491,500,502,566
    ],
    'ladyzhenskaya-8': [
        1,4,10,12,20,22,33,40,66,70,80,141,150,160,168,175,
        231,240,250,258,265,291,300,310,320,361,370,380,390,431,440,450,460,501,510
    ],
    'baranov-5': [
        1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,
        21,22,23,24,25,30,35,40,45,60,70,80,90,100,110,120,130,140,150
    ],
    # Книги с image-only условиями — номера для возможного будущего использования
    'merzlyak-7':      list(range(1, 350, 7)),
    'merzlyak-8':      list(range(1, 350, 7)),
    'merzlyak-9':      list(range(1, 320, 7)),
    'merzlyak-5':      list(range(1, 610, 8)),
    'merzlyak-6':      list(range(1, 420, 8)),
    'kolmogorov-10':   list(range(1, 380, 7)),
    'kolmogorov-11':   list(range(200, 580, 7)),
    'atanasyan-10':    list(range(1, 285, 7)),
    'atanasyan-11':    list(range(400, 870, 7)),
    'spotlight-6':     list(range(5, 104, 5)),
}


def build_url(book_slug, number):
    klass, gdz_path, pattern = BOOKS[book_slug]

    if pattern == 'task':
        slug = f'{number}-task'
    elif pattern == 'nom':
        slug = f'{number}-nom'
    elif pattern == 'bare':
        slug = str(number)
    elif pattern == 'task-pre':
        slug = f'task-{number}'
    elif pattern == 'rzdl':
        slug = f'1-rzdl-{number}'
    elif pattern == 's':
        slug = f'{number}-s'
    elif pattern == 'class10':
        slug = f'10-class-{number}'
    elif pattern == 'class11':
        slug = f'11-class-{number}'
    else:
        return None

    return f'{BASE}/class-{klass}/{gdz_path}/{slug}/'


def fetch_condition(book_slug, number):
    url = build_url(book_slug, number)
    if not url:
        return None

    for attempt in range(3):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=20, verify=False)
            if resp.status_code == 404:
                return None
            if resp.status_code == 429 or resp.status_code == 503:
                wait = 10 + attempt * 15 + random.uniform(0, 5)
                print(f'  Лимит запросов ({resp.status_code}), ждём {wait:.0f}с...')
                time.sleep(wait)
                continue
            if resp.status_code != 200:
                return None

            soup = BeautifulSoup(resp.text, 'html.parser')
            condition = extract_condition(soup, number)

            if not condition or len(condition) < 10:
                return None

            condition = re.sub(r'\s+', ' ', condition).strip()
            if any(x in condition.lower() for x in ['смотреть', 'решебник', 'ответ на задание']):
                return None

            return {
                'number': str(number),
                'condition': condition,
                'source_url': url,
            }

        except requests.exceptions.SSLError:
            # LibreSSL на macOS иногда падает — пробуем ещё раз с задержкой
            if attempt < 2:
                time.sleep(3 + attempt * 3)
            continue
        except Exception as e:
            if attempt < 2:
                time.sleep(2)
            continue

    return None


def extract_condition(soup, number):
    """Извлекает текст условия из HTML страницы gdz.ru."""
    condition = None

    # 1. Ищем блок с классом задачи
    for cls in ['task-condition', 'problem-text', 'task__condition',
                'content-task', 'task-body', 'task__text',
                'gdz-task', 'exercise-text', 'problem__text']:
        el = soup.find(class_=cls)
        if el:
            txt = el.get_text(separator=' ', strip=True)
            if len(txt) > 15:
                condition = txt
                break

    # 2. Ищем тег с текстом, начинающимся с номера
    if not condition:
        for tag in soup.find_all(['div', 'p', 'h2', 'h3', 'h4', 'span']):
            text = tag.get_text(separator=' ', strip=True)
            if re.match(rf'^{number}[\.\s]', text) and len(text) > 20:
                clean = re.sub(rf'^{number}[\.\s]+', '', text).strip()
                if len(clean) > 15:
                    condition = clean
                    break

    # 3. Fallback: ищем main/article с текстом задания
    if not condition:
        for sel in ['main', 'article', '.gdz-content', '#task-content']:
            el = soup.select_one(sel)
            if el:
                # Берём первые параграфы, исключая навигацию
                paras = el.find_all(['p', 'div'], recursive=False)
                for p in paras[:5]:
                    txt = p.get_text(separator=' ', strip=True)
                    if len(txt) > 30 and not any(
                        x in txt.lower() for x in ['класс', 'гдз', 'решебник', 'решение']
                    ):
                        condition = txt
                        break
                if condition:
                    break

    return condition


def scrape_book(book_slug, max_problems=60):
    out_file = OUT_DIR / f'{book_slug}.json'

    existing = {}
    if out_file.exists():
        with open(out_file) as f:
            try:
                existing = {p['number']: p for p in json.load(f)}
            except Exception:
                pass

    numbers = SAMPLE_NUMBERS.get(book_slug, list(range(1, 200, 8)))
    to_fetch = [n for n in numbers if str(n) not in existing][:max_problems]

    if not to_fetch:
        print(f'[{book_slug}] уже спарсено {len(existing)} задач')
        return existing

    print(f'[{book_slug}] парсим {len(to_fetch)} задач...')
    results = dict(existing)
    ok = 0
    fail = 0

    for i, num in enumerate(to_fetch):
        result = fetch_condition(book_slug, num)
        if result:
            results[result['number']] = result
            ok += 1
            print(f'  ✓ №{num}: {result["condition"][:70]}...')
        else:
            fail += 1

        # Случайная пауза 2–4 секунды между запросами
        time.sleep(2.0 + random.uniform(0, 2))

        # Сохраняем каждые 10 задач
        if (i + 1) % 10 == 0:
            _save(out_file, results)
            print(f'  → сохранено {len(results)} задач')

    _save(out_file, results)
    print(f'[{book_slug}] готово: {ok} ок, {fail} не нашли. Всего: {len(results)}')
    return results


def _save(path, results):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(list(results.values()), f, ensure_ascii=False, indent=2)


def scrape_all(books=None, max_per_book=60):
    target = books or list(BOOKS.keys())
    total = 0
    for slug in target:
        if slug not in BOOKS:
            print(f'Неизвестная книга: {slug}')
            continue
        results = scrape_book(slug, max_per_book)
        total += len(results)
        # Пауза между книгами
        time.sleep(5 + random.uniform(0, 3))
    print(f'\nИтого спарсено: {total} задач')


if __name__ == '__main__':
    import sys
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    if len(sys.argv) > 1:
        book = sys.argv[1]
        max_n = int(sys.argv[2]) if len(sys.argv) > 2 else 60
        if book == 'all':
            scrape_all(max_per_book=max_n)
        else:
            scrape_book(book, max_n)
    else:
        # Тест: 10 задач Макарычева 7
        print('Тестовый запуск (makarychev-7, 10 задач)...')
        scrape_book('makarychev-7', 10)
