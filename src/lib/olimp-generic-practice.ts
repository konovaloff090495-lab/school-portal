import type { PracticeBlock, PracticeItem } from '@/components/OlimpPractice'
import type { OlimpPaperText } from '@/data/olimp'

type TaskPart = OlimpPaperText['tasks'][number]
type Marker = { number: number; start: number; end: number; label: string }

const STYLES = [
  /(?<![\p{L}\p{N}])(Задани[ея]\s+(\d{1,3})(?:\.|\s*\)|\s+(?=[А-ЯЁA-Z])))/giu,
  /(?<![\p{L}\p{N}])(Задач[аеи]\s+(\d{1,3})(?:\.|\s*\)|\s+(?=[А-ЯЁA-Z])))/giu,
  /(?<!\w)(№\s*(\d{1,3})(?:\.|\s))/gu,
  /(?<![\d.,])((\d{1,2})\.\s+(?=[А-ЯЁA-Z]))/gu,
]

function normalizeParts(paras: string[]): string {
  const frequency = new Map<string, number>()
  for (const para of paras) frequency.set(para.trim(), (frequency.get(para.trim()) || 0) + 1)
  return paras
    .map(para => para.trim())
    .filter(para => para.length > 1 && !(/^\d{1,2}$/.test(para)) &&
      !(frequency.get(para)! > 1 && para.length < 260 && /Всероссийская олимпиада школьников|Школьный этап|Муниципальный этап|Региональный этап|Заключительный этап/i.test(para)))
    .join('\n\n')
    .replace(/[ \t]+/g, ' ')
}

function markerCandidates(text: string, pattern: RegExp): Marker[] {
  return [...text.matchAll(pattern)].map(match => ({
    number: Number(match[2]), start: match.index!, end: match.index! + match[0].length,
    label: match[1].trim(),
  })).filter(m => m.number > 0 && m.number < 200)
}

function sequence(candidates: Marker[]): Marker[] {
  const result: Marker[] = []
  for (const marker of candidates) {
    const previous = result[result.length - 1]
    if (!previous) {
      if (marker.number <= 11) result.push(marker)
    } else if (marker.number === previous.number + 1) {
      result.push(marker)
    } else if (marker.number === 1 && result.length >= 3 && marker.start - previous.start > 250) {
      result.push(marker)
    }
  }
  return result
}

function detectMarkers(text: string): { markers: Marker[]; style: number } {
  const byStyle = STYLES.map(style => sequence(markerCandidates(text, style)))
  // Named tasks win ties: plain numbers often also mark lists inside a task.
  const ranked = byStyle.map((markers, index) => ({ markers, index }))
    .sort((a, b) => b.markers.length - a.markers.length || a.index - b.index)
  const best = ranked[0]
  if (best.markers.length < 3 || (best.index === 3 && best.markers.length < 4)) return { markers: [], style: best.index }
  return { markers: best.markers, style: best.index }
}

const OPTION_STYLES = [
  /(?:^|\s)([A-D])\)\s/gu,
  /(?:^|\s)([А-Г])\)\s/gu,
  /(?:^|\s)([a-d])\)\s/gu,
  /(?:^|\s)([а-г])\)\s/gu,
  /(?:^|\s)([A-D])\.\s/gu,
  /(?:^|\s)([А-Г])\.\s/gu,
  /(?:^|\s)([а-г])\.\s/gu,
]

function parseOptions(text: string): Pick<PracticeItem, 'prompt' | 'options' | 'multiple' | 'requiresPdf'> {
  const complex = /_{3,}|\b(?:выберите\s+(?:все|два|две|три|несколько)|укажите\s+(?:все|два|две|три|несколько)|соотнесите|сопоставьте|установите\s+соответствие|заполните\s+пропуски|вставьте\s+пропущенн|select\s+(?:all|two|three|multiple)|match\s+the|fill\s+in\s+the\s+gaps)\b/i.test(text)
  const hasVisual = /\b(?:рисунк[аеуио]|карт[еуыа]|схем[еыуоа]|таблиц[еыуоа]|диаграмм[еыуоа]|фотографи[яюие]|изображени[еяю]|картин[еыуоа])\b/i.test(text)
  const needsPdf = complex || hasVisual || text.length > 1800
  if (needsPdf) return { prompt: text.length > 950 ? `${text.slice(0, 800).trimEnd()}…` : text, requiresPdf: true }
  for (const style of OPTION_STYLES) {
    const matches = [...text.matchAll(style)]
    if (matches.length < 3 || matches.length > 4) continue
    const letters = matches.map(m => m[1])
    const alphabet = 'ABCDАБВГabcdабвг'
    if (letters.some((letter, i) => alphabet.indexOf(letter) !== alphabet.indexOf(letters[0]) + i)) continue
    const stem = text.slice(0, matches[0].index).trim()
    if (!stem || stem.length > 1200) continue
    const options = matches.map((match, i) => ({
      letter: match[1].toUpperCase(),
      text: text.slice(match.index! + match[0].length, i + 1 < matches.length ? matches[i + 1].index : text.length).trim(),
    }))
    if (options.some(option => !option.text || option.text.length > 500 || /(?:^|\s)Ответ\s*:/i.test(option.text))) continue
    // A fifth option is often swallowed by the final extracted PDF paragraph.
    if (/[\s\n](?:E|Д|Е|д|е|e)[).]\s/u.test(options[options.length - 1].text)) continue
    return {
      prompt: stem,
      options,
      requiresPdf: true,
    }
  }
  return { prompt: text.replace(/\s([A-EА-Еа-е])\)\s/g, '\n$1) ').replace(/\s+[•]\s+/g, '\n• '), requiresPdf: true }
}

export function parseGenericPaper(parts: TaskPart[]): PracticeBlock[] | null {
  const blocks: PracticeBlock[] = []
  let recognized = 0
  for (const [partIndex, part] of parts.entries()) {
    const source = normalizeParts(part.paras)
    if (source.length < 200) continue
    const { markers, style } = detectMarkers(source)
    if (!markers.length) continue
    const intro = source.slice(0, markers[0].start).trim()
    if (markers[0].number > 2 && intro.length > 3000) continue
    if (style === 3 && (source.match(/\d+\.\d+\./g) || []).length > markers.length) continue
    // PDF columns can extract a row of bullets before all option texts.
    if (/[•](?:\s*[•]){2,}/.test(source)) continue
    const items: PracticeItem[] = markers.map((marker, i) => {
      const body = source.slice(marker.end, i + 1 < markers.length ? markers[i + 1].start : source.length).trim()
      const parsed = parseOptions(body)
      return {
        id: `${partIndex}-${i}`, number: marker.number, title: `Задание ${marker.number}`,
        ...parsed,
      }
    }).filter(item => item.prompt.length > 10)
    if (items.length < 3 || items.filter(item => item.prompt.length < 25).length > items.length * .2) continue
    recognized += items.length
    blocks.push({ title: part.label ? `${part.group} — ${part.label}` : part.group, intro, items })
  }
  const items = blocks.flatMap(block => block.items)
  const choiceCount = items.filter(item => item.options).length
  // Dense question sheets with diagrams, tables or damaged PDF extraction stay in the PDF viewer.
  return recognized >= 5 && choiceCount >= 4 && choiceCount / items.length >= .75 ? blocks : null
}
