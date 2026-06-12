#!/usr/bin/env python3
"""
Парсер условий с reshak.ru для книг, которые на gdz.ru только в виде картинок.
Сохраняет результаты в scripts/gdz-conditions/{book-slug}.json
"""

import requests
import json
import time
import re
import ssl
import urllib3
from pathlib import Path
from bs4 import BeautifulSoup

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
}

OUTPUT_DIR = Path(__file__).parent / 'gdz-conditions'
OUTPUT_DIR.mkdir(exist_ok=True)

# ────────────────────────────────────────────────────
# URL builders для каждой книги
# ────────────────────────────────────────────────────

def url_merzlyak(grade, number):
    return f'https://reshak.ru/otvet/reshebniki.php?otvet={number}&predmet=merzlyak{grade}'

def url_atanasyan(number):
    return f'https://reshak.ru/otvet/otvet11.php?otvet1={number}'

def url_vilenkin5(number):
    # Part 1 covers problems 1-~460, Part 2 covers 1-~350 with own numbering
    # For numbers 1-50 → part1, for 81-90 and 221-225 → try part1 first
    n = int(number)
    if n <= 200:
        return f'https://reshak.ru/otvet/reshebniki.php?otvet=part1/{number}&predmet=vilenkin5n'
    else:
        return f'https://reshak.ru/otvet/reshebniki.php?otvet=part1/{number}&predmet=vilenkin5n'

def url_peryshkin7(number):
    return f'https://reshak.ru/otvet/reshebniki.php?otvet=upr/{number}&predmet=perishkin7'

def url_peryshkin8(number):
    return f'https://reshak.ru/otvet/reshebniki.php?otvet=Upr/{number}&predmet=per8'

# ────────────────────────────────────────────────────
# Problem numbers per book (from gdz.ts arrays)
# ────────────────────────────────────────────────────

BOOKS_EXTRA = {
    'ladyzhenskaya-8': {
        'numbers': ['1','4','10','12','20','22','33','40','66','70','80','141','150','160','168','175','231','240','250','258','265','291','300','310','320','361','370','380','390','431','440','450','460','501','510'],
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet={n}&predmet=ladizhenskaya8',
    },
    'atanasyan-10': {
        'numbers': ['1','2','4','5','7','8','10','15','20','25','30','35','42','45','50','56','92','95','100','105','110','115','165','168','180','185','200','215','233'],
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet=new/{n}&predmet=atan10_11',
    },
    'atanasyan-11': {
        'numbers': ['1','2','4','5','6','8','10','12','15','20','22','44','48','55','58','70','72','85','105','108','115','120','140','145','163'],
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet=new/{n}&predmet=atan10_11',
    },
    'kolmogorov-10': {
        'numbers': ['3','6','8','41','45','50','101','105','110','171','175'],
        'url_fn': lambda n: f'https://reshak.ru/otvet/otvet29.php?otvet1={n}',
    },
    'kolmogorov-11': {
        'numbers': ['1','2','5','6','8','10','11','15','16','18','20','22','25','27','30','32','35','36','40','42'],
        'url_fn': lambda n: f'https://reshak.ru/otvet/otvet29.php?otvet1={n}',
    },
    'merzlyak-5': {
        'numbers': ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','32','38','42','48','58','62','68','75','82','86','92','100','140','145','150','158','165','172','180','255','260','265','270','275','385','392','396','465','470','476','480','543','548'],
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet={n}&predmet=merzlyak5',
    },
    'merzlyak-6': {
        'numbers': ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','25','30','38','42','65','70','77','80','135','140','150','160','170','180','185','195','215','220','225','235','242','250','258','285','290','295','300','305','312','318','325','340','348'],
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet={n}&predmet=merzlyak6',
    },
    'vilenkin-6': {
        'numbers': ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','50','55','60','65','70','80','90','100','110','120','135','140','143','146','153','155','160','170','180','193','198','205','215','285','290','300','310','320','338','343','355','365','423','425','430','438','505','515','525'],
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet=part1/{n}&predmet=vilenkin6n',
    },
    'peryshkin-7-extra': {
        'numbers': ['3','8','17','21','75','80','85','90','175','180','260','265','315'],
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet=upr/{n}&predmet=perishkin7',
    },
    'peryshkin-8-extra': {
        'numbers': ['15','25','30','36','42','50','75','80','88','95','155','160','165','172','180','188','235','243','295','305','312','320'],
        'url_fn': lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet=Upr/{n}&predmet=per8',
    },
}

