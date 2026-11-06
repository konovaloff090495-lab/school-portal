# ProSchools career release

`python3 scripts/career/build.py` renders content/career/pages.json using the canonical header/footer from src/site-navigation/chrome.json. `node scripts/career/compile-client.mjs` compiles the canonical submitLead/leadContext/leadProfile/phone modules with installed TypeScript and copies client.js. Run build, compile, then build again before taking the final manifest so it covers all compiled assets.

Output: work/career/release/. Exact static public routes are the new pages in release-manifest.json. The nine existing blog pages are **not** in the static release or career sitemap: their original templates/forms/metadata remain active. Read-only HTML previews are emitted separately under work/career/existing-preview/. Root deployment appends authored career sections to the original runtime JSON. /test/ and /test/extended/ remain intact.

Support routes: /proforientaciya/karta-interesov/, /proforientaciya/rezultat/, and two legal pages from content/career/legal-pages.json. Support routes are noindex and outside the career sitemap. Questions and original printable worksheets are copied into career-assets/. Test/result/legal pages load privacy-navigation.js, never the regular navigation runtime, Metrika or ads. All fonts and assets are first-party. Exact headers and CSP are configured by the deployment owner.

Client only stores question progress, age/class and original visit attribution in sessionStorage. It does not store email, name, phone, answers in localStorage or recovery tokens in browser storage. Recovery links use a fragment token, exchanged for an HttpOnly cookie and removed from the URL immediately. Stable per-result/per-offer request UUIDs, the originating public landing, and the save receipt's result ID and boolean mail_sent may be stored in sessionStorage to accurately report service-mail delivery on the next page. Contacts are never included in analytics.

All contact mutations call src/lib/submitLead.ts. Legacy LeadPayload still returns boolean and follows its unchanged legacy saveLeadProfile behavior. The explicit career overload returns a structured receipt: result_save calls only /api/career/results/; partner_request calls only /api/career/partner/. New flows do not call saveLeadProfile. Non-lead GET/access/deletion calls use the separate authenticated Career API. Server scoring, offer age/configuration filters and CRM delivery are owned by scripts/career/service/.

The UI starts with exact age 10–18 and grade 5–11, then 24 original interest questions. Unknown responses are preserved as null. The contact gate is disclosed before answering; only a confirmed adult can save. Default PD consent is selected, marketing is optional and off. The result is loaded from the authenticated server, never reconstructed as a fake success. Available partner offers are fetched from the server; a separate form names the selected legal recipient, validates phone, and submits only the chosen offer. Pending/sending/delivered/uncertain/rejected/configuration_error states are distinguished; uncertain delivery is not retried blindly.

Browser checks must intercept all contact POST requests for failure/success UI testing or use an isolated temporary API database with fake adapters. Never send test contacts to real CRM. A real server smoke run should use only GET health, access-denied checks and source/header checks unless explicitly authorized otherwise.

First-party aggregate events use POST /api/career/events/ with credentials omitted and no referrer. Only event enum, random event UUID, public landing path, optional grade and optional offer ID are sent. There are no answers, result/session IDs, recovery tokens or contacts. Private pages never load external analytics. Test start/completion/gate IDs are stable to deduplicate reloads; partner views are deduplicated within the page.

## Опубликовано 06.11.2026

Раздел: https://pro-schools.ru/proforientaciya/ . Версия20261106.1.
60 новых индексируемых страниц, 9 нативных дополнений блога, прежний `/test/` сохранён,
4 служебные noindex-страницы, 69 редактируемых печатных бланков.
Выпуск: `/srv/portfolio/proschools/static/career/current`.
Nginx: `/etc/nginx/snippets/proschools-career.conf`. API8795, systemd `proschools-career`.
Бэкап перед переключением: `backups/release-20261106-101131`.

Контент включён в sitemap-career.xml и общий sitemap index; поиск дополнен69 записями с сохранением остальных записей.
Общая шапка не перестраивалась: вход через девять существующих статей, поиск, перелинковку и локальную навигацию.
Оригинальные параграфы, метаданные, шаблоны и формы девяти статей сохранены.
Независимые исходные снимки в `content/career/originals`; нативные content/blog JSON обновлены для следующих релизов.

Рендер не зависит от каталога исследования: plan.json, questions.json и hero-art.html включены в исходники.
Генератор контента читает план и снимки, не перезаписывает нативные статьи.
prepare-release.py создаёт явные дополнения для девяти статей.
deploy-remote.py сохраняет mode/uid/gid при атомарной записи.

Проверки: контент70/70; 40 сочетаний экрана и ширины с полной mock-воронкой;
10 API-тестов; типы изменённого транспорта; общая навигация3314 страниц.
Полный npx tsc --noEmit тоже запускался: он сообщает старые ошибки в рабочих копиях под work/,
которые общий tsconfig включает в проект. Целевая проверка изменённого транспорта проходит.
Полную проверку всего репозитория не выдавать за успешную.

Публичные HTTPS save/recovery/cookie/offers/delete прошли; сохранение создаёт0 CRM-заявок.
SMTP подтвердил приём сервисного письма. Все три CRM проверены служебными тестами;
utm_source=gerasimov_lav проверен в payload. Продажи, рост позиций и учёт вознаграждения этим не подтверждаются.
Подробные отчёты: work/career/public-check.json, production-smoke.json, public-api-smoke.json,
qa/browser-report.json. Снимки и отчёты work/ не являются публичными файлами сайта.
