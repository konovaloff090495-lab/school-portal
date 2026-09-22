import Link from 'next/link'
import type { ReactNode } from 'react'
import { type Exam, type SiteSubject, type ExamDoc, docsFor, docPath } from '@/data/exam'

/**
 * Читаемый вид для текста, вытащенного pdftotext из документов ФИПИ.
 *
 * Проблемы сырого текста: нумерованные разделы спецификации склеены в один абзац
 * («8. Продолжительность экзамена На выполнение…»), из таблиц остаются обломки
 * (коды «10 класс: 111.8.4.1», одиночные числа). Здесь:
 *  1) режем абзацы на разделы по заголовкам «N. Название» и выводим их как <h3>;
 *  2) выбрасываем мусор таблиц;
 *  3) расставляем внутренние ссылки: «задание 13» → разбор задания (если есть),
 *     «кодификатор / демоверсия / спецификация» → документ того же года.
 */

// Заголовок раздела: «8. Продолжительность экзамена»; тянется до первого слова с Заглавной
// (кроме аббревиатур КИМ/ЕГЭ/ОГЭ/…), где начинается следующее предложение.
const HEAD_RX = /(?:^|\s)(\d{1,2}\.|Раздел \d+\.)\s+((?:[А-ЯЁ][а-яё]+|[А-ЯЁ]{2,}(?:-\d+)?)(?:[ ,]+(?:\(?(?:[а-яё]+|[А-ЯЁ]{2,}(?:-\d+)?|\d{4}\s*(?:г\.|года)|№\s*\d+)\)?,?|[–-]))*)(?=\s[А-ЯЁ](?:[а-яё]|\s)|\s\d{1,2}[.)]\s|\s*$)/g
const SUBHEAD_RX = /^(Таблица \d+|Приложение(?: \d+)?|Часть [12]|Обобщённый план варианта КИМ.*|Обобщенный план варианта КИМ.*)$/
const CODE_RX = /(?:\d{1,2}\s*)?класс:\s*[\d.;\s]+/g

function isJunk(p: string): boolean {
  if (p.length < 4) return true
  if (/^\d+([ ,.]\d+)*$/.test(p)) return true                       // одни числа
  const rest = p.replace(CODE_RX, '').replace(/[\d.;:,\s–-]+/g, '').trim()
  if (rest.length < 6 && /класс:/.test(p)) return true              // строка кодов кодификатора
  if (/^(КолиМакси|Процент максимального первичного балла|Максимальный первичный балл|Количество заданий)$/.test(p)) return true
  if (/^(Спецификация|Кодификатор|Демонстрационный вариант) КИМ (ЕГЭ|ОГЭ) \d{4} г\.?\s*(№ задания \d+)?$/.test(p)) return true   // колонтитул
  if (/^Проверяемый элемент содержания в школьной программе/.test(p) && p.replace(CODE_RX, '').length < 140) return true // шапка таблицы
  if (/^№ задания \d+$/.test(p)) return true
  return false
}

/** Разбивает абзац на [заголовок?, текст] блоки. */
function splitSections(p: string): { head?: string; text: string }[] {
  const out: { head?: string; text: string }[] = []
  let last = 0; let pendingHead: string | undefined
  for (const m of p.matchAll(HEAD_RX)) {
    const idx = m.index ?? 0
    const before = p.slice(last, idx).trim()
    if (before) out.push({ head: pendingHead, text: before })
    else if (pendingHead) out.push({ head: pendingHead, text: '' })
    pendingHead = `${m[1]} ${m[2].trim()}`
    last = idx + m[0].length
  }
  const tail = p.slice(last).trim()
  if (tail || pendingHead) out.push({ head: pendingHead, text: tail })
  return out.length ? out : [{ text: p }]
}

export interface LinkCtx {
  exam: Exam
  s: SiteSubject
  year: number | null
  self: ExamDoc | null
}

function linkTargets(ctx: LinkCtx) {
  const byKind = (k: ExamDoc['kind']) => {
    const docs = docsFor(ctx.exam, ctx.s, k)
    const d = docs.find(x => x.year === ctx.year) ?? docs[0]
    return d && d.id !== ctx.self?.id ? docPath(d) : null
  }
  const tasks = new Map<number, string>()
  for (const t of ctx.s.tasks?.tasks ?? []) tasks.set(t.number, `/${ctx.exam}/${ctx.s.slug}/${t.slug}/`)
  return { codif: byKind('codif'), demo: byKind('demo'), spec: byKind('spec'), tasks }
}

const TOKEN_RX = /(?<!№\s)(кодификатор[а-яё]*|демонстрационн[а-яё]+ вариант[а-яё]*|демоверси[а-яё]+|спецификаци[а-яё]+|задани[а-яё]+ (\d{1,2})(?![\d,.–-]))/gi

/** Абзац → ReactNode с внутренними ссылками (каждый адрес — не чаще `limit` раз на страницу). */
function linkify(text: string, t: ReturnType<typeof linkTargets>, used: Map<string, number>, limit: number): ReactNode[] {
  const nodes: ReactNode[] = []
  let last = 0; let k = 0
  for (const m of text.matchAll(TOKEN_RX)) {
    const idx = m.index ?? 0
    const word = m[1]; const low = word.toLowerCase()
    let href: string | null = null
    if (low.startsWith('кодификатор')) href = t.codif
    else if (low.startsWith('демо')) href = t.demo
    else if (low.startsWith('спецификац')) href = t.spec
    else if (m[2]) href = t.tasks.get(Number(m[2])) ?? null
    if (!href || (used.get(href) ?? 0) >= limit) continue
    used.set(href, (used.get(href) ?? 0) + 1)
    nodes.push(text.slice(last, idx))
    nodes.push(<Link key={k++} href={href} className="ex-ilink">{word}</Link>)
    last = idx + m[0].length
  }
  nodes.push(text.slice(last))
  return nodes
}

/** Готовые блоки для рендера: заголовки разделов + абзацы со ссылками. */
export function renderDocText(paras: string[], ctx: LinkCtx, opts: { link?: boolean; keyPrefix?: string } = {}): ReactNode[] {
  const t = linkTargets(ctx)
  const used = new Map<string, number>()
  const out: ReactNode[] = []
  let i = 0
  const key = (s: string) => `${opts.keyPrefix ?? 'p'}-${s}-${i++}`
  for (const raw of paras) {
    const p = raw.replace(/\s+/g, ' ').trim()
    if (isJunk(p)) continue
    if (SUBHEAD_RX.test(p)) { out.push(<h4 key={key('sh')}>{p}</h4>); continue }
    for (const sec of splitSections(p)) {
      if (sec.head) out.push(<h3 key={key('h')}>{sec.head}</h3>)
      const text = sec.text.replace(CODE_RX, '').replace(/\s{2,}/g, ' ').trim()
      if (!text || isJunk(text)) continue
      // список «1. … 2. …» внутри раздела «Изменения» и т.п. — по пунктам
      const items = /^1[.)]\s/.test(text) ? text.split(/\s(?=\d{1,2}[.)]\s[А-ЯЁ])/).map(x => x.trim()).filter(Boolean) : [text]
      if (items.length >= 2 && items.every(x => x.length < 900)) {
        out.push(<ul key={key('ul')}>{items.map((it, j) => <li key={j}>{opts.link === false ? it : linkify(it, t, used, 3)}</li>)}</ul>)
      } else {
        out.push(<p key={key('p')}>{opts.link === false ? text : linkify(text, t, used, 3)}</p>)
      }
    }
  }
  return out
}
