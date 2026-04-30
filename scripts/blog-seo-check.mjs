/**
 * SEO-валидатор для статей блога pro-schools.ru
 * Проверяет: длину, структуру, FAQ, дубли, спам
 */

export function seoCheck(article, existingSlugs = []) {
  const errors = []
  const warnings = []

  const { slug, title, content, excerpt, tags } = article

  // 1. Дубль slug
  if (existingSlugs.includes(slug)) {
    errors.push(`❌ Дубль slug: ${slug}`)
  }

  // 2. Длина контента (считаем слова по тексту без тегов)
  const textOnly = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const wordCount = textOnly.split(' ').filter(w => w.length > 2).length
  if (wordCount < 1200) {
    errors.push(`❌ Слишком короткая статья: ${wordCount} слов (минимум 1200)`)
  } else if (wordCount < 1500) {
    warnings.push(`⚠️  Желательно больше: ${wordCount} слов (рекомендуется 1500+)`)
  }

  // 3. Структура заголовков
  const h2count = (content.match(/<h2/g) || []).length
  const h3count = (content.match(/<h3/g) || []).length
  if (h2count < 3) {
    errors.push(`❌ Мало H2: ${h2count} (нужно минимум 3)`)
  }
  if (h2count + h3count < 5) {
    warnings.push(`⚠️  Мало подзаголовков: ${h2count + h3count} (рекомендуется 5+)`)
  }

  // 4. FAQ-блок
  if (!content.includes('<section>') && !content.includes('Частые вопрос') && !content.includes('FAQ')) {
    warnings.push('⚠️  Нет FAQ-блока (снижает шансы на rich snippets)')
  }

  // 5. Списки (ul/ol)
  const listCount = (content.match(/<[uo]l/g) || []).length
  if (listCount < 2) {
    warnings.push(`⚠️  Мало списков: ${listCount} (рекомендуется 2+)`)
  }

  // 6. Заголовок статьи
  if (!title || title.length < 30) {
    errors.push(`❌ Слишком короткий title: "${title}"`)
  }
  if (title && title.length > 80) {
    warnings.push(`⚠️  Title длинный (${title.length} символов), может обрезаться в выдаче`)
  }

  // 7. Excerpt
  if (!excerpt || excerpt.length < 80) {
    errors.push(`❌ Слишком короткий excerpt: "${excerpt}"`)
  }
  if (excerpt && excerpt.length > 200) {
    warnings.push(`⚠️  Excerpt длинный (${excerpt.length} символов)`)
  }

  // 8. Теги
  if (!tags || tags.length < 3) {
    warnings.push(`⚠️  Мало тегов: ${tags?.length ?? 0} (рекомендуется 4-6)`)
  }

  // 9. Водность — детектируем шаблонные фразы
  const waterPhrases = [
    'важно помнить', 'не забывайте', 'следует отметить',
    'необходимо учитывать', 'таким образом', 'в заключение',
    'подводя итог', 'хочется отметить',
  ]
  const textLower = textOnly.toLowerCase()
  const waterFound = waterPhrases.filter(p => textLower.includes(p))
  if (waterFound.length > 2) {
    warnings.push(`⚠️  Водность: найдены фразы-маркеры: ${waterFound.join(', ')}`)
  }

  // 10. Наличие strong/em (разметка для читаемости)
  const strongCount = (content.match(/<strong/g) || []).length
  if (strongCount < 3) {
    warnings.push(`⚠️  Мало выделений <strong>: ${strongCount} (рекомендуется 3+)`)
  }

  // Результат
  const passed = errors.length === 0
  const score = Math.max(0, 100
    - errors.length * 20
    - warnings.length * 5
  )

  return {
    passed,
    score,
    wordCount,
    errors,
    warnings,
    summary: passed
      ? `✅ SEO OK (${score}/100, ${wordCount} слов)`
      : `❌ SEO FAIL (${score}/100): ${errors.join('; ')}`,
  }
}
