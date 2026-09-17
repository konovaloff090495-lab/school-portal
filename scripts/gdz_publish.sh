#!/usr/bin/env bash
# Публикация новых решений ГДЗ БЕЗ пересборки сайта:
#   index.json → commit + push → git pull на VPS → POST /api/revalidate {gdz:true}
# Данные читаются с диска в рантайме (src/data/gdz.ts перечитывает index по mtime),
# поэтому полный deploy.sh нужен только при правках кода.
set -uo pipefail
cd "$(dirname "$0")/.."
VPS="root@45.80.70.209"; SSH_KEY="$HOME/.ssh/id_ed25519"; DIR="/var/www/school-portal"; BASE="https://pro-schools.ru"
SSH="ssh -i $SSH_KEY -o ConnectTimeout=15 -o ServerAliveInterval=5"
ssh_retry() { for i in 1 2 3 4 5 6 7 8; do $SSH "$VPS" "$1" 2>/dev/null && return 0; echo "  ssh попытка $i не удалась, жду..."; sleep 15; done; return 1; }

python3 scripts/gdz_lib.py || exit 1
git add src/data/gdz-books scripts/skysmart/batches scripts/skysmart/ref 2>/dev/null
if git diff --cached --quiet; then echo "Нет изменений в данных ГДЗ."; else
  git commit -q -m "gdz: публикация решений ($(date +%Y-%m-%d)) — $(python3 -c "import json;m=json.load(open('src/data/gdz-books/index.json'));print(sum(x['solvedCount'] for x in m),'решено /',len([x for x in m if x['solvedCount']>0]),'книг')")

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
fi
git push origin main -q 2>/dev/null || { git pull --rebase origin main -q && git push origin main -q; } || { echo "❌ push не удался"; exit 1; }
echo "✓ запушено"
ssh_retry "cd $DIR && GIT_SSH_COMMAND='ssh -i /root/.ssh/github_school_portal -o StrictHostKeyChecking=no' git pull origin main -q" && echo "✓ git pull на VPS" || { echo "❌ git pull на VPS не удался"; exit 1; }
SECRET=$(grep -E '^ADMIN_SECRET=' .env.local 2>/dev/null | head -1 | sed -E 's/^ADMIN_SECRET=//')
[ -n "$SECRET" ] && curl -s --max-time 30 -X POST "$BASE/api/revalidate" -H "Authorization: $SECRET" -H 'Content-Type: application/json' -d '{"gdz":true}' -w "  revalidate → HTTP %{http_code}\n" -o /dev/null
echo "✅ Готово → $BASE/gdz/"
