#!/usr/bin/env python3
"""python3 apply.py <klass> <subjectSlug> <bookSlug> <sols.json>
sols.json: {"number": {"condition": "...", "steps": ["..."], "answer": "..."}, ...}
Строки с \n в steps/answer превращаются в <br>."""
import json, sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parent.parent))
import gdz_lib

def br(s): return s.strip().replace('\n', '<br>')

klass, subj, slug, path = int(sys.argv[1]), sys.argv[2], sys.argv[3], sys.argv[4]
sols = json.load(open(path, encoding='utf-8'))
for n, s in sols.items():
    s['condition'] = br(s['condition']); s['steps'] = [br(x) for x in s['steps']]; s['answer'] = br(s['answer'])
gdz_lib.set_solutions(klass, subj, slug, sols)
