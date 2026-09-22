#!/usr/bin/env python3
"""dump_ru.py <rawname> <start> <count> [maxlen]
Печатает упражнения русского языка из raw (reshak): номер, текст 2025 года (условие+ответ слитно), картинки."""
import json, sys
from pathlib import Path
rawname, start, count = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
maxlen = int(sys.argv[4]) if len(sys.argv) > 4 else 100000
items = json.load(open(Path(__file__).resolve().parents[1] / 'raw' / f'{rawname}.json', encoding='utf-8'))['items']
byk = {x['key']: x for x in items}
for n in range(start, start + count):
    e = byk.get(str(n))
    if not e:
        print(f'### {n} NONE'); continue
    ans = e.get('answer') or []
    cut = next((i for i, a in enumerate(ans) if a.startswith('Задание учебника')), len(ans))
    txt = '\n'.join(ans[:cut])
    imgs = ' '.join(e.get('images') or [])
    print(f'### {n} {("[img: " + imgs + "]") if imgs else ""}\n{txt[:maxlen]}\n')
