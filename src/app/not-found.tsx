import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-[#0369A1] mb-4 leading-none">404</div>
        <h1 className="text-2xl font-bold text-[#0F172A] mb-3">Страница не найдена</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Такой страницы не существует. Возможно, адрес изменился или содержимое было удалено.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-[#0369A1] hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors duration-200 cursor-pointer"
          >
            На главную
          </Link>
          <Link
            href="/shkoly/"
            className="bg-white border-2 border-gray-200 hover:border-[#0369A1] text-[#0F172A] px-6 py-3 rounded-xl font-semibold text-sm transition-colors duration-200 cursor-pointer"
          >
            Каталог школ
          </Link>
        </div>
      </div>
    </div>
  )
}
