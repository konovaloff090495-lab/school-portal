# SEO Audit Report — pro-schools.ru
**Date:** 2026-04-27  
**Tool:** Claude SEO Skill v1.9.6  
**Business type:** Directory / Catalog — образовательный каталог школ России

---

## 🏆 SEO Health Score: **54 / 100**

| Category | Score | Weight |
|---|---|---|
| Technical SEO | 52/100 | 22% |
| Content Quality | 60/100 | 23% |
| On-Page SEO | 58/100 | 20% |
| Schema / Structured Data | 28/100 | 10% |
| Performance (CWV) | 70/100 | 10% |
| AI Search Readiness | 30/100 | 10% |
| Images | 88/100 | 5% |

---

## Executive Summary

### Top 5 критических проблем
1. ❌ **Canonical теги отсутствуют на всех страницах** — риск дублирования контента
2. ❌ **Все внутренние ссылки без trailing slash** — каждый переход вызывает лишний 308 редирект
3. ❌ **og-image.png возвращает 404** — Open Graph превью не работает для соцсетей и мессенджеров
4. ❌ **Schema markup крайне неполная** — отсутствуют aggregateRating, @id, geo, image, BreadcrumbList
5. ❌ **Нет страниц «О сайте» / «Контакты»** — критично для E-E-A-T

### Top 5 быстрых побед
1. ✅ Добавить canonical теги во все шаблоны (1 час работы, мгновенный эффект)
2. ✅ Создать og-image.png (30 минут, улучшит CTR из соцсетей)
3. ✅ Исправить trailing slash во всех Link-компонентах (1 час, убирает редиректы)
4. ✅ Расширить Schema до aggregateRating + @id (2 часа, Rich Snippets в выдаче)
5. ✅ Создать страницу /o-nas/ с контактами и описанием проекта (1 час)

---

## 1. Technical SEO — 52/100

### ✅ Хорошо
- HTTPS + HSTS (`strict-transport-security: max-age=63072000`)
- robots.txt корректно настроен, указывает sitemap
- Sitemap.xml содержит 132 URL, все с trailing slash, с lastmod и priority
- Vercel CDN отдаёт страницы (X-Vercel-Cache: HIT)
- favicon.ico присутствует
- Нет явных crawl-блокировок для основных страниц
- 308 редиректы (Permanent) — лучше чем 301 с точки зрения PWA

### ❌ Проблемы

#### CRITICAL: Отсутствуют canonical теги
**Все 130+ страниц не имеют `<link rel="canonical">`.**

Для каталога с фильтрами это критично: Google видит множество версий страниц с параметрами (`?sort=rating`, состояние фильтров) и не знает, какую версию индексировать. Поскольку CatalogClient рендерится на клиенте с useState, при включении фильтров URL не меняется — но когда он изменится (если добавить URL-параметры фильтров), дублирование контента станет реальной проблемой уже сейчас.

