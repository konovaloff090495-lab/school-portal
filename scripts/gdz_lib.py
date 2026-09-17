#!/usr/bin/env python3
"""
Хранилище ГДЗ: одна книга = один JSON в src/data/gdz-books/, плюс index.json
с метаданными (без задач) — его читает сайт для списков и sitemap.

  from gdz_lib import load_book, save_book, rebuild_index, book_path
  b = load_book(6, 'matematika', 'vilenkin')
  ... правим b['chapters'][..]['problems'][..] ...
  save_book(b)          # пишет файл и пересобирает index.json

Критерий «решено» совпадает с сайтом: condition + (steps или imageUrls).
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIR = ROOT / 'src/data/gdz-books'
INDEX = DIR / 'index.json'

META_KEYS = ['slug', 'klass', 'subjectSlug', 'subject', 'authors', 'type', 'years',
             'publisher', 'fgos', 'parts', 'source']


def book_file(klass, subject_slug, slug):
    return f'{klass}-{subject_slug}-{slug}.json'


def book_path(klass, subject_slug, slug):
    return DIR / book_file(klass, subject_slug, slug)


def is_solved(p):
    return bool(p.get('condition')) and bool(p.get('steps') or p.get('imageUrls'))


def load_book(klass, subject_slug, slug):
    return json.load(open(book_path(klass, subject_slug, slug), encoding='utf-8'))


def iter_books():
    for f in sorted(DIR.glob('*.json')):
        if f.name == 'index.json':
            continue
        yield json.load(open(f, encoding='utf-8'))


def meta_of(b):
    probs = [p for ch in b.get('chapters', []) for p in ch.get('problems', [])]
    m = {k: b.get(k) for k in META_KEYS if k in b}
    m['file'] = book_file(b['klass'], b['subjectSlug'], b['slug'])
    m['problemCount'] = len(probs)
    m['solvedCount'] = sum(1 for p in probs if is_solved(p))
    m['chapterCount'] = len(b.get('chapters', []))
    return m


def rebuild_index():
    metas = [meta_of(b) for b in iter_books()]
    metas.sort(key=lambda m: (m['klass'], m['subjectSlug'], m['slug']))
    DIR.mkdir(parents=True, exist_ok=True)
    json.dump(metas, open(INDEX, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    return metas


def save_book(b, reindex=True):
    DIR.mkdir(parents=True, exist_ok=True)
    p = book_path(b['klass'], b['subjectSlug'], b['slug'])
    json.dump(b, open(p, 'w', encoding='utf-8'), ensure_ascii=False)
    if reindex:
        rebuild_index()
    return p


def set_solutions(klass, subject_slug, slug, sols):
    """sols: {number: {'condition'?: str, 'steps': [...], 'answer': str}} → обновляет книгу."""
    b = load_book(klass, subject_slug, slug)
    upd = 0
    seen = set()
    for ch in b['chapters']:
        for p in ch['problems']:
            s = sols.get(p['number'])
            if s:
                seen.add(p['number'])
                if s.get('condition'):
                    p['condition'] = s['condition']
                p['steps'] = s['steps']
                p['answer'] = s['answer']
                upd += 1
    save_book(b)
    miss = sorted(set(sols) - seen)
    print(f'{slug} {klass} кл: обновлено {upd} из {len(sols)}' + (f'; НЕ найдены: {miss[:20]}' if miss else ''))
    return upd


def gdz_index_lookup(klass, slug):
    """subjectSlug книги по (klass, slug) — для старых вызовов без предмета."""
    for m in json.load(open(INDEX, encoding='utf-8')):
        if m['klass'] == klass and m['slug'] == slug:
            return m['subjectSlug']
    raise KeyError(f'нет книги {slug} {klass} кл в index.json')


if __name__ == '__main__':
    metas = rebuild_index()
    print(f'книг: {len(metas)}, задач: {sum(m["problemCount"] for m in metas)}, решено: {sum(m["solvedCount"] for m in metas)}')
