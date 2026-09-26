#!/usr/bin/env python3
"""Собирает данные раздела «ЕГЭ и ОГЭ» из материалов ФИПИ (raw/fipi_index.json + raw/files/).

Выход:
  src/data/exam/index.json         — предметы + документы (метаданные, сводка по спецификации; без текста)
  src/data/exam/texts/{docId}.json — текст документа абзацами (лениво читается сайтом)
  public/fipi/{exam}/{kind}/{year}/{slug}.pdf — копии PDF/MP3 (gitignored, уезжают rsync'ом public/)

Документ = экзамен × предмет × вид × год (× уровень для математики ЕГЭ).
Виды: demo (демоверсия), spec (спецификация), codif (кодификатор), variant (открытый вариант КИМ),
mr (методические рекомендации по итогам года), nav-rec (рекомендации по самоподготовке),
nav-topic (навигатор: тема), criteria (материалы для предметных комиссий), doc (нормативные документы),
sochinenie (итоговое сочинение), sobesedovanie (итоговое собеседование), izmeneniya (изменения КИМ).
"""
import json, os, re, shutil, subprocess, sys, hashlib
from fetch_fipi import subj_from_title
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
RAW = os.path.join(HERE, 'raw')
OUT = os.path.join(ROOT, 'src', 'data', 'exam')
PUB = os.path.join(ROOT, 'public', 'fipi')

# slug ФИПИ → (название, дательный «по …», иконка, slug ЕГЭ на сайте, slug ОГЭ на сайте)
SUBJECTS = {
    'russkiy-yazyk':      ('Русский язык', 'русскому языку', '📝'),
    'matematika':         ('Математика', 'математике', '📐'),
    'fizika':             ('Физика', 'физике', '⚛️'),
    'khimiya':            ('Химия', 'химии', '🧪'),
    'informatika':        ('Информатика', 'информатике', '💻'),
    'biologiya':          ('Биология', 'биологии', '🧬'),
    'istoriya':           ('История', 'истории', '🏛️'),
    'geografiya':         ('География', 'географии', '🌍'),
    'obshchestvoznanie':  ('Обществознание', 'обществознанию', '⚖️'),
    'literatura':         ('Литература', 'литературе', '📚'),
    'angliiskiy-yazyk':   ('Английский язык', 'английскому языку', '🇬🇧'),
    'nemetskiy-yazyk':    ('Немецкий язык', 'немецкому языку', '🇩🇪'),
    'frantsuzskiy-yazyk': ('Французский язык', 'французскому языку', '🇫🇷'),
    'ispanskiy-yazyk':    ('Испанский язык', 'испанскому языку', '🇪🇸'),
    'kitayskiy-yazyk':    ('Китайский язык', 'китайскому языку', '🇨🇳'),
    'inostrannye-yazyki': ('Иностранные языки', 'иностранным языкам', '🌐'),
}
ORDER = ['matematika', 'russkiy-yazyk', 'obshchestvoznanie', 'fizika', 'biologiya', 'istoriya', 'informatika', 'khimiya',
         'angliiskiy-yazyk', 'literatura', 'geografiya', 'nemetskiy-yazyk', 'frantsuzskiy-yazyk', 'ispanskiy-yazyk', 'kitayskiy-yazyk', 'inostrannye-yazyki']

TRANSLIT = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o',
            'п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'c','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'}
def slugify(s):
    s = ''.join(TRANSLIT.get(c, c) for c in s.lower())
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s[:80] or 'doc'

def role_of(path, item):
    """Роль PDF внутри комплекта демоверсии: demo | spec | codif | audio | other; уровень base|prof|None."""
    n = os.path.basename(path); low = n.lower(); folder = os.path.basename(os.path.dirname(path)).lower()
    level = None
    if re.search(r'баз|baz|1-базовая', low + ' ' + folder): level = 'base'
    if re.search(r'проф|prof|2-профильная', low + ' ' + folder): level = 'prof'
    if low.endswith(('.mp3', '.wav')): return 'audio', level
    if re.search(r'демо|demo|dv[_\-]', low): return 'demo', level
    if re.search(r'спец|spec|sp[_\-]', low): return 'spec', level
    if re.search(r'кодиф|kodif|кэс|кт[_\. ]|_kt|kes', low): return 'codif', level
    if re.search(r'ответ|otvet|answer|ключ', low): return 'answers', level
    if re.search(r'изменени|izmen', low): return 'izmeneniya', level
    return 'other', level

