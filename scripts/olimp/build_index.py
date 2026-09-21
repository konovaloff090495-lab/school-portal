#!/usr/bin/env python3
"""Собирает данные раздела «Олимпиады» из архива ВсОШ (raw/vos_getTasks.json + raw/pdf/).

Выход:
  src/data/olimp/index.json          — метаданные всех работ (без текста)
  src/data/olimp/papers/{id}.json    — текст заданий/решений одной работы (лениво читается сайтом)
  public/olimpiady/pdf/...           — копии PDF (gitignored, уезжают rsync'ом public/ в deploy.sh)

Работа (paper) = предмет × этап × учебный год × группа классов («9 класс», «7-8 классы»).
"""
import json, os, re, shutil, subprocess, sys, hashlib
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
RAW = os.path.join(HERE, 'raw')
OUT = os.path.join(ROOT, 'src', 'data', 'olimp')
PUB = os.path.join(ROOT, 'public', 'olimpiady', 'pdf')
YEARS = {'1': '2025-2026', '2': '2024-2025', '3': '2023-2024', '22': '2026-2027'}
STAGES = {
    '1': ('priglasitelnyj-etap', 'Пригласительный этап', 'пригласительного этапа'),
    '2': ('shkolnyj-etap', 'Школьный этап', 'школьного этапа'),
    '3': ('municipalnyj-etap', 'Муниципальный этап', 'муниципального этапа'),
    '4': ('regionalnyj-etap', 'Региональный этап', 'регионального этапа'),
    '5': ('zaklyuchitelnyj-etap', 'Заключительный этап', 'заключительного этапа'),
}
# psevdo → (slug, название, род. падеж «по …» (дат.), иконка, slug предмета в /uchebnik/ (или список по классам))
SUBJECTS = {
    'math':  ('matematika', 'Математика', 'математике', '🔢'),
    'russ':  ('russkiy-yazyk', 'Русский язык', 'русскому языку', '📝'),
    'engl':  ('angliyskiy-yazyk', 'Английский язык', 'английскому языку', '🇬🇧'),
    'phys':  ('fizika', 'Физика', 'физике', '⚡'),
    'chem':  ('himiya', 'Химия', 'химии', '🧪'),
    'biol':  ('biologiya', 'Биология', 'биологии', '🧬'),
    'hist':  ('istoriya', 'История', 'истории', '🏛️'),
    'soci':  ('obshchestvoznanie', 'Обществознание', 'обществознанию', '⚖️'),
    'geog':  ('geografiya', 'География', 'географии', '🌍'),
    'litr':  ('literatura', 'Литература', 'литературе', '📚'),
    'prog':  ('informatika', 'Информатика', 'информатике', '💻'),
    'econ':  ('ekonomika', 'Экономика', 'экономике', '📈'),
    'law':   ('pravo', 'Право', 'праву', '📜'),
    'astr':  ('astronomiya', 'Астрономия', 'астрономии', '🔭'),
    'ekol':  ('ekologiya', 'Экология', 'экологии', '🌿'),
    'germ':  ('nemeckiy-yazyk', 'Немецкий язык', 'немецкому языку', '🇩🇪'),
    'fren':  ('francuzskiy-yazyk', 'Французский язык', 'французскому языку', '🇫🇷'),
    'span':  ('ispanskiy-yazyk', 'Испанский язык', 'испанскому языку', '🇪🇸'),
    'ital':  ('italyanskiy-yazyk', 'Итальянский язык', 'итальянскому языку', '🇮🇹'),
    'chin':  ('kitayskiy-yazyk', 'Китайский язык', 'китайскому языку', '🇨🇳'),
    'amxk':  ('mhk', 'Искусство (МХК)', 'искусству (МХК)', '🎨'),
    'bshd':  ('obzh', 'ОБЗР (ОБЖ)', 'ОБЗР', '🛡️'),
    'pcul':  ('fizkultura', 'Физическая культура', 'физической культуре', '🏃'),
    'kddit': ('tehnologiya-kddit', 'Технология (КДДиТ)', 'технологии (культура дома, дизайн и технологии)', '🧵'),
    'ttitt': ('tehnologiya-ttitt', 'Технология (ТТиТТ)', 'технологии (техника и техническое творчество)', '🔧'),
    'robo':  ('robototehnika', 'Робототехника', 'робототехнике', '🤖'),
    'secr':  ('informacionnaya-bezopasnost', 'Информационная безопасность', 'информационной безопасности', '🔐'),
    'ai':    ('iskusstvennyy-intellekt', 'Искусственный интеллект', 'искусственному интеллекту', '🧠'),
}

