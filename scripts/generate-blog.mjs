#!/usr/bin/env node
/**
 * Автогенератор статей блога pro-schools.ru
 *
 * Использование:
 *   node scripts/generate-blog.mjs              # генерирует 5 статей из очереди
 *   node scripts/generate-blog.mjs --count=3     # генерирует 3 статьи
 *   node scripts/generate-blog.mjs --dry-run     # только показывает что сгенерирует
 *   node scripts/generate-blog.mjs --id=t011     # конкретная тема по ID
 *   node scripts/generate-blog.mjs --no-deploy   # без деплоя
 *   node scripts/generate-blog.mjs --category="Рейтинги"  # только из категории
 *
 * Переменные окружения:
 *   ANTHROPIC_API_KEY=sk-ant-...   (обязательно)
 */

import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, writeFileSync } from 'fs'
import { execSync, spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { seoCheck } from './blog-seo-check.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.join(__dirname, '..')
const BLOG_TS   = path.join(ROOT, 'src', 'data', 'blog.ts')
const QUEUE     = path.join(__dirname, 'blog-topics.json')

// Vercel project (pro-schools.ru)
const VERCEL_ENV = {
  ...process.env,
  VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID || 'prj_VYu8oMFiOeRe6Pabqug4NJaekgpJ',
  VERCEL_ORG_ID:     process.env.VERCEL_ORG_ID     || 'team_nn4HHJh7sr6tITE0mA24TmBT',
}

// ─── CLI аргументы ──────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => {
      const [k, ...v] = a.slice(2).split('=')
      return [k, v.join('=') || true]
    })
)
const COUNT     = parseInt(args.count ?? '5')
const DRY_RUN   = !!args['dry-run']
const NO_DEPLOY = !!args['no-deploy']
const TARGET_ID = args.id
const CATEGORY  = args.category

// ─── Anthropic ──────────────────────────────────────────────────────────────
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
if (!ANTHROPIC_KEY) {
  console.error('❌ Нужен ANTHROPIC_API_KEY в переменных окружения')
  console.error('   export ANTHROPIC_API_KEY=sk-ant-...')
  process.exit(1)
}
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY })

// ─── Загрузить очередь ──────────────────────────────────────────────────────
function loadQueue() {
  return JSON.parse(readFileSync(QUEUE, 'utf-8'))
}

function saveQueue(q) {
  writeFileSync(QUEUE, JSON.stringify(q, null, 2))
}

// ─── Получить существующие slugи из blog.ts ─────────────────────────────────
function getExistingSlugs() {
  const content = readFileSync(BLOG_TS, 'utf-8')
  return [...content.matchAll(/slug:\s*'([^']+)'/g)].map(m => m[1])
}

// ─── Выбрать темы из очереди ────────────────────────────────────────────────
function pickTopics(queue, existingSlugs, count) {
  if (TARGET_ID) {
    const t = queue.topics.find(t => t.id === TARGET_ID)
    if (!t) throw new Error(`Тема ${TARGET_ID} не найдена`)
    return [t]
  }

  return queue.topics
    .filter(t => t.status === 'pending')
    .filter(t => !existingSlugs.includes(t.slug))
    .filter(t => !CATEGORY || t.category === CATEGORY)
    // Балансируем: чередуем города и общие темы
    .sort((a, b) => {
      // Приоритет по частоте запросов
      const fa = a.freq ?? 0
      const fb = b.freq ?? 0
      return fb - fa
    })
    .slice(0, count)
}

