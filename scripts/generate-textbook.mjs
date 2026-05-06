#!/usr/bin/env node
/**
 * Генератор статей для онлайн-учебника
 * Использование:
 *   node scripts/generate-textbook.mjs --subject=matematika --klass=5
 *   node scripts/generate-textbook.mjs --subject=algebra --klass=8 --topic=kvadratnoe-uravnenie
 *   node scripts/generate-textbook.mjs --all --limit=10
 */

import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dir, '..')
const ARTICLES_FILE = resolve(ROOT, 'src/data/textbook-articles.ts')

// ─── Аргументы ───────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => {
      const [k, v] = a.slice(2).split('=')
      return [k, v ?? true]
    })
)

const SUBJECT = args.subject
const KLASS = args.klass ? Number(args.klass) : null
const TOPIC_SLUG = args.topic ?? null
const ALL = args.all === true
const LIMIT = args.limit ? Number(args.limit) : 5
const DRY_RUN = args['dry-run'] === true

// ─── Данные тем ──────────────────────────────────────────────────────────────
// Читаем напрямую из файла данных (без импорта TS)
const textbookData = readFileSync(resolve(ROOT, 'src/data/textbook.ts'), 'utf-8')

// Простая экстракция тем через регулярки из RAW_TOPICS
function extractTopics() {
  const topics = []
  const subjectRegex = /(\w[\w-]*):\s*\{/g
  const klassRegex = /(\d+):\s*\[/g
  const topicRegex = /\{\s*slug:\s*'([^']+)',\s*title:\s*'([^']+)',\s*excerpt:\s*'([^']+)'/g

  let match
  // Более надёжно: читаем из сгенерированного JSON файла
  // Вместо парсинга TS, используем Node.js require после сборки
  // Для скрипта используем статический список тем
  return topics
}

// Статический список тем (дублируем из textbook.ts для скрипта)
const ALL_TOPICS = [
  // matematika
  { subject: 'matematika', klass: 1, slug: 'schyot-do-10', title: 'Счёт до 10' },
  { subject: 'matematika', klass: 1, slug: 'slozhenie-vychitanie-do-10', title: 'Сложение и вычитание до 10' },
  { subject: 'matematika', klass: 1, slug: 'geometricheskie-figury-1', title: 'Геометрические фигуры' },
  { subject: 'matematika', klass: 2, slug: 'tablitsa-mnozheniya', title: 'Таблица умножения' },
  { subject: 'matematika', klass: 2, slug: 'ploshhad-i-perimetr', title: 'Площадь и периметр' },
  { subject: 'matematika', klass: 3, slug: 'tablitsa-mnozheniya-polnaya', title: 'Полная таблица умножения' },
  { subject: 'matematika', klass: 3, slug: 'deление-s-ostatkom', title: 'Деление с остатком' },
  { subject: 'matematika', klass: 4, slug: 'obyknovennye-drobi', title: 'Обыкновенные дроби' },
  { subject: 'matematika', klass: 5, slug: 'delitelnost-chisel', title: 'Делимость чисел' },
  { subject: 'matematika', klass: 5, slug: 'nod-i-nok', title: 'НОД и НОК' },
  { subject: 'matematika', klass: 5, slug: 'dejstviya-s-drobyami', title: 'Действия с дробями' },
  { subject: 'matematika', klass: 5, slug: 'protsenty', title: 'Проценты' },
  { subject: 'matematika', klass: 6, slug: 'otricatelnye-chisla', title: 'Отрицательные числа' },
  { subject: 'matematika', klass: 6, slug: 'proportsii', title: 'Отношения и пропорции' },
  // algebra
  { subject: 'algebra', klass: 7, slug: 'algebraicheskie-vyrazheniya', title: 'Алгебраические выражения' },
  { subject: 'algebra', klass: 7, slug: 'formuly-sokrashchennogo-umnozheniya', title: 'Формулы сокращённого умножения' },
  { subject: 'algebra', klass: 7, slug: 'lineynye-uravneniya', title: 'Линейные уравнения' },
  { subject: 'algebra', klass: 7, slug: 'sistemy-uravneniy-7', title: 'Системы линейных уравнений' },
  { subject: 'algebra', klass: 8, slug: 'kvadratnye-korni', title: 'Квадратные корни' },
  { subject: 'algebra', klass: 8, slug: 'kvadratnoe-uravnenie', title: 'Квадратное уравнение' },
  { subject: 'algebra', klass: 8, slug: 'teorema-vieta', title: 'Теорема Виета' },
  { subject: 'algebra', klass: 8, slug: 'funkciya-kvadratichnaya', title: 'Квадратичная функция' },
  { subject: 'algebra', klass: 9, slug: 'geometricheskaya-progressiya', title: 'Геометрическая прогрессия' },
  { subject: 'algebra', klass: 10, slug: 'trigonometriya-osnovy', title: 'Тригонометрические функции' },
  { subject: 'algebra', klass: 10, slug: 'logarifmy', title: 'Логарифмы' },
  { subject: 'algebra', klass: 11, slug: 'proizvodnaya', title: 'Производная' },
  { subject: 'algebra', klass: 11, slug: 'opredelenny-integral', title: 'Определённый интеграл' },
  // geometriya
  { subject: 'geometriya', klass: 7, slug: 'teorema-pifagora', title: 'Теорема Пифагора' },
  { subject: 'geometriya', klass: 8, slug: 'teorema-pifagora', title: 'Теорема Пифагора' },
  { subject: 'geometriya', klass: 8, slug: 'podob-treugolniki', title: 'Подобные треугольники' },
  { subject: 'geometriya', klass: 9, slug: 'sin-kosin-teorema', title: 'Теоремы синусов и косинусов' },
  { subject: 'geometriya', klass: 10, slug: 'tela-vrashheniya', title: 'Тела вращения' },
  // russkiy-yazyk
  { subject: 'russkiy-yazyk', klass: 5, slug: 'morfemika', title: 'Морфемика и словообразование' },
  { subject: 'russkiy-yazyk', klass: 5, slug: 'sushhestvitelnoe', title: 'Имя существительное' },
  { subject: 'russkiy-yazyk', klass: 5, slug: 'glagol-5', title: 'Глагол' },
  { subject: 'russkiy-yazyk', klass: 9, slug: 'spp', title: 'Сложноподчинённое предложение' },
  { subject: 'russkiy-yazyk', klass: 9, slug: 'bsp', title: 'Бессоюзное предложение' },
  { subject: 'russkiy-yazyk', klass: 11, slug: 'ege-russkiy', title: 'ЕГЭ по русскому языку' },
  // fizika
  { subject: 'fizika', klass: 7, slug: 'zakony-nyutona', title: 'Законы Ньютона' },
  { subject: 'fizika', klass: 7, slug: 'davlenie', title: 'Давление. Закон Паскаля' },
  { subject: 'fizika', klass: 9, slug: 'postoyanny-tok', title: 'Постоянный ток. Закон Ома' },
  { subject: 'fizika', klass: 9, slug: 'impuls', title: 'Закон сохранения импульса' },
  { subject: 'fizika', klass: 11, slug: 'optika', title: 'Оптика' },
  // khimiya
  { subject: 'khimiya', klass: 8, slug: 'tablitsa-mendeleeva', title: 'Периодическая система Менделеева' },
  { subject: 'khimiya', klass: 8, slug: 'kisloty', title: 'Кислоты' },
  { subject: 'khimiya', klass: 8, slug: 'himicheskie-uravneniya', title: 'Химические уравнения' },
  { subject: 'khimiya', klass: 9, slug: 'okislenie-vosstanovlenie', title: 'ОВР' },
  // biologiya
  { subject: 'biologiya', klass: 5, slug: 'kletka', title: 'Клетка — основа жизни' },
  { subject: 'biologiya', klass: 9, slug: 'genetika', title: 'Основы генетики' },
  { subject: 'biologiya', klass: 9, slug: 'evolyutsiya', title: 'Эволюция органического мира' },
  // istoriya
  { subject: 'istoriya', klass: 5, slug: 'drevniy-egipet', title: 'Древний Египет' },
  { subject: 'istoriya', klass: 5, slug: 'drevnyaya-gretsiya', title: 'Древняя Греция' },
  { subject: 'istoriya', klass: 9, slug: 'vtoraya-mirovaya', title: 'Вторая мировая война' },
  { subject: 'istoriya', klass: 11, slug: 'sssr-raspas', title: 'Распад СССР' },
  // obshchestvoznanie
  { subject: 'obshchestvoznanie', klass: 9, slug: 'ekonomika-9', title: 'Экономика' },
  { subject: 'obshchestvoznanie', klass: 9, slug: 'pravo-9', title: 'Право' },
  // geografiya
  { subject: 'geografiya', klass: 5, slug: 'zemlya-planeta', title: 'Земля — планета Солнечной системы' },
  { subject: 'geografiya', klass: 8, slug: 'klimat-rossii', title: 'Климат России' },
  // informatika
  { subject: 'informatika', klass: 7, slug: 'algoritmy', title: 'Алгоритмы' },
  { subject: 'informatika', klass: 9, slug: 'programmirovanie-9', title: 'Основы программирования (Python)' },
]

// ─── Клиент Anthropic ─────────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const tokenUsage = { input: 0, output: 0 }

function addUsage(u) {
  tokenUsage.input += u?.input_tokens ?? 0
  tokenUsage.output += u?.output_tokens ?? 0
}

function cost() {
  return ((tokenUsage.input / 1e6) * 3 + (tokenUsage.output / 1e6) * 15).toFixed(4)
}

// ─── Промпт для генерации статьи ─────────────────────────────────────────────
function buildPrompt(subject, klass, title) {
  return `Напиши подробную учебную статью для школьного онлайн-учебника.

Параметры:
- Предмет: ${subject}
- Класс: ${klass}
- Тема: ${title}

Требования:
1. Объём: 800–1200 слов
2. Структура: H2 заголовки для разделов, H3 для подразделов
3. Содержание:
   - Краткое определение/суть темы
   - Основная теория с формулами (если нужно — в виде текста)
   - 2–3 разобранных примера с пошаговым решением
   - Ключевые правила / «запомни»
   - Типичные ошибки
4. Язык: понятный для школьника, без лишнего усложнения
5. Формат: только HTML (без markdown), используй: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <table>, <blockquote>
6. Для формул: записывай в виде обычного текста или <code>формула</code>
7. Добавь блок «Проверь себя» с 2–3 короткими вопросами в конце

Начни сразу с контента, без <html>/<body>/<head>.`
}

// ─── Генерация одной статьи ───────────────────────────────────────────────────
async function generateArticle(subjectTitle, klass, title) {
  const msg = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: buildPrompt(subjectTitle, klass, title),
    }],
  })
  addUsage(msg.usage)
  return msg.content[0].text.trim()
}

