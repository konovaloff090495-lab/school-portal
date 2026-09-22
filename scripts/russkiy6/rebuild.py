#!/usr/bin/env python3
"""Собирает книгу 6-russkiy-yazyk-ladyzhenskaya из батчей r6_*.json (главы по диапазонам номеров учебника 2025 г.).
Границы глав — по «Контрольным вопросам» редакции 2025 (kontr26/102/166/190/281/348/397/484): раздел «Повторение»
идёт ПОСЛЕ контрольных вопросов (349–361 — повторение словообразования, 398–406 — существительного, 485–494 —
прилагательного), поэтому границы сдвинуты на конец повторения. Числительное/местоимение/глагол — уточнять по контенту."""
import json, glob, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import gdz_lib
CHAPTERS = [
    ('Язык. Речь. Общение', 1, 26),
    ('Повторение изученного в 5 классе', 27, 102),
    ('Текст', 103, 166),
    ('Функциональные разновидности языка', 167, 190),
    ('Лексика. Фразеология. Культура речи', 191, 281),
    ('Словообразование. Орфография. Культура речи', 282, 361),
    ('Морфология. Имя существительное', 362, 406),
    ('Имя прилагательное', 407, 494),
    ('Имя числительное', 495, 549),
    ('Местоимение', 550, 632),
    ('Глагол', 633, 722),
    ('Повторение и систематизация изученного', 723, 752),
]
sols = {}
for f in sorted(glob.glob(str(Path(__file__).parent / 'r6_*.json'))):
    sols.update(json.load(open(f, encoding='utf-8')))
def solved(k):
    s = sols.get(k)
    return s and s.get('condition') and s.get('steps')
b = gdz_lib.load_book(6, 'russkiy-yazyk', 'ladyzhenskaya')
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
b['years'] = '2023–2025'
gdz_lib.save_book(b)
print('ladyzhenskaya-6: задач', sum(len(c['problems']) for c in chapters), 'глав', len(chapters))
