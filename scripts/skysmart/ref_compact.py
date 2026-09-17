#!/usr/bin/env python3
"""python3 ref_compact.py <ref-file> <from> <to> [answer_limit]"""
import json, sys
r = json.load(open(sys.argv[1], encoding='utf-8'))
a, b = int(sys.argv[2]), int(sys.argv[3]); lim = int(sys.argv[4]) if len(sys.argv) > 4 else 900
for i, p in enumerate(r['problems'][a:b], a):
    print(f'### [{i}] {p["number"]} стр.{p["page"]} | {p["chapter"][:70]}')
    for st in p.get('subTasks', []):
        if st['name'] != 'Без подзадания': print('  подзадание:', st['name'])
        print('  задание:', (st['steps'][0][:300] if st['steps'] else '-'))
        # второй шаг часто содержит список слов/предложений задания — показываем коротко
        if len(st['steps']) > 2: print('  контекст:', st['steps'][-2][:300].replace('\n', ' | '))
        print('  ОТВЕТ:', st['answer'][:lim].replace('\n', ' | '))
    print()