BOOKS = {
    'merzlyak-7': {
        'numbers': [
            '1','2','3','4','5','10','15','20',  # Solutions
            '76','78','82','90','151','155','160',
            '216','220','225','281','285','331','340',
            '21','25','30','35','40','95','100','105',  # Extra
            '110','165','170','230','235','240','290',
        ],
        'url_fn': lambda n: url_merzlyak(7, n),
    },
    'merzlyak-8': {
        'numbers': [
            '1','5','10','61','65','70','75',  # Solutions
            '136','140','145','211','215','321','325','386',
            '15','20','25','80','85','90','95',  # Extra
            '150','155','160','220','270','330','335',
        ],
        'url_fn': lambda n: url_merzlyak(8, n),
    },
    'merzlyak-9': {
        'numbers': [
            '1','5','10','71','75','146','150','155',  # Solutions
            '216','220','266','275',
            '15','20','25','80','85','160','165','170',  # Extra
            '225','230','280',
            '33','38','42','92','100','178','184','190',  # Extra2
        ],
        'url_fn': lambda n: url_merzlyak(9, n),
    },
    'atanasyan-7': {
        'numbers': [str(i) for i in range(1, 26)],  # Solutions: 1-25
        'url_fn': lambda n: url_atanasyan(n),
    },
    'atanasyan-8': {
        'numbers': [
            '1','5','10','15','61','65','70','75',  # Solutions
            '141','145','211','215','281','285','331',
            '20','25','30','80','85','90','150','155',  # Extra
            '220','225','290','295','340',
        ],
        'url_fn': lambda n: url_atanasyan(n),
    },
    'atanasyan-9': {
        'numbers': [
            '1','5','10','51','55','60','111','115',  # Solutions
            '120','166','170','211','215','220','296',
            '15','20','25','65','70','75','125','130',  # Extra
            '175','180','225','230','255',
        ],
        'url_fn': lambda n: url_atanasyan(n),
    },
    'vilenkin-5': {
        'numbers': [str(i) for i in range(1, 51)] + [
            '81','82','83','84','85','86','87','88','89','90',
            '221','222','223','224','225',
        ],
        'url_fn': lambda n: url_vilenkin5(n),
    },
    'peryshkin-7': {
        'numbers': [
            '1','5','11','15','56','60','65','70',  # Solutions
            '151','160','170','236','245','255','301','310',
            '3','8','17','21','75','80','85','90',  # Extra
            '175','180','260','265','315',
        ],
        'url_fn': lambda n: url_peryshkin7(n),
    },
    'peryshkin-8': {
        'numbers': [
            '1','5','10','20','66','70','131','135',  # Solutions
            '140','145','150','226','286','290',
            '15','25','30','75','80','155','160','165',  # Extra
            '235','295','305',
        ],
        'url_fn': lambda n: url_peryshkin8(n),
    },
}

# ────────────────────────────────────────────────────
# Fetcher
# ────────────────────────────────────────────────────

def create_session():
    session = requests.Session()
    session.headers.update(HEADERS)
    return session

