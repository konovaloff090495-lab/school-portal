#!/bin/bash
# Автозапуск добавления нового города из очереди
# Cron: каждую среду в 10:00

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
LOG="$ROOT/scripts/logs/cities-$(date +%Y-%m-%d).log"

mkdir -p "$ROOT/scripts/logs"

echo "=== $(date) ===" >> "$LOG"
cd "$ROOT"

# Берём следующий город из очереди (только 1 за раз)
NEXT_SLUG=$(/opt/homebrew/bin/node -e "
  const fs = require('fs');
  const q = JSON.parse(fs.readFileSync('scripts/city-queue.json', 'utf-8'));
  const next = q.find(c => c.status === 'pending');
  if (next) console.log(next.slug);
" 2>/dev/null)

if [ -z "$NEXT_SLUG" ]; then
  echo "Все города уже добавлены" >> "$LOG"
  exit 0
fi

echo "Добавляем город: $NEXT_SLUG" >> "$LOG"
/opt/homebrew/bin/node scripts/pipeline.mjs --city-only=$NEXT_SLUG >> "$LOG" 2>&1

echo "=== Done ===" >> "$LOG"
