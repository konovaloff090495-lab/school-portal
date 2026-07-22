#!/usr/bin/env node
/**
 * expand-catalog.mjs — прицельное добирание школ из OpenStreetMap.
 *
 * В отличие от parse-overpass.mjs (заливает город целиком) этот скрипт работает
 * от ДЕФИЦИТА: берёт пары «город × тип», где на сайте меньше 3 школ, и добирает
 * из OSM только те школы, которые закрывают дефицит. Три школы — порог, ниже
 * которого страница каталога помечается noindex (см. sitemap.ts / [type]/page.tsx).
 *
 * Запуск:
 *   node scripts/expand-catalog.mjs --dry              # показать, что будет добавлено
 *   node scripts/expand-catalog.mjs --limit=10         # первые 10 городов
 *   node scripts/expand-catalog.mjs                    # всё
 *   node scripts/expand-catalog.mjs --min=3            # свой порог
 */

import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createJiti } from '../node_modules/jiti/lib/jiti.mjs'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const ROOT       = path.join(__dirname, '..')
const SCHOOLS_TS = path.join(ROOT, 'src', 'data', 'schools.ts')

const args = Object.fromEntries(
  process.argv.slice(2).filter(a => a.startsWith('--'))
    .map(a => { const [k, ...v] = a.slice(2).split('='); return [k, v.join('=') || true] })
)
const DRY   = Boolean(args.dry)
const LIMIT = parseInt(args.limit ?? '0')
const MIN   = parseInt(args.min ?? '3')

const OVERPASS_MIRRORS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
]
const sleep = ms => new Promise(r => setTimeout(r, ms))

// ─── Загружаем текущую базу ───────────────────────────────────────────────────
const jiti = createJiti(import.meta.url, { interopDefault: true })
const { schools, regionSlugs, regionLabels, regionLabelsIn, typeSlugs, typeLabels } = await jiti.import(SCHOOLS_TS)

// Типы, которые реально встречаются в OSM. Экстернаты, семейные, онлайн, центры
// подготовки к ЕГЭ и т.п. — коммерческие организации, в OSM их практически нет,
// они добираются из других источников.
const OSM_TYPES = new Set([
  'gosudarstvennye', 'gimnazii', 'profilnye', 'korrektsionnye', 'kadetskie',
  'vechernie', 'internaty', 'pri-vuzakh', 'pravoslavnye', 'sportivnye',
  'mezhdunarodnie', 'chastnie', 'yazykovye',
])

// ─── Overpass ─────────────────────────────────────────────────────────────────
async function fetchCity(cityName) {
  const query = `
[out:json][timeout:120];
area["name"="${cityName}"]["place"~"city|town"]->.a;
(
  nwr["amenity"="school"](area.a);
  nwr["amenity"="college"]["school:type"](area.a);
);
out tags center;
`.trim()

  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const res = await fetch(mirror, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(150_000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return (await res.json()).elements ?? []
    } catch (e) {
      console.log(`    ✗ ${mirror.split('/')[2]}: ${e.message.slice(0, 50)}`)
      await sleep(2000)
    }
  }
  throw new Error('все зеркала Overpass недоступны')
}

