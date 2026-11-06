# Career API — контракт и установка

Версия: 06.11.2026. Runtime: Node >=22.13, проверено локально на 25.9 и целевой сервер сообщил24.22.2. Используются встроенные node:sqlite, HTTP и crypto; новых зависимостей или платных сервисов нет. Nodemailer из существующей установки нужен только для необязательного сервисного письма. Сервис слушает127.0.0.1:8795.

## API

Все ответы JSON, private/no-store, без CORS. Необязательный source принимается только как career_result_save либо career_partner_<offer_id>; сервер фиксирует источник сам. landing допускает канонический относительный ASCII-путь, включая /blog/, без query, fragment, точек и двойных slash. visit_utm допускает gclid. Мутации требуют точный `Origin: https://pro-schools.ru`. Поля, отсутствующие в контракте, отклоняются. Предел тела16KiB. `website` — пустое поле honeypot. Request ID — UUID, создаётся клиентом один раз на действие и не меняется при повторе.

### Сохранение результата

`POST /api/career/results/`

```json
{
  "request_id": "UUID",
  "email": "parent@example.org",
  "age": 13,
  "grade": 7,
  "answers": [0,1,2,null,0,1,2,null,0,1,2,null,0,1,2,null,0,1,2,null,0,1,2,null],
  "pd_agreed": true,
  "adult_confirmed": true,
  "marketing_agreed": false,
  "landing": "/proforientaciya/5-klass/",
  "visit_utm": {"utm_source":"actual_visit_source"},
  "website": ""
}
```

Возраст10–18, класс5–11; answers — массив24значений в порядке questions.json. Сервер рассчитывает профиль сам. Сохраняется версия согласия career-2026-11-06-v1, pd_default_selected:true и marketing_default_selected:false; это не утверждение отдельного клика по ПДн. adult_confirmed должен быть явным выбором взрослого.

Ответ200: `{ok,result_id,result,recovery_url,mail_sent,duplicate}`. Никаких CRM, Telegram и прежнего welcome-письма. Новое сервисное письмо только со ссылкой на результат; при выключенной или неуспешной почте mail_sent:false. Ни сохранение email, ни HTTP-доставка письма не дают verified:true. Повтор идентичного request_id идемпотентен; изменение данных с тем же ID даёт409.

Cookie: `__Host-ps_career`; Secure, HttpOnly, SameSite=Strict, Path=/, срок30дней. Recovery URL: `/proforientaciya/rezultat/#token=<opaque>`. Токен в fragment, не query и не логе. Клиент передаёт его POST access и очищает hash до сторонних запросов. Recovery token —256-битный секрет HMAC-SHA256 под мастер-ключом с уникальным result ID; в БД только SHA256 токена. Повтор сохранения возвращает ту же ссылку без хранения её открытого значения. Срок recovery90дней от первого сохранения, результат180дней. Ключ нельзя менять без миграции: он шифрует записи и определяет токены.

### Чтение и восстановление

Авторизованный GET снова выдаёт ту же recovery_url для сохранения ссылки после перезагрузки. Срок90дней не продлевается; после него recovery_url:null. Открытый токен не сохраняется в БД или браузерном storage. Без действующей cookie GET возвращает401 и не раскрывает ссылку.

- `GET /api/career/results/current/` по cookie → `{ok,result_id,result,recovery_url,email_masked,requests:[{request_id,offer_id,status}]}`.
- `POST /api/career/access/` `{token}` → cookie и `{ok,result_id}`. Ошибка401 одинакова для неверного и истёкшего доступа.
- `GET /api/career/offers/` по cookie → `{ok,offers:[{id,partner,title,age_min,age_max,available:true}]}`. Только предложения подходящего возраста с настроенным adapter.

