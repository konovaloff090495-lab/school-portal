# Детское программирование

Официальные источники и дата проверки хранятся в src/data/programming-*-verified.json. integrate.mjs сохраняет старые адреса карточек, объединяет совпавшие филиалы и разделяет очные и онлайн-школы. Новую площадку добавлять только с проверяемым источником; рейтинг Яндекс Карт хранится отдельно от отзывов портала.

Подготовка: node scripts/programming/integrate.mjs, затем python3 scripts/programming/build.py и python3 scripts/programming/check.py. Проверить TypeScript и scripts/check-lead-forms.sh. Полную Next-сборку запускать только через общий mac_build_guard.py.

Точечная публикация: PROGRAMMING_SSH_SOCKET=<живой multiplex-сокет> python3 scripts/programming/deploy.py. Скрипт проверяет файлы, создаёт отдельный выпуск, объединяет sitemap, атомарно переключает programming-current и сверяет HTML сайта. Рабочий Next не перезапускается. Nginx обслуживает только существующие файлы каталога; остальные школы возвращаются в Next. Курсы публикуются существующим scripts/courses/deploy.py отдельно. Не выкладывать чужие незавершённые изменения.

После публикации статей обновить их ISR-кэш через /api/revalidate и выполнить на VPS programming-runtime/scripts/programming/refresh-sitemap.py. Этот же вызов подключён к publish.sh и deploy.sh, чтобы общий sitemap сохранял свежие статьи. В courses-runtime/scripts/programming должен быть link-courses.py: сборка курсов использует его для обратных ссылок.

Проверить главную, каталог очных школ, онлайн, страницы городов и направлений, пагинацию, карточку школы, курс и статью. Пустые подборки должны иметь noindex и отсутствовать в sitemap. Не обещать полный реестр всех школ России: непроверенные школы и пустые города не заполняются выдуманными данными.

## Оформление каталога и публикация после переноса, 26.10.2026

Выдача повторяет CatalogClient/SchoolCard: Inter, белый фон, синяя кнопка,
галерея 176px, карточка с границей 16px, боковая панель 256px. Общую навигацию
по-прежнему задаёт chrome.json. Поиск/рейтинг/бесплатные занятия явно действуют
на текущую HTML-страницу; выбор города открывает отдельную городскую выдачу.

На новом сервере использовать `python3 scripts/programming/publish-clean.py`.
Сначала подготовить `work/programming/runtime.json` и upstream-sitemap.xml из
актуального static-runtime, выполнить build.py/check.py и сравнить SEO/состав
выдач с текущим выпуском. Публикуются только shkoly и _programming; sitemap и
Next-страницы /shkola/ сохраняются. Выпуск переключается атомарно, при провале
проверки HTML возвращается предыдущий. build.py и assets обновляются в runtime.
Ключ/хост — из docs/clean-host-deployment.md. Старый deploy.py/install-nginx.py
для root@45.80.70.209 после переноса НЕ выполнять.
