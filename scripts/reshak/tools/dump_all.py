#!/usr/bin/env python3
"""dump_all.py <klass> <subj> <slug> <rawname> <start> <count> [marker]
Печатает все задачи книги с индекса start (count штук): номер, условие из raw (после marker) и картинки raw."""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import gdz_lib
klass, subj, slug, rawname = int(sys.argv[1]), sys.argv[2], sys.argv[3], sys.argv[4]
start, count = int(sys.argv[5]), int(sys.argv[6])
marker = sys.argv[7] if len(sys.argv) > 7 else None
b = gdz_lib.load_book(klass, subj, slug)
todo = [(c['title'], p) for c in b['chapters'] for p in c['problems']]
raw = {x['key']: x for x in json.load(open(Path(__file__).resolve().parents[1] / 'raw' / f'{rawname}.json', encoding='utf-8'))['items']}
print('total', len(todo), 'placeholders', sum('представлено выше' in json.dumps(p, ensure_ascii=False) for _, p in todo))
for title, p in todo[start:start + count]:
    n = str(p['number'])
    e = raw.get(n) or raw.get('new/' + n)
    cond = ''
    imgs = ''
    if e:
        ans = e.get('answer') or []
        if marker:
            idx = next((i for i, a in enumerate(ans) if marker in a), None)
            cond = ans[idx + 1] if idx is not None and idx + 1 < len(ans) else ' | '.join(ans)
        else:
            cond = ' | '.join(ans)
        imgs = ' '.join(e.get('images') or [])
    print(f'{n}\t{cond}\t[{imgs}]')
