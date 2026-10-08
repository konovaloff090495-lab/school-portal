'use client'

import { useState } from 'react'
import type { PracticeQuestion } from '@/data/textbook-practice'

const METRIKA_ID = 108789843

export default function TextbookPractice({ questions, topicKey }: { questions: PracticeQuestion[]; topicKey: string }) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null))
  const answered = answers.filter(answer => answer !== null).length
  const correct = answers.filter((answer, index) => answer === questions[index].correct).length

  function select(questionIndex: number, optionIndex: number) {
    if (answers[questionIndex] !== null) return
    const next = [...answers]
    next[questionIndex] = optionIndex
    setAnswers(next)
    if (answered === 0) window.ym?.(METRIKA_ID, 'reachGoal', 'textbook_practice_start', { topic: topicKey })
    if (answered + 1 === questions.length) {
      window.ym?.(METRIKA_ID, 'reachGoal', 'textbook_practice_complete', { topic: topicKey })
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-8 mb-6" aria-labelledby="practice-title">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">Проверьте себя</p>
          <h2 id="practice-title" className="text-xl font-bold text-[#0F172A]">Задания по этой теме</h2>
          <p className="text-sm text-gray-600 mt-1">Выберите ответ — сразу покажем результат и объяснение.</p>
        </div>
        <span className="text-sm font-semibold text-gray-600 bg-gray-100 rounded-full px-3 py-1.5" aria-live="polite">{answered} из {questions.length}</span>
      </div>

      <div className="space-y-7">
        {questions.map((item, questionIndex) => {
          const selected = answers[questionIndex]
          const done = selected !== null
          const isCorrect = selected === item.correct
          return (
            <fieldset key={item.question} className="border-t border-gray-100 pt-6 first:border-0 first:pt-0">
              <legend className="text-base font-semibold text-gray-900 mb-3">{questionIndex + 1}. {item.question}</legend>
              <div className="grid gap-2">
                {item.options.map((option, optionIndex) => {
                  const chosen = selected === optionIndex
                  const right = done && optionIndex === item.correct
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={done}
                      onClick={() => select(questionIndex, optionIndex)}
                      aria-pressed={chosen}
                      className={`w-full text-left min-h-11 rounded-xl border px-4 py-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${right ? 'bg-green-50 border-green-500 text-green-900' : chosen ? 'bg-rose-50 border-rose-400 text-rose-900' : 'bg-white border-gray-200 text-gray-800 hover:border-blue-400'} ${done ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <span className="font-semibold mr-2">{String.fromCharCode(1040 + optionIndex)}.</span>{option}
                      {right && <span className="float-right font-bold" aria-hidden="true">✓</span>}
                    </button>
                  )
                })}
              </div>
              {done && (
                <div role="status" className={`mt-3 rounded-xl p-4 text-sm leading-relaxed ${isCorrect ? 'bg-green-50 text-green-900' : 'bg-amber-50 text-amber-950'}`}>
                  <p className="font-bold mb-1">{isCorrect ? 'Да, верно!' : `Пока неверно. Правильный ответ: ${item.options[item.correct]}.`}</p>
                  <p>{item.explanation}</p>
                </div>
              )}
            </fieldset>
          )
        })}
      </div>

      {answered === questions.length && (
        <div className="mt-7 pt-5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3" role="status">
          <p className="font-semibold text-gray-900">Результат: {correct} из {questions.length} правильных ответов</p>
          <button type="button" onClick={() => setAnswers(questions.map(() => null))} className="text-sm font-semibold text-blue-700 hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-blue-600 rounded">Пройти ещё раз ↻</button>
        </div>
      )}
    </section>
  )
}
