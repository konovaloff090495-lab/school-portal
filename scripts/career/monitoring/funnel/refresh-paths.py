#!/usr/bin/env python3
"""Refresh deployable measurement allowlist from canonical career content; no network."""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[4]
pages=json.loads((root/'content/career/pages.json').read_text());pages=pages['pages']if isinstance(pages,dict)else pages
public={p['path']for p in pages if not p.get('noindex')}
private={'/proforientaciya/karta-interesov/','/proforientaciya/rezultat/'}
assert all(p.startswith('/')and p.endswith('/')and'?'not in p and'#'not in p and'..'not in p for p in public|private)
out=root/'scripts/career/service/measurement-paths.json';out.write_text(json.dumps(sorted(public|private),ensure_ascii=False,indent=2)+'\n')
print('Measurement allowlist:',len(public),'public +',len(private),'private')
