import Link from 'next/link'
import {
  schools, regionSlugs, regionLabels, regionLabelsIn, type RegionSlug, type School,
} from '@/data/schools'
import { onlineBrands } from '@/data/online-brands'
import { BreadcrumbJsonLd, SchoolListJsonLd } from '@/lib/schema'
import Breadcrumbs from '@/components/Breadcrumbs'
import SchoolCard from '@/components/SchoolCard'
import OnlineBrandsTable from '@/components/OnlineBrandsTable'
import OnlineLeadCta from '@/components/OnlineLeadCta'

/**
 * /shkoly/<город>/online/ — онлайн-школы для жителей города.
 *
 * Раньше страница показывала только школы с region === город, а у онлайн-школ
 * регион «Москва» — почти все города отдавали «0 школ» и noindex, при этом именно
 * эти страницы давали заявки (6 из 7 по разделу за июль–сентябрь 2026). Теперь:
 * местные онлайн-школы первыми, дальше — все федеральные, сверху таблица брендов
 * и лид-форма. Индексируются только крупные города (ONLINE_INDEX_REGIONS).
 */

export { ONLINE_INDEX_REGIONS } from '@/lib/index-rules'

export function schoolsWord(n: number): string {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return 'школа'
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'школы'
  return 'школ'
}

export function onlineSchoolsForCity(region: RegionSlug): School[] {
  const all = schools.filter(s => s.type === 'online')
  const local = all.filter(s => s.region === region)
  const federal = all.filter(s => s.region !== region)
  return [...local, ...federal]
}

export default function CityOnlinePage({ region }: { region: RegionSlug }) {
  const r = region
  const regionName = regionLabels[r]
  const regionIn = regionLabelsIn[r]
  const cityName = regionIn.replace(/^в(о)? /, '')
  const list = onlineSchoolsForCity(r)
  const local = list.filter(s => s.region === r)
  const url = `https://pro-schools.ru/shkoly/${r}/online/`
  const own = onlineBrands.filter(b => b.attestation === 'own')
  const neighbours = regionSlugs.filter(x => x !== r && x !== 'moskovskaya-oblast').slice(0, 12)

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Все школы', href: 'https://pro-schools.ru/shkoly/' },
          { name: regionName, href: `https://pro-schools.ru/shkoly/${r}/` },
          { name: 'Онлайн-школы' },
        ]}
      />
      <SchoolListJsonLd schools={list} url={url} name={`Онлайн-школы ${regionIn}`} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px 48px', fontFamily: 'var(--font-manrope, system-ui)', color: '#1A1814' }}>
        <Breadcrumbs crumbs={[
          { label: 'Все школы', href: '/shkoly/' },
          { label: regionName, href: `/shkoly/${r}/` },
          { label: 'Онлайн-школы' },
        ]} />

        <h1 style={{ fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 800, lineHeight: 1.2, margin: '18px 0 12px' }}>
          Онлайн-школы {regionIn}: {list.length} {schoolsWord(list.length)} с государственным аттестатом
        </h1>
        <p style={{ fontSize: 16.5, lineHeight: 1.6, color: '#3F3A35', margin: '0 0 22px', maxWidth: 860 }}>
          Онлайн-школа не привязана к городу: ребёнок {regionIn} учится в той же Фоксфорд, ИнтернетУрок или Синергии,
          что и ученик из Москвы, а аттестат получает такой же — государственного образца.
          {local.length > 0
            ? ` Ниже сначала ${local.length === 1 ? 'местная онлайн-школа' : `${local.length} местных онлайн-школы`} ${regionIn}, затем федеральные.`
            : ` Ниже — федеральные онлайн-школы, которые принимают учеников ${regionIn} дистанционно, с ценами 2026/27 и схемой аттестации.`}
          {' '}Промежуточные аттестации везде сдаются онлайн, а ОГЭ и ЕГЭ — очно в пункте проведения экзаменов {regionIn}, как у всех школьников.
        </p>

        <OnlineBrandsTable
          title={`Какую онлайн-школу выбрать ${regionIn}: сравнение цен и аттестации`}
          intro={`Все школы работают по всей России. Собственная аккредитация — у ${own.map(b => b.name).join(', ')}: они зачисляют ребёнка к себе и сами выдают аттестат. Остальные оформляют аттестат через школу-партнёра.`}
        />

        <OnlineLeadCta
          source={`Онлайн-школы: город ${regionName}`}
          heading={`Подобрать онлайн-школу для ребёнка ${regionIn}`}
          text={`Скажите класс и бюджет — за 30 минут перезвоним, сравним тарифы онлайн-школ для ${cityName} и объясним, как оформить перевод на дистанционное обучение без потери года.`}
          city={regionName}
        />

        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '8px 0 14px' }}>Онлайн-школы, которые принимают учеников {regionIn}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" style={{ marginBottom: 32 }}>
          {list.map(s => <SchoolCard key={s.id} school={s} />)}
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '8px 0 12px' }}>Как перевести ребёнка {regionIn} на онлайн-обучение</h2>
        <ol style={{ fontSize: 15.5, lineHeight: 1.65, color: '#3F3A35', margin: '0 0 20px', paddingLeft: 22 }}>
          <li>Выберите форму: семейное образование (уведомление в управление образования {cityName}) или заочная форма с зачислением в онлайн-школу.</li>
          <li>Возьмите пробный период — у ИнтернетУрока, Синергии, Skysmart и Онлайн Гимназии №1 он бесплатный, у Фоксфорда есть пробный доступ.</li>
          <li>Заберите личное дело из прежней школы и отправьте сканы в онлайн-школу: перевод оформляется дистанционно, в том числе в середине года.</li>
          <li>Уточните, кто выдаст аттестат — сама школа или её школа-партнёр — и где {regionIn} ребёнок будет сдавать ОГЭ/ЕГЭ.</li>
        </ol>
        <p style={{ fontSize: 15.5, lineHeight: 1.65, color: '#3F3A35', margin: '0 0 24px' }}>
          Если ребёнку нужна очная школа {regionIn}, смотрите <Link href={`/shkoly/${r}/`} style={a}>все школы {regionIn}</Link>,{' '}
          <Link href={`/shkoly/${r}/eksternal/`} style={a}>экстернаты</Link> и{' '}
          <Link href={`/shkoly/${r}/vechernie/`} style={a}>вечерние школы</Link>.
          Разбор форм домашнего обучения — в разделе <Link href="/shkoly/tipy/domashnie/" style={a}>«Домашние школы»</Link>,
          рейтинг всех онлайн-школ — на странице <Link href="/shkoly/tipy/online/" style={a}>«Онлайн-школы России»</Link>.
        </p>

        <p style={{ fontSize: 14, color: '#5F5A55', lineHeight: 1.6 }}>
          Онлайн-школы в других городах:{' '}
          {neighbours.map((x, i) => (
            <span key={x}>{i > 0 && ' · '}<Link href={`/shkoly/${x}/online/`} style={a}>{regionLabelsIn[x].replace(/^в(о)? /, '')}</Link></span>
          ))}
        </p>
      </div>
    </>
  )
}

const a: React.CSSProperties = { color: '#0369A1', textDecoration: 'none' }
