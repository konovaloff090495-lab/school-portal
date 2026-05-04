#!/bin/bash
# Автозапуск генерации статей блога
# Cron: каждый день в 09:00

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
export ANTHROPIC_API_KEY="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"
export VERCEL_PROJECT_ID="prj_VYu8oMFiOeRe6Pabqug4NJaekgpJ"
export VERCEL_ORG_ID="team_nn4HHJh7sr6tITE0mA24TmBT"

ROOT="/Users/dmitriikonovalov/claude/school-portal"
LOG="$ROOT/scripts/logs/blog-$(date +%Y-%m-%d).log"

mkdir -p "$ROOT/scripts/logs"

echo "=== $(date) ===" >> "$LOG"
cd "$ROOT"

# Генерируем 2 статьи
/opt/homebrew/bin/node scripts/generate-blog.mjs --count=2 >> "$LOG" 2>&1

echo "=== Done ===" >> "$LOG"
