import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { metroSlugToName, metroSlugs, getSchoolsByMetro } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'

interface Props {
  params: Promise<{ station: string }>
}

export async function generateStaticParams() {
  return metroSlugs.map(slug => ({ station: slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { station } = await params
  const name = metroSlugToName[station]
  if (!name) return {}

  const title = `Школы у метро ${name} в Москве — каталог`
  const description = `Каталог школ рядом со станцией метро «${name}» в Москве. Государственные, частные, онлайн-школы. Адреса, телефоны, отзывы родителей.`

  return {
    title,
    description,
    alternates: { canonical: `https://pro-schools.ru/shkoly/moskva/metro/${station}/` },
    openGraph: {
      title,
      description,
      url: `https://pro-schools.ru/shkoly/moskva/metro/${station}/`,
    },
  }
}

export default async function MetroPage({ params }: Props) {
  const { station } = await params
  const metroName = metroSlugToName[station]
  if (!metroName) notFound()

  const schoolsNearMetro = getSchoolsByMetro(metroName)
  const count = schoolsNearMetro.length

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Школы у метро ${metroName}`,
    description: `Список школ рядом со станцией метро ${metroName} в Москве`,
    numberOfItems: count,
    itemListElement: schoolsNearMetro.slice(0, 10).map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: s.name,
      url: `https://pro-schools.ru/shkoly/${s.slug}/`,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CatalogClient
        initialRegions={['moskva']}
        initialMetro={metroName}
        lockRegion
        lockMetro
        title={`Школы у метро ${metroName}`}
        subtitle={
          count > 0
            ? `${count} ${count === 1 ? 'школа' : count < 5 ? 'школы' : 'школ'} рядом с метро`
            : 'Школ в базе пока нет — скоро добавим'
        }
        breadcrumbs={[
          { label: 'Все школы', href: '/shkoly/' },
          { label: 'Москва', href: '/shkoly/moskva/' },
          { label: `Метро ${metroName}` },
        ]}
        seoContent={
          <div style={{ maxWidth: 860, margin: '0 auto', padding: '8px 0 40px', color: '#374151', fontFamily: 'var(--font-manrope, system-ui)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1814', margin: '0 0 8px' }}>
              Как выбрать школу у метро {metroName}?
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.7, margin: '0 0 12px' }}>
              При выборе школы рядом с метро «{metroName}» важно учитывать тип учреждения (государственная, лицей, гимназия или частная школа), наличие углублённых программ, внеурочных секций и рейтинг ЕГЭ. Используйте фильтры по типу, рейтингу и стоимости обучения, чтобы быстро найти подходящий вариант.
            </p>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1814', margin: '16px 0 8px' }}>
              Государственные и частные школы у метро {metroName}
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.7, margin: '0' }}>
              В районе станции метро «{metroName}» представлены как бесплатные государственные школы, так и частные учебные заведения с расширенными программами и малыми классами. Для государственных школ вам потребуется прописка в зоне действия школы. Частные школы принимают детей по всей Москве.
            </p>
          </div>
        }
      />
    </>
  )
}
