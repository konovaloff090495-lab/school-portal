import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Breadcrumbs from '@/components/Breadcrumbs'
import ReviewsBlock from '@/components/ReviewsBlock'
import { onlineBrandSlugs, getOnlineBrand } from '@/data/online-brands'
import { onlineReviewResearch } from '@/data/online-review-research'

type Props = { params: Promise<{ brand: string }> }
export const dynamicParams = false
export function generateStaticParams() { return onlineBrandSlugs.map(brand => ({ brand })) }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const b = getOnlineBrand((await params).brand)
  if (!b) return {}
  const research = onlineReviewResearch[b.slug]
  const title = `Отзывы об онлайн-школе ${b.name}: плюсы, минусы, мнения родителей`
  const description = research
    ? `Что пишут об онлайн-школе ${b.name}: ${research.evidence.length} разобранных отзыва, положительные и отрицательные мнения, ссылки на источники и свой отзыв.`
    : `Отзывы об онлайн-школе ${b.name}. Добавьте свой опыт обучения; разбор отзывов с внешних площадок готовится.`
  const url = `https://pro-schools.ru/otzyvy/online-shkoly/${b.slug}/`
  return { title, description, alternates: { canonical: url }, robots: research ? undefined : { index: false, follow: true }, openGraph: { title, description, url } }
}

export default async function OnlineBrandReviews({ params }: Props) {
  const b = getOnlineBrand((await params).brand)
  if (!b) notFound()
  const research = onlineReviewResearch[b.slug]
  return <main style={{ maxWidth: 870, margin: '0 auto', padding: '24px 16px 64px', color: '#1a1814' }}>
    <Breadcrumbs crumbs={[{ label: 'Онлайн-школы', href: '/shkoly/tipy/online/' }, { label: 'Отзывы об онлайн-школах', href: '/otzyvy/online-shkoly/' }, { label: b.name }]} />
    <h1 style={{ fontSize: 'clamp(27px, 5vw, 38px)', lineHeight: 1.2, margin: '24px 0 12px' }}>Отзывы про онлайн-школу {b.name}</h1>
    <p style={{ fontSize: 17, lineHeight: 1.65 }}>{b.fullName} — школа для {b.grades} классов. Здесь собраны мнения об обучении детей, а не отзывы о других продуктах бренда. <Link href={`/shkoly/tipy/online/${b.slug}/`} style={{ color: '#0369a1' }}>Цены, формат уроков и аттестация — в обзоре школы.</Link></p>
    {research ? <>
      <div style={{ background: '#f5f8fb', borderRadius: 14, padding: 18, margin: '24px 0' }}>
        <strong>Разобрано {research.evidence.length} отзыва</strong> · источники: {Array.from(new Set(research.evidence.map(e => e.source))).join(', ')} · обновлено {research.updated}
        <p style={{ margin: '8px 0 0', lineHeight: 1.55 }}>Это размер проверенной редакционной выборки. Счётчики площадок шире и могут включать курсы или другие услуги бренда; мы не выдаём их за число изученных отзывов.</p>
      </div>
      <h2 style={h2}>За что хвалят {b.name}</h2>
      <ul style={ul}>{research.good.map(x => <li key={x}>{x}</li>)}</ul>
      <h2 style={h2}>На что жалуются</h2>
      <ul style={ul}>{research.bad.map(x => <li key={x}>{x}</li>)}</ul>
      <h2 style={h2}>Что проверить перед выбором</h2>
      <p style={{ lineHeight: 1.65, fontSize: 16 }}>{research.conclusion}</p>
      <h2 style={h2}>Отзывы и первоисточники</h2>
      <div style={{ display: 'grid', gap: 10, marginBottom: 30 }}>
        {research.evidence.map(e => <article key={e.url} style={{ padding: 16, border: '1px solid #e6e0d8', borderRadius: 12 }}>
          <div style={{ fontSize: 13, color: '#57534e' }}>{e.source} · {e.date} · {e.verdict === 'positive' ? 'положительный' : e.verdict === 'negative' ? 'отрицательный' : 'смешанный'}</div>
          <p style={{ margin: '8px 0', lineHeight: 1.55 }}>{e.note}</p>
          <a href={e.url} target="_blank" rel="nofollow noopener noreferrer" style={{ color: '#0369a1' }}>Прочитать отзыв целиком ↗</a>
        </article>)}
      </div>
    </> : <p style={{ padding: 18, background: '#f5f8fb', borderRadius: 12, lineHeight: 1.6 }}>Мы ещё проверяем отзывы о {b.name} на внешних площадках. Пока здесь можно оставить свой отзыв и посмотреть <Link href={`/shkoly/tipy/online/${b.slug}/`} style={{ color: '#0369a1' }}>информацию о школе</Link>.</p>}
    <h2 style={h2}>Добавить отзыв о {b.name}</h2>
    <p style={{ lineHeight: 1.6 }}>Учились здесь? Напишите, что понравилось и с какими трудностями столкнулись. Отзыв появится после проверки.</p>
    <ReviewsBlock schoolSlug={`online-brand-${b.slug}`} schoolName={b.fullName} />
    <div style={{ marginTop: 30, padding: 18, background: '#faf7f2', borderRadius: 12 }}>
      <strong>Для компаний</strong>
      <p style={{ lineHeight: 1.55, margin: '7px 0 12px' }}>Если нашли неточность или хотите дополнить информацию, напишите нам. Проверим данные и внесём обоснованные правки.</p>
      <a href="https://t.me/Gerasim951" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', color: '#fff', background: '#0369a1', padding: '10px 15px', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>Для компаний — написать в Telegram</a>
    </div>
    <p style={{ marginTop: 25 }}><Link href="/otzyvy/online-shkoly/" style={{ color: '#0369a1' }}>Все онлайн-школы и отзывы →</Link></p>
  </main>
}

const h2: React.CSSProperties = { fontSize: 23, margin: '28px 0 10px' }
const ul: React.CSSProperties = { paddingLeft: 22, lineHeight: 1.7, fontSize: 16 }
