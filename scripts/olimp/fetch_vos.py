#!/usr/bin/env python3
"""Скачивает PDF ВсОШ из архива vos.olimpiada.ru (API /api/getTasks) в raw/pdf/.
Берём учебные годы 2023/24, 2024/25, 2025/26, 2026/27 (year id 3,2,1,22).
Повторный запуск докачивает только отсутствующие файлы."""
import json, re, os, sys, time, urllib.request, concurrent.futures as cf
HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'raw')
YEARS = {'1','2','3','22'}
rec = json.load(open(os.path.join(RAW, 'vos_getTasks.json')))['data']
urls = []
for r in rec:
    if r['year'] not in YEARS: continue
    for u in re.findall(r'href="([^"]+)"', r['tasks']):
        if u.lower().endswith('.pdf') and u.startswith('/upload/'):
            urls.append(u)
urls = sorted(set(urls))
def dl(u):
    dst = os.path.join(RAW, 'pdf', u.replace('/upload/files/Arhive_tasks/', ''))
    if os.path.exists(dst) and os.path.getsize(dst) > 0: return 'skip'
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    for attempt in range(3):
        try:
            req = urllib.request.Request('https://vos.olimpiada.ru' + urllib.parse.quote(u), headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=90) as resp, open(dst + '.part', 'wb') as f:
                f.write(resp.read())
            os.rename(dst + '.part', dst)
            return 'ok'
        except Exception as e:
            err = e; time.sleep(3)
    return f'ERR {u} {err}'
import urllib.parse
print('total', len(urls), flush=True)
done = 0
with cf.ThreadPoolExecutor(4) as ex:
    for res in ex.map(dl, urls):
        done += 1
        if res.startswith('ERR'): print(res, flush=True)
        if done % 200 == 0: print(done, flush=True)
print('DONE', flush=True)
