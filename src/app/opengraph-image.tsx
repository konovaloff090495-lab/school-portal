import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'ШколыРоссии.рф — каталог школ России'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#0F172A',
          padding: '80px',
          position: 'relative',
        }}
      >
        {/* Top accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: '#0369A1' }} />

        {/* Logo area */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, background: '#0369A1', borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginRight: 20,
          }}>
            <div style={{ width: 28, height: 28, background: 'white', borderRadius: 4 }} />
          </div>
          <span style={{ color: '#94A3B8', fontSize: 28, fontWeight: 400 }}>ШколыРоссии.рф</span>
        </div>

        {/* Main title */}
        <div style={{ color: 'white', fontSize: 72, fontWeight: 700, lineHeight: 1.1, marginBottom: 24 }}>
          Каталог школ России
        </div>

        {/* Subtitle */}
        <div style={{ color: '#94A3B8', fontSize: 32, marginBottom: 16 }}>
          Государственные · Частные · Онлайн · Вечерние · Экстернат
        </div>
        <div style={{ color: '#64748B', fontSize: 26 }}>
          Москва · Московская область · Новосибирск
        </div>

        {/* Bottom domain */}
        <div style={{
          position: 'absolute', bottom: 60, left: 80,
          color: '#0369A1', fontSize: 28, fontWeight: 700,
        }}>
          pro-schools.ru
        </div>

        {/* Bottom right stats */}
        <div style={{
          position: 'absolute', bottom: 60, right: 80,
          color: '#475569', fontSize: 24,
        }}>
          104 школы в каталоге
        </div>
      </div>
    ),
    { ...size }
  )
}
