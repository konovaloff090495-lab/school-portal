<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Сквозная навигация — обязательное правило (20.10.2026)

Единые шапка и подвал утверждены Дмитрием для ВСЕХ страниц и будущих макетов.
Канонический источник: `src/site-navigation/chrome.json`; общие стили/поведение:
`public/site-navigation/`. Интеграция и правила: `docs/navigation/README.md`.
React получает Header/Footer из root layout. Статические курсы и программирование
читают тот же JSON. Новые генераторы и макеты в любых сессиях используют эти же
фрагменты и ресурсы, а не собственную копию и не старые courses/design/chrome/*.
Перед выкладкой запускать `python3 scripts/check-navigation.py`; новый рендерер
добавлять в эту проверку. Город называется «Ваш город», поиск отделён от меню.
