#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Биология (Пасечник/Колесов) с reshak: raw/<name>.json, где key = номер параграфа,
condition = «§N. Название», answer = строки «M. Вопрос» + ответ. Пересобирает книгу
src/data/gdz-books/<klass>-biologiya-<slug>.json, сохраняя главы старой книги
(старые «задачи» = один параграф с заглушкой). Ключи pN-M (вопросы), pN-zM (задания
второго блока), p0-M — введение. Пишет ../bio/<name>_ref.json с ответами reshak.
python3 import_bio.py <rawname> <klass> <slug> [--write]"""
import json, re, sys
from pathlib import Path
HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent))
import gdz_lib

name, klass, slug = sys.argv[1], int(sys.argv[2]), sys.argv[3]
raw = json.load(open(HERE / 'raw' / f'{name}.json', encoding='utf-8'))
book = gdz_lib.load_book(klass, 'biologiya', slug)
old_chapter = {}
for c in book['chapters']:
    for p in c['problems']:
        old_chapter[p['number']] = c['title']

HEAD = re.compile(r'^(вопросы|задания|подумайте|проверьте себя|выполните|обсудите|практическая работа|задание|моя лаборатория|как работать с|термины|основные понятия|вопросы и задания)[\s!.:]*$', re.I)

def split_item(it):
    lines = [l.strip() for l in it['answer'] if l.strip()]
    qs, cur, expect, section = [], None, 1, 0
    for t in lines:
        m = re.match(r'^(\d+)[\.\)]\s+(.*)$', t)
        if HEAD.match(t):
            section += 1 if qs else 0
            expect = 1
            continue
        if m and int(m.group(1)) == expect and len(m.group(2)) < 500:
            if cur: qs.append(cur)
            cur = dict(q=m.group(2).strip(), a=[], sec=section)
            expect += 1
        elif m and int(m.group(1)) == 1 and expect > 2 and len(m.group(2)) < 400 and (m.group(2).rstrip().endswith('?') or m.group(2).lower().split()[0] in ('что','какие','какой','почему','как','чем','где','когда','назовите','объясните','приведите','сравните','докажите','опишите','расскажите','используя','пользуясь','составьте','подумайте','вспомните','перечислите','дайте','охарактеризуйте','каково','какова','каким','какую','какое','в','с','на','по','из')):
            # новый блок («Задания») без заголовка
            if cur: qs.append(cur)
            section += 1; expect = 2
            cur = dict(q=m.group(2).strip(), a=[], sec=section)
        elif cur is not None:
            cur['a'].append(t)
    if cur: qs.append(cur)
    return qs

chapters, ref, total = {}, {}, 0
order = []
for it in raw['items']:
    if 'тетрад' in it['h1'].lower(): continue
    k = it['key']
    n = 0 if not k.isdigit() else int(k)
    head = re.sub(r'^(§\s*\d+\.)\s*\$\d+\.\s*', r'\1 ', it['condition'].strip()); head = re.sub(r'^§\s*(\d+)\.\s*', r'§ \1. ', head)
    if not head.startswith('§') and n: head = f'§{n}. {head}'
    if n == 0 and not head: head = 'Введение'
    qs = split_item(it)
    ch = head if n else (head if head.lower().startswith('введение') else 'Введение. ' + head)
    def _tc(t):
        m = re.match(r'^(§\s*\d+\.\s*|Введение\.\s*)?(.*)$', t)
        body = m.group(2)
        if body.isupper(): body = body[:1] + body[1:].lower()
        return (m.group(1) or '') + body
    ch = _tc(ch)
    if ch not in chapters:
        chapters[ch] = []; order.append(ch)
    probs = []
    for i, q in enumerate(qs, 1):
        key = f'p{n}-{i}' if q['sec'] == 0 else f'p{n}-z{i}'
        probs.append(dict(number=key, page=None, condition=q['q'], steps=[], answer=''))
        ref[key] = ' | '.join(q['a'])
    chapters[ch].append((head, probs))
    total += len(probs)
    print(f'{k:>4} {len(qs):3} {head[:60]}')
print('total', total)
if '--write' in sys.argv:
    new_ch = []
    for ch in order:
        probs = []
        for head, ps in chapters[ch]:
            probs += ps
        new_ch.append(dict(title=ch, problems=probs))
    # заголовки параграфов кладём в отдельную карту paraTitles (для страниц) — как условие первого вопроса не трогаем
    book['chapters'] = new_ch
    gdz_lib.save_book(book)
    (HERE.parent / 'bio').mkdir(exist_ok=True)
    json.dump(ref, open(HERE.parent / 'bio' / f'{name}_ref.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    print('written')
