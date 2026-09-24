'use client'

import { getSuProduct, suUrl } from '@/lib/su-products'

const YM_ID = 108789843

/**
 * Инлайновый партнёрский баннер в теле статьи блога — ведёт на посадочную
 * продукта school-university.com с меткой gerasimov_lav (см. src/lib/su-products.ts).
 *
 * Стоит ОТДЕЛЬНО от блоков РСЯ: рекламная сеть и партнёрский оффер — разные деньги,
 * и по правилу «один blockId = один render на страницу» смешивать их нельзя.
 * Маркировка «Реклама» обязательна: это реклама стороннего образовательного продукта.
 */
export default function SuPartnerBanner({
  productKey,
  postSlug,
  pathOverride,
  compact = false,
}: {
  productKey: string
  postSlug?: string
  pathOverride?: string
  compact?: boolean
}) {
  const p = getSuProduct(productKey)
  if (!p) return null
  const href = suUrl(productKey, compact ? 'banner' : 'cta', postSlug, pathOverride)

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener sponsored"
      onClick={() => window.ym?.(YM_ID, 'reachGoal', 'su_partner_click', { su_product: productKey })}
      style={{
        display: 'block', textDecoration: 'none',
        margin: compact ? '28px 0' : '32px 0 0',
        borderRadius: 18, padding: compact ? '18px 20px' : '26px 24px',
        background: `linear-gradient(135deg, ${p.accent[0]} 0%, ${p.accent[1]} 100%)`,
        color: 'white', fontFamily: 'var(--font-manrope, system-ui)',
        boxShadow: '0 6px 18px rgba(12,36,54,0.16)',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
        fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.55)',
      }}>
        <span>Реклама</span>
        <span>·</span>
        <span>ШУ «Синергия»</span>
      </div>

      <div style={{
        fontFamily: 'var(--font-unbounded, sans-serif)', fontWeight: 700,
        fontSize: compact ? 18 : 21, lineHeight: 1.25, marginBottom: 8,
      }}>
        {p.title}
      </div>

      <p style={{ fontSize: 15, lineHeight: 1.55, color: 'rgba(255,255,255,0.88)', margin: '0 0 16px' }}>
        {p.text}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <span style={{
          background: 'white', color: p.accent[0], fontWeight: 700, fontSize: 15,
          borderRadius: 999, padding: '11px 22px', whiteSpace: 'nowrap',
        }}>
          {p.cta} →
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.95)' }}>
          {p.offer}
        </span>
      </div>
    </a>
  )
}
