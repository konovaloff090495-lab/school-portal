// Генерация страниц «Подготовка к олимпиаде по {предмет}» → src/data/olimp/prep.json
// Грунт: реальные тексты заданий из архива (школьный + региональный этап последнего года),
// чтобы структура и типы заданий описывались по факту, а не из головы.
import fs from 'node:fs'
import path from 'node:path'
import Anthropic from '@anthropic-ai/sdk'
const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '../..')
const DIR = path.join(ROOT, 'src/data/olimp')
const OUT = path.join(DIR, 'prep.json')
const index = JSON.parse(fs.readFileSync(path.join(DIR, 'index.json'), 'utf8'))
// ключ — из .env.local проекта (в окружении его нет)
for (const line of fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^ANTHROPIC_API_KEY=(.+)$/); if (m) process.env.ANTHROPIC_API_KEY = m[1].trim()
}
const client = new Anthropic()
const prep = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {}

function sample(subject) {
  const ps = index.papers.filter(p => p.subject === subject).sort((a, b) => b.year.localeCompare(a.year))
  const pick = []
  for (const stage of ['shkolnyj-etap', 'municipalnyj-etap', 'regionalnyj-etap']) {
    const p = ps.find(x => x.stage === stage && x.textChars > 1500)
    if (p) pick.push(p)
  }
  return pick.map(p => {
    const t = JSON.parse(fs.readFileSync(path.join(DIR, 'papers', p.id + '.json'), 'utf8'))
    const txt = t.tasks.flatMap(x => x.paras).join('\n').slice(0, 3500)
    return `### ${p.stageName}, ${p.classLabel}, ${p.yearLabel}\n${txt}`
  }).join('\n\n')
}

const only = process.argv.slice(2)
for (const s of index.subjects) {
  if (only.length && !only.includes(s.slug)) continue
  if (prep[s.slug]) continue
  const n = index.papers.filter(p => p.subject === s.slug).length
  if (!n) continue
  const classes = [...new Set(index.papers.filter(p => p.subject === s.slug).flatMap(p => p.classes))].sort((a, b) => a - b)
  const prompt = `Ты методист, готовишь школьников к Всероссийской олимпиаде школьников (ВсОШ) по предмету «${s.name}». Напиши для сайта pro-schools.ru материал «Подготовка к олимпиаде по ${s.dat}» — практический, конкретный, без воды и без общих фраз про «важность образования».

Ниже — фрагменты реальных заданий ВсОШ по этому предмету из нашего архива. Опирайся на них, описывая формат и типы заданий (не выдумывай форматов, которых там нет; если фрагментов мало — говори об общеизвестной структуре ВсОШ по этому предмету).

${sample(s.slug)}

Классы, по которым есть задания в архиве: ${classes.join(', ')}.

Верни строго JSON без markdown-обёртки:
{
 "lede": "2–3 предложения: чем олимпиада по этому предмету отличается от контрольной и что реально проверяют (80–120 слов)",
 "sections": [
   {"h2": "Как устроена олимпиада по ${s.dat}", "html": "<p>…</p>… — этапы, с какого класса, формат (сколько заданий, сколько времени, письменные/устные/практические туры, если есть), сколько баллов; 120–180 слов"},
   {"h2": "Какие задания встречаются", "html": "<ul><li><b>Тип задания</b> — что проверяет, пример из реальных комплектов (перескажи своими словами, без копирования)</li>…</ul> 5–8 типов; 180–260 слов"},
   {"h2": "Темы по классам", "html": "<ul><li><b>4–6 классы</b> …</li><li><b>7–8 классы</b> …</li><li><b>9–11 классы</b> …</li></ul> — конкретные темы и умения; 150–220 слов (если предмет только со старших классов — начинай с них)"},
   {"h2": "План подготовки", "html": "<ol><li>…</li></ol> 5–7 шагов с привязкой к нашим ресурсам: комплекты прошлых лет (ссылка /olimpiady/${s.slug}/), критерии оценивания, разбор ошибок; 150–200 слов"},
   {"h2": "Книги, задачники и ресурсы", "html": "<ul><li>…</li></ul> — 5–8 реально существующих источников (авторы/названия; для языков — уровни и форматы), без ссылок на сторонние сайты кроме официальных (olimpiada.ru, siriusolymp.ru); 100–150 слов"},
   {"h2": "Типичные ошибки", "html": "<ul><li>…</li></ul> 5–6 пунктов; 100–140 слов"}
 ],
 "faq": [ {"q": "…", "a": "…"}, … 4 вопроса: с какого класса участвовать, сколько времени на подготовку, что дают дипломы по этому предмету, нужен ли репетитор — ответы по 40–70 слов ]
}
Язык — русский, тон — спокойный и практичный, обращение на «вы». Не упоминай, что ты ИИ. Не пиши «в этой статье». Не ставь кавычки-«лапки» внутри строк JSON без экранирования.`
  process.stdout.write(`${s.slug} … `)
  try {
    const r = await client.messages.create({ model: 'claude-sonnet-5', max_tokens: 6000, messages: [{ role: 'user', content: prompt }] })
    let txt = r.content[0].text.trim().replace(/^```json\s*|```$/g, '')
    const j = JSON.parse(txt)
    prep[s.slug] = { ...j, updated: new Date().toISOString().slice(0, 10) }
    fs.writeFileSync(OUT, JSON.stringify(prep, null, 1))
    console.log('ok', r.usage.output_tokens)
  } catch (e) { console.log('ERR', e.message.slice(0, 200)) }
}
