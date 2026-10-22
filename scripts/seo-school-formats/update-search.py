#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Refresh this release's search records without rebuilding unrelated sections."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
file = ROOT / 'public/site-navigation/search-index.js'
prefix = 'window.PRO_SEARCH_INDEX='
source = file.read_text()
items = json.loads(source.removeprefix(prefix).strip().removesuffix(';'))
metadata = json.loads((ROOT / 'src/data/school-format-metadata.json').read_text())
posts = [p for p in json.loads((ROOT / 'content/blog/index.json').read_text()) if p.get('updatedAt') == '2026-10-22']
targets = set(metadata) | {'/blog/' + p['slug'] + '/' for p in posts}
retired = {'/blog/domashee-obuchenie-plyusy-minusy-2026/', '/shkola/ekst-barnaul-7/', '/shkola/ekst-tolyatti-1/'}
def path(url):
    return url.removeprefix('https://pro-schools.ru')
items = [x for x in items if path(x['u']) not in targets | retired]
for url, meta in metadata.items():
    items.append({'t': meta['h1'], 'u': url, 'y': 'page', 's': 'Выбор школы', 'k': meta['description'], 'region': 'moskva' if '/shkoly/moskva/' in url else ''})
for post in posts:
    items.append({'t': post['title'], 'u': '/blog/' + post['slug'] + '/', 'y': 'page', 's': post['category'], 'k': ' '.join(post['tags']) + ' ' + post['excerpt'], 'region': ''})
file.write_text(prefix + json.dumps(items, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c') + ';\n')
print('Search records:', len(items), '; refreshed school pages:', len(metadata), '; articles:', len(posts))
