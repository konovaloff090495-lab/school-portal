#!/bin/bash
# Автозапуск генерации статей блога
# Cron: каждый день в 09:00

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
export VERCEL_PROJECT_ID="prj_VYu8oMFiOeRe6Pabqug4NJaekgpJ"
export VERCEL_ORG_ID="team_nn4HHJh7sr6tITE0mA24TmBT"

# Загружаем секреты из .env.local (файл не попадает в git)
ROOT_ENV="/Users/dmitriikonovalov/claude/school-portal"
if [ -f "$ROOT_ENV/.env.local" ]; then
  set -a; source "$ROOT_ENV/.env.local"; set +a
fi
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "ERROR: ANTHROPIC_API_KEY не найден. Задайте его в $ROOT_ENV/.env.local" >&2
  exit 1
fi

ROOT="/Users/dmitriikonovalov/claude/school-portal"
LOG="$ROOT/scripts/logs/blog-$(date +%Y-%m-%d).log"

mkdir -p "$ROOT/scripts/logs"

echo "=== $(date) ===" >> "$LOG"
cd "$ROOT"

# Генерируем 2 статьи
/opt/homebrew/bin/node scripts/generate-blog.mjs --count=2 >> "$LOG" 2>&1

echo "=== Done ===" >> "$LOG"
