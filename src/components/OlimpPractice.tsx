'use client'

import { useEffect, useState } from 'react'

export interface PracticeItem {
  number: number
  prompt: string
  options?: { letter: string; text: string }[]
  fields?: number
}
export interface PracticeBlock {
  title: string
  intro?: string
  items: PracticeItem[]
}

export default function OlimpPractice({ paperId, blocks }: { paperId: string; blocks: PracticeBlock[] }) {
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
      {block.items.map(item => <article className="ol-question" key={item.number} id={`task-${item.number}`}>
        <h4>Задание {item.number}</h4>
        <p className="ol-question-prompt">{item.prompt}</p>
        {item.options ? <fieldset>
          <legend className="sr-only">Ответ на задание {item.number}</legend>
          {item.options.map(option => <label key={option.letter} className={answers[String(item.number)] === option.letter ? 'selected' : ''}>
            <input type="radio" name={`ol-${paperId}-${item.number}`} value={option.letter} checked={answers[String(item.number)] === option.letter} onChange={() => save(String(item.number), option.letter)} />
            <b>{option.letter}</b><span>{option.text}</span>
          </label>)}
        </fieldset> : item.fields ? <div className="ol-answer-grid">
          {Array.from({ length: item.fields }, (_, i) => <label key={i}>{i + 1}
            <input type="text" autoComplete="off" value={answers[`${item.number}-${i + 1}`] || ''} onChange={e => save(`${item.number}-${i + 1}`, e.target.value)} aria-label={`Задание ${item.number}, ответ ${i + 1}`} />
          </label>)}
        </div> : <label className="ol-answer-line">Ваш ответ
          <input type="text" autoComplete="off" value={answers[String(item.number)] || ''} onChange={e => save(String(item.number), e.target.value)} />
        </label>}
      </article>)}
      {blockIndex < blocks.length - 1 && <div className="ol-block-end">Продолжайте ниже ↓</div>}
    </section>)}
    <p className="ol-practice-foot">После выполнения откройте «Ответы и решения» ниже и сверьте свою работу с официальным PDF.</p>
  </div>
}
