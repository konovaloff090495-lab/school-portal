import guides from '@/data/school-card-guides.json'

export interface SchoolCardGuide {
  status: 'official' | 'route' | 'unconfirmed'
  checkedAt: string
  summary: string
  facts: { title: string; text: string }[]
  steps: string[]
  faq: { q: string; a: string }[]
  sources: { url: string; label: string }[]
  contact?: { title: string; text: string; phone: string; label: string }
}

export function getSchoolCardGuide(slug: string): SchoolCardGuide | undefined {
  return (guides as Record<string, SchoolCardGuide>)[slug]
}
