// Профили для страниц /shkoly/[region]/profilnye/[profile]/
// Единый источник для роутинга (page.tsx) и sitemap.ts — не дублировать списки.
// Профили совпадают с SCHOOL_PROFILES в CatalogClient
export const REGION_PROFILES = [
  { id: 'math',        label: 'Физ-мат',                title: 'Физ-мат школы' },
  { id: 'it',          label: 'IT / Программирование',  title: 'IT-школы и школы программирования' },
  { id: 'medical',     label: 'Медицинский профиль',    title: 'Медицинские профильные школы' },
  { id: 'sport',       label: 'Спортивный профиль',     title: 'Спортивные профильные школы' },
  { id: 'art',         label: 'Художественный профиль', title: 'Школы искусств' },
  { id: 'humanities',  label: 'Гуманитарный профиль',   title: 'Гуманитарные школы' },
  { id: 'economics',   label: 'Экономический профиль',  title: 'Экономические профильные школы' },
  { id: 'engineering', label: 'Инженерный профиль',     title: 'Инженерные школы' },
  { id: 'languages',   label: 'Языковой профиль',       title: 'Языковые профильные школы' },
  { id: 'music',       label: 'Музыкальный профиль',    title: 'Музыкальные школы' },
  { id: 'ecology',     label: 'Естественнонаучный',     title: 'Естественнонаучные школы' },
] as const

export type RegionProfileId = typeof REGION_PROFILES[number]['id']
export const regionProfileIds = REGION_PROFILES.map(p => p.id)
