#!/usr/bin/env python3
"""Печатает пачку страниц из faq-candidates.json с контекстом статьи — под написание ответов.
  python3 scripts/seo/faq_batch.py <номер_пачки> [размер]
Merge готовых ответов:  python3 scripts/seo/faq_merge.py <файл.json>
"""
import json, os, re, sys, html
ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.join(ROOT, '..', '..')
n = int(sys.argv[1]); size = int(sys.argv[2]) if len(sys.argv) > 2 else 25
cand = json.load(open(os.path.join(ROOT, 'faq-candidates.json')))
done = json.load(open(os.path.join(REPO, 'src/data/textbook-faq.json')))
arts = {f"{a['subject']}/{a['klass']}/{a['topicSlug']}": a['content']
        for a in json.load(open(os.path.join(REPO, 'src/data/textbook-articles.json')))}
todo = [c for c in cand if c['key'] not in done]
batch = todo[(n - 1) * size: n * size]
print(f'# пачка {n}: {len(batch)} страниц из {len(todo)} оставшихся (всего {len(cand)})\n')
for c in batch:
    body = arts.get(c['key'], '')
    heads = re.findall(r'<h[23]>(.*?)</h[23]>', body)
    txt = html.unescape(re.sub(r'<[^>]+>', ' ', body))
    txt = ' '.join(txt.split())
    print(f"## {c['key']}")
    print(f"ТЕМА: {c['title']} ({c['subject']}, {c['klass']} кл.)")
    print(f"РАЗДЕЛЫ: {' | '.join(heads[:6])}")
    print(f"ТЕКСТ: {txt[:230]}")
    for q in c['questions']:
        print(f"  ВОПРОС ({q['impressions']} показов, поз {q['position']}): {q['q']}")
    print()