// ─── Определение типа по названию ─────────────────────────────────────────────
function detectType(name, tags = {}) {
  const n = name.toLowerCase()
  const op = (tags['operator:type'] || '').toLowerCase()

  if (/вечерн|сменная|открытая \(сменная\)|центр образования взрослых/.test(n)) return 'vechernie'
  if (/экстерн/.test(n)) return 'eksternal'
  if (/кадет|суворовск|нахимовск|казач.*корпус/.test(n)) return 'kadetskie'
  if (/коррекц|адаптивн|для (детей|обучающихся) с (овз|огранич)|специальн.*\(коррекц/.test(n)) return 'korrektsionnye'
  if (/интернат/.test(n)) return 'internaty'
  if (/вальдорф/.test(n)) return 'valdorfskie'
  if (/монтессори/.test(n)) return 'montessori'
  if (/православн|церковно|епархиальн|христианск/.test(n)) return 'pravoslavnye'
  if (/международн|british|international/.test(n)) return 'mezhdunarodnie'
  if (/спортивн|олимпийского резерва|сдюсшор|сшор/.test(n)) return 'sportivnye'
  if (/шахматн/.test(n)) return 'shahmatnye'
  if (/семейн/.test(n)) return 'semejnye'
  if (/при (мгу|вузе|университет|институт)|университетск.*(лицей|гимназ)|лицей.*(университет|мгу|мгту|вшэ|политех)/.test(n)) return 'pri-vuzakh'
  if (/гимназ/.test(n)) return 'gimnazii'
  if (/лицей/.test(n)) return 'profilnye'
  if (/лингвистическ|с углублённым изучением иностранн|с углубленным изучением иностранн|языков/.test(n)) return 'yazykovye'
  if (/дистанцион|онлайн/.test(n)) return 'online'
  if (op === 'private' || /частн|негосударственн|ано /.test(n)) return 'chastnie'
  if (/с углублённым изучением|с углубленным изучением|профильн/.test(n)) return 'profilnye'
  return 'gosudarstvennye'
}

// ─── Фильтры ──────────────────────────────────────────────────────────────────
const BAD = [
  'автошкол', 'детский сад', 'ясли', 'детский центр', 'дошкольн',
  'музыкальн', 'танц', 'художествен', 'искусств',
  'кафе', 'ресторан', 'магазин', 'аптека', 'банк', 'парикмахер',
  'дом культуры', 'библиотека', 'почта', 'центр занятости',
  'колледж', 'техникум', 'училище олимп', 'вуз', 'университет культуры',
  'бывш', 'заброшен', 'строится', 'снесен', 'снесён',
]
const isBad = name => { const n = name.toLowerCase(); return BAD.some(b => n.includes(b)) }

// В OSM названия приходят как попало: «школа 18», «Вечерняя средняя школа No1».
// Без нормализации это попадает в H1 и title карточки.
function normalizeName(raw) {
  let n = raw.replace(/\s+/g, ' ').trim()
  n = n.replace(/\b(No|N|#)\s*(\d)/gi, '№$2')          // No1 → №1
  n = n.replace(/№\s+(\d)/g, '№$1')                     // № 12 → №12
  n = n.replace(/(школа|гимназия|лицей|интернат)\s+(\d)/gi, '$1 №$2')  // школа 18 → школа №18
  n = n.charAt(0).toUpperCase() + n.slice(1)
  return n
}

// Распознаём и «МБОУ СОШ № 12», и «Средняя школа №5», и «Лицей №3»
const isSchool = name => {
  const n = name.toLowerCase()
  if (/\b(сош|оош|нош|мбоу|маоу|гбоу|мкоу|маоу|моу|гоу|скоши|шкоди)\b/.test(n)) return true
  return /школ|гимназ|лицей|кадет|экстерн|интернат/.test(n)
}

// ─── Транслитерация ───────────────────────────────────────────────────────────
const transliterate = s => s.toLowerCase().replace(/[а-яё]/g, c => ({
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',
  к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',
  ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',
  э:'e',ю:'yu',я:'ya',
}[c] ?? c))

const makeSlug = (name, citySlug) =>
  (transliterate(name) + '-' + citySlug)
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)

// ─── Метаданные типов ─────────────────────────────────────────────────────────
const TYPE_META = {
  vechernie:       { label: 'вечерняя школа',        grades: '9–11', priceFrom: 0,     features: ['Аттестат государственного образца', 'Вечернее обучение', 'Для взрослых', 'Без возрастных ограничений', 'Гибкий график'] },
  gosudarstvennye: { label: 'государственная школа', grades: '1–11', priceFrom: 0,     features: ['Бесплатное обучение', 'Программа ФГОС', 'Аттестат государственного образца', 'Продлёнка', 'Горячее питание'] },
  gimnazii:        { label: 'гимназия',              grades: '1–11', priceFrom: 0,     features: ['Гуманитарный уклон', 'Углублённое изучение языков', 'Олимпиадная подготовка', 'Аттестат государственного образца', 'Программа ФГОС'] },
  profilnye:       { label: 'профильная школа',      grades: '1–11', priceFrom: 0,     features: ['Профильные классы', 'Углублённые предметы', 'Подготовка к ЕГЭ', 'Олимпиадная подготовка', 'Аттестат государственного образца'] },
  korrektsionnye:  { label: 'коррекционная школа',   grades: '1–9',  priceFrom: 0,     features: ['Обучение детей с ОВЗ', 'Адаптированные программы', 'Логопед и дефектолог', 'Малые классы', 'Психологическое сопровождение'] },
  kadetskie:       { label: 'кадетский корпус',      grades: '5–11', priceFrom: 0,     features: ['Военно-патриотическое воспитание', 'Строевая и физическая подготовка', 'Кадетская форма', 'Дисциплина и распорядок', 'Аттестат государственного образца'] },
  internaty:       { label: 'школа-интернат',        grades: '1–11', priceFrom: 0,     features: ['Круглосуточное проживание', 'Пятиразовое питание', 'Воспитатели', 'Медицинское сопровождение', 'Аттестат государственного образца'] },
  'pri-vuzakh':    { label: 'лицей при вузе',        grades: '8–11', priceFrom: 0,     features: ['Преподаватели вуза', 'Углублённые программы', 'Подготовка к поступлению', 'Профильные классы', 'Аттестат государственного образца'] },
  pravoslavnye:    { label: 'православная гимназия', grades: '1–11', priceFrom: 0,     features: ['Основы православной культуры', 'Малые классы', 'Духовное воспитание', 'Программа ФГОС', 'Аттестат государственного образца'] },
  sportivnye:      { label: 'спортивная школа',      grades: '5–11', priceFrom: 0,     features: ['Спортивные секции', 'Тренировки в расписании', 'Подготовка к соревнованиям', 'Совмещение спорта и учёбы', 'Аттестат государственного образца'] },
  mezhdunarodnie:  { label: 'международная школа',   grades: '1–11', priceFrom: 60000, features: ['Международная программа', 'Обучение на английском', 'Носители языка', 'Малые классы', 'Двуязычное обучение'] },
  chastnie:        { label: 'частная школа',         grades: '1–11', priceFrom: 25000, features: ['Малые классы', 'Индивидуальный подход', 'Продлёнка до вечера', 'Питание включено', 'Аттестат государственного образца'] },
  yazykovye:       { label: 'языковая школа',        grades: '1–11', priceFrom: 0,     features: ['Углублённое изучение иностранных языков', 'Второй иностранный язык', 'Подготовка к международным экзаменам', 'Носители языка', 'Аттестат государственного образца'] },
}

// ─── Генерация описаний ───────────────────────────────────────────────────────
// Тексты варьируются по хэшу слага: на 400+ новых карточек одинаковый абзац
// читался бы поисковиком как шаблонный дубль.
const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h) }