def pdf_info(path):
    try:
        out = subprocess.run(['pdfinfo', path], capture_output=True, timeout=60).stdout.decode('utf-8', 'ignore')
    except Exception:
        return 0, 0, 0, 0
    pages = int((re.search(r'Pages:\s+(\d+)', out) or [0, 0])[1] or 0)
    m = re.search(r'Page size:\s+([\d.]+) x ([\d.]+)', out)
    w, h = (float(m.group(1)), float(m.group(2))) if m else (0, 0)
    rot = int((re.search(r'Page rot:\s+(\d+)', out) or [0, 0])[1] or 0)
    if rot in (90, 270): w, h = h, w
    return pages, w, h, rot

NOISE = re.compile(r'^(ПРОЕКТ|КИМ|Бланк|Ответ:|Демонстрационный вариант (ЕГЭ|ОГЭ) \d{4} г\.?|[А-ЯЁ ]+, (9|11) класс\.?|\d+ / \d+|©.*|\d{4} г\.|Единый государственный экзамен по [А-ЯЁ ]+|Основной государственный экзамен по [А-ЯЁ ]+)$')

def run_pdftotext(path, extra=()):
    try:
        return subprocess.run(['pdftotext', '-enc', 'UTF-8', *extra, path, '-'], capture_output=True, timeout=180).stdout.decode('utf-8', 'ignore')
    except Exception:
        return ''

def pdf_text(path):
    """Текст абзацами. Развороты (две логические страницы на листе) режем пополам и читаем слева направо."""
    pages, w, h, rot = pdf_info(path)
    if pages == 0: return []
    if w > h * 1.15:  # разворот
        half = int(w / 2)
        left = run_pdftotext(path, ['-x', '0', '-y', '0', '-W', str(half), '-H', str(int(h))]).split('\f')
        right = run_pdftotext(path, ['-x', str(half), '-y', '0', '-W', str(int(w) - half), '-H', str(int(h))]).split('\f')
        chunks = []
        for i in range(max(len(left), len(right))):
            chunks.append(left[i] if i < len(left) else ''); chunks.append(right[i] if i < len(right) else '')
        out = '\n\n'.join(chunks)
    else:
        out = run_pdftotext(path).replace('\f', '\n\n')
    paras = []
    for block in re.split(r'\n\s*\n', out):
        s = re.sub(r'-\n(?=[а-яё])', '', block)
        s = re.sub(r'\s*\n\s*', ' ', s).strip()
        s = re.sub(r'[ \t]{2,}', ' ', s)
        s = re.sub(r'©\s*\d{4}\s*Федеральная служба по надзору в сфере образования и науки\.?', '', s)
        s = re.sub(r'\s*\b[А-ЯЁ]{3,}(?: [А-ЯЁ]+)?, (?:9|11) класс\.(?: (?:Профильный|Базовый) уровень\.)? \d{1,3} / \d{1,3}\b', '', s)
        s = re.sub(r'\s*\b\d{1,3} / \d{1,3}$', '', s).strip()
        if len(s) < 2 or NOISE.match(s) or re.match(r'^(?:Демонстрационный вариант|Спецификация КИМ|Кодификатор) (?:ЕГЭ|ОГЭ) \d{4} г\.?\s*[А-ЯЁ ,.0-9]*$', s): continue
        paras.append(s)
    return paras

