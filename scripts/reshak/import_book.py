#!/usr/bin/env python3
"""
raw/<name>.json (reshak) → книга в src/data/gdz-books/ БЕЗ решений (condition из reshak,
steps/answer пустые) + ref/<file>.json с текстом ответов reshak для переписывания.

Ключи номеров (URL-safe, уникальные в книге):
  par/12/3       → p12-3     (§ 12, вопрос 3)
  par/10/dop     → p10-dop   (§ 10, доп. задание)
  lab/5          → lab-5     (лабораторный опыт 5)
  pract/2        → pr-2      (практическая работа 2)
  vvedenie-topic1→ t0-1, 3-topic2 → t3-2 (тема для дискуссии)

  python3 import_book.py gabrielyan8 8 khimiya gabrielyan "Габриелян О. С., Остроумов И. Г., Сладков С. А." "2019" "Просвещение"
"""
import json, re, sys
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent))
import gdz_lib  # noqa: E402

SUBJ = {'khimiya': 'Химия', 'istoriya': 'История', 'geografiya': 'География', 'biologiya': 'Биология',
        'obshchestvoznanie': 'Обществознание', 'fizika': 'Физика'}


def to_key(k):
    m = re.match(r'^par/(\d+)/(\d+|dop)$', k)
    if m:
        return f'p{m.group(1)}-{m.group(2)}', ('par', int(m.group(1)))
    m = re.match(r'^lab/(\d+)$', k)
    if m:
        return f'lab-{m.group(1)}', ('lab', 0)
    m = re.match(r'^pract/(\d+)$', k)
    if m:
        return f'pr-{m.group(1)}', ('pract', 0)
    m = re.match(r'^(\w+)-topic(\d+)$', k)
    if m:
        g = m.group(1)
        g = '0' if not g.isdigit() else g
        return f't{g}-{m.group(2)}', ('topic', int(g))
    return re.sub(r'[^a-z0-9]+', '-', k.lower()).strip('-'), ('other', 0)


def main():
    name, klass, subject_slug, slug, authors, years, publisher = sys.argv[1:8]
    klass = int(klass)
    d = json.load(open(HERE / 'raw' / f'{name}.json', encoding='utf-8'))
    chapters = {}
    order = []
    ref = {'book': {'slug': slug, 'klass': klass, 'subjectSlug': subject_slug, 'authors': authors}, 'problems': []}
    seen = set()
    for it in d['items']:
        key, (kind, n) = to_key(it['key'])
        base = key; k2 = 2
        while key in seen:
            key = f'{base}-{k2}'; k2 += 1
        seen.add(key)
        if kind == 'par':
            title = f'§ {n}'
        elif kind == 'lab':
            title = 'Лабораторные опыты'
        elif kind == 'pract':
            title = 'Практические работы'
        elif kind == 'topic':
            title = 'Темы для дискуссии' + (f' (глава {n})' if n else ' (введение)')
        else:
            title = 'Прочее'
        if title not in chapters:
            chapters[title] = {'title': title, 'problems': []}; order.append(title)
        chapters[title]['problems'].append({'number': key, 'condition': it['condition']})
        ref['problems'].append({'number': key, 'chapter': title, 'h1': it['h1'], 'condition': it['condition'],
                                'answer': it['answer'], 'images': it['images']})
    # порядок глав: параграфы по номеру, остальное в конец
    def ch_sort(t):
        m = re.match(r'§ (\d+)', t)
        return (0, int(m.group(1))) if m else (1, t)
    book = {'slug': slug, 'klass': klass, 'subjectSlug': subject_slug, 'subject': SUBJ[subject_slug],
            'authors': authors, 'type': 'Учебник', 'years': years, 'publisher': publisher, 'fgos': True,
            'parts': '', 'umk': '', 'level': '', 'source': f'reshak:{name}',
            'chapters': [chapters[t] for t in sorted(order, key=ch_sort)]}
    gdz_lib.save_book(book)
    (HERE / 'ref').mkdir(exist_ok=True)
    json.dump(ref, open(HERE / 'ref' / gdz_lib.book_file(klass, subject_slug, slug), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    print(f'{name}: {klass} кл {subject_slug}/{slug} — глав {len(book["chapters"])}, номеров {len(ref["problems"])}')


if __name__ == '__main__':
    main()
