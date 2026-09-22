#!/usr/bin/env python3
"""Собирает книгу 7-russkiy-yazyk-ladyzhenskaya-7 из батчей r7_*.json.
Нумерация — редакция 2026 г. (raw baranov7, ключи new/N, упр. 1–539).
Главы по диапазонам номеров; блоки теории (вопросы/контрольные) кладутся после своего упражнения
под ключами voprN / kontrN (N — номер предыдущего упражнения)."""
import json, glob, sys
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
sols = {}
for f in sorted(glob.glob(str(Path(__file__).parent / 'r7_*.json'))):
    sols.update(json.load(open(f, encoding='utf-8')))
def solved(k):
    s = sols.get(k)
    return s and s.get('condition') and s.get('steps')
b = gdz_lib.load_book(7, 'russkiy-yazyk', 'ladyzhenskaya-7')
chapters = []
for title, lo, hi in CHAPTERS:
    probs = []
    for n in range(lo, hi + 1):
        for k in (str(n), f'vopr{n}', f'kontr{n}'):
            if solved(k):
                s = sols[k]
                probs.append({'number': k, 'condition': s['condition'], 'steps': s['steps'], 'formulas': [], 'answer': s.get('answer', '')})
    if probs:
        chapters.append({'title': title, 'problems': probs})
b['chapters'] = chapters
b['years'] = '2023–2026'
gdz_lib.save_book(b)
print('ladyzhenskaya-7: задач', sum(len(c['problems']) for c in chapters), 'глав', len(chapters))
