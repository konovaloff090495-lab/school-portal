import Link from 'next/link'
import Image from 'next/image'
import { regionSlugs, regionLabels, typeSlugs, typeLabels, moscowDistrictSlugs, moscowDistrictLabels, moCitySlugs, moCityLabels } from '@/data/schools'

export default function Footer() {
  return (
    <footer className="bg-[#0F172A] text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div>
            <Link href="/" className="inline-block mb-5 bg-white rounded-xl px-3 py-2 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
              <Image
                src="/logo.png"
                alt="Школы России"
                width={200}
                height={64}
                className="h-12 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Крупнейший каталог школ России. Государственные, частные, онлайн-школы, вечерние и экстернат.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Регионы</h3>
            <ul className="space-y-2.5">
              {regionSlugs.map(region => (
                <li key={region}>
                  <Link href={`/shkoly/${region}/`} className="text-sm text-slate-400 hover:text-white transition-colors duration-200 cursor-pointer">
                    Школы — {regionLabels[region]}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/shkoly/" className="text-sm text-slate-400 hover:text-white transition-colors duration-200 cursor-pointer">
                  Все школы России
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Типы школ</h3>
            <ul className="space-y-2.5">
              {typeSlugs.map(type => (
                <li key={type}>
                  <Link href={`/shkoly/moskva/${type}/`} className="text-sm text-slate-400 hover:text-white transition-colors duration-200 cursor-pointer">
                    {typeLabels[type]} школы Москвы
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Округа Москвы</h3>
            <ul className="space-y-2.5">
              {moscowDistrictSlugs.map(d => (
                <li key={d}>
                  <Link href={`/shkoly/moskva/rayon/${d}/`} className="text-sm text-slate-400 hover:text-white transition-colors duration-200 cursor-pointer">
                    Школы {moscowDistrictLabels[d]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Города МО</h3>
            <ul className="space-y-2.5">
              {moCitySlugs.map(c => (
                <li key={c}>
                  <Link href={`/shkoly/moskovskaya-oblast/gorod/${c}/`} className="text-sm text-slate-400 hover:text-white transition-colors duration-200 cursor-pointer">
                    Школы {moCityLabels[c]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>© {new Date().getFullYear()} ШколыРоссии.рф</span>
            <Link href="/o-nas/" className="hover:text-white transition-colors">О сайте</Link>
            <Link href="/politika-konfidentsialnosti/" className="hover:text-white transition-colors">Политика конфиденциальности</Link>
            <Link href="/soglasie-marketing/" className="hover:text-white transition-colors">Согласие на маркетинг</Link>
          </p>
          <p className="text-xs text-slate-500">
            Размещение рекламы: <a href="mailto:info@pro-schools.ru" className="text-[#0369A1] hover:underline">info@pro-schools.ru</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
