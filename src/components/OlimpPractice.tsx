'use client'

import { useEffect, useState } from 'react'

export interface PracticeItem {
  id?: string
  number: number
  title?: string
  prompt: string
  options?: { letter: string; text: string }[]
  multiple?: boolean
  fields?: number
  fieldHints?: string[]
  requiresPdf?: boolean
}
export interface PracticeBlock {
  title: string
  intro?: string
  items: PracticeItem[]
}

export default function OlimpPractice({ paperId, blocks, sourceUrl }: { paperId: string; blocks: PracticeBlock[]; sourceUrl?: string }) {
  const storageKey = `olimp-practice:${paperId}`
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { setAnswers(JSON.parse(localStorage.getItem(storageKey) || '{}')) } catch { /* private mode */ }
      setReady(true)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [storageKey])

  function save(key: string, value: string) {
    const next = { ...answers, [key]: value }
    setAnswers(next)
    try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch { /* storage unavailable */ }
  }

  const total = blocks.reduce((n, block) => n + block.items.reduce((m, item) => m + (item.fields || 1), 0), 0)
  const done = Object.values(answers).filter(Boolean).length

  return <div className="ol-practice">
    <div className="ol-practice-top">
      <div><h2>Решить задания онлайн</h2><p>Выбирайте варианты и вписывайте ответы. Они сохраняются в этом браузере.</p></div>
      <span className="ol-progress">{ready ? done : 0} из {total}</span>
    </div>
    {blocks.map((block, blockIndex) => <section key={block.title} className="ol-practice-block">
      <h3>{block.title}</h3>
      {block.intro && <div className="ol-practice-intro">{block.intro}</div>}
      {block.items.map(item => {
        const key = item.id ?? String(item.number)
        const selected = answers[key]?.split(',') ?? []
        return <article className="ol-question" key={key} id={`task-${key}`}>
        <h4>{item.title ?? `Задание ${item.number}`}</h4>
        <p className="ol-question-prompt">{item.prompt}</p>
        {item.requiresPdf && sourceUrl && <p className="ol-question-source"><a href={sourceUrl} target="_blank" rel="noopener">Сверить задание с оригиналом PDF ↗</a></p>}
        {item.options ? <fieldset>
          <legend className="sr-only">Ответ на задание {item.number}</legend>
          {item.options.map(option => <label key={option.letter} className={selected.includes(option.letter) ? 'selected' : ''}>
            <input type={item.multiple ? 'checkbox' : 'radio'} name={`ol-${paperId}-${key}`} value={option.letter} checked={selected.includes(option.letter)} onChange={() => save(key, item.multiple ? (selected.includes(option.letter) ? selected.filter(x => x !== option.letter) : [...selected, option.letter]).join(',') : option.letter)} />
            <b>{option.letter}</b><span>{option.text}</span>
          </label>)}
        </fieldset> : item.fields ? <div className="ol-answer-grid">
          {Array.from({ length: item.fields }, (_, i) => <label key={i}>{i + 1}{item.fieldHints?.[i] ? ` · ${item.fieldHints[i]}` : ''}
            <input type="text" autoComplete="off" value={answers[`${key}-${i + 1}`] || ''} onChange={e => save(`${key}-${i + 1}`, e.target.value)} aria-label={`Задание ${item.number}, ответ ${i + 1}`} />
          </label>)}
        </div> : <label className="ol-answer-line">Ваш ответ
          {item.prompt.length > 500 || /объясните|обоснуйте|докажите|напишите|рассуждени|сочинени|write an essay|explain why/i.test(item.prompt) ?
            <textarea rows={4} value={answers[key] || ''} onChange={e => save(key, e.target.value)} /> :
            <input type="text" autoComplete="off" value={answers[key] || ''} onChange={e => save(key, e.target.value)} />}
        </label>}
      </article>})}
      {blockIndex < blocks.length - 1 && <div className="ol-block-end">Продолжайте ниже ↓</div>}
    </section>)}
    <p className="ol-practice-foot">После выполнения откройте «Ответы и решения» ниже и сверьте свою работу с официальным PDF.{sourceUrl && <> Если в задании есть рисунок, таблица или формула, <a href={sourceUrl} target="_blank" rel="noopener">сверяйтесь с оригиналом ↗</a>.</>}</p>
  </div>
}
