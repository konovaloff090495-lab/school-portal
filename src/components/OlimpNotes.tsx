'use client'

import { useEffect, useState } from 'react'

export default function OlimpNotes({ paperId, hasPdf }: { paperId: string; hasPdf: boolean }) {
  const key = `olimp-notes:${paperId}`
  const [value, setValue] = useState('')
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { setValue(localStorage.getItem(key) || '') } catch { /* storage unavailable */ }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [key])

  function change(next: string) {
    setValue(next)
    try { localStorage.setItem(key, next) } catch { /* storage unavailable */ }
  }

  return <section className="ol-text ol-notes" id="zadaniya">
    <h2>Мои ответы</h2>
    <p>{hasPdf ? 'Откройте оригинал заданий в PDF выше' : 'Откройте файлы заданий по ссылкам выше'} и записывайте решения здесь. Текст сохранится в этом браузере.</p>
    <label htmlFor={`notes-${paperId}`} className="sr-only">Ваши ответы на задания</label>
    <textarea id={`notes-${paperId}`} rows={10} placeholder={'1. …\n2. …'} value={value} onChange={event => change(event.target.value)} />
  </section>
}