// ─── Карта внутренних ссылок каталога ───────────────────────────────────────
// Используется в промпте: скрипт выбирает релевантные ссылки по теме статьи
const INTERNAL_LINKS = [
  // Типы школ — общие
  { url: '/shkoly/',                                   label: 'каталог всех школ России' },
  { url: '/shkoly/tipy/gosudarstvennye/',              label: 'государственные школы' },
  { url: '/shkoly/tipy/chastnie/',                     label: 'частные школы' },
  { url: '/shkoly/tipy/online/',                       label: 'онлайн-школы' },
  { url: '/shkoly/tipy/vechernie/',                    label: 'вечерние школы' },
  { url: '/shkoly/tipy/eksternal/',                    label: 'школы-экстернаты' },
  { url: '/shkoly/tipy/internaty/',                    label: 'школы-интернаты' },
  // Профильные
  { url: '/shkoly/tipy/profilnye/',                    label: 'профильные школы' },
  { url: '/shkoly/tipy/profilnye/online/',             label: 'профильные онлайн-школы' },
  { url: '/shkoly/tipy/profilnye/10-11-klass/',        label: 'профильные классы 10–11' },
  // Гимназии и лицеи
  { url: '/shkoly/tipy/gimnazii/',                     label: 'гимназии' },
  // Спортивные
  { url: '/shkoly/tipy/sportivnye/',                   label: 'спортивные школы' },
  { url: '/shkoly/tipy/sportivnye/futbol/',            label: 'футбольные школы' },
  { url: '/shkoly/tipy/sportivnye/plavanie/',          label: 'школы плавания' },
  { url: '/shkoly/tipy/sportivnye/gimnastika/',        label: 'школы гимназии' },
  { url: '/shkoly/tipy/sportivnye/olimpijskij-rezerv/', label: 'школы олимпийского резерва' },
  // Кадетские
  { url: '/shkoly/tipy/kadetskie/',                    label: 'кадетские школы' },
  { url: '/shkoly/tipy/kadetskie/dlya-devochek/',      label: 'кадетские школы для девочек' },
  { url: '/shkoly/tipy/kadetskie/s-prozhivaniem/',     label: 'кадетские школы с проживанием' },
  // Языковые и международные
  { url: '/shkoly/tipy/yazykovye/',                    label: 'языковые школы' },
  { url: '/shkoly/tipy/mezhdunarodnie/',               label: 'международные школы' },
  { url: '/shkoly/tipy/mezhdunarodnie/anglijskie/',    label: 'английские школы' },
  // Подготовка к экзаменам
  { url: '/shkoly/tipy/podgotovka-ege/',               label: 'подготовка к ЕГЭ' },
  { url: '/shkoly/tipy/podgotovka-ege/matematika/',    label: 'подготовка к ЕГЭ по математике' },
  { url: '/shkoly/tipy/podgotovka-ege/russkij/',       label: 'подготовка к ЕГЭ по русскому' },
  { url: '/shkoly/tipy/podgotovka-oge/',               label: 'подготовка к ОГЭ' },
  { url: '/shkoly/tipy/podgotovka-oge/9-klass/',       label: 'подготовка к ОГЭ в 9 классе' },
  // При вузах
  { url: '/shkoly/tipy/pri-vuzakh/',                   label: 'школы при вузах' },
  { url: '/shkoly/tipy/pri-vuzakh/tehnicheskie/',      label: 'технические школы при вузах' },
  // Монтессори, Вальдорф
  { url: '/shkoly/tipy/montessori/',                   label: 'школы Монтессори' },
  { url: '/shkoly/tipy/valdorfskie/',                  label: 'вальдорфские школы' },
  // Города
  { url: '/shkoly/moskva/',                            label: 'школы Москвы' },
  { url: '/shkoly/sankt-peterburg/',                   label: 'школы Санкт-Петербурга' },
  { url: '/shkoly/novosibirsk/',                       label: 'школы Новосибирска' },
  { url: '/shkoly/ekaterinburg/',                      label: 'школы Екатеринбурга' },
  { url: '/shkoly/kazan/',                             label: 'школы Казани' },
  { url: '/shkoly/krasnodar/',                         label: 'школы Краснодара' },
]

// Выбираем 3–4 ссылки, наиболее релевантные теме статьи
function pickRelevantLinks(topic) {
  const needle = (topic.title + ' ' + (topic.keywords ?? '') + ' ' + topic.category).toLowerCase()
  const scored = INTERNAL_LINKS.map(link => {
    const words = link.label.split(/\s+/)
    const score = words.filter(w => needle.includes(w.replace(/[^а-яё]/gi, ''))).length
    return { ...link, score }
  })
  scored.sort((a, b) => b.score - a.score)
  // Всегда включаем общий каталог + 2–3 тематических
  const top = scored.filter(l => l.score > 0).slice(0, 3)
  if (!top.find(l => l.url === '/shkoly/')) top.unshift(INTERNAL_LINKS[0])
  return top.slice(0, 4)
}

