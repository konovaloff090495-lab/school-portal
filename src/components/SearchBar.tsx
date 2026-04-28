'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/poisk/?q=${encodeURIComponent(q)}` : '/poisk/')
  }

  const suggestions = ['Синергия', 'Онлайн-школы', 'Экстернат', 'Вечерние школы']

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="relative flex items-center bg-white rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/20">
        <svg className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Найдите школу по названию или адресу..."
          className="flex-1 pl-12 pr-4 py-4 text-gray-900 text-base placeholder-gray-400 outline-none bg-transparent"
        />
        <button
          type="submit"
          className="shrink-0 m-1.5 bg-[#0369A1] hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200 cursor-pointer"
        >
          Найти
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {suggestions.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => router.push(`/poisk/?q=${encodeURIComponent(s)}`)}
            className="text-xs bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-full transition-colors duration-200 cursor-pointer backdrop-blur-sm"
          >
            {s}
          </button>

        ))}
      </div>
    </form>
  )
}
