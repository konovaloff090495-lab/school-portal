'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { schools, typeLabels, regionLabels } from '@/data/schools'
import SchoolCard from '@/components/SchoolCard'
import Breadcrumbs from '@/components/Breadcrumbs'

function normalize(s: string) {
  return s.toLowerCase().replace(/ё/g, 'е')
}

export default function SearchPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQ = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(initialQ)

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '')
  }, [searchParams])

  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return schools
    return schools.filter(s =>
      normalize(s.name).includes(q) ||
      normalize(s.description).includes(q) ||
      normalize(s.city).includes(q) ||
      normalize(s.address).includes(q) ||
      normalize(typeLabels[s.type]).includes(q) ||
      normalize(regionLabels[s.region]).includes(q) ||
      (s.fullDescription ? normalize(s.fullDescription).includes(q) : false) ||
      s.features.some(f => normalize(f).includes(q))
    )
  }, [query])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    const params = new URLSearchParams()
    if (val.trim()) params.set('q', val.trim())
    router.replace(`/poisk/${params.toString() ? `?${params}` : ''}`, { scroll: false })
  }

  function handleClear() {
    setQuery('')
    router.replace('/poisk/')
  }

  const q = query.trim()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs crumbs={[
        { label: 'Все школы', href: '/shkoly/' },
        { label: 'Поиск' },
      ]} />

      <div className="mt-6 mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A] mb-4">
          {q ? `Результаты поиска: «${q}»` : 'Поиск по каталогу школ'}
        </h1>

        <form onSubmit={e => e.preventDefault()} className="relative max-w-2xl">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={handleChange}
            autoFocus
            placeholder="Название школы, адрес, тип..."
            className="w-full pl-12 pr-12 py-3.5 rounded-xl border-2 border-gray-200 focus:border-[#0369A1] focus:outline-none text-base text-gray-900 bg-white transition-colors duration-200"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </form>
      </div>

      <div className="flex items-center gap-3 mb-6 text-sm text-gray-500">
        {q ? (
          <>
            <span className="font-semibold text-[#0F172A]">
              {results.length === 0 ? 'Ничего не найдено' : `Найдено: ${results.length}`}
            </span>
            {results.length > 0 && <span>по запросу «{q}»</span>}
          </>
        ) : (
          <span className="font-semibold text-[#0F172A]">Все школы: {schools.length}</span>
        )}
      </div>

      {q && results.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <p className="text-gray-500 mb-4">По запросу «{q}» школы не найдены</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button onClick={handleClear} className="text-sm text-[#0369A1] hover:underline cursor-pointer">
              Показать все школы
            </button>
            <span className="text-gray-300">·</span>
            <Link href="/shkoly/" className="text-sm text-[#0369A1] hover:underline">
              Перейти в каталог
            </Link>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {results.map(school => (
            <SchoolCard key={school.id} school={school} />
          ))}
        </div>
      )}
    </div>
  )
}
