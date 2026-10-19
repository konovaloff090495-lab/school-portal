import type { Metadata } from 'next'
import Link from 'next/link'
import { getSchoolsByType } from '@/data/schools'
import SchoolCard from '@/components/SchoolCard'
import Breadcrumbs from '@/components/Breadcrumbs'
import OnlineBrandsTable from '@/components/OnlineBrandsTable'
import OnlineLeadCta from '@/components/OnlineLeadCta'

const TITLE = 'Семейная школа онлайн'
const DESC  = 'Онлайн семейные школы России — дистанционное семейное обучение с поддержкой педагогов. Аттестация, гибкий график, обучение из любого города.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/semejnye/online/'

export const metadata: Metadata = {
  title: `${TITLE} — дистанционное обучение | pro-schools.ru`,
  description: DESC,
  keywords: 'семейная школа онлайн, семейная школа онлайн обучение, дистанционная семейная школа, онлайн семейное обучение',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function SemejnyeOnlinePage() {
  const remoteSchools = getSchoolsByType('semejnye').filter(s => s.remoteOnly)
  return <main className="max-w-6xl mx-auto px-4 py-8">
    <Breadcrumbs crumbs={[
      { label: 'Все школы', href: '/shkoly/' },
      { label: 'Семейные школы', href: '/shkoly/tipy/semejnye/' },
      { label: 'Онлайн' },
    ]} />
    <h1 className="text-3xl font-bold my-6">{TITLE}</h1>
    <p className="mb-6 text-gray-700">Для дистанционного обучения сравните формат уроков, поддержку педагогов, стоимость и организацию аттестаций. В таблице — онлайн-программы; очные семейные классы можно найти в <Link className="text-sky-700 hover:underline" href="/shkoly/tipy/semejnye/">каталоге по городам</Link>.</p>
    <OnlineBrandsTable title="Онлайн-школы для семейного обучения" />
    {remoteSchools.length > 0 && <section className="my-8">
      <h2 className="text-xl font-bold mb-4">Ещё дистанционные проекты семейного обучения</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{remoteSchools.map(school => <SchoolCard key={school.id} school={school} />)}</div>
    </section>}
    <OnlineLeadCta source="Семейные школы: онлайн" />
    <section className="mt-8">
      <h2 className="text-xl font-bold mb-3">Что уточнить перед поступлением</h2>
      <p>Узнайте, есть ли живые уроки, как проверяют задания, кто помогает ребёнку с расписанием, какие услуги входят в тариф и какая школа организует аттестации. Условия зачисления и доступность выбранного класса уточняйте на странице конкретной программы.</p>
    </section>
  </main>
}
