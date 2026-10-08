import { getGdzBooks, getGdzBook, getGdzProblem, hasGdzSolution, gdzNumLabel, gdzNumToSlug } from '@/data/gdz'

interface GdzMatch { book: string; numbers: string[] }

// Только вручную сверенные задания: текст вопроса и решения относятся к теме.
const exactMatches: Record<string, GdzMatch> = {
  'istoriya/5/drevniy-egipet': { book: 'vigasin', numbers: ['p6-3', 'p6-7'] },
  'istoriya/6/vizantiyskaya-kultura-6': { book: 'agibalova', numbers: ['p7-3', 'p7-7'] },
  'russkiy-yazyk/1/rech-ustnaya-pismennaya-1': { book: 'kanakina-1', numbers: ['7'] },
}

export interface RelatedGdz {
  exact: boolean
  title: string
  intro: string
  href: string
  links: { href: string; label: string }[]
}

export function getRelatedGdz(subject: string, klass: number, topic: string, subjectTitle: string): RelatedGdz | null {
  const key = `${subject}/${klass}/${topic}`
  const match = exactMatches[key]
  if (match) {
    const book = getGdzBook(klass, subject, match.book)
    if (book) {
      const links = match.numbers.flatMap(number => {
        const problem = getGdzProblem(book, number)
        if (!problem || !hasGdzSolution(problem)) return []
        return [{
          href: `/gdz/${klass}-klass/${subject}/${match.book}/nomer-${gdzNumToSlug(number)}/`,
          label: `${gdzNumLabel(number, subject)} — ${problem.condition?.replace(/<[^>]*>/g, '').replace(/^\d+[.)]?\s*/, '').slice(0, 115)}`,
        }]
      })
      if (links.length) return {
        exact: true,
        title: 'Эта тема есть в ГДЗ',
        intro: `Задания из учебника ${book.authors.split(',')[0]} с объяснениями. Выберите номер и попробуйте решить его самостоятельно перед просмотром ответа.`,
        href: `/gdz/${klass}-klass/${subject}/${match.book}/`,
        links,
      }
    }
  }

  // Если точного соответствия нет, ведём только в каталог предмета и не
  // утверждаем, что конкретная тема присутствует в решебнике.
  if (!getGdzBooks(klass, subject).length) return null
  return {
    exact: false,
    title: 'Больше заданий в ГДЗ',
    intro: `Выберите свой учебник и найдите упражнения по ${subjectTitle.toLowerCase()} за ${klass} класс.`,
    href: `/gdz/${klass}-klass/${subject}/`,
    links: [],
  }
}
