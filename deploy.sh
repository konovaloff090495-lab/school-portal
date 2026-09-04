#!/bin/bash
# Deploy school-portal → VPS 45.80.70.209
# Стратегия: собираем ЛОКАЛЬНО (Turbopack на VPS падает из-за RAM), rsync .next на VPS
set -e

SSH="ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=15 -o StrictHostKeyChecking=no"
# ServerAliveInterval держит длинную передачу: rsync .next идёт минутами и рвался
# на «Broken pipe» ровно посередине (27.08.2026 — 5 попыток подряд, деплой встал).
RSYNC_SSH="ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=15 -o StrictHostKeyChecking=no -o ServerAliveInterval=15 -o ServerAliveCountMax=8 -o TCPKeepAlive=yes"
VPS="root@45.80.70.209"
DIR="/var/www/school-portal"

# rsync с ретраями и РЕАЛЬНОЙ проверкой кода возврата.
# Раньше здесь было `rsync ... | tail -3`, из-за чего код возврата брался от tail (всегда 0),
# и обрыв SSH во время rsync не ловился: PM2 перезапускался со старым/неполным билдом.
rsync_retry() {
  local src="$1" dst="$2" label="$3" n=0 max=5 out
  until [ "$n" -ge "$max" ]; do
    # --partial: оборванный файл не выбрасывается, следующая попытка его докачивает.
    # --timeout=600: rsync подолгу молчит на сравнении 127к файлов .next — при 120 с
    #   он убивал сам себя («io timeout after 124 seconds»), не передав ни байта.
    # Исключения (27.08.2026): в .next лежало 8,1 ГБ, из них на прод нужно 2,7 ГБ.
    #   dev/   — 4,3 ГБ артефактов `next dev`, проду не нужны вообще;
    #   cache/ — 1,1 ГБ локального кэша сборки. Его нельзя ни заливать, ни удалять:
    #            на сервере в .next/cache лежит РАБОЧИЙ ISR-кэш, и `--delete` без
    #            этого исключения сносил его каждым деплоем — отсюда и медленный
    #            прогрев сайта после выкатки.
    if out=$(rsync -az --delete --partial --timeout=600 --exclude 'dev/' --exclude 'cache/' -e "$RSYNC_SSH" "$src" "$VPS:$dst" 2>&1); then
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

# --no-build: билд уже собран (например, предыдущий деплой упал на rsync) — доливаем
# готовый .next, не тратя ~30 минут на повторную генерацию 10 800 страниц.
if [[ " $* " == *" --no-build "* ]]; then
  if [[ ! -f .next/BUILD_ID ]]; then
    echo "❌ --no-build, но .next/BUILD_ID нет — собирать нечего. Запусти без флага."
    exit 1
  fi
  echo "==> Сборка пропущена (--no-build), доливаем готовый .next"
else
  echo "==> Локальная сборка..."
  NODE_OPTIONS=--max-old-space-size=4096 npm run build
fi

LOCAL_BUILD_ID=$(cat .next/BUILD_ID)
echo "==> Локальный BUILD_ID: $LOCAL_BUILD_ID"

echo "==> Проверяем зависимости на VPS..."
# 27.08.2026 прод лёг в цикл рестартов с `next: not found`: node_modules на сервере
# оказались неполными, а deploy.sh их никогда не проверял и не ставил.
#
# ⚠️ ОПАСНАЯ ГРАНЬ (почему тут столько кода): раньше проверка была одной строкой
#    `if ! $SSH $VPS "test -x .../next"`. Она НЕ различала два разных исхода:
#      • remote вернул 1 — test отработал, next реально отсутствует;
#      • ssh вернул 255 — соединение не поднялось (флап на banner exchange).
#    Оба давали «истину» → запускался `rm -rf node_modules && npm ci` на БОЕВОМ
#    проде из-за того, что SSH просто моргнул. А если SSH оборвётся между rm и
#    концом npm ci — прод остаётся вообще без node_modules (тот самый цикл
#    рестартов с `next: not found`).
#    Поэтому теперь: (а) ретраями убеждаемся, что SSH вообще отвечает; (б) отдельно
#    проверяем next и РАЗЛИЧАЕМ коды возврата ssh; rm/npm ci — ТОЛЬКО при коде 1
#    (next точно отсутствует при живом SSH). Неответивший SSH никогда не трактуем
#    как «next отсутствует».

# (а) Дожидаемся заведомо живого SSH (echo ok), прежде чем что-либо решать о next.
ssh_alive=0
for attempt in 1 2 3 4 5; do
  if $SSH $VPS 'echo ok' 2>/dev/null | grep -q '^ok$'; then ssh_alive=1; break; fi
  echo "  ⚠️  SSH не ответил (попытка $attempt/5), повтор через 15 с"
  sleep 15
done
if [[ "$ssh_alive" != "1" ]]; then
  echo "❌ SSH к VPS не отвечает — не можем безопасно проверить зависимости, выходим."
  echo "   node_modules НЕ трогаем: неответивший SSH ≠ «next отсутствует»."
  exit 1
fi

# (б) Проверяем next, различая код возврата ssh (важно: НЕ путать 255 с 1):
#     0   — next есть;
#     1   — test отработал, next отсутствует (ЕДИНСТВЕННЫЙ случай для rm/npm ci);
#     255 — ssh не подключился → ответа нет, ретраим, rm НЕ делаем.
# `|| next_rc=$?` обязателен: под `set -e` голый упавший ssh уронил бы весь скрипт
# ещё до чтения кода возврата.
next_state="unknown"
for attempt in 1 2 3 4 5; do
  next_rc=0
  $SSH $VPS "test -x $DIR/node_modules/.bin/next" >/dev/null 2>&1 || next_rc=$?
  if [[ "$next_rc" == "0" ]]; then next_state="present"; break; fi
  if [[ "$next_rc" == "1" ]]; then next_state="absent"; break; fi
  echo "  ⚠️  SSH оборвался при проверке next (код $next_rc, попытка $attempt/5), повтор через 15 с"
  sleep 15
done
if [[ "$next_state" == "unknown" ]]; then
  echo "❌ Не удалось достоверно проверить next на VPS (SSH флапает, код ≠ 0/1) — выходим."
  echo "   node_modules НЕ трогаем."
  exit 1
fi

if [[ "$next_state" == "absent" ]]; then
  echo "  ⚠️  next на VPS отсутствует (test вернул 1 при живом SSH) — ставим зависимости (npm ci)"
  # 31.08.2026: `npm ci` поверх существующей папки трижды за день падал с ENOTEMPTY
  # (rmdir на занятых файлах при живом процессе) и оставлял node_modules БЕЗ .bin —
  # после чего следующий деплой снова шёл сюда же. Сносим папку сами: так ci ставит
  # с нуля и не спотыкается. Прод при этом жив — процесс уже загружен в память.
  $SSH $VPS "cd $DIR && rm -rf node_modules && npm ci --no-audit --no-fund" || {
    echo "❌ npm ci на VPS не прошёл — выходим, PM2 не трогаем."; exit 1; }
  $SSH $VPS "test -x $DIR/node_modules/.bin/next" || { echo "❌ next так и не появился — выходим."; exit 1; }
  echo "  ✓ зависимости на месте"
else
  echo "  ✓ next на месте"
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
# Ретраим дольше (8 попыток): пустое чтение — это почти всегда флап SSH, а не
# проблема билда, и раньше редко хватало 5 попыток на «плохом» соединении.
for attempt in 1 2 3 4 5 6 7 8; do
  VPS_BUILD_ID=$($SSH $VPS "cat $DIR/.next/BUILD_ID" 2>/dev/null || echo "")
  [[ -n "$VPS_BUILD_ID" ]] && break
  echo "  ⚠️  не смог прочитать BUILD_ID (попытка $attempt/8), повтор через 15 с"
  sleep 15
done
# Пустая строка ≠ несовпадение билда: это SSH не дал прочитать файл. Раньше пустое
# чтение шло в ветку «долит не полностью» и пугало ложной ошибкой билда. Различаем.
if [[ -z "$VPS_BUILD_ID" ]]; then
  echo "❌ BUILD_ID на VPS не прочитался за 8 попыток — это флап SSH, а не проблема билда."
  echo "   PM2 НЕ перезапускаем. .next уже на VPS — повторите: ./deploy.sh --no-build"
  exit 1
fi
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
