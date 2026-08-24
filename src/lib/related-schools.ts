/**
 * related-schools.ts — подбор школ для выборок, где по строгому фильтру школ нет.
 *
 * Зачем: страницы вида «частные школы у метро X» или «профильные школы в регионе Y»
 * генерируются по всем комбинациям, но реальных школ в конкретной комбинации может
 * не быть. Вместо пустой страницы показываем ближайшее осмысленное расширение
 * выборки — сначала тот же тип рядом, потом тот же тип шире, потом соседние
 * категории. Блок всегда честно подписан, чтобы не выдавать расширение за точный
 * ответ на запрос.
 */
import {
  schools, metroSlugToName, moscowDistrictLabels, moCityLabels,
  regionLabelsIn, featureMetas, getSchoolsByFeature,
} from '@/data/schools'
import type {
  School, SchoolType, RegionSlug, FeatureSlug, MoscowDistrictSlug, MoCitySlug,
} from '@/data/schools'
import { detectProfile } from '@/lib/school-profiles'
import { nearbyStations, nearbyMoCities } from '@/data/geo-points'

export interface RelatedBlock {
  title: string
  note: string
  schools: School[]
}

/**
 * Полные названия типов для заголовков блока. typeLabels в schools.ts — короткие
 * прилагательные («Международные»), из них не собрать читаемый заголовок.
 */
export const TYPE_FULL_NAME: Record<SchoolType, string> = {
  gosudarstvennye:   'Государственные школы',
  chastnie:          'Частные школы',
  online:            'Онлайн-школы',
  vechernie:         'Вечерние школы',
  eksternal:         'Школы-экстернаты',
  semejnye:          'Семейные школы',
  domashnie:         'Школы домашнего обучения',
  'pri-vuzakh':      'Школы при вузах',
  profilnye:         'Профильные школы',
  gimnazii:          'Гимназии',
  korrektsionnye:    'Коррекционные школы',
  kadetskie:         'Кадетские школы',
  mezhdunarodnie:    'Международные школы',
  programmirovanie:  'Школы программирования',
  shahmatnye:        'Шахматные школы',
  'podgotovka-ege':  'Центры подготовки к ЕГЭ',
  'podgotovka-oge':  'Центры подготовки к ОГЭ',
  internaty:         'Школы-интернаты',
  valdorfskie:       'Вальдорфские школы',
  montessori:        'Школы Монтессори',
  pravoslavnye:      'Православные школы',
  sportivnye:        'Спортивные школы',
  yazykovye:         'Языковые школы',
}

const LIMIT = 12
const NEAR_RADIUS_M = 3000

/**
 * Типы, которых в базе нет ни одной школы: страницы по ним не наполнить
 * фильтром по типу. Для трёх из них есть эквивалент среди «особенностей»
 * (keyword-матч по описанию), им отдаём featureFilter вместо типа.
 */
export const TYPE_TO_FEATURE: Partial<Record<SchoolType, FeatureSlug>> = {
  'programmirovanie': 'it-klass',
  'podgotovka-ege':   'podgotovka-k-ege',
  'podgotovka-oge':   'podgotovka-k-oge',
}

function byRating(a: School, b: School): number {
  const ra = a.rating ?? 0, rb = b.rating ?? 0
  if (rb !== ra) return rb - ra
  return (b.reviewCount ?? 0) - (a.reviewCount ?? 0)
}

function take(list: School[]): School[] {
  return [...list].sort(byRating).slice(0, LIMIT)
}

/** Школы у станции метро (сверка по текстовому полю metro). */
function atStation(stationSlug: string, pool: School[]): School[] {
  const name = metroSlugToName[stationSlug]
  if (!name) return []
  const n = name.toLowerCase()
  return pool.filter(s => s.metro && s.metro.toLowerCase().includes(n))
}

/** Собирает школы по списку станций, сохраняя порядок близости и без дублей. */
function acrossStations(stationSlugs: string[], pool: School[]): School[] {
  const out: School[] = []
  const seen = new Set<string>()
  for (const st of stationSlugs) {
    for (const s of atStation(st, pool)) {
      if (seen.has(s.id)) continue
      seen.add(s.id)
      out.push(s)
    }
    if (out.length >= LIMIT) break
  }
  return out.slice(0, LIMIT)
}

