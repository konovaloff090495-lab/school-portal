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
$SSH $VPS "cd $DIR && GIT_SSH_COMMAND='ssh -i /root/.ssh/github_school_portal -o StrictHostKeyChecking=no' git pull origin main 2>&1 | tail -3"

echo "==> Локальная сборка (Turbopack)..."
NODE_OPTIONS=--max-old-space-size=4096 npm run build

LOCAL_BUILD_ID=$(cat .next/BUILD_ID)
echo "==> Локальный BUILD_ID: $LOCAL_BUILD_ID"

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
$SSH $VPS "pm2 restart school-portal --update-env" 2>/dev/null || \
  $SSH $VPS "pm2 start $DIR/ecosystem.config.cjs && pm2 save"

echo "==> Проверка..."
until $SSH $VPS 'echo ok' 2>/dev/null; do sleep 5; done
sleep 5
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 "https://pro-schools.ru/")
echo "  HTTP: $CODE"
if [[ "$CODE" == "200" ]]; then
  echo "✅ pro-schools.ru работает! (BUILD_ID $VPS_BUILD_ID)"
else
  echo "⚠️  HTTP $CODE — проверьте логи PM2"
fi
