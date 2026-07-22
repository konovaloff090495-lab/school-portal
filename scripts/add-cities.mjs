#!/usr/bin/env node
/**
 * add-cities.mjs — заводит новые города в каталог.
 *
 * Прописывает слаг в regionSlugs и во все три падежных словаря schools.ts.
 * Школы после этого добираются отдельно: node scripts/expand-catalog.mjs --full="Город"
 *
 * Падежи заданы вручную: автоматическое склонение на русских топонимах
 * ошибается («в Нижний Тагил», «Тольяттиа» — обе ошибки уже были в базе).
 *
 * Запуск: node scripts/add-cities.mjs [--dry]
 */

import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const SCHOOLS_TS = path.join(__dirname, '..', 'src', 'data', 'schools.ts')
const DRY = process.argv.includes('--dry')

// [slug, именительный, предложный, родительный, школ в OSM]
const CITIES = [
  ['murmansk',                 'Мурманск',                 'в Мурманске',                 'Мурманска',                 101],
  ['sevastopol',               'Севастополь',              'в Севастополе',               'Севастополя',                81],
  ['stary-oskol',              'Старый Оскол',             'в Старом Осколе',             'Старого Оскола',             74],
  ['kaluga',                   'Калуга',                   'в Калуге',                    'Калуги',                     65],
  ['grozny',                   'Грозный',                  'в Грозном',                   'Грозного',                   63],
  ['chita',                    'Чита',                     'в Чите',                      'Читы',                       62],
  ['orel',                     'Орёл',                     'в Орле',                      'Орла',                       62],
  ['simferopol',               'Симферополь',              'в Симферополе',               'Симферополя',                57],
  ['rybinsk',                  'Рыбинск',                  'в Рыбинске',                  'Рыбинска',                   55],
  ['veliky-novgorod',          'Великий Новгород',         'в Великом Новгороде',         'Великого Новгорода',         55],
  ['shakhty',                  'Шахты',                    'в Шахтах',                    'Шахт',                       53],
  ['volzhsky',                 'Волжский',                 'в Волжском',                  'Волжского',                  51],
  ['norilsk',                  'Норильск',                 'в Норильске',                 'Норильска',                  48],
  ['tambov',                   'Тамбов',                   'в Тамбове',                   'Тамбова',                    47],
  ['pskov',                    'Псков',                    'в Пскове',                    'Пскова',                     47],
  ['abakan',                   'Абакан',                   'в Абакане',                   'Абакана',                    47],
  ['petropavlovsk-kamchatsky', 'Петропавловск-Камчатский', 'в Петропавловске-Камчатском', 'Петропавловска-Камчатского', 46],
  ['oktyabrsky',               'Октябрьский',              'в Октябрьском',               'Октябрьского',               46],
  ['yuzhno-sakhalinsk',        'Южно-Сахалинск',           'в Южно-Сахалинске',           'Южно-Сахалинска',            45],
  ['nalchik',                  'Нальчик',                  'в Нальчике',                  'Нальчика',                   45],
  ['nizhnekamsk',              'Нижнекамск',               'в Нижнекамске',               'Нижнекамска',                44],
  ['zlatoust',                 'Златоуст',                 'в Златоусте',                 'Златоуста',                  44],
  ['blagoveshchensk',          'Благовещенск',             'в Благовещенске',             'Благовещенска',              44],
  ['armavir',                  'Армавир',                  'в Армавире',                  'Армавира',                   44],
  ['prokopyevsk',              'Прокопьевск',              'в Прокопьевске',              'Прокопьевска',               43],
  ['nakhodka',                 'Находка',                  'в Находке',                   'Находки',                    40],
  ['biysk',                    'Бийск',                    'в Бийске',                    'Бийска',                     40],
  ['elista',                   'Элиста',                   'в Элисте',                    'Элисты',                     39],
  ['taganrog',                 'Таганрог',                 'в Таганроге',                 'Таганрога',                  38],
  ['severodvinsk',             'Северодвинск',             'в Северодвинске',             'Северодвинска',              38],
  ['yoshkar-ola',              'Йошкар-Ола',               'в Йошкар-Оле',                'Йошкар-Олы',                 38],
  ['saransk',                  'Саранск',                  'в Саранске',                  'Саранска',                   37],
  ['miass',                    'Миасс',                    'в Миассе',                    'Миасса',                     37],
  ['yakutsk',                  'Якутск',                   'в Якутске',                   'Якутска',                    36],
  ['kamensk-uralsky',          'Каменск-Уральский',        'в Каменске-Уральском',        'Каменска-Уральского',        36],
  ['engels',                   'Энгельс',                  'в Энгельсе',                  'Энгельса',                   35],
  ['almetyevsk',               'Альметьевск',              'в Альметьевске',              'Альметьевска',               34],
  ['neftekamsk',               'Нефтекамск',               'в Нефтекамске',               'Нефтекамска',                33],
  ['kopeysk',                  'Копейск',                  'в Копейске',                  'Копейска',                   31],
  ['cherkessk',                'Черкесск',                 'в Черкесске',                 'Черкесска',                  30],
  ['novocherkassk',            'Новочеркасск',             'в Новочеркасске',             'Новочеркасска',              30],
  ['maykop',                   'Майкоп',                   'в Майкопе',                   'Майкопа',                    30],
  ['kerch',                    'Керчь',                    'в Керчи',                     'Керчи',                      29],
  ['balakovo',                 'Балаково',                 'в Балаково',                  'Балаково',                   29],
  ['derbent',                  'Дербент',                  'в Дербенте',                  'Дербента',                   26],
  ['kovrov',                   'Ковров',                   'в Коврове',                   'Коврова',                    24],
  ['yalta',                    'Ялта',                     'в Ялте',                      'Ялты',                       23],
  ['obninsk',                  'Обнинск',                  'в Обнинске',                  'Обнинска',                   23],
  ['salavat',                  'Салават',                  'в Салавате',                  'Салавата',                   22],
  ['nefteyugansk',             'Нефтеюганск',              'в Нефтеюганске',              'Нефтеюганска',               22],
  ['murom',                    'Муром',                    'в Муроме',                    'Мурома',                     22],
  ['ukhta',                    'Ухта',                     'в Ухте',                      'Ухты',                       21],
  ['ussuriysk',                'Уссурийск',                'в Уссурийске',                'Уссурийска',                 21],
  ['magadan',                  'Магадан',                  'в Магадане',                  'Магадана',                   21],
  ['elabuga',                  'Елабуга',                  'в Елабуге',                   'Елабуги',                    20],
  ['vorkuta',                  'Воркута',                  'в Воркуте',                   'Воркуты',                    19],
  ['pyatigorsk',               'Пятигорск',                'в Пятигорске',                'Пятигорска',                 18],
  ['pervouralsk',              'Первоуральск',             'в Первоуральске',             'Первоуральска',              18],
  ['achinsk',                  'Ачинск',                   'в Ачинске',                   'Ачинска',                    18],
  ['khanty-mansiysk',          'Ханты-Мансийск',           'в Ханты-Мансийске',           'Ханты-Мансийска',            17],
  ['novy-urengoy',             'Новый Уренгой',            'в Новом Уренгое',             'Нового Уренгоя',             17],
  ['zelenodolsk',              'Зеленодольск',             'в Зеленодольске',             'Зеленодольска',              17],
]

