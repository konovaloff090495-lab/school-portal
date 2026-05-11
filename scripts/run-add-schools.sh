#!/bin/bash
# Автозапуск добавления карточек для новых типов в существующих городах
# Cron: каждый понедельник в 11:00
#
# Использование вручную:
#   ./scripts/run-add-schools.sh kazan mezhdunarodnie
#   ./scripts/run-add-schools.sh sankт-peterburg "mezhdunarodnie,kadetskie"

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
LOG="$ROOT/scripts/logs/schools-$(date +%Y-%m-%d).log"

mkdir -p "$ROOT/scripts/logs"

# Если переданы аргументы — используем их, иначе авто-режим
SLUG="$1"
TYPES="$2"

if [ -n "$SLUG" ]; then
  # Ручной режим: ./run-add-schools.sh kazan mezhdunarodnie
  CITY=$(/opt/homebrew/bin/node -e "
    const fs = require('fs');
    const q = JSON.parse(fs.readFileSync('$ROOT/scripts/city-queue.json', 'utf-8'));
    const entry = q.find(c => c.slug === '$SLUG');
    if (entry) console.log(entry.city);
    else console.log('$SLUG');
  " 2>/dev/null)

  echo "=== $(date) Добавляем $CITY ($SLUG) типы: ${TYPES:-все} ===" >> "$LOG"
  cd "$ROOT"

  NODE_ARGS=(--city="$CITY" --slug="$SLUG" --count=8 --no-photos)
  [ -n "$TYPES" ] && NODE_ARGS+=(--types="$TYPES")
  /opt/homebrew/bin/node scripts/generate-city.mjs "${NODE_ARGS[@]}" >> "$LOG" 2>&1
else
  # Авто-режим: добавляем mezhdunarodnie для городов где его ещё нет
  echo "=== $(date) Авто: добавляем mezhdunarodnie для городов без международных ===" >> "$LOG"
  cd "$ROOT"

  /opt/homebrew/bin/node -e "
    const fs = require('fs');
    const content = fs.readFileSync('src/data/schools.ts', 'utf-8');
    const queue = JSON.parse(fs.readFileSync('scripts/city-queue.json', 'utf-8'));
    const done = queue.filter(c => c.status === 'done');

    // Находим города без mezhdunarodnie
    const missing = done.filter(c => {
      const re = new RegExp(\"type: 'mezhdunarodnie'[\\\\s\\\\S]*?region: '\" + c.slug + \"'\");
      return !re.test(content);
    });

    if (missing.length === 0) { console.log('Все города уже имеют mezhdunarodnie'); process.exit(0); }

    // Берём первый
    const next = missing[0];
    console.log('NEXT:' + next.city + ':' + next.slug);
  " 2>/dev/null | while IFS=: read prefix city slug; do
    if [ "$prefix" = "NEXT" ]; then
      echo "Добавляем mezhdunarodnie для $city ($slug)" >> "$LOG"
      /opt/homebrew/bin/node scripts/generate-city.mjs \
        --city="$city" --slug="$slug" \
        --types="mezhdunarodnie" --count=8 --no-photos >> "$LOG" 2>&1
    fi
  done
fi

echo "=== Done ===" >> "$LOG"
