export function explicitSchoolGrades(value: string): number[] {
  const clean = value.trim().replace(/\s+класс(?:ы|ов|а)?$/i, '')
  if (!/^\d{1,2}(?:\s*[–—-]\s*\d{1,2})?(?:\s*[,;]\s*\d{1,2}(?:\s*[–—-]\s*\d{1,2})?)*$/.test(clean)) return []
  return [...new Set(clean.split(/[,;]/).flatMap(part => {
    const [from, last] = part.trim().split(/[–—-]/).map(Number)
    const to = last ?? from
    // Evening schools can explicitly list a twelfth class. Keep their 9–11 classes too.
    return from >= 1 && from <= to && to <= 12 ? Array.from({ length: to - from + 1 }, (_, i) => from + i) : []
  }))]
}
