import type { TopicFaqItem } from '@/data/textbook-faq'

/**
 * Блок «Частые вопросы» на странице темы учебника.
 *
 * Зачем: 34 % показов раздела — вопросные запросы («что такое…», «почему…»),
 * CTR по ним был 0,16 %: клик забирал избранный ответ конкурента и блок
 * «Вопросы по теме». Вопросы здесь — не выдуманные, а реальные формулировки
 * из GSC; ответ даётся первой фразой, без разгона.
 */
export default function TopicFaq({ items }: { items: TopicFaqItem[] }) {
  if (!items.length) return null
  return (
    <section
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 mb-6"
      aria-labelledby="topic-faq"
    >
      <h2 id="topic-faq" className="text-lg md:text-xl font-black text-[#0F172A] mb-5">
        Частые вопросы
      </h2>
      <div className="divide-y divide-gray-100">
        {items.map((f, i) => (
          <div key={i} className={i === 0 ? 'pb-4' : 'py-4 last:pb-0'}>
            <h3 className="text-base font-bold text-[#0F172A] mb-1.5">{f.q}</h3>
            <p className="text-gray-700 text-sm md:text-base leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
