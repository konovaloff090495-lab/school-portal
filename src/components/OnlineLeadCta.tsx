import LeadForm from '@/components/LeadForm'

/**
 * Лид-блок раздела онлайн-школ: копия слева + LeadForm (submitLead → Telegram + CRM Синергии).
 * `source` обязателен и уникален на каждый тип страницы — это formTitle в CRM.
 */
export default function OnlineLeadCta({
  source,
  heading = 'Подобрать онлайн-школу бесплатно',
  text = 'Скажите класс, город и бюджет — за 30 минут перезвоним и подскажем, какая онлайн-школа с государственным аттестатом подойдёт ребёнку, где есть пробный период и как оформить перевод без потери года.',
  city,
  schoolName,
  bullets = [
    'сравним тарифы и форматы: записи, вебинары, мини-классы',
    'объясним, как проходит аттестация и кто выдаёт аттестат',
    'поможем с переводом в середине учебного года',
  ],
}: {
  source: string
  heading?: string
  text?: string
  city?: string
  schoolName?: string
  bullets?: string[]
}) {
  return (
    <section
      id="podbor"
      style={{
        maxWidth: 960, margin: '0 auto 36px', display: 'grid', gap: 20,
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        background: '#FFF7F1', border: '1px solid #FFD9C2', borderRadius: 20, padding: 'clamp(18px, 3vw, 28px)',
        fontFamily: 'var(--font-manrope, system-ui)',
      }}
    >
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1A1814', margin: '0 0 10px', lineHeight: 1.25 }}>{heading}</h2>
        <p style={{ fontSize: 15, color: '#3F3A35', lineHeight: 1.55, margin: '0 0 14px' }}>{text}</p>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: '#3F3A35', lineHeight: 1.6 }}>
          {bullets.map(b => <li key={b}>{b}</li>)}
        </ul>
      </div>
      <LeadForm
        compact
        title="Оставьте контакты — перезвоним"
        source={source}
        schoolCity={city}
        schoolName={schoolName}
      />
    </section>
  )
}
