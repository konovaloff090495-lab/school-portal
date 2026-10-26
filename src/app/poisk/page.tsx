import { Suspense } from 'react'
import type { Metadata } from 'next'
import SearchPageInner from './SearchPageInner'

export const metadata: Metadata = { robots: { index: false, follow: true } }

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-gray-500">
        Загрузка...
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  )
}
