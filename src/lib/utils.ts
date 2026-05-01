import { SchoolType, RegionSlug, typeLabels, regionLabels, regionLabelsOf, regionLabelsIn, formatPrice } from '@/data/schools'
export { formatPrice }

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
