import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'О каталоге школ России — ШколыРоссии.рф',
  description: 'ШколыРоссии.рф — справочник государственных, частных, онлайн и вечерних школ России. Актуальные адреса, телефоны, описания и рейтинги.',
  alternates: { canonical: 'https://pro-schools.ru/o-nas/' },
}

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <nav className="text-sm text-gray-400 mb-8">
        <Link href="/" className="hover:text-[#0369A1]">Главная</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">О каталоге</span>
      </nav>

      <h1 className="text-3xl font-bold text-[#0F172A] mb-6">О каталоге ШколыРоссии.рф</h1>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
        <p className="text-lg">
          <strong>ШколыРоссии.рф</strong> (pro-schools.ru) — независимый справочник школ России.
          Мы собираем актуальную информацию о государственных, частных, онлайн-школах,
          вечерних учреждениях и центрах экстерного обучения.
        </p>

        <h2 className="text-xl font-semibold text-[#0F172A] mt-8">Что есть в каталоге</h2>
        <ul className="space-y-2 list-disc list-inside">
          <li>Адреса и телефоны школ</li>
          <li>Описание программ и особенностей</li>
          <li>Стоимость обучения (для платных учреждений)</li>
          <li>Станции метро и районы Москвы</li>
          <li>Рейтинги и сравнительные характеристики</li>
          <li>Возможность оставить заявку на консультацию</li>
        </ul>

        <h2 className="text-xl font-semibold text-[#0F172A] mt-8">Регионы</h2>
        <p>
          Сейчас в каталоге представлены школы <Link href="/shkoly/moskva/" className="text-[#0369A1] hover:underline">Москвы</Link>,{' '}
          <Link href="/shkoly/moskovskaya-oblast/" className="text-[#0369A1] hover:underline">Московской области</Link>{' '}
          и <Link href="/shkoly/novosibirsk/" className="text-[#0369A1] hover:underline">Новосибирска</Link>.
          Мы постоянно расширяем географию.
        </p>

        <h2 className="text-xl font-semibold text-[#0F172A] mt-8">Контакты</h2>
        <p>
          По вопросам размещения информации, обновления данных или рекламного сотрудничества
          пишите на почту:{' '}
          <a href="mailto:info@pro-schools.ru" className="text-[#0369A1] hover:underline font-medium">
            info@pro-schools.ru
          </a>
        </p>

        <h2 className="text-xl font-semibold text-[#0F172A] mt-8">Актуальность данных</h2>
        <p>
          Информация о школах собирается из открытых источников: официальных сайтов учебных
          заведений, государственных реестров и публичных справочников. Если вы обнаружили
          неточность — сообщите нам по электронной почте, мы оперативно исправим.
        </p>
      </div>

      <div className="mt-10 pt-8 border-t border-gray-200 flex gap-4">
        <Link
          href="/shkoly/"
          className="bg-[#0369A1] hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
        >
          Перейти в каталог
        </Link>
        <a
          href="mailto:info@pro-schools.ru"
          className="border-2 border-gray-200 hover:border-[#0369A1] text-[#0F172A] px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
        >
          Написать нам
        </a>
      </div>
    </div>
  )
}
