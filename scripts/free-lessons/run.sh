#!/bin/bash
set -euo pipefail
runtime=/var/www/school-portal/free-lessons-runtime
state=/var/lib/proschools-free-lessons
mkdir -p "$state"
[[ ! -f "$state/PAUSED" ]] || exit 0
exec 9>"$state/pipeline.lock"
flock -n 9 || exit 0
python="$runtime/.venv/bin/python"
"$python" "$runtime/scripts/free-lessons/update.py" --state-dir "$state" "$@"
if ! "$python" "$runtime/scripts/free-lessons/curate.py" --state-dir "$state" --assets-root "$runtime/public" --lock-held; then
  logger -t proschools-free-lessons "New-card curation failed; preserving queue and continuing schedule publication"
fi
"$python" "$runtime/scripts/free-lessons/publish.py" --state-dir "$state" --live-root /var/www/school-portal
