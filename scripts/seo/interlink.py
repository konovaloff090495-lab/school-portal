#!/usr/bin/env python3
"""Контекстная перелинковка статей учебника.

Зачем: из 6 354 статей ссылки внутри текста были только в 50. Раздел связан лишь
сайдбаром и prev/next, поэтому вес не перетекает и Google держит страницы на 5–11.
Скрипт проставляет ссылки на другие темы по первому упоминанию их ключевого термина.

Каннибализация лечится тем же движком: если один термин ведёт на несколько страниц
(1 357 страниц с повторяющимися названиями), ссылка всегда идёт на ту, у которой
больше показов в GSC, — сигналы стекаются к одной странице вместо пяти.

  python3 scripts/seo/interlink.py --dry      # отчёт без записи
  python3 scripts/seo/interlink.py --apply    # записать в textbook-articles.json
"""
import json, os, re, sys, collections

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SEO = os.path.join(ROOT, 'scripts', 'seo')
ARTS = os.path.join(ROOT, 'src/data/textbook-articles.json')
MAX_LINKS = 6          # больше — уже спам и размывание веса
MIN_TERM_LEN = 11      # короткие термины («угол», «число») дают ложные совпадения
STOP_TERMS = {
    'кратко о главном', 'разбор примера', 'частые ошибки', 'что нужно знать',
}

def core(title: str) -> str:
    """Ключевой термин темы: часть заголовка до двоеточия, без вопросительного зачина."""
    t = re.split(r'[:—–]', title)[0].strip()
    t = re.sub(r'^(что такое|что значит|как|какие|какая|какой|какое|зачем|почему|чем)\s+', '', t, flags=re.I)
    return t.strip(' .,')

def load_topics():
    s = open(os.path.join(ROOT, 'src/data/textbook.ts'), encoding='utf-8').read()
    out, cs, ck = [], None, None
    for line in s.split('\n'):
        m = re.match(r"\s*'?([a-z-]+)'?:\s*\{\s*$", line)
        if m: cs = m.group(1)
        m = re.match(r"\s*(\d+):\s*\[\s*$", line)
        if m: ck = int(m.group(1))
        m = re.match(r"\s*\{\s*slug:\s*'([^']+)',\s*title:\s*'((?:[^'\\]|\\.)*)'", line)
        if m and cs and ck:
            out.append((cs, ck, m.group(1), m.group(2).replace("\\'", "'")))
    return out

def load_impressions():
    """показы по страницам из свежего снимка GSC — ими выбираем победителя среди дублей"""
    snaps = sorted(os.listdir(os.path.join(SEO, 'gsc-data')))
    for d in reversed(snaps):
        f = os.path.join(SEO, 'gsc-data', d, 'page_query_uchebnik.json')
        if os.path.exists(f):
            imp = collections.Counter()
            for page, q, c, i, ctr, pos in json.load(open(f))['rows']:
                m = re.search(r'/uchebnik/([^/]+)/(\d+)-klass/([^/]+)/', page)
                if m: imp[f'{m.group(1)}/{int(m.group(2))}/{m.group(3)}'] += i
            return imp
    return collections.Counter()

# Обрезка до 5 букв склеивала разные термины: «равнобедренного» и «равностороннего»
# давали один ключ «равно», и статья про Пифагора ссылалась не туда. Поэтому снимаем
# окончание списком, а не длиной, и только потом ограничиваем длину.
ENDINGS = sorted([
    'ого', 'его', 'ому', 'ему', 'ыми', 'ими', 'ами', 'ями', 'ах', 'ях', 'ов', 'ев',
    'ый', 'ий', 'ой', 'ая', 'яя', 'ое', 'ее', 'ые', 'ие', 'ым', 'им', 'ых', 'их',
    'ею', 'ью', 'ья', 'ье', 'ей', 'ой', 'ам', 'ям', 'ом', 'ем', 'у', 'ю', 'а', 'я',
    'о', 'е', 'ы', 'и', 'ь', 'й',
], key=len, reverse=True)

def stem(w: str) -> str:
    for e in ENDINGS:
        if len(w) - len(e) >= 4 and w.endswith(e):
            return w[:-len(e)]
    return w

def stem_key(words) -> str:
    """Ключ, устойчивый к падежам. Прямой перебор 4 884 регулярок по 6 354 статьям
    не укладывался во время — сопоставление идёт по словарю н-грамм."""
    return ' '.join(stem(w) for w in words)

WORD = re.compile(r'[а-яёa-z0-9]+', re.I)