// ─── Москва: метро × тип ──────────────────────────────────────────────────────
export function relatedForMetroType(
  station: string, type: SchoolType, typeName: string, feature?: FeatureSlug,
): RelatedBlock | null {
  typeName = TYPE_FULL_NAME[type] ?? typeName
  const stationName = metroSlugToName[station]
  if (!stationName) return null
  const msk = schools.filter(s => s.region === 'moskva')
  const ofType = feature ? getSchoolsByFeature(feature, 'moskva') : msk.filter(s => s.type === type)

  const near = acrossStations(nearbyStations(station, NEAR_RADIUS_M), ofType)
  if (near.length) return {
    title: `${typeName} у соседних станций`,
    note: `У станции «${stationName}» школ этой категории в каталоге пока нет — показываем ближайшие, в пределах 3 км.`,
    schools: near,
  }

  if (ofType.length) return {
    title: `${typeName} в Москве`,
    note: `Рядом со станцией «${stationName}» школ этой категории в каталоге пока нет — показываем лучшие по рейтингу в городе.`,
    schools: take(ofType),
  }

  const here = atStation(station, msk)
  if (here.length) return {
    title: `Другие школы у метро ${stationName}`,
    note: `${typeName} у этой станции в каталоге пока нет — показываем школы других категорий рядом.`,
    schools: take(here),
  }

  // у самой станции школ нет вообще — берём любые школы у ближайших станций
  const anyNearby = acrossStations(nearbyStations(station, NEAR_RADIUS_M), msk)
  if (anyNearby.length) return {
    title: `Школы рядом со станцией ${stationName}`,
    note: `У самой станции «${stationName}» школ в каталоге пока нет — показываем ближайшие, в пределах 3 км.`,
    schools: anyNearby,
  }
  return null
}

// ─── Москва: округ × тип ──────────────────────────────────────────────────────
const DISTRICT_NEIGHBOURS: Record<MoscowDistrictSlug, MoscowDistrictSlug[]> = {
  cao:   ['sao', 'svao', 'vao', 'yuvao', 'yuao', 'yuzao', 'zao', 'szao'],
  sao:   ['szao', 'svao', 'cao', 'zao'],
  svao:  ['sao', 'vao', 'cao'],
  vao:   ['svao', 'yuvao', 'cao'],
  yuvao: ['vao', 'yuao', 'cao'],
  yuao:  ['yuvao', 'yuzao', 'cao'],
  yuzao: ['yuao', 'zao', 'cao'],
  zao:   ['yuzao', 'szao', 'cao'],
  szao:  ['zao', 'sao', 'cao'],
}

export function relatedForDistrictType(
  district: MoscowDistrictSlug, type: SchoolType, typeName: string, feature?: FeatureSlug,
): RelatedBlock | null {
  typeName = TYPE_FULL_NAME[type] ?? typeName
  const label = moscowDistrictLabels[district]
  const msk = schools.filter(s => s.region === 'moskva')
  const ofType = feature ? getSchoolsByFeature(feature, 'moskva') : msk.filter(s => s.type === type)

  const neighbourLabels = (DISTRICT_NEIGHBOURS[district] ?? []).map(d => moscowDistrictLabels[d])
  const inNeighbours = ofType.filter(s => s.district && neighbourLabels.includes(s.district))
  if (inNeighbours.length) return {
    title: `${typeName} в соседних округах`,
    note: `В ${label} школ этой категории в каталоге пока нет — показываем соседние округа Москвы.`,
    schools: take(inNeighbours),
  }

  if (ofType.length) return {
    title: `${typeName} в Москве`,
    note: `В ${label} школ этой категории в каталоге пока нет — показываем лучшие по рейтингу в городе.`,
    schools: take(ofType),
  }

  const here = msk.filter(s => s.district === label)
  if (here.length) return {
    title: `Другие школы в ${label}`,
    note: `${typeName} в этом округе в каталоге пока нет — показываем школы других категорий.`,
    schools: take(here),
  }
  return null
}

// ─── Подмосковье: город × тип ─────────────────────────────────────────────────
export function relatedForMoCityType(
  city: MoCitySlug, type: SchoolType, typeName: string, feature?: FeatureSlug,
): RelatedBlock | null {
  typeName = TYPE_FULL_NAME[type] ?? typeName
  const label = moCityLabels[city]
  const mo = schools.filter(s => s.region === 'moskovskaya-oblast')
  const ofType = feature
    ? getSchoolsByFeature(feature, 'moskovskaya-oblast')
    : mo.filter(s => s.type === type)

  const nearLabels = nearbyMoCities(city).map(c => moCityLabels[c as MoCitySlug]).filter(Boolean)
  const inNear: School[] = []
  for (const cityLabel of nearLabels) {
    inNear.push(...ofType.filter(s => s.city === cityLabel))
    if (inNear.length >= LIMIT) break
  }
  if (inNear.length) return {
    title: `${typeName} в соседних городах`,
    note: `В городе ${label} школ этой категории в каталоге пока нет — показываем ближайшие города Подмосковья.`,
    schools: inNear.slice(0, LIMIT),
  }

  if (ofType.length) return {
    title: `${typeName} в Подмосковье`,
    note: `В городе ${label} школ этой категории в каталоге пока нет — показываем лучшие по рейтингу в области.`,
    schools: take(ofType),
  }

  const here = mo.filter(s => s.city === label)
  if (here.length) return {
    title: `Другие школы в городе ${label}`,
    note: `${typeName} здесь в каталоге пока нет — показываем школы других категорий в этом городе.`,
    schools: take(here),
  }
  return null
}

