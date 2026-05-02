import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { typeSlugs, typeLabels, schools, SchoolType } from '@/data/schools'
import { buildKeywords } from '@/lib/utils'
import CatalogClient from '../../CatalogClient'
import SeoBlock from '@/components/SeoBlock'

interface Props {
  params: Promise<{ type: string }>
}

export function generateStaticParams() {
  return typeSlugs.map(type => ({ type }))
}

const typeDescriptions: Record<SchoolType, string> = {
  gosudarstvennye: 'Бесплатные государственные школы России — полный каталог с адресами, телефонами и отзывами.',
  chastnie:        'Частные школы России: малые классы, индивидуальный подход, расширенные программы.',
  online:          'Онлайн-школы России с государственной аккредитацией — гибкий график из любой точки.',
  vechernie:       'Вечерние школы для работающих и взрослых — обучение по вечерам, аттестат гос. образца.',
  eksternal:       'Школы-экстернаты: ускоренное прохождение программы, официальный аттестат.',
  semejnye:        'Семейные школы: родители участвуют в обучении, малые группы, альтернативная педагогика.',
  domashnie:       'Надомное обучение с официальным сопровождением и аттестацией.',
  'pri-vuzakh':    'Лицеи и школы при университетах: профильная подготовка и высокая поступаемость.',
  profilnye:       'Профильные школы: IT, медицина, право, искусство, инженерия и другие направления.',
  gimnazii:        'Гимназии и лицеи: углублённые программы, высокие баллы ЕГЭ, победители олимпиад.',
  korrektsionnye:  'Коррекционные школы для детей с ОВЗ: профессиональные дефектологи, адаптированные программы.',
  kadetskie:       'Кадетские школы и корпуса: военно-патриотическое воспитание, строевая подготовка, НВП.',
  mezhdunarodnie:  'Международные школы России: программы IB и Cambridge, обучение на английском, диплом для поступления в зарубежные вузы.',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params
  if (!typeSlugs.includes(type as SchoolType)) return {}
  const t = type as SchoolType
  const label = typeLabels[t]
  const count = schools.filter(s => s.type === t).length
  const title = `${label} школы России — ${count} школ в каталоге`
  return {
    title,
    description: typeDescriptions[t],
    keywords: buildKeywords(undefined, t),
    alternates: { canonical: `https://pro-schools.ru/shkoly/tipy/${t}/` },
    openGraph: { title, description: typeDescriptions[t], url: `https://pro-schools.ru/shkoly/tipy/${t}/` },
  }
}

export default async function GlobalTypePage({ params }: Props) {
  const { type } = await params
  if (!typeSlugs.includes(type as SchoolType)) notFound()
  const t = type as SchoolType
  const label = typeLabels[t]
  const count = schools.filter(s => s.type === t).length

  return (
    <CatalogClient
      initialTypes={[t]}
      lockType
      title={`Все ${label.toLowerCase()} школы в России`}
      subtitle={`${count} школ — выберите город в фильтре`}
      breadcrumbs={[
        { label: 'Все школы', href: '/shkoly/' },
        { label: label },
      ]}
      seoContent={<SeoBlock type={t} count={count} />}
    />
  )
}
