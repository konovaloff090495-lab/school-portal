import Link from 'next/link'

export const metadata = { title: 'Каталог школ и учебные материалы — ProSchools' }

export default function InformationPage() {
  return <div className="mx-auto max-w-3xl px-4 py-12">
    <h1 className="text-3xl font-bold">Каталог школ и учебные материалы</h1>
    <p className="mt-4">Выберите раздел сайта, чтобы продолжить.</p>
    <nav aria-label="Разделы сайта" className="mt-6 flex flex-wrap gap-5 text-sky-800 underline">
      <Link href="/shkoly/">Каталог школ</Link>
      <Link href="/besplatnye-uroki/">Бесплатные уроки</Link>
    </nav>
  </div>
}