// ─── Регион × профиль ─────────────────────────────────────────────────────────
// Страница /shkoly/[region]/profilnye/[profile]/ показывает школы типа
// «profilnye» с нужным профилем. Профильных школ мало, поэтому расширяем так:
// 1) школы того же профиля любого типа в этом же регионе (гимназия с IT-уклоном
//    релевантнее, чем профильная школа другого направления);
// 2) профильные школы соседних направлений в этом же регионе;
// 3) тот же профиль в других городах.
const PROFILE_NEIGHBOURS: Record<string, string[]> = {
  math:        ['it', 'engineering'],
  it:          ['math', 'engineering'],
  engineering: ['math', 'it'],
  medical:     ['ecology', 'sport'],
  ecology:     ['medical', 'math'],
  art:         ['music', 'humanities'],
  music:       ['art', 'humanities'],
  sport:       ['medical', 'humanities'],
  economics:   ['humanities', 'languages'],
  humanities:  ['languages', 'art'],
  languages:   ['humanities', 'economics'],
}

export function relatedForRegionProfile(
  region: RegionSlug, profile: string, profileLabel: string,
): RelatedBlock | null {
  const where = regionLabelsIn[region] ?? region
  const inRegion = schools.filter(s => s.region === region)

  const sameProfileAnyType = inRegion.filter(
    s => s.type !== 'profilnye' && detectProfile(s) === profile,
  )
  if (sameProfileAnyType.length) return {
    title: `Школы с уклоном «${profileLabel}» ${where}`,
    note: `Отдельных профильных школ этого направления ${where} в каталоге пока нет — показываем школы других типов с таким же уклоном.`,
    schools: take(sameProfileAnyType),
  }

  const neighbourProfiles = PROFILE_NEIGHBOURS[profile] ?? []
  const neighbourSchools = inRegion.filter(s => {
    if (s.type !== 'profilnye') return false
    const p = detectProfile(s)
    return p !== null && neighbourProfiles.includes(p)
  })
  if (neighbourSchools.length) return {
    title: `Профильные школы других направлений ${where}`,
    note: `Школ профиля «${profileLabel}» ${where} в каталоге пока нет — показываем близкие направления.`,
    schools: take(neighbourSchools),
  }

  const elsewhere = schools.filter(s => s.type === 'profilnye' && detectProfile(s) === profile)
  if (elsewhere.length) return {
    title: `Школы профиля «${profileLabel}» в других городах`,
    note: `${where.charAt(0).toUpperCase() + where.slice(1)} школ этого профиля в каталоге пока нет — показываем лучшие по рейтингу в стране.`,
    schools: take(elsewhere),
  }

  // отдельных профильных школ такого направления нет нигде (напр. языковой,
  // естественнонаучный) — показываем школы с этим уклоном любого типа
  const anyTypeAnywhere = schools.filter(s => detectProfile(s) === profile)
  if (anyTypeAnywhere.length) return {
    title: `Школы с уклоном «${profileLabel}»`,
    note: `Отдельных профильных школ этого направления в каталоге пока нет — показываем школы других типов с таким уклоном, лучшие по рейтингу.`,
    schools: take(anyTypeAnywhere),
  }
  return null
}

// ─── Регион × особенность ─────────────────────────────────────────────────────
const FEATURE_NEIGHBOURS: Partial<Record<FeatureSlug, FeatureSlug[]>> = {
  's-bassejnom':           ['prodlyonka', 'boarding'],
  'meditsinskij-klass':    ['uglublenny-anglijskij', 'prodlyonka'],
  'uglublenny-anglijskij': ['meditsinskij-klass', 'prodlyonka'],
  'prodlyonka':            ['s-bassejnom', 'uglublenny-anglijskij'],
  'boarding':              ['s-bassejnom', 'prodlyonka'],
  // Программирование (/shkoly/<регион>/programmirovanie/) — своя страница, но фича
  // та же. Соседи — другие углублённые треки: местная школа с профильным уклоном
  // полезнее читателю, чем IT-школа в другом городе (её даёт второй уровень).
  'it-klass':              ['uglublenny-anglijskij', 'meditsinskij-klass'],
}

export function relatedForRegionFeature(
  region: RegionSlug, feature: FeatureSlug,
): RelatedBlock | null {
  const where = regionLabelsIn[region] ?? region
  const meta = featureMetas.find(f => f.slug === feature)
  const featureLabel = meta?.label ?? feature

  const neighbours = FEATURE_NEIGHBOURS[feature] ?? []
  const inRegion: School[] = []
  const seen = new Set<string>()
  for (const f of neighbours) {
    for (const s of getSchoolsByFeature(f, region)) {
      if (seen.has(s.id)) continue
      seen.add(s.id)
      inRegion.push(s)
    }
  }
  if (inRegion.length) return {
    title: `Школы с другими возможностями ${where}`,
    note: `Школ по признаку «${featureLabel}» ${where} в каталоге пока нет — показываем близкие по смыслу.`,
    schools: take(inRegion),
  }

  const elsewhere = getSchoolsByFeature(feature)
  if (elsewhere.length) return {
    title: `Школы «${featureLabel}» в других городах`,
    note: `${where.charAt(0).toUpperCase() + where.slice(1)} таких школ в каталоге пока нет — показываем лучшие по рейтингу в стране.`,
    schools: take(elsewhere),
  }
  return null
}
