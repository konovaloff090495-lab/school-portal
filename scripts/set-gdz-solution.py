#!/usr/bin/env python3
"""Обновляет решение задачи в gdz-books.json по (slug, klass, number).
sols: dict number -> {'steps':[...], 'answer':'...'}"""
import json
from pathlib import Path
BOOKS = Path(__file__).parent.parent / 'src/data/gdz-books.json'

def apply_solutions(slug, klass, sols):
    b = json.load(open(BOOKS, encoding='utf-8'))
    x = next(v for v in b if v['slug']==slug and v['klass']==klass)
    upd = 0
    for c in x['chapters']:
        for p in c['problems']:
            if p['number'] in sols:
                p['steps'] = sols[p['number']]['steps']
                p['answer'] = sols[p['number']]['answer']
                upd += 1
    json.dump(b, open(BOOKS,'w',encoding='utf-8'), ensure_ascii=False)
    print(f"{slug} {klass}кл: обновлено решений {upd} из {len(sols)}")
    miss = set(sols)-{p['number'] for c in x['chapters'] for p in c['problems']}
    if miss: print("НЕ найдены номера:", sorted(miss)[:20])
