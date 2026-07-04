#!/bin/bash
# Deploy school-portal → VPS 45.80.70.209
# Использование: ./deploy.sh
set -e

SSH="ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=15 -o StrictHostKeyChecking=no"
VPS="root@45.80.70.209"
DIR="/var/www/school-portal"

echo "==> Подключаемся к VPS..."
until $SSH $VPS 'echo ok' 2>/dev/null; do echo "SSH недоступен, ждём..."; sleep 15; done

echo "==> git pull..."
$SSH $VPS "cd $DIR && GIT_SSH_COMMAND='ssh -i /root/.ssh/github_school_portal -o StrictHostKeyChecking=no' git pull origin main"

echo "==> npm ci..."
$SSH $VPS "cd $DIR && npm ci --prefer-offline 2>&1 | tail -3"

echo "==> Запускаем сборку (nohup, может занять 5-15 мин)..."
$SSH $VPS "cd $DIR && rm -f /tmp/sp-build.log && nohup bash -c 'NODE_OPTIONS=\"--max-old-space-size=2048\" npm run build > /tmp/sp-build.log 2>&1 && echo BUILD_DONE >> /tmp/sp-build.log || echo BUILD_FAILED >> /tmp/sp-build.log' > /dev/null 2>&1 &"

echo "==> Ожидаем завершения сборки..."
while true; do
  sleep 20
  until $SSH $VPS 'echo ok' 2>/dev/null; do sleep 10; done
  STATUS=$($SSH $VPS 'tail -1 /tmp/sp-build.log 2>/dev/null || echo BUILDING')
  echo "  Статус: $STATUS"
  if [[ "$STATUS" == "BUILD_DONE" ]]; then
    echo "✅ Сборка успешна"
    break
  elif [[ "$STATUS" == "BUILD_FAILED" ]]; then
    echo "❌ Сборка упала. Лог:"
    $SSH $VPS 'tail -30 /tmp/sp-build.log'
    exit 1
  fi
done

echo "==> Перезапускаем PM2..."
$SSH $VPS "pm2 restart school-portal --update-env" 2>/dev/null || \
  $SSH $VPS "pm2 start $DIR/ecosystem.config.cjs && pm2 save"

echo "==> Проверка..."
sleep 5
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 "https://pro-schools.ru/")
echo "  HTTP: $CODE"
if [[ "$CODE" == "200" ]]; then
  echo "✅ pro-schools.ru работает!"
else
  echo "⚠️  HTTP $CODE — проверьте логи PM2"
fi
