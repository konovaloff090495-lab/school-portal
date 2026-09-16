import Link from 'next/link'
import { onlineBrandsForTable, type OnlineBrand } from '@/data/online-brands'

/**
 * Сравнительная таблица федеральных онлайн-школ. Стоит на хабе /shkoly/tipy/online/,
 * на городских страницах /shkoly/<город>/online/ (онлайн-школы работают в любом городе)
 * и на страницах брендов как блок «сравнить с другими». Данные — src/data/online-brands.ts.
 */
export default function OnlineBrandsTable({
  title = 'Сравнение онлайн-школ России — 2026/27',
  intro,
  exclude,
  compact = false,
}: {
  title?: string
  intro?: string
  exclude?: string
  compact?: boolean
}) {
  const rows = onlineBrandsForTable().filter(b => b.slug !== exclude)
  return (
    <section style={{ maxWidth: 960, margin: '0 auto 32px', fontFamily: 'var(--font-manrope, system-ui)' }}>
      <h2 style={{ fontSize: compact ? 18 : 22, fontWeight: 700, color: '#1A1814', margin: '0 0 8px', lineHeight: 1.3 }}>{title}</h2>
      {intro && <p style={{ fontSize: 14, color: '#5F5A55', lineHeight: 1.55, margin: '0 0 14px' }}>{intro}</p>}
      <div style={{ overflowX: 'auto', border: '1px solid #E8E0D6', borderRadius: 14, background: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 640 }}>
          <thead>
            <tr style={{ background: '#FBF7F2', textAlign: 'left' }}>
              <th style={th}>Школа</th>
              <th style={th}>Классы</th>
              <th style={th}>Кто выдаёт аттестат</th>
              <th style={th}>Цена с зачислением</th>
              <th style={th}>Пробный период</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(b => (
              <tr key={b.slug} style={{ borderTop: '1px solid #EFE8E0' }}>
                <td style={td}>
                  <Link href={`/shkoly/tipy/online/${b.slug}/`} style={{ fontWeight: 700, color: '#0369A1', textDecoration: 'none' }}>
                    {b.name}
                  </Link>
                  <div style={{ fontSize: 12, color: '#8A837D', marginTop: 2 }}>{b.fullName}</div>
                </td>
                <td style={td}>{b.grades}</td>
                <td style={td}>
                  {b.attestation === 'own'
                    ? <span style={{ color: '#15803D', fontWeight: 600 }}>сама школа (своя аккредитация)</span>
                    : <span>школа-партнёр</span>}
                </td>
                <td style={td}>
                  <span style={{ fontWeight: 700 }}>{priceLabel(b)}</span>
                  <div style={{ fontSize: 12, color: '#8A837D', marginTop: 2 }}>{b.priceFromNote}</div>
                </td>
                <td style={td}>{b.trial}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12, color: '#9B9490', margin: '8px 0 0', lineHeight: 1.5 }}>
        Цены и условия — с официальных сайтов школ на 16.09.2026 для учебного года 2026/27; у брендов они зависят от класса,
        срока оплаты и акций. Перед оплатой сверяйте на сайте школы.
      </p>
    </section>
  )
}

function priceLabel(b: OnlineBrand) {
  if (!b.priceFrom) return 'по запросу'
  return `от ${b.priceFrom.toLocaleString('ru-RU')} ₽/мес`
}

const th: React.CSSProperties = { padding: '10px 12px', fontSize: 12, fontWeight: 700, color: '#5F5A55', textTransform: 'uppercase', letterSpacing: '.03em', whiteSpace: 'nowrap' }
const td: React.CSSProperties = { padding: '12px', verticalAlign: 'top', color: '#1A1814', lineHeight: 1.45 }
