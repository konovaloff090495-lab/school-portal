import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Breadcrumbs from '@/components/Breadcrumbs'
import ReviewsBlock from '@/components/ReviewsBlock'
import { onlineBrandSlugs, getOnlineBrand } from '@/data/online-brands'
import { onlineReviewResearch, indexableOnlineReviewSlugs } from '@/data/online-review-research'

type Props = { params: Promise<{ brand: string }> }
export const dynamicParams = false
export function generateStaticParams() { return onlineBrandSlugs.map(brand => ({ brand })) }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const b = getOnlineBrand((await params).brand)
  if (!b) return {}
  const research = onlineReviewResearch[b.slug]
  const title = `Отзывы об онлайн-школе ${b.name}: плюсы, минусы, мнения родителей`
  const description = research
    ? `Что пишут об онлайн-школе ${b.name}: ${research.evidence.length} проверенных источников, мнения семей, ссылки на отзывы и возможность оставить свой.`
    : `Отзывы об онлайн-школе ${b.name}. Добавьте свой опыт обучения; разбор отзывов с внешних площадок готовится.`
  const url = `https://pro-schools.ru/otzyvy/online-shkoly/${b.slug}/`
  return { title, description, alternates: { canonical: url }, robots: indexableOnlineReviewSlugs.includes(b.slug) ? undefined : { index: false, follow: true }, openGraph: { title, description, url } }
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
        <strong>Проверено {research.evidence.length} {research.evidence.length === 1 ? 'источник' : research.evidence.length < 5 ? 'источника' : 'источников'}</strong>{research.evidence.length > 0 ? ` · ${Array.from(new Set(research.evidence.map(e => e.source))).join(', ')}` : ''} · обновлено {research.updated}
        <p style={{ margin: '8px 0 0', lineHeight: 1.55 }}>Это размер нашей проверенной выборки ссылок. Одна ссылка может вести на отдельный отзыв или подборку. Мы не называем число отзывов на площадке, если не проверили каждый из них и не отделили школьное обучение от других услуг бренда.</p>
      </div>
      <h2 style={h2}>За что хвалят {b.name}</h2>
      {research.good.length ? <ul style={ul}>{research.good.map(x => <li key={x}>{x}</li>)}</ul> : <p style={{ lineHeight: 1.6 }}>В проверенной выборке пока нет положительного отзыва именно о школьном обучении.</p>}
      <h2 style={h2}>Какие сложности отмечают</h2>
      {research.bad.length ? <ul style={ul}>{research.bad.map(x => <li key={x}>{x}</li>)}</ul> : <p style={{ lineHeight: 1.6 }}>В проверенной выборке конкретных жалоб не встретилось. Это не означает, что у школы нет недостатков.</p>}
      <h2 style={h2}>Что проверить перед выбором</h2>
      <p style={{ lineHeight: 1.65, fontSize: 16 }}>{research.conclusion}</p>
      {research.media && <p style={{ lineHeight: 1.6 }}><a href={research.media.url} target="_blank" rel="nofollow noopener noreferrer" style={{ color: '#0369a1' }}>{research.media.title} ↗</a> · ссылка на площадку с видео; его содержание не включено в текстовый разбор.</p>}
      <h2 style={h2}>Отзывы и первоисточники</h2>
      {research.evidence.length === 0 && <p style={{ lineHeight: 1.6 }}>Проверенных текстовых отзывов о школьной программе пока нет. Если вы учились здесь, расскажите о своём опыте ниже.</p>}
      <div style={{ display: 'grid', gap: 10, marginBottom: 30 }}>
        {research.evidence.map((e, i) => <article key={`${e.url}-${i}`} style={{ padding: 16, border: '1px solid #e6e0d8', borderRadius: 12 }}>
          <div style={{ fontSize: 13, color: '#57534e' }}>{e.source}{e.date ? ` · ${e.date}` : ''} · {e.verdict === 'positive' ? 'положительный' : e.verdict === 'negative' ? 'отрицательный' : 'смешанный'}{e.schoolSelected ? ' · опубликован школой' : ''}</div>
          <p style={{ margin: '8px 0', lineHeight: 1.55 }}>{e.note}</p>
          <a href={e.url} target="_blank" rel="nofollow noopener noreferrer" style={{ color: '#0369a1' }}>Открыть источник ↗</a>
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
