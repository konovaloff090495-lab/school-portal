'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  schools, regionSlugs, regionLabels, typeSlugs, typeLabels,
  moscowDistrictSlugs, moscowDistrictLabels,
  moCitySlugs, moCityLabels,
  featureMetas, FeatureSlug,
  languageMetas, LanguageSlug,
  RegionSlug, SchoolType,
  metroNameToSlug,
} from '@/data/schools'
import { getTypeColor, pluralSchools } from '@/lib/utils'
import SchoolCard from '@/components/SchoolCard'
import AdBanner from '@/components/AdBanner'
import Breadcrumbs from '@/components/Breadcrumbs'

type SortKey = 'rating' | 'reviews' | 'price_asc' | 'price_desc'
type EducationLevel = 'elementary' | 'middle' | 'high'

const LEVEL_LABELS: Record<EducationLevel, string> = {
  elementary: 'Начальная (1–4 кл.)',
  middle:     'Основная (5–9 кл.)',
  high:       'Старшая (10–11 кл.)',
}

function getSchoolLevels(grades: string): EducationLevel[] {
  const m = grades.replace('–', '-').match(/(\d+)[–\-](\d+)/)
  if (!m) return ['elementary', 'middle', 'high']
  const from = parseInt(m[1]), to = parseInt(m[2])
  const levels: EducationLevel[] = []
  if (from <= 4) levels.push('elementary')
  if (to >= 5 && from <= 9) levels.push('middle')
  if (to >= 10) levels.push('high')
  return levels
}

function getPriceCategory(priceFrom?: number): 'free' | 'budget' | 'mid' | 'premium' {
  if (!priceFrom || priceFrom === 0) return 'free'
  if (priceFrom <= 25000) return 'budget'
  if (priceFrom <= 70000) return 'mid'
  return 'premium'
}

const PRICE_LABELS: Record<string, string> = {
  free:    'Бесплатно',
  budget:  'до 25 000 ₽/мес',
  mid:     '25 000–70 000 ₽/мес',
  premium: 'от 70 000 ₽/мес',
}

// ── Профили для профильных школ ───────────────────────────────────────────────
const SCHOOL_PROFILES = [
  { id: 'it',          label: 'IT / Программирование', keywords: ['it', 'программирован', 'кибер', 'цифров', 'алгоритм', 'код', 'робот', 'искусственный интеллект', 'компьютер', 'технолог'] },
  { id: 'medical',     label: 'Медицинский',            keywords: ['медицин', 'биолог', 'химия', 'анатомия', 'фармацевт', 'врач', 'здоровь', 'гиппократ', 'сеченов', 'первый мед'] },
  { id: 'math',        label: 'Физ-мат',                keywords: ['физ-мат', 'физмат', 'математик', 'физика', 'точные науки', 'олимпиад', 'математическ'] },
  { id: 'music',       label: 'Музыкальный',            keywords: ['музык', 'фортепиано', 'скрипка', 'вокал', 'хор', 'соната', 'консерватори', 'инструмент'] },
  { id: 'sport',       label: 'Спортивный',             keywords: ['спорт', 'футбол', 'хоккей', 'теннис', 'олимпийск', 'баскетбол', 'борьба', 'плавание', 'гимнастик'] },
  { id: 'art',         label: 'Художественный',         keywords: ['художеств', 'искусств', 'живопись', 'дизайн', 'архитектур', 'творческ', 'сценическ'] },
  { id: 'humanities',  label: 'Гуманитарный',           keywords: ['гуманитар', 'история', 'литератур', 'языков', 'лингвистик', 'журналист', 'право', 'обществ'] },
  { id: 'economics',   label: 'Экономический',          keywords: ['экономик', 'бизнес', 'финанс', 'предпринимат', 'менеджмент', 'маркетинг', 'управлен'] },
  { id: 'engineering', label: 'Инженерный',             keywords: ['инженер', 'механик', 'авиа', 'судостроен', 'строительн', 'техническ', 'промышленн'] },
  { id: 'languages',   label: 'Языковой',               keywords: ['языков', 'иностранн', 'английск', 'лингвистик', 'переводч', 'международн'] },
  { id: 'ecology',     label: 'Естественнонаучный',     keywords: ['экологи', 'биохими', 'географи', 'геологи', 'естественн', 'природ', 'окружающ'] },
] as const

type ProfileId = typeof SCHOOL_PROFILES[number]['id']

function detectProfile(school: { name: string; features: string[]; description: string; fullDescription?: string }): ProfileId | null {
  const haystack = [school.name, school.description, school.fullDescription ?? '', ...school.features]
    .join(' ').toLowerCase()
  for (const p of SCHOOL_PROFILES) {
    if (p.keywords.some(kw => haystack.includes(kw))) return p.id
  }
  return null
}

// reverse maps: label → slug (used for URL navigation)
const districtLabelToSlug = Object.fromEntries(
  moscowDistrictSlugs.map(slug => [moscowDistrictLabels[slug], slug])
)
const moCityLabelToSlug = Object.fromEntries(
  moCitySlugs.map(slug => [moCityLabels[slug], slug])
)


interface Filters {
  regions: RegionSlug[]
  types: SchoolType[]
  districts: string[]
  neighborhoods: string[]
  moCities: string[]
  priceMode: 'all' | 'free' | 'paid'
  priceCategories: string[]
  levels: EducationLevel[]
  minRating: number
  metro: string[]
  profiles: ProfileId[]
  featureFilters: FeatureSlug[]
  sort: SortKey
}

export interface CatalogClientProps {
  initialRegions?: RegionSlug[]
  initialTypes?: SchoolType[]
  initialDistrict?: string
  initialNeighborhood?: string
  initialCity?: string
  initialMetro?: string
  initialProfile?: string
  lockRegion?: boolean
  lockType?: boolean
  lockMetro?: boolean
  lockProfile?: boolean
  title?: string
  subtitle?: string
  seoCity?: string   // имя города в именительном падеже для SEO-текста
  breadcrumbs?: { label: string; href?: string }[]
  featureFilter?: FeatureSlug
  languageFilter?: LanguageSlug
  seoContent?: React.ReactNode
}

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
}

