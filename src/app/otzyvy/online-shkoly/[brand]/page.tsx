import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Breadcrumbs from '@/components/Breadcrumbs'
import ReviewsBlock from '@/components/ReviewsBlock'
import { onlineBrandSlugs, getOnlineBrand } from '@/data/online-brands'
import { onlineReviewResearch, indexableOnlineReviewSlugs } from '@/data/online-review-research'
import { onlineReviewArticles } from '@/data/online-review-articles'

type Props = { params: Promise<{ brand: string }> }
export const dynamicParams = false
export function generateStaticParams() { return onlineBrandSlugs.map(brand => ({ brand })) }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const b = getOnlineBrand((await params).brand)
  if (!b) return {}
  const article = onlineReviewArticles[b.slug]
  const title = `Отзывы об онлайн-школе ${b.name}: плюсы, минусы, мнения родителей`
  const description = article
    ? `Отзывы об онлайн-школе ${b.name}: опыт семей, сильные стороны, сложности обучения и что важно проверить перед выбором.`
    : `Отзывы об онлайн-школе ${b.name}. Мнения родителей и учеников, плюсы и минусы обучения.`
  const url = `https://pro-schools.ru/otzyvy/online-shkoly/${b.slug}/`
  return { title, description, alternates: { canonical: url }, robots: indexableOnlineReviewSlugs.includes(b.slug) ? undefined : { index: false, follow: true }, openGraph: { title, description, url } }
}

export default async function OnlineBrandReviews({ params }: Props) {
  const b = getOnlineBrand((await params).brand)
  if (!b) notFound()
  const research = onlineReviewResearch[b.slug]
  const article = onlineReviewArticles[b.slug]
  return <main style={{ maxWidth: 870, margin: '0 auto', padding: '24px 16px 64px', color: '#1a1814' }}>
    <Breadcrumbs crumbs={[{ label: 'Онлайн-школы', href: '/shkoly/tipy/online/' }, { label: 'Отзывы об онлайн-школах', href: '/otzyvy/online-shkoly/' }, { label: b.name }]} />
    <h1 style={{ fontSize: 'clamp(27px, 5vw, 38px)', lineHeight: 1.2, margin: '24px 0 12px' }}>Отзывы про онлайн-школу {b.name}</h1>
    <p style={{ fontSize: 17, lineHeight: 1.65 }}>{article?.overview}</p>
    {research && article && <>
      <h2 style={h2}>Что нравится семьям в {b.name}</h2>
      <p style={paragraph}>{article.positive}</p>
      {research.good.length > 0 && <ul style={ul}>{research.good.map(x => <li key={x}>{x}</li>)}</ul>}
      <h2 style={h2}>Какие сложности встречаются</h2>
      <p style={paragraph}>{article.negative}</p>
      {research.bad.length > 0 && <ul style={ul}>{research.bad.map(x => <li key={x}>{x}</li>)}</ul>}
      <h2 style={h2}>Что учесть перед выбором</h2>
      <p style={paragraph}>{research.conclusion}</p>
    </>}
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
const paragraph: React.CSSProperties = { lineHeight: 1.7, fontSize: 16, margin: '10px 0 16px' }
