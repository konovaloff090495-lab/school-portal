#!/usr/bin/env python3
"""python3 del_probs.py <klass> <subj> <slug> key1 key2 ... — удалить номера из книги."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
import gdz_lib
klass, subj, slug = int(sys.argv[1]), sys.argv[2], sys.argv[3]
keys = set(sys.argv[4:])
b = gdz_lib.load_book(klass, subj, slug)
n = 0
for c in b['chapters']:
    before = len(c['problems'])
    c['problems'] = [p for p in c['problems'] if p['number'] not in keys]
    n += before - len(c['problems'])
gdz_lib.save_book(b)
print('удалено', n)
