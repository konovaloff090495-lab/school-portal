#!/bin/bash
set -euo pipefail
runtime=/var/www/school-portal/free-lessons-runtime
state=/var/lib/proschools-free-lessons
mkdir -p "$state"
[[ ! -f "$state/PAUSED" ]] || exit 0
exec 9>"$state/pipeline.lock"
flock -n 9 || exit 0
python=/var/www/school-portal/courses-runtime/.venv/bin/python
"$python" "$runtime/scripts/free-lessons/update.py" --state-dir "$state" "$@"
"$python" "$runtime/scripts/free-lessons/publish.py" --state-dir "$state" --live-root /var/www/school-portal
