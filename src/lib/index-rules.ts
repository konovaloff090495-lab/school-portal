import { regionSlugs, getSchoolsByRegionAndType, type RegionSlug, type SchoolType } from '@/data/schools'

/**
 * Правила индексации страниц «город × тип» (/shkoly/<город>/<тип>/).
 * Общий порог — 3 школы. Исключения — форматы, у которых страница отвечает на запрос
 * не только списком школ (см. VechernieCityExtras, CityOnlinePage, блок семейного обучения).
 */

// Онлайн-школы федеральные: индексируем 50 крупнейших городов (спрос «онлайн школа <город>»).
export const ONLINE_INDEX_REGIONS = new Set<RegionSlug>(regionSlugs.slice(0, 50))

// Вечерние школы: города без единой школы, где есть спрос в Вордстате ≥300/мес (16.09.2026).
export const VECHERNIE_ZERO_INDEX = new Set<RegionSlug>([
  'volgodonsk', 'nakhodka', 'surgut', 'veliky-novgorod', 'kemerovo', 'novokuznetsk',
  'stavropol', 'tolyatti', 'cherepovets', 'simferopol', 'sevastopol',
] as RegionSlug[])

export function isCityTypeIndexable(region: RegionSlug, type: SchoolType): boolean {
  const n = getSchoolsByRegionAndType(region, type).length
  if (type === 'online') return ONLINE_INDEX_REGIONS.has(region)
  if (type === 'vechernie') return n > 0 || VECHERNIE_ZERO_INDEX.has(region)
  if (type === 'semejnye' || type === 'eksternal') return n > 0
  // Центры ЕГЭ/ОГЭ: карточки собраны вручную по Яндекс Картам, страница дополнена онлайн-курсами — индексируем от 2 центров.
  if (type === 'podgotovka-ege' || type === 'podgotovka-oge') return n >= 2
  // Кадетских школ в городе физически 1–2 (Н.Новгород, Уфа, Иркутск…), а спрос «кадетская школа <город>» 1–2 тыс./мес —
  // индексируем от одной настоящей школы; коррекционные и интернаты — от двух (карточки с Яндекс Карт, 09.2026).
  if (type === 'kadetskie') return n >= 1
  if (type === 'korrektsionnye' || type === 'internaty') return n >= 2
  // ДМШ/ДХШ/ДШИ: художественных школ в городе физически 1–3, запрос «художественная школа <город>» стабильный — от 2 школ.
  if (type === 'muzykalnye' || type === 'hudozhestvennye' || type === 'iskusstv') return n >= 2
  return n >= 3
}