# Ссылки ставим только внутри предмета и между родственными предметами: статья по
# математике, ссылающаяся на «заглавные буквы» из русского языка, — шум, а не связь.
KIN = {
    'matematika': {'matematika', 'algebra', 'geometriya', 'fizika', 'informatika'},
    'algebra': {'algebra', 'matematika', 'geometriya', 'fizika'},
    'geometriya': {'geometriya', 'matematika', 'algebra', 'fizika'},
    'fizika': {'fizika', 'matematika', 'algebra', 'geometriya', 'khimiya', 'geografiya'},
    'khimiya': {'khimiya', 'fizika', 'biologiya', 'matematika'},
    'biologiya': {'biologiya', 'khimiya', 'geografiya', 'okruzhayushchiy-mir'},
    'geografiya': {'geografiya', 'biologiya', 'istoriya', 'okruzhayushchiy-mir', 'fizika'},
    'istoriya': {'istoriya', 'obshchestvoznanie', 'geografiya', 'literatura'},
    'obshchestvoznanie': {'obshchestvoznanie', 'istoriya', 'geografiya'},
    'literatura': {'literatura', 'russkiy-yazyk', 'istoriya'},
    'russkiy-yazyk': {'russkiy-yazyk', 'literatura'},
    'informatika': {'informatika', 'matematika', 'algebra'},
    'angliiskiy-yazyk': {'angliiskiy-yazyk'},
    'okruzhayushchiy-mir': {'okruzhayushchiy-mir', 'biologiya', 'geografiya'},
}

def main():
    apply_ = '--apply' in sys.argv
    topics = load_topics()
    imp = load_impressions()

    # термин -> лучшая страница (по показам GSC, при равенстве — старший класс)
    best = {}
    for subj, k, slug, title in topics:
        t = core(title).lower()
        if len(t) < MIN_TERM_LEN or t in STOP_TERMS or t.count(' ') > 5:
            continue
        key = f'{subj}/{k}/{slug}'
        score = (imp.get(key, 0), k)
        if t not in best or score > best[t][0]:
            best[t] = (score, subj, k, slug, title)
    # словарь: ключ н-граммы -> цель. Длинные термины имеют приоритет над короткими.
    index = {}
    for t, (score, subj, k, slug, title) in best.items():
        ws = WORD.findall(t)
        if len(ws) < 2:
            continue
        index[stem_key(ws)] = (subj, k, slug, title, len(ws))
    maxn = max((v[4] for v in index.values()), default=2)

    arts = json.load(open(ARTS))
    own = {f"{s}/{k}/{sl}": stem_key(WORD.findall(core(ti).lower())) for s, k, sl, ti in topics}

    linked = added = 0
    tag = re.compile(r'<[^>]+>')
    skip_zone = re.compile(r'<(h2|h3|table|code|pre|a)\b.*?</\1>', re.I | re.S)

    for a in arts:
        key = f"{a['subject']}/{a['klass']}/{a['topicSlug']}"
        html = a['content']
        if '<a ' in html:
            continue
        blocked = [(m.start(), m.end()) for m in skip_zone.finditer(html)]
        blocked += [(m.start(), m.end()) for m in tag.finditer(html)]
        blocked.sort()
        def free(i, j):
            return not any(bs < j and i < be for bs, be in blocked)

        toks = [(m.group(0).lower(), m.start(), m.end()) for m in WORD.finditer(html)]
        self_url = f"/uchebnik/{a['subject']}/{a['klass']}-klass/{a['topicSlug']}/"
        used, edits, taken = set(), [], []
        # длинные совпадения важнее: идём от самых длинных н-грамм к коротким
        for n in range(maxn, 1, -1):
            for i in range(len(toks) - n + 1):
                if len(edits) >= MAX_LINKS:
                    break
                k2 = stem_key([toks[i + d][0] for d in range(n)])
                hit = index.get(k2)
                if not hit:
                    continue
                if k2 == own.get(key):
                    continue
                subj, kl, slug, title, _ = hit
                if subj != a['subject']:
                    continue
                # не уводим старшеклассника на страницу начальной школы: «полезные
                # ископаемые» из географии 10 класса не должны вести в «Окружающий мир» 3
                if abs(kl - a['klass']) > 2:
                    continue
                tgt = f'/uchebnik/{subj}/{kl}-klass/{slug}/'
                if tgt in used or tgt == self_url:
                    continue
                s0, e0 = toks[i][1], toks[i + n - 1][2]
                if not free(s0, e0):
                    continue
                # между словами якоря допустимы только пробел и дефис: иначе ссылка
                # перепрыгивает двоеточие, запятую или тег и хватает пол-предложения
                if not re.fullmatch(r'[\s\u00a0а-яёa-z0-9-]+', html[s0:e0], re.I):
                    continue
                if any(not (e0 <= ps or s0 >= pe) for ps, pe in taken):
                    continue
                edits.append((s0, e0, tgt, title))
                taken.append((s0, e0))
                used.add(tgt)
            if len(edits) >= MAX_LINKS:
                break
        if not edits:
            continue
        edits.sort(reverse=True)
        for s0, e0, tgt, title in edits:
            html = html[:s0] + f'<a href="{tgt}">' + html[s0:e0] + '</a>' + html[e0:]
        a['content'] = html
        linked += 1
        added += len(edits)

    print(f'статей со ссылками: {linked} из {len(arts)}; всего ссылок: {added}; '
          f'словарь терминов: {len(index)}')
    if apply_:
        json.dump(arts, open(ARTS, 'w'), ensure_ascii=False, indent=2)
        print('записано в', ARTS)
    else:
        for a in arts[:400]:
            if '<a href="/uchebnik/' in a['content']:
                ls = re.findall(r'<a href="([^"]+)">([^<]+)</a>', a['content'])
                print(f"  {a['subject']}/{a['klass']}/{a['topicSlug']}: " +
                      '; '.join(f'«{txt}» → {u}' for u, txt in ls))

if __name__ == '__main__':
    main()
