import media from '@/data/school-media.json'
import onlineCovers from '@/data/online-school-covers.json'
import type { School } from '@/data/schools'

type MediaSchool = Pick<School, 'slug' | 'type'> & Partial<Pick<School, 'website' | 'photoCount' | 'photoUrls'>>
const photos = media.photos as Record<string, number>
const websites = media.websites as Record<string, { src: string }>
const editorial = '/blog/images/editorial-20261021/'
const themes: Record<string, string[]> = {
  programmirovanie: ['inzhenernye-klassy-v-shkole', 'bezopasnost-v-internete-dlya-detej'],
  online: ['onlajn-shkola-plyusy-minusy', 'onlajn-shkoly-akkreditatsiya-2026'],
  semejnye: ['domashnee-obuchenie-plyusy-minusy'],
  domashnie: ['domashnee-obuchenie-plyusy-minusy'],
  sportivnye: ['shkola-i-sport-kak-sovmeshchat'],
  'pri-vuzakh': ['inzhenernye-klassy-v-shkole'],
  profilnye: ['inzhenernye-klassy-v-shkole', 'gimnaziya-ili-licej-v-chem-raznica'],
  gimnazii: ['gimnaziya-ili-licej-v-chem-raznica'],
  korrektsionnye: ['korrektsionnye-shkoly-vidy'],
  kadetskie: ['kadetskaya-shkola-chto-nuzhno-znat', 'kadetskie-shkoly-moskvy-spisok'],
  vechernie: ['vechernyaya-shkola-kak-postupit'],
  yazykovye: ['kak-pomoch-rebenku-s-anglijskim'],
  muzykalnye: ['tvorcheskie-professii-2026', 'kak-vybrat-kruzhok-rebenku'],
  hudozhestvennye: ['tvorcheskie-professii-2026', 'kak-vybrat-kruzhok-rebenku'],
  iskusstv: ['tvorcheskie-professii-2026', 'kak-vybrat-kruzhok-rebenku'],
  litsei: ['gimnaziya-ili-licej-v-chem-raznica'],
  'podgotovka-ege': ['kogda-nachinat-gotovitsya-k-ege'],
  'podgotovka-oge': ['kak-sdat-oge-na-pyat'],
}
export function schoolPhotoCount(school: MediaSchool): number {
  return school.photoUrls ? Math.min(school.photoUrls.length, 8) : Math.min(photos[school.slug] ?? 0, 3)
}
export function schoolCover(school: MediaSchool, illustrationOnly = false) {
  const assigned = (onlineCovers as Record<string, { src: string; fallbackSrc: string; kind: string }>)[school.slug]
  if (assigned) {
    const illustration = illustrationOnly || assigned.kind === 'illustration'
    return { src: illustrationOnly ? assigned.fallbackSrc : assigned.src, label: illustration ? 'Иллюстрация' : 'С сайта школы', alt: illustration ? 'Тематическая иллюстрация об обучении; не фотография этой школы' : 'Изображение с официального сайта школы' }
  }
  if (!illustrationOnly && school.website) {
    try {
      const host = new URL(school.website).hostname.replace(/^www\./, '')
      const network = ['kiber-one.com', 'coddyschool.com', 'top-academy.ru', 'algoritmika.org'].find(domain => host.endsWith('.' + domain))
      const official = websites[host] ?? (network ? websites[network] : undefined)
      if (official) return { src: official.src, label: 'С сайта школы', alt: 'Изображение с официального сайта школы' }
    } catch { /* A missing website must not prevent a cover. */ }
  }
  const choices = themes[school.type] ?? ['kak-vybrat-shkolu-dlya-rebenka', 'kak-vybrat-shkolu-po-propiske-2026']
  const hash = [...school.slug].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 0)
  return { src: editorial + choices[hash % choices.length] + '.webp', label: 'Иллюстрация', alt: 'Тематическая иллюстрация об обучении; не фотография этой школы' }
}
