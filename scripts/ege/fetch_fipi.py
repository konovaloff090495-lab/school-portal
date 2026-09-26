#!/usr/bin/env python3
"""Индекс и загрузка материалов ФИПИ (ЕГЭ/ОГЭ): демоверсии/спецификации/кодификаторы, открытые варианты,
методические рекомендации по итогам года, навигатор подготовки, критерии, итоговое сочинение/собеседование.
Пишет raw/fipi_index.json и качает файлы в raw/files/… (zip распаковывает). Повторный запуск докачивает новое."""
import re, html, json, os, sys, time, zipfile, shutil, urllib.request, urllib.parse

RAW = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'raw')
FILES = os.path.join(RAW, 'files'); os.makedirs(FILES, exist_ok=True)
IDX = os.path.join(RAW, 'fipi_index.json')
UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36'}

SOURCES = [  # (exam, kind, url)
    ('ege', 'demo', 'https://fipi.ru/ege/demoversii-specifikacii-kodifikatory'),
    ('oge', 'demo', 'https://fipi.ru/oge/demoversii-specifikacii-kodifikatory'),
    ('ege', 'variant', 'https://fipi.ru/ege/otkrytyy-bank-zadaniy-ege/otkrytyye-varianty-kim-ege'),
    ('ege', 'mr', 'https://fipi.ru/ege/analiticheskie-i-metodicheskie-materialy'),
    ('ege', 'navigator', 'https://fipi.ru/navigator-podgotovki/navigator-ege'),
    ('oge', 'navigator', 'https://fipi.ru/navigator-podgotovki/navigator-oge'),
    ('ege', 'criteria', 'https://fipi.ru/ege/dlya-predmetnyh-komissiy-subektov-rf'),
    ('oge', 'criteria', 'https://fipi.ru/oge/dlya-predmetnyh-komissiy-subektov-rf'),
    ('ege', 'docs', 'https://fipi.ru/ege/normativno-pravovye-dokumenty'),
    ('oge', 'docs', 'https://fipi.ru/oge/normativno-pravovye-dokumenty'),
    ('ege', 'sochinenie', 'https://fipi.ru/itogovoe-sochinenie'),
    ('oge', 'sobesedovanie', 'https://fipi.ru/itogovoye-sobesedovaniye'),
]
SUBJECTS = {  # заголовок на ФИПИ → slug
    'Русский язык': 'russkiy-yazyk', 'Математика': 'matematika', 'Физика': 'fizika', 'Химия': 'khimiya',
    'Информатика': 'informatika', 'Информатика и ИКТ': 'informatika', 'Биология': 'biologiya', 'История': 'istoriya',
    'География': 'geografiya', 'Обществознание': 'obshchestvoznanie', 'Литература': 'literatura',
    'Английский язык': 'angliiskiy-yazyk', 'Немецкий язык': 'nemetskiy-yazyk', 'Французский язык': 'frantsuzskiy-yazyk',
    'Испанский язык': 'ispanskiy-yazyk', 'Китайский язык': 'kitayskiy-yazyk', 'Иностранные языки': 'inostrannye-yazyki',
    'Иностранный язык': 'inostrannye-yazyki',
}
PREFIX = [  # префикс имени файла → slug (порядок важен: длинные раньше)
    ('inyaz', 'inostrannye-yazyki'), ('kit_yaz', 'kitayskiy-yazyk'), ('angl', 'angliiskiy-yazyk'), ('fran', 'frantsuzskiy-yazyk'),
    ('nem', 'nemetskiy-yazyk'), ('isp', 'ispanskiy-yazyk'), ('kit', 'kitayskiy-yazyk'), ('aya', 'angliiskiy-yazyk'),
    ('nya', 'nemetskiy-yazyk'), ('fya', 'frantsuzskiy-yazyk'), ('iya', 'ispanskiy-yazyk'), ('kya', 'kitayskiy-yazyk'),
    ('rus', 'russkiy-yazyk'), ('ru', 'russkiy-yazyk'), ('matematika', 'matematika'), ('mat', 'matematika'), ('ma', 'matematika'),
    ('fizika', 'fizika'), ('fiz', 'fizika'), ('fi', 'fizika'), ('himiya', 'khimiya'), ('him', 'khimiya'), ('hi', 'khimiya'),
    ('informatika', 'informatika'), ('inf', 'informatika'), ('biologiya', 'biologiya'), ('bio', 'biologiya'), ('bi', 'biologiya'),
    ('istoriya', 'istoriya'), ('ist', 'istoriya'), ('is', 'istoriya'), ('geografiya', 'geografiya'), ('geo', 'geografiya'), ('gg', 'geografiya'),
    ('obshestvoznanie', 'obshchestvoznanie'), ('ob', 'obshchestvoznanie'), ('literatura', 'literatura'), ('lit', 'literatura'), ('li', 'literatura'),
]

