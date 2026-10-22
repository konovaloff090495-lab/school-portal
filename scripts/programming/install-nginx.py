"""Install only the reviewed programming routes; retain native fallback routes."""
from pathlib import Path
from datetime import datetime
import re,subprocess
path=Path('/etc/nginx/sites-available/school-portal');original=path.read_text()
block='''
    # BEGIN PROSCHOOLS_PROGRAMMING
    location ^~ /_programming/ {
        root /var/www/school-portal/programming-current;
        try_files $uri =404;
        add_header X-Content-Type-Options nosniff always;
        add_header Cache-Control "public, max-age=300, must-revalidate" always;
    }
    location = /sitemap.xml {
        root /var/www/school-portal/programming-current;
        try_files $uri @programming_next;
        default_type application/xml;
        add_header Cache-Control "public, max-age=300, must-revalidate" always;
    }
    location ~ ^/shkoly/(?:[^/]+/)*programmirovanie(?:/.*)?$ {
        root /var/www/school-portal/programming-current;
        if ($uri !~ "/$") { return 301 $uri/$is_args$args; }
        try_files $uri/index.html @programming_next;
        add_header X-Robots-Tag $ps_courses_robots always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-Frame-Options SAMEORIGIN always;
        add_header Referrer-Policy strict-origin-when-cross-origin always;
        add_header Cache-Control "public, max-age=300, must-revalidate" always;
    }
    # School detail pages use the shared Next template (including galleries).
    location @programming_next {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Accept-Encoding "";
        sub_filter_once on;
        sub_filter '</body>' '<script defer src="/kursy/assets/navigation.js?v=1"></script></body>';
    }
    # END PROSCHOOLS_PROGRAMMING
'''
text=re.sub(r'\n    # BEGIN PROSCHOOLS_PROGRAMMING.*?# END PROSCHOOLS_PROGRAMMING\n','',original,flags=re.S)
if '# PROSCHOOLS_COURSES_MAP' not in text:raise RuntimeError('Courses prerequisite is missing')
text=text.replace('    location /_next/static/ {',block+'\n    location /_next/static/ {',1)
if text==original:print('Programming routing unchanged');raise SystemExit(0)
backup=path.with_name('school-portal.before-programming-'+datetime.now().strftime('%Y%m%d-%H%M%S'));backup.write_text(original)
path.write_text(text);r=subprocess.run(['nginx','-t'],capture_output=True,text=True)
if r.returncode:path.write_text(original);raise SystemExit(r.stderr)
subprocess.run(['systemctl','reload','nginx'],check=True)
print('Programming routing verified; backup:',backup)
