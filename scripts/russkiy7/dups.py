#!/usr/bin/env python3
"""Пары номеров baranov7, ведущие на одну и ту же страницу учебника.
В raw смешаны две нумерации (издания), поэтому пары ищем по картинке и по тексту ответа."""
import json, re
from pathlib import Path

def dup_pairs():
    raw = json.load(open(Path(__file__).resolve().parents[1] / 'reshak' / 'raw' / 'baranov7.json', encoding='utf-8'))
    groups = {}
    for x in raw['items']:
        k = x['key'].split('/')[-1]
        if x.get('images'):
            groups.setdefault('i' + x['images'][0].replace('/2026/', '/'), []).append(k)
        txt = re.sub(r'\s+', ' ', ' '.join(x.get('answer') or [])).strip()[:150]
        if len(txt) > 60:
            groups.setdefault('t' + txt, []).append(k)
    seen, pairs = set(), []
    for v in groups.values():
        if len(v) == 2 and tuple(v) not in seen:
            seen.add(tuple(v))
            pairs.append(tuple(v))
    return pairs

def mirror(sols):
    """Копирует решение на парный номер, если тот ещё не решён."""
    for a, c in dup_pairs():
        if a in sols and c not in sols:
            sols[c] = sols[a]
        elif c in sols and a not in sols:
            sols[a] = sols[c]
    return sols
