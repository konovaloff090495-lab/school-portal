import Link from 'next/link'
import OnlineLeadCta from '@/components/OnlineLeadCta'
import { regionLabels, regionLabelsIn, regionSlugs, getSchoolsByRegionAndType, getSchoolsByFeature, type RegionSlug } from '@/data/schools'

/**
 * Дополнение к страницам школ программирования для детей: хаб /shkoly/tipy/programmirovanie/
 * и город /shkoly/<город>/programmirovanie/. Карточки собраны по Яндекс Картам (запрос
 * «школа программирования для детей <город>», 09.2026) в 40 крупных городах — без цен,
 * которые мы не проверяли. Конверсионная часть — онлайн-школа EasyCode (проект «Синергии»,
 * факты из базы знаний продукта: дети 7–17 лет, занятие с преподавателем раз в неделю в группе
 * до 15 или индивидуально, вебинары и куратор, направления Scratch/Python+ИИ/Godot/дизайн,
 * от 5 500 ₽/мес, рассрочка, пробный урок). Заявка — через submitLead() с уникальным source.
 */
export default function ProgCityExtras({ region, count }: { region?: RegionSlug; count: number }) {
  const regionName = region ? regionLabels[region] : undefined
  const regionIn = region ? regionLabelsIn[region] : 'в вашем городе'
  const source = region ? `Программирование: город ${regionName}` : 'Программирование: хаб /shkoly/tipy/programmirovanie/'

  const cities = regionSlugs
    .map(r => ({ r, n: getSchoolsByRegionAndType(r, 'programmirovanie').length }))
    .filter(x => x.n >= 2 && x.r !== region)
    .sort((a, b) => b.n - a.n)

  // общеобразовательные школы города с IT-классами — второй уровень ответа на запрос
  const itSchools = region ? getSchoolsByFeature('it-klass', region).slice(0, 8) : []

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', fontFamily: 'var(--font-manrope, system-ui)', color: '#1A1814' }}>
      <OnlineLeadCta
        source={source}
        heading={count === 0
          ? `Очной школы программирования ${regionIn} в каталоге нет — начните онлайн`
          : 'Не подходит расписание очных занятий? Онлайн-школа программирования с пробным уроком'}
        text={`EasyCode — онлайн-школа программирования для детей 7–17 лет: занятие с преподавателем раз в неделю в группе до 15 человек или индивидуально, еженедельные вебинары о технологиях, куратор в чате и портфолио проектов. Направления — Scratch и создание игр, Python и ИИ, Godot, дизайн. Ребёнок занимается из дома ${regionIn}, вы видите прогресс в личном кабинете. Оставьте контакты — перезвоним за 30 минут, подберём направление по возрасту и запишем на пробный урок.`}
        bullets={[
          'от 5 500 ₽/мес, рассрочка и оплата по счёту',
          'образовательная лицензия, резидент Сколково',
          'проект каждые полгода и публичная защита — портфолио к 9–11 классу',
        ]}
        city={regionName}
      />

      <section style={{ margin: '0 0 28px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 10px' }}>Как выбрать школу программирования для ребёнка {regionIn}</h2>
        <ol style={{ fontSize: 15, lineHeight: 1.65, color: '#3F3A35', margin: 0, paddingLeft: 22 }}>
          <li>Смотрите на возраст и язык: 6–9 лет — Scratch и визуальные среды, 10–12 — Roblox, Minecraft, первые шаги в Python, 13–17 — Python, веб-разработка, геймдев на Unity или Godot.</li>
          <li>Просите пробное занятие: почти все школы из списка проводят первый урок бесплатно или за символическую плату — так видно, подходит ли преподаватель и группа.</li>
          <li>Сравнивайте цену за месяц при одинаковой частоте занятий (обычно 1–2 раза в неделю по 60–90 минут) и уточняйте, входит ли в стоимость доступ к платформе и проверка домашних заданий.</li>
          <li>Проверьте отзывы на Яндекс Картах — у каждой школы в списке выше указана оценка и число отзывов на сентябрь 2026 года.</li>
        </ol>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: '#5F5A55', margin: '12px 0 0' }}>
          По теме: <Link href="/shkoly/tipy/programmirovanie/" style={a}>все школы программирования России</Link>,{' '}
          <Link href="/shkoly/osobennosti/it-klass/" style={a}>общеобразовательные школы с IT-классами</Link>,{' '}
          <Link href="/shkoly/tipy/online/" style={a}>онлайн-школы с аттестатом</Link>.
        </p>
      </section>

      {itSchools.length > 0 && region && (
        <section style={{ margin: '0 0 28px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 10px' }}>Общеобразовательные школы с IT-классами {regionIn}</h2>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: '#5F5A55', margin: '0 0 10px' }}>
            Если нужна не секция, а профильный класс с углублённой информатикой в обычной школе:
          </p>
          <ul style={{ fontSize: 15, lineHeight: 1.7, color: '#3F3A35', margin: 0, paddingLeft: 20 }}>
            {itSchools.map(s => (
              <li key={s.id}><Link href={`/shkola/${s.slug}/`} style={a}>{s.name}</Link>{s.address ? <span style={{ color: '#9B9490' }}> — {s.address}</span> : null}</li>
            ))}
          </ul>
        </section>
      )}

      {cities.length > 0 && (
        <section style={{ margin: '0 0 28px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 10px' }}>Школы программирования в других городах</h2>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: '#5F5A55', margin: '0 0 10px' }}>
            Очные школы и клубы собраны по Яндекс Картам в {cities.length + (region ? 1 : 0)} городах; цифра — сколько адресов в каталоге.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {cities.map(({ r, n }) => (
              <Link key={r} href={`/shkoly/${r}/programmirovanie/`} style={{ ...a, fontSize: 14, padding: '6px 12px', border: '1px solid #E8E0D6', borderRadius: 999, background: '#fff' }}>
                {regionLabels[r]} <span style={{ color: '#9B9490' }}>{n}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

const a: React.CSSProperties = { color: '#0369A1', textDecoration: 'none' }
