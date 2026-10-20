import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  regionSlugs, regionLabels, regionLabelsIn,
  getSchoolsByRegionAndType, RegionSlug,
} from '@/data/schools'
import ProgCityExtras from '@/components/ProgCityExtras'
import CatalogClient from '../../CatalogClient'

function ProgrammingRegionSeoBlock({ regionIn, count }: { regionIn: string; count: number }) {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '8px 0 48px', color: '#374151', fontFamily: 'var(--font-manrope, system-ui)' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1814', margin: '0 0 8px', lineHeight: 1.3 }}>
          Школы программирования {regionIn}
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.75, margin: 0, color: '#4B5563' }}>
          {count > 0 ? `В каталоге ${count} очных школ и клубов программирования для детей ${regionIn}. Сравните адреса и доступные контакты, затем уточните у выбранного филиала возраст набора, расписание и программу. В разных школах могут быть Scratch, Python, создание игр, веб-разработка и робототехника.` : `Очных детских школ программирования ${regionIn} в каталоге пока нет. Ниже можно выбрать онлайн-занятия и посмотреть общеобразовательные школы с IT-классами отдельным списком.`}
        </p>
      </div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1814', margin: '0 0 8px', lineHeight: 1.3 }}>
          Что отличает хорошую IT-школу
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.75, margin: 0, color: '#4B5563' }}>
          Уточните программу конкретного филиала: возраст группы, число занятий, работу с ошибками и проект первого месяца. Для младших детей важнее возможность сделать свою игру или историю, для подростков — самостоятельная работа с кодом. Попросите показать проекты учеников и условия пропуска занятий. Партнёрства и результаты олимпиад проверяйте по документам школы, а не по общим обещаниям.
        </p>
      </div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1814', margin: '0 0 8px', lineHeight: 1.3 }}>
          С какого класса начинать программирование
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.75, margin: 0, color: '#4B5563' }}>
          Детские школы программирования берут с 6–7 лет: младшим дают Scratch и визуальные языки, с 10–12 лет — Roblox, Minecraft и первые шаги в Python, с 13 лет — «взрослые» языки и проекты. Профильный IT-класс относится к общеобразовательной программе; это другой формат, его школы вынесены в отдельный список.
        </p>
      </div>
    </div>
  )
}

interface Props {
  params: Promise<{ region: string }>
}

export function generateStaticParams() {
  return regionSlugs.map(region => ({ region }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region } = await params
  if (!regionSlugs.includes(region as RegionSlug)) return {}
  const r = region as RegionSlug
  const regionIn = regionLabelsIn[r]
  const count = getSchoolsByRegionAndType(r, 'programmirovanie').filter(s => !s.remoteOnly).length
  const w = count % 10 === 1 && count % 100 !== 11 ? 'школа' : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20) ? 'школы' : 'школ'
  const title = count > 0
    ? `Школы программирования для детей ${regionIn} 2026: ${count} ${w} — адреса и контакты`
    : `Программирование для детей ${regionIn} — онлайн-курсы`
  const description = count > 0
    ? `${count} ${w} программирования для детей ${regionIn}: адреса и контакты очных школ и клубов. Сравните программы по возрасту, языку и формату, посмотрите онлайн-курсы.`
    : `Очных детских школ программирования ${regionIn} в каталоге пока нет. Выберите онлайн-курс для ребёнка или подростка по возрасту, языку и формату занятий.`
  return {
    title,
    description,
    alternates: { canonical: `https://pro-schools.ru/shkoly/${r}/programmirovanie/` },
    openGraph: { title, description, url: `https://pro-schools.ru/shkoly/${r}/programmirovanie/` },
    // IT-классы не заменяют очные школы дополнительного образования.
    ...(count === 0 ? { robots: { index: false, follow: true } } : {}),
  }
}

const w2 = (n: number) => n % 10 === 1 && n % 100 !== 11 ? 'школа' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'школы' : 'школ'

export default async function ProgrammirovaniePage({ params }: Props) {
  const { region } = await params
  if (!regionSlugs.includes(region as RegionSlug)) notFound()
  const r = region as RegionSlug
  const regionName = regionLabels[r]
  const regionIn = regionLabelsIn[r]
  const count = getSchoolsByRegionAndType(r, 'programmirovanie').filter(s => !s.remoteOnly).length

  const extras = <ProgCityExtras region={r} count={count} />

  return (
    <CatalogClient
      initialRegions={[r]}
      initialTypes={['programmirovanie']}
      lockRegion
      lockType
      title={`Школы программирования для детей ${regionIn}`}
      subtitle={count > 0 ? `${count} ${w2(count)} и клубов — адреса и контакты` : 'Очных школ в каталоге пока нет — выберите онлайн-занятия ниже'}
      breadcrumbs={[
        { label: 'Все школы', href: '/shkoly/' },
        { label: regionName, href: `/shkoly/${r}/` },
        { label: 'Программирование' },
      ]}
      seoContent={<>{extras}<ProgrammingRegionSeoBlock regionIn={regionIn} count={count} /></>}
    />
  )
}
