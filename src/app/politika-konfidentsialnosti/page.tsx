import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Политика конфиденциальности — ШколыРоссии.рф',
  description: 'Политика обработки персональных данных ИП Коновалов Дмитрий Васильевич',
  robots: { index: false, follow: false },
}

export default function PolitikaKonfidentsialnosti() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-6">
        <Link href="/" className="text-sm text-[#0369A1] hover:underline">← На главную</Link>
      </div>

      <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Политика конфиденциальности</h1>
      <p className="text-sm text-gray-500 mb-8">Последнее обновление: апрель 2025 г.</p>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-semibold text-[#0F172A] mb-3">1. Оператор персональных данных</h2>
          <p>
            Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных
            пользователей сайта <strong>pro-schools.ru</strong> (далее — Сайт).
          </p>
          <p className="mt-3">
            Оператор персональных данных:
          </p>
          <ul className="mt-2 space-y-1 list-none pl-0">
            <li><strong>Наименование:</strong> ИП Коновалов Дмитрий Васильевич</li>
            <li><strong>ИНН:</strong> 890203123335</li>
            <li><strong>Электронная почта:</strong> <a href="mailto:kvant.bz@yandex.ru" className="text-[#0369A1] hover:underline">kvant.bz@yandex.ru</a></li>
            <li><strong>Телефон:</strong> <a href="tel:+79824066631" className="text-[#0369A1] hover:underline">+7 (982) 406-66-31</a></li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0F172A] mb-3">2. Какие данные мы собираем</h2>
          <p>При использовании Сайта и заполнении форм мы можем собирать следующие персональные данные:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Фамилия, имя, отчество</li>
            <li>Номер телефона</li>
            <li>Адрес электронной почты</li>
            <li>Иные данные, добровольно предоставленные пользователем в форме обратной связи</li>
          </ul>
          <p className="mt-3">
            Помимо этого, при посещении Сайта автоматически собираются технические данные: IP-адрес, тип браузера,
            страницы просмотра, время визита (через cookies и аналитические сервисы).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0F172A] mb-3">3. Цели обработки персональных данных</h2>
          <p>Персональные данные обрабатываются в следующих целях:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Обработка и исполнение заявок пользователей</li>
            <li>Связь с пользователем по его запросу</li>
            <li>Направление информационных и маркетинговых сообщений (при наличии согласия)</li>
            <li>Улучшение качества работы Сайта и пользовательского опыта</li>
            <li>Выполнение требований законодательства Российской Федерации</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0F172A] mb-3">4. Правовое основание обработки</h2>
          <p>
            Обработка персональных данных осуществляется на основании:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Согласия субъекта персональных данных (ст. 9 Федерального закона № 152-ФЗ от 27.07.2006)</li>
            <li>Необходимости исполнения договора или соглашения, стороной которого является субъект</li>
            <li>Требований законодательства Российской Федерации</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0F172A] mb-3">5. Передача данных третьим лицам</h2>
          <p>
            Персональные данные не передаются третьим лицам, за исключением случаев, когда:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Пользователь дал явное согласие на такую передачу</li>
            <li>Передача необходима для исполнения заявки (например, направление данных запрашиваемой школе)</li>
            <li>Это предусмотрено действующим законодательством</li>
          </ul>
          <p className="mt-3">
            Для технической обработки заявок используется сервис Formspree (США). Передача данных осуществляется
            в соответствии с условиями конфиденциальности Formspree.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0F172A] mb-3">6. Срок хранения данных</h2>
          <p>
            Персональные данные хранятся не дольше, чем того требуют цели обработки, либо в течение срока,
            установленного применимым законодательством. По истечении срока данные уничтожаются или обезличиваются.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0F172A] mb-3">7. Защита персональных данных</h2>
          <p>
            Оператор принимает необходимые правовые, организационные и технические меры для защиты персональных
            данных от неправомерного доступа, изменения, раскрытия или уничтожения. Сайт использует защищённое
            соединение HTTPS.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0F172A] mb-3">8. Права пользователя</h2>
          <p>Пользователь имеет право:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Получить информацию об обработке своих персональных данных</li>
            <li>Требовать уточнения, блокирования или уничтожения своих персональных данных</li>
            <li>Отозвать согласие на обработку персональных данных</li>
            <li>Обжаловать действия оператора в Роскомнадзор</li>
          </ul>
          <p className="mt-3">
            Для реализации прав направьте письменное обращение на:{' '}
            <a href="mailto:kvant.bz@yandex.ru" className="text-[#0369A1] hover:underline">kvant.bz@yandex.ru</a>
            {' '}с пометкой «Персональные данные».
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0F172A] mb-3">9. Cookies</h2>
          <p>
            Сайт использует файлы cookies для улучшения работы и анализа посещаемости. Пользователь может
            отключить cookies в настройках браузера, однако это может повлиять на работу некоторых функций Сайта.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0F172A] mb-3">10. Изменения в политике</h2>
          <p>
            Оператор оставляет за собой право вносить изменения в настоящую Политику. Актуальная версия всегда
            доступна на странице{' '}
            <Link href="/politika-konfidentsialnosti/" className="text-[#0369A1] hover:underline">
              pro-schools.ru/politika-konfidentsialnosti/
            </Link>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0F172A] mb-3">11. Контакты</h2>
          <p>По всем вопросам, связанным с обработкой персональных данных:</p>
          <ul className="mt-2 list-none pl-0 space-y-1">
            <li>Email: <a href="mailto:kvant.bz@yandex.ru" className="text-[#0369A1] hover:underline">kvant.bz@yandex.ru</a></li>
            <li>Телефон: <a href="tel:+79824066631" className="text-[#0369A1] hover:underline">+7 (982) 406-66-31</a></li>
          </ul>
        </section>

      </div>
    </main>
  )
}
