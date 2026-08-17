#!/usr/bin/env bash
# Быстрая публикация блог-статей БЕЗ полной пересборки сайта.
#
# Что делает:
#   1. Пересобирает манифест content/blog/index.json из файлов (rebuild-manifest.mjs)
#   2. git add content/blog + commit + push
#   3. git pull на VPS (только новые/изменённые JSON доезжают — секунды)
#   4. revalidate: инвалидирует /blog, /sitemap.xml и /blog/<slug> для каждой статьи
#
# Использование:
#   ./publish.sh                     # опубликовать все изменённые content/blog/*.json
#   ./publish.sh slug-a slug-b       # опубликовать конкретные статьи
#
# Полная сборка (./deploy.sh) нужна ТОЛЬКО при правках кода/шаблонов, не контента.
set -uo pipefail
cd "$(dirname "$0")"

VPS="root@45.80.70.209"
SSH_KEY="$HOME/.ssh/id_ed25519"
DIR="/var/www/school-portal"
BASE="https://pro-schools.ru"
SSH="ssh -i $SSH_KEY -o ConnectTimeout=15 -o ServerAliveInterval=5"

ssh_retry() { for i in 1 2 3 4 5; do $SSH "$VPS" "$1" 2>/dev/null && return 0; echo "  ssh попытка $i не удалась, жду..."; sleep 12; done; return 1; }

# ── 1. Манифест из файлов ────────────────────────────────────────────────────
node scripts/rebuild-manifest.mjs || { echo "❌ rebuild-manifest упал"; exit 1; }

# ── определяем список slug'ов ────────────────────────────────────────────────
if [ "$#" -gt 0 ]; then
  SLUGS=("$@")
else
  # изменённые/новые файлы статей в рабочем дереве
  mapfile -t SLUGS < <(git status --porcelain content/blog | grep -E '\.json$' | grep -v 'index.json' | sed -E 's#.*content/blog/(.*)\.json#\1#' | sort -u)
fi
echo "Публикую статей: ${#SLUGS[@]} — ${SLUGS[*]:-(нет изменений)}"

# ── 2. Коммит и пуш ──────────────────────────────────────────────────────────
git add content/blog
if git diff --cached --quiet; then
  echo "Нет изменений для коммита (манифест и файлы уже в git). Продолжаю к git pull + revalidate."
else
  git commit -q -m "blog: публикация ${SLUGS[*]:-статей} ($(node -e 'console.log(new Date().toISOString().slice(0,10))'))"
fi
if ! git push origin main -q 2>/dev/null; then
  echo "push отклонён, rebase..."; git pull --rebase origin main >/dev/null 2>&1 && git push origin main -q || { echo "❌ push не удался"; exit 1; }
fi
echo "✓ запушено"

# ── 3. git pull на VPS ───────────────────────────────────────────────────────
echo "==> git pull на VPS..."
if ssh_retry "cd $DIR && GIT_SSH_COMMAND='ssh -i /root/.ssh/github_school_portal -o StrictHostKeyChecking=no' git pull origin main"; then
  echo "✓ git pull на VPS ок"
else
  echo "❌ git pull на VPS не удался — статьи в origin/main, но не на сервере. Повтори позже: ./publish.sh ${SLUGS[*]}"; exit 1
fi

# ── 4. revalidate ────────────────────────────────────────────────────────────
# Секрет: из .env.local (ADMIN_SECRET). Если нет — статья всё равно уже отдаётся
# по прямому URL (on-demand), а /blog и /sitemap.xml подтянутся за час (ISR).
SECRET=$(grep -E '^ADMIN_SECRET=' .env.local 2>/dev/null | head -1 | sed -E 's/^ADMIN_SECRET=//')
revalidate() { curl -s --max-time 20 -X POST "$BASE/api/revalidate" -H "Authorization: $SECRET" -H 'Content-Type: application/json' -d "{\"slug\":\"$1\"}" -o /dev/null -w "  revalidate $1 → HTTP %{http_code}\n"; }
if [ -n "$SECRET" ]; then
  if [ "${#SLUGS[@]}" -gt 0 ]; then for s in "${SLUGS[@]}"; do revalidate "$s"; done; else revalidate ""; fi
else
  echo "⚠️  ADMIN_SECRET не найден в .env.local — revalidate пропущен."
  echo "   Прямые URL статей работают сразу (on-demand); /blog и /sitemap.xml обновятся в течение часа."
fi

# ── проверка ─────────────────────────────────────────────────────────────────
if [ "${#SLUGS[@]}" -gt 0 ] && [ -n "${SLUGS[0]}" ]; then
  code=$(curl -s --max-time 20 -o /dev/null -w "%{http_code}" "$BASE/blog/${SLUGS[0]}/")
  echo "Проверка: $BASE/blog/${SLUGS[0]}/ → HTTP $code"
fi
echo "✅ Готово → $BASE/blog/"
