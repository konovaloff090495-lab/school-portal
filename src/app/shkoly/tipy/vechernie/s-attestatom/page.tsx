import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'

const TITLE = 'Вечерние школы с аттестатом'
const DESC  = 'Вечерние школы с выдачей государственного аттестата — официальный аттестат о среднем образовании после 11 класса или аттестат ОГЭ после 9 класса.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/vechernie/s-attestatom/'

export const metadata: Metadata = {
  title: `${TITLE} — государственный диплом | pro-schools.ru`,
  description: DESC,
  keywords: 'вечерняя школа с аттестатом, получить аттестат вечерняя школа, аттестат вечерней школы, вечерняя школа аттестат государственного образца',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function VechernieSAttestatomPage() {
  const count = schools.filter(s => s.type === 'vechernie').length
  return (
    <CatalogClient
      initialTypes={['vechernie']}
      lockType
      title={TITLE}
      subtitle={`${count} аккредитованных вечерних школ`}
      breadcrumbs={[
        { label: 'Все школы',      href: '/shkoly/' },
        { label: 'Вечерние школы', href: '/shkoly/tipy/vechernie/' },
        { label: 'С аттестатом' },
      ]}
    />
  )
}
