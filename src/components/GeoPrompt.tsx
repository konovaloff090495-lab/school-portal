'use client'

import { useState, useEffect } from 'react'
import { regionSlugs, regionLabels, RegionSlug } from '@/data/schools'

const STORAGE_KEY    = 'selected_region'
const DISMISSED_KEY  = 'geo_prompt_dismissed'

// Маппинг ответа ip-api → наш RegionSlug
const CITY_TO_SLUG: Record<string, RegionSlug> = {
  'Москва':           'moskva',
  'Moscow':           'moskva',
  'Санкт-Петербург':  'sankt-peterburg',
  'Saint Petersburg': 'sankt-peterburg',
  'St Petersburg':    'sankt-peterburg',
  'Екатеринбург':     'ekaterinburg',
  'Yekaterinburg':    'ekaterinburg',
  'Ekaterinburg':     'ekaterinburg',
  'Казань':           'kazan',
  'Kazan':            'kazan',
  'Нижний Новгород':  'nizhniy-novgorod',
  'Nizhny Novgorod':  'nizhniy-novgorod',
  'Новосибирск':      'novosibirsk',
  'Novosibirsk':      'novosibirsk',
  'Челябинск':        'chelyabinsk',
  'Chelyabinsk':      'chelyabinsk',
  'Омск':             'omsk',
  'Omsk':             'omsk',
  'Самара':           'samara',
  'Samara':           'samara',
  'Ростов-на-Дону':   'rostov-na-donu',
  'Rostov-on-Don':    'rostov-na-donu',
  'Rostov na Donu':   'rostov-na-donu',
  'Уфа':              'ufa',
  'Ufa':              'ufa',
  'Краснодар':        'krasnodar',
  'Krasnodar':        'krasnodar',
  'Пермь':            'perm',
  'Perm':             'perm',
  'Воронеж':          'voronezh',
  'Voronezh':         'voronezh',
  'Волгоград':        'volgograd',
  'Volgograd':        'volgograd',
}

function saveCity(slug: RegionSlug) {
  localStorage.setItem(STORAGE_KEY, slug)
  localStorage.setItem(DISMISSED_KEY, '1')
  // Уведомляем Header об изменении
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEY,
    newValue: slug,
    storageArea: localStorage,
  }))
}

