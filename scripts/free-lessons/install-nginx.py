#!/usr/bin/env python3
"""Install the standalone catalogue location, preserving all other nginx routes."""
from pathlib import Path
import subprocess,datetime
p=Path('/etc/nginx/sites-available/school-portal');old=p.read_text();new=old
marker='# PROSCHOOLS_FREE_LESSONS'
block='    # PROSCHOOLS_FREE_LESSONS: atomic static release, existing API handles leads.\n    location = /besplatnye-uroki { return 301 /besplatnye-uroki/$is_args$args; }\n    location ^~ /besplatnye-uroki/ {\n        root /var/www/school-portal/free-lessons-current;\n        index index.html;\n        if ($uri ~ "^(/besplatnye-uroki/.*)/index[.]html$") { return 301 $1/$is_args$args; }\n        if ($uri ~ "^(/besplatnye-uroki/[^.]*[^/])$") { return 301 $1/$is_args$args; }\n        try_files $uri $uri/index.html =404;\n        add_header X-Robots-Tag $ps_courses_robots always;\n        add_header X-Content-Type-Options nosniff always;\n        add_header Referrer-Policy strict-origin-when-cross-origin always;\n        add_header Cache-Control "public, max-age=300, must-revalidate" always;\n    }\n'
if marker not in old:
 assert '    location /_next/static/ {' in old
 new=old.replace('    location /_next/static/ {',block+'\n    location /_next/static/ {',1)
if 'location = /besplatnye-uroki/index.html' not in new:
 new=new.replace('    # PROSCHOOLS_FREE_LESSONS', '    location = /besplatnye-uroki/index.html { return 301 /besplatnye-uroki/$is_args$args; }\n    # PROSCHOOLS_FREE_LESSONS',1)
backup=p.with_name('school-portal.before-free-lessons-'+datetime.datetime.now().strftime('%Y%m%d-%H%M%S'));backup.write_text(old)
p.write_text(new)
r=subprocess.run(['nginx','-t'],capture_output=True,text=True)
if r.returncode:p.write_text(old);raise SystemExit(r.stderr)
subprocess.run(['systemctl','reload','nginx'],check=True)
print('nginx verified; rollback config:',backup)
