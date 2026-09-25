#!/usr/bin/env python3
"""Кандидаты в FAQ-блок страниц учебника из снимка GSC «страница × запрос».

Зачем: 34 % показов раздела — вопросные запросы, CTR по ним 0,16 %. Клик забирает
избранный ответ и блок «Вопросы по теме». Лечится блоком «Частые вопросы» с прямым
ответом и разметкой FAQPage.

Использование:
  python3 scripts/seo/build_faq.py [минимум_показов] [макс_страниц]
Пишет scripts/seo/faq-candidates.json: [{key, url, title, subject, klass, slug,
impressions, clicks, questions:[{q, impressions, clicks, position}]}]
"""
import json, os, re, sys, collections

ROOT = os.path.dirname(os.path.abspath(__file__))
MIN_IMPR = int(sys.argv[1]) if len(sys.argv) > 1 else 40
MAX_PAGES = int(sys.argv[2]) if len(sys.argv) > 2 else 400

snaps = sorted(os.listdir(os.path.join(ROOT, 'gsc-data')))
snap = os.path.join(ROOT, 'gsc-data', snaps[-1], 'page_query_uchebnik.json')
rows = json.load(open(snap))['rows']

QSTART = ('что ', 'как ', 'какие', 'какой', 'какая', 'какое', 'каким', 'каков', 'почему',
          'зачем', 'сколько', 'чем ', 'кто ', 'где ', 'когда ', 'приведите', 'объясните',
          'назовите', 'перечислите', 'укажите', 'опишите', 'выберите', 'определите',
          'сравните', 'докажите', 'в чем', 'в чём', 'чему ', 'для чего', 'можно ли',
          'верно ли', 'нужно ли')

def is_question(q: str) -> bool:
    q = q.strip().lower()
    if len(q.split()) < 2:
        return False
    return q.startswith(QSTART) or q.endswith(' это') or '?' in q

def norm(q: str) -> str:
    """Схлопывает морфологические варианты одного вопроса."""
    q = q.lower().replace('ё', 'е')
    q = re.sub(r'[^а-яa-z0-9 ]', ' ', q)
    w = [x for x in q.split() if len(x) > 2]
    return ' '.join(sorted(x[:5] for x in w))

# слаг → заголовок темы
ts = open(os.path.join(ROOT, '..', '..', 'src', 'data', 'textbook.ts'), encoding='utf-8').read()
slug2title = {}
for m in re.finditer(r"\{\s*slug:\s*'([^']+)',\s*title:\s*'((?:[^'\\]|\\.)*)'", ts):
    slug2title.setdefault(m.group(1), m.group(2).replace("\\'", "'"))

pages = collections.defaultdict(lambda: {'impressions': 0, 'clicks': 0, 'q': {}})
for page, query, clicks, impr, ctr, pos in rows:
    m = re.search(r'/uchebnik/([^/]+)/(\d+)-klass/([^/]+)/', page)
    if not m:
        continue
    p = pages[page]
    p['impressions'] += impr
    p['clicks'] += clicks
    p['meta'] = (m.group(1), int(m.group(2)), m.group(3))
    if not is_question(query):
        continue
    k = norm(query)
    cur = p['q'].get(k)
    # из морфологических вариантов держим самый показываемый
    if not cur or impr > cur['impressions']:
        p['q'][k] = {'q': query, 'impressions': impr, 'clicks': clicks, 'position': round(pos, 1)}
    elif cur:
        cur['impressions'] += 0  # показы вариантов не складываем: это разные строки выдачи

out = []
for url, p in pages.items():
    qs = [q for q in p['q'].values() if q['impressions'] >= MIN_IMPR]
    if not qs:
        continue
    qs.sort(key=lambda x: -x['impressions'])
    subject, klass, slug = p['meta']
    out.append({
        'key': f'{subject}/{klass}/{slug}',
        'url': url,
        'title': slug2title.get(slug, slug),
        'subject': subject, 'klass': klass, 'slug': slug,
        'impressions': p['impressions'], 'clicks': p['clicks'],
        'q_impressions': sum(q['impressions'] for q in qs),
        'questions': qs[:6],
    })

out.sort(key=lambda x: -x['q_impressions'])
out = out[:MAX_PAGES]
dst = os.path.join(ROOT, 'faq-candidates.json')
json.dump(out, open(dst, 'w'), ensure_ascii=False, indent=1)
print(f'{dst}: страниц {len(out)}, вопросов {sum(len(x["questions"]) for x in out)}, '
      f'показов по вопросам {sum(x["q_impressions"] for x in out)}, снимок {snaps[-1]}')