def parse_class(label):
    label = re.sub(r'\s+', ' ', label).strip()
    label = label.replace('19-11', '9-11')
    m = re.match(r'^(\d{1,2})(?:-(\d{1,2}))?\s*класс', label)
    if not m: return None
    a = int(m.group(1)); b = int(m.group(2)) if m.group(2) else a
    if a < 1 or b > 11 or a > b: return None
    fmt = label[m.end():].strip()
    fmt = re.sub(r'^ы?\s*', '', fmt).strip()
    return (a, b, fmt)

def kind_of(group):
    g = group.lower()
    if g.startswith('источник'): return None
    if 'видео' in g or 'разбор' in g: return 'video'
    if g.startswith('задани'): return 'tasks'
    if g.startswith('решени') or g.startswith('ответ') or g.startswith('критери') or 'оценивани' in g: return 'solutions'
    if 'практик' in g: return 'tasks'
    return 'other'

def pdf_text(path):
    try:
        out = subprocess.run(['pdftotext', '-enc', 'UTF-8', path, '-'], capture_output=True, timeout=120).stdout.decode('utf-8', 'ignore')
    except Exception:
        return ''
    out = out.replace('\f', '\n\n')
    # склеиваем переносы строк внутри абзацев, абзацы — по пустой строке
    paras = []
    for block in re.split(r'\n\s*\n', out):
        s = re.sub(r'-\n(?=[а-яё])', '', block)      # пере-\nнос
        s = re.sub(r'\s*\n\s*', ' ', s).strip()
        s = re.sub(r'[ \t]{2,}', ' ', s)
        if len(s) >= 2: paras.append(s)
    return paras

def pdf_pages(path):
    try:
        out = subprocess.run(['pdfinfo', path], capture_output=True, timeout=60).stdout.decode('utf-8', 'ignore')
        m = re.search(r'Pages:\s+(\d+)', out)
        return int(m.group(1)) if m else 0
    except Exception:
        return 0

