import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from './CatalogClient'
import { WebSiteJsonLd } from '@/lib/schema'

// Страница с большим каталогом школ — отключаем статическую генерацию
// чтобы не превышать лимит Vercel 19 МБ для pre-rendered HTML
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: `Все школы России — каталог ${new Date().getFullYear()}`,
  description: `Полный каталог школ России: государственные, частные, онлайн, вечерние и экстернат. ${schools.length} школ с адресами, телефонами и описаниями.`,
  alternates: { canonical: 'https://pro-schools.ru/shkoly/' },
}

function MainSeoBlock({ count }: { count: number }) {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '8px 0 48px', color: '#374151', fontFamily: 'var(--font-manrope, system-ui)' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1814', margin: '0 0 8px', lineHeight: 1.3 }}>
          Как пользоваться каталогом
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.75, margin: 0, color: '#4B5563' }}>
          На портале собрано {count} школ из 16 городов России. Используйте фильтр по региону — и каталог сразу покажет только школы вашего города с актуальными контактами, описаниями и рейтингом от родителей. Затем уточните тип: государственная, частная, онлайн, гимназия, кадетский корпус или международная.
        </p>
      </div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1814', margin: '0 0 8px', lineHeight: 1.3 }}>
          Типы школ в каталоге
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.75, margin: 0, color: '#4B5563' }}>
          <strong>Государственные</strong> — бесплатно по прописке, широкая сеть. <strong>Гимназии и лицеи</strong> — конкурсный отбор, углублённые программы, высокие баллы ЕГЭ. <strong>Частные</strong> — малые классы, индивидуальный подход, платно. <strong>Онлайн-школы</strong> — аккредитованное обучение без привязки к месту, подходит для спортсменов и семей в поездках. <strong>Кадетские</strong> — военно-патриотическое воспитание и строгая дисциплина. <strong>Международные</strong> — программы IB и Cambridge, диплом для поступления в зарубежные вузы. <strong>Семейные</strong> — альтернативная педагогика в малых группах.
        </p>
      </div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1814', margin: '0 0 8px', lineHeight: 1.3 }}>
          На что обращать внимание при выборе
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.75, margin: 0, color: '#4B5563' }}>
          1. Рейтинг ЕГЭ/ОГЭ — публично доступен на сайтах региональных министерств образования, разброс между школами одного города достигает 20–30 баллов. 2. Лицензия и аккредитация — без аккредитации школа не выдаёт государственный аттестат. 3. Сменяемость учителей — стабильный педагогический коллектив важнее красивого ремонта. 4. День открытых дверей — посетите лично перед подачей документов.
        </p>
      </div>
    </div>
  )
}

export default function AllSchoolsPage() {
  return (
    <>
      <WebSiteJsonLd />
      <CatalogClient seoContent={<MainSeoBlock count={schools.length} />} />
    </>
  )
}
