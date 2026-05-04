#!/bin/bash
# Автозапуск добавления нового города из очереди
# Cron: каждую среду в 10:00

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
export ANTHROPIC_API_KEY="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"
export VERCEL_PROJECT_ID="prj_VYu8oMFiOeRe6Pabqug4NJaekgpJ"
export VERCEL_ORG_ID="team_nn4HHJh7sr6tITE0mA24TmBT"

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