const SHORT = {
  vechernie: c => [
    `Вечерняя школа ${c} — аттестат о среднем образовании без отрыва от работы.`,
    `Вечерняя (сменная) школа ${c}: обучение по вечерам для работающих подростков и взрослых.`,
    `Школа ${c} для тех, кто заканчивает 9 и 11 класс в вечернем формате.`,
  ],
  gosudarstvennye: c => [
    `Муниципальная общеобразовательная школа ${c} — бесплатное обучение по ФГОС с 1 по 11 класс.`,
    `Государственная школа ${c}: полный цикл обучения, аттестат государственного образца.`,
    `Общеобразовательная школа ${c} — бесплатное обучение, продлёнка и горячее питание.`,
  ],
  gimnazii: c => [
    `Гимназия ${c} — углублённое гуманитарное образование и подготовка к олимпиадам.`,
    `Гимназия ${c}: расширенная программа по языкам и гуманитарным предметам.`,
    `Гимназия ${c} — повышенный уровень программы с 1 по 11 класс.`,
  ],
  profilnye: c => [
    `Профильная школа ${c} — классы с углублённым изучением предметов и подготовкой к ЕГЭ.`,
    `Лицей ${c}: профильные классы старшей школы и олимпиадная подготовка.`,
    `Школа ${c} с профильными классами — физмат, естественно-научное и IT-направления.`,
  ],
  korrektsionnye: c => [
    `Коррекционная школа ${c} — обучение детей с ОВЗ по адаптированным программам.`,
    `Специальная школа ${c}: малые классы, логопед, дефектолог и психолог.`,
    `Школа ${c} для детей с особыми образовательными потребностями.`,
  ],
  kadetskie: c => [
    `Кадетский корпус ${c} — военно-патриотическое воспитание и общее образование.`,
    `Кадетская школа ${c}: дисциплина, физподготовка и полная школьная программа.`,
    `Кадетский класс ${c} — обучение с 5 класса, форма и распорядок дня.`,
  ],
  internaty: c => [
    `Школа-интернат ${c} — обучение с круглосуточным проживанием и питанием.`,
    `Интернат ${c}: проживание, пятиразовое питание и воспитатели.`,
    `Школа-интернат ${c} — полный пансион и общеобразовательная программа.`,
  ],
  'pri-vuzakh': c => [
    `Лицей при вузе ${c} — углублённые программы и подготовка к поступлению.`,
    `Школа при университете ${c}: преподаватели вуза и профильные классы.`,
    `Предуниверсарий ${c} — обучение старшеклассников на базе вуза.`,
  ],
  pravoslavnye: c => [
    `Православная гимназия ${c} — общее образование и основы православной культуры.`,
    `Православная школа ${c}: малые классы и духовно-нравственное воспитание.`,
    `Церковная гимназия ${c} — программа ФГОС и православный компонент.`,
  ],
  sportivnye: c => [
    `Спортивная школа ${c} — совмещение тренировок с общеобразовательной программой.`,
    `Школа ${c} со спортивным уклоном: секции и подготовка к соревнованиям.`,
    `Спортивная школа ${c} — учёба и профессиональный спорт в одном расписании.`,
  ],
  mezhdunarodnie: c => [
    `Международная школа ${c} — обучение на английском по международной программе.`,
    `Международная школа ${c}: билингвальное обучение и носители языка.`,
    `Школа ${c} с международной программой и обучением на двух языках.`,
  ],
  chastnie: c => [
    `Частная школа ${c} — малые классы и индивидуальный подход к ученику.`,
    `Частная школа ${c}: продлёнка до вечера, питание и расширенная программа.`,
    `Негосударственная школа ${c} — аттестат государственного образца и малые группы.`,
  ],
  yazykovye: c => [
    `Языковая школа ${c} — углублённое изучение иностранных языков с начальных классов.`,
    `Школа ${c} с углублённым английским и вторым иностранным языком.`,
    `Языковая школа ${c}: подготовка к международным экзаменам по языку.`,
  ],
}

