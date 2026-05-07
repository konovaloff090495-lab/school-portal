import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from '@/app/shkoly/CatalogClient'
import SeoBlock from '@/components/SeoBlock'

const TITLE = 'Онлайн профильные школы'
const DESC  = 'Онлайн профильные школы России — дистанционное обучение с углублёнными предметами, гибкий график, государственная аккредитация. Физ-мат, IT, медицина, гуманитарный профиль.'
const URL   = 'https://pro-schools.ru/shkoly/tipy/profilnye/online/'

export const metadata: Metadata = {
  title: `${TITLE} — дистанционное профильное обучение | pro-schools.ru`,
  description: DESC,
  keywords: 'онлайн профильная школа, профильные онлайн школы, онлайн школа профильная математика, дистанционное профильное обучение',
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL },
}

export default function ProfilnyeOnline() {
  const count = schools.filter(s => s.type === 'profilnye' || s.type === 'online').length
  return (
    <CatalogClient
      initialTypes={['profilnye', 'online']}
      lockType
      title={TITLE}
      subtitle={`${count} онлайн-школ с профильным обучением`}
      breadcrumbs={[
        { label: 'Все школы',           href: '/shkoly/' },
        { label: 'Профильные школы',    href: '/shkoly/tipy/profilnye/' },
        { label: 'Онлайн' },
      ]}
      seoContent={
        <SeoBlock
          type="profilnye"
          count={count}
          customTitle="Онлайн профильные школы: углублённые предметы без привязки к месту"
          customText="Онлайн профильные школы дают возможность учиться по углублённой программе из любого города России. Физ-мат, IT, медицинский, гуманитарный профили — с живыми занятиями, домашними заданиями и куратором. Государственная аккредитация гарантирует официальный аттестат. Формат особенно востребован у учеников 10–11 класса, которые хотят серьёзно готовиться к ЕГЭ по профильным предметам, не жертвуя основной программой."
        />
      }
    />
  )
}
