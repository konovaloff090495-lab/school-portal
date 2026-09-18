#!/usr/bin/env python3
"""python3 ref_compact.py ref/X.json <from> <to> [answer_limit]"""
import json, sys
ref = json.load(open(sys.argv[1], encoding='utf-8'))
a, b = int(sys.argv[2]), int(sys.argv[3])
lim = int(sys.argv[4]) if len(sys.argv) > 4 else 400
for i, p in enumerate(ref['problems'][a:b], a):
    print(f'### [{i}] {p["number"]} | {p["chapter"]}')
    print('  условие:', p['condition'])
    ans = ' '.join(p['answer'])
    print('  ОТВЕТ:', ans[:lim] if ans else '(картинка)')
    print()
