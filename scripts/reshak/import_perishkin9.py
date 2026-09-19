# -*- coding: utf-8 -*-
"""Импорт Перышкин 9 (reshak /reshebniki/fizika/9/perishkin/) в 9-fizika-peryshkin.json.
Структура: главы «§ N. Название» с вопросами pN-M, упражнениями uprK-M, заданиями zad-N;
после §26/37/56/67/72 — «Проверь себя. Глава G» (itogiG-M); затем «Лабораторные работы» (lab-N)
и «Задачи для повторения» (povtor-N). Ответы reshak НЕ импортируются (пишутся в батчах),
в problem кладём только condition; reshak-ответ сохраняем в perishkin9/ref.json для сверки."""
import json, re, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from gdz_lib import save_book

RAW = os.path.join(os.path.dirname(__file__), 'raw/perishkin9.json')
IDX = '/private/tmp/claude-501/-Users-dmitriikonovalov-claude/1b98c2be-4079-4c96-8f15-a80b7f565fc4/scratchpad/p9idx.html'
BOOK = os.path.join(os.path.dirname(__file__), '../../src/data/gdz-books/9-fizika-peryshkin.json')

h = open(IDX, encoding='utf-8', errors='ignore').read()
t = re.sub(r'<script.*?</script>|<style.*?</style>', '', h, flags=re.S)
t = re.sub(r'<[^>]+>', ' ', t); t = re.sub(r'\s+', ' ', t)
i = t.find('§1. Материальная'); j = t.find('Лабораторные работы 1 2 3', i)
seq = t[i:j]
# токены: §N(old). Title | Упражнение K(old) | Задание | Проверь себя | Раб.тетрадь | Ответы на вопросы
pars = []  # (N, title, [uprK...], zad?, itogi?)
for m in re.finditer(r'§(\d+)(?:\(\d+\))?\.?\s*(.*?)\s*Ответы на вопросы(.*?)(?=§\d+|$)', seq):
    n = int(m.group(1)); title = m.group(2).strip().rstrip('.')
    tail = m.group(3)
    uprs = [int(x) for x in re.findall(r'Упражнение (\d+)', tail)]
    pars.append(dict(n=n, title=title, uprs=uprs, zad='Задание' in tail, itogi='Проверь себя' in tail))
assert len(pars) == 72, len(pars)

d = json.load(open(RAW)); m = {it['key']: it for it in d['items']}
ref = {}


SENT = re.compile(r'(?<=[?.!])\s+(?=[А-ЯЁA-Z«(])')

def split_k(text, k):
    """Разбить текст вопросов на k вопросов: предложения без «?» приклеиваем к предыдущему,
    затем подгоняем число частей под k."""
    sents = [x.strip() for x in SENT.split(text) if x.strip()]
    parts = []
    for x in sents:
        if parts and not parts[-1].rstrip().endswith('?') and not re.match(r'^\d+\.', x):
            parts[-1] += ' ' + x
        else:
            parts.append(x)
    while len(parts) > k and len(parts) > 1:
        # склеиваем самую короткую часть с соседом
        i = min(range(len(parts)), key=lambda j: len(parts[j]))
        j = i - 1 if i > 0 else i + 1
        a, b = min(i, j), max(i, j)
        parts[a:b + 1] = [parts[a] + ' ' + parts[b]]
    while len(parts) < k:
        i = max(range(len(parts)), key=lambda j: len(parts[j]))
        ss = [x.strip() for x in SENT.split(parts[i]) if x.strip()]
        if len(ss) < 2: break
        h = len(ss) // 2
        parts[i:i + 1] = [' '.join(ss[:h]), ' '.join(ss[h:])]
    return parts

def parse_qa(lines, marker, numbered_first=False):
    """Возвращает список (вопрос, ответ). lines = [condition]+answer."""
    marks = [i for i, a in enumerate(lines) if a.startswith(marker)]
    out = []
    if marks:
        nums = []
        for i in marks:
            mm = re.search(r'(\d+)', lines[i]); nums.append(int(mm.group(1)) if mm else len(nums) + 1)
        k = len(set(nums))
        if lines[0].startswith(marker):
            # формат B: вопрос в первой строке после маркера
            cur = None
            for l in lines:
                if l.startswith(marker):
                    if cur: out.append(cur)
                    cur = ['', []]
                elif cur is not None:
                    if not cur[0] and not l.startswith('-'): cur[0] = l
                    else: cur[1].append(l)
            if cur: out.append(cur)
            return [(q, ' | '.join(a)) for q, a in out]
        pre = lines[:marks[0]]
        if numbered_first:
            tasks = [pre[0]]
            for e in pre[1:]:
                if re.match(r'^[а-яё]\)', e): tasks[-1] += ' ' + e
                else: tasks.append(re.sub(r'^\d+[\s.)]+', '', e))
            if len(tasks) != k: tasks = split_k(' '.join(pre), k) if k else tasks
        else:
            tasks = split_k(' '.join(pre), k)
        # ответы по номерам
        answers = {}
        cur = None
        for i, l in enumerate(lines):
            if l.startswith(marker):
                mm = re.search(r'(\d+)', l); cur = int(mm.group(1)) if mm else None
                answers.setdefault(cur, [])
                rest = re.sub(r'^' + re.escape(marker) + r'\s*\d*\.?', '', l).strip()
                if rest: answers[cur].append(rest)
            elif cur is not None and i > marks[0]:
                answers[cur].append(l)
        order = sorted(answers)
        for ti, tx in enumerate(tasks, 1):
            out.append((tx, ' | '.join(answers.get(order[ti - 1] if ti - 1 < len(order) else -1, []))))
        return out
    # формат C: «1. вопрос» + строки ответа
    cur = None; nxt = 1
    for l in lines:
        mm = re.match(r'^(\d+)\.\s', l.strip())
        if (mm and int(mm.group(1)) == nxt) or (cur is None):
            if cur: out.append(cur)
            cur = [re.sub(r'^\d+\.\s*', '', l.strip()), []]
            nxt = (int(mm.group(1)) if mm else 1) + 1
        else:
            cur[1].append(l)
    if cur: out.append(cur)
    return [(q, ' | '.join(a)) for q, a in out]

