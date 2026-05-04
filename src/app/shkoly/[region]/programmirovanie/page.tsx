import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  regionSlugs, regionLabels, regionLabelsIn,
  getSchoolsByFeature, RegionSlug,
} from '@/data/schools'
import CatalogClient from '../../CatalogClient'

function ProgrammingRegionSeoBlock({ regionIn, count }: { regionIn: string; count: number }) {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '8px 0 48px', color: '#374151', fontFamily: 'var(--font-manrope, system-ui)' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1814', margin: '0 0 8px', lineHeight: 1.3 }}>
          Школы программирования {regionIn}
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.75, margin: 0, color: '#4B5563' }}>
          В каталоге {count} школ с IT-классами и углублённым программированием {regionIn}. Здесь собраны учебные заведения, в которых дети изучают Python, веб-разработку, робототехнику, кибербезопасность и искусственный интеллект в рамках основной образовательной программы или в формате углублённых профильных классов.
        </p>
      </div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1814', margin: '0 0 8px', lineHeight: 1.3 }}>
          Что отличает хорошую IT-школу
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.75, margin: 0, color: '#4B5563' }}>
          1. Партнёрство с реальными IT-компаниями (Яндекс, Сбер, VK) — доступ к реальным задачам и стажировкам. 2. Реальные проекты в портфолио — ученики должны заканчивать школу с GitHub-репозиторием и задокументированными проектами. 3. Результаты олимпиад по информатике — проверьте место школы в рейтингах олимпиады НТО и Всероссийской олимпиады школьников. 4. Языки и инструменты — современный стек: Python, JavaScript, Docker, Git, основы DevOps.
        </p>
      </div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1814', margin: '0 0 8px', lineHeight: 1.3 }}>
          С какого класса начинать программирование
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.75, margin: 0, color: '#4B5563' }}>
          Большинство IT-школ принимают с 5–6 класса. Логика и алгоритмическое мышление формируются в 10–13 лет — это оптимальный возраст для старта. Некоторые школы предлагают программирование с 1 класса (Scratch, визуальные языки), но углублённые курсы — с 7–8 класса. Профильный IT-класс в большинстве случаев открывается с 8–9 класса.
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
  const count = getSchoolsByFeature('it-klass', r).length
  const title = `Школы программирования ${regionIn} — ${count} школ | pro-schools.ru`
  const description = `Школы с IT-классами и углублённым программированием ${regionIn}: робототехника, веб-разработка, искусственный интеллект. Адреса, телефоны, отзывы.`
  return {
    title,
    description,
    alternates: { canonical: `https://pro-schools.ru/shkoly/${r}/programmirovanie/` },
    openGraph: { title, description, url: `https://pro-schools.ru/shkoly/${r}/programmirovanie/` },
  }
}

export default async function ProgrammirovaniePage({ params }: Props) {
  const { region } = await params
  if (!regionSlugs.includes(region as RegionSlug)) notFound()
  const r = region as RegionSlug
  const regionName = regionLabels[r]
  const regionIn = regionLabelsIn[r]
  const count = getSchoolsByFeature('it-klass', r).length

  return (
    <CatalogClient
      initialRegions={[r]}
      lockRegion
      featureFilter="it-klass"
      title={`Школы программирования ${regionIn}`}
      subtitle={
        count > 0
          ? `${count} ${count === 1 ? 'школа' : count < 5 ? 'школы' : 'школ'} с IT-классами`
          : 'Школ в базе пока нет — скоро добавим'
      }
      breadcrumbs={[
        { label: 'Все школы', href: '/shkoly/' },
        { label: regionName, href: `/shkoly/${r}/` },
        { label: 'Программирование' },
      ]}
      seoContent={<ProgrammingRegionSeoBlock regionIn={regionIn} count={count} />}
    />
  )
}
