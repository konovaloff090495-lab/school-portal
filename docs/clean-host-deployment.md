# Публикация после переноса 24.10.2026

Прод: portfolio-admin@155.212.140.76, ключ ~/.ssh/portfolio_security_20261024. Root SSH выключен. Служба portfolio-site@proschools слушает 127.0.0.1:3197, HTTPS завершает Nginx. Код: /srv/portfolio/proschools/current. Старый 45.80.70.209 временно пересылает HTTPS посетителей со старым DNS-кэшем; на нём остались другие приложения. Не удалять его без отдельного переноса этих приложений. Старый deploy.sh остановлен до замены безопасным процессом.

Собирать ручным GitHub Actions build-release.yml. Проверить успешные тесты, SHA256SUMS, BUILD_ID и SOURCE_COMMIT. Перед выкладкой сравнить src/content/data/config/package/public этого коммита с текущим HEAD. Передавать артефакт потоком на сервер; не обходить ограничения mac_build_guard и не передавать рабочему серверу GitHub-токен.

Развернуть точные исходники и готовую .next в отдельный /srv/portfolio/proschools/releases/<выпуск>. Применить scripts/deploy/prepare-release.py к реальному пути выпуска. Нужны JSON-зависимости next.config.ts из scripts/seo, scripts/removed-schools.json, scripts/crm-mailer.py, scripts/school-submissions.py и scripts/school-submissions-telegram.py. Зависимости должны соответствовать package-lock.json. На рабочем VPS не собирать.

Код принадлежит root, пользователь сайта не имеет записи. Изменяемые данные и кэш — /var/lib/portfolio/proschools; секреты — /etc/portfolio/proschools/runtime.env, root:site-proschools 0640. Не помещать секреты в Git, URL, журналы или файлы внутри выпуска.

Проверить кандидат на отдельном loopback-порту с временной очередью и отключёнными уведомлениями. Атомарно переключить current и перезапустить только portfolio-site@proschools. Проверить холодные страницы, оформление, sitemap, закрытые служебные пути и вход администратора. После смены Next обновить объединённый programming sitemap из native sitemap на порту 3197.

**Не удалять security-20261024:** текущий review-security-20261024 использует его node_modules и public через ссылки. Очистка должна учитывать зависимости между выпусками.

Статические разделы — /srv/portfolio/proschools/static; генераторы — static-runtime, отдельный пользователь site-proschools-publisher. Таймеры portfolio-free-lessons, portfolio-courses, portfolio-crm-mailer, portfolio-school-submissions заменяют прежний cron.

Конкурс изолирован пользователем site-education-gifts, данные /var/lib/portfolio/education-gifts, службы portfolio-gifts@app-server и portfolio-gifts@poll. Не запускать второй опрос Telegram с тем же токеном; смена ключей шифрования требует проверенного переноса базы.

portfolio-live-backup ежедневно в 03:20 UTC + до 15 минут копирует DELA MBA/Card Open с shared Beget, ProSchools с чистого VPS. Selectel: шифрование до загрузки, COMPLIANCE минимум 30 дней. Не запускать prune/forget/delete. Проверка: portfolio-backup-status. Полная копия всего Mac и всех 58 проектов ещё не завершена из-за ограничений ресурсов.

## Внутренний поиск: исключение из выдачи

`/poisk/` и все варианты `?q=` отдают `X-Robots-Tag: noindex, follow` на Nginx.
В robots.txt обход разрешён, чтобы поисковик прочитал этот заголовок. Поиск для
посетителей сохраняется. Идемпотентный установщик: `scripts/seo/install-search-indexing.py`
(запуск root на чистом сервере). Он сохраняет обе исходные конфигурации в
`/var/backups/portfolio/search-indexing-*`, проверяет `nginx -t`, перезагружает
только Nginx и обновляет фактически обслуживаемый robots.txt. Next не пересобирается.
При замене Nginx-конфигурации сохранять блок `PROSCHOOLS_SEARCH_NOINDEX`.
