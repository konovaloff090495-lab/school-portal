#!/bin/bash
# Еженедельное обновление раздела «ЕГЭ и ОГЭ»: докачать новые документы ФИПИ
# (конец августа — проекты демоверсий, ноябрь — утверждённые, апрель–май — открытые
# варианты досрочного периода, сентябрь — методические рекомендации по итогам года),
# пересобрать индекс и, если что-то изменилось, закоммитить и задеплоить.
# Запуск: bash scripts/ege/update.sh
set -u
cd "$(dirname "$0")/../.." || exit 1
ROOT=$(pwd)
LOG=$ROOT/scripts/ege/raw/update.log
exec >> "$LOG" 2>&1
echo "=== $(date '+%F %T') update start"
if pgrep -f "n[e]xt build|d[e]ploy.sh" >/dev/null; then echo "сборка занята — пропуск"; exit 0; fi
python3 scripts/ege/fetch_fipi.py | tail -3
python3 scripts/ege/build_index.py | tail -3
if git diff --quiet -- src/data/exam && [ -z "$(git ls-files --others --exclude-standard src/data/exam)" ]; then
  echo "изменений нет"; exit 0
fi
ADDED=$(git ls-files --others --exclude-standard src/data/exam/texts | wc -l | tr -d ' ')
git add src/data/exam
git commit -q -m "ЕГЭ/ОГЭ: обновление материалов ФИПИ ($(date +%F), новых документов: $ADDED)

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>" && git push -q origin main
rm -f .next/lock
./deploy.sh > /tmp/ege_update_deploy.log 2>&1
echo "deploy exit=$? $(grep -c 'BUILD_ID' /tmp/ege_update_deploy.log) build-id lines; $(tail -1 /tmp/ege_update_deploy.log)"
