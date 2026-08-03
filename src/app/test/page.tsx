import type { Metadata } from 'next'
import CareerTest from './CareerTest'

export const metadata: Metadata = {
  title: 'Профориентационный тест для школьников — узнай тип личности | pro-schools.ru',
  description:
    'Бесплатный экспресс-тест на профориентацию. 20 вопросов — 5 минут. Узнайте тип личности ребёнка, сильные стороны и какие школы подойдут лучше всего.',
  keywords: 'профориентация, тест для школьника, тип личности, выбор профессии, профориентационный тест',
  // Без явного self-canonical страница наследует canonical из layout (главная).
  alternates: { canonical: 'https://pro-schools.ru/test/' },
  openGraph: {
    title: 'Профориентационный тест для школьников',
    description: '20 вопросов, 5 минут — узнайте тип личности и подходящие направления обучения',
    url: 'https://pro-schools.ru/test/',
    siteName: 'pro-schools.ru',
    type: 'website',
  },
}

export default function TestPage() {
  return <CareerTest />
}