// ─── Читаем/пишем articles файл ──────────────────────────────────────────────
function readArticles() {
  try {
    const content = readFileSync(ARTICLES_FILE, 'utf-8')
    // Извлекаем массив статей
    const match = content.match(/const articles[^=]*=\s*(\[[\s\S]*?\])\s*\n\nexport/)
    if (!match) return []
    // Не парсим TS напрямую — используем eval-like подход через JSON
    // Просто вернём пустой массив и будем аппендить
    return []
  } catch { return [] }
}

function appendArticle(article) {
  let content = readFileSync(ARTICLES_FILE, 'utf-8')
  const escapedContent = article.content
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${')

  const newEntry = `  {
    subject: '${article.subject}',
    klass: ${article.klass},
    topicSlug: '${article.topicSlug}',
    publishedAt: '${article.publishedAt}',
    content: \`${escapedContent}\`,
  },`

  // Вставляем перед "// Статьи генерируются" или перед ]
  const marker = '  // Статьи генерируются автоматически'
  if (content.includes(marker)) {
    content = content.replace(marker, newEntry + '\n' + marker)
  } else {
    content = content.replace(/^]$/m, newEntry + '\n]')
  }
  writeFileSync(ARTICLES_FILE, content)
}

function articleExists(subject, klass, topicSlug) {
  const content = readFileSync(ARTICLES_FILE, 'utf-8')
  return content.includes(`subject: '${subject}'`) && content.includes(`topicSlug: '${topicSlug}'`) &&
    content.includes(`klass: ${klass}`)
}

