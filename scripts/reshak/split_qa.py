#!/usr/bin/env python3
"""Разбивает страницы-параграфы (история/география) на вопросы и ответы.
python3 split_qa.py <raw name> → печатает статистику; с --write пишет raw/<name>_qa.json
формата harvest (items с key p<N>-<i>)."""
import json, re, sys
from pathlib import Path
QWORDS = ('объясните', 'опишите', 'поработайте', 'проверьте', 'составьте', 'подумайте', 'назовите',
          'расскажите', 'сравните', 'докажите', 'пользуясь', 'подготовьте', 'используя', 'какие', 'какой',
          'какую', 'каким', 'что ', 'почему', 'как ', 'когда', 'где ', 'кто ', 'чем ', 'вспомните', 'найдите',
          'перечислите', 'определите', 'выпишите', 'приведите', 'дайте', 'охарактеризуйте', 'укажите',
          'выясните', 'прочитайте', 'рассмотрите', 'обсудите', 'заполните', 'нарисуйте', 'изобразите',
          'сформулируйте', 'узнайте', 'выберите', 'оцените', 'предположите', 'покажите', 'обозначьте',
          'запишите', 'проанализируйте', 'соберите', 'подберите', 'познакомьтесь', 'работаем', 'изучаем',
          'проведите', 'выполните', 'подсчитайте', 'вычислите', 'представьте', 'сделайте', 'установите')
def is_q(t):
    tl = t.lower().strip()
    if len(tl) > 400: return False
    if tl.endswith('?'): return True
    if re.match(r'^\d+[\.\)]\s', tl) and (tl.endswith('.') or tl.endswith(':')) and len(tl) < 260 and any(w in tl for w in QWORDS): return True
    if any(tl.startswith(w) for w in QWORDS) and len(tl) < 260 and not tl.endswith(','): return True
    return False
def is_head(t):
    tl = t.strip()
    return len(tl) < 90 and (tl.startswith('§') or tl.lower().startswith('глава') or tl.lower().startswith('параграф') or tl.lower().startswith('тема') or tl.endswith(':') and len(tl) < 60)
def split(item):
    lines = [item['condition']] + item['answer']
    out, cur, head = [], None, ''
    for t in lines:
        t = t.strip()
        if not t: continue
        if is_head(t):
            head = t
            continue
        if is_q(t):
            if cur: out.append(cur)
            cur = {'q': t, 'a': [], 'head': head}
        elif cur is not None:
            cur['a'].append(t)
    if cur: out.append(cur)
    return [c for c in out if c['a']]
if __name__ == '__main__':
    name = sys.argv[1]
    raw = json.load(open(f'raw/{name}.json', encoding='utf-8'))
    items, tot = [], 0
    for it in raw['items']:
        key = it['key']
        m = re.match(r'^(\d+)$', key)
        pk = f'p{m.group(1)}' if m else re.sub(r'[^a-z0-9]+', '-', key.lower()).strip('-')
        qa = split(it)
        tot += len(qa)
        for i, c in enumerate(qa, 1):
            items.append({'key': f'{pk}-{i}', 'h1': it['h1'], 'condition': c['q'], 'answer': c['a'], 'images': [], 'head': c['head'], 'page': key})
    print(f'{name}: страниц {len(raw["items"])}, вопросов {tot}')
    if '--write' in sys.argv:
        json.dump({'url': raw['url'], 'title': raw['title'], 'items': items}, open(f'raw/{name}_qa.json', 'w', encoding='utf-8'), ensure_ascii=False)
