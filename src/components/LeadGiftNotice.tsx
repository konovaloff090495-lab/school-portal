/** Общее обещание бонусов у первичных лид-форм. */
export default function LeadGiftNotice({ afterTest = false }: { afterTest?: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#FFD3BC] bg-[#FFF1E8] p-3 text-[#9A3412]" data-lead-gift-notice>
      <svg aria-hidden="true" className="mt-0.5 h-6 w-6 shrink-0 text-[#C2410C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h18v4H3zM5 12v9h14v-9M12 8v13M12 8H8.5A3 3 0 1 1 12 5v3Zm0 0h3.5A3 3 0 1 0 12 5v3Z" />
      </svg>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-snug">{afterTest ? 'После теста вас ждут подарки' : 'После заявки — ещё и подарки'}</p>
        <p className="mt-1 text-xs leading-relaxed">Выберите бесплатный урок, пробный доступ или другой бонус от партнёров. Условия — на странице подарка.</p>
      </div>
    </div>
  )
}
