import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import { onlineBrands } from '@/data/online-brands'

export const metadata: Metadata = {
  title: 'Отзывы об онлайн-школах России — мнения родителей и учеников',
  description: 'Отзывы об онлайн-школах России: подробный разбор опыта семей, плюсы и минусы каждой школы и возможность добавить свой отзыв.',
  alternates: { canonical: 'https://pro-schools.ru/otzyvy/online-shkoly/' },
}

export default function OnlineSchoolReviewsHub() {
  const sorted = [...onlineBrands].sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  return <main style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px 64px' }}>
    <Breadcrumbs crumbs={[{ label: 'Онлайн-школы', href: '/shkoly/tipy/online/' }, { label: 'Отзывы' }]} />
    <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.15, margin: '24px 0 12px' }}>Отзывы об онлайн-школах России</h1>
    <p style={{ fontSize: 17, lineHeight: 1.65, maxWidth: 720 }}>Здесь представлены все 32 онлайн-школы текущего каталога. У каждой — отдельный разбор родительского опыта: что нравится в обучении, какие возникают сложности и что проверить перед выбором.</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(255px, 1fr))', gap: 12, marginTop: 28 }}>
      {sorted.map(b => {
        return <Link key={b.slug} href={`/otzyvy/online-shkoly/${b.slug}/`} style={{ display: 'block', padding: 18, border: '1px solid #e6e0d8', borderRadius: 14, color: '#1a1814', textDecoration: 'none', background: '#fff' }}>
          <strong style={{ fontSize: 18 }}>{b.name}</strong>
          <div style={{ color: '#57534e', fontSize: 14, marginTop: 5 }}>{b.grades} классы · плюсы, минусы и опыт семей</div>
          <div style={{ color: '#0369a1', fontSize: 14, marginTop: 14, fontWeight: 700 }}>Отзывы и мнения →</div>
        </Link>
      })}
    </div>
    <p style={{ marginTop: 24, color: '#57534e', lineHeight: 1.6 }}>Разборы посвящены обучению детей в школе. Отзывы о вузах, отдельных курсах и работе в компании сюда не включены.</p>
  </main>
}
