import raw from './raex-schools-2026.json'
import { School, RegionSlug, regionLabels, getSchoolsByRegion } from './schools'

/**
 * Рейтинги школ RAEX 2026 по субъектам РФ (открытые данные raex-rr.com, снимок scripts/raex-fetch.py):
 * два списка по 20 школ на регион — «Масштаб» (число выпускников, поступивших в ведущие вузы) и
 * «Конкурентоспособность выпускников» (доля таких выпускников). Здесь — привязка строк к нашим
 * городам и карточкам. Свои оценки не придумываем: на странице только позиции RAEX с указанием источника.
 */
export interface RaexRow {
  list: 'scale' | 'compete'
  region_slug: string
  region_title: string
  rank: number
  name: string
  city: string
}
export const raexRows = raw as RaexRow[]
export const RAEX_YEAR = 2026
export const RAEX_LIST_TITLE: Record<RaexRow['list'], string> = {
  scale: 'Лучшие школы региона по числу выпускников, поступивших в ведущие вузы',
  compete: 'Конкурентоспособность выпускников (доля поступивших в ведущие вузы)',
}
export function raexSourceUrl(row: RaexRow): string {
  return row.list === 'scale'
    ? `https://raex-rr.com/education/school_regions/${row.region_slug}/${RAEX_YEAR}/`
    : `https://raex-rr.com/education/schools_by_compete/${row.region_slug}/${RAEX_YEAR}/`
}

const ORG_RE = /\b(мбоу|маоу|гбоу|гаоу|моу|мкоу|гоу|ноу|чоу|аноо|ано|оано|обоу|кгбоу|огбоу|мбоу|сош|оош|г\.|город[а-я]*)\b/g
function norm(s: string): string {
  return s.toLowerCase().replace(/[«»"'“”]/g, ' ').replace(/№/g, ' ').replace(ORG_RE, ' ').replace(/[^a-zа-яё0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
}
const KIND_RE = /(лицей|гимназия|школа|интернат|центр|корпус|училище)[^0-9]{0,40}?(\d{1,4})/
function kindNum(s: string): string | null {
  const m = norm(s).match(KIND_RE)
  return m ? `${m[1]}:${m[2]}` : null
}
/** Карточка каталога для строки RAEX: по «вид + номер» в том же городе, иначе по вхождению названия. */
export function matchSchool(row: RaexRow, pool: School[]): School | undefined {
  const kn = kindNum(row.name)
  if (kn) {
    const hit = pool.filter(s => kindNum(s.name) === kn)
    if (hit.length === 1) return hit[0]
    if (hit.length > 1) return hit.find(s => norm(s.name).includes(norm(row.name))) ?? hit[0]
  }
  // Фолбэк по вхождению — только для содержательных названий: «Школа», «Лицей» и т. п. матчить нельзя
  const GENERIC = /^(школа|лицей|гимназия|центр образования|средняя школа|общеобразовательная школа)$/
  const n = norm(row.name)
  if (n.length < 8 || GENERIC.test(n)) return undefined
  return pool.find(s => { const m = norm(s.name); return m.length >= 8 && !GENERIC.test(m) && (m.includes(n) || n.includes(m)) })
}
export interface CityRaex {
  scale: { row: RaexRow; school?: School }[]
  compete: { row: RaexRow; school?: School }[]
  regionTitle: string
  sourceScale?: string
  sourceCompete?: string
}
const yo = (s: string) => s.replace(/ё/g, 'е').replace(/Ё/g, 'Е')
export function getRaexForRegion(region: RegionSlug): CityRaex | null {
  const city = yo(regionLabels[region])   // RAEX пишет «Орел», у нас «Орёл»
  const rows = raexRows.filter(r => yo(r.city) === city)
  if (!rows.length) return null
  const pool = getSchoolsByRegion(region)
  const build = (list: RaexRow['list']) =>
    rows.filter(r => r.list === list).sort((a, b) => a.rank - b.rank).map(row => ({ row, school: matchSchool(row, pool) }))
  const scale = build('scale'), compete = build('compete')
  return {
    scale, compete,
    regionTitle: rows[0].region_title.replace(/^\s*Лучшие школы /, '').replace(/\.\s.*$/, ''),
    sourceScale: scale[0] ? raexSourceUrl(scale[0].row) : undefined,
    sourceCompete: compete[0] ? raexSourceUrl(compete[0].row) : undefined,
  }
}
/** Города, где страница рейтинга не тонкая: ≥ 5 школ RAEX в городе (в сумме по двум спискам, без дублей). */
export const RAEX_MIN = 5
export function raexRegions(regions: RegionSlug[]): RegionSlug[] {
  return regions.filter(r => {
    const city = yo(regionLabels[r])
    return new Set(raexRows.filter(x => yo(x.city) === city).map(x => x.name)).size >= RAEX_MIN
  })
}
