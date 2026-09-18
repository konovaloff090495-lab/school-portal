#!/usr/bin/env python3
"""python3 apply.py <klass> <subject_slug> <slug> batches/x.json"""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
import gdz_lib
klass, subj, slug, batch = int(sys.argv[1]), sys.argv[2], sys.argv[3], sys.argv[4]
sols = json.load(open(batch, encoding='utf-8'))
gdz_lib.set_solutions(klass, subj, slug, sols)
