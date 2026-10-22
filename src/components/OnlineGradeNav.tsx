import Link from 'next/link'
import pages from '@/data/online-grade-pages.json'

export default function OnlineGradeNav() {
  return <nav id="klassy" className="scroll-mt-28 max-w-5xl mx-auto mb-8" aria-label="Онлайн-школы по классам">
    <h2 className="text-2xl font-bold mb-3">Выберите класс и учебный маршрут</h2>
    <div className="flex flex-wrap gap-2">{pages.map(p => <Link key={p.slug} href={`/shkoly/tipy/online/${p.slug}/`} className="rounded-lg border border-slate-200 px-4 py-3 text-blue-800 bg-white">{p.label}</Link>)}<Link href="/shkoly/tipy/zaochnye/" className="rounded-lg border border-slate-200 px-4 py-3 text-blue-800 bg-white">Заочная школа</Link></div>
  </nav>
}
