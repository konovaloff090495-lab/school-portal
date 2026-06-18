import json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
JF = ROOT / 'src/data/textbook-articles.json'

def load(): return json.loads(JF.read_text(encoding='utf-8'))
def save(a): JF.write_text(json.dumps(a, ensure_ascii=False, indent=2), encoding='utf-8')
def tl(h): return len(re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',h)).strip())

def dedupe():
    arts = load()
    best = {}
    for a in arts:
        k = (a['subject'], a['klass'], a['topicSlug'])
        if k not in best or tl(a['content']) > tl(best[k]['content']):
            best[k] = a
    out = list(best.values())
    save(out)
    print(f'dedupe: {len(arts)} -> {len(out)} (убрано {len(arts)-len(out)})')

def replace(subject, klass, slug, html, date='2026-06-19'):
    arts = load()
    found = 0
    for a in arts:
        if a['subject']==subject and a['klass']==klass and a['topicSlug']==slug:
            a['content']=html; a['publishedAt']=date; found+=1
    if found==0:
        arts.append({'subject':subject,'klass':klass,'topicSlug':slug,'publishedAt':date,'content':html})
        found=1
    save(arts)
    return found
