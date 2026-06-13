#!/usr/bin/env python3
"""
Скрапер URL картинок-решений с reshak.ru.
Дополняет существующие JSON-файлы полем imageUrls.
Запуск: python3 scripts/scrape-solution-images.py [slug]
"""

import requests
import json
import time
import re
import warnings
from pathlib import Path
from bs4 import BeautifulSoup

warnings.filterwarnings('ignore')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.5',
    'Referer': 'https://reshak.ru/',
}

BASE_URL = 'https://reshak.ru'
OUTPUT_DIR = Path(__file__).parent / 'gdz-conditions'

BOOKS = {
    'vilenkin-5': {
        'max': 548,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet=part1/{n}&predmet=vilenkin5n',
    },
    'vilenkin-6': {
        'max': 525,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet=part1/{n}&predmet=vilenkin6n',
    },
    'merzlyak-5': {
        'max': 548,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet={n}&predmet=merzlyak5',
    },
    'merzlyak-6': {
        'max': 348,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet={n}&predmet=merzlyak6',
    },
    'merzlyak-7': {
        'max': 390,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet={n}&predmet=merzlyak7',
    },
    'merzlyak-8': {
        'max': 410,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet={n}&predmet=merzlyak8',
    },
    'merzlyak-9': {
        'max': 320,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet={n}&predmet=merzlyak9',
    },
    'makarychev-7': {
        'max': 1247,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet={n}&predmet=makar7',
    },
    'makarychev-8': {
        'max': 700,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet={n}&predmet=makar8',
    },
    'makarychev-9': {
        'max': 1097,
        'url_fn': lambda n: f'https://reshak.ru/otvet/otvet24.php?otvet1={n}',
    },
    'atanasyan-7': {
        'min': 1,
        'max': 330,
        'url_fn': lambda n: f'https://reshak.ru/otvet/otvet11.php?otvet1={n}',
    },
    'atanasyan-8': {
        'min': 331,
        'max': 737,
        'url_fn': lambda n: f'https://reshak.ru/otvet/otvet11.php?otvet1={n}',
    },
    'atanasyan-9': {
        'min': 738,
        'max': 1100,
        'url_fn': lambda n: f'https://reshak.ru/otvet/otvet11.php?otvet1={n}',
    },
    'atanasyan-10': {
        'max': 233,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet=new/{n}&predmet=atan10_11',
    },
    'atanasyan-11': {
        'max': 163,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet=new/{n}&predmet=atan10_11',
    },
    'baranov-5': {
        'max': 967,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet={n}&predmet=ladizhenskaya5',
    },
    'ladyzhenskaya-6': {
        'max': 700,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet={n}&predmet=baranov6',
    },
    'ladyzhenskaya-7': {
        'max': 700,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet={n}&predmet=ladizhenskaya7',
    },
    'ladyzhenskaya-8': {
        'max': 510,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet={n}&predmet=ladizhenskaya8',
    },
    'peryshkin-7': {
        'max': 320,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet=upr/{n}&predmet=perishkin7',
    },
    'peryshkin-8': {
        'max': 330,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet=Upr/{n}&predmet=per8',
    },
    'kolmogorov-10': {
        'max': 580,
        'url_fn': lambda n: f'https://reshak.ru/otvet/otvet29.php?otvet1={n}',
    },
    'kolmogorov-11': {
        'max': 360,
        'url_fn': lambda n: f'https://reshak.ru/otvet/otvet29.php?otvet1={n}',
    },
    'pasechnik-5': {
        'max': 26,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet={n}&predmet=pasechnik5',
    },
    'pasechnik-6': {
        'max': 32,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet={n}&predmet=pasechnik6',
    },
    'pasechnik-7': {
        'max': 26,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet={n}&predmet=pasechnik_sum7',
    },
    'kolesov-8': {
        'max': 64,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet={n}&predmet=kolesov8',
    },
    'pasechnik-9': {
        'max': 55,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet={n}&predmet=pasechnik_ucheb9',
    },
    'pasechnik-10': {
        'max': 27,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet={n}&predmet=pasechnik_ucheb10',
    },
    'pasechnik-11': {
        'max': 30,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet={n}&predmet=pasechnik_baz11',
    },
}

