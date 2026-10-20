# Добавление школы

Публичная форма: `/dobavit-shkolu/`; личная заявка: `/dobavit-shkolu/zayavka/`.
Модерация: `/admin/shkoly/`, вход существующим ADMIN_SECRET (httpOnly-сессия8ч).
Общие Header/Footer из root layout; CTA «Добавить школу» в общем подвале.

## Хранение и доступ

`/var/lib/school-portal/school-submissions/` на VPS, вне public и git. Каталог700,
SQLite/фото/ключ600. Сохранять весь каталог при резервном копировании, особенно
файл secret: от него зависят личные ссылки. Деплой эту папку не трогает.
SQLite: applications, audit, mail, limits. Фото: photos/<random-id>/<random-file>.jpg.
Изображения декодируются через sharp, ограничены8фото/5МБ на обработанное,
40Мп входных пикселей; поворот EXIF и уменьшение до1800×1400, метаданные удаляются.
Неодобренные фото доступны только владельцу/администратору. Публикация выдаёт
публичный доступ только снимкам одобренной версии. Новые правки её не снимают.

Личные ссылки используют случайный id+HMAC256 в URL fragment, обмен на httpOnly
cookie через POST и удаление fragment. Токен чтения сам по себе НЕ подтверждает
почту: отдельный HMAC confirm находится только в письме. Подписка подтверждается
ещё одним HMAC subscribe, отдельно от почты заявки. GET не принимает решения.
На форме/личной странице/админке не подключаются Метрика, РСЯ и сторонний чат.
Origin проверяется у изменений; One-Click отписка имеет отдельный scopedтокен.
Лимиты сохраняются вSQLite: новые заявки/IP/email, загрузки, повторы и входы.

## Путь заявки

unconfirmed → pending → published / changes / rejected. Решение доступно только
подтверждённой pending-заявке. Замечания обязательны для доработки/отклонения.
Повторная подача сохраняет файлы и обновляет черновик. live_data/live_photos
меняются исключительно при одобрении. В каталоги передаются только публичные поля.
Новые школы доступны в существующем `/shkola/s-<id>/`, общем каталоге и фильтрах,
а также динамическом /sitemap-school-submissions.xml (он объявлен в robots.txt; основной sitemap обслуживает статический генератор). Нулевые рейтинги и выдуманные отзывы не создаются.

Форма вызывает общий submitLead с crm:false. В учебную CRM Синергии, родительскую
рассылку и журнал родительских лидов представители школ не попадают.

## Письма

Изменение состояния и постановка письма в очередь — одна транзакция. Планировщик:
`NODE_ENV=production SCHOOL_SUBMISSIONS_DIR=/var/lib/school-portal/school-submissions /usr/bin/python3 /var/www/school-portal/scripts/school-submissions.py mail-run`
Запуск раз в минуту, отдельный cron. flock, lease10мин, до10писем/запуск,
100/сутки; повтор с backoff, после8ошибок failed. Message-ID устойчив к повтору.
SMTP smtp.beget.com:465, hello@pro-schools.ru, пароль PROSCHOOLS_SMTP_PASSWORD
из существующего .env.local. Статус sent означает SMTP-принятие, не доказанную доставку.

Письма: confirm,pending,changes,published,rejected. Рассылка школам: отдельное
согласие → отдельное письмо подтверждения → советы, затем проверка актуальности
через14дней. List-UnsubscribeOne-Click и ссылка отписки; служебные статусы сохраняются.
Владелец видит статусы писем, историю и оценку1–5/комментарий в модерации.
После подтверждения заявки — уведомление в существующий Telegram владельца.

Проверки: `python3 scripts/test-school-submissions.py`; после сборки
`node scripts/test-school-submissions-http.mjs` (изолированные тестовые данные,
3фото, права доступа, подтверждение, модерация/публикация, оценка/подписка).
Cloud workflow build-release выполняет обе проверки. Локально productionbuild не нужен.

Статические копии chrome обновляются `python3 scripts/navigation/sync-chrome.py`:
меняются только два wrapper, прочее содержимое остаётся побайтно прежним.
Живые releases курсов/программирования/афиши обновлять через отдельные копии и
атомарное переключение симлинков; не заменять liveконтент старым локальным каталогом.

Release packaging snapshots .next before the isolated production HTTP test starts:
that test generates a synthetic approved school response in the ISR cache. The
archive is uploaded only after the test passes; synthetic responses are excluded.

The shared navigation first-visit city nudge is suppressed on representative
submission/status/moderation pages; the manual city selector remains available.

## Telegram moderation (primary workflow, 20 October 2026 correction)
The owner receives private photo uploads, a full application TXT attachment and
an inline card in @pro_schools_bot, with Publish / Reject buttons. No cabinet or
admin key is required. Reply to a pending card to return it for changes; reply to
a rejected card to specify the reason. Each decision queues the owner's status mail.
Only the configured positive private TELEGRAM_CHAT_ID/TELEGRAM_ADMIN_ID can act.
Callbacks bind to the actual sent message, application and revision; stale cards
cannot approve new changes. Decisions and reply updates are idempotent.
Webhook: POST /api/school-submissions/telegram/ requires the Telegram secret header,
HMAC derived from the existing private store secret. Register with setWebhook using
allowed_updates callback_query/message, without dropping pending updates. Never
replace an unrelated webhook or expose the secret in a URL or logs.
The immediate detached notifier has a durable cron fallback: run school-submissions.py
telegram-run every minute, NODE_ENV=production and the same private store. Private
photos are sent as multipart bytes; no unauthenticated preview links are created.
Cards/attempts/progress live in telegram_cards; delivery retries with backoff and flock.
An existing confirmed pending application is picked up automatically after deployment.
The web admin remains a fallback; Telegram is the normal moderation path.

Usability scores/comments also go to the owner in Telegram, once per changed answer.

Telegram revision guards use a monotonic server-side application revision, not a
client request ID. Reusing an old request ID cannot revive an old approval button.
The existing database gains this counter through an additive migration.