Result: `{version,eligible_count,domains:[{id,label,sum,known,mean,status}],top_domains:[id],profile_status,age_band,grade,completed_at,disclaimer}`. ID направлений build/research/create/help/lead/organize. Среднее0..2; неизвестные ответы исключаются, >=3из4для сравнения. Минимум4доступные шкалы для общего профиля. Все низкие<0.5 →low; все близкие →broad; недостаточно ответов →insufficient; иначе directions. В топ входят все шкалы с разницей не более0.25от максимума. Ни одна оценка не является процентом способности или пригодности.

### Заявка выбранному партнёру

`POST /api/career/partner/` по cookie:

```json
{"request_id":"UUID","offer_id":"easycode-trial","name":"Имя родителя","phone":"+79991234567","pd_agreed":true,"marketing_agreed":false,"website":""}
```

Offer IDs: easycode-trial / ukids-diagnostic / synergy-school. Сервер сам выбирает один adapter. Возраст проверяется вновь; чужой endpoint с клиента передать нельзя. Контакты и конкретное предложение — после отдельного явного действия.

Дополнительный серверный инвариант MVP: один result_id + offer_id создаёт не более одной заявки даже из разных вкладок и устройств с разными request_id. В transaction проверяются обе идентичности; повтор возвращает actual request_id ранее сохранённой заявки и её статус, не создаёт alias и не заменяет контакты. После отказа партнёра новая заявка на тот же offer в этом результате не создаётся.

Новая заявка202: `{ok,request_id,status:'pending',duplicate:false}`; повтор200 с текущим статусом иduplicate:true. GET `/api/career/requests/status/?request_id=UUID` по cookie возвращает `{ok,request_id,offer_id,status}`. Параметр содержит ID заявки, не секрет доступа. Состояния pending/sending/delivered/rejected/uncertain/configuration_error. «Заявка передана» только при delivered; pending — «Заявка сохранена». Кнопка повтора использует тот же request_id.

Durable queue: SQLite, атомарный claim перед сетевым запросом, один worker. Таймаут/ошибка транспорта →uncertain без автоматического повтора. После рестарта незавершённые sending →uncertain, не новая отправка. Pending подбираются каждые30секунд. Ukids HTTP200 с error отклоняется; delivered только с положительным CRM ID. EasyCode2xx — подтверждение приёма вебхуком. Synergy требует success и lead.id.

Партнёрская атрибуция всех трёх adapters: source=gerasimov_lav, medium=lkpartners, campaign=proschools_proforientaciya, content=landing, term=offer_id. Исходные метки визита сохраняются отдельно. Старый /sale/ adapter не меняется. В CRM нет ответов, результатов и профиля: только контакты, выбранная программа, атрибуция и receipt согласия. Реальный учёт вознаграждения требует проверки принимающей стороны.

### Обезличенные события

`POST /api/career/events/` до авторизации: `{event,event_id:UUID,landing,grade?,offer_id?}` →200`{ok:true,duplicate:boolean}`. Origin строгий, размер и rate limit как в API; дополнительный лимит80событий за10минут. Разрешены только career_landing_view, career_test_start, career_test_complete, career_gate_view, career_result_view, career_offer_view, career_offer_select. landing — относительный канонический ASCII-путь без query/hash; grade5–11; offer_id из трёх разрешённых программ. Любое дополнительное поле отклоняется.

В `event_counts` только day (Москва UTC+3), event, landing, offer_id, grade, count. Нет контактов, ответов, профиля, result/session ID и токенов. Этот endpoint не читает сессию пользователя. В отдельной таблице `event_seen` — только HMAC event_id и срок24часа для дедупликации; это не связь с результатом. Приватная страница отправляет события напрямую в этот endpoint без загрузки внешней аналитики. Новые таблицы создаются автоматически при старте; отдельная миграционная команда не нужна.

### Удаление и ошибки

- `DELETE /api/career/results/current/` либо `POST /api/career/delete/` с `{}` по cookie удаляет результат, контакты, доступ и локальные заявки. Уже отправленная CRM-заявка не отзывается автоматически; это должно быть явно указано в интерфейсе и политике.
- `GET /api/career/health/` проверяет SELECT в БД и возвращает только `{ok:true}`.
-400валидация,401доступ,403Origin,409конфликт request_id,413размер,415тип,429лимит,503adapter не настроен. Ответы не раскрывают внутреннюю ошибку, контакты или секреты.

