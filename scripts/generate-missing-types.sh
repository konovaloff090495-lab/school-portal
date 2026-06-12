#!/bin/bash
# Generates 5 missing school types for all existing cities
# Usage: bash scripts/generate-missing-types.sh
set -e

cd "$(dirname "$0")/.."
source .env.local

ALL_TYPES="montessori,pravoslavnye,valdorfskie,sportivnye,yazykovye"
# Moscow already has montessori — skip it
MOSKVA_TYPES="pravoslavnye,valdorfskie,sportivnye,yazykovye"

echo "🚀 Генерация 5 новых типов школ для всех городов"
echo "   Типы: $ALL_TYPES"
echo ""

run_city() {
  local city="$1"
  local slug="$2"
  local types="$3"
  echo "─────────────────────────────────────────────────"
  echo "📍 $city ($slug)"
  node scripts/generate-city.mjs \
    --city="$city" \
    --slug="$slug" \
    --types="$types" \
    --count=8 \
    --no-photos \
    --no-build
}

# Moscow: montessori already done
run_city "Москва"              "moskva"              "$MOSKVA_TYPES"

# All other cities
run_city "Московская область"  "moskovskaya-oblast"  "$ALL_TYPES"
run_city "Новосибирск"         "novosibirsk"         "$ALL_TYPES"
run_city "Екатеринбург"        "ekaterinburg"        "$ALL_TYPES"
run_city "Казань"              "kazan"               "$ALL_TYPES"
run_city "Нижний Новгород"     "nizhniy-novgorod"    "$ALL_TYPES"
run_city "Санкт-Петербург"     "sankt-peterburg"     "$ALL_TYPES"
run_city "Челябинск"           "chelyabinsk"         "$ALL_TYPES"
run_city "Омск"                "omsk"                "$ALL_TYPES"
run_city "Самара"              "samara"              "$ALL_TYPES"
run_city "Ростов-на-Дону"      "rostov-na-donu"      "$ALL_TYPES"
run_city "Уфа"                 "ufa"                 "$ALL_TYPES"
run_city "Краснодар"           "krasnodar"           "$ALL_TYPES"
run_city "Пермь"               "perm"                "$ALL_TYPES"
run_city "Воронеж"             "voronezh"            "$ALL_TYPES"
run_city "Волгоград"           "volgograd"           "$ALL_TYPES"
run_city "Красноярск"          "krasnoyarsk"         "$ALL_TYPES"
run_city "Саратов"             "saratov"             "$ALL_TYPES"
run_city "Томск"               "tomsk"               "$ALL_TYPES"
run_city "Ижевск"              "izhevsk"             "$ALL_TYPES"
run_city "Барнаул"             "barnaul"             "$ALL_TYPES"
run_city "Ульяновск"           "ulyanovsk"           "$ALL_TYPES"
run_city "Иркутск"             "irkutsk"             "$ALL_TYPES"
run_city "Хабаровск"           "khabarovsk"          "$ALL_TYPES"

echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ Все города обработаны! Запускаем финальный билд..."
npm run build

echo ""
echo "🚀 Деплой на Vercel..."
VERCEL_PROJECT_ID=prj_VYu8oMFiOeRe6Pabqug4NJaekgpJ \
VERCEL_ORG_ID=team_nn4HHJh7sr6tITE0mA24TmBT \
npx vercel --prod --yes

echo ""
echo "🎉 Готово! Все типы школ добавлены для всех городов."
