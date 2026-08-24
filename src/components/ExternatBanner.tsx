'use client'

const YM_ID = 108789843
const EXTERNAT_URL = 'https://schooluniversity.ru/externat?utm_source=gerasimov_lav&utm_medium=lkpartners'

export default function ExternatBanner() {
  return (
    <div className="col-span-full flex justify-center my-1">
      <a
        href={EXTERNAT_URL}
        target="_blank"
        rel="noopener sponsored"
        onClick={() => window.ym?.(YM_ID, 'reachGoal', 'externat_banner_click')}
        className="group w-full max-w-3xl flex flex-wrap items-center gap-x-5 gap-y-3 bg-gradient-to-r from-[#0F3A5F] to-[#0369A1] rounded-2xl p-5 sm:p-6 border border-white/10 hover:border-white/30 hover:shadow-lg transition-all cursor-pointer"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/diplom-popup.jpg"
          alt="Аттестат государственного образца"
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover object-top shrink-0"
        />
        <div className="flex-1 min-w-[55%] text-white">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wide text-white/50 bg-white/10 px-1.5 py-0.5 rounded">Реклама</span>
          </div>
          <p className="font-bold text-lg sm:text-xl leading-snug">
            Получи аттестат экстерном без посещения школы
          </p>
          <p className="text-white/85 text-sm sm:text-base mt-1">
            Онлайн-обучение · до 5 классов за 1 год · государственный аттестат
          </p>
        </div>
        <span className="shrink-0 bg-white text-[#0369A1] font-semibold text-sm sm:text-base px-5 py-2.5 rounded-lg group-hover:bg-blue-50 transition-colors whitespace-nowrap ml-auto">
          Узнать больше
        </span>
      </a>
    </div>
  )
}
