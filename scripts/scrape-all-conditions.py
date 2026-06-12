#!/usr/bin/env python3
"""
Массовый парсер условий для всех учебников.
Парсит ВСЕ номера задач от 1 до максимального.
Сохраняет в scripts/gdz-conditions/{slug}.json
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
    'Connection': 'keep-alive',
}

OUTPUT_DIR = Path(__file__).parent / 'gdz-conditions'
OUTPUT_DIR.mkdir(exist_ok=True)

# ────────────────────────────────────────────────────
# Все книги: slug → (url_fn, max_number)
# ────────────────────────────────────────────────────
BOOKS = {
    # ─── Математика 5-6 ───
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
    # ─── Алгебра 7-9 ───
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
        'max': 700,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet={n}&predmet=makarychev7',
    },
    'makarychev-8': {
        'max': 560,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet={n}&predmet=makarychev8',
    },
    'makarychev-9': {
        'max': 550,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet={n}&predmet=makarychev9',
    },
    # ─── Геометрия 7-11 ───
    'atanasyan-7': {
        'max': 330,
        'url_fn': lambda n: f'https://reshak.ru/otvet/otvet11.php?otvet1={n}',
    },
    'atanasyan-8': {
        'max': 451,
        'url_fn': lambda n: f'https://reshak.ru/otvet/otvet11.php?otvet1={n}',
    },
    'atanasyan-9': {
        'max': 420,
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
    # ─── Русский язык ───
    'baranov-5': {
        'max': 700,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet={n}&predmet=baranov5',
    },
    'ladyzhenskaya-6': {
        'max': 670,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet={n}&predmet=ladizhenskaya6',
    },
    'ladyzhenskaya-7': {
        'max': 700,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet={n}&predmet=ladizhenskaya7',
    },
    'ladyzhenskaya-8': {
        'max': 510,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet={n}&predmet=ladizhenskaya8',
    },
    # ─── Физика ───
    'peryshkin-7': {
        'max': 320,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet=upr/{n}&predmet=perishkin7',
    },
    'peryshkin-8': {
        'max': 330,
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet=Upr/{n}&predmet=per8',
    },
    # ─── Алгебра 10-11 ───
    'kolmogorov-10': {
        'max': 580,
        'url_fn': lambda n: f'https://reshak.ru/otvet/otvet29.php?otvet1={n}',
    },
    'kolmogorov-11': {
        'max': 360,
        'url_fn': lambda n: f'https://reshak.ru/otvet/otvet29.php?otvet1={n}',
    },
}

# ────────────────────────────────────────────────────
# Filtros de plantillas
# ────────────────────────────────────────────────────
TEMPLATES = (
    'Решенное задание',
    'Упр.',
    'Задание ',
    'Решение задания',
    'Ответ на задание',
    'Решебник',
)


def fetch_condition(url: str, session, retries=2):
    for attempt in range(retries):
        try:
            r = session.get(url, timeout=12, verify=False)
            if r.status_code != 200:
                return None

            try:
                html = r.content.decode('utf-8')
            except UnicodeDecodeError:
                html = r.content.decode('cp1251', errors='replace')

            soup = BeautifulSoup(html, 'html.parser')

            # Primary: meta description
            meta = soup.find('meta', {'name': 'description'})
            if meta:
                cond = meta.get('content', '').strip()
                if cond and not any(cond.startswith(t) for t in TEMPLATES) and len(cond) > 15:
                    return clean(cond)

            # Fallback: text_zad div
            div = soup.find('div', class_='text_zad')
            if div:
                text = div.get_text(' ', strip=True)
                text = re.sub(
                    r'Рассмотрим вариант решения.*?(?:Вентана-Граф|Просвещение|Дрофа|Мнемозина|Бином|Академкнига|Русское слово):',
                    '', text, flags=re.DOTALL
                ).strip()
                text = re.sub(r'\*Цитирирование.*', '', text).strip()
                text = re.sub(r'Совет дня!.*', '', text).strip()
                if len(text) > 20:
                    return clean(text[:600])

            return None

        except Exception:
            if attempt < retries - 1:
                time.sleep(1)
    return None


def clean(text: str) -> str:
    text = re.sub(r'\s+', ' ', text).strip()
    text = text.replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&').replace('&nbsp;', ' ')
    return text.strip()


def scrape_book(slug: str, config: dict):
    out_path = OUTPUT_DIR / f'{slug}.json'
    max_num = config['max']
    url_fn = config['url_fn']

    # Load existing
    existing = {}
    if out_path.exists():
        try:
            data = json.loads(out_path.read_text(encoding='utf-8'))
            existing = {str(p['number']): p for p in data}
        except Exception:
            pass

    to_scrape = [str(n) for n in range(1, max_num + 1) if str(n) not in existing]
    if not to_scrape:
        print(f'  [{slug}] всё спарсено ({len(existing)} условий)')
        return

    print(f'[{slug}] парсим {len(to_scrape)} задач (из {max_num} всего)...')

    session = requests.Session()
    session.headers.update(HEADERS)

    results = dict(existing)
    ok = 0
    fail = 0

    for i, number in enumerate(to_scrape):
        url = url_fn(number)
        cond = fetch_condition(url, session)

        if cond:
            results[number] = {'number': number, 'condition': cond}
            ok += 1
        else:
            fail += 1

        if (i + 1) % 50 == 0:
            _save(out_path, results)
            pct = ok * 100 // (ok + fail) if (ok + fail) > 0 else 0
            print(f'  [{slug}] {i+1}/{len(to_scrape)}: {ok} ок, {fail} нет ({pct}% успех)')

        time.sleep(0.6)

    _save(out_path, results)
    print(f'[{slug}] ГОТОВО: {ok} ок / {fail} нет. Всего: {len(results)}')


def _save(path, results):
    data = sorted(results.values(), key=lambda p: (len(str(p['number'])), str(p['number'])))
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
        scrape_book(slug, cfg)
        print()


if __name__ == '__main__':
    main()