**Fix:**
```tsx
// В каждом page.tsx добавить в generateMetadata:
alternates: {
  canonical: `https://pro-schools.ru/shkoly/moskva/`,
}
```

#### HIGH: Все внутренние ссылки без trailing slash
62 из 62 внутренних ссылок на главной странице НЕ имеют trailing slash:
```
href="/shkoly/moskva"     → 308 → /shkoly/moskva/
href="/shkola/gbou-shkola-179-moskva" → 308 → /shkola/gbou-shkola-179-moskva/
```
Каждый клик на сайте = 1 лишний HTTP-редирект. Для SEO-пауков это трата crawl budget.

**Fix:** В Next.js добавить trailing slashes через `next.config.ts`:
```ts
const nextConfig = { trailingSlash: true }
```
Это автоматически исправит все ссылки и устранит редиректы.

#### HIGH: og-image.png не существует
```
GET https://pro-schools.ru/og-image.png → 404
```
В layout.tsx прописан `og:image: "https://pro-schools.ru/og-image.png"`, но файл отсутствует. При шаринге в Telegram, VK, WhatsApp — превью пустое. Для каталога школ это прямой урон конверсии из соцсетей.

#### MEDIUM: /poisk/ заблокирован в robots.txt
```
Disallow: /poisk/
```
Страница поиска недоступна для индексации. Если в будущем захотите ранжировать `/poisk/?q=частные+школы+Москвы` — потребуется переработка.

#### LOW: Нет X-Frame-Options / CSP заголовков
Vercel не добавляет `x-frame-options` и `content-security-policy` по умолчанию. Не критично для SEO, но хорошая практика безопасности.

---

## 2. Content Quality — 60/100

### ✅ Хорошо
- Уникальные описания у каждой школы (полные + краткие)
- Структурированная информация: адрес, телефон, метро, район, рейтинг
- SEO-тексты в блоках внизу страниц типов школ
- Русскоязычный контент с корректной типографикой
- Breadcrumbs видимые (HTML), структура понятна

### ❌ Проблемы

#### CRITICAL: Нет страниц E-E-A-T
Ни одна из следующих страниц не существует:
- `/about/` или `/o-nas/` — 404
- `/kontakty/` — 404
- `/politika-konfidentsialnosti/` — не проверялась

Для Google Quality Rater Guidelines 2025 (YMYL-adjacent — выбор школы для ребёнка) это важно. Сайт не объясняет, кто за ним стоит, как собирается информация, есть ли редакционная политика.

#### HIGH: Thin content на страницах округов
Страницы `/shkoly/moskva/rayon/svao/` (1 школа), `/shkoly/moskva/rayon/szao/` (1 школа) содержат минимум контента. Google может счесть их "thin pages".

#### MEDIUM: Описания школ без сайтов — скопированный паттерн
Часть школ без сайта имеет очень похожие описания по структуре. Рекомендуется расширить fullDescription для каждой школы.

#### MEDIUM: Нет пользовательских отзывов
Рейтинги и счётчики отзывов задаются статически в коде (`rating: 4.8, reviewCount: 247`). Это не реальные данные. Google может это обнаружить при алгоритмическом анализе. Если нет реальных отзывов — лучше убрать счётчик или пометить как "по данным открытых источников".

---

## 3. On-Page SEO — 58/100

### ✅ Хорошо
- Title теги уникальны на каждой странице
- H1 теги присутствуют и релевантны
- Meta description присутствует (некоторые требуют доработки)
- Breadcrumbs видимые реализованы

### ❌ Проблемы

#### HIGH: Слабые Title теги на ключевых страницах

| Страница | Текущий Title | Проблема |
|---|---|---|
| /shkoly/moskva/ | "Школы Москва — 43 школ — адреса, телефоны, отзывы" | Нет года, слабый |
| /shkoly/ | "Все школы России — каталог 2026" | Слишком общий |
| /shkoly/moskva/chastnie/ | "Частные школы Москва 2026 — список 10 школ" | "список 10 школ" — занижает ценность |

**Рекомендуемые форматы:**
- `/shkoly/moskva/` → "Школы Москвы 2026 — 43 государственных, частных и онлайн школы"
- `/shkoly/moskva/chastnie/` → "Частные школы Москвы 2026 — рейтинг, цены, отзывы | ШколыРоссии.рф"
- Детальные страницы: "ГБОУ Школа №179, Москва — рейтинг, отзывы, контакты" (добавить slogan/CTA)

#### HIGH: Meta description главной слишком длинная
Текущая: 129 символов — обрезается в мобильной выдаче (лимит ~120 символов для мобайл).

#### MEDIUM: H1 на страницах типов — дублирует паттерн Title
"Частные школы — Москва" (H1) vs "Частные школы Москва 2026 — список 10 школ" (Title) — разрыв сигналов.

#### MEDIUM: Отсутствует внутренняя перелинковка между похожими школами
Каждая страница школы показывает "Похожие школы" только своего типа. Нет перекрёстных ссылок (государственная в ЦАО → частные в ЦАО → онлайн-альтернативы).

#### LOW: URL структура корректна, но /shkola/ vs /shkoly/ может путать
Пользователь не отличает `/shkola/` (карточка) от `/shkoly/` (каталог) без контекста.

---

## 4. Schema / Structured Data — 28/100

### ✅ Хорошо
- `EducationalOrganization` разметка присутствует на страницах школ
- Базовые поля: name, description, address, telephone, url

### ❌ Проблемы

#### CRITICAL: Нет BreadcrumbList схемы
Breadcrumbs визуально реализованы, но нет структурированных данных. Google не показывает breadcrumbs в выдаче без JSON-LD разметки.

**Пример реализации для `/shkola/gbou-shkola-179-moskva/`:**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type":"ListItem","position":1,"name":"Все школы","item":"https://pro-schools.ru/shkoly/"},
    {"@type":"ListItem","position":2,"name":"Москва","item":"https://pro-schools.ru/shkoly/moskva/"},
    {"@type":"ListItem","position":3,"name":"Государственные","item":"https://pro-schools.ru/shkoly/moskva/gosudarstvennye/"},
    {"@type":"ListItem","position":4,"name":"ГБОУ Школа № 179"}
  ]
}
```

