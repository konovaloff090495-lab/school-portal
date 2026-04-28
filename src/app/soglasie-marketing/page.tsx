import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Согласие на получение маркетинговых материалов — ШколыРоссии.рф',
  description: 'Условия согласия на получение маркетинговых рассылок от ИП Коновалов Дмитрий Васильевич',
  robots: { index: false, follow: false },
}

export default function SoglasieMarketing() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-6">
        <Link href="/" className="text-sm text-[#0369A1] hover:underline">← На главную</Link>
      </div>

      <h1 className="text-3xl font-bold text-[#0F172A] mb-2">
        Согласие на получение маркетинговых материалов
      </h1>
      <p className="text-sm text-gray-500 mb-8">Последнее обновление: апрель 2025 г.</p>

      <div className="space-y-6 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-semibold text-[#0F172A] mb-3">1. Оператор рассылки</h2>
          <ul className="list-none pl-0 space-y-1">
            <li><strong>Наименование:</strong> ИП Коновалов Дмитрий Васильевич</li>
            <li><strong>ИНН:</strong> 890203123335</li>
            <li><strong>Сайт:</strong> <Link href="/" className="text-[#0369A1] hover:underline">pro-schools.ru</Link></li>
            <li><strong>Email:</strong> <a href="mailto:kvant.bz@yandex.ru" className="text-[#0369A1] hover:underline">kvant.bz@yandex.ru</a></li>
            <li><strong>Телефон:</strong> <a href="tel:+79824066631" className="text-[#0369A1] hover:underline">+7 (982) 406-66-31</a></li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0F172A] mb-3">2. Предмет согласия</h2>
          <p>
            Пользуясь сайтом <strong>pro-schools.ru</strong> и заполняя форму обратной связи с установленным флажком
            «Согласен(а) на получение маркетинговых материалов», я даю свободное, конкретное, информированное и
            сознательное согласие ИП Коновалов Дмитрий Васильевич (далее — Оператор) на получение рекламных,
            информационных и маркетинговых сообщений, связанных с услугами и предложениями портала ШколыРоссии.рф.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0F172A] mb-3">3. Каналы коммуникации</h2>
          <p>Согласие распространяется на получение сообщений по следующим каналам:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Электронная почта (email-рассылки)</li>
            <li>SMS и мессенджеры (WhatsApp, Telegram)</li>
            <li>Телефонные звонки с информационными предложениями</li>
            <li>Push-уведомления на устройствах (при наличии технической возможности)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0F172A] mb-3">4. Содержание сообщений</h2>
          <p>Маркетинговые материалы могут включать:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Информацию о новых школах и обновлениях каталога</li>
            <li>Специальные предложения образовательных организаций</li>
            <li>Образовательные советы и рекомендации по выбору школы</li>
            <li>Информацию о тарифах и возможностях размещения на портале</li>
            <li>Новости в сфере образования</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0F172A] mb-3">5. Обработка персональных данных</h2>
          <p>
            Для направления маркетинговых материалов Оператор обрабатывает следующие персональные данные:
            имя, номер телефона, адрес электронной почты. Обработка данных осуществляется в соответствии с
            Федеральным законом № 152-ФЗ от 27.07.2006 «О персональных данных» и{' '}
            <Link href="/politika-konfidentsialnosti/" className="text-[#0369A1] hover:underline">
              Политикой конфиденциальности
            </Link>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0F172A] mb-3">6. Срок действия согласия</h2>
          <p>
            Настоящее согласие действует бессрочно с момента его предоставления и до момента отзыва.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0F172A] mb-3">7. Отзыв согласия</h2>
          <p>
            Вы вправе в любой момент отозвать данное согласие. Для этого:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>
              Нажмите ссылку «Отписаться» в любом полученном письме
            </li>
            <li>
              Направьте письмо на{' '}
              <a href="mailto:kvant.bz@yandex.ru" className="text-[#0369A1] hover:underline">kvant.bz@yandex.ru</a>
              {' '}с темой «Отзыв согласия на маркетинговые рассылки»
            </li>
            <li>
              Позвоните по номеру{' '}
              <a href="tel:+79824066631" className="text-[#0369A1] hover:underline">+7 (982) 406-66-31</a>
            </li>
          </ul>
          <p className="mt-3">
            Отзыв согласия вступает в силу в течение 10 рабочих дней с момента получения обращения.
            Отзыв согласия на маркетинговые рассылки не влечёт отзыва согласия на обработку персональных данных
            в иных целях.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0F172A] mb-3">8. Контакты</h2>
          <ul className="list-none pl-0 space-y-1">
            <li>Email: <a href="mailto:kvant.bz@yandex.ru" className="text-[#0369A1] hover:underline">kvant.bz@yandex.ru</a></li>
            <li>Телефон: <a href="tel:+79824066631" className="text-[#0369A1] hover:underline">+7 (982) 406-66-31</a></li>
          </ul>
        </section>

      </div>
    </main>
  )
}