function makeDescriptions(name, type, cityName, cityIn, address, meta) {
  const h = hash(name + cityName)
  const variants = (SHORT[type] ?? SHORT.gosudarstvennye)(cityIn)
  const description = variants[h % variants.length]

  // без улицы фраза «расположена в городе N» дублирует первое предложение — опускаем
  const where = address && !address.startsWith('г. ')
    ? `Школа находится по адресу: ${cityName}, ${address}.`
    : ''

  const grades = `Обучение ведётся с ${meta.grades.split('–')[0]} по ${meta.grades.split('–')[1]} класс.`

  const money = meta.priceFrom > 0
    ? `Обучение платное — стоимость начинается от ${meta.priceFrom.toLocaleString('ru-RU')} ₽ в месяц и зависит от класса и выбранной программы.`
    : `Обучение бесплатное: школа финансируется из бюджета и работает по стандартам ФГОС.`

  const closing = {
    vechernie:       'Формат подходит тем, кто совмещает учёбу с работой или уже вышел из школьного возраста: занятия проходят в вечернее время, а по итогам выдаётся аттестат государственного образца — с ним можно поступать в колледж или вуз на общих основаниях.',
    gosudarstvennye: 'В школе работают предметные кружки и секции в рамках дополнительного образования, организовано горячее питание, для младших классов есть группа продлённого дня. Выпускники сдают ОГЭ и ЕГЭ и получают аттестат государственного образца.',
    gimnazii:        'Гимназическая программа предполагает повышенную нагрузку по языкам и гуманитарным предметам, участие в предметных олимпиадах и исследовательских проектах. Выпускники получают аттестат государственного образца.',
    profilnye:       'Старшие классы разделены по профилям, что позволяет сосредоточиться на предметах, нужных для поступления. В программе — углублённые курсы, элективы и системная подготовка к ЕГЭ.',
    korrektsionnye:  'Обучение строится по адаптированным основным общеобразовательным программам с учётом заключения ПМПК. С детьми работают логопед, дефектолог и педагог-психолог, наполняемость классов снижена.',
    kadetskie:       'Помимо основной программы кадеты занимаются строевой и физической подготовкой, изучают основы военной службы и истории Отечества. Установлен распорядок дня и ношение форменной одежды.',
    internaty:       'Обучающиеся живут при школе: организовано проживание, пятиразовое питание, медицинское сопровождение и работа воспитателей во внеурочное время. На выходные и каникулы дети уезжают домой.',
    'pri-vuzakh':    'Занятия ведут в том числе преподаватели вуза, программа рассчитана на подготовку к поступлению на профильные направления. Ученики получают доступ к лабораториям и мероприятиям университета.',
    pravoslavnye:    'Наряду с федеральной программой изучаются основы православной культуры, действует свой уклад школьной жизни. Классы небольшие, много внимания уделяется воспитательной работе.',
    sportivnye:      'Расписание построено так, чтобы тренировки не мешали освоению школьной программы. Ученики выступают на городских и региональных соревнованиях, при этом сдают ОГЭ и ЕГЭ на общих основаниях.',
    mezhdunarodnie:  'Часть предметов преподаётся на английском языке, в штате есть носители языка. Программа ориентирована на продолжение образования как в России, так и за рубежом.',
    chastnie:        'Наполняемость классов ниже, чем в государственных школах, что позволяет уделять внимание каждому ученику. В стоимость обычно входят питание, продлёнка и часть дополнительных занятий — точный состав уточняйте у администрации.',
    yazykovye:       'Иностранный язык изучается с расширенным числом часов, со средней школы добавляется второй язык. Ученики готовятся к международным языковым экзаменам и участвуют в языковых олимпиадах.',
  }[type] ?? ''

  // Порядок блоков варьируем, чтобы карточки не были копиями друг друга
  // если название уже содержит тип («Школа-интернат №9»), не повторяем его дважды
  const typeWord = meta.label.split(' ')[0].toLowerCase().replace(/[аяоеы]$/, '')
  const head = name.toLowerCase().includes(typeWord)
    ? `${name} — образовательное учреждение ${cityIn}.`
    : `${name} — ${meta.label} ${cityIn}.`
  const blocks = h % 2 === 0
    ? [head, where, grades, money, closing]
    : [head, grades, where, money, closing]

  return { description, fullDescription: blocks.filter(Boolean).join(' ') }
}

