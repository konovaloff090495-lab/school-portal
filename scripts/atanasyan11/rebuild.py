#!/usr/bin/env python3
"""Собирает книгу 11-geometriya-atanasyan-11.json из батчей scripts/atanasyan11/g11_*.json.
Нумерация — по изданию 2020+ (raw atanasyan1011, ключи new/N). Главы по диапазонам номеров."""
import json, glob, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import gdz_lib
CHAPTERS = [
    ('§ 1. Объёмы тел', 440, 556),
    ('§ 2. Векторы в пространстве', 557, 636),
    ('§ 3. Метод координат в пространстве', 637, 760),
    ('§ 4. Задачи повышенной трудности', 761, 870),
]
sols = {}
for f in sorted(glob.glob(str(Path(__file__).parent / 'g11_*.json'))):
    sols.update(json.load(open(f, encoding='utf-8')))
b = gdz_lib.load_book(11, 'geometriya', 'atanasyan-11')
chapters = []
for title, lo, hi in CHAPTERS:
    probs = []
    for n in range(lo, hi + 1):
        s = sols.get(str(n))
        if s:
            probs.append({'number': str(n), 'condition': s['condition'], 'steps': s['steps'], 'formulas': [], 'answer': s['answer']})
    if probs:
        chapters.append({'title': title, 'problems': probs})
b['chapters'] = chapters
gdz_lib.save_book(b)
print('atanasyan-11: задач', sum(len(c['problems']) for c in chapters), 'глав', len(chapters))
