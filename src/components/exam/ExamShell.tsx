import Link from 'next/link'
import YandexRTBBanner from '@/components/YandexRTBBanner'
import { AD_BLOCKS, AD_SLOT_2, AD_SLOT_3 } from '@/lib/ads'
import { siteSubjects, EXAM_NAME, type Exam } from '@/data/exam'

/**
 * Каркас страниц раздела ЕГЭ/ОГЭ: контент + рекламная рельса (как в /gdz/ и /olimpiady/).
 * Правило РСЯ: каждый blockId вызывается на странице РОВНО один раз; мобильная и
 * десктопная версии слота gdzUchebnik разведены prop `viewport` (см. src/lib/ads.ts).
 */
export function AdInline({ slot, suffix }: { slot: 'mobile' | 2 | 3; suffix: string }) {
  if (slot === 'mobile') {
    return (
      <aside className="gdz-ad gdz-ad-inline ol-ad-mobile" aria-label="Реклама">
        <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
        <div className="gdz-ad-slot"><YandexRTBBanner blockId={AD_BLOCKS.gdzUchebnik} suffix={`${suffix}-inline`} viewport="mobile" /></div>
      </aside>
    )
  }
  return (
    <aside className="gdz-ad gdz-ad-inline" aria-label="Реклама">
      <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
      <div className="gdz-ad-slot"><YandexRTBBanner blockId={slot === 2 ? AD_SLOT_2 : AD_SLOT_3} suffix={`${suffix}-${slot === 2 ? 'mid' : 'bottom'}`} /></div>
    </aside>
  )
}

export function Crumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav className="gdz-crumbs" aria-label="Хлебные крошки">
      {items.map((it, i) => (
        <span key={i}>
          {i > 0 && <span className="sep">/</span>}
          {it.href ? <Link href={it.href}>{it.name}</Link> : <span className="cur">{it.name}</span>}
        </span>
      ))}
    </nav>
  )
}

export function breadcrumbLd(items: { name: string; href: string }[]) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: `https://pro-schools.ru${it.href}` })),
  }
}

export default function ExamShell({ exam, suffix, ld, active, railTitle, railExtra, children }: {
  exam: Exam
  suffix: string
  ld?: unknown[]
  active?: string
  railTitle?: string
  railExtra?: React.ReactNode
  children: React.ReactNode
}) {
  const other: Exam = exam === 'ege' ? 'oge' : 'ege'
  return (
    <div className="gdz-shell">
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />}
      <main className="gdz-main">{children}</main>
      <aside className="gdz-rail" aria-label="Реклама">
        <div className="gdz-rail-sticky">
          <div className="gdz-ad">
            <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
            <div className="gdz-ad-slot gdz-ad-slot--tall"><YandexRTBBanner blockId={AD_BLOCKS.gdzUchebnik} suffix={`${suffix}-sidebar`} viewport="desktop" /></div>
          </div>
          {railExtra}
          <div className="ol-rail-box">
            <h3>{railTitle ?? `${EXAM_NAME[exam]} по предметам`}</h3>
            <div className="ol-rail-list">
              {siteSubjects(exam).slice(0, 12).map(s => (
                <Link key={s.slug} href={`/${exam}/${s.slug}/`} className={s.slug === active ? 'active' : ''}>{s.icon} {s.name}</Link>
              ))}
              <Link href={`/${other}/`} style={{ marginTop: 6, color: 'var(--coral-600)' }}>→ Материалы {EXAM_NAME[other]}</Link>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
