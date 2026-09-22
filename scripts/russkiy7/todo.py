#!/usr/bin/env python3
"""Печатает номера упражнений baranov7, которые ещё не решены (с учётом зеркалирования дублей)."""
import json, glob
from pathlib import Path
d = Path(__file__).parent
sols = {}
for f in sorted(glob.glob(str(d / 'r7_*.json'))):
    sols.update(json.load(open(f, encoding='utf-8')))
raw = json.load(open(d.parents[0] / 'reshak' / 'raw' / 'baranov7.json', encoding='utf-8'))
byimg = {}
for x in raw['items']:
    if x.get('images'):
        byimg.setdefault(x['images'][0].replace('/2026/', '/'), []).append(x['key'].split('/')[-1])
for v in byimg.values():
    if len(v) == 2:
        a, c = v
        if a in sols and c not in sols: sols[c] = sols[a]
        if c in sols and a not in sols: sols[a] = sols[c]
nums = sorted(int(x['key'].split('/')[-1]) for x in raw['items'] if x['key'].split('/')[-1].isdigit())
left = [n for n in nums if str(n) not in sols]
print('решено', len(nums) - len(left), 'из', len(nums), '| осталось', len(left))
print(' '.join(map(str, left[:60])))