function MetroFilter({ selected, onChange, stations, counts }: {
  selected: string[]
  onChange: (v: string[]) => void
  stations: string[]
  counts: Record<string, number>
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const visible = stations.filter(m =>
    !search || m.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="border-b border-gray-100 pb-4 mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full text-left cursor-pointer"
      >
        <span className="text-sm font-semibold text-[#0F172A] flex items-center gap-2">
          Метро
          {selected.length > 0 && (
            <span className="bg-[#0369A1] text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">{selected.length}</span>
          )}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="mt-3">
          <div className="relative mb-2">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск станции..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:border-[#0369A1] focus:outline-none"
            />
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {visible.length === 0 && (
              <p className="text-xs text-gray-400 py-2 text-center">Станция не найдена</p>
            )}
            {visible.map(m => (
              <label key={m} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selected.includes(m)}
                  onChange={() => onChange(selected.includes(m) ? selected.filter(x => x !== m) : [...selected, m])}
                  className="w-4 h-4 rounded border-gray-300 accent-[#0369A1] cursor-pointer"
                />
                <span className="flex items-center gap-1.5 text-sm text-gray-700 group-hover:text-[#0F172A] transition-colors flex-1">
                  <span className="w-4 h-4 bg-red-500 rounded-full text-white text-[8px] flex items-center justify-center font-bold shrink-0">М</span>
                  {m}
                </span>
                <span className="text-xs text-gray-400">{counts[m]}</span>
              </label>
            ))}
          </div>
          {selected.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="mt-2 text-xs text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
            >
              Снять все ({selected.length})
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function FilterSection({ title, children, defaultOpen = true, scrollable = false }: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  scrollable?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-100 pb-4 mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full text-left group cursor-pointer"
      >
        <span className="text-sm font-semibold text-[#0F172A]">{title}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className={`mt-3 space-y-2 ${scrollable ? 'max-h-44 overflow-y-auto pr-1' : ''}`}>
          {children}
        </div>
      )}
    </div>
  )
}

function Checkbox({ checked, onChange, label, count }: { checked: boolean; onChange: () => void; label: string; count?: number }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded border-gray-300 text-[#0369A1] cursor-pointer accent-[#0369A1]"
      />
      <span className="text-sm text-gray-700 group-hover:text-[#0F172A] transition-colors flex-1">{label}</span>
      {count !== undefined && <span className="text-xs text-gray-400">{count}</span>}
    </label>
  )
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-[#0369A1]/10 text-[#0369A1] text-xs px-2.5 py-1 rounded-full font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-blue-800 cursor-pointer">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  )
}

export default function CatalogClient({
  initialRegions = [],
  initialTypes = [],
  initialDistrict,
  initialNeighborhood,
  initialCity,
  initialMetro,
  initialProfile,
  lockRegion = false,
  lockType = false,
  lockMetro = false,
  lockProfile = false,
  title = 'Каталог школ России',
  subtitle,
  seoCity,
  breadcrumbs = [{ label: 'Все школы' }],
  featureFilter,
  languageFilter,
  seoContent,
}: CatalogClientProps) {
  const [filters, setFilters] = useState<Filters>({
    regions: initialRegions,
    types: initialTypes,
    districts: initialDistrict ? [initialDistrict] : [],
    neighborhoods: initialNeighborhood ? [initialNeighborhood] : [],
    moCities: initialCity ? [initialCity] : [],
    priceMode: 'all',
    priceCategories: [],
    levels: [],
    minRating: 0,
    metro: initialMetro ? [initialMetro] : [],
    profiles: initialProfile ? [initialProfile as ProfileId] : [],
    featureFilters: [],
    sort: 'rating',
  })
  const router = useRouter()
  const isFirstMount = useRef(true)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [mapSchoolId, setMapSchoolId] = useState<string | null>(null)

  // При смене фильтров в режиме карты — сбрасываем выбранную школу (возврат к обзору города)
  useEffect(() => {
    if (viewMode === 'map') setMapSchoolId(null)
  }, [filters]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }
    // From /shkoly/{region}/profilnye/ → 1 profile selected → region/profilnye/{profile}/
    if (lockRegion && lockType && initialTypes[0] === 'profilnye' && !lockProfile
        && filters.profiles.length === 1) {
      router.push(`/shkoly/${initialRegions[0]}/profilnye/${filters.profiles[0]}/`)
      return
    }

    // From /shkoly/moskovskaya-oblast/{type}/ → 1 city selected → city+type static page
    if (lockRegion && lockType && initialRegions[0] === 'moskovskaya-oblast'
        && filters.moCities.length === 1) {
      const slug = moCityLabelToSlug[filters.moCities[0]]
      const t = initialTypes[0]
      if (slug && t) { router.push(`/shkoly/moskovskaya-oblast/gorod/${slug}/${t}/`); return }
    }

    if (lockRegion && lockType) return

    // From /shkoly/tipy/yazykovye/{lang}/ → 1 region selected → lang/region static page
    if (languageFilter && !lockRegion && filters.regions.length === 1) {
      router.push(`/shkoly/tipy/yazykovye/${languageFilter}/${filters.regions[0]}/`)
      return
    }

    // From /shkoly/osobennosti/{feature}/ → 1 region selected → region-feature page
    if (featureFilter && !lockRegion && filters.regions.length === 1 && filters.types.length === 0) {
      const r = filters.regions[0]
      const featureToUrl: Partial<Record<FeatureSlug, string>> = {
        'podgotovka-k-ege': `/shkoly/${r}/podgotovka-k-ege/`,
        'podgotovka-k-oge': `/shkoly/${r}/podgotovka-k-oge/`,
        'it-klass':          `/shkoly/${r}/programmirovanie/`,
      }
      const url = featureToUrl[featureFilter] ?? `/shkoly/${r}/osobennosti/${featureFilter}/`
      router.push(url)
      return
    }

    // From /shkoly/ → 1 region (no type) → region page
    if (!lockRegion) {
      if (filters.regions.length === 1 && filters.types.length === 0) {
        router.push(`/shkoly/${filters.regions[0]}/`)
        return
      }
      // From /shkoly/ → 1 region + 1 type → region/type page
      if (filters.regions.length === 1 && filters.types.length === 1) {
        router.push(`/shkoly/${filters.regions[0]}/${filters.types[0]}/`)
        return
      }
      // From /shkoly/ → 1 type, no region → global type page
      if (filters.regions.length === 0 && filters.types.length === 1) {
        router.push(`/shkoly/tipy/${filters.types[0]}/`)
        return
      }
    }

    // From /shkoly/{region}/ (not a district/city page) → 1 type, no districts → region/type page
    if (lockRegion && !lockType && !initialDistrict && !initialCity && initialRegions.length === 1
        && filters.types.length === 1 && filters.districts.length === 0) {
      router.push(`/shkoly/${initialRegions[0]}/${filters.types[0]}/`)
      return
    }

    // From /shkoly/moskva/rayon/{district}/ → 1 type selected → district+type static page
    if (lockRegion && !lockType && initialDistrict && initialRegions[0] === 'moskva'
        && filters.types.length === 1 && filters.districts.length === 0) {
      const slug = districtLabelToSlug[initialDistrict]
      if (slug) { router.push(`/shkoly/moskva/rayon/${slug}/${filters.types[0]}/`); return }
    }

    // From /shkoly/moskva/ → 1 district, no types → district page
    if (lockRegion && !lockType && !initialDistrict && initialRegions[0] === 'moskva'
        && filters.districts.length === 1 && filters.types.length === 0) {
      const slug = districtLabelToSlug[filters.districts[0]]
      if (slug) { router.push(`/shkoly/moskva/rayon/${slug}/`); return }
    }

    // From /shkoly/moskovskaya-oblast/gorod/{city}/ → 1 type selected → city+type static page
    if (lockRegion && !lockType && initialCity && initialRegions[0] === 'moskovskaya-oblast'
        && filters.types.length === 1 && filters.moCities.length <= 1) {
      const slug = moCityLabelToSlug[initialCity]
      if (slug) { router.push(`/shkoly/moskovskaya-oblast/gorod/${slug}/${filters.types[0]}/`); return }
    }

    // From /shkoly/moskovskaya-oblast/ → 1 city, no types → city page
    if (lockRegion && !lockType && !initialCity && initialRegions[0] === 'moskovskaya-oblast'
        && filters.moCities.length === 1 && filters.types.length === 0) {
      const slug = moCityLabelToSlug[filters.moCities[0]]
      if (slug) { router.push(`/shkoly/moskovskaya-oblast/gorod/${slug}/`); return }
    }

    // From /shkoly/moskva/ → 1 metro selected → metro station page
    if (lockRegion && !lockMetro && initialRegions[0] === 'moskva'
        && filters.metro.length === 1 && filters.types.length === 0 && filters.districts.length === 0) {
      const slug = metroNameToSlug[filters.metro[0]]
      if (slug) { router.push(`/shkoly/moskva/metro/${slug}/`); return }
    }

    // From /shkoly/tipy/{type}/ → 1 metro selected → Moscow metro station page
    if (lockType && !lockRegion && !lockMetro
        && filters.metro.length === 1 && filters.districts.length === 0) {
      const slug = metroNameToSlug[filters.metro[0]]
      if (slug) { router.push(`/shkoly/moskva/metro/${slug}/`); return }
    }
  }, [filters.regions, filters.types, filters.districts, filters.moCities, filters.metro, filters.profiles])

  // contextMetro и metroCount объявлены ниже — после baseForMetro

  // moscowDistricts / Neighborhoods / moCityList объявлены ниже — после baseFor* мемо

  // ── Вспомогательная функция: базовые фильтры без конкретного измерения ───────
  const applyBaseFilters = useCallback((
    skip: 'districts' | 'neighborhoods' | 'moCities' | 'types' | 'metro' | 'profiles' | 'features' | 'regions' | 'levels' | 'price' | 'none' = 'none'
  ) => {
    let list = [...schools]
    const activeRegions = lockRegion ? initialRegions : filters.regions
    if (skip !== 'regions' && activeRegions.length) list = list.filter(s => activeRegions.includes(s.region))
    if (skip !== 'districts' && filters.districts.length) list = list.filter(s => s.district && filters.districts.includes(s.district))
    if (skip !== 'neighborhoods' && filters.neighborhoods.length) list = list.filter(s => s.neighborhood && filters.neighborhoods.includes(s.neighborhood))
    if (skip !== 'moCities' && filters.moCities.length) list = list.filter(s => s.city && filters.moCities.includes(s.city))
    if (skip !== 'metro' && filters.metro.length) list = list.filter(s => s.metro && filters.metro.includes(s.metro))
    const activeTypes = lockType ? initialTypes : filters.types
    if (skip !== 'types' && activeTypes.length) list = list.filter(s => activeTypes.includes(s.type))
    if (skip !== 'price') {
      if (filters.priceCategories.length) {
        list = list.filter(s => filters.priceCategories.includes(getPriceCategory(s.priceFrom)))
      } else {
        if (filters.priceMode === 'free') list = list.filter(s => s.priceFrom === 0 || s.priceFrom === undefined)
        if (filters.priceMode === 'paid') list = list.filter(s => s.priceFrom !== undefined && s.priceFrom > 0)
      }
    }
    if (skip !== 'levels' && filters.levels.length)
      list = list.filter(s => getSchoolLevels(s.grades).some(l => filters.levels.includes(l)))
    if (filters.minRating > 0) list = list.filter(s => s.rating >= filters.minRating)
    if (skip !== 'profiles' && filters.profiles.length)
      list = list.filter(s => { const p = detectProfile(s); return p && filters.profiles.includes(p) })
    if (skip !== 'features' && filters.featureFilters.length) {
      list = list.filter(s => {
        const haystack = [s.name, s.description, s.fullDescription ?? '', ...s.features].join(' ').toLowerCase()
        return filters.featureFilters.every(slug => {
          const meta = featureMetas.find(f => f.slug === slug)
          return meta ? meta.keywords.some(kw => haystack.includes(kw.toLowerCase())) : false
        })
      })
    }
    return list
  }, [filters, initialRegions, initialTypes, lockRegion, lockType, schools])

  // Базовые списки для подсчёта фасетов (без своего измерения)
  const baseForDistricts    = useMemo(() => applyBaseFilters('districts'),    [applyBaseFilters])
  const baseForNeighborhood = useMemo(() => applyBaseFilters('neighborhoods'), [applyBaseFilters])
  const baseForMoCity       = useMemo(() => applyBaseFilters('moCities'),     [applyBaseFilters])
  const baseForTypes        = useMemo(() => applyBaseFilters('types'),        [applyBaseFilters])
  const baseForMetro        = useMemo(() => applyBaseFilters('metro'),        [applyBaseFilters])
  const baseForProfiles     = useMemo(() => applyBaseFilters('profiles'),     [applyBaseFilters])
  const baseForRegions      = useMemo(() => applyBaseFilters('regions'),      [applyBaseFilters])
  const baseForFeatures     = useMemo(() => applyBaseFilters('features'),     [applyBaseFilters])

  // Метро — только станции из текущей выборки (без metro-фильтра), с фасетными счётчиками
  const contextMetro = useMemo(() =>
    Array.from(new Set(baseForMetro.map(s => s.metro).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, 'ru')),
    [baseForMetro]
  )
  const metroCount = useMemo(() =>
    Object.fromEntries(contextMetro.map(m => [m, baseForMetro.filter(s => s.metro === m).length])),
    [contextMetro, baseForMetro]
  )

  // Доступные округа/районы/города — только те, где есть школы при текущих фильтрах
  // Округа/метро Москвы показываем только когда Москва явно выбрана или это страница Москвы
  const isMoscowContext = initialRegions.includes('moskva') || (!lockRegion && filters.regions.includes('moskva'))
  const isMoContext     = initialRegions.includes('moskovskaya-oblast') || (!lockRegion && filters.regions.includes('moskovskaya-oblast'))

  const moscowDistricts = useMemo(() => {
    if (!isMoscowContext) return []
    return Array.from(new Set(
      baseForDistricts.filter(s => s.district).map(s => s.district!)
    )).sort((a, b) => a.localeCompare(b, 'ru'))
  }, [isMoscowContext, baseForDistricts])

  const moscowNeighborhoods = useMemo(() => {
    if (!isMoscowContext) return []
    const baseList = filters.districts.length
      ? baseForNeighborhood.filter(s => s.neighborhood && filters.districts.includes(s.district!))
      : baseForNeighborhood.filter(s => s.neighborhood)
    return Array.from(new Set(baseList.map(s => s.neighborhood!))).sort((a, b) => a.localeCompare(b, 'ru'))
  }, [isMoscowContext, filters.districts, baseForNeighborhood])

  const moCityList = useMemo(() => {
    if (!isMoContext) return []
    return Array.from(new Set(
      baseForMoCity.filter(s => s.city).map(s => s.city!)
    )).sort((a, b) => a.localeCompare(b, 'ru'))
  }, [isMoContext, baseForMoCity])

  const filtered = useMemo(() => {
    let list = applyBaseFilters('none')
    // Page-level feature filter (from URL)
    if (featureFilter) {
      const meta = featureMetas.find(f => f.slug === featureFilter)
      if (meta) {
        list = list.filter(s => {
          const haystack = [s.name, s.description, s.fullDescription ?? '', ...s.features].join(' ').toLowerCase()
          return meta.keywords.some(kw => haystack.includes(kw.toLowerCase()))
        })
      }
    }
    // Page-level language filter
    if (languageFilter) {
      const lmeta = languageMetas.find(l => l.slug === languageFilter)
      if (lmeta) {
        list = list.filter(s => {
          if (s.languages && s.languages.includes(languageFilter)) return true
          const haystack = [s.name, s.description, s.fullDescription ?? '', ...s.features].join(' ').toLowerCase()
          return lmeta.keywords.some(kw => haystack.includes(kw.toLowerCase()))
        })
      }
    }
    switch (filters.sort) {
      case 'rating': list.sort((a, b) => b.rating - a.rating); break
      case 'reviews': list.sort((a, b) => b.reviewCount - a.reviewCount); break
      case 'price_asc': list.sort((a, b) => (a.priceFrom ?? 0) - (b.priceFrom ?? 0)); break
      case 'price_desc': list.sort((a, b) => (b.priceFrom ?? 0) - (a.priceFrom ?? 0)); break
    }
    return list
  }, [applyBaseFilters, filters.sort, featureFilter])

  const resetableFilters: Filters = {
    regions: lockRegion ? initialRegions : [],
    types: lockType ? initialTypes : [],
    districts: initialDistrict ? [initialDistrict] : [],
    neighborhoods: initialNeighborhood ? [initialNeighborhood] : [],
    moCities: initialCity ? [initialCity] : [],
    priceMode: 'all',
    priceCategories: [],
    levels: [],
    minRating: 0,
    metro: lockMetro && initialMetro ? [initialMetro] : [],
    profiles: [],
    featureFilters: [],
    sort: 'rating',
  }

  const activeCount =
    (lockRegion ? 0 : filters.regions.length) +
    (lockType ? 0 : filters.types.length) +
    filters.districts.length +
    (filters.neighborhoods.length > (initialNeighborhood ? 1 : 0) ? filters.neighborhoods.length - (initialNeighborhood ? 1 : 0) : 0) +
    (filters.moCities.length > (initialCity ? 1 : 0) ? filters.moCities.length - (initialCity ? 1 : 0) : 0) +
    (filters.priceCategories.length > 0 ? filters.priceCategories.length : filters.priceMode !== 'all' ? 1 : 0) +
    filters.levels.length +
    (filters.minRating > 0 ? 1 : 0) +
    (lockMetro ? Math.max(0, filters.metro.length - 1) : filters.metro.length) +
    filters.profiles.length +
    filters.featureFilters.length

  function resetFilters() { setFilters(resetableFilters) }

  const mapSchool = useMemo(() => {
    if (!mapSchoolId) return null
    return filtered.find(s => s.id === mapSchoolId) ?? null
  }, [mapSchoolId, filtered])

  // Центры регионов для fallback-карты (без поискового запроса)
  const REGION_CENTERS: Record<string, { lon: number; lat: number; z: number }> = {
    'moskva':             { lon: 37.6173, lat: 55.7558, z: 11 },
    'moskovskaya-oblast': { lon: 37.8960, lat: 55.8040, z: 10 },
    'novosibirsk':        { lon: 82.9357, lat: 55.0084, z: 12 },
    'sankt-peterburg':    { lon: 30.3141, lat: 59.9386, z: 12 },
    'ekaterinburg':       { lon: 60.6122, lat: 56.8519, z: 12 },
    'nizhniy-novgorod':   { lon: 44.0020, lat: 56.3269, z: 12 },
    'chelyabinsk':        { lon: 61.4291, lat: 55.1644, z: 12 },
    'kazan':              { lon: 49.1221, lat: 55.7963, z: 12 },
    'omsk':               { lon: 73.3686, lat: 54.9885, z: 12 },
    'samara':             { lon: 50.1500, lat: 53.2001, z: 12 },
  }

  const mapIframeSrc = useMemo(() => {
    // Школы с координатами из нашей базы
    const withCoords = filtered.filter(s => s.lat && s.lon)

    if (mapSchool) {
      if (mapSchool.lat && mapSchool.lon) {
        const pt = `${mapSchool.lon},${mapSchool.lat},pm2rdm`
        return `https://yandex.ru/map-widget/v1/?ll=${mapSchool.lon},${mapSchool.lat}&z=16&pt=${pt}&lang=ru_RU`
      }
      // Нет координат — fallback на поиск по адресу конкретной школы
      return `https://yandex.ru/map-widget/v1/?text=${encodeURIComponent(`${mapSchool.city}, ${mapSchool.address}`)}&z=16&lang=ru_RU`
    }

    if (withCoords.length > 0) {
      // Показываем все наши школы точками
      const lats = withCoords.map(s => s.lat!)
      const lons = withCoords.map(s => s.lon!)
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2
      const centerLon = (Math.min(...lons) + Math.max(...lons)) / 2
      const spanLat   = Math.max(...lats) - Math.min(...lats)
      const spanLon   = Math.max(...lons) - Math.min(...lons)
      const span      = Math.max(spanLat, spanLon)
      const zoom = span < 0.02 ? 15 : span < 0.05 ? 14 : span < 0.1 ? 13 : span < 0.3 ? 12 : span < 1 ? 11 : 10

      const MAX_PINS = 50
      const pins = withCoords.slice(0, MAX_PINS)
      const pt = pins.map((s, i) => {
        const style = s.id === mapSchoolId ? 'pm2rdm' : 'pm2blm'
        return `${s.lon},${s.lat},${style}${i + 1}`
      }).join('~')

      return `https://yandex.ru/map-widget/v1/?ll=${centerLon},${centerLat}&z=${zoom}&pt=${pt}&lang=ru_RU`
    }

    // Нет координат — показываем центр региона/города БЕЗ text= (не вызывает поиск Яндекса)
    const region = initialRegions[0]
    const center = region ? REGION_CENTERS[region] : null
    if (center) {
      return `https://yandex.ru/map-widget/v1/?ll=${center.lon},${center.lat}&z=${center.z}&lang=ru_RU`
    }
    // Последний fallback — поиск по названию города
    const cityName = initialCity ?? (region ? regionLabels[region] : 'Россия')
    return `https://yandex.ru/map-widget/v1/?text=${encodeURIComponent(cityName)}&z=12&lang=ru_RU`
  }, [mapSchool, mapSchoolId, filtered, initialRegions, initialCity])

  const seoText = useMemo(() => {
    const n = filtered.length

    // Правильные русские названия типов школ (без "школы" там, где тип уже содержит смысл)
    const typeNames: Record<SchoolType, string> = {
      gosudarstvennye: 'Государственные школы',
      chastnie:        'Частные школы',
      online:          'Онлайн-школы',
      vechernie:       'Вечерние школы',
      eksternal:       'Школы-экстернаты',
      semejnye:        'Семейные школы',
      domashnie:       'Домашние школы',
      'pri-vuzakh':    'Школы при вузах',
      profilnye:       'Профильные школы',
      gimnazii:        'Гимназии',
      korrektsionnye:  'Коррекционные школы',
      kadetskie:       'Кадетские школы',
      mezhdunarodnie:  'Международные школы',
      programmirovanie:'Школы программирования',
      shahmatnye:      'Шахматные школы',
      'podgotovka-ege': 'Центры подготовки к ЕГЭ',
      'podgotovka-oge': 'Центры подготовки к ОГЭ',
      internaty:        'Школы-интернаты и пансионы',
      valdorfskie:      'Вальдорфские школы',
      montessori:       'Школы Монтессори',
      pravoslavnye:     'Православные школы',
      sportivnye:       'Спортивные школы',
      yazykovye:        'Языковые школы',
    }
    const typeDescriptions: Record<SchoolType, string> = {
      gosudarstvennye: 'финансируются из государственного бюджета и работают по федеральным образовательным стандартам. Обучение бесплатное для всех детей',
      chastnie: 'предлагают малые классы, индивидуальный подход и расширенные образовательные программы',
      online: 'позволяют получать образование дистанционно из любой точки мира без привязки к месту жительства',
      vechernie: 'работают в вечернее время и рассчитаны на работающих граждан, желающих получить аттестат',
      eksternal: 'дают возможность пройти школьную программу в ускоренном темпе и получить аттестат государственного образца',
      semejnye: 'делают акцент на участии родителей в обучении, сохраняют семейную атмосферу и практикуют малые классы',
      domashnie: 'организуют обучение на дому с официальным педагогическим сопровождением и государственной аттестацией',
      'pri-vuzakh': 'работают на базе университетов и дают ученикам ранний доступ к вузовским программам и преподавателям',
      profilnye: 'специализируются на углублённом изучении конкретных направлений — IT, медицины, права, искусства',
      gimnazii: 'предлагают углублённые академические программы, готовят победителей олимпиад и обеспечивают высокие баллы ЕГЭ',
      korrektsionnye: 'оказывают специализированную помощь детям с ОВЗ: нарушениями слуха, зрения, речи, ЗПР и РАС в адаптированных условиях',
      kadetskie: 'формируют патриотическое воспитание, высокую дисциплину и физическую подготовку через программы НВП и военного дела',
      mezhdunarodnie: 'обучают по программам IB и Cambridge на английском языке, выдавая диплом, признаваемый в зарубежных вузах',
      programmirovanie:'специализируются на IT и программировании: Python, веб-разработка, ИИ, кибербезопасность и реальные проекты',
      shahmatnye:     'обучают шахматам как отдельному предмету, развивая логику, стратегическое мышление и готовя к турнирам ФИДЕ',
      'podgotovka-ege': 'специализируются на интенсивной подготовке к ЕГЭ: авторские методики, пробные экзамены, онлайн и очный форматы для 10–11 классов',
      'podgotovka-oge': 'специализируются на подготовке к ОГЭ: тренировочные экзамены, разбор КИМов, групповые и индивидуальные занятия для 8–9 классов',
      internaty:        'предлагают круглосуточное проживание в кампусе, полный пансион и углублённые образовательные программы для детей из других городов',
      valdorfskie:      'реализуют педагогику Рудольфа Штайнера: художественное воспитание, эвритмия, ритмический день и безотметочное обучение в начальных классах',
      montessori:       'применяют метод Монтессори: подготовленная развивающая среда, смешанные возрастные группы и свободный выбор деятельности',
      pravoslavnye:     'дают полноценное среднее образование в сочетании с православным воспитанием, уроками Закона Божия и участием в церковной жизни',
      sportivnye:       'обеспечивают двухразовые профессиональные тренировки при сохранении полноценного учебного процесса и пути в профессиональный спорт',
      yazykovye:        'специализируются на углублённом изучении иностранных языков, готовят к международным сертификатам и поступлению в зарубежные вузы',
    }
    if (lockType && initialTypes.length === 1 && lockRegion && initialRegions.length === 1) {
      const type = initialTypes[0]
      const region = initialRegions[0]
      const city = regionLabels[region]
      const typeName = typeNames[type]
      return `${typeName} ${city} — учебные заведения, которые ${typeDescriptions[type]}. На портале собрано ${pluralSchools(n)} данного типа в ${city}. Для каждой школы указаны адрес, телефон, официальный сайт, рейтинг и описание программы. Используйте фильтры по округу, рейтингу или стоимости обучения для удобного выбора.`
    }
    if (seoCity) {
      return `Каталог школ ${seoCity} (Московская область) содержит ${pluralSchools(n)} всех типов: государственные, частные, онлайн, вечерние и профильные. Для каждого учебного заведения указаны адрес, контактный телефон, описание образовательной программы и рейтинг родителей. Используйте фильтры по типу школы, рейтингу или стоимости обучения, чтобы найти подходящий вариант.`
    }
    if (lockRegion && initialRegions.length === 1 && !lockType) {
      const region = initialRegions[0]
      const city = regionLabels[region]
      return `Каталог школ ${city} содержит ${pluralSchools(n)} всех типов: государственные, частные, онлайн, вечерние, экстернат, семейные и профильные. Для каждого учебного заведения указаны адрес, контакты, описание программы и рейтинг родителей. Используйте фильтры по типу, округу и стоимости обучения для удобного выбора.`
    }
    return null
  }, [initialRegions, initialTypes, lockRegion, lockType, filtered.length, seoCity])

  const resolvedSubtitle = subtitle ?? `${pluralSchools(filtered.length)} — государственные, частные, онлайн, вечерние, экстернат`

  const FiltersPanel = (
    <div className="space-y-0">
      {!lockRegion && (
        <FilterSection title="Регион" scrollable>
          {regionSlugs.map(r => {
            const cnt = baseForRegions.filter(s => s.region === r).length
            if (cnt === 0 && !filters.regions.includes(r)) return null
            return (
              <Checkbox
                key={r}
                checked={filters.regions.includes(r)}
                onChange={() => setFilters(f => ({ ...f, regions: toggle(f.regions, r), districts: [] }))}
                label={regionLabels[r]}
                count={cnt}
              />
            )
          })}
        </FilterSection>
      )}

      {moscowDistricts.length > 0 && (
        <FilterSection title="Округ Москвы" scrollable>
          {moscowDistricts.map(d => {
            const cnt = baseForDistricts.filter(s => s.district === d).length
            if (cnt === 0 && !filters.districts.includes(d)) return null
            return (
              <Checkbox
                key={d}
                checked={filters.districts.includes(d)}
                onChange={() => setFilters(f => ({ ...f, districts: toggle(f.districts, d), neighborhoods: [] }))}
                label={d}
                count={cnt}
              />
            )
          })}
        </FilterSection>
      )}

      {moscowNeighborhoods.length > 0 && (
        <FilterSection title="Район Москвы" defaultOpen={false} scrollable>
          {moscowNeighborhoods.map(n => {
            const cnt = baseForNeighborhood.filter(s => s.neighborhood === n).length
            if (cnt === 0 && !filters.neighborhoods.includes(n)) return null
            return (
              <Checkbox
                key={n}
                checked={filters.neighborhoods.includes(n)}
                onChange={() => setFilters(f => ({ ...f, neighborhoods: toggle(f.neighborhoods, n) }))}
                label={n}
                count={cnt}
              />
            )
          })}
        </FilterSection>
      )}

      {moCityList.length > 0 && (
        <FilterSection title="Город" scrollable>
          {moCityList.map(city => {
            const cnt = baseForMoCity.filter(s => s.city === city).length
            if (cnt === 0 && !filters.moCities.includes(city)) return null
            return (
              <Checkbox
                key={city}
                checked={filters.moCities.includes(city)}
                onChange={() => setFilters(f => ({ ...f, moCities: toggle(f.moCities, city) }))}
                label={city}
                count={cnt}
              />
            )
          })}
        </FilterSection>
      )}

      {!lockType && (
        <FilterSection title="Тип школы">
          {typeSlugs.map(t => {
            const cnt = baseForTypes.filter(s => s.type === t).length
            if (cnt === 0 && !filters.types.includes(t)) return null
            return (
              <Checkbox
                key={t}
                checked={filters.types.includes(t)}
                onChange={() => setFilters(f => ({ ...f, types: toggle(f.types, t) }))}
                label={typeLabels[t]}
                count={cnt}
              />
            )
          })}
        </FilterSection>
      )}

      {/* Профили — только когда тип зафиксирован как «Профильные» */}
      {(lockType ? initialTypes : filters.types).includes('profilnye' as SchoolType) && (() => {
        const visibleProfiles = SCHOOL_PROFILES.filter(p => {
          const cnt = baseForProfiles.filter(s => s.type === 'profilnye' && detectProfile(s) === p.id).length
          return cnt > 0 || filters.profiles.includes(p.id)
        })
        if (visibleProfiles.length === 0) return null
        return (
          <FilterSection title="Профиль" scrollable>
            {visibleProfiles.map(p => {
              const cnt = baseForProfiles.filter(s => s.type === 'profilnye' && detectProfile(s) === p.id).length
              return (
                <Checkbox
                  key={p.id}
                  checked={filters.profiles.includes(p.id)}
                  onChange={() => setFilters(f => ({ ...f, profiles: toggle(f.profiles, p.id) }))}
                  label={p.label}
                  count={cnt}
                />
              )
            })}
          </FilterSection>
        )
      })()}

      {/* Ступень обучения */}
      <FilterSection title="Ступень обучения" defaultOpen={false}>
        {(['elementary', 'middle', 'high'] as EducationLevel[]).map(lvl => {
          const cnt = applyBaseFilters('levels').filter(s => getSchoolLevels(s.grades).includes(lvl)).length
          return (
            <Checkbox
              key={lvl}
              checked={filters.levels.includes(lvl)}
              onChange={() => setFilters(f => ({ ...f, levels: toggle(f.levels, lvl) }))}
              label={LEVEL_LABELS[lvl]}
              count={cnt}
            />
          )
        })}
      </FilterSection>

      {/* Стоимость */}
      <FilterSection title="Стоимость" defaultOpen={false}>
        {(['free', 'budget', 'mid', 'premium'] as const).map(cat => {
          const cnt = applyBaseFilters('price').filter(s => getPriceCategory(s.priceFrom) === cat).length
          if (cnt === 0 && !filters.priceCategories.includes(cat)) return null
          return (
            <Checkbox
              key={cat}
              checked={filters.priceCategories.includes(cat)}
              onChange={() => setFilters(f => ({ ...f, priceCategories: toggle(f.priceCategories, cat), priceMode: 'all' }))}
              label={PRICE_LABELS[cat]}
              count={cnt}
            />
          )
        })}
      </FilterSection>

      <FilterSection title="Рейтинг">
        {[{ val: 0, label: 'Любой' }, { val: 4, label: 'от 4.0 ★' }, { val: 4.5, label: 'от 4.5 ★' }, { val: 4.8, label: 'от 4.8 ★' }].map(({ val, label }) => (
          <label key={val} className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="radio"
              name="rating"
              checked={filters.minRating === val}
              onChange={() => setFilters(f => ({ ...f, minRating: val }))}
              className="w-4 h-4 accent-[#0369A1] cursor-pointer"
            />
            <span className="text-sm text-gray-700 group-hover:text-[#0F172A] transition-colors">{label}</span>
          </label>
        ))}
      </FilterSection>

      {/* Особенности школы */}
      {(() => {
        const visibleFeatures = featureMetas.filter(f => {
          if (featureFilter === f.slug) return false // уже применён на уровне страницы
          const cnt = baseForFeatures.filter(s => {
            const haystack = [s.name, s.description, s.fullDescription ?? '', ...s.features].join(' ').toLowerCase()
            return f.keywords.some(kw => haystack.includes(kw.toLowerCase()))
          }).length
          return cnt > 0 || filters.featureFilters.includes(f.slug)
        })
        if (visibleFeatures.length === 0) return null
        return (
          <FilterSection title="Особенности" defaultOpen={false}>
            {visibleFeatures.map(f => {
              const cnt = baseForFeatures.filter(s => {
                const haystack = [s.name, s.description, s.fullDescription ?? '', ...s.features].join(' ').toLowerCase()
                return f.keywords.some(kw => haystack.includes(kw.toLowerCase()))
              }).length
              return (
                <Checkbox
                  key={f.slug}
                  checked={filters.featureFilters.includes(f.slug)}
                  onChange={() => setFilters(flt => ({ ...flt, featureFilters: toggle(flt.featureFilters, f.slug) }))}
                  label={f.label}
                  count={cnt}
                />
              )
            })}
          </FilterSection>
        )
      })()}

      {contextMetro.length > 0 && isMoscowContext && (
        <MetroFilter
          selected={filters.metro}
          onChange={metro => setFilters(f => ({ ...f, metro }))}
          stations={contextMetro}
          counts={metroCount}
        />
      )}

      {activeCount > 0 && (
        <button
          onClick={resetFilters}
          className="w-full text-sm text-red-500 hover:text-red-700 py-2 border border-red-200 rounded-xl hover:bg-red-50 transition-colors duration-200 cursor-pointer font-medium"
        >
          Сбросить все фильтры
        </button>
      )}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs crumbs={breadcrumbs} />

      <div className="mt-6 mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] mb-1">{title}</h1>
          <p className="text-gray-500">{resolvedSubtitle}</p>
        </div>
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="md:hidden flex items-center gap-2 bg-white border-2 border-gray-200 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#0F172A] hover:border-[#0369A1] transition-colors duration-200 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          Фильтры
          {activeCount > 0 && (
            <span className="bg-[#0369A1] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">{activeCount}</span>
          )}
        </button>
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {!lockRegion && filters.regions.map(r => (
            <ActiveChip key={r} label={regionLabels[r]} onRemove={() => setFilters(f => ({ ...f, regions: f.regions.filter(x => x !== r) }))} />
          ))}
          {filters.districts.filter(d => d !== initialDistrict).map(d => (
            <ActiveChip key={d} label={`Округ ${d}`} onRemove={() => setFilters(f => ({ ...f, districts: f.districts.filter(x => x !== d) }))} />
          ))}
          {filters.neighborhoods.filter(n => n !== initialNeighborhood).map(n => (
            <ActiveChip key={n} label={`Район: ${n}`} onRemove={() => setFilters(f => ({ ...f, neighborhoods: f.neighborhoods.filter(x => x !== n) }))} />
          ))}
          {filters.moCities.filter(c => c !== initialCity).map(c => (
            <ActiveChip key={c} label={c} onRemove={() => setFilters(f => ({ ...f, moCities: f.moCities.filter(x => x !== c) }))} />
          ))}
          {!lockType && filters.types.map(t => (
            <ActiveChip key={t} label={typeLabels[t]} onRemove={() => setFilters(f => ({ ...f, types: f.types.filter(x => x !== t) }))} />
          ))}
          {filters.profiles.map(pid => {
            const p = SCHOOL_PROFILES.find(x => x.id === pid)
            return p ? <ActiveChip key={pid} label={p.label} onRemove={() => setFilters(f => ({ ...f, profiles: f.profiles.filter(x => x !== pid) }))} /> : null
          })}
          {filters.priceMode !== 'all' && (
            <ActiveChip label={filters.priceMode === 'free' ? 'Бесплатно' : 'Платные'} onRemove={() => setFilters(f => ({ ...f, priceMode: 'all' }))} />
          )}
          {filters.minRating > 0 && (
            <ActiveChip label={`Рейтинг от ${filters.minRating}`} onRemove={() => setFilters(f => ({ ...f, minRating: 0 }))} />
          )}
          {filters.metro.map(m => (
            <ActiveChip key={m} label={`м. ${m}`} onRemove={() => setFilters(f => ({ ...f, metro: f.metro.filter(x => x !== m) }))} />
          ))}
          {filters.featureFilters.map(slug => {
            const meta = featureMetas.find(f => f.slug === slug)
            return meta ? <ActiveChip key={slug} label={meta.label} onRemove={() => setFilters(f => ({ ...f, featureFilters: f.featureFilters.filter(x => x !== slug) }))} /> : null
          })}
          <button onClick={resetFilters} className="text-xs text-gray-400 hover:text-red-500 transition-colors cursor-pointer px-1">
            Сбросить всё
          </button>
        </div>
      )}

      <div className="flex gap-8 items-start">
        <aside className="hidden md:block w-64 shrink-0 sticky top-24 self-start">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm max-h-[calc(100vh-7rem)] flex flex-col">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
              <span className="font-semibold text-[#0F172A] text-sm">Фильтры</span>
              {activeCount > 0 && (
                <button onClick={resetFilters} className="text-xs text-[#0369A1] hover:underline cursor-pointer">Сбросить</button>
              )}
            </div>
            <div className="overflow-y-auto px-5 pb-5 min-h-0 flex-1">
              {FiltersPanel}
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5 bg-white rounded-xl border border-gray-200 px-4 py-3">
            <span className="text-sm text-gray-500 hidden sm:block">
              Показано: <span className="font-semibold text-[#0F172A]">{filtered.length}</span> школ
            </span>
            <div className="flex items-center gap-3 ml-auto">
              {viewMode === 'grid' && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 hidden sm:block">Сортировка:</span>
                  <select
                    value={filters.sort}
                    onChange={e => setFilters(f => ({ ...f, sort: e.target.value as SortKey }))}
                    className="text-sm font-medium text-[#0F172A] bg-transparent border-none outline-none cursor-pointer"
                  >
                    <option value="rating">По рейтингу</option>
                    <option value="reviews">По отзывам</option>
                    <option value="price_asc">Цена: дешевле</option>
                    <option value="price_desc">Цена: дороже</option>
                  </select>
                </div>
              )}
              <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  title="Плиткой"
                  className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-[#0369A1] text-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                </button>
                <button
                  onClick={() => { setViewMode('map'); setMapSchoolId(null) }}
                  title="На карте"
                  className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'map' ? 'bg-[#0369A1] text-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
              <p className="text-gray-500 mb-3">По выбранным фильтрам школы не найдены</p>
              <button onClick={resetFilters} className="text-sm text-[#0369A1] hover:underline cursor-pointer font-medium">
                Сбросить фильтры
              </button>
            </div>
          )}

          {filtered.length > 0 && viewMode === 'grid' && (() => {
            const cards = filtered.map((school, i) => {
              const elements: React.ReactNode[] = []
              if (i === 6) {
                elements.push(
                  <div key="ad-desktop" className="col-span-full"><AdBanner variant="leaderboard" /></div>,
                  <div key="ad-mobile" className="col-span-full"><AdBanner variant="mobile" /></div>
                )
              }
              elements.push(<SchoolCard key={school.id} school={school} />)
              return elements
            })
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {cards}
              </div>
            )
          })()}

          {filtered.length > 0 && viewMode === 'map' && (
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="w-full md:w-3/5 md:sticky md:top-24">
                <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 520 }}>
                  <iframe
                    key={mapIframeSrc}
                    src={mapIframeSrc}
                    width="100%"
                    height="520"
                    allowFullScreen
                    loading="lazy"
                    title="Карта школ"
                    style={{ border: 0, display: 'block' }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {mapSchool
                    ? <>📍 <span className="font-medium text-[#0F172A]">{mapSchool.name}</span> — <Link href={`/shkola/${mapSchool.slug}/`} className="text-[#0369A1] hover:underline">открыть карточку</Link></>
                    : '← Нажмите на школу в списке, чтобы показать её на карте'}
                </p>
              </div>
              <div className="w-full md:w-2/5 space-y-2 max-h-[560px] overflow-y-auto pr-1">
                {filtered.map(school => {
                  const isSelected = mapSchool?.id === school.id
                  return (
                    <div
                      key={school.id}
                      className={`bg-white rounded-xl border transition-colors ${isSelected ? 'border-[#0369A1] ring-2 ring-blue-100' : 'border-gray-200 hover:border-[#0369A1]'}`}
                    >
                      {/* Верхняя часть — клик показывает на карте */}
                      <button
                        onClick={() => setMapSchoolId(school.id)}
                        className="w-full text-left p-3.5 pb-2 cursor-pointer"
                      >
                        <p className="font-semibold text-sm text-[#0F172A] leading-snug">{school.name}</p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{school.address}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {school.metro && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <span className="w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[7px] flex items-center justify-center font-bold">М</span>
                              {school.metro}
                            </span>
                          )}
                          <span className="text-xs text-amber-500 font-medium">★ {school.rating}</span>
                        </div>
                      </button>
                      {/* Нижняя часть — ссылка на карточку, всегда видна */}
                      <div className="px-3.5 pb-3">
                        <Link
                          href={`/shkola/${school.slug}/`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0369A1] hover:text-blue-700 transition-colors"
                        >
                          Открыть карточку
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {seoContent && (
            <div className="mt-4">{seoContent}</div>
          )}

          {seoText && !seoContent && (
            <div className="mt-10 bg-gray-50 rounded-2xl border border-gray-200 p-6 md:p-8">
              <h2 className="text-lg font-semibold text-[#0F172A] mb-3">{title}</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{seoText}</p>
            </div>
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-5 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
              <span className="font-bold text-[#0F172A] text-lg">Фильтры</span>
              <button onClick={() => setMobileFiltersOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-4">{FiltersPanel}</div>
            <div className="sticky bottom-0 bg-white px-5 py-4 border-t border-gray-100">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full bg-[#0369A1] hover:bg-blue-500 text-white py-3.5 rounded-xl font-semibold transition-colors duration-200 cursor-pointer"
              >
                Показать {filtered.length} школ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
