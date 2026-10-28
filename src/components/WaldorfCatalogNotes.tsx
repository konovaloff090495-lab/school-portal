import Link from 'next/link'
import { getSchoolsByType, regionLabels } from '@/data/schools'

export default function WaldorfCatalogNotes({ showCities = false }: { showCities?: boolean }) {
  const regions = [...new Set(getSchoolsByType('valdorfskie').map(s => s.region))]
  return <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
    <h2 className="mb-3 text-xl font-bold text-gray-900">Вальдорфские школы и семейные классы</h2>
    <p>В подборке — общеобразовательные школы, вальдорфские подразделения государственных школ и семейные классы. Формат указан в карточке: семейный центр может организовывать занятия, а аттестацию ребёнок проходит в другой школе.</p>
    {showCities && <nav aria-label="Вальдорфские школы по городам" className="mt-4 flex flex-wrap gap-x-4 gap-y-2">{regions.sort((a, b) => regionLabels[a].localeCompare(regionLabels[b], 'ru')).map(r => <Link key={r} className="text-[#0369A1] hover:underline" href={`/shkoly/${r}/valdorfskie/`}>{regionLabels[r]}</Link>)}</nav>}
    <details className="mt-4">
      <summary className="cursor-pointer font-medium text-gray-900">Источники и актуальность списка</summary>
      <p className="mt-3">Сверка — 28 октября 2026 года. Использованы сайты школ, <a className="text-[#0369A1] hover:underline" href="https://waldorf-russia.ru/about/members/" target="_blank" rel="noopener noreferrer">список Ассоциации вальдорфских школ России</a> и международный Waldorf World List. Условия набора и стоимость уточняйте перед поступлением.</p>
      <p className="mt-2">В общедоступных справочниках встречаются старые адреса, детские сады и инициативы без подтверждённых школьных классов. Они не включены в основной список как действующие школы. Подборка охватывает найденные организации с подтверждённой педагогикой; это не государственный реестр всех инициатив.</p>
    </details>
  </section>
}