def main():
    rec = json.load(open(os.path.join(RAW, 'vos_getTasks.json')))['data']
    papers = {}
    for r in rec:
        if r['year'] not in YEARS or r['subject_psevdo'] not in SUBJECTS: continue
        subj = SUBJECTS[r['subject_psevdo']]
        stage = STAGES[r['stage']]
        year = YEARS[r['year']]
        for gname, body in re.findall(r'<div>\s*<span class="name">(.*?)</span>(.*?)</div>', r['tasks'], flags=re.S):
            gname = re.sub(r'<[^>]+>', '', gname).replace('&nbsp;', ' ').strip()
            kind = kind_of(gname)
            if kind is None: continue
            for href, inner in re.findall(r'<a href="([^"]+)"[^>]*>(.*?)</a>', body, flags=re.S):
                c = re.search(r'class="class">(.*?)<', inner, flags=re.S)
                f = re.search(r'class="format">(.*?)<', inner, flags=re.S)
                if not c: continue
                pc = parse_class(c.group(1))
                if not pc: continue
                a, b, extra = pc
                fmt = (f.group(1).strip() if f else '') or extra
                cslug = f'{a}-klass' if a == b else f'{a}-{b}-klass'
                pid = f'{subj[0]}--{stage[0]}-{year}--{cslug}'
                p = papers.setdefault(pid, {
                    'id': pid, 'subject': subj[0], 'subjectName': subj[1], 'subjectDat': subj[2], 'icon': subj[3],
                    'stage': stage[0], 'stageName': stage[1], 'stageGen': stage[2], 'year': year,
                    'yearLabel': year.replace('-', '/'), 'classSlug': cslug,
                    'classLabel': f'{a} класс' if a == b else f'{a}–{b} классы',
                    'classes': list(range(a, b + 1)), 'files': [], 'tasksPages': 0,
                })
                ext = href.rsplit('.', 1)[-1].lower() if '.' in href.rsplit('/', 1)[-1] else ''
                if href.startswith('/upload/') and ext == 'pdf':
                    rel = href.replace('/upload/files/Arhive_tasks/', '')
                    src = os.path.join(RAW, 'pdf', rel)
                    if not os.path.exists(src) or os.path.getsize(src) == 0: continue
                    dst = os.path.join(PUB, rel)
                    os.makedirs(os.path.dirname(dst), exist_ok=True)
                    if not os.path.exists(dst) or os.path.getsize(dst) != os.path.getsize(src):
                        shutil.copyfile(src, dst)
                    p['files'].append({'kind': kind, 'group': gname, 'label': fmt, 'url': '/olimpiady/pdf/' + rel,
                                       'ext': 'pdf', 'size': os.path.getsize(src), 'src': src})
                elif href.startswith('/upload/') and ext in ('mp3', 'mp4', 'zip', '7z', 'docx'):
                    # аудио/архивы не копируем (объём) — ссылка на первоисточник
                    p['files'].append({'kind': kind, 'group': gname, 'label': fmt, 'url': 'https://vos.olimpiada.ru' + href, 'ext': ext, 'size': 0})
                elif href.startswith('http'):
                    p['files'].append({'kind': kind, 'group': gname, 'label': fmt, 'url': href, 'ext': 'link', 'size': 0})
    # текст
    os.makedirs(os.path.join(OUT, 'papers'), exist_ok=True)
    index = []
    for pid, p in sorted(papers.items()):
        pdfs = [f for f in p['files'] if f['ext'] == 'pdf']
        if not pdfs: continue
        tasks_text, sol_text = [], []
        for f in p['files']:
            if f['ext'] != 'pdf': continue
            f['pages'] = pdf_pages(f['src'])
            paras = pdf_text(f['src'])
            if f['kind'] == 'tasks':
                p['tasksPages'] += f['pages']
                tasks_text.append({'label': f['label'], 'group': f['group'], 'paras': paras})
            elif f['kind'] == 'solutions':
                sol_text.append({'label': f['label'], 'group': f['group'], 'paras': paras})
            del f['src']
        p['hasTasks'] = any(f['kind'] == 'tasks' and f['ext'] == 'pdf' for f in p['files'])
        p['hasSolutions'] = any(f['kind'] == 'solutions' and f['ext'] == 'pdf' for f in p['files'])
        p['textChars'] = sum(len(x) for t in tasks_text for x in t['paras'])
        json.dump({'id': pid, 'tasks': tasks_text, 'solutions': sol_text}, open(os.path.join(OUT, 'papers', pid + '.json'), 'w'), ensure_ascii=False)
        index.append(p)
    json.dump({'subjects': [{'slug': v[0], 'name': v[1], 'dat': v[2], 'icon': v[3], 'psevdo': k} for k, v in SUBJECTS.items()],
               'stages': [{'slug': v[0], 'name': v[1], 'gen': v[2], 'order': int(k)} for k, v in STAGES.items()],
               'papers': index}, open(os.path.join(OUT, 'index.json'), 'w'), ensure_ascii=False)
    print('papers', len(index), 'pdf', sum(1 for p in index for f in p['files'] if f['ext'] == 'pdf'),
          'with tasks', sum(p['hasTasks'] for p in index), 'with solutions', sum(p['hasSolutions'] for p in index),
          'no text', sum(1 for p in index if p['textChars'] < 200))

if __name__ == '__main__':
    main()