// ─── Промпт для генерации статьи ────────────────────────────────────────────
function buildPrompt(topic) {
  const cityContext = topic.city
    ? `Статья ориентирована на город ${topic.city}. Упоминай конкретные реалии этого города, местные школы, районы где уместно.`
    : 'Статья для общероссийской аудитории. Приводи примеры из разных городов.'

  const relevantLinks = pickRelevantLinks(topic)
  const linksBlock = relevantLinks.map(l =>
    `  <a href="${l.url}">${l.label}</a>`
  ).join('\n')

  return `Ты — SEO-редактор образовательного портала pro-schools.ru. Напиши статью для блога.

ТЕМА: ${topic.title}
КЛЮЧЕВОЙ ЗАПРОС: ${topic.keywords}
КАТЕГОРИЯ: ${topic.category}
${cityContext}

ТРЕБОВАНИЯ К СТАТЬЕ:
1. Объём: 1800–2500 слов (только текст без HTML-тегов). Это жёсткое требование — статья должна быть развёрнутой и подробной.
2. Структура: минимум 5 секций H2, дополнительные H3 где нужно
3. Обязательный блок FAQ в конце: 4 вопроса с развёрнутыми ответами (оберни в <section>)
4. Минимум 2 нумерованных или маркированных списка
5. Используй <strong> для выделения ключевых фактов (3–5 раз)
6. Автор: "Редакция pro-schools.ru", роль: "Аналитический отдел"
7. Ссылки на реальные законы (ФЗ-273), официальные сайты (Минпросвещения, Рособрнадзор, dogm.mos.ru)
8. Конкретные цифры и факты — никаких размытых "примерно", "около" без данных
9. Никаких шаблонных фраз: "важно помнить", "следует отметить", "таким образом"
10. Читаемо, живо, полезно — не академично

ВНУТРЕННИЕ ССЫЛКИ — ОБЯЗАТЕЛЬНО:
Естественно включи 2–3 ссылки из списка ниже в текст статьи (в нужный контекст, не списком):
${linksBlock}
Ссылки должны быть органично вписаны в предложения, не как "нажмите здесь", а как контекстный анкор.

ВЕРНУТЬ СТРОГО JSON (без markdown-обёртки):
{
  "slug": "${topic.slug}",
  "title": "...",
  "excerpt": "...120-160 символов...",
  "category": "${topic.category}",
  "tags": ["тег1", "тег2", "тег3", "тег4", "тег5"],
  "author": "Редакция pro-schools.ru",
  "authorRole": "Аналитический отдел",
  "publishedAt": "${new Date().toISOString().split('T')[0]}",
  "readTime": 10,
  "imageAlt": "...описание изображения...",
  "content": "...полный HTML без markdown..."
}`
}

// ─── Вставить статью в blog.ts ──────────────────────────────────────────────
function insertArticle(article) {
  const content = readFileSync(BLOG_TS, 'utf-8')

  // Экранируем backtick и ${ в строках контента
  const safeContent = article.content
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${')

  const safeExcerpt = article.excerpt.replace(/`/g, '\\`')

  const tagsStr = article.tags.map(t => `'${t.replace(/'/g, "\\'")}'`).join(', ')
  const featuresStr = `['${article.tags.slice(0, 3).join("', '")}']`

  const block = `  {
    slug: '${article.slug}',
    title: '${article.title.replace(/'/g, "\\'")}',
    excerpt: '${safeExcerpt}',
    category: '${article.category}',
    tags: [${tagsStr}],
    author: '${article.author}',
    authorRole: '${article.authorRole}',
    publishedAt: '${article.publishedAt}',
    readTime: ${article.readTime},
    imageAlt: '${(article.imageAlt || '').replace(/'/g, "\\'")}',
    content: \`
${safeContent}
    \`,
  },`

  // Вставляем перед закрывающей ] массива blogPosts
  const newContent = content.replace(
    /(\n\]\s*\nexport function getPostBySlug)/,
    `\n${block}\n]\nexport function getPostBySlug`
  )

  if (newContent === content) {
    throw new Error('Не удалось найти место вставки в blog.ts')
  }

  writeFileSync(BLOG_TS, newContent)
}

// ─── Запуск команд ──────────────────────────────────────────────────────────
function run(cmd, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const [bin, ...cmdArgs] = cmd.split(' ')
    const proc = spawn(bin, cmdArgs, { stdio: 'inherit', cwd: ROOT, shell: true, env: { ...process.env, ...extraEnv } })
    proc.on('close', code => code === 0 ? resolve() : reject(new Error(`Exit ${code}: ${cmd}`)))
  })
}

