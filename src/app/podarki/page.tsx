import Link from 'next/link'

export const metadata = { title: 'Бесплатные учебные материалы — ProSchools' }

export default function InformationPage() {
  return <div className="mx-auto max-w-3xl px-4 py-12">
    <h1 className="text-3xl font-bold">Бесплатные учебные материалы</h1>
    <p className="mt-4">Подборки бесплатных уроков и материалов для школьников.</p>
    <nav aria-label="Разделы сайта" className="mt-6 flex flex-wrap gap-5 text-sky-800 underline">
      <Link href="/shkoly/">Каталог школ</Link>
      <Link href="/besplatnye-uroki/">Бесплатные уроки</Link>
    </nav>
  </div>
}
