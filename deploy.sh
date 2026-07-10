#!/bin/bash
# Deploy school-portal → VPS 45.80.70.209
# Стратегия: собираем ЛОКАЛЬНО (Turbopack на VPS падает из-за RAM), rsync .next на VPS
set -e

SSH="ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=15 -o StrictHostKeyChecking=no"
VPS="root@45.80.70.209"
DIR="/var/www/school-portal"

echo "==> Подключаемся к VPS..."
until $SSH $VPS 'echo ok' 2>/dev/null; do echo "SSH недоступен, ждём..."; sleep 15; done

echo "==> git pull на VPS..."
$SSH $VPS "cd $DIR && GIT_SSH_COMMAND='ssh -i /root/.ssh/github_school_portal -o StrictHostKeyChecking=no' git pull origin main 2>&1 | tail -3"

echo "==> Локальная сборка (Turbopack)..."
NODE_OPTIONS=--max-old-space-size=4096 npm run build

echo "==> rsync .next на VPS..."
rsync -avz --delete -e "ssh -i ~/.ssh/id_ed25519 -o StrictHostKeyChecking=no" \
  .next/ $VPS:$DIR/.next/ 2>&1 | tail -3

echo "==> rsync public/ на VPS (фото школ и статика)..."
rsync -avz --delete -e "ssh -i ~/.ssh/id_ed25519 -o StrictHostKeyChecking=no" \
  public/ $VPS:$DIR/public/ 2>&1 | tail -3

echo "==> Перезапускаем PM2..."
$SSH $VPS "pm2 restart school-portal --update-env" 2>/dev/null || \
  $SSH $VPS "pm2 start $DIR/ecosystem.config.cjs && pm2 save"

echo "==> Проверка..."
until $SSH $VPS 'echo ok' 2>/dev/null; do sleep 5; done
sleep 5
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 "https://pro-schools.ru/")
echo "  HTTP: $CODE"
if [[ "$CODE" == "200" ]]; then
  echo "✅ pro-schools.ru работает!"
else
  echo "⚠️  HTTP $CODE — проверьте логи PM2"
fi
