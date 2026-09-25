#!/usr/bin/env python3
"""Вливает файл с ответами в src/data/textbook-faq.json.
Формат входа: {"subject/klass/slug": [{"q": "...", "a": "..."}, ...]}"""
import json, os, sys
ROOT = os.path.dirname(os.path.abspath(__file__))
DST = os.path.join(ROOT, '..', '..', 'src/data/textbook-faq.json')
cur = json.load(open(DST))
add = json.load(open(sys.argv[1]))
bad = [k for k, v in add.items() if not v or any(not i.get('a') or len(i['a']) < 40 for i in v)]
if bad:
    sys.exit(f'пустые или слишком короткие ответы: {bad[:5]}')
cur.update(add)
json.dump(cur, open(DST, 'w'), ensure_ascii=False, indent=1)
print(f'+{len(add)} страниц, всего {len(cur)}, вопросов {sum(len(v) for v in cur.values())}')
