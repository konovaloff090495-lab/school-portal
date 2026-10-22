import type { Metadata } from 'next'
import SchoolFormatCatalogPage, { getSchoolFormatPage } from '@/components/SchoolFormatCatalogPage'

const path = "/shkoly/tipy/semejnye/attestatsiya/"
const page = getSchoolFormatPage(path)!
export const metadata: Metadata = { title: page.title, description: page.description, alternates: { canonical: 'https://pro-schools.ru' + path }, openGraph: { title: page.title, description: page.description, url: 'https://pro-schools.ru' + path } }
export default function Page() { return <SchoolFormatCatalogPage path={path} /> }