## Установка владельцем сервера

1. Только исходные файлы .mjs и questions.json установить root-owned в `/usr/local/lib/proschools-career/`; каталогу0755, файлам0644. Test и research в production не нужны.
2. Создать `/etc/proschools-career.env`0600 по environment.example. Ключ32случайных байта сгенерировать сервером; credentials скопировать только сервером из существующих защищённых env. Не печатать значения. CAREER_NODE_MODULE_ROOT указывает существующий package.json с nodemailer. CAREER_SMTP_PASSWORD — поддерживаемое имя, также поддержан старый CAREER_SMTP_PASS.
3. Установить proschools-career.service в /etc/systemd/system, проверить путь /usr/local/bin/node. StateDirectory создаёт приватное хранилище /var/lib/proschools-career. SQLite файл0600, контакты/ответы/атрибуция зашифрованы AES-256-GCM с отдельным nonce и AAD для каждой записи. ID, сроки и статусы открытые; запросы SQL параметризованы.
4. systemctl daemon-reload && systemctl enable --now proschools-career. Unit ограничивает файловую запись StateDirectory, DynamicUser, UMask0077 и запрещает повышение привилегий. Нужен исходящий HTTPS и SMTP.
5. Nginx: точный prefix /api/career/ →127.0.0.1:8795, client_max_body_size16k, proxy_set_header X-Real-IP $remote_addr (перезаписать недоверенный входной заголовок), Host $host. Никакого логирования POST body или токенов. Страница результата приватная/noindex/no-store/no-referrer, без Webvisor и сторонних рекламных скриптов.
6. Проверить health и полную mock-воронку. Реальные тестовые лиды отправлять только по отдельной текущей команде владельца.

SMTP сбой не теряет результат. Cleanup каждые30секунд удаляет истёкшие результаты и сессии; резервные копии БД и ключа должны иметь отдельную политику хранения. Удаление относится к активному хранилищу сервиса, не даёт ложного обещания стереть стороннюю CRM или все бэкапы.

## Проверка

`node --test scripts/career/service/service.test.mjs`

10 групп интеграционных проверок:0CRMпри сохранении; выбор одного CRM; идемпотентность и конкурентная отправка; точные5UTMво всех payload; HTTP200ошибка; медленнаяCRM; uncertain без повтора; шифрование; recovery/cookie/expiry/delete; строгие Origin/schema/consent/bodylimit; телефон; null/ничьи/недостаточные данные. Всё через локальный транспорт, ни одного реального внешнего лида.

## Проверенная установка 06.11.2026

Сервис работает на действующем 90.156.159.51: systemd `proschools-career`, порт8795,
данные `/var/lib/proschools-career/career.sqlite3`, секретный env `/etc/proschools-career.env`.
Node24.22.2. Установщик копирует уже установленный nodemailer в свой каталог службы.
Чтение package.json основного Next-выпуска ограничено его группой; DynamicUser не получает к нему дополнительного доступа.
`CAREER_NODE_MODULE_ROOT=/usr/local/lib/proschools-career`.
SMTP Beget2525 с обязательным STARTTLS/TLS>=1.2. Порты465/587 с этого сервера недоступны.
Проверена реальная отправка сервисного письма (SMTP accepted), без независимого чтения входящего письма.

Три явно помеченные тестовые CRM-заявки доставлены по одной попытке:
EasyCode — вебхук2xx; Ukids — ID2198466; Synergy — ID237317.
Повтор нового UUID для того же результата и предложения вернул существующую заявку.
Временные результаты и контакты тестов удалены через API; во внешних CRM остаются три помеченные тестовые записи.
Это не пользовательские продажи и не независимый readback полей в CRM.
