#!/usr/bin/env python3
"""Собирает книгу 8-russkiy-yazyk-ladyzhenskaya-8 из батчей r8_*.json (raw ladyzhenskaya8, упр. 1–452)."""
import json, glob, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import gdz_lib
CHAPTERS = [
    ('Русский язык в современном мире. Повторение изученного в 5–7 классах', 1, 36),
    ('Синтаксис. Пунктуация. Культура речи. Словосочетание', 37, 71),
    ('Простое предложение', 72, 89),
    ('Двусоставные предложения. Главные члены предложения', 90, 120),
    ('Второстепенные члены предложения', 121, 170),
    ('Односоставные предложения. Неполные предложения', 171, 222),
    ('Однородные члены предложения', 223, 286),
    ('Обособленные члены предложения', 287, 341),
    ('Обращение. Вводные и вставные конструкции', 342, 400),
    ('Чужая речь', 401, 431),
    ('Повторение и систематизация изученного', 432, 452),
]
sols = {}
for f in sorted(glob.glob(str(Path(__file__).parent / 'r8_*.json'))):
    sols.update(json.load(open(f, encoding='utf-8')))
def solved(k):
    s = sols.get(k)
    return s and s.get('condition') and s.get('steps')
b = gdz_lib.load_book(8, 'russkiy-yazyk', 'ladyzhenskaya-8')
chapters = []
for title, lo, hi in CHAPTERS:
    probs = []
    for n in range(lo, hi + 1):
        k = str(n)
        if solved(k):
            s = sols[k]
            probs.append({'number': k, 'condition': s['condition'], 'steps': s['steps'], 'formulas': [], 'answer': s.get('answer', '')})
    if probs:
        chapters.append({'title': title, 'problems': probs})
b['chapters'] = chapters
b['years'] = '2023–2026'
gdz_lib.save_book(b)
print('ladyzhenskaya-8: задач', sum(len(c['problems']) for c in chapters), 'глав', len(chapters))
