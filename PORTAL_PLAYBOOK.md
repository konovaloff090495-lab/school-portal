# SEO-Portal Playbook
> Сжатый опыт разработки pro-schools.ru — для переноса в новые порталы (колледжи, университеты и т.д.)

---

## 1. Стек и архитектура

```
Next.js 16+ App Router
TypeScript
Vercel (Pro план обязателен при 5000+ статических страниц)
GitHub Actions (генерация контента + деплой)
Anthropic API (claude-opus для генерации данных)
```

**Структура данных:** один большой TypeScript-файл `src/data/colleges.ts` с массивом объектов. Никакой БД на MVP — это ускоряет разработку и деплой.

---

## 2. Типы данных (шаблон)

```typescript
export type CollegeType = 'gosudarstvennye' | 'chastnie' | 'meditsinskie' | ...
export type RegionSlug = 'moskva' | 'sankt-peterburg' | ...

export interface College {
  id: string
  slug: string        // ← ОБЯЗАТЕЛЬНО! Без slug generateStaticParams падает с undefined
  name: string
  type: CollegeType
  region: RegionSlug
  city: string
  address: string
  phone: string
  description: string
  fullDescription: string
  grades: string      // или 'специальности'
  founded: number
  studentsCount: number
  features: string[]
  rating: number
  reviewCount: number
  priceFrom: number
  imageAlt: string
  metro?: string      // необязательное
}

export const typeLabels: Record<CollegeType, string> = { ... }
export const typeSlugs: CollegeType[] = [ ... ]
export const regionSlugs: RegionSlug[] = [ ... ]
export const regionLabels: Record<RegionSlug, string> = { ... }
export const regionLabelsIn: Record<RegionSlug, string> = { ... }   // «в Москве»
export const regionLabelsOf: Record<RegionSlug, string> = { ... }   // «Москвы»
```

---

## 3. Критические грабли Vercel (обязательно с первого дня)

### 3.1 FALLBACK_BODY_TOO_LARGE
Каталог с 2000+ объектами = HTML >19 МБ = Vercel крашит деплой.

**Решение — два шага:**

```typescript
// src/app/kolledzhi/page.tsx
export const dynamic = 'force-dynamic'  // ← строка 1 файла
```

```json
// vercel.json
{
  "env": {
    "VERCEL_BYPASS_FALLBACK_OVERSIZED_ERROR": "1"
  }
}
```

И добавить env var через CLI:
```bash
echo "1" | VERCEL_PROJECT_ID=... VERCEL_ORG_ID=... vercel env add VERCEL_BYPASS_FALLBACK_OVERSIZED_ERROR production
```

### 3.2 generateStaticParams returning undefined = build crash
Каждый объект ДОЛЖЕН иметь поле `slug`. Пропущенный slug → `undefined` в params → краш при сборке.

**Проверка перед деплоем:**
```bash
node -e "
const content = require('fs').readFileSync('src/data/colleges.ts','utf-8');
const lines = content.split('\n');
let hasId=false, hasSlug=false, idLine='', lineNum=0;
lines.forEach((l,i)=>{
  if(l.includes(\"id:\") && l.includes(\"'\") && !l.includes('//')){hasId=true;idLine=l.trim();lineNum=i+1;hasSlug=false;}
  if(hasId && l.includes('slug:')) hasSlug=true;
  if(hasId && l.includes('type:') && !hasSlug){console.log('MISSING SLUG line',lineNum,idLine);hasId=false;}
});
"
```

### 3.3 CatalogClient — не импортировать весь массив клиентски
```typescript
// ПЛОХО: клиент тащит 2000+ объектов в JS-бандл
'use client'
import { colleges } from '@/data/colleges'  // ← 5 МБ в браузер

// ХОРОШО: данные передаются через props с сервера
// page.tsx (server component):
const filtered = colleges.filter(c => c.region === region)
return <CatalogClient initialData={filtered} />
```
Если всё же нужен полный import на клиенте — добавь `force-dynamic` на страницу каталога.

---

## 4. GitHub Actions — шаблон деплоя

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4          # ← ОБЯЗАТЕЛЬНО перед git rev-parse
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run build
      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: |
          COMMIT=$(git rev-parse HEAD)     # ← НЕ git ls-remote (ломается в Actions)
          curl -sf -X POST "https://api.vercel.com/v13/deployments?teamId=$TEAM_ID" \
            -H "Authorization: Bearer $VERCEL_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{
              \"name\": \"college-portal\",
              \"project\": \"$PROJECT_ID\",
              \"target\": \"production\",
              \"gitSource\": {
                \"type\": \"github\",
                \"org\": \"YOUR_ORG\",
                \"repo\": \"college-portal\",
                \"ref\": \"main\",
                \"sha\": \"$COMMIT\"
              }
            }" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('url'), d.get('readyState'))"