def summary_from_spec(paras):
    """Число заданий, длительность, максимальный первичный балл, блок «Изменения» — из текста спецификации/демоверсии."""
    t = ' '.join(paras)
    s = {}
    m = re.search(r'Всего заданий\s*[–—-]\s*(\d{1,3})', t) or re.search(r'(?:содержащ(?:их|ей|ую)|включающ(?:их|ей|ую)(?: в себя)?) (\d{1,3}) задани', t) or re.search(r'(?:включает|содержит|состоит из) (\d{1,3}) задани', t)
    if m: s['tasks'] = int(m.group(1))
    m = re.search(r'отводится ([^.()]{3,40}?)\s*\((\d{2,3}) мин', t)
    if m: s['duration'] = m.group(1).strip(); s['minutes'] = int(m.group(2))
    m = re.search(r'[Мм]аксимальн\w+ первичн\w+ балл за (?:всю )?(?:выполнение )?(?:всей )?работ\w*\s*[–—-]?\s*(\d{1,3})', t) or re.search(r'за всю работу, равного (\d{1,3})', t)
    if m: s['maxPrimary'] = int(m.group(1))
    m = re.search(r'Изменени[яй] (?:в )?(?:структуры и содержания )?КИМ (?:ЕГЭ|ОГЭ) \d{4} (?:года|г\.) в сравнении с (?:КИМ )?\d{4} (?:года|г\.)\s*(.{20,2500}?)(?=\s©|\sПриложение\b|\s\d{1,2}\.\s[А-ЯЁ][а-яё]+ [а-яё]+ (?:КИМ|экзамен|варианта|заданий)|$)', t)
    if m:
        body = m.group(1).strip()
        body = re.split(r'\s(?:Спецификация КИМ|Обобщённый план|Приложение\b|[А-ЯЁ]{4,}(?: \([а-яё]+\))?, (?:9|11) класс|Часть \d+ статьи|\d{1,2} / \d{1,2}\b)', body)[0]
        parts = [x.strip() for x in re.split(r'\s(?=\d\.\s[А-ЯЁ])', body) if len(x.strip()) > 3]
        if parts: s['changes'] = parts[:8]
    return s

