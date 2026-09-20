#!/usr/bin/env python3
"""Снимок GSC по pro-schools.ru: страница × запрос за N дней (по умолчанию 28).
Пишет scripts/seo/gsc-data/<дата>/page_query.json — список [page, query, clicks, impressions, ctr, position].
Использует сервисный ключ из ~/claude/seo-tools/gsc.py."""
import sys, os, json, datetime as dt, urllib.parse, time
sys.path.insert(0, os.path.expanduser('~/claude/seo-tools'))
import gsc
days = int(sys.argv[1]) if len(sys.argv) > 1 else 28
prefix = sys.argv[2] if len(sys.argv) > 2 else None   # напр. /uchebnik/
tok = gsc.access_token(); site = gsc.resolve(tok, 'pro-schools')
enc = urllib.parse.quote(site, safe=''); start, end = gsc.date_range(days)
rows = []; sr = 0
while True:
    body = {"startDate": start, "endDate": end, "dimensions": ["page", "query"], "rowLimit": 25000, "startRow": sr}
    if prefix:
        body["dimensionFilterGroups"] = [{"filters": [{"dimension": "page", "operator": "contains", "expression": prefix}]}]
    r = gsc.api(f"sites/{enc}/searchAnalytics/query", tok, body).get('rows', [])
    rows += [[x['keys'][0], x['keys'][1], x['clicks'], x['impressions'], x['ctr'], x['position']] for x in r]
    print(sr, len(r), file=sys.stderr)
    if len(r) < 25000: break
    sr += 25000; time.sleep(0.5)
d = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gsc-data', str(dt.date.today())); os.makedirs(d, exist_ok=True)
name = 'page_query' + (prefix.strip('/').replace('/', '_') and '_' + prefix.strip('/').replace('/', '_') or '') + '.json'
json.dump({"start": start, "end": end, "rows": rows}, open(os.path.join(d, name), 'w'), ensure_ascii=False)
print(os.path.join(d, name), len(rows), start, end)
