import Link from 'next/link'
import OnlineLeadCta from '@/components/OnlineLeadCta'
import { regionLabels, regionLabelsIn, regionSlugs, getSchoolsByRegionAndType, type RegionSlug } from '@/data/schools'

/**
 * Дополнение к страницам центров ЕГЭ/ОГЭ: хаб /shkoly/tipy/podgotovka-ege|oge/ и город
 * /shkoly/<город>/podgotovka-ege|oge/. Карточки центров собраны вручную по Яндекс Картам
 * (запрос «курсы ЕГЭ ОГЭ <город>», 09.2026) в 30 крупных городах — без цен, которые не
 * проверены. Конверсионная часть страницы — онлайн-курсы «Синергии» (факты из базы
 * знаний продукта: 10 предметов ЕГЭ / 11 ОГЭ, курс 9 месяцев с 1 сентября, 56 вебинаров
 * на предмет, 3 пробника, от 49 590 ₽ за предмет, рассрочка от 4 132 ₽/мес, пробный день).
 * Заявка уходит через submitLead() (OnlineLeadCta → LeadForm) с уникальным source.
 */
export default function EgeCityExtras({ region, variant, count }: { region?: RegionSlug; variant: 'ege' | 'oge'; count: number }) {
  const exam = variant === 'ege' ? 'ЕГЭ' : 'ОГЭ'
  const grades = variant === 'ege' ? '10–11 классов' : '8–9 классов'
  const regionName = region ? regionLabels[region] : undefined
  const regionIn = region ? regionLabelsIn[region] : 'в вашем городе'
  const cityLabel = region ? regionIn : 'в России'
  const source = region ? `Курсы ${exam}: город ${regionName}` : `Курсы ${exam}: хаб /shkoly/tipy/podgotovka-${variant}/`

  // города, где в каталоге есть очные центры — для перелинковки хаба и соседних городов
  const cities = regionSlugs
    .map(r => ({ r, n: getSchoolsByRegionAndType(r, variant === 'ege' ? 'podgotovka-ege' : 'podgotovka-oge').length }))
    .filter(x => x.n >= 2 && x.r !== region)
    .sort((a, b) => b.n - a.n)

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', fontFamily: 'var(--font-manrope, system-ui)', color: '#1A1814' }}>
      <OnlineLeadCta
        source={source}
        heading={count === 0
          ? `Очных курсов ${exam} ${cityLabel} в каталоге пока нет — подготовьтесь онлайн`
          : `Не подходит расписание очных курсов? Онлайн-курс ${exam} с пробным днём`}
        text={`Онлайн-курсы подготовки к ${exam} для ${grades}: ${variant === 'ege' ? '10 предметов' : '11 предметов'}, курс на учебный год с 1 сентября — 56 вебинаров по предмету (2 в неделю), тренажёры, конспекты, три пробных экзамена с разбором и куратор на связи каждый день. Занятия из дома ${regionIn}, экзамен — в своей школе. Оставьте контакты — перезвоним за 30 минут, откроем пробный день бесплатно и подберём предметы.`}
        bullets={[
          'от 49 590 ₽ за годовой курс одного предмета, рассрочка от 4 132 ₽/мес',
          'преподаватели — эксперты МЦКО и вузов, ежегодно сдают экзамен сами',
          'тариф «Про»: домашние задания с проверкой педагога, наставник и сопровождение до поступления',
        ]}
        city={regionName}
      />

      <section style={{ margin: '0 0 28px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 10px' }}>Как выбрать курсы {exam} {regionIn}</h2>
        <ol style={{ fontSize: 15, lineHeight: 1.65, color: '#3F3A35', margin: 0, paddingLeft: 22 }}>
          <li>Сначала бесплатная диагностика: хороший центр проводит пробный {exam} до оплаты и показывает, сколько баллов ученик набирает сейчас.</li>
          <li>Смотрите на формат, а не на бренд: группа до 8–10 человек или мини-группа, домашние задания с проверкой, минимум 2–3 пробника за год по актуальным КИМам ФИПИ.</li>
          <li>Сверяйте цену за год, а не за месяц: очные курсы в крупных городах обычно продают абонементами по 4–8 занятий, онлайн-курсы — годовой программой с рассрочкой.</li>
          <li>Проверьте отзывы на Яндекс Картах — у каждого центра в списке выше указана оценка и число отзывов на сентябрь 2026 года.</li>
        </ol>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: '#5F5A55', margin: '12px 0 0' }}>
          Подробнее: <Link href="/blog/repetitor-ili-kursy-chto-luchshe-ege/" style={a}>репетитор или курсы</Link>,{' '}
          <Link href="/blog/kursy-podgotovki-k-ege-luchshie/" style={a}>как выбрать курсы ЕГЭ</Link>,{' '}
          {variant === 'ege'
            ? <><Link href="/blog/kak-podgotovit-k-ege-za-1-god/" style={a}>подготовка к ЕГЭ за год</Link>, <Link href="/blog/kak-sdat-ege-na-100-ballov/" style={a}>как сдать на 100 баллов</Link></>
            : <><Link href="/blog/kak-sdat-oge-na-pyat/" style={a}>как сдать ОГЭ на пять</Link>, <Link href="/blog/kak-sdat-oge-po-matematike/" style={a}>ОГЭ по математике</Link></>}.
          По предметам: <Link href={`/shkoly/tipy/podgotovka-${variant}/matematika/`} style={a}>математика</Link>,{' '}
          <Link href={`/shkoly/tipy/podgotovka-${variant}/russkij/`} style={a}>русский язык</Link>,{' '}
          <Link href={`/shkoly/tipy/podgotovka-${variant}/online/`} style={a}>онлайн-подготовка</Link>.
        </p>
      </section>

      {cities.length > 0 && (
        <section style={{ margin: '0 0 28px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 10px' }}>Курсы {exam} в других городах</h2>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: '#5F5A55', margin: '0 0 10px' }}>
            Очные центры подготовки собраны по Яндекс Картам в {cities.length + (region ? 1 : 0)} крупных городах; цифра — сколько центров в каталоге.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {cities.map(({ r, n }) => (
              <Link key={r} href={`/shkoly/${r}/podgotovka-${variant}/`} style={{ ...a, fontSize: 14, padding: '6px 12px', border: '1px solid #E8E0D6', borderRadius: 999, background: '#fff' }}>
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
