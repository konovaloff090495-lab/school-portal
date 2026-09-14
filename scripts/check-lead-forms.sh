#!/usr/bin/env bash
# Гард: каждая лид-форма обязана отправлять заявку через submitLead() — иначе заявка
# не попадёт в CRM Синергии. Запускается в deploy.sh перед сборкой и в `npm run lint:leads`.
# Правила:
#  1. Файл с полем телефона (type="tel") обязан импортировать '@/lib/submitLead'.
#  2. fetch('/api/leads/submit') разрешён только внутри src/lib/submitLead.ts.
#  3. Сторонние приёмники лидов (formspree/tilda/bitrix/amocrm/webhook) в компонентах запрещены.
set -u
cd "$(dirname "$0")/.."
fail=0

while IFS= read -r f; do
  if ! grep -q "@/lib/submitLead" "$f"; then
    echo "❌ $f: есть поле телефона (type=\"tel\"), но нет import { submitLead } from '@/lib/submitLead'"
    fail=1
  fi
done < <(grep -rl --include='*.tsx' 'type="tel"' src)

while IFS= read -r f; do
  [[ "$f" == "src/lib/submitLead.ts" ]] && continue
  echo "❌ $f: прямой fetch('/api/leads/submit') — используй submitLead() из '@/lib/submitLead'"
  fail=1
done < <(grep -rl --include='*.ts' --include='*.tsx' "/api/leads/submit" src | grep -v '^src/app/api/')

while IFS= read -r f; do
  echo "❌ $f: сторонний приёмник лидов в компоненте — заявки обязаны идти через submitLead()"
  fail=1
done < <(grep -rliE --include='*.tsx' "formspree\.io|forms\.tildacdn|bitrix24|amocrm\.ru/api|hooks\.zapier|api\.telegram\.org" src/components src/app | grep -v '^src/app/api/')

if [[ $fail -eq 1 ]]; then
  echo
  echo "Правило: все лид-формы pro-schools.ru шлют заявки через submitLead() (Telegram + CRM Синергии)."
  echo "Для B2B-форм (не ученики) передавай crm: false, но всё равно через submitLead()."
  exit 1
fi
echo "✓ lead-forms: все формы идут через submitLead()"