# Картинки именно с решением — только из /reshebniki/
IMG_RE = re.compile(r'src=["\'](/reshebniki/[^"\']+\.(?:png|jpg|gif|webp))["\']', re.I)


def fetch_images(url: str, number: str, session, retries=2):
    """Возвращает список URL картинок-решений для задачи."""
    for attempt in range(retries):
        try:
            r = session.get(url, timeout=12, verify=False)
            if r.status_code != 200:
                return []
            try:
                html = r.content.decode('utf-8')
            except UnicodeDecodeError:
                html = r.content.decode('cp1251', errors='replace')

            all_imgs = IMG_RE.findall(html)

            # Фильтруем только картинки, связанные с нашим номером задачи
            # Имя файла должно совпадать или начинаться с номера
            num_str = str(number)
            relevant = []
            for img in all_imgs:
                fname = img.rsplit('/', 1)[-1].rsplit('.', 1)[0]  # "126" or "126-1"
                # Берём только если имя файла начинается с нашего номера
                if fname == num_str or fname.startswith(num_str + '-') or fname.startswith(num_str + '_'):
                    relevant.append(BASE_URL + img)

            # Если ничего не нашли по точному совпадению — берём первую подходящую
            if not relevant and all_imgs:
                # Проверяем первую картинку — часто она именно для этой задачи
                first = all_imgs[0]
                fname = first.rsplit('/', 1)[-1].rsplit('.', 1)[0]
                if fname == num_str:
                    relevant.append(BASE_URL + first)

            return relevant

        except Exception:
            if attempt < retries - 1:
                time.sleep(1)
    return []


def scrape_images_for_book(slug: str, config: dict):
    out_path = OUTPUT_DIR / f'{slug}.json'
    if not out_path.exists():
        print(f'[{slug}] JSON не найден, пропускаем')
        return

    data = json.loads(out_path.read_text(encoding='utf-8'))
    # Индекс по номеру
    by_number = {str(p['number']): p for p in data}

    min_num = config.get('min', 1)
    max_num = config['max']
    url_fn = config['url_fn']

    # Скрапим только те, у которых ещё нет imageUrls
    to_scrape = [
        str(n) for n in range(min_num, max_num + 1)
        if str(n) in by_number and 'imageUrls' not in by_number[str(n)]
    ]

    if not to_scrape:
        already = sum(1 for p in data if 'imageUrls' in p)
        print(f'  [{slug}] картинки уже собраны ({already} записей)')
        return

    print(f'[{slug}] ищем картинки для {len(to_scrape)} задач...')

    session = requests.Session()
    session.headers.update(HEADERS)

    ok = 0
    empty = 0

    for i, number in enumerate(to_scrape):
        url = url_fn(number)
        imgs = fetch_images(url, number, session)

        by_number[number]['imageUrls'] = imgs
        if imgs:
            ok += 1
        else:
            empty += 1

        if (i + 1) % 100 == 0:
            _save(out_path, by_number)
            pct = ok * 100 // (ok + empty) if (ok + empty) > 0 else 0
            print(f'  [{slug}] {i+1}/{len(to_scrape)}: {ok} с картинками, {empty} без ({pct}%)')

        time.sleep(0.4)

    _save(out_path, by_number)
    print(f'[{slug}] ГОТОВО: {ok} с картинками / {empty} без. Всего: {len(by_number)}')


def _save(path, by_number):
    data = sorted(by_number.values(), key=lambda p: (len(str(p['number'])), str(p['number'])))
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')


def main():
    import sys
    target = sys.argv[1] if len(sys.argv) > 1 else None

    books = {k: v for k, v in BOOKS.items() if target is None or k == target}
    if not books:
        print(f'Не найдено: {target}')
        print(f'Доступные: {", ".join(BOOKS.keys())}')
        return

    for slug, cfg in books.items():
        scrape_images_for_book(slug, cfg)
        print()


if __name__ == '__main__':
    main()
