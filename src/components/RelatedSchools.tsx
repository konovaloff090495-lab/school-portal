import SchoolCard from './SchoolCard'
import type { RelatedBlock } from '@/lib/related-schools'

/**
 * Блок расширенной выборки для страниц, где по строгому фильтру школ нет.
 * Подпись обязательна: показываем, что это ближайшее расширение запроса,
 * а не точный ответ на него.
 */
export default function RelatedSchools({ block }: { block: RelatedBlock }) {
  if (!block.schools.length) return null
  return (
    <section className="mt-8" aria-label={block.title}>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-5">
        <h2 className="text-lg font-semibold text-[#0F172A]">{block.title}</h2>
        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{block.note}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {block.schools.map(school => (
          <SchoolCard key={school.id} school={school} />
        ))}
      </div>
    </section>
  )
}
