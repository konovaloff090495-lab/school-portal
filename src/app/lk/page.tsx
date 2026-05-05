import type { Metadata } from 'next'
import LKPage from './LKPage'

export const metadata: Metadata = {
  title: 'Личный кабинет — мои результаты тестов | pro-schools.ru',
  description: 'Ваши результаты профориентационных тестов, профиль личности и рекомендации по выбору школы.',
  robots: { index: false, follow: false },
}

export default function PersonalCabinet() {
  return <LKPage />
}
