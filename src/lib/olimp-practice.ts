import type { PracticeBlock, PracticeItem } from '@/components/OlimpPractice'

const HEADER = /(?:\s*\d{0,2}\s*)?Всероссийская олимпиада школьников\. Английский язык\. 2026–2027 уч\. г\. Школьный этап\. 9–11 классы/g

function clean(text: string): string {
  return text.replace(HEADER, ' ').replace(/\s+\d{1,2}\s*$/g, '').replace(/\s+/g, ' ').trim()
}

function takeSection(text: string, marker: string): [string, string] {
  const at = text.indexOf(marker)
  return at < 0 ? [text, ''] : [text.slice(0, at).trim(), text.slice(at).trim()]
}

function parseOptions(text: string): { prompt: string; options?: { letter: string; text: string }[] } {
  const matches = [...text.matchAll(/(?:^|\s)([A-D])\)\s/g)]
  if (matches.length < 3 || matches[0][1] !== 'A') return { prompt: text }
  const options = matches.map((match, i) => ({
    letter: match[1],
    text: text.slice(match.index! + match[0].length, i + 1 < matches.length ? matches[i + 1].index : text.length).trim(),
  }))
  if (options.some((option, i) => option.letter !== 'ABCD'[i])) return { prompt: text }
  return { prompt: text.slice(0, matches[0].index).trim(), options }
}

// The Moscow English 9–11 paper has numbered questions but pdftotext merges
// whole pages. Parse only this verified format; other papers keep their source text.
export function parseEnglishSchool2026(paras: string[]): PracticeBlock[] | null {
  const source = clean(paras.join(' '))
  const markers = [...source.matchAll(/Задание\s+(\d+)\./g)]
  if (markers.length !== 34 || markers.some((m, i) => Number(m[1]) !== i + 1)) return null
  const raw = markers.map((m, i) => source.slice(m.index! + m[0].length, i + 1 < markers.length ? markers[i + 1].index : source.length).trim())
  const [six, secondListen] = takeSection(raw[5], 'Listen to the text for the second time')
  raw[5] = six
  const [fifteen, reading] = takeSection(raw[14], 'READING Time:')
  raw[14] = fifteen
  const [twentyFive, useEnglish] = takeSection(raw[24], 'USE OF ENGLISH Time:')
  raw[24] = twentyFive
  const [twentyEight, taskFour] = takeSection(raw[27], 'Task 4 (6 points)')
  raw[27] = twentyEight

  const items: PracticeItem[] = raw.map((text, i) => {
    const number = i + 1
    if (number <= 25) return { number, ...parseOptions(text) }
    if (number === 26) return { number, prompt: text, fields: 8 }
    if (number === 27) return { number, prompt: text, fields: 6 }
    if (number === 28) return { number, prompt: text, fields: 5 }
    const formatted = text.replace(/\s([ABC])\)\s/g, '\n$1) ')
    return { number, prompt: formatted }
  })
  if (items.slice(0, 25).some(item => !item.options)) return null
  const firstIntro = source.slice(0, markers[0].index).replace(/^ВСЕРОССИЙСКАЯ ОЛИМПИАДА ШКОЛЬНИКОВ.*?Максимальный балл за работу\s*–\s*50\./, '').trim()
  return [
    { title: 'Аудирование · задания 1–6', intro: firstIntro, items: items.slice(0, 6) },
    { title: 'Аудирование · задания 7–15', intro: secondListen, items: items.slice(6, 15) },
    { title: 'Чтение · задания 16–25', intro: reading, items: items.slice(15, 25) },
    { title: 'Лексика и грамматика · задания 26–28', intro: useEnglish, items: items.slice(25, 28) },
    { title: 'Одно слово для трёх предложений · задания 29–34', intro: taskFour, items: items.slice(28) },
  ]
}
