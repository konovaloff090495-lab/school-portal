#!/usr/bin/env python3
"""Компактный вывод эталона для переписывания: python3 ref_view.py <ref-file> <from-idx> <to-idx>
Показывает первый шаг (описание задания), остальные шаги обрезанно, ответ целиком."""
import json, sys
r = json.load(open(sys.argv[1], encoding='utf-8'))
a, b = int(sys.argv[2]), int(sys.argv[3])
for i, p in enumerate(r['problems'][a:b], a):
    print(f'### [{i}] number={p["number"]} num={p["num"]} стр.{p["page"]} | {p["chapter"]}')
    for st in p.get('subTasks', []):
        if st['name'] != 'Без подзадания': print(f'  подзадание: {st["name"]}')
        if st['given']: print('  дано:', st['given'][:300])
        for j, s in enumerate(st['steps']):
            lim = 400 if j == 0 else 160
            print(f'  шаг{j+1}: {s[:lim]}{"…" if len(s) > lim else ""}')
        print('  ОТВЕТ:', st['answer'][:1500])
    print()