problems_by_chapter = []
glava = 0
mism = []
for p in pars:
    n = p['n']; probs = []
    it = m.get(f'new/paragraph/{n}')
    if it:
        qa = parse_qa([it['condition']] + it['answer'], '• Вопрос')
        if len(qa) == 1 and n == 62:
            qa = [(q, qa[0][1]) for q in split_k(qa[0][0], 3)]
        for qi, (q, a) in enumerate(qa, 1):
            key = f'p{n}-{qi}'
            probs.append(dict(number=key, condition=q.strip() or f'Вопрос {qi} к § {n}', steps=[], answer=''))
            ref[key] = a or 'IMG ' + ' '.join(it['images'])
        if len(qa) < 2: mism.append(('par', n, len(qa)))
    for u in p['uprs']:
        it = m.get(f'new/Upr/{u}')
        if not it: continue
        qa = parse_qa([it['condition']] + it['answer'], '• Задача', numbered_first=True)
        for ti, (q, a) in enumerate(qa, 1):
            key = f'upr{u}-{ti}'
            probs.append(dict(number=key, condition=q.strip(), steps=[], answer=''))
            ref[key] = a or 'IMG ' + ' '.join(it['images'])
        if len(qa) < 1: mism.append(('upr', u, len(qa)))
    if p['zad']:
        it = m.get(f'new/zad/{n}')
        if it:
            key = f'zad-{n}'
            probs.append(dict(number=key, condition=it['condition'].strip(), steps=[], answer=''))
            ref[key] = ' | '.join(it['answer'])
    problems_by_chapter.append(dict(title=f'§ {n}. {p["title"]}', problems=probs))
    if p['itogi']:
        glava += 1
        it = m.get(f'new/itogi/{n}')
        if it:
            lines = [it['condition']] + it['answer']
            qs = []
            for l in lines:
                if re.match(r'^\d+\.', l.strip()): qs.append(l.strip())
                elif qs: qs[-1] += ' ' + l.strip()
            probs = []
            for qi, q in enumerate(qs, 1):
                key = f'itogi{glava}-{qi}'
                probs.append(dict(number=key, condition=re.sub(r'^\d+\.\s*', '', q), steps=[], answer=''))
                ref[key] = 'IMG ' + ' '.join(it['images'])
            problems_by_chapter.append(dict(title=f'Проверь себя. Глава {glava}', problems=probs))

labs = []
for n in range(1, 10):
    it = m.get(f'lab/{n}')
    if not it: continue
    title = it['answer'][0] if it['answer'] else ''
    key = f'lab-{n}'
    labs.append(dict(number=key, condition=f'Лабораторная работа № {n}. {title}'.strip(), steps=[], answer=''))
    ref[key] = ' | '.join(it['answer'][1:])
problems_by_chapter.append(dict(title='Лабораторные работы', problems=labs))
pov = []
for n in range(1, 57):
    it = m.get(f'new/povtor/{n}')
    if not it: continue
    key = f'povtor-{n}'
    cond = it['condition'].strip()
    # у некоторых задач продолжение условия лежит в answer (а) б) …) при пустом ответе
    if it['answer'] and all(re.match(r'^[а-яё]\)', a) for a in it['answer']):
        cond += ' ' + ' '.join(it['answer'])
        ref[key] = 'IMG ' + ' '.join(it['images'])
    else:
        ref[key] = (' | '.join(it['answer']) or 'IMG ' + ' '.join(it['images']))
    pov.append(dict(number=key, condition=cond, steps=[], answer=''))
problems_by_chapter.append(dict(title='Задачи для повторения', problems=pov))

book = json.load(open(BOOK))
book['chapters'] = problems_by_chapter
book['authors'] = 'Пёрышкин А. В., Гутник Е. М.'
book['years'] = '2019–2023'
book['publisher'] = 'Дрофа'
save_book(book)
json.dump(ref, open(os.path.join(os.path.dirname(__file__), '../perishkin9/ref.json'), 'w'), ensure_ascii=False, indent=0)
tot = sum(len(c['problems']) for c in problems_by_chapter)
print('chapters', len(problems_by_chapter), 'problems', tot)
print('mismatches', len(mism))
for x in mism: print(x)
