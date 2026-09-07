import YandexRTBBanner from './YandexRTBBanner'

interface Props {
  blockId: string
  suffix: string
  viewport?: 'mobile' | 'desktop'
  className?: string
}

/**
 * Карточка рекламного места для разделов на Tailwind (/uchebnik/).
 * Высота резервируется заранее — без неё РСЯ не заполняет место (правка 8bc0449).
 */
export default function AdCard({ blockId, suffix, viewport, className = '' }: Props) {
  return (
    <aside
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-3 ${className}`}
      aria-label="Реклама"
    >
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Реклама</span>
        <span className="text-[10px] text-gray-300">16+</span>
      </div>
      <div style={{ minHeight: 250 }}>
        <YandexRTBBanner blockId={blockId} suffix={suffix} viewport={viewport} />
      </div>
    </aside>
  )
}