export default function GeoPrompt() {
  const [detectedCity, setDetectedCity]   = useState<string | null>(null)
  const [detectedSlug, setDetectedSlug]   = useState<RegionSlug | null>(null)
  const [visible, setVisible]             = useState(false)
  const [showSelector, setShowSelector]   = useState(false)
  const [search, setSearch]               = useState('')
  const [closing, setClosing]             = useState(false)

  useEffect(() => {
    // Не показывать если уже выбрал
    if (localStorage.getItem(DISMISSED_KEY)) return

    async function detect() {
      try {
        const res  = await fetch('https://ip-api.com/json/?lang=ru&fields=city', { signal: AbortSignal.timeout(4000) })
        const data = await res.json()
        const city = data.city as string
        const slug = CITY_TO_SLUG[city]

        if (slug) {
          setDetectedCity(regionLabels[slug]) // Используем наше название
          setDetectedSlug(slug)
          setVisible(true)
        }
        // Если город не в нашем каталоге — тихо не показываем баннер
      } catch {
        // Ошибка геолокации — ничего не показываем
      }
    }

    // Небольшая задержка чтобы не мешать первому рендеру
    const t = setTimeout(detect, 800)
    return () => clearTimeout(t)
  }, [])

  function dismiss() {
    setClosing(true)
    setTimeout(() => setVisible(false), 300)
    localStorage.setItem(DISMISSED_KEY, '1')
  }

  function confirmCity() {
    if (!detectedSlug) return
    saveCity(detectedSlug)
    setClosing(true)
    setTimeout(() => setVisible(false), 300)
  }

  function selectCity(slug: RegionSlug) {
    saveCity(slug)
    setClosing(true)
    setTimeout(() => setVisible(false), 300)
  }

  const filtered = regionSlugs.filter(s =>
    regionLabels[s].toLowerCase().includes(search.toLowerCase())
  )

  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes geoSlideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        @keyframes geoSlideUp {
          from { transform: translateY(0);     opacity: 1; }
          to   { transform: translateY(-100%); opacity: 0; }
        }
        .geo-bar {
          animation: geoSlideDown 0.28s cubic-bezier(.22,.68,0,1.2) forwards;
        }
        .geo-bar.closing {
          animation: geoSlideUp 0.22s ease-in forwards;
        }
        .geo-btn-yes:hover  { background: #e8552a !important; }
        .geo-btn-no:hover   { background: rgba(255,255,255,0.25) !important; }
        .geo-city-item:hover { background: rgba(255,107,61,0.08) !important; color: var(--coral-500) !important; }
      `}</style>

      {/* Баннер */}
      <div
        className={`geo-bar${closing ? ' closing' : ''}`}
        style={{
          background: 'linear-gradient(90deg, #FF6B3D 0%, #FF8B5A 100%)',
          color: 'white',
          fontFamily: 'var(--font-manrope, system-ui)',
          position: 'relative',
          zIndex: 49,
          boxShadow: '0 2px 12px rgba(255,107,61,0.3)',
        }}
      >
        {!showSelector ? (
          /* ── Вопрос о городе ── */
          <div style={{
            maxWidth: 1280, margin: '0 auto',
            padding: '10px 24px',
            display: 'flex', alignItems: 'center',
            gap: 12, flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, flex: 1, minWidth: 200 }}>
              📍 Ваш город —{' '}
              <strong style={{ fontWeight: 800 }}>{detectedCity}</strong>?
            </span>

            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                className="geo-btn-yes"
                onClick={confirmCity}
                style={{
                  background: '#1A1814', color: 'white',
                  border: 'none', borderRadius: 8,
                  padding: '7px 20px', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', transition: 'background .12s',
                  boxShadow: '0 2px 0 #000',
                }}
              >
                Да, верно
              </button>

              <button
                className="geo-btn-no"
                onClick={() => setShowSelector(true)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.4)',
                  borderRadius: 8,
                  padding: '7px 20px', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', transition: 'background .12s',
                }}
              >
                Нет, другой
              </button>

              <button
                onClick={dismiss}
                aria-label="Закрыть"
                style={{
                  background: 'transparent', border: 'none',
                  color: 'rgba(255,255,255,0.7)', fontSize: 20,
                  cursor: 'pointer', padding: '0 4px', lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          </div>
        ) : (
          /* ── Выбор города ── */
          <div style={{
            maxWidth: 1280, margin: '0 auto',
            padding: '12px 24px',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              gap: 12, marginBottom: 10, flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>
                Выберите ваш город:
              </span>
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск города..."
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  borderRadius: 8, padding: '5px 12px',
                  color: 'white', fontSize: 13,
                  outline: 'none', width: 160,
                  fontFamily: 'var(--font-manrope)',
                }}
              />
              <button
                onClick={dismiss}
                aria-label="Закрыть"
                style={{
                  marginLeft: 'auto',
                  background: 'transparent', border: 'none',
                  color: 'rgba(255,255,255,0.7)', fontSize: 20,
                  cursor: 'pointer', padding: '0 4px', lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 6,
            }}>
              {filtered.map(slug => (
                <button
                  key={slug}
                  className="geo-city-item"
                  onClick={() => selectCity(slug)}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: 8, padding: '6px 14px',
                    color: 'white', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', transition: 'background .1s, color .1s',
                    fontFamily: 'var(--font-manrope)',
                  }}
                >
                  {regionLabels[slug]}
                </button>
              ))}
              {filtered.length === 0 && (
                <span style={{ fontSize: 13, opacity: 0.8 }}>
                  Город не найден — выберите ближайший
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
