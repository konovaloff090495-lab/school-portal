import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { profileSlugs, profileMetas, getProfileBySlug, getSchoolsByProfile, ProfileSlug } from '@/data/schools'
import CatalogClient from '../../../CatalogClient'

interface Props {
  params: Promise<{ profile: string }>
}

export function generateStaticParams() {
  return profileSlugs.map(profile => ({ profile }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { profile } = await params
  const meta = getProfileBySlug(profile)
  if (!meta) return {}
  const count = getSchoolsByProfile(meta.slug).length
  const title = `${meta.title} — ${count} школ в каталоге`
  return {
    title,
    description: meta.description,
    alternates: { canonical: `https://pro-schools.ru/shkoly/tipy/profilnye/${profile}/` },
    openGraph: { title, description: meta.description, url: `https://pro-schools.ru/shkoly/tipy/profilnye/${profile}/` },
  }
}

function ProfileSeoBlock({ meta, count }: { meta: ReturnType<typeof getProfileBySlug>; count: number }) {
  if (!meta) return null
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '8px 0 48px', color: '#374151', fontFamily: 'var(--font-manrope, system-ui)' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1814', margin: '0 0 8px', lineHeight: 1.3 }}>
          О профиле «{meta.label}»
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.75, margin: 0, color: '#4B5563' }}>
          {meta.description}
        </p>
      </div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1814', margin: '0 0 8px', lineHeight: 1.3 }}>
          Как выбрать {meta.label.toLowerCase()} школу
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.75, margin: 0, color: '#4B5563' }}>
          В каталоге {count} профильных школ по направлению «{meta.label}». Используйте фильтр по городу, чтобы найти школу в вашем регионе. Обращайте внимание на наличие лицензии и государственной аккредитации — без неё школа не выдаёт государственный аттестат. Посетите день открытых дверей и изучите программу перед подачей документов.
        </p>
      </div>
    </div>
  )
}

export default async function ProfilePage({ params }: Props) {
  const { profile } = await params
  if (!profileSlugs.includes(profile as ProfileSlug)) notFound()
  const p = profile as ProfileSlug
  const meta = getProfileBySlug(p)!
  const count = getSchoolsByProfile(p).length

  return (
    <CatalogClient
      initialTypes={['profilnye']}
      lockType
      title={meta.title}
      subtitle={count > 0 ? `${count} школ в каталоге — выберите город` : 'Школ пока нет — скоро добавим'}
      breadcrumbs={[
        { label: 'Все школы', href: '/shkoly/' },
        { label: 'Профильные школы', href: '/shkoly/tipy/profilnye/' },
        { label: meta.label },
      ]}
      seoContent={<ProfileSeoBlock meta={meta} count={count} />}
    />
  )
}
