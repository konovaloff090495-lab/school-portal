#!/usr/bin/env python3
"""Применяет переименования тем учебника из rewrite_*.json к src/data/textbook.ts.
Формат: {"/uchebnik/<subject>/<k>-klass/<slug>/": ["новый title", "новый excerpt"]}.
Ищет строку { slug: '<slug>', title: '...', excerpt: '...' } внутри блока предмета и класса."""
import json, re, sys, glob, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TS = os.path.join(ROOT, 'src/data/textbook.ts')
src = open(TS, encoding='utf-8').read().split('\n')
files = sys.argv[1:] or sorted(glob.glob(os.path.join(ROOT, 'scripts/seo/gsc-data/*/rewrite_*.json')))
M = {}
for f in files: M.update(json.load(open(f, encoding='utf-8')))
def esc(s): return s.replace('\\', '\\\\').replace("'", "\\'")
cur_subj = cur_k = None; done = set(); changed = 0
for i, line in enumerate(src):
    m = re.match(r"\s*'?([a-z-]+)'?:\s*\{\s*$", line)
    if m: cur_subj = m.group(1)
    m = re.match(r"\s*(\d+):\s*\[\s*$", line)
    if m: cur_k = int(m.group(1))
    m = re.match(r"(\s*\{\s*slug:\s*')([^']+)(',\s*title:\s*')((?:[^'\\]|\\.)*)(',\s*excerpt:\s*')((?:[^'\\]|\\.)*)('.*)$", line)
    if not (m and cur_subj and cur_k): continue
    url = f"/uchebnik/{cur_subj}/{cur_k}-klass/{m.group(2)}/"
    if url not in M: continue
    t, e = M[url]
    if len(e) < 110: print('SHORT excerpt', url, len(e), file=sys.stderr)
    src[i] = m.group(1) + m.group(2) + m.group(3) + esc(t) + m.group(5) + esc(e) + m.group(7)
    done.add(url); changed += 1
miss = set(M) - done
for u in sorted(miss): print('MISS', u, file=sys.stderr)
open(TS, 'w', encoding='utf-8').write('\n'.join(src))
print(f'changed {changed}, missing {len(miss)}')
