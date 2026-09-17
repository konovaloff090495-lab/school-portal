import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  regionSlugs, regionLabels, regionLabelsIn,
  getSchoolsByFeature, getSchoolsByRegionAndType, RegionSlug,
} from '@/data/schools'
import ProgCityExtras from '@/components/ProgCityExtras'
import CatalogClient from '../../CatalogClient'
import RelatedSchools from '@/components/RelatedSchools'
import { relatedForRegionFeature } from '@/lib/related-schools'

function ProgrammingRegionSeoBlock({ regionIn, count }: { regionIn: string; count: number }) {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '8px 0 48px', color: '#374151', fontFamily: 'var(--font-manrope, system-ui)' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1814', margin: '0 0 8px', lineHeight: 1.3 }}>
          Школы программирования {regionIn}
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.75, margin: 0, color: '#4B5563' }}>
          В каталоге {count} {count === 1 ? 'школа' : count < 5 ? 'школы' : 'школ'} программирования для детей {regionIn} — очные детские IT-школы и клубы (KIBERone, «Алгоритмика», Coddy, «Лига Роботов», Компьютерная академия TOP, местные центры), собранные по Яндекс Картам в сентябре 2026 года. Здесь дети 6–17 лет изучают Scratch, Python, Roblox, веб-разработку, робототехнику и создание игр во внеурочное время; адрес, телефон и оценка на Картах есть у каждой школы.
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
          Детские школы программирования берут с 6–7 лет: младшим дают Scratch и визуальные языки, с 10–12 лет — Roblox, Minecraft и первые шаги в Python, с 13 лет — «взрослые» языки и проекты. Профильный IT-класс в общеобразовательной школе открывается обычно с 8–9 класса — такие школы города перечислены ниже отдельным списком.
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
  const count = getSchoolsByRegionAndType(r, 'programmirovanie').length
  const itCount = getSchoolsByFeature('it-klass', r).length
  const w = count % 10 === 1 && count % 100 !== 11 ? 'школа' : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20) ? 'школы' : 'школ'
  const title = count > 0
    ? `Школы программирования для детей ${regionIn} 2026: ${count} ${w} — адреса, цены, отзывы`
    : `Школы программирования для детей ${regionIn} — IT-классы и онлайн-курсы`
  const description = count > 0
    ? `${count} ${w} программирования для детей ${regionIn}: KIBERone, Алгоритмика, Coddy, Лига Роботов и местные IT-клубы — адреса, телефоны, оценки на Яндекс Картах (09.2026). Как выбрать по возрасту и языку + онлайн-школа с пробным уроком от 5 500 ₽/мес.`
    : `Школы с IT-классами и углублённым программированием ${regionIn} и онлайн-школа программирования для детей 7–17 лет с пробным уроком. Адреса, телефоны, отзывы.`
  return {
    title,
    description,
    alternates: { canonical: `https://pro-schools.ru/shkoly/${r}/programmirovanie/` },
    openGraph: { title, description, url: `https://pro-schools.ru/shkoly/${r}/programmirovanie/` },
    // тонкие страницы (ни одной детской IT-школы и <3 школ с IT-классами) не индексируем
    ...(count < 2 && itCount < 3 ? { robots: { index: false, follow: true } } : {}),
  }
}

const w2 = (n: number) => n % 10 === 1 && n % 100 !== 11 ? 'школа' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'школы' : 'школ'

export default async function ProgrammirovaniePage({ params }: Props) {
  const { region } = await params
  if (!regionSlugs.includes(region as RegionSlug)) notFound()
  const r = region as RegionSlug
  const regionName = regionLabels[r]
  const regionIn = regionLabelsIn[r]
  const count = getSchoolsByRegionAndType(r, 'programmirovanie').length
  const itCount = getSchoolsByFeature('it-klass', r).length

  // Есть настоящие детские школы программирования (собраны по Яндекс Картам) —
  // показываем их. Нет — как раньше, общеобразовательные школы с IT-классами,
  // а при их отсутствии честно подписанный блок ближайшего расширения выборки.
  const related = count === 0 && itCount === 0 ? relatedForRegionFeature(r, 'it-klass') : null
  const extras = <ProgCityExtras region={r} count={count} />

  if (count === 0) {
    return (
      <CatalogClient
        emptyFallback={related ? <RelatedSchools block={related} /> : undefined}
        initialRegions={[r]}
        lockRegion
        featureFilter="it-klass"
        title={`Школы программирования для детей ${regionIn}`}
        subtitle={itCount > 0
          ? `Очных детских IT-школ в каталоге пока нет — ${itCount} ${itCount === 1 ? 'школа' : itCount < 5 ? 'школы' : 'школ'} с IT-классами`
          : 'Школ в базе пока нет — ниже, как заниматься онлайн'}
        breadcrumbs={[
          { label: 'Все школы', href: '/shkoly/' },
          { label: regionName, href: `/shkoly/${r}/` },
          { label: 'Программирование' },
        ]}
        seoContent={<>{extras}<ProgrammingRegionSeoBlock regionIn={regionIn} count={itCount} /></>}
      />
    )
  }

  return (
    <CatalogClient
      initialRegions={[r]}
      initialTypes={['programmirovanie']}
      lockRegion
      lockType
      title={`Школы программирования для детей ${regionIn}`}
      subtitle={`${count} ${w2(count)} и клубов по данным Яндекс Карт, 09.2026`}
      breadcrumbs={[
        { label: 'Все школы', href: '/shkoly/' },
        { label: regionName, href: `/shkoly/${r}/` },
        { label: 'Программирование' },
      ]}
      seoContent={<>{extras}<ProgrammingRegionSeoBlock regionIn={regionIn} count={count} /></>}
    />
  )
}
