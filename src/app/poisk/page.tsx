import { Suspense } from 'react'
import SearchPageInner from './SearchPageInner'

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
