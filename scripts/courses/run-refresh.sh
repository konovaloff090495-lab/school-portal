#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
exec 9>work/courses/refresh.lock
flock -n 9 || exit 0
if [[ "${1:-}" == "--browser-input" ]]; then
  .venv/bin/python scripts/courses/refresh-browser.py --input "${2:?Browser snapshot required}" --apply
else
  .venv/bin/python scripts/courses/refresh.py
fi
release="/var/www/school-portal/courses-releases/$(date -u +%Y%m%d-%H%M%S)-refresh"
mkdir -p "$release/kursy"
COURSES_OUTPUT_DIR="$release/kursy" .venv/bin/python scripts/courses/build.py
COURSES_CHECK_DIR="$release/kursy" .venv/bin/python scripts/courses/check.py
# Preserve the current site's robots rules; only add our sitemap declaration.
curl --fail --silent --show-error --max-time 30 --compressed http://127.0.0.1:3001/robots.txt > "$release/robots.txt"
grep -q 'https://pro-schools.ru/kursy/sitemap.xml' "$release/robots.txt" || printf '\nSitemap: https://pro-schools.ru/kursy/sitemap.xml\n' >> "$release/robots.txt"
current=/var/www/school-portal/courses-current
previous=$(readlink -f "$current")
ln -s "$release" "$current.next"
mv -Tf "$current.next" "$current"
if ! curl --fail --silent --show-error --resolve pro-schools.ru:443:127.0.0.1 https://pro-schools.ru/kursy/ --compressed --max-time 30 -o work/courses/health.html || ! grep -q 'data-catalog-design="compact-v3"' work/courses/health.html; then
  ln -s "$previous" "$current.rollback"
  mv -Tf "$current.rollback" "$current"
  exit 1
fi
echo "Courses refreshed: $release"
.venv/bin/python scripts/courses/prune-releases.py
