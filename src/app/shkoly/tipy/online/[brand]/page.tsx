import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { onlineBrandSlugs, getOnlineBrand, onlineBrands } from '@/data/online-brands'
import { regionSlugs, regionLabelsIn } from '@/data/schools'
import { BreadcrumbJsonLd, FaqJsonLd } from '@/lib/schema'
import Breadcrumbs from '@/components/Breadcrumbs'
import OnlineBrandsTable from '@/components/OnlineBrandsTable'
import OnlineLeadCta from '@/components/OnlineLeadCta'
import ReviewsBlock from '@/components/ReviewsBlock'

/**
 * Страница бренда онлайн-школы: /shkoly/tipy/online/<brand>/.
 *
 * Зачем: брендовые запросы «фоксфорд отзывы» (9,5 тыс./мес), «онлайн школа синергия»
 * (9,8 тыс.), «онлайн гимназия 1» (9,8 тыс.), «интернетурок», «skysmart школа» —
 * это люди, которые уже выбирают онлайн-школу. У нас под них были только тонкие
 * карточки /shkola/. Здесь — обзор с реальными тарифами, схемой аттестации,
 * плюсами/минусами, FAQ-разметкой, отзывами пользователей и лид-формой подбора.
 */

interface Props { params: Promise<{ brand: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return onlineBrandSlugs.map(brand => ({ brand }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand } = await params
  const b = getOnlineBrand(brand)
  if (!b) return {}
  const price = b.priceFrom ? `от ${b.priceFrom.toLocaleString('ru-RU')} ₽/мес` : 'цены по запросу'
  const title = `${b.fullName}: цены 2026/27, аттестат, отзывы — ${price}`
  const description =
    `${b.name} — онлайн-школа ${b.grades} классов. Тарифы ${b.tariffs.map(t => `«${t.name}»`).join(', ')}, ` +
    `${b.attestation === 'own' ? 'собственная аккредитация и аттестат от самой школы' : 'аттестат через школу-партнёра'}, ` +
    `${b.trial}. Плюсы, минусы, сравнение с другими онлайн-школами и отзывы родителей.`
  const url = `https://pro-schools.ru/shkoly/tipy/online/${b.slug}/`
  return {
    title,
    description,
    keywords: `${b.name.toLowerCase()} онлайн школа, ${b.name.toLowerCase()} отзывы, ${b.name.toLowerCase()} цены, ${b.name.toLowerCase()} домашняя школа, ${b.name.toLowerCase()} аккредитация, ${b.name.toLowerCase()} стоимость обучения`,
    alternates: { canonical: url },
    openGraph: { title, description, url },
  }
}

export default async function OnlineBrandPage({ params }: Props) {
  const { brand } = await params
  const b = getOnlineBrand(brand)
  if (!b) notFound()

  const others = onlineBrands.filter(x => x.slug !== b.slug)
  const cheaper = others.filter(x => x.priceFrom && b.priceFrom && x.priceFrom < b.priceFrom)
  const ownAccredited = others.filter(x => x.attestation === 'own')
  // 12 крупнейших городов — ссылки на городские страницы онлайн-школ (внутренний вес + гео-интент)
  const cities = regionSlugs.filter(r => r !== 'moskovskaya-oblast').slice(0, 13)

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Все школы', href: 'https://pro-schools.ru/shkoly/' },
          { name: 'Онлайн-школы', href: 'https://pro-schools.ru/shkoly/tipy/online/' },
          { name: b.name },
        ]}
      />
      <FaqJsonLd faqs={b.faqs} />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px 16px 48px', fontFamily: 'var(--font-manrope, system-ui)', color: '#1A1814' }}>
        <Breadcrumbs crumbs={[
          { label: 'Все школы', href: '/shkoly/' },
          { label: 'Онлайн-школы', href: '/shkoly/tipy/online/' },
          { label: b.name },
        ]} />

