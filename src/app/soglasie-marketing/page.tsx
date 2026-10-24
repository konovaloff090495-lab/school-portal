import Link from 'next/link'
import { LEAD_CONSENT_VERSION, MARKETING_CONSENT_TEXT } from '@/lib/lead-consent'
export const metadata = { title: 'Согласие на получение рекламы — ProSchools', robots: { index: false, follow: false } }
export default function ConsentPage() {
  return <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
    <Link href="/">На главную</Link>
    <h1 className="text-3xl font-bold mt-6 mb-4">Согласие на получение рекламы</h1>
    <p className="text-sm text-gray-500 mb-6">Редакция {LEAD_CONSENT_VERSION}</p>
    <div className="space-y-5 text-gray-700 leading-relaxed">{MARKETING_CONSENT_TEXT.split('\n\n').map((text, i) => <p key={i}>{text}</p>)}</div>
    <p className="mt-8"><Link className="underline" href="/politika-konfidentsialnosti/">Политика обработки персональных данных</Link></p>
  </main>
}