```

**Важно:** GitHub Actions только ИНИЦИИРУЕТ деплой на Vercel — он завершается позже (~10–15 мин). Actions успешно завершится за 2 мин, но сайт обновится позже.

---

## 5. Скрипт генерации данных (шаблон)

```javascript
// scripts/generate-city.mjs
// Ключевые флаги:
// --city="Москва" --slug="moskva"
// --types="gosudarstvennye,chastnie"   (иначе все типы)
// --count=8                             (школ на тип)
// --no-photos                           (пропустить Unsplash)
// --no-build                            (не билдить после — для батч-генерации)
// --no-deploy                           (не деплоить)

const ALL_TYPES = [
  // ← КРИТИЧНО: этот массив ДОЛЖЕН совпадать с typeSlugs в colleges.ts
  // Если типа нет здесь — страница будет 0 записей навсегда
  'gosudarstvennye', 'chastnie', ...
]

const TYPE_LABELS = {
  // ← Если типа нет — padEnd() падает с "Cannot read properties of undefined"
  gosudarstvennye: 'Государственные', ...
}
```

**Батч-генерация всех городов:**
```bash
#!/bin/bash
# generate-missing-types.sh
source .env.local
for city_slug in "Москва:moskva" "СПб:sankt-peterburg" ...; do
  IFS=: read name slug <<< "$city_slug"
  node scripts/generate-city.mjs \
    --city="$name" --slug="$slug" \
    --types="tип1,тип2" --count=8 \
    --no-photos --no-build
done
npm run build && npx vercel --prod --yes
```

---

## 6. Vercel Pro план — нужен с самого начала

На Hobby плане при активном сайте быстро кончаются:
- **Fast Origin Transfer**: 10 ГБ/мес — исчерпывается за 2–3 недели при 5000+ страниц
- **ISR Reads**: 1М/мес — исчерпывается быстро

При превышении: деплои встают в очередь и строятся по 40+ минут или вообще не доходят до продакшна.

**Сразу ставить Pro ($20/мес)** — экономит нервы.

---

## 7. Структура URL (SEO-оптимальная)

```
/kolledzhi/                          — каталог всех
/kolledzhi/[region]/                 — по городу: /kolledzhi/moskva/
/kolledzhi/[region]/[type]/          — фильтр: /kolledzhi/moskva/meditsinskie/
/kolledzhi/tipy/[type]/              — все по типу: /kolledzhi/tipy/meditsinskie/
/kolledzh/[slug]/                    — карточка: /kolledzh/medkolledj-1-moskva/
```

Каноникалы во всех метаданных обязательны:
```typescript
alternates: { canonical: `https://example.ru/kolledzhi/tipy/${type}/` }
```

---

## 8. Git — работа с автогенерируемыми файлами

Файлы типа `blog-topics.json`, `city-queue.json` автоматически меняются пайплайном. При pull будут конфликты.

```bash
# В workflows используй:
git pull --no-rebase -X ours origin main

# При ручном merge конфликта в data-файлах:
git checkout --theirs src/data/colleges.ts  # берём удалённую версию
# ИЛИ
git checkout --ours src/data/colleges.ts    # берём локальную
```

---

## 9. Чеклист перед первым деплоем

- [ ] `vercel.json` с `VERCEL_BYPASS_FALLBACK_OVERSIZED_ERROR=1`
- [ ] `export const dynamic = 'force-dynamic'` на странице каталога
- [ ] Все объекты в data-файле имеют поле `slug`
- [ ] `ALL_TYPES` в generate-скрипте совпадает с `typeSlugs` в TypeScript
- [ ] `TYPE_LABELS` содержит все типы из `ALL_TYPES`
- [ ] `deploy.yml` использует `actions/checkout@v4` + `git rev-parse HEAD`
- [ ] VERCEL_TOKEN добавлен в GitHub Secrets
- [ ] Vercel Pro план активирован

---

## 10. Ориентировочные метрики pro-schools.ru (для сравнения)

| Метрика | Значение |
|---------|----------|
| Объектов в БД | ~3000 школ |
| Статических страниц | ~7200 |
| Время локального билда | ~3 мин |
| Время билда на Vercel | ~13 мин |
| Размер schools.ts | ~60K строк / ~5 МБ |
| Регионов | 25 |
| Типов | 23 |