        <h1 style={{ fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 800, lineHeight: 1.2, margin: '18px 0 12px' }}>
          {b.fullName}: цены, аттестат, отзывы — обзор {b.verified.slice(-4)}
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.6, color: '#3F3A35', margin: '0 0 20px' }}>
          {b.name} — {b.attestation === 'own' ? 'онлайн-школа с собственной государственной аккредитацией' : 'лицензированная онлайн-школа, которая оформляет аттестат через школу-партнёра'},
          {' '}{b.grades} классы. {b.priceFrom
            ? `Полноценный формат с зачислением стоит от ${b.priceFrom.toLocaleString('ru-RU')} ₽ в месяц (${b.priceFromNote}).`
            : `Цены считаются по классу и озвучиваются на консультации (${b.priceFromNote}).`}
          {' '}Ниже — тарифы 2026/27 как на сайте школы, схема аттестации, честные плюсы и минусы и сравнение с другими онлайн-школами.
          Данные проверены {b.verified}.
        </p>

        {/* Ключевые факты */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, margin: '0 0 28px' }}>
          <Fact k="Классы" v={b.grades} />
          <Fact k="Аттестат выдаёт" v={b.attestation === 'own' ? 'сама школа' : 'школа-партнёр'} accent={b.attestation === 'own'} />
          <Fact k="Цена с зачислением" v={b.priceFrom ? `от ${b.priceFrom.toLocaleString('ru-RU')} ₽/мес` : 'по запросу'} />
          <Fact k="Пробный период" v={b.trial} />
          {b.since && <Fact k="Работает с" v={`${b.since} года`} />}
          {b.students && <Fact k="Ученики" v={b.students} />}
        </div>

        {/* Тарифы */}
        <h2 style={h2}>Тарифы {b.name} на 2026/27 учебный год</h2>
        <div style={{ overflowX: 'auto', border: '1px solid #E8E0D6', borderRadius: 14, background: '#fff', marginBottom: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 560 }}>
            <thead>
              <tr style={{ background: '#FBF7F2', textAlign: 'left' }}>
                <th style={th}>Тариф</th><th style={th}>Что входит</th><th style={th}>Цена</th>
              </tr>
            </thead>
            <tbody>
              {b.tariffs.map(t => (
                <tr key={t.name} style={{ borderTop: '1px solid #EFE8E0' }}>
                  <td style={{ ...td, fontWeight: 700, whiteSpace: 'nowrap' }}>{t.name}</td>
                  <td style={td}>{t.what}</td>
                  <td style={td}>
                    <div style={{ fontWeight: 700 }}>{t.price}</div>
                    {t.priceNote && <div style={{ fontSize: 12, color: '#8A837D', marginTop: 2 }}>{t.priceNote}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: '#8A837D', margin: '0 0 28px', lineHeight: 1.5 }}>
          Цены сняты с официального сайта {b.name} {b.verified}. Школа может менять тарифы и акции в течение года —
          итоговую сумму подтверждайте перед оплатой. {cheaper.length > 0 && (
            <>Дешевле среди сравниваемых школ: {cheaper.map((x, i) => (
              <span key={x.slug}>{i > 0 && ', '}<Link href={`/shkoly/tipy/online/${x.slug}/`} style={{ color: '#0369A1' }}>{x.name}</Link> (от {x.priceFrom.toLocaleString('ru-RU')} ₽)</span>
            ))}.</>
          )}
        </p>

        {/* Аттестация */}
        <h2 style={h2}>Аккредитация и аттестат: как это устроено у {b.name}</h2>
        <p style={p}>{b.attestationText}</p>
        <p style={p}>
          <strong>Документы:</strong> {b.license}.{' '}
          {b.attestation === 'partner' && ownAccredited.length > 0 && (
            <>Если важно, чтобы аттестат выдавала сама школа, смотрите {ownAccredited.map((x, i) => (
              <span key={x.slug}>{i > 0 && ', '}<Link href={`/shkoly/tipy/online/${x.slug}/`} style={{ color: '#0369A1' }}>{x.name}</Link></span>
            ))} — у них собственная государственная аккредитация.</>
          )}
          {' '}Проверить лицензию и аккредитацию любой школы можно в реестре Рособрнадзора по ИНН или названию организации.
        </p>

        {/* Формат */}
        <h2 style={h2}>Как проходит обучение</h2>
        <ul style={ul}>{b.format.map(f => <li key={f}>{f}</li>)}</ul>

        {/* Плюсы / минусы */}
        <h2 style={h2}>Плюсы и минусы {b.name}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 24 }}>
          <div style={{ background: '#F0FAF3', border: '1px solid #C9EBD4', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: '#15803D' }}>Плюсы</div>
            <ul style={{ ...ul, marginBottom: 0 }}>{b.pros.map(x => <li key={x}>{x}</li>)}</ul>
          </div>
          <div style={{ background: '#FFF4F1', border: '1px solid #FFD0C4', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: '#B91C1C' }}>Минусы</div>
            <ul style={{ ...ul, marginBottom: 0 }}>{b.cons.map(x => <li key={x}>{x}</li>)}</ul>
          </div>
        </div>
        <p style={p}><strong>Кому подходит:</strong> {b.fitFor}.</p>

        <OnlineLeadCta
          source={`Онлайн-школы: бренд ${b.name}`}
          heading={`Сомневаетесь, подойдёт ли ${b.name}? Подберём школу под ребёнка`}
          text={`Расскажите про класс, город и бюджет — перезвоним за 30 минут, сравним ${b.name} с другими онлайн-школами по цене, формату уроков и тому, кто выдаёт аттестат, и подскажем, где есть пробный период.`}
          schoolName={b.name}
        />

        <OnlineBrandsTable
          title={`${b.name} или другие онлайн-школы: сравнение`}
          intro="Все школы из таблицы работают по всей России — город ученика не важен. Сначала идут школы с собственной аккредитацией, дальше — по цене формата с зачислением."
          exclude={b.slug}
          compact
        />

        {/* FAQ */}
        <h2 style={h2}>Вопросы и ответы о {b.name}</h2>
        <div style={{ marginBottom: 28 }}>
          {b.faqs.map(f => (
            <details key={f.question} style={{ border: '1px solid #E8E0D6', borderRadius: 12, padding: '12px 16px', marginBottom: 8, background: '#fff' }}>
              <summary style={{ fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>{f.question}</summary>
              <p style={{ ...p, margin: '10px 0 0' }}>{f.answer}</p>
            </details>
          ))}
        </div>

        {/* Отзывы — только реальные от пользователей сайта */}
        <h2 style={h2}>Отзывы родителей о {b.name}</h2>
        <p style={p}>
          Мы не копируем отзывы с сайта школы и с агрегаторов — здесь только те, что оставили пользователи pro-schools.ru.
          Учились в {b.name}? Расскажите, как прошла аттестация, сколько реально заплатили и что бы посоветовали другим родителям.
        </p>
        <ReviewsBlock schoolSlug={`online-brand-${b.slug}`} schoolName={b.fullName} />

        {/* Ссылки */}
        <h2 style={{ ...h2, marginTop: 32 }}>Смотрите также</h2>
        <ul style={ul}>
          <li><Link href="/shkoly/tipy/online/" style={a}>Все онлайн-школы России: рейтинг, цены, аккредитация</Link></li>
          <li><Link href="/shkoly/tipy/domashnie/" style={a}>Домашние школы и домашнее обучение — как оформить</Link></li>
          <li><Link href="/shkoly/tipy/eksternal/" style={a}>Школы-экстернаты: 10–11 класс за год</Link></li>
          {b.cardSlug && <li><Link href={`/shkola/${b.cardSlug}/`} style={a}>Карточка {b.name} в каталоге</Link></li>}
          <li><a href={b.site} rel="nofollow noopener" target="_blank" style={a}>Официальный сайт {b.name}</a></li>
        </ul>
        <p style={{ ...p, fontSize: 14 }}>
          Онлайн-школы для жителей:{' '}
          {cities.map((r, i) => (
            <span key={r}>{i > 0 && ' · '}<Link href={`/shkoly/${r}/online/`} style={a}>{regionLabelsIn[r].replace(/^в /, '')}</Link></span>
          ))}
        </p>
      </div>
    </>
  )
}

function Fact({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div style={{ background: accent ? '#F0FAF3' : '#FBF7F2', border: `1px solid ${accent ? '#C9EBD4' : '#E8E0D6'}`, borderRadius: 12, padding: '10px 14px' }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', color: '#8A837D', fontWeight: 700 }}>{k}</div>
      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4, lineHeight: 1.3 }}>{v}</div>
    </div>
  )
}

const h2: React.CSSProperties = { fontSize: 22, fontWeight: 800, lineHeight: 1.25, margin: '8px 0 12px' }
const p: React.CSSProperties = { fontSize: 15.5, lineHeight: 1.65, color: '#3F3A35', margin: '0 0 14px' }
const ul: React.CSSProperties = { fontSize: 15.5, lineHeight: 1.65, color: '#3F3A35', margin: '0 0 24px', paddingLeft: 20 }
const a: React.CSSProperties = { color: '#0369A1', textDecoration: 'none' }
const th: React.CSSProperties = { padding: '10px 12px', fontSize: 12, fontWeight: 700, color: '#5F5A55', textTransform: 'uppercase', letterSpacing: '.03em' }
const td: React.CSSProperties = { padding: '12px', verticalAlign: 'top', lineHeight: 1.45 }