def fetch_condition(url: str, session, retries=3):
    """Возвращает условие задачи или None если не нашли."""
    for attempt in range(retries):
        try:
            r = session.get(url, timeout=15, verify=False)
            if r.status_code != 200:
                return None

            # Определяем кодировку: пробуем UTF-8, затем cp1251
            content_bytes = r.content
            try:
                html = content_bytes.decode('utf-8')
            except UnicodeDecodeError:
                try:
                    html = content_bytes.decode('cp1251')
                except UnicodeDecodeError:
                    html = content_bytes.decode('utf-8', errors='replace')

            soup = BeautifulSoup(html, 'html.parser')

            # Основной источник: meta description
            meta = soup.find('meta', {'name': 'description'})
            if meta:
                cond = meta.get('content', '').strip()
                # Фильтр: пропускаем шаблонные ответы
                TEMPLATES = (
                    'Решенное задание',
                    'Упр.',
                    'Задание ',
                    'Решение задания',
                    'Ответ на задание',
                )
                if cond and not any(cond.startswith(t) for t in TEMPLATES):
                    return clean_condition(cond)

            # Запасной источник: text_zad div
            txt_div = soup.find('div', class_='text_zad')
            if txt_div:
                text = txt_div.get_text(' ', strip=True)
                # Убираем служебный текст — общий паттерн: «Рассмотрим...ИздательствоНазвание:»
                text = re.sub(r'Рассмотрим вариант решения.*?(?:Вентана-Граф|Просвещение|Дрофа|Мнемозина|Бином|Академкнига|Русское слово):', '', text, flags=re.DOTALL).strip()
                text = re.sub(r'\*Цитирирование.*', '', text).strip()
                text = re.sub(r'Совет дня!.*', '', text).strip()
                if len(text) > 20:
                    return clean_condition(text[:600])

            return None

        except (requests.exceptions.SSLError, ssl.SSLError):
            if attempt < retries - 1:
                time.sleep(2)
            continue
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(1)
            continue

    return None


def clean_condition(text: str) -> str:
    """Очищает и нормализует текст условия."""
    # Убираем избыточные пробелы
    text = re.sub(r'\s+', ' ', text).strip()
    # Убираем трейлинг "..." из обрезанных мета-описаний
    text = text.rstrip('.')
    if text.endswith('..'):
        text = text[:-2].rstrip()
    # Заменяем HTML сущности
    text = text.replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&')
    text = text.replace('&nbsp;', ' ').replace('  ', ' ')
    return text.strip()


# ────────────────────────────────────────────────────
# Main
# ────────────────────────────────────────────────────

def scrape_book(slug: str, config: dict):
    out_path = OUTPUT_DIR / f'{slug}.json'

    # Загружаем уже собранные данные если есть
    existing = {}
    if out_path.exists():
        try:
            with open(out_path, encoding='utf-8') as f:
                data = json.load(f)
            existing = {str(p['number']): p for p in data}
        except Exception:
            pass

    numbers = config['numbers']
    url_fn = config['url_fn']

    # Фильтруем уже спарсенные
    to_scrape = [n for n in numbers if n not in existing]
    if not to_scrape:
        print(f'  [{slug}] всё уже спарсено ({len(existing)} условий)')
        return existing

    print(f'[{slug}] парсим {len(to_scrape)} задач...')

    session = create_session()
    results = dict(existing)
    ok_count = 0
    fail_count = 0

    for i, number in enumerate(to_scrape):
        url = url_fn(number)
        condition = fetch_condition(url, session)

        if condition:
            results[number] = {'number': number, 'condition': condition}
            ok_count += 1
            if ok_count % 10 == 0 or ok_count <= 5:
                print(f'  ✓ №{number}: {condition[:60]}...')
        else:
            fail_count += 1

        # Сохраняем каждые 20 задач
        if (i + 1) % 20 == 0:
            save_results(out_path, results)
            print(f'  → сохранено {len(results)} задач')

        time.sleep(0.8)  # Пауза между запросами

    save_results(out_path, results)
    print(f'[{slug}] готово: {ok_count} ок, {fail_count} не нашли. Всего: {len(results)}')
    return results


def save_results(path: Path, results: dict):
    """Сохраняет в JSON."""
    data = sorted(results.values(), key=lambda p: (len(str(p['number'])), str(p['number'])))
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    import sys

    # Если передан аргумент - парсим только эту книгу
    target = sys.argv[1] if len(sys.argv) > 1 else None

    all_books = {**BOOKS, **BOOKS_EXTRA}
    books_to_scrape = {k: v for k, v in all_books.items() if target is None or k == target}

    if not books_to_scrape:
        print(f'Книга не найдена: {target}')
        print(f'Доступные: {", ".join(all_books.keys())}')
        return

    for slug, config in books_to_scrape.items():
        scrape_book(slug, config)
        print()


if __name__ == '__main__':
    main()
