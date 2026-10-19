#!/usr/bin/env python3
"""Idempotent, backed-up installation of the standalone section on the VPS."""
from pathlib import Path
import datetime, subprocess

PATH=Path('/etc/nginx/sites-available/school-portal')
original=PATH.read_text()
stamp=datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
backup=PATH.with_name('school-portal.before-courses-'+stamp)
backup.write_text(original)
text=original
if '# PROSCHOOLS_COURSES_MAP' not in text:
    text='# PROSCHOOLS_COURSES_MAP\nmap $args $ps_courses_robots { default "noindex, follow"; "" ""; }\n\n'+text
block='''
    # PROSCHOOLS_COURSES_STATIC: buildless releases, switched atomically.
    location = /kursy { return 301 /kursy/$is_args$args; }
    location ^~ /kursy/ {
        root /var/www/school-portal/courses-current;
        index index.html;
        if ($uri ~ "^(/kursy/[^.]*[^/])$") { return 301 $1/$is_args$args; }
        try_files $uri $uri/index.html =404;
        add_header X-Robots-Tag $ps_courses_robots always;
        add_header X-Content-Type-Options nosniff always;
        add_header Cache-Control "public, max-age=300, must-revalidate" always;
    }
    location = /robots.txt {
        alias /var/www/school-portal/courses-current/robots.txt;
        default_type text/plain;
        add_header Cache-Control "public, max-age=300, must-revalidate" always;
    }
'''
if '# PROSCHOOLS_COURSES_STATIC' not in text:
    text=text.replace('    location /_next/static/ {',block+'\n    location /_next/static/ {',1)
if '# PROSCHOOLS_COURSES_NAV' not in text:
    text=text.replace('    location / {','''    location / {
        # PROSCHOOLS_COURSES_NAV: compatible with the native header when rebuilt.
        proxy_set_header Accept-Encoding "";
        sub_filter_once on;
        sub_filter '</body>' '<script defer src="/kursy/assets/navigation.js?v=1"></script></body>';
''',1)
if 'proxy_set_header If-None-Match "";' not in text:
    text=text.replace('        proxy_set_header Accept-Encoding "";', '''        proxy_set_header Accept-Encoding "";
        # Prevent an upstream 304 from retaining pre-catalogue HTML in old tabs.
        proxy_set_header If-None-Match "";
        proxy_set_header If-Modified-Since "";
        proxy_hide_header ETag;''',1)
PATH.write_text(text)
check=subprocess.run(['nginx','-t'],capture_output=True,text=True)
if check.returncode:
    PATH.write_text(original)
    raise SystemExit(check.stderr)
subprocess.run(['systemctl','reload','nginx'],check=True)
print('Nginx configuration verified and reloaded; backup:',backup)