def get(url, binary=False, tries=4):
    for a in range(tries):
        try:
            req = urllib.request.Request(urllib.parse.quote(url.replace('http://', 'https://', 1), safe=':/?&=%'), headers=UA)
            with urllib.request.urlopen(req, timeout=120) as r:
                data = r.read()
            return data if binary else data.decode('utf-8', 'ignore')
        except Exception as e:
            if '404' in str(e): print('  404', url, file=sys.stderr); return None
            print('  retry', a, url, e, file=sys.stderr); time.sleep(5 * (a + 1))
    return None

def linearize(s):
    """HTML → поток элементов: ('t', текст) | ('a', url, текст)."""
    s = re.sub(r'<script.*?</script>|<style.*?</style>|<svg.*?</svg>', '', s, flags=re.S)
    out = []
    pos = 0
    for m in re.finditer(r'<a\b[^>]*href="([^"]+)"[^>]*>(.*?)</a>', s, re.S):
        for t in re.split(r'<[^>]+>', s[pos:m.start()]):
            t = html.unescape(re.sub(r'\s+', ' ', t)).strip()
            if t: out.append(('t', t))
        txt = html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', m.group(2)))).strip()
        out.append(('a', m.group(1), re.sub(r'#rec.*', '', txt).strip()))
        pos = m.end()
    for t in re.split(r'<[^>]+>', s[pos:]):
        t = html.unescape(re.sub(r'\s+', ' ', t)).strip()
        if t: out.append(('t', t))
    return out

def subj_from_name(name):
    n = name.lower()
    n = re.sub(r'^(mr|MR)_', '', n)
    for p, slug in PREFIX:
        if re.match(p + r'[_\-\d\.]', n) or n.startswith(p + '_'): return slug
    # подстроки в любом месте имени (mr_oge_russkiy_yazyk_2026, franz_pch_yaz_mr_ege_2026)
    for p, slug in [('russk', 'russkiy-yazyk'), ('rus_', 'russkiy-yazyk'), ('matem', 'matematika'), ('fizik', 'fizika'), ('himi', 'khimiya'),
                    ('inform', 'informatika'), ('biolog', 'biologiya'), ('istor', 'istoriya'), ('geogr', 'geografiya'), ('obsch', 'obshchestvoznanie'),
                    ('obshch', 'obshchestvoznanie'), ('literat', 'literatura'), ('angl', 'angliiskiy-yazyk'), ('nem', 'nemetskiy-yazyk'),
                    ('fran', 'frantsuzskiy-yazyk'), ('isp', 'ispanskiy-yazyk'), ('kit', 'kitayskiy-yazyk')]:
        if p in n: return slug
    return None

TITLE_SUBJ = [('русскому языку', 'russkiy-yazyk'), ('русский язык', 'russkiy-yazyk'), ('математик', 'matematika'), ('физик', 'fizika'), ('хими', 'khimiya'),
              ('информатик', 'informatika'), ('биологи', 'biologiya'), ('истори', 'istoriya'), ('географи', 'geografiya'), ('обществознани', 'obshchestvoznanie'),
              ('литератур', 'literatura'), ('английск', 'angliiskiy-yazyk'), ('немецк', 'nemetskiy-yazyk'), ('французск', 'frantsuzskiy-yazyk'),
              ('испанск', 'ispanskiy-yazyk'), ('китайск', 'kitayskiy-yazyk')]
def subj_from_title(t):
    t = (t or '').lower()
    if 'сочинени' in t and 'русск' not in t: return None
    for p, slug in TITLE_SUBJ:
        if p in t: return slug
    return None