let src = readFileSync(SCHOOLS_TS, 'utf8')

const already = CITIES.filter(([slug]) => new RegExp(`'${slug}'`).test(src)).map(c => c[0])
const fresh = CITIES.filter(([slug]) => !already.includes(slug))
if (already.length) console.log(`Уже заведены, пропускаю: ${already.join(', ')}`)
console.log(`Добавляю городов: ${fresh.length} (школ в OSM суммарно: ${fresh.reduce((a, c) => a + c[4], 0)})`)

if (!fresh.length) process.exit(0)

// Вставка в конец каждого словаря — перед закрывающей скобкой блока
const appendTo = (marker, lines) => {
  const idx = src.indexOf(marker)
  if (idx === -1) throw new Error(`не найден маркер: ${marker}`)
  const close = src.indexOf('\n}', idx)
  src = src.slice(0, close) + '\n' + lines.join('\n') + src.slice(close)
}

appendTo('export const regionLabels: Record<RegionSlug, string> = {',
  fresh.map(([s, n]) => `  '${s}': '${n}',`))
appendTo('export const regionLabelsIn: Record<RegionSlug, string> = {',
  fresh.map(([s, , i]) => `  '${s}': '${i}',`))
appendTo('export const regionLabelsOf: Record<RegionSlug, string> = {',
  fresh.map(([s, , , g]) => `  '${s}': '${g}',`))

src = src.replace(
  /(export const regionSlugs: RegionSlug\[\] = \[[^\]]*)\]/,
  (_, head) => `${head}, ${fresh.map(([s]) => `'${s}'`).join(', ')}]`
)

console.log(`Города: ${fresh.map(c => c[1]).join(', ')}`)

if (!DRY) {
  writeFileSync(SCHOOLS_TS, src, 'utf8')
  console.log('💾 schools.ts обновлён')
  console.log(`\nДальше: node scripts/expand-catalog.mjs --full="${fresh.map(c => c[1]).join(',')}"`)
} else {
  console.log('🔍 DRY RUN — файл не менялся')
}