STAT_RX = re.compile(r'(средн\w+ (?:тестов\w+ )?балл|приняли? участие|число участников|участников (?:основного периода )?(?:ЕГЭ|ОГЭ)|не набравш|не преодолев|высокобалльник|81–100|100 баллов|стобалльник|минимальн\w+ балл)', re.I)
def stats_from_mr(paras, year):
    """Ключевые факты о результатах экзамена из методических рекомендаций ФИПИ: средний балл, участники, цитаты."""
    head = paras[:max(12, len(paras) // 3)]
    text = ' '.join(head)
    sents = [x.strip() for x in re.split(r'(?<!\bг)(?<!\bгг)(?<!тыс)(?<!ср)(?<!рис)(?<!табл)(?<=[.;])\s+(?=[А-ЯЁ–])', text)]
    ok = lambda x: STAT_RX.search(x) and 40 < len(x) < 600 and 'МЕТОДИЧЕСКИЕ РЕКОМЕНДАЦИИ' not in x and not x.startswith('Таблица')
    ex = [x for x in sents if ok(x) and str(year) in x][:6]
    if not ex: ex = [x for x in sents if ok(x)][:5]
    st = {}
    m = re.search(r'[Сс]редн\w+ (?:тестов\w+ )?балл.{0,140}?(\d{2}[,.]\d{1,2})', text)
    if m: st['avg'] = float(m.group(1).replace(',', '.'))
    m = re.search(r'(?:приняли? участие|число участников|участников)[^%]{0,140}?(?:более |около |свыше )?(\d{1,3}(?:[  ]\d{3})+|\d{1,3}(?:[,.]\d)?\s*тыс\.?|\d{3,6})\s*(?:человек|участник)', text)
    if m: st['participants'] = m.group(1).replace('\u00a0', ' ')
    m = re.search(r'(?:не набравш\w+|не преодолевш\w+)[^%]{0,160}?(\d{1,2}[,.]\d{1,2})\s*%', text)
    if m: st['belowMin'] = m.group(1).replace('.', ',')
    if ex: st['excerpt'] = ex
    return st

SCALE_SUBJ = {'РУССКИЙ ЯЗЫК': 'russkiy-yazyk', 'МАТЕМАТИКА': 'matematika', 'ФИЗИКА': 'fizika', 'ХИМИЯ': 'khimiya', 'БИОЛОГИЯ': 'biologiya',
              'ГЕОГРАФИЯ': 'geografiya', 'ОБЩЕСТВОЗНАНИЕ': 'obshchestvoznanie', 'ИСТОРИЯ': 'istoriya', 'ЛИТЕРАТУРА': 'literatura',
              'ИНФОРМАТИКА': 'informatika', 'ИНОСТРАННЫЙ ЯЗЫК': 'inostrannye-yazyki'}
def scale_from_letter(path):
    """Шкала перевода первичных баллов ОГЭ в отметки — из письма Рособрнадзора (рекомендации по переводу).
    Берём первый блок (ОГЭ; дальше в письме идут ГВЭ). Диапазоны сортируем по началу: «2», «3», «4», «5»."""
    t = run_pdftotext(path, ['-layout']).replace('\f', '\n')
    secs = re.split(r'\n\s*(\d{1,2})\.\s+([А-ЯЁ][А-ЯЁ ]+(?:\([^)]*\))?)\s*\n', t)
    out = []; seen = set(); i = 1
    while i + 2 < len(secs):
        name, body = secs[i + 1].strip(), secs[i + 2]; i += 3
        key = next((v for k, v in SCALE_SUBJ.items() if name.startswith(k)), None)
        if not key or key in seen: continue
        mx = re.search(r'работы,?\s*[–-]\s*(\d+)\s*балл', body)
        tb = (body.split('Таблица', 1)[1] if 'Таблица' in body else body)[:1500]
        ranges = sorted({(int(a), int(b)) for a, b in re.findall(r'(\d{1,3})\s*[–-]\s*(\d{1,3})', tb) if int(a) <= int(b) <= 120})
        prof = re.search(r'профильные классы[^.]{0,200}?[–-]\s*(\d+)\s*балл', body)
        if len(ranges) != 4 or not mx: continue
        seen.add(key)
        out.append({'subject': key, 'name': name.title().replace('Язык', 'язык'), 'max': int(mx.group(1)),
                    'marks': {'2': list(ranges[0]), '3': list(ranges[1]), '4': list(ranges[2]), '5': list(ranges[3])},
                    'profile': int(prof.group(1)) if prof else None})
    return out

def main():
    items = json.load(open(os.path.join(RAW, 'fipi_index.json')))
    os.makedirs(os.path.join(OUT, 'texts'), exist_ok=True); os.makedirs(PUB, exist_ok=True)
    docs = {}
    def doc(exam, subject, kind, year, level=None, title=None, slug_extra=None):
        key = '-'.join(filter(None, [exam, kind, subject or 'obshchie', str(year or 'na'), level, slug_extra]))
        if key not in docs:
            docs[key] = {'id': key, 'exam': exam, 'subject': subject, 'kind': kind, 'year': year, 'level': level, 'title': title, 'files': [], 'source': None}
        return docs[key]

    def add_file(d, src, label, role='main', item=None):
        ext = os.path.splitext(src)[1].lower()
        slug = slugify(os.path.splitext(os.path.basename(src))[0])
        dst_dir = os.path.join(PUB, d['exam'], d['kind'], str(d['year'] or 'na'))
        os.makedirs(dst_dir, exist_ok=True)
        dst = os.path.join(dst_dir, f"{slug}{ext}")
        if any(f['url'].endswith(f'/{slug}{ext}') for f in d['files']):
            dst = os.path.join(dst_dir, f"{slug}-{hashlib.md5(src.encode()).hexdigest()[:6]}{ext}")
        if not os.path.exists(dst) or os.path.getsize(dst) != os.path.getsize(src):
            if os.path.exists(dst): os.remove(dst)
            try: os.link(src, dst)  # жёсткая ссылка: без второй копии на диске (rsync шлёт как обычный файл)
            except OSError: shutil.copy2(src, dst)
        f = {'label': label, 'role': role, 'url': '/fipi/' + os.path.relpath(dst, PUB), 'ext': ext[1:], 'size': os.path.getsize(src)}
        if ext == '.pdf':
            f['pages'] = pdf_info(src)[0]
            f['_src'] = src
        d['files'].append(f)
        return f

    for it in items:
        if it.get('error') or not it.get('pdfs') and not it.get('file'): continue
        exam, kind, subject, year, level = it['exam'], it['kind'], it['subject'], it['year'], it.get('level')
        if kind == 'demo':
            subject = subj_from_title(it.get('title') or '') or subject
        srcs = [os.path.join(RAW, p) for p in it.get('pdfs', []) if os.path.exists(os.path.join(RAW, p)) and not re.search(r'/Доп\.? ?файлы', p)]
        # аудио (английский)
        base = os.path.join(RAW, it['file'])
        base_dir = base[:-4] if base.lower().endswith('.zip') else None
        audios = []
        if base_dir and os.path.isdir(base_dir):
            for root, _, fs in os.walk(base_dir):
                audios += [os.path.join(root, f) for f in fs if f.lower().endswith('.mp3')]
        if kind == 'demo' and not subject and re.search(r'04-44|perevod|перевод', it['name'] + ' ' + (it['title'] or ''), re.I) and srcs:
            d = doc(exam, None, 'scale', year, title=it['title'] or f'Рекомендации по переводу первичных баллов {exam.upper()} {year} в отметки')
            for s in srcs:
                add_file(d, s, it['title'] or os.path.splitext(os.path.basename(s))[0])
                sc = scale_from_letter(s)
                if sc: d['scale'] = sc
            continue
        if kind == 'demo':
            if re.search(r'izmen|plan_izmen', it['name'], re.I):
                d = doc(exam, None, 'izmeneniya', year, title=it['title'] or f'Изменения в КИМ {exam.upper()} {year}')
                for s in srcs: add_file(d, s, it['title'] or os.path.basename(s))
                continue
            if not subject:
                continue
            for s in srcs:
                role, lv = role_of(s, it)
                if role == 'other':
                    role = 'demo' if len(srcs) == 1 else 'other'
                d = doc(exam, subject, role if role in ('demo', 'spec', 'codif') else 'demo', year, lv if subject == 'matematika' and exam == 'ege' else None)
                d['source'] = it['url'].replace('http://', 'https://', 1)
                add_file(d, s, os.path.splitext(os.path.basename(s))[0], role)
            for a in audios:
                d = doc(exam, subject, 'demo', year)
                add_file(d, a, os.path.splitext(os.path.basename(a))[0], 'audio')
        elif kind == 'variant':
            if not subject: continue
            d = doc(exam, subject, 'variant', year)
            for s in srcs:
                role, lv = role_of(s, it)
                add_file(d, s, os.path.splitext(os.path.basename(s))[0], role if role in ('answers', 'audio') else 'main')
            for a in audios: add_file(d, a, os.path.splitext(os.path.basename(a))[0], 'audio')
        elif kind == 'mr':
            if not subject: continue
            d = doc(exam, subject, 'mr', year, title=it['title'])
            for s in srcs: add_file(d, s, it['title'] or os.path.splitext(os.path.basename(s))[0])
        elif kind == 'navigator':
            if not subject: continue
            if (it.get('section') or '').startswith('I.') or re.search(r'Рекомендации по самостоятельной', it['title'] or ''):
                d = doc(exam, subject, 'nav-rec', year, title=it['title'])
                for s in srcs: add_file(d, s, it['title'] or os.path.basename(s))
            elif it['title']:
                d = doc(exam, subject, 'nav-topic', year, level if subject == 'matematika' and exam == 'ege' else None, title=it['title'], slug_extra=slugify(it['title'])[:50])
                for s in srcs: add_file(d, s, it['title'])
        elif kind == 'criteria':
            d = doc(exam, subject, 'criteria', year, title=it['title'])
            for s in srcs: add_file(d, s, it['title'] or os.path.splitext(os.path.basename(s))[0])
        elif kind in ('docs', 'sochinenie', 'sobesedovanie'):
            k = {'docs': 'doc'}.get(kind, kind)
            d = doc(exam, None, k, None if k != 'doc' else None, title=None, slug_extra=None)
            d['title'] = {'doc': 'Нормативные документы', 'sochinenie': 'Итоговое сочинение', 'sobesedovanie': 'Итоговое собеседование'}[k]
            for s in srcs: add_file(d, s, it['title'] or os.path.splitext(os.path.basename(s))[0])
            for a in audios: add_file(d, a, os.path.splitext(os.path.basename(a))[0], 'audio')

    # тексты, сводки
    out_docs = []
    cache_path = os.path.join(RAW, 'text_cache.json')
    cache = json.load(open(cache_path)) if os.path.exists(cache_path) else {}
    for key, d in docs.items():
        texts = []; chars = 0
        sig = '|'.join(f"{f['url']}:{f['size']}" for f in d['files'])
        tpath = os.path.join(OUT, 'texts', key + '.json')
        if cache.get(key) == sig and os.path.exists(tpath):
            for f in d['files']: f.pop('_src', None)
            texts = json.load(open(tpath))['texts']
            chars = sum(len(p) for t in texts for p in t['paras'])
        else:
            for f in d['files']:
                src = f.pop('_src', None)
                if not src: continue
                paras = pdf_text(src)
                chars += sum(len(p) for p in paras)
                texts.append({'label': f['label'], 'role': f['role'], 'paras': paras})
            cache[key] = sig
        d['chars'] = chars
        d['pages'] = sum(f.get('pages', 0) for f in d['files'])
        if d['kind'] in ('demo', 'spec'):
            spec = next((t for t in texts if t['role'] == 'spec'), None) or next((t for t in texts if t['role'] == 'demo'), None) or (texts[0] if texts else None)
            if spec: d['summary'] = summary_from_spec(spec['paras'])
        if d['kind'] == 'mr' and texts:
            st = stats_from_mr(texts[0]['paras'], d['year'])
            if st: d['stats'] = st
        d['_texts'] = texts
        if texts:
            json.dump({'id': key, 'texts': texts}, open(os.path.join(OUT, 'texts', key + '.json'), 'w'), ensure_ascii=False)
        d['files'].sort(key=lambda f: ({'demo': 0, 'main': 0, 'spec': 1, 'codif': 2, 'answers': 3, 'audio': 4}.get(f['role'], 5), f['label']))
        out_docs.append(d)

    json.dump(cache, open(cache_path, 'w'))
    # демоверсии берут сводку (заданий/время/баллы/изменения) из спецификации того же года и уровня
    by_key = {(d['exam'], d['subject'], d['kind'], d['year'], d['level']): d for d in out_docs}
    for d in out_docs:
        d.pop('_texts', None)
        if d['kind'] == 'demo':
            sp = by_key.get((d['exam'], d['subject'], 'spec', d['year'], d['level'])) or by_key.get((d['exam'], d['subject'], 'spec', d['year'], None))
            if sp and sp.get('summary'): d['summary'] = {**(d.get('summary') or {}), **sp['summary']}
    subjects = []
    have = {(d['exam'], d['subject']) for d in out_docs if d['subject']}
    for slug in ORDER:
        name, dat, icon = SUBJECTS[slug]
        subjects.append({'slug': slug, 'name': name, 'dat': dat, 'icon': icon,
                         'ege': ('ege', slug) in have, 'oge': ('oge', slug) in have})
    out_docs.sort(key=lambda d: (d['exam'], ORDER.index(d['subject']) if d['subject'] in ORDER else 99, d['kind'], -(d['year'] or 0), d['level'] or ''))
    json.dump({'subjects': subjects, 'docs': out_docs}, open(os.path.join(OUT, 'index.json'), 'w'), ensure_ascii=False, indent=0)
    from collections import Counter
    c = Counter((d['exam'], d['kind']) for d in out_docs)
    print('docs', len(out_docs)); [print(' ', k, v) for k, v in sorted(c.items())]
    print('no text:', sum(1 for d in out_docs if not d['chars']), 'files:', sum(len(d['files']) for d in out_docs))

if __name__ == '__main__':
    main()
