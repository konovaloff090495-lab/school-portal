export type EducationLevel = 'elementary' | 'middle' | 'high'

// Only explicit classes or named school levels can establish a level.
export function getSchoolLevels(grades: string): EducationLevel[] {
  if (/^начальная школа$/i.test(grades.trim())) return ['elementary']
  const value = grades.trim().replace(/\s+класс(?:ы|ов|а)?$/i, '')
  if (!/^\d{1,2}(?:\s*[–—-]\s*\d{1,2})?(?:\s*[,;]\s*\d{1,2}(?:\s*[–—-]\s*\d{1,2})?)*$/.test(value)) return []
  const classes = value.split(/[,;]/).flatMap(part => {
    const [from, end] = part.trim().split(/[–—-]/).map(Number)
    const to = end ?? from
    return from <= to && to <= 11 ? Array.from({ length: to - from + 1 }, (_, i) => from + i) : []
  })
  const levels: EducationLevel[] = []
  if (classes.some(n => n >= 1 && n <= 4)) levels.push('elementary')
  if (classes.some(n => n >= 5 && n <= 9)) levels.push('middle')
  if (classes.some(n => n >= 10 && n <= 11)) levels.push('high')
  return levels
}