def parse(exam, kind, s):
    items = []; subject = None; year = None; section = None; level = None; last_text = None
    for el in linearize(s):
        if el[0] == 't':
            t = el[1]
            if 8 < len(t) < 220 and not t.startswith('#'): last_text = t
            if t in SUBJECTS: subject = SUBJECTS[t]; level = None; continue
            m = re.search(r'\b(20\d\d)\b', t)
            if m and len(t) < 90: year = int(m.group(1))
            if re.match(r'^(I|II|III|IV)\.', t): section = t
            if t.lower().startswith('базовый уровень'): level = 'base'
            if t.lower().startswith('профильный уровень'): level = 'prof'
            continue
        _, url, text = el
        if 'doc.fipi.ru' not in url and not re.search(r'\.(pdf|zip|docx?)$', url, re.I): continue
        if not re.search(r'\.(pdf|zip|docx?|rar)$', url, re.I): continue
        name = os.path.basename(urllib.parse.unquote(url))
        if 'metodicheskaya-kopilka' in url: continue  # общие ссылки в шапке
        y = re.search(r'/(20\d\d)/', url) or re.search(r'(20\d\d)', name)
        yt = re.search(r'\b(20\d\d)\b', text or '')
        yr = int(y.group(1)) if y else (int(yt.group(1)) if yt else year)
        sub = subj_from_name(name) or (subject if kind in ('navigator', 'demo', 'variant', 'mr', 'criteria') else None)
        if kind == 'demo' and subj_from_title(text): sub = subj_from_title(text)
        if kind in ('criteria', 'navigator', 'mr') and subj_from_title(text): sub = subj_from_title(text)
        if re.search(r'04-44|perevod|izmen|plan_izmen|minimaln', name, re.I): sub = None  # общие документы, не предметные
        title = text if text and text.lower() not in ('скачать', 'ссылка', 'скачать архив') else (last_text if kind in ('docs', 'sochinenie', 'sobesedovanie', 'criteria', 'mr', 'navigator') else None)
        lv = level
        if re.search(r'baz', name, re.I): lv = 'base'
        if re.search(r'prof', name, re.I): lv = 'prof'
        items.append({'exam': exam, 'kind': kind, 'subject': sub, 'year': yr, 'level': lv, 'section': section,
                      'title': title, 'url': url, 'name': name})
    return items

def download(item):
    d = os.path.join(FILES, item['exam'], item['kind'], str(item['year'] or 'na'))
    os.makedirs(d, exist_ok=True)
    path = os.path.join(d, item['name'])
    outdir = path[:-4] if path.lower().endswith('.zip') else None
    if outdir and os.path.isdir(outdir):
        pass  # zip уже распакован и удалён
    elif not os.path.exists(path) or os.path.getsize(path) == 0:
        data = get(item['url'], binary=True)
        if not data: item['error'] = 'download'; return
        open(path, 'wb').write(data); time.sleep(0.5)
    item['file'] = os.path.relpath(path, RAW)
    if outdir:
        if not os.path.isdir(outdir):
            try:
                with zipfile.ZipFile(path) as z:
                    for zi in z.infolist():
                        try: zi.filename = zi.filename.encode('cp437').decode('cp866')
                        except Exception: pass
                        z.extract(zi, outdir)
            except zipfile.BadZipFile:
                item['error'] = 'badzip'; return
            os.remove(path)  # место на диске: zip не нужен после распаковки
            for root, dirs, fs in os.walk(outdir):  # аудио только для английского, доп. файлы информатики не храним (объём)
                for f in fs:
                    if f.lower().endswith(('.mp3', '.wav', '.mp4')) and item['subject'] != 'angliiskiy-yazyk':
                        os.remove(os.path.join(root, f))
                for dd in list(dirs):
                    if dd.lower().startswith(('доп. файлы', 'доп.файлы', 'доп файлы', 'дополнительные')):
                        shutil.rmtree(os.path.join(root, dd)); dirs.remove(dd)
        pdfs = []
        for root, _, fs in os.walk(outdir):
            for f in fs:
                if f.lower().endswith('.pdf'): pdfs.append(os.path.relpath(os.path.join(root, f), RAW))
        item['pdfs'] = sorted(pdfs)
    elif path.lower().endswith('.pdf'):
        item['pdfs'] = [item['file']]

if __name__ == '__main__':
    old = json.load(open(IDX)) if os.path.exists(IDX) else []
    known = {o['url']: o for o in old}
    items = []
    for exam, kind, url in SOURCES:
        s = get(url)
        if not s: print('FAIL', url); continue
        got = parse(exam, kind, s)
        print(exam, kind, len(got), flush=True); items += got; time.sleep(1)
    seen = set(); uniq = []
    for it in items:
        if it['url'] in seen: continue
        seen.add(it['url']); uniq.append(it)
    uniq = [u for u in uniq if not (u['kind'] == 'demo' and (u['year'] or 0) < 2016)]  # старый формат экзамена — не берём
    for i, it in enumerate(uniq):
        if it['url'] in known and known[it['url']].get('pdfs'):
            it.update({k: known[it['url']][k] for k in ('file', 'pdfs') if k in known[it['url']]}); continue
        download(it)
        if i % 20 == 0:
            print(i, len(uniq), flush=True); json.dump(uniq, open(IDX, 'w'), ensure_ascii=False, indent=0)
    json.dump(uniq, open(IDX, 'w'), ensure_ascii=False, indent=0)
    print('DONE', len(uniq), 'no subject:', sum(1 for u in uniq if not u['subject']), 'errors:', sum(1 for u in uniq if u.get('error')))
