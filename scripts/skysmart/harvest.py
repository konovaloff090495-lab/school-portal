#!/usr/bin/env python3
"""
Сборщик структуры и эталонных решений с resh.skysmart.ru (API homework-solutions-api).

Что делает:
  1. books_index.json (из sitemap) → для каждой книги GET /api/v3/assistant/books/{id}
     → raw/books/{id}.json (главы, номера, страницы)
  2. Для каждого номера GET /api/v2/assistant/tasks/{taskId} → raw/tasks/{bookId}/{taskId}.json
     (шаги решения + ответ; условий у Skysmart нет — только сканы)

Запуск:
  python3 harvest.py --subject english            # только предмет
  python3 harvest.py --subject english --klass 7  # предмет + класс
  python3 harvest.py --book 93                     # одна книга
  python3 harvest.py --resume                      # продолжить (пропускает скачанное)

Пауза между запросами RATE (сек). Всё идемпотентно: что скачано — не качается снова.
Лок-файл harvest.lock — чтобы не запускать два экземпляра.
"""
import argparse, json, os, sys, time, random
from pathlib import Path
import urllib.request, urllib.error

HERE = Path(__file__).parent
RAW = HERE / 'raw'
API = 'https://homework-solutions-api.skysmart.ru/api'
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Origin': 'https://resh.skysmart.ru',
    'Referer': 'https://resh.skysmart.ru/',
}
RATE = float(os.environ.get('SKY_RATE', '0.35'))   # сек между запросами


def get(url, retries=4):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if e.code in (429, 500, 502, 503, 504):
                time.sleep(5 * (attempt + 1))
                continue
            raise
        except Exception:
            time.sleep(3 * (attempt + 1))
    return None


def load_index():
    return json.load(open(HERE / 'books_index.json'))


def harvest_book(b, log):
    bid = b['id']
    bpath = RAW / 'books' / f'{bid}.json'
    if bpath.exists():
        book = json.load(open(bpath))
    else:
        data = get(f'{API}/v3/assistant/books/{bid}')
        time.sleep(RATE + random.random() * 0.2)
        if not data or not data.get('data'):
            log(f'  book {bid}: нет данных')
            return 0
        book = data['data']
        bpath.parent.mkdir(parents=True, exist_ok=True)
        json.dump(book, open(bpath, 'w'), ensure_ascii=False)
    tdir = RAW / 'tasks' / str(bid)
    tdir.mkdir(parents=True, exist_ok=True)
    tasks = [t for ch in (book.get('chapters') or []) for t in (ch.get('tasks') or [])]
    done = 0
    for t in tasks:
        tid = t['id']
        tpath = tdir / f'{tid}.json'
        if tpath.exists():
            continue
        data = get(f'{API}/v2/assistant/tasks/{tid}')
        time.sleep(RATE + random.random() * 0.2)
        if data and data.get('data'):
            json.dump(data['data'], open(tpath, 'w'), ensure_ascii=False)
            done += 1
        else:
            json.dump({'_missing': True}, open(tpath, 'w'))
    log(f'  book {bid} {b["subject"]} {b["klass"]} кл: номеров {len(tasks)}, скачано новых {done}')
    return done


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--subject')
    ap.add_argument('--klass', type=int)
    ap.add_argument('--book', type=int)
    ap.add_argument('--resume', action='store_true')
    a = ap.parse_args()

    lock = HERE / 'harvest.lock'
    if lock.exists() and time.time() - lock.stat().st_mtime < 3 * 3600:
        print('уже запущен (harvest.lock свежий)'); sys.exit(1)
    lock.write_text(str(os.getpid()))
    logf = open(HERE / 'harvest.log', 'a')

    def log(s):
        line = time.strftime('%H:%M:%S ') + s
        print(line, flush=True); logf.write(line + '\n'); logf.flush()

    books = load_index()
    if a.book:
        books = [b for b in books if b['id'] == a.book]
    if a.subject:
        books = [b for b in books if b['subject'] == a.subject]
    if a.klass:
        books = [b for b in books if b['klass'] == a.klass]
    books.sort(key=lambda b: (b['klass'], -b['tasks']))
    log(f'старт: книг {len(books)}, номеров ~{sum(b["tasks"] for b in books)}')
    try:
        for i, b in enumerate(books, 1):
            harvest_book(b, log)
            lock.write_text(str(os.getpid()))
    finally:
        lock.unlink(missing_ok=True)
    log('готово')


if __name__ == '__main__':
    main()
