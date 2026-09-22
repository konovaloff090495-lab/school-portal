#!/usr/bin/env python3
"""dump_ru8.py <rawname> <start> <count> [maxlen]
Как dump_ru.py, но печатает и поле condition (в raw ladyzhenskaya8 условие лежит отдельно)."""
import json, sys
from pathlib import Path
rawname, start, count = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
maxlen = int(sys.argv[4]) if len(sys.argv) > 4 else 100000
items = json.load(open(Path(__file__).resolve().parents[1] / 'raw' / f'{rawname}.json', encoding='utf-8'))['items']
byk = {x['key'].split('/')[-1]: x for x in items}
for n in range(start, start + count):
    e = byk.get(str(n))
    if not e:
        print(f'### {n} NONE'); continue
    ans = e.get('answer') or []
    cut = next((i for i, a in enumerate(ans) if a.startswith('Задание учебника')), len(ans))
    cond = (e.get('condition') or '').strip()
    txt = '\n'.join(ans[:cut])
    print(f'### {n}\nУСЛОВИЕ: {cond[:800]}\n{txt[:maxlen]}\n')
