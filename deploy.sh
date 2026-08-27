#!/bin/bash
# Deploy school-portal → VPS 45.80.70.209
# Стратегия: собираем ЛОКАЛЬНО (Turbopack на VPS падает из-за RAM), rsync .next на VPS
set -e

SSH="ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=15 -o StrictHostKeyChecking=no"
RSYNC_SSH="ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=15 -o StrictHostKeyChecking=no"
VPS="root@45.80.70.209"
DIR="/var/www/school-portal"

# rsync с ретраями и РЕАЛЬНОЙ проверкой кода возврата.
# Раньше здесь было `rsync ... | tail -3`, из-за чего код возврата брался от tail (всегда 0),
# и обрыв SSH во время rsync не ловился: PM2 перезапускался со старым/неполным билдом.
rsync_retry() {
  local src="$1" dst="$2" label="$3" n=0 max=5 out
  until [ "$n" -ge "$max" ]; do
    if out=$(rsync -az --delete -e "$RSYNC_SSH" "$src" "$VPS:$dst" 2>&1); then
      echo "  ✓ rsync $label ok"
      return 0
    fi
    n=$((n + 1))
    echo "  ⚠️  rsync $label не удался (попытка $n/$max):"
    echo "$out" | tail -3 | sed 's/^/     /'
    sleep 10
  done
  echo "❌ rsync $label провалился после $max попыток — прод НЕ обновлён, выходим."
  return 1
}

echo "==> Подключаемся к VPS..."
until $SSH $VPS 'echo ok' 2>/dev/null; do echo "SSH недоступен, ждём..."; sleep 15; done

echo "==> git pull на VPS..."
# SSH тут регулярно рвётся на banner exchange. Со `set -e` одна неудачная попытка
# роняла весь деплой ещё до сборки — поэтому ретраим.
git_pull_ok=0
for attempt in 1 2 3 4 5; do
  # ⚠️ БЕЗ пайпа на tail: в конструкции `ssh host "cmd | tail"` код возврата берётся
  # от ПОСЛЕДНЕЙ команды удалённой цепочки, то есть от tail (всегда 0). Из-за этого
  # 27.08.2026 упавший git pull был засчитан как успешный: на VPS остались старые
  # исходники и content/, а .next приехал новый — прод получил смесь двух версий.
  if $SSH $VPS "cd $DIR && GIT_SSH_COMMAND='ssh -i /root/.ssh/github_school_portal -o StrictHostKeyChecking=no' git pull origin main"; then
    git_pull_ok=1; break
  fi
  echo "  ⚠️  git pull не удался (попытка $attempt/5), повтор через 15 с"
  sleep 15
done
if [[ "$git_pull_ok" != "1" ]]; then
  echo "❌ git pull на VPS не прошёл после 5 попыток — выходим, прод не тронут."
  exit 1
fi

echo "==> Локальная сборка (Turbopack)..."
NODE_OPTIONS=--max-old-space-size=4096 npm run build

LOCAL_BUILD_ID=$(cat .next/BUILD_ID)
echo "==> Локальный BUILD_ID: $LOCAL_BUILD_ID"

echo "==> Проверяем зависимости на VPS..."
# 27.08.2026 прод лёг в цикл рестартов с `next: not found`: node_modules на сервере
# оказались неполными, а deploy.sh их никогда не проверял и не ставил.
if ! $SSH $VPS "test -x $DIR/node_modules/.bin/next"; then
  echo "  ⚠️  next на VPS отсутствует — ставим зависимости (npm ci)"
  $SSH $VPS "cd $DIR && npm cache clean --force >/dev/null 2>&1; npm ci --no-audit --no-fund" || {
    echo "❌ npm ci на VPS не прошёл — выходим, PM2 не трогаем."; exit 1; }
  $SSH $VPS "test -x $DIR/node_modules/.bin/next" || { echo "❌ next так и не появился — выходим."; exit 1; }
  echo "  ✓ зависимости на месте"
fi

echo "==> rsync .next на VPS..."
rsync_retry ".next/" "$DIR/.next/" ".next"

