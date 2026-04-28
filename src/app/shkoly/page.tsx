import type { Metadata } from 'next'
import { schools } from '@/data/schools'
import CatalogClient from './CatalogClient'

export const metadata: Metadata = {
  title: `Все школы России — каталог ${new Date().getFullYear()}`,
  description: `Полный каталог школ России: государственные, частные, онлайн, вечерние и экстернат. ${schools.length} школ с адресами, телефонами и описаниями.`,
  alternates: { canonical: 'https://pro-schools.ru/shkoly/' },
}

export default function AllSchoolsPage() {
  return <CatalogClient />
}
