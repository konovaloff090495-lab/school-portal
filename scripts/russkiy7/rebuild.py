#!/usr/bin/env python3
"""Собирает книгу 7-russkiy-yazyk-ladyzhenskaya-7 из батчей r7_*.json.
Нумерация — редакция 2026 г. (raw baranov7, ключи new/N, упр. 1–539).
Главы по диапазонам номеров; блоки теории (вопросы/контрольные) кладутся после своего упражнения
под ключами voprN / kontrN (N — номер предыдущего упражнения)."""
import json, glob, re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import gdz_lib
CHAPTERS = [
    ('Русский язык как развивающееся явление', 1, 6),
    ('Повторение изученного в 5–6 классах. Язык и речь', 7, 66),
    ('Текст. Функциональные разновидности языка', 67, 101),
    ('Морфология. Причастие', 102, 263),
    ('Деепричастие', 264, 307),
    ('Наречие', 308, 392),
    ('Категория состояния', 393, 402),
    ('Служебные части речи. Предлог. Союз. Частица. Междометие', 403, 484),
    ('Повторение и систематизация изученного', 485, 539),
]
# Нумерация raw смешивает два издания (73 пары номеров ведут на одну страницу),
# поэтому глава определяется не только диапазоном, но и темой самого решения.
TOPIC_CHAPTER = [
    (r'дееприч', 'Деепричастие'),
    (r'категори\w* состояния', 'Категория состояния'),
    (r'нареч', 'Наречие'),
    (r'(?<!дее)причаст', 'Морфология. Причастие'),
    (r'предлог', 'Служебные части речи. Предлог. Союз. Частица. Междометие'),
    (r'союз', 'Служебные части речи. Предлог. Союз. Частица. Междометие'),
    (r'частиц', 'Служебные части речи. Предлог. Союз. Частица. Междометие'),
    (r'междомет', 'Служебные части речи. Предлог. Союз. Частица. Междометие'),
]
def topic_chapter(sol):
    text = (sol['condition'] + ' ' + ' '.join(sol['steps'])).lower()
    best, best_n = None, 0
    for pat, title in TOPIC_CHAPTER:
        n = len(re.findall(pat, text))
        if n > best_n:
            best, best_n = title, n
    return best if best_n >= 2 else None

sols = {}
for f in sorted(glob.glob(str(Path(__file__).parent / 'r7_*.json'))):
    sols.update(json.load(open(f, encoding='utf-8')))
def solved(k):
    s = sols.get(k)
    return s and s.get('condition') and s.get('steps')
# В raw baranov7 73 пары номеров ссылаются на одну и ту же страницу учебника
# (две нумерации разных изданий). Решённый близнец копируется на парный номер,
# чтобы обе страницы сайта были заполнены.
def _dup_pairs():
    raw = json.load(open(Path(__file__).resolve().parents[1] / 'reshak' / 'raw' / 'baranov7.json', encoding='utf-8'))
    byimg = {}
    for x in raw['items']:
        if x.get('images'):
            byimg.setdefault(x['images'][0].replace('/2026/', '/'), []).append(x['key'].split('/')[-1])
    return [v for v in byimg.values() if len(v) == 2]

for a, c in _dup_pairs():
    if solved(a) and not solved(c):
        sols[c] = sols[a]
    elif solved(c) and not solved(a):
        sols[a] = sols[c]

b = gdz_lib.load_book(7, 'russkiy-yazyk', 'ladyzhenskaya-7')
titles = [t for t, _, _ in CHAPTERS]
buckets = {t: [] for t in titles}
moved = 0
for title, lo, hi in CHAPTERS:
    for n in range(lo, hi + 1):
        for k in (str(n), f'vopr{n}', f'kontr{n}'):
            if not solved(k):
                continue
            s = sols[k]
            dest = title
            if title in titles[3:8]:
                tc = topic_chapter(s)
                if tc and tc != title:
                    dest, moved = tc, moved + 1
            buckets[dest].append((n, {'number': k, 'condition': s['condition'], 'steps': s['steps'], 'formulas': [], 'answer': s.get('answer', '')}))
chapters = [{'title': t, 'problems': [p for _, p in sorted(buckets[t], key=lambda x: x[0])]} for t in titles if buckets[t]]
print('перенесено по теме:', moved)
b['chapters'] = chapters
b['years'] = '2023–2026'
gdz_lib.save_book(b)
print('ladyzhenskaya-7: задач', sum(len(c['problems']) for c in chapters), 'глав', len(chapters))
