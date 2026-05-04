import { SchoolType, RegionSlug, typeLabels, regionLabels, regionLabelsOf, regionLabelsIn, formatPrice } from '@/data/schools'
export { formatPrice }

// Дополнительные поисковые синонимы для каждого типа школ
const typeKeywordMap: Record<SchoolType, string[]> = {
  gosudarstvennye: ['бесплатная школа', 'муниципальная школа', 'общеобразовательная школа', 'МБОУ'],
  chastnie:        ['частная школа', 'платная школа', 'негосударственная школа', 'малые классы'],
  online:          ['онлайн школа', 'дистанционная школа', 'обучение дома', 'дистанционное обучение'],
  vechernie:       ['вечерняя школа', 'школа для взрослых', 'обучение по вечерам', 'получить аттестат'],
  eksternal:       ['экстернат', 'ускоренное обучение', 'школа экстернат', 'сдать экзамены экстерном'],
  semejnye:        ['семейная школа', 'семейное обучение', 'домашняя школа', 'альтернативное образование'],
  domashnie:       ['домашнее обучение', 'надомное обучение', 'обучение на дому', 'индивидуальный план'],
  'pri-vuzakh':    ['школа при университете', 'лицей при вузе', 'предуниверсарий', 'школа при институте'],
  profilnye:       ['профильная школа', 'специализированная школа', 'IT школа', 'медицинский класс'],
  gimnazii:        ['гимназия', 'лицей', 'углублённое обучение', 'олимпиадная школа', 'ЕГЭ высокий балл'],
  korrektsionnye:  ['коррекционная школа', 'школа для детей с ОВЗ', 'школа для детей с РАС', 'дефектолог'],
  kadetskie:       ['кадетская школа', 'кадетский корпус', 'военно-патриотическое воспитание', 'НВП'],
  mezhdunarodnie:  ['международная школа', 'IB школа', 'школа с международной программой', 'Cambridge school', 'двуязычная школа'],
  programmirovanie:['школа программирования', 'IT школа', 'школа кодирования', 'Python школа', 'школа веб-разработки'],
  shahmatnye:      ['шахматная школа', 'школа шахмат', 'шахматный лицей', 'обучение шахматам', 'шахматы для детей'],
  'podgotovka-ege-oge': ['подготовка к ЕГЭ', 'подготовка к ОГЭ', 'курсы ЕГЭ', 'репетитор ЕГЭ', 'центр подготовки к экзаменам'],
}

export function buildKeywords(
  region?: RegionSlug,
  type?: SchoolType,
): string {
  const cityName = region ? regionLabels[region] : null
  const typeKw   = type   ? typeKeywordMap[type]  : null
  const typeLabel = type  ? typeLabels[type].toLowerCase() : null

  if (region && type && cityName && typeKw && typeLabel) {
    return [
      `${typeLabel} школы ${cityName}`,
      `${typeLabel} школа ${cityName}`,
      ...typeKw.map(kw => `${kw} ${cityName}`),
      `школы ${cityName}`,
    ].join(', ')
  }
  if (region && cityName) {
    return [
      `школы ${cityName}`,
      `частные школы ${cityName}`,
      `онлайн школы ${cityName}`,
      `лучшие школы ${cityName}`,
      `каталог школ ${cityName}`,
    ].join(', ')
  }
  if (type && typeKw && typeLabel) {
    return [
      `${typeLabel} школы России`,
      ...typeKw,
      `каталог ${typeLabel} школ`,
    ].join(', ')
  }
  return 'школы России, каталог школ, частные школы, онлайн школы, вечерние школы, экстернат'
}

export function buildTitle(
  region?: RegionSlug,
  type?: SchoolType,
  schoolName?: string,
  count?: number
): string {
  if (schoolName) {
    return `${schoolName} — официальная информация, адрес, контакты`
  }
  if (region && type) {
    const cityOf = regionLabelsOf[region]
    const suffix = count ? ` — список ${count} школ` : ''
    return `${typeLabels[type]} школы ${cityOf} ${new Date().getFullYear()}${suffix}`
  }
  if (region) {
    const cityOf = regionLabelsOf[region]
    const suffix = count ? ` — ${count} школ` : ''
    return `Школы ${cityOf}${suffix} — адреса, телефоны, отзывы`
  }
  return `Каталог школ России — государственные, частные, онлайн, вечерние, экстернат`
}

export function buildDescription(
  region?: RegionSlug,
  type?: SchoolType,
  schoolName?: string,
  count?: number
): string {
  if (schoolName && region) {
    const cityIn = regionLabelsIn[region]
    return `${schoolName} ${cityIn} — адрес, телефон, описание, особенности. Актуальная информация о школе на портале pro-schools.ru.`
  }
  if (region && type) {
    const typeLower = typeLabels[type].toLowerCase()
    const cityIn = regionLabelsIn[region]
    const n = count ?? 'все'
    return `${typeLower.charAt(0).toUpperCase() + typeLower.slice(1)} школы ${cityIn}: ${n} школ с адресами, телефонами и описаниями. Сравните и выберите лучшую школу для вашего ребёнка.`
  }
  if (region) {
    const cityIn = regionLabelsIn[region]
    const n = count ?? 'все'
    return `Полный список школ ${cityIn}: ${n} образовательных организаций. Государственные, частные, онлайн, вечерние школы и экстернат с адресами и контактами.`
  }
  return `Крупнейший каталог школ России. Государственные, частные, онлайн-школы, вечерние школы и экстернат по всем регионам. Адреса, телефоны, описания, отзывы.`
}

export function getTypeColor(type: SchoolType): string {
  const colors: Record<SchoolType, string> = {
    gosudarstvennye: 'bg-blue-100 text-blue-800',
    chastnie: 'bg-purple-100 text-purple-800',
    online: 'bg-green-100 text-green-800',
    vechernie: 'bg-orange-100 text-orange-800',
    eksternal: 'bg-rose-100 text-rose-800',
    semejnye: 'bg-teal-100 text-teal-800',
    domashnie: 'bg-yellow-100 text-yellow-800',
    'pri-vuzakh': 'bg-indigo-100 text-indigo-800',
    profilnye: 'bg-rose-100 text-rose-800',
    gimnazii: 'bg-cyan-100 text-cyan-800',
    korrektsionnye: 'bg-lime-100 text-lime-800',
    kadetskie: 'bg-slate-100 text-slate-800',
    mezhdunarodnie: 'bg-sky-100 text-sky-800',
    programmirovanie: 'bg-violet-100 text-violet-800',
    shahmatnye: 'bg-emerald-100 text-emerald-800',
    'podgotovka-ege-oge': 'bg-amber-100 text-amber-800',
  }
  return colors[type]
}

export function getTypeBorderColor(type: SchoolType): string {
  const colors: Record<SchoolType, string> = {
    gosudarstvennye: 'border-blue-200',
    chastnie: 'border-purple-200',
    online: 'border-green-200',
    vechernie: 'border-orange-200',
    eksternal: 'border-rose-200',
    semejnye: 'border-teal-200',
    domashnie: 'border-yellow-200',
    'pri-vuzakh': 'border-indigo-200',
    profilnye: 'border-rose-200',
    gimnazii: 'border-cyan-200',
    korrektsionnye: 'border-lime-200',
    kadetskie: 'border-slate-200',
    mezhdunarodnie: 'border-sky-200',
    programmirovanie: 'border-violet-200',
    shahmatnye: 'border-emerald-200',
    'podgotovka-ege-oge': 'border-amber-200',
  }
  return colors[type]
}

export function pluralSchools(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return `${n} школа`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} школы`
  return `${n} школ`
}