// ─── Форматирование в TS ──────────────────────────────────────────────────────
const esc = v => String(v ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")

function formatSchool(s) {
  const lines = [
    `  {`,
    `    id: '${s.id}',`,
    `    slug: '${s.slug}',`,
    `    name: '${esc(s.name)}',`,
    `    type: '${s.type}',`,
    `    region: '${s.region}',`,
    `    city: '${esc(s.city)}',`,
    `    address: '${esc(s.address)}',`,
    `    phone: '${esc(s.phone)}',`,
  ]
  if (s.website) lines.push(`    website: '${esc(s.website)}',`)
  if (s.email)   lines.push(`    email: '${esc(s.email)}',`)
  lines.push(
    `    description: '${esc(s.description)}',`,
    `    fullDescription: '${esc(s.fullDescription)}',`,
    `    grades: '${s.grades}',`,
    `    features: ${JSON.stringify(s.features)},`,
    `    rating: null,`,
    `    reviewCount: 0,`,
    `    priceFrom: ${s.priceFrom},`,
    `    imageAlt: '${esc(s.imageAlt)}',`,
  )
  if (s.lat != null) lines.push(`    lat: ${s.lat},`)
  if (s.lon != null) lines.push(`    lon: ${s.lon},`)
  lines.push(`  },`)
  return lines.join('\n')
}

// ─── Вставка в schools.ts ─────────────────────────────────────────────────────
const MARKER = '] as any[] as School[])'
function appendSchools(newSchools) {
  const src = readFileSync(SCHOOLS_TS, 'utf8')
  const idx = src.lastIndexOf(MARKER)
  if (idx === -1) throw new Error('маркер конца массива не найден в schools.ts')
  const blocks = newSchools.map(formatSchool).join('\n')
  writeFileSync(SCHOOLS_TS, src.slice(0, idx) + blocks + '\n' + src.slice(idx), 'utf8')
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const existingSlugs = new Set(schools.map(s => s.slug))
const existingKeys  = new Set(schools.map(s => (s.name + '|' + s.region).toLowerCase().replace(/\s+/g, ' ').trim()))

// дефицит: пары «город × тип» с count < MIN, только по типам, которые есть в OSM
const counts = {}
for (const s of schools) counts[s.region + '|' + s.type] = (counts[s.region + '|' + s.type] || 0) + 1

const deficitByCity = {}
for (const r of regionSlugs) {
  for (const t of typeSlugs) {
    if (!OSM_TYPES.has(t)) continue
    const c = counts[r + '|' + t] || 0
    if (c >= MIN) continue
    ;(deficitByCity[r] ||= {})[t] = MIN - c
  }
}

let cities = Object.keys(deficitByCity)
  .map(r => ({ slug: r, name: regionLabels[r], nameIn: regionLabelsIn[r] ?? `в ${regionLabels[r]}`, need: deficitByCity[r] }))
  .filter(c => c.name && c.name !== 'Московская область')  // МО — не город, Overpass по нему не работает
  .sort((a, b) => Object.values(b.need).reduce((x, y) => x + y, 0) - Object.values(a.need).reduce((x, y) => x + y, 0))

if (LIMIT > 0) cities = cities.slice(0, LIMIT)

console.log(`\n🎯 Городов с дефицитом (порог ${MIN} школ на тип): ${cities.length}`)
console.log(`   Всего не хватает школ: ${cities.reduce((a, c) => a + Object.values(c.need).reduce((x, y) => x + y, 0), 0)}`)
if (DRY) console.log('   Режим: DRY RUN, файл не меняется\n')

let totalAdded = 0
const report = []

for (const [i, city] of cities.entries()) {
  const wanted = city.need
  console.log(`\n[${i + 1}/${cities.length}] ${city.name} — нужно: ${Object.entries(wanted).map(([t, n]) => `${t}×${n}`).join(', ')}`)

  let elements
  try {
    elements = await fetchCity(city.name)
  } catch (e) {
    console.log(`  ❌ ${e.message}`)
    report.push({ city: city.name, added: 0, error: e.message })
    continue
  }

  const remaining = { ...wanted }
  const picked = []
  const seen = new Set()

  for (const el of elements) {
    const tags = el.tags ?? {}
    const name = normalizeName(tags.name || tags['name:ru'] || '')
    if (!name || name.length < 6) continue
    if (isBad(name) || !isSchool(name)) continue
    // «Школа», «Гимназия» без номера и имени — карточку из такого не сделать
    if (!/\d|«|"|им\.|имени/.test(name) && name.split(' ').length < 3) continue

    const type = detectType(name, tags)
    if (!remaining[type] || remaining[type] <= 0) continue

    const key = (name + '|' + city.slug).toLowerCase().replace(/\s+/g, ' ').trim()
    if (existingKeys.has(key) || seen.has(key)) continue

    const slug = makeSlug(name, city.slug)
    if (existingSlugs.has(slug)) continue

    const street = tags['addr:street'] || ''
    const house  = tags['addr:housenumber'] || ''
    const address = [street, house].filter(Boolean).join(', ') || `г. ${city.name}`
    const meta = TYPE_META[type]
    const { description, fullDescription } = makeDescriptions(name, type, city.name, city.nameIn, address, meta)

    picked.push({
      id: slug,
      slug,
      name,
      type,
      region: city.slug,
      city: city.name,
      address,
      phone: tags.phone || tags['contact:phone'] || '',
      website: tags.website || tags['contact:website'] || '',
      email: tags.email || tags['contact:email'] || '',
      description,
      fullDescription,
      grades: meta.grades,
      features: meta.features,
      priceFrom: meta.priceFrom,
      imageAlt: `${name} — ${meta.label} ${city.nameIn}`,
      lat: el.center?.lat ?? el.lat ?? null,
      lon: el.center?.lon ?? el.lon ?? null,
    })
    seen.add(key)
    existingSlugs.add(slug)
    remaining[type]--
  }

  const closed = Object.entries(wanted).filter(([t, n]) => (remaining[t] ?? n) <= 0).length
  console.log(`  📦 OSM: ${elements.length} объектов → отобрано ${picked.length} (закрыто типов: ${closed}/${Object.keys(wanted).length})`)

  if (picked.length && !DRY) {
    appendSchools(picked)
    for (const s of picked) existingKeys.add((s.name + '|' + s.region).toLowerCase())
  }
  if (picked.length && DRY) {
    picked.slice(0, 5).forEach(s => console.log(`     · [${s.type}] ${s.name}`))
    if (picked.length > 5) console.log(`     … и ещё ${picked.length - 5}`)
  }

  totalAdded += picked.length
  report.push({ city: city.name, added: picked.length, byType: picked.reduce((a, s) => ({ ...a, [s.type]: (a[s.type] || 0) + 1 }), {}) })

  await sleep(1500)
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
console.log(`${DRY ? '🔍 DRY RUN' : '✅ Готово'}: ${totalAdded} школ${DRY ? ' было бы добавлено' : ' добавлено в schools.ts'}`)
writeFileSync(path.join(__dirname, 'expand-report.json'), JSON.stringify(report, null, 2))
console.log(`📄 Отчёт: scripts/expand-report.json`)
