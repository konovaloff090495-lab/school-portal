export interface Review {
  id: string           // unique, e.g. "rv-001"
  schoolSlug: string   // matches School.slug
  schoolName: string
  authorName: string
  rating: number       // 1-5
  text: string         // review text
  pros?: string        // что понравилось
  cons?: string        // что не понравилось
  publishedAt: string  // ISO date string
  childGrade?: string  // "3 класс" etc.
}

export const approvedReviews: Review[] = [
  {
    id: 'rv-001',
    schoolSlug: 'gbou-shkola-179-moskva',
    schoolName: 'ГБОУ Школа № 179',
    authorName: 'Мария К.',
    rating: 5,
    text: 'Замечательная школа! Сын учится здесь уже третий год — олимпиады, математические кружки, всегда интересные проекты. Педагоги очень профессиональные и внимательные, всегда готовы помочь разобраться в сложной теме.',
    pros: 'Сильные педагоги, много олимпиадной подготовки, хорошая атмосфера в классе',
    cons: 'Иногда очень высокая нагрузка, не всем детям подходит темп',
    publishedAt: '2025-03-15T10:30:00.000Z',
    childGrade: '7 класс',
  },
  {
    id: 'rv-002',
    schoolSlug: 'gbou-shkola-179-moskva',
    schoolName: 'ГБОУ Школа № 179',
    authorName: 'Алексей В.',
    rating: 4,
    text: 'Хорошая государственная школа с упором на математику и физику. Дочка поступила в 10 класс — преподавательский состав очень грамотный. Единственный минус — большие классы, иногда не хватает индивидуального внимания.',
    pros: 'Высокий уровень подготовки, сильный преподавательский состав',
    cons: 'Большие классы, до 30 человек',
    publishedAt: '2025-01-20T14:00:00.000Z',
    childGrade: '10 класс',
  },
  {
    id: 'rv-003',
    schoolSlug: 'chastnaya-shkola-family-moskva',
    schoolName: 'Частная школа «Семья»',
    authorName: 'Ольга Т.',
    rating: 5,
    text: 'Перевели ребёнка из государственной школы два года назад — это было лучшее решение! Маленькие классы, индивидуальный подход, прекрасные учителя. Ребёнок наконец полюбил учиться. Рекомендуем всем родителям, кто ищет тёплую и комфортную атмосферу.',
    pros: 'Малые классы, дружелюбная атмосфера, внимательные педагоги, современные методики',
    cons: 'Высокая стоимость обучения',
    publishedAt: '2025-04-02T09:15:00.000Z',
    childGrade: '4 класс',
  },
]

export function getReviewsBySchool(schoolSlug: string): Review[] {
  return approvedReviews.filter(r => r.schoolSlug === schoolSlug)
}

export function getAverageRating(schoolSlug: string): number | null {
  const reviews = getReviewsBySchool(schoolSlug)
  if (!reviews.length) return null
  return Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length * 10) / 10
}