// ─── Главная функция ─────────────────────────────────────────────────────────
async function main() {
  console.log('\n📝 Генератор статей блога pro-schools.ru')
  console.log('─'.repeat(50))

  const queue = loadQueue()
  const existingSlugs = getExistingSlugs()
  const topics = pickTopics(queue, existingSlugs, COUNT)

  if (topics.length === 0) {
    console.log('✅ Нет новых тем для генерации. Очередь пуста или все статьи уже написаны.')
    return
  }

  console.log(`📋 Выбрано тем: ${topics.length}`)
  topics.forEach(t => console.log(`   • [${t.id}] ${t.title} (${t.freq ?? '?'} запросов/мес)`))

  if (DRY_RUN) {
    console.log('\n🔍 DRY-RUN: файлы не изменяются')
    return
  }

  const generated = []
  const failed = []

  for (const topic of topics) {
    console.log(`\n🤖 Генерирую: ${topic.title}`)

    // Помечаем как "в работе"
    topic.status = 'generating'
    saveQueue(queue)

    try {
      const response = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 12000,
        messages: [{ role: 'user', content: buildPrompt(topic) }],
      })

      // Трекаем расходы
      const inputTokens = response.usage?.input_tokens || 0
      const outputTokens = response.usage?.output_tokens || 0
      const usd = (inputTokens / 1_000_000) * 15 + (outputTokens / 1_000_000) * 75
      try {
        const { execSync } = await import('child_process')
        execSync(`node scripts/cost-tracker.mjs log --type=blog --tokens-in=${inputTokens} --tokens-out=${outputTokens} --usd=${usd.toFixed(6)}`, { cwd: ROOT, stdio: 'pipe' })
      } catch {}

      const rawText = response.content[0].text.trim()

      // Парсим JSON
      let article
      try {
        // Убираем возможные markdown-обёртки
        const jsonStr = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
        article = JSON.parse(jsonStr)
      } catch (e) {
        throw new Error(`Не удалось распарсить JSON: ${e.message}\n\nОтвет:\n${rawText.slice(0, 500)}`)
      }

      // SEO-проверка
      const seo = seoCheck(article, existingSlugs)
      console.log(`   ${seo.summary}`)

      if (seo.warnings.length > 0) {
        seo.warnings.forEach(w => console.log(`   ${w}`))
      }

      if (!seo.passed) {
        console.log(`   ⚠️  SEO не прошёл, но вставляем с предупреждением`)
        seo.errors.forEach(e => console.log(`   ${e}`))
      }

      // Вставляем в blog.ts
      insertArticle(article)
      existingSlugs.push(article.slug)

      topic.status = 'done'
      topic.generatedAt = new Date().toISOString()
      topic.wordCount = seo.wordCount
      topic.seoScore = seo.score
      saveQueue(queue)

      generated.push({ topic, article, seo })
      console.log(`   ✅ Вставлена: /blog/${article.slug}/`)

    } catch (err) {
      console.error(`   ❌ Ошибка: ${err.message}`)
      topic.status = 'error'
      topic.error = err.message.slice(0, 200)
      topic.retryAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      saveQueue(queue)
      failed.push({ topic, err })
    }
  }

  // Итог
  console.log('\n' + '─'.repeat(50))
  console.log(`✅ Сгенерировано: ${generated.length} статей`)
  if (failed.length > 0) {
    console.log(`❌ Ошибок: ${failed.length}`)
  }

  if (generated.length === 0) {
    console.log('Ничего не записано, деплой пропущен.')
    return
  }

  // Коммит
  try {
    execSync(`git -C "${ROOT}" add src/data/blog.ts scripts/blog-topics.json`, { stdio: 'inherit' })
    const titles = generated.map(g => g.article.title).join(', ')
    const msg = `Blog: add ${generated.length} articles\n\n${titles}\n\nCo-Authored-By: Claude Opus 4 <noreply@anthropic.com>`
    execSync(`git -C "${ROOT}" commit -m '${msg.replace(/'/g, "'\\''")}' `, { stdio: 'inherit' })
    console.log('📦 Git commit сделан')
  } catch (e) {
    console.warn('⚠️  Git commit не удался:', e.message)
  }

  // Деплой
  if (!NO_DEPLOY) {
    console.log('🚀 Деплоим на Vercel...')
    try {
      await run('vercel --prod --yes', VERCEL_ENV)
      console.log('✅ Задеплоено!')
    } catch (e) {
      console.error('❌ Деплой не удался:', e.message)
    }
  }

  // Обновляем мету очереди
  queue.meta.generated = queue.topics.filter(t => t.status === 'done').length
  queue.meta.totalTopics = queue.topics.length
  queue.meta.lastRun = new Date().toISOString()
  saveQueue(queue)

  console.log(`\n📊 Статистика очереди: ${queue.meta.generated}/${queue.meta.totalTopics} тем написано`)
  console.log('─'.repeat(50))
}

main().catch(e => {
  console.error('💥 Критическая ошибка:', e)
  process.exit(1)
})
