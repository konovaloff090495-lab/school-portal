#!/usr/bin/env python3
"""Exclude internal search without rebuilding or restarting the Next application.
Run as root on the clean host. Keep a rollback copy of both files and validate nginx.
"""
import datetime
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile

CONFIG = Path('/etc/nginx/sites-enabled/proschools-clean').resolve()
ROBOTS = Path('/srv/portfolio/proschools/static/courses/robots.txt').resolve()
MARKER = '# PROSCHOOLS_SEARCH_NOINDEX'


def atomic_write(path, data):
    stat = path.stat()
    fd, name = tempfile.mkstemp(prefix=path.name + '.', dir=path.parent)
    try:
        with os.fdopen(fd, 'w') as stream:
            stream.write(data)
        os.chmod(name, stat.st_mode & 0o7777)
        os.chown(name, stat.st_uid, stat.st_gid)
        os.replace(name, path)
    finally:
        if os.path.exists(name):
            os.unlink(name)


def main():
    original = CONFIG.read_text()
    robots_before = ROBOTS.read_text()
    config = original
    if MARKER not in config:
        upstream = re.search(r'location @proschools_next\s*\{\s*proxy_pass (http://127\.0\.0\.1:\d+);', config)
        if not upstream:
            raise SystemExit('Cannot identify the active Next upstream')
        block = ''' # PROSCHOOLS_SEARCH_NOINDEX: includes every ?q= variant.
 location = /poisk { return 301 /poisk/$is_args$args; }
 location = /poisk/ {
  proxy_pass UPSTREAM;
  include /etc/nginx/snippets/portfolio-proschools-proxy.conf;
  proxy_read_timeout 120s;
  add_header X-Robots-Tag "noindex, follow" always;
  add_header X-Content-Type-Options nosniff always;
  add_header Referrer-Policy strict-origin-when-cross-origin always;
 }
'''.replace('UPSTREAM', upstream.group(1))
        anchor = ' location = /robots.txt {'
        if config.count(anchor) != 1:
            raise SystemExit('Unexpected robots location')
        config = config.replace(anchor, block + anchor, 1)
    robots = re.sub(r'(?im)^Disallow:\s*/poisk/\s*\n', '', robots_before)
    if config == original and robots == robots_before:
        print(json.dumps({'status': 'already-installed'}))
        return
    backup = Path('/var/backups/portfolio') / ('search-indexing-' + datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d-%H%M%S'))
    backup.mkdir(parents=True, exist_ok=False, mode=0o700)
    (backup / 'nginx.conf').write_text(original)
    (backup / 'robots.txt').write_text(robots_before)
    try:
        # Publish noindex first; only then let crawlers fetch it.
        atomic_write(CONFIG, config)
        subprocess.run(['nginx', '-t'], check=True)
        subprocess.run(['systemctl', 'reload', 'nginx'], check=True)
        atomic_write(ROBOTS, robots)
    except BaseException:
        atomic_write(CONFIG, original)
        atomic_write(ROBOTS, robots_before)
        subprocess.run(['nginx', '-t'], check=True)
        subprocess.run(['systemctl', 'reload', 'nginx'], check=True)
        raise
    print(json.dumps({'status': 'installed', 'backup': str(backup), 'robots': str(ROBOTS)}))


if __name__ == '__main__':
    main()