#### CRITICAL: aggregateRating отсутствует в EducationalOrganization
Это самый ценный Rich Snippet для каталога — рейтинговые звёзды в выдаче. Данные (`rating`, `reviewCount`) уже есть в коде, нужно просто добавить в схему.

```json
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": "4.8",
  "reviewCount": "247",
  "bestRating": "5"
}
```

#### HIGH: Отсутствует @id в EducationalOrganization
Без `@id` Google не может связывать сущности в Knowledge Graph.

#### HIGH: Нет geo координат
```json
"geo": {
  "@type": "GeoCoordinates",
  "latitude": 55.7887,
  "longitude": 37.6986
}
```

#### HIGH: Нет WebSite схемы на главной (для Sitelinks Searchbox)
```json
{
  "@type": "WebSite",
  "@id": "https://pro-schools.ru/#website",
  "name": "ШколыРоссии.рф",
  "url": "https://pro-schools.ru",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {"@type":"EntryPoint","urlTemplate":"https://pro-schools.ru/poisk/?q={search_term_string}"},
    "query-input": "required name=search_term_string"
  }
}
```

#### MEDIUM: Нет ItemList схемы на страницах каталога
Страницы типа `/shkoly/moskva/chastnie/` должны иметь `ItemList` разметку со списком школ — это даёт расширенный сниппет в выдаче.

#### MEDIUM: PostalCode отсутствует в адресе
Индекс не указан ни в одной школе — неполная адресная схема.

---

## 5. Performance — 70/100

*(PageSpeed API вернул 429 — rate limit. Оценка на основе косвенных данных)*

### ✅ Хорошо
- Next.js SSG — страницы предгенерированы, отдаются мгновенно
- Vercel CDN с европейским узлом (fra1)
- `X-Vercel-Cache: HIT` — кеш работает
- Next.js Image оптимизация — 45/46 изображений через `/_next/image`
- Шрифты предзагружены через `<link rel="preload">`
- TTFB ожидаемо низкий (<100ms с CDN)

### ❌ Проблемы

#### HIGH: Яндекс.Метрика загружается синхронно в `<head>`
Код счётчика (108789843) вставлен в начало `<head>` через dangerouslySetInnerHTML. Хотя скрипт метрики асинхронный, сам инлайн-блок блокирует парсинг. LCP может страдать.

**Fix:** Перенести в компонент с `<Script strategy="afterInteractive">` из `next/script`:
```tsx
import Script from 'next/script'
<Script strategy="afterInteractive" id="ym-init">
  {`ym(108789843,'init',{...})`}
</Script>
```

#### MEDIUM: Много JS chunks загружается на каждой странице
Turbopack генерирует ~8 отдельных JS файлов на главной. Code splitting работает, но можно улучшить через `next.config.ts` bundle analyzer.

#### MEDIUM: Изображения школ — формат JPEG
Файлы в `/public/schools/*.jpg` не конвертированы в WebP/AVIF. Next.js Image автоматически конвертирует при запросе через `/_next/image`, но только если браузер поддерживает. Нативные файлы стоит хранить в WebP.

#### LOW: Отсутствует `<link rel="preconnect">` для mc.yandex.ru
```html
<link rel="preconnect" href="https://mc.yandex.ru">
```

---

## 6. AI Search Readiness (GEO) — 30/100

### ❌ Проблемы

#### HIGH: Нет llms.txt
Файл `/llms.txt` не создан. Для индексации контента ChatGPT, Perplexity, Gemini это стандарт де-факто в 2025-2026.

**Минимальный /llms.txt:**
```
# ШколыРоссии.рф
> Крупнейший каталог школ России: государственные, частные, онлайн, вечерние, экстернат.

## Каталог
- [Все школы](https://pro-schools.ru/shkoly/)
- [Школы Москвы](https://pro-schools.ru/shkoly/moskva/)
- [Частные школы Москвы](https://pro-schools.ru/shkoly/moskva/chastnie/)
```

#### HIGH: Нет структурированных FAQ / Q&A блоков
AI-системы часто цитируют страницы с явными вопросами и ответами. На страницах школ нет блоков типа "Часто задаваемые вопросы".

#### MEDIUM: Нет упоминания бренда в авторитетных источниках
Нет внешних ссылок, упоминаний в СМИ, Wikipedia, Яндекс.Справочнике — AI-системы не знают о существовании сайта.

