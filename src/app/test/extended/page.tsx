import type { Metadata } from 'next'
import ExtendedTest from './ExtendedTest'

export const metadata: Metadata = {
  title: 'Расширенный профориентационный тест — полный портрет личности | pro-schools.ru',
  description:
    'Расширенный тест профориентации: 30 вопросов, 10 минут. Узнайте стиль обучения, мотивацию, карьерные пути и подходящие школы. Результаты сохраняются в личном кабинете.',
  robots: { index: false, follow: false },
}

export default function ExtendedTestPage() {
  return <ExtendedTest />
}
