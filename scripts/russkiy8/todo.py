#!/usr/bin/env python3
"""Печатает номера упражнений ladyzhenskaya8, которые ещё не решены."""
import json, glob
from pathlib import Path
d = Path(__file__).parent
sols = {}
for f in sorted(glob.glob(str(d / 'r8_*.json'))):
    sols.update(json.load(open(f, encoding='utf-8')))
raw = json.load(open(d.parents[0] / 'reshak' / 'raw' / 'ladyzhenskaya8.json', encoding='utf-8'))
nums = sorted(int(x['key'].split('/')[-1]) for x in raw['items'])
left = [n for n in nums if str(n) not in sols]
print('решено', len(nums) - len(left), 'из', len(nums), '| осталось', len(left))
print(' '.join(map(str, left[:60])))
