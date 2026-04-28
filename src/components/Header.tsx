import Link from 'next/link'
import Image from 'next/image'
import { typeSlugs, typeLabels } from '@/data/schools'
import RegionSelector from '@/components/RegionSelector'

export default function Header() {
  return (
    <header className="bg-[#0F172A] text-white sticky top-0 z-50 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <Link href="/" className="flex items-center shrink-0 bg-white rounded-xl px-3 py-1.5 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
            <Image
              src="/logo.png"
              alt="Школы России — найдите лучшую школу для вашего ребёнка"
              width={220}
              height={70}
              className="h-12 w-auto object-contain"
              priority
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <RegionSelector />
            <Link
              href="/shkoly/"
              className="text-sm bg-[#0369A1] text-white px-5 py-2.5 rounded-xl hover:bg-blue-500 transition-colors duration-200 font-semibold cursor-pointer"
            >
              Все школы
            </Link>
          </nav>
        </div>

        <div className="hidden md:flex gap-6 pb-3 overflow-x-auto border-t border-white/10 pt-2.5">
          {typeSlugs.map(type => (
            <Link
              key={type}
              href={`/shkoly/moskva/${type}/`}
              className="text-xs text-slate-400 hover:text-white whitespace-nowrap transition-colors duration-200 cursor-pointer"
            >
              {typeLabels[type]} школы
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}
