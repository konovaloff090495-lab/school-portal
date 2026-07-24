#!/usr/bin/env node
/**
 * add-cities-100k.mjs — заводит города 100k+, которых ещё нет в каталоге.
 * Список получен из OSM (place=city, population>=100000) минус наши 130 минус
 * районы Москвы/Питера (Зеленоград, Колпино, Пушкин) и города Подмосковья.
 * Падежи заданы вручную (автосклонение врёт).
 *
 * Запуск: node scripts/add-cities-100k.mjs [--dry]
 */
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCHOOLS_TS = path.join(__dirname, '..', 'src', 'data', 'schools.ts')
const DRY = process.argv.includes('--dry')

// [slug, именительный, предложный, родительный, код субъекта РФ]
const CITIES = [
  ['komsomolsk-na-amure', 'Комсомольск-на-Амуре', 'в Комсомольске-на-Амуре', 'Комсомольска-на-Амуре', '27'],
  ['orsk',                'Орск',                 'в Орске',                 'Орска',                 '56'],
  ['syzran',              'Сызрань',              'в Сызрани',               'Сызрани',               '63'],
  ['volgodonsk',          'Волгодонск',           'в Волгодонске',           'Волгодонска',           '61'],
  ['rubtsovsk',           'Рубцовск',             'в Рубцовске',             'Рубцовска',             '22'],
  ['khasavyurt',          'Хасавюрт',             'в Хасавюрте',             'Хасавюрта',             '05'],
  ['berezniki',           'Березники',            'в Березниках',            'Березников',            '59'],
  ['kyzyl',               'Кызыл',                'в Кызыле',                'Кызыла',                '17'],
  ['kaspiysk',            'Каспийск',             'в Каспийске',             'Каспийска',             '05'],
  ['kislovodsk',          'Кисловодск',           'в Кисловодске',           'Кисловодска',           '26'],
  ['bataysk',             'Батайск',              'в Батайске',              'Батайска',              '61'],
  ['nazran',              'Назрань',              'в Назрани',               'Назрани',               '06'],
  ['essentuki',          'Ессентуки',            'в Ессентуках',            'Ессентуков',            '26'],
  ['novocheboksarsk',     'Новочебоксарск',       'в Новочебоксарске',       'Новочебоксарска',       '21'],
  ['novomoskovsk',        'Новомосковск',         'в Новомосковске',         'Новомосковска',         '71'],
  ['mikhaylovsk',         'Михайловск',           'в Михайловске',           'Михайловска',           '26'],
  ['nevinnomyssk',        'Невинномысск',         'в Невинномысске',         'Невинномысска',         '26'],
  ['dimitrovgrad',        'Димитровград',         'в Димитровграде',         'Димитровграда',         '73'],
  ['kamyshin',            'Камышин',              'в Камышине',              'Камышина',              '34'],
  ['artem',               'Артём',                'в Артёме',                'Артёма',                '25'],
  ['evpatoriya',          'Евпатория',            'в Евпатории',             'Евпатории',             '91'],
  ['seversk',             'Северск',              'в Северске',              'Северска',              '70'],
  ['novoshakhtinsk',      'Новошахтинск',         'в Новошахтинске',         'Новошахтинска',         '61'],
  ['arzamas',             'Арзамас',              'в Арзамасе',              'Арзамаса',              '52'],
  ['berdsk',              'Бердск',               'в Бердске',               'Бердска',               '54'],
  ['elets',               'Елец',                 'в Ельце',                 'Ельца',                 '48'],
  ['noyabrsk',            'Ноябрьск',             'в Ноябрьске',             'Ноябрьска',             '89'],
]

let src = readFileSync(SCHOOLS_TS, 'utf8')
const fresh = CITIES.filter(([slug]) => !new RegExp(`'${slug}'`).test(src))
const already = CITIES.filter(([slug]) => new RegExp(`'${slug}'`).test(src)).map(c => c[0])
if (already.length) console.log('уже заведены:', already.join(', '))
console.log(`Добавляю городов: ${fresh.length}`)
if (!fresh.length) process.exit(0)

const appendTo = (marker, lines) => {
  const idx = src.indexOf(marker); if (idx === -1) throw new Error('нет ' + marker)
  const close = src.indexOf('\n}', idx)
  src = src.slice(0, close) + '\n' + lines.join('\n') + src.slice(close)
}
appendTo('export const regionLabels: Record<RegionSlug, string> = {', fresh.map(([s, n]) => `  '${s}': '${n}',`))
appendTo('export const regionLabelsIn: Record<RegionSlug, string> = {', fresh.map(([s, , i]) => `  '${s}': '${i}',`))
appendTo('export const regionLabelsOf: Record<RegionSlug, string> = {', fresh.map(([s, , , g]) => `  '${s}': '${g}',`))
src = src.replace(/(export const regionSlugs: RegionSlug\[\] = \[[^\]]*)\]/, (_, h) => `${h}, ${fresh.map(([s]) => `'${s}'`).join(', ')}]`)

// сохраняем список слагов и subject-код рядом, чтобы rlic-all-cities мог их подхватить
const subjOut = fresh.map(([slug, name, , , code]) => ({ slug, name, code }))

console.log('Города:', fresh.map(c => c[1]).join(', '))
if (!DRY) {
  writeFileSync(SCHOOLS_TS, src, 'utf8')
  writeFileSync(path.join(__dirname, 'new-cities-100k.json'), JSON.stringify(subjOut, null, 2))
  console.log('💾 schools.ts обновлён; slug/subject → scripts/new-cities-100k.json')
  console.log('\nДальше OSM:\n  node scripts/expand-catalog.mjs --full="' + fresh.map(c => c[1]).join(',') + '"')
} else console.log('🔍 DRY')