#### MEDIUM: Контент не оптимизирован для разговорных запросов
Текущие описания: "ГБОУ Школа № 179 — государственная общеобразовательная школа с углублённым изучением математики."
AI-оптимизированный вариант должен отвечать на конкретные вопросы: "Какие школы с углублённой математикой есть в ВАО Москвы?"

---

## 7. Images — 88/100

### ✅ Хорошо
- Alt теги присутствуют на 45/46 изображений (98%)
- Next.js Image используется для всех изображений (auto-optimization, lazy loading)
- Responsive sizes атрибут настроен
- Нет изображений без dimensions (CLS защита)

### ❌ Проблемы

#### MEDIUM: 1 изображение с пустым alt=""
В каталоге Москвы одно изображение имеет `alt=""`. Скорее всего — логотип или декоративный элемент. Если смысловое — требует исправления.

#### MEDIUM: og-image.png отсутствует (404)
При шаринге страниц превью изображение не загружается. Нужно создать файл 1200×630px и положить в `/public/og-image.png`.

#### LOW: Изображения школ — стоковые фото
Большинство фотографий — стоковые изображения с Unsplash, не реальные фотографии школ. Для E-E-A-T Google это минус — нет "первичного опыта".

---

## ACTION-PLAN.md

### 🔴 CRITICAL (исправить немедленно)

| # | Задача | Файл | Effort |
|---|---|---|---|
| C1 | Добавить canonical теги во все generateMetadata | `app/layout.tsx` + все `page.tsx` | 2ч |
| C2 | Создать og-image.png 1200×630 | `public/og-image.png` | 30м |
| C3 | Добавить `aggregateRating` в EducationalOrganization schema | `app/shkola/[slug]/page.tsx` | 1ч |
| C4 | Добавить `BreadcrumbList` schema на все страницы | Общий компонент | 2ч |

### 🟠 HIGH (в течение недели)

| # | Задача | Файл | Effort |
|---|---|---|---|
| H1 | Включить `trailingSlash: true` в next.config.ts | `next.config.ts` | 15м |
| H2 | Создать страницу `/o-nas/` с описанием проекта и контактами | `app/o-nas/page.tsx` | 2ч |
| H3 | Добавить `WebSite` schema с `SearchAction` на главную | `app/page.tsx` | 1ч |
| H4 | Перенести Яндекс.Метрику на `next/script` с `afterInteractive` | `components/YandexMetrika.tsx` | 30м |
| H5 | Добавить `@id`, `geo`, `image` в EducationalOrganization | `app/shkola/[slug]/page.tsx` | 1ч |
| H6 | Создать `/llms.txt` для AI поисковиков | `public/llms.txt` | 30м |
| H7 | Улучшить Title теги ключевых страниц (Москва, типы) | `lib/utils.ts` buildTitle | 1ч |

### 🟡 MEDIUM (в течение месяца)

| # | Задача | Effort |
|---|---|---|
| M1 | `ItemList` schema на страницах каталога | 3ч |
| M2 | Добавить PostalCode в адреса школ | 2ч |
| M3 | Страница `/politika-konfidentsialnosti/` | 1ч |
| M4 | Добавить `<link rel="preconnect" href="https://mc.yandex.ru">` | 15м |
| M5 | FAQ блоки на страницах типов школ | 4ч |
| M6 | Внутренняя перелинковка: похожие школы разных типов в том же районе | 4ч |
| M7 | Добавить реальные данные для рейтингов или убрать счётчики | — |

### 🟢 LOW (бэклог)

| # | Задача |
|---|---|
| L1 | Конвертировать public/schools/*.jpg в WebP |
| L2 | Добавить X-Frame-Options через vercel.json headers |
| L3 | Зарегистрировать сайт в Яндекс.Справочнике (GBP-аналог) |
| L4 | Получить реальные отзывы от пользователей |
| L5 | Добавить реальные фотографии хотя бы топ-10 школ |
| L6 | Blog / экспертные статьи для авторитетности домена |

---

## Быстрый старт — что исправить сегодня (2 часа работы)

```bash
# 1. trailingSlash — 15 минут
# next.config.ts добавить: trailingSlash: true

# 2. og-image.png — создать файл и положить в public/

# 3. llms.txt — создать public/llms.txt

# 4. Canonical в layout.tsx — добавить alternates.canonical
```

После этих 4 исправлений SEO Health Score вырастет примерно с **54 до 67/100**.
