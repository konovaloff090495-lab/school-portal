#!/usr/bin/env python3
"""
Импорт книги Skysmart (raw/books/{id}.json + raw/tasks/{id}/*.json) в наше
хранилище src/data/gdz-books/ — СТРУКТУРА без решений (condition/steps/answer
пустые, книга не светится на сайте, пока solvedCount == 0).

Параллельно пишет эталон для переписывания: ref/{наш файл книги}.json —
по каждому номеру: глава, страница, шаги Skysmart и ответ (plain text).
По нему в сессии Claude Code пишутся свои condition (описание задания),
steps и answer → gdz_lib.set_solutions(...).

  python3 import_book.py 93          # одна книга
  python3 import_book.py --all       # все скачанные книги
"""
import json, re, sys, html
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent))
import gdz_lib  # noqa: E402

RAW = HERE / 'raw'
REF = HERE / 'ref'

SUBJECT_MAP = {
    'Английский': ('angliiskiy-yazyk', 'Английский язык'),
    'Русский язык': ('russkiy-yazyk', 'Русский язык'),
    'Математика': ('matematika', 'Математика'),
    'Алгебра': ('algebra', 'Алгебра'),
    'Геометрия': ('geometriya', 'Геометрия'),
    'Литература': ('literatura', 'Литература'),
}

TR = {'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i',
      'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
      'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y',
      'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'}


def translit(s):
    s = ''.join(TR.get(c, c) for c in s.lower())
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s


def strip_html(s):
    if not s:
        return ''
    s = re.sub(r'<(br|/p|/li|/div|/tr)\s*/?>', '\n', s)
    s = re.sub(r'<[^>]+>', '', s)
    s = html.unescape(s)
    s = re.sub(r'[ \t]+', ' ', s)
    s = re.sub(r'\n\s*\n+', '\n', s)
    return s.strip()


def norm_num(num):
    """Номер задачи → фрагмент URL: латиница/цифры/дефис (в Spotlight бывают
    номера вроде «Portfolio», «Spotlight on the UK», в русских книгах — «1а»)."""
    n = translit(num.strip())
    n = re.sub(r'-+', '-', n).strip('-')
    return n or 'x'


def make_slug(b, existing):
    base = translit(b['transliteration'])
    t = b['type']['name']
    if t and t != 'Учебник':
        base += '-' + translit(t)
    if b.get('partName'):
        base += '-' + translit(b['partName'])
    slug = base
    if slug in existing:
        slug = base + '-' + translit(b.get('cleanName') or b['publicationYear'])
    n = 2
    while slug in existing:
        slug = f'{base}-{n}'; n += 1
    return slug


def convert(bid):
    b = json.load(open(RAW / 'books' / f'{bid}.json', encoding='utf-8'))
    subj = SUBJECT_MAP.get(b['subject']['name'])
    if not subj:
        print(f'book {bid}: предмет «{b["subject"]["name"]}» не маппится, пропуск'); return None
    subject_slug, subject_name = subj
    klass = b['classNumber']

    # уже импортирована? — ищем по source-id в индексе
    idx = json.load(open(gdz_lib.INDEX, encoding='utf-8')) if gdz_lib.INDEX.exists() else []
    for m in idx:
        if m.get('source') == f'skysmart:{bid}':
            print(f'book {bid}: уже импортирована как {m["file"]}'); return m
    existing = {m['slug'] for m in idx if m['klass'] == klass and m['subjectSlug'] == subject_slug}
    slug = make_slug(b, existing)

    authors = ', '.join(b.get('authors') or [])
    parts = b.get('partName') or ''
    book = {
        'slug': slug, 'klass': klass, 'subjectSlug': subject_slug, 'subject': subject_name,
        'authors': authors, 'type': b['type']['name'] or 'Учебник',
        'years': b.get('publicationYear') or '', 'publisher': b['publisher']['name'] if b['publisher']['name'] != '-' else '',
        'fgos': bool(b.get('isCorrespondFses')), 'parts': parts,
        'umk': b.get('cleanName') or '', 'level': b.get('level') or '',
        'source': f'skysmart:{bid}', 'chapters': [],
    }
    ref = {'book': {k: book[k] for k in ('slug', 'klass', 'subjectSlug', 'authors', 'type', 'umk')}, 'problems': []}
    tdir = RAW / 'tasks' / str(bid)
    # Если номера в книге повторяются (рабочие тетради: «1» на каждой странице),
    # ключом для ВСЕХ номеров становится «num-sСтраница»; иначе — сам номер.
    all_nums = [str(t['num']).strip() for ch in (b.get('chapters') or []) for t in (ch.get('tasks') or [])]
    with_page = len(set(all_nums)) < len(all_nums)
    seen_numbers = set()
    for ch in b.get('chapters') or []:
        chapter = {'title': ch['name'].strip(), 'problems': []}
        for t in ch.get('tasks') or []:
            num = norm_num(str(t['num']))
            key = f'{num}-s{t["pageNum"]}' if with_page else num
            k2 = 2
            base = key
            while key in seen_numbers:
                key = f'{base}-{k2}'; k2 += 1
            seen_numbers.add(key)
            chapter['problems'].append({'number': key, 'page': t.get('pageNum') or 0})
            tp = tdir / f'{t["id"]}.json'
            entry = {'number': key, 'num': num, 'page': t.get('pageNum') or 0, 'chapter': chapter['title'], 'skyId': t['id']}
            if tp.exists():
                d = json.load(open(tp, encoding='utf-8'))
                subs = []
                for st in d.get('subTasks') or []:
                    subs.append({
                        'name': st.get('name') or '',
                        'given': strip_html((st.get('solutionStepGiven') or {}).get('cleanedContent')),
                        'toFind': strip_html((st.get('solutionStepToFind') or {}).get('cleanedContent')),
                        'steps': [strip_html(s.get('cleanedContent')) for s in (st.get('solutionSteps') or [])],
                        'answer': strip_html((st.get('solutionStepAnswer') or {}).get('cleanedContent')),
                    })
                entry['subTasks'] = subs
            ref['problems'].append(entry)
        if chapter['problems']:
            book['chapters'].append(chapter)
    gdz_lib.save_book(book, reindex=False)
    REF.mkdir(exist_ok=True)
    json.dump(ref, open(REF / gdz_lib.book_file(klass, subject_slug, slug), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    print(f'book {bid}: {klass} кл {subject_slug}/{slug} — глав {len(book["chapters"])}, номеров {len(ref["problems"])}')
    return book


def main():
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    if sys.argv[1] == '--all':
        ids = sorted(int(p.stem) for p in (RAW / 'books').glob('*.json'))
    else:
        ids = [int(x) for x in sys.argv[1:]]
    for bid in ids:
        convert(bid)
    gdz_lib.rebuild_index()


if __name__ == '__main__':
    main()
