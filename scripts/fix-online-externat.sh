#!/bin/bash
# Дополняет онлайн-школы и экстернаты в городах где их < 8
# Запуск: bash scripts/fix-online-externat.sh

set -e
source .env.local 2>/dev/null || true

echo "=== Добавляем онлайн школы и экстернаты в неполные города ==="
echo ""

# Формат: "Название города:slug:типы_которых_не_хватает"
# типы: online,eksternal или только один из них

run() {
  local CITY="$1"
  local SLUG="$2"
  local TYPES="$3"
  echo "▶ $CITY ($TYPES)..."
  node scripts/generate-city.mjs \
    --city="$CITY" --slug="$SLUG" \
    --types="$TYPES" --count=9 \
    --no-photos --no-build --no-deploy
  echo "✅ $CITY готово"
  echo ""
}

# Москва — нужны только экстернаты
run "Москва" "moskva" "eksternal"

# Московская область — нужны только онлайн
run "Московская область" "moskovskaya-oblast" "online"

# Новосибирск — нужны оба
run "Новосибирск" "novosibirsk" "online,eksternal"

# Нижний Новгород — только экстернаты
run "Нижний Новгород" "nizhniy-novgorod" "eksternal"

# Иркутск — оба типа полностью
run "Иркутск" "irkutsk" "online,eksternal"

# Города с 1 школой — добавляем оба типа
run "Омск" "omsk" "online,eksternal"
run "Самара" "samara" "online,eksternal"
run "Ростов-на-Дону" "rostov-na-donu" "online,eksternal"
run "Уфа" "ufa" "online,eksternal"
run "Краснодар" "krasnodar" "online,eksternal"
run "Пермь" "perm" "online,eksternal"
run "Воронеж" "voronezh" "online,eksternal"
run "Волгоград" "volgograd" "online,eksternal"

echo "=== Все города обработаны ==="
echo ""
echo "Собираем и деплоим..."
npm run build
git add src/data/schools.ts
git commit -m "feat: add online schools and externats for all cities

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push origin main
echo "=== Готово! ==="
