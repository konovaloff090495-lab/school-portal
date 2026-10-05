import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import { onlineBrands } from '@/data/online-brands'
import { onlineReviewResearch } from '@/data/online-review-research'

export const metadata: Metadata = {
  title: 'Отзывы об онлайн-школах России — мнения родителей и учеников',
  description: 'Отзывы об онлайн-школах России: что хвалят и на что жалуются родители. Ссылки на первоисточники, отдельная страница каждой школы и форма для собственного отзыва.',
  alternates: { canonical: 'https://pro-schools.ru/otzyvy/online-shkoly/' },
}

export default function OnlineSchoolReviewsHub() {
  const sorted = [...onlineBrands].sort((a, b) => Number(!!onlineReviewResearch[b.slug]) - Number(!!onlineReviewResearch[a.slug]) || a.name.localeCompare(b.name, 'ru'))
  return <main style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px 64px' }}>
    <Breadcrumbs crumbs={[{ label: 'Онлайн-школы', href: '/shkoly/tipy/online/' }, { label: 'Отзывы' }]} />
    <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.15, margin: '24px 0 12px' }}>Отзывы об онлайн-школах России</h1>
    <p style={{ fontSize: 17, lineHeight: 1.65, maxWidth: 720 }}>Здесь представлены все 32 онлайн-школы текущего каталога. Для каждой собрали доступные мнения семей и указали источники. Где отзывов мало, это прямо отмечено. Число источников показывает размер проверенной выборки ссылок, а не общее число отзывов на площадках.</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(255px, 1fr))', gap: 12, marginTop: 28 }}>
      {sorted.map(b => {
        const research = onlineReviewResearch[b.slug]
        return <Link key={b.slug} href={`/otzyvy/online-shkoly/${b.slug}/`} style={{ display: 'block', padding: 18, border: '1px solid #e6e0d8', borderRadius: 14, color: '#1a1814', textDecoration: 'none', background: '#fff' }}>
          <strong style={{ fontSize: 18 }}>{b.name}</strong>
          <div style={{ color: '#57534e', fontSize: 14, marginTop: 5 }}>{b.grades} классы · {research?.evidence.length ? `проверено ${research.evidence.length} ${research.evidence.length === 1 ? 'источник' : research.evidence.length < 5 ? 'источника' : 'источников'}` : 'проверенных отзывов пока нет'}</div>
          <div style={{ color: '#0369a1', fontSize: 14, marginTop: 14, fontWeight: 700 }}>Отзывы и мнения →</div>
        </Link>
      })}
    </div>
    <p style={{ marginTop: 24, color: '#57534e', lineHeight: 1.6 }}>Сами отзывы остаются на площадках авторов. Мы кратко пересказываем опыт, показываем разные оценки и даём ссылку для проверки. Отзывы о вузах, дополнительных курсах и работе в школе не считаем отзывами о школьном обучении.</p>
  </main>
}
