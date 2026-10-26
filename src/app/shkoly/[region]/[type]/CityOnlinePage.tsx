import Link from 'next/link'
import {
  schools, schoolMatchesType, regionSlugs, regionLabels, regionLabelsIn, type RegionSlug, type School,
} from '@/data/schools'
import { onlineBrands } from '@/data/online-brands'
import { BreadcrumbJsonLd, SchoolListJsonLd } from '@/lib/schema'
import CatalogClient from '../../CatalogClient'
import OnlineBrandsTable from '@/components/OnlineBrandsTable'
import OnlineLeadCta from '@/components/OnlineLeadCta'

/**
 * /shkoly/<город>/online/ — онлайн-школы для жителей города.
 *
 * Раньше страница показывала только школы с region === город, а у онлайн-школ
 * регион «Москва» — почти все города отдавали «0 школ» и noindex, при этом именно
 * эти страницы давали заявки (6 из 7 по разделу за июль–сентябрь 2026). Теперь:
 * местные онлайн-школы первыми, дальше — федеральные. Общий каталог с фильтрами
 * показывается первым; сравнение, пояснения и форма — после карточек. Индексируются только крупные города (ONLINE_INDEX_REGIONS).
 */

export { ONLINE_INDEX_REGIONS } from '@/lib/index-rules'

export function schoolsWord(n: number): string {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return 'школа'
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'школы'
  return 'школ'
}

export function onlineSchoolsForCity(region: RegionSlug): School[] {
  const all = schools.filter(s => schoolMatchesType(s, 'online') && (s.onlineSchoolScope === 'national' || s.region === region))
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

      <CatalogClient
        initialTypes={['online']}
        lockType
        lockRegion
        allowedSchoolSlugs={list.map(s => s.slug)}
        title={`Онлайн-школы ${regionIn}: ${list.length} ${schoolsWord(list.length)} с государственным аттестатом`}
        subtitle="Дистанционное обучение по школьной программе — сравните классы, стоимость и условия аттестации"
        breadcrumbs={[
          { label: 'Все школы', href: '/shkoly/' },
          { label: regionName, href: `/shkoly/${r}/` },
          { label: 'Онлайн-школы' },
        ]}
        seoContent={<div className="mt-10 space-y-6">
        <p style={{ fontSize: 16.5, lineHeight: 1.6, color: '#3F3A35', margin: '0 0 22px', maxWidth: 860 }}>
          Онлайн-школа не привязана к городу: ребёнок {regionIn} учится в той же Фоксфорд, ИнтернетУрок или Синергии,
          что и ученик из Москвы, а аттестат получает такой же — государственного образца.
          {local.length > 0
            ? ` Ниже сначала ${local.length === 1 ? 'местная онлайн-школа' : `${local.length} ${schoolsWord(local.length)}`} ${regionIn}, затем федеральные.`
            : ` Ниже — федеральные онлайн-школы, которые принимают учеников ${regionIn} дистанционно, с ценами 2026/27 и схемой аттестации.`}
          {' '}Формат промежуточных аттестаций и место ОГЭ/ЕГЭ зависят от принимающей школы и программы. Подтвердите их до оплаты: онлайн-уроки не означают экзамены в городе проживания.
        </p>

        <OnlineBrandsTable
          title={`Какую онлайн-школу выбрать ${regionIn}: сравнение цен и аттестации`}
          intro={`В таблице — федеральные онлайн-школы. Собственная аккредитация — у ${own.map(b => b.name).join(', ')}: они зачисляют ребёнка к себе и сами выдают аттестат. Остальные оформляют аттестат через школу-партнёра.`}
        />

        <OnlineLeadCta
          source={`Онлайн-школы: город ${regionName}`}
          heading={`Условия платной онлайн-программы Синергии ${regionIn}`}
          text={`Для сравнения школ используйте таблицу и официальные сайты. Заявка из этой формы поступит консультанту Синергии: укажите класс, задачу и удобное время звонка. Документы, полную стоимость и место экзаменов уточните до договора.`}
          city={regionName}
        />

        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '8px 0 12px' }}>Как перевести ребёнка {regionIn} на онлайн-обучение</h2>
        <ol style={{ fontSize: 15.5, lineHeight: 1.65, color: '#3F3A35', margin: '0 0 20px', paddingLeft: 22 }}>
          <li>Выберите форму: семейное образование (уведомление в управление образования {cityName}) или заочная форма с зачислением в онлайн-школу.</li>
          <li>Если нужен пробный доступ, проверьте его наличие, длительность и ограничения у выбранной школы для вашего класса.</li>
          <li>Заберите личное дело из прежней школы и отправьте сканы в онлайн-школу: перевод оформляется дистанционно, в том числе в середине года.</li>
          <li>Уточните, кто выдаст аттестат — сама школа или её школа-партнёр — и в каком городе ребёнок будет сдавать ОГЭ/ЕГЭ.</li>
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
        </div>}
      />
    </>
  )
}

const a: React.CSSProperties = { color: '#0369A1', textDecoration: 'none' }