// ─── Карта названий предметов ─────────────────────────────────────────────────
const SUBJECT_NAMES = {
  'matematika': 'Математика',
  'algebra': 'Алгебра',
  'geometriya': 'Геометрия',
  'russkiy-yazyk': 'Русский язык',
  'literatura': 'Литература',
  'angliiskiy-yazyk': 'Английский язык',
  'fizika': 'Физика',
  'khimiya': 'Химия',
  'biologiya': 'Биология',
  'istoriya': 'История',
  'obshchestvoznanie': 'Обществознание',
  'geografiya': 'География',
  'informatika': 'Информатика',
}

// ─── Главная логика ───────────────────────────────────────────────────────────
async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ Нужен ANTHROPIC_API_KEY')
    process.exit(1)
  }

  // Определяем что генерировать
  let topics = ALL_TOPICS

  if (TOPIC_SLUG && SUBJECT && KLASS) {
    topics = topics.filter(t => t.subject === SUBJECT && t.klass === KLASS && t.slug === TOPIC_SLUG)
  } else if (SUBJECT && KLASS) {
    topics = topics.filter(t => t.subject === SUBJECT && t.klass === KLASS)
  } else if (SUBJECT) {
    topics = topics.filter(t => t.subject === SUBJECT)
  } else if (!ALL) {
    console.error('Укажи --subject=... или --all')
    console.error('Пример: node scripts/generate-textbook.mjs --subject=algebra --klass=8')
    process.exit(1)
  }

  // Пропускаем уже сгенерированные
  topics = topics.filter(t => !articleExists(t.subject, t.klass, t.slug))

  if (topics.length === 0) {
    console.log('✅ Все статьи уже сгенерированы!')
    process.exit(0)
  }

  // Ограничиваем
  const toGenerate = topics.slice(0, LIMIT)
  console.log(`\n📚 Генерация ${toGenerate.length} статей для учебника\n`)

  let generated = 0
  let errors = 0

  for (const topic of toGenerate) {
    const subjectName = SUBJECT_NAMES[topic.subject] ?? topic.subject
    process.stdout.write(`  📖 ${subjectName} ${topic.klass}кл · ${topic.title.padEnd(35)} `)

    if (DRY_RUN) {
      process.stdout.write('(dry-run)\n')
      continue
    }

    try {
      const content = await generateArticle(subjectName, topic.klass, topic.title)
      const article = {
        subject: topic.subject,
        klass: topic.klass,
        topicSlug: topic.slug,
        publishedAt: new Date().toISOString().slice(0, 10),
        content,
      }
      appendArticle(article)
      process.stdout.write(`✅\n`)
      generated++
    } catch (e) {
      process.stdout.write(`❌ ${e.message}\n`)
      errors++
      if (e.message?.includes('credit balance') || e.message?.includes('insufficient_quota')) {
        console.error('\n💳 Недостаточно средств на API')
        break
      }
    }

    await new Promise(r => setTimeout(r, 800))
  }

  console.log(`\n✅ Сгенерировано: ${generated} | Ошибок: ${errors}`)
  console.log(`💰 Использовано: ~$${cost()} (input: ${tokenUsage.input} / output: ${tokenUsage.output} токенов)`)
  console.log(`📋 Осталось тем: ${topics.length - toGenerate.length}`)
}

main().catch(e => {
  console.error('Fatal:', e)
  process.exit(1)
})
