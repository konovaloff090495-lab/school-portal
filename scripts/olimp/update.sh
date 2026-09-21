#!/bin/bash
# Ежедневное обновление раздела «Олимпиады»: докачать новые PDF из архива ВсОШ
# (во время школьного/муниципального этапов ЦПМ выкладывает задания и ответы
# по мере проведения туров), пересобрать индекс и, если что-то изменилось,
# закоммитить и задеплоить. Запуск: bash scripts/olimp/update.sh
set -u
cd "$(dirname "$0")/../.." || exit 1
ROOT=$(pwd)
LOG=$ROOT/scripts/olimp/raw/update.log
exec >> "$LOG" 2>&1
echo "=== $(date '+%F %T') update start"
if pgrep -f "next build|deploy.sh" >/dev/null; then echo "сборка занята — пропуск"; exit 0; fi
python3 scripts/olimp/fetch_vos.py | tail -3
python3 scripts/olimp/build_index.py | tail -2
if git diff --quiet -- src/data/olimp && [ -z "$(git ls-files --others --exclude-standard src/data/olimp)" ]; then
  echo "изменений нет"; exit 0
fi
ADDED=$(git ls-files --others --exclude-standard src/data/olimp/papers | wc -l | tr -d ' ')
git add src/data/olimp
git commit -q -m "Олимпиады: обновление архива ВсОШ ($(date +%F), новых комплектов: $ADDED)

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>" && git push -q origin main
rm -f .next/lock
./deploy.sh > /tmp/olimp_update_deploy.log 2>&1
echo "deploy exit=$? $(grep -c 'BUILD_ID' /tmp/olimp_update_deploy.log) build-id lines; $(tail -1 /tmp/olimp_update_deploy.log)"
