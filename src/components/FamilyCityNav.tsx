import Link from 'next/link'
import familyGeography from '@/data/family-geography.json'
import { getSchoolsByType, moCityLabels, regionLabels, schoolMatchesMoCity } from '@/data/schools'

export default function FamilyCityNav() {
  const list = getSchoolsByType('semejnye')
  const items = Object.entries(regionLabels)
    .filter(([slug]) => slug !== 'moskovskaya-oblast' && list.some(s => s.region === slug))
    .map(([slug, label]) => ({ label, href: `/shkoly/${slug}/semejnye/`, count: list.filter(s => s.region === slug).length }))
  for (const [slug, label] of Object.entries(moCityLabels)) {
    const count = list.filter(s => schoolMatchesMoCity(s, label)).length
    if (count) items.push({ label, href: `/shkoly/moskovskaya-oblast/gorod/${slug}/semejnye/`, count })
  }
  for (const [slug, city] of Object.entries(familyGeography.moscowCities)) {
    const count = list.filter(s => s.region === 'moskva' && s.city === city.label).length
    if (count) items.push({ label: city.label, href: `/shkoly/moskva/gorod/${slug}/semejnye/`, count })
  }
  items.sort((a, b) => a.label.localeCompare(b.label, 'ru'))
  return (
    <section className="mb-8" aria-labelledby="family-cities-title">
      <h2 id="family-cities-title" className="text-xl font-bold mb-4">Семейные школы по городам</h2>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-3">
        {items.map(item => <li key={item.href}><Link href={item.href} className="text-sm text-sky-700 hover:underline">{item.label} <span className="text-gray-500">({item.count})</span></Link></li>)}
      </ul>
      <p className="mt-4 text-sm"><Link className="text-sky-700 hover:underline" href="/shkoly/moskovskaya-oblast/semejnye/">Все семейные школы Московской области</Link></p>
    </section>
  )
}
