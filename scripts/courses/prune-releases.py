#!/usr/bin/env python3
"""Bound disk use; only our generated, week-old releases can be removed."""
from pathlib import Path
import re, shutil, time
root=Path('/var/www/school-portal/courses-releases')
current=Path('/var/www/school-portal/courses-current').resolve()
releases=sorted([p for p in root.iterdir() if p.is_dir() and not p.is_symlink() and re.fullmatch(r'\d{8}-\d{6}-(?:catalog|refresh)',p.name)],key=lambda p:p.stat().st_mtime,reverse=True)
for path in releases[7:]:
    if path.resolve()!=current and time.time()-path.stat().st_mtime>7*86400:
        shutil.rmtree(path)
