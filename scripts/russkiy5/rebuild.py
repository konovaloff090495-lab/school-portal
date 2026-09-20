#!/usr/bin/env python3
"""Собирает книгу 5-russkiy-yazyk-baranov из батчей r5_*.json (главы по диапазонам номеров учебника 2025 г.)."""
import json, glob, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import gdz_lib
CHAPTERS = [
    ('Язык и общение', 1, 7),
    ('Повторение изученного в начальной школе', 8, 72),
    ('Общение. Речь. Речевая деятельность', 73, 107),
    ('Текст', 108, 156),
    ('Функциональные разновидности языка', 157, 166),
    ('Фонетика. Орфоэпия. Графика. Орфография', 167, 265),
    ('Лексикология. Культура речи', 266, 340),
    ('Морфемика. Орфография. Культура речи', 341, 450),
    ('Морфология. Имя существительное', 451, 624),
    ('Имя прилагательное', 625, 675),
    ('Глагол', 676, 783),
    ('Синтаксис. Пунктуация. Культура речи', 784, 935),
    ('Повторение и систематизация изученного', 936, 967),
]
sols = {}
for f in sorted(glob.glob(str(Path(__file__).parent / 'r5_*.json'))):
    sols.update(json.load(open(f, encoding='utf-8')))
def solved(k):
    s = sols.get(k)
    return s and s.get('condition') and s.get('steps')
b = gdz_lib.load_book(5, 'russkiy-yazyk', 'baranov')
chapters = []
for title, lo, hi in CHAPTERS:
    probs = []
    for n in range(lo, hi + 1):
        for k in (str(n), f'kontr{n}'):
            if solved(k):
                s = sols[k]
                probs.append({'number': k, 'condition': s['condition'], 'steps': s['steps'], 'formulas': [], 'answer': s.get('answer', '')})
    if probs:
        chapters.append({'title': title, 'problems': probs})
b['chapters'] = chapters
gdz_lib.save_book(b)
print('baranov-5: задач', sum(len(c['problems']) for c in chapters), 'глав', len(chapters))