echo "==> rsync public/ на VPS (фото школ и статика)..."
rsync_retry "public/" "$DIR/public/" "public"

# Гейт безопасности: если .next долит не полностью (обрыв SSH), BUILD_ID на VPS
# не совпадёт с локальным — прерываемся БЕЗ рестарта, чтобы не поднять неполный билд.
echo "==> Сверяем BUILD_ID на VPS..."
# SSH на этом VPS регулярно рвётся ("banner exchange"). Одна неудачная попытка
# читала пустую строку, гейт срабатывал вхолостую и PM2 не перезапускался,
# хотя .next был долит полностью. Читаем BUILD_ID с ретраями.
VPS_BUILD_ID=""
for attempt in 1 2 3 4 5; do
  VPS_BUILD_ID=$($SSH $VPS "cat $DIR/.next/BUILD_ID" 2>/dev/null || echo "")
  [[ -n "$VPS_BUILD_ID" ]] && break
  echo "  ⚠️  не смог прочитать BUILD_ID (попытка $attempt/5), повтор через 15 с"
  sleep 15
done
if [[ "$VPS_BUILD_ID" != "$LOCAL_BUILD_ID" ]]; then
  echo "❌ BUILD_ID на VPS ('$VPS_BUILD_ID') != локального ('$LOCAL_BUILD_ID')."
  echo "   .next долит не полностью — PM2 НЕ перезапускаем, прод остаётся на прежнем билде."
  exit 1
fi
echo "  ✓ BUILD_ID совпал: $VPS_BUILD_ID"

echo "==> Перезапускаем PM2..."
# Самый обидный момент для обрыва: .next уже долит и сверен, а рестарт не прошёл —
# прод остаётся на старом билде при полностью готовом новом.
restart_ok=0
for attempt in 1 2 3 4 5; do
  if $SSH $VPS "pm2 restart school-portal --update-env" 2>/dev/null; then restart_ok=1; break; fi
  if $SSH $VPS "pm2 start $DIR/ecosystem.config.cjs && pm2 save" 2>/dev/null; then restart_ok=1; break; fi
  echo "  ⚠️  рестарт PM2 не удался (попытка $attempt/5), повтор через 15 с"
  sleep 15
done
if [[ "$restart_ok" != "1" ]]; then
  echo "❌ PM2 не перезапустился после 5 попыток. .next долит и сверен —"
  echo "   допинать вручную: ssh root@45.80.70.209 'pm2 restart school-portal'"
  exit 1
fi

echo "==> Проверка..."
until $SSH $VPS 'echo ok' 2>/dev/null; do sleep 5; done
sleep 5
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 "https://pro-schools.ru/")
echo "  HTTP: $CODE"
if [[ "$CODE" == "200" ]]; then
  echo "✅ pro-schools.ru работает! (BUILD_ID $VPS_BUILD_ID)"
  # Belt-and-suspenders: rsync --delete стирает on-demand ISR-кэш блога, поэтому
  # после полного деплоя инвалидируем /blog и /sitemap.xml, чтобы они перечитали
  # content/blog. Best-effort (не влияет на статус деплоя).
  BLOG_SECRET=$(grep -E '^ADMIN_SECRET=' "$(dirname "$0")/.env.local" 2>/dev/null | head -1 | sed -E 's/^ADMIN_SECRET=//')
  if [[ -n "$BLOG_SECRET" ]]; then
    curl -s --max-time 15 -X POST "https://pro-schools.ru/api/revalidate" -H "Authorization: $BLOG_SECRET" -H 'Content-Type: application/json' -d '{}' -o /dev/null || true
  fi
  # Переотправка sitemap в Google Search Console (переобход при релизе). Best-effort.
  python3 "$HOME/claude/seo-tools/ping_sitemap.py" pro-schools.ru || true
  # IndexNow + переобход Яндекс.Вебмастера по изменённым за 2 дня страницам. Best-effort.
  python3 "$HOME/claude/seo-tools/indexnow.py" pro-schools.ru || true
else
  echo "⚠️  HTTP $CODE — проверьте логи PM2"
fi
