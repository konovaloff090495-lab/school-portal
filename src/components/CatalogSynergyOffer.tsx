'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import LeadForm from './LeadForm'
import styles from './CatalogSynergyOffer.module.css'

// Confirmed by the owner on 26.10.2026: a ProSchools-specific 14-day offer.
// The public school-university.com offer remains one week; do not change it globally.
const OFFER_SOURCE = 'Каталог школ: Синергия — 14 дней бесплатно'
const OFFER_GOAL = 'Спецпредложение ProSchools: 14 дней бесплатного доступа в онлайн-школу «Синергия», 5–11 класс'

export default function CatalogSynergyOffer({ kind = 'trial' }: { kind?: 'trial' | 'attestat' }) {
  const credential = kind === 'attestat'
  const source = credential ? 'Каталог школ: аттестат гособразца — 14 дней Синергии' : OFFER_SOURCE
  const goal = credential ? '14 дней бесплатно в онлайн-школе «Синергия». Цель: школьная программа и аттестат государственного образца' : OFFER_GOAL
  const image = credential ? '/offers/synergy/family-attestat-gpt-20261026.webp' : '/offers/synergy/online-lesson-gpt-20261026.webp'
  const imageAlt = credential ? 'Иллюстрация семьи с выпускницей и аттестатом' : 'Иллюстрация: ученик занимается онлайн с преподавателем'
  const details = credential ? [
    ['Школьная программа', 'Уроки и задания для 5–11 классов на онлайн-платформе.'],
    ['Зачисление в школу', 'Консультант объяснит порядок перевода, документы и условия выбранной программы.'],
    ['Аттестат государственного образца', 'После освоения программы и итоговой аттестации — аттестат за 9 или 11 класс.'],
  ] : [
    ['Учёба на одной платформе', 'Уроки, задания и учебные материалы собраны в личном кабинете.'],
    ['Подходящий формат занятий', 'Живые уроки и записи; состав занятий и поддержки зависит от выбранной программы.'],
    ['Поддержка в течение учёбы', 'Классный руководитель помогает с организационными вопросами, а родитель может следить за успеваемостью.'],
  ]
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const headingId = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const panel = dialog.current
    if (!panel || !open) return
    const previousOverflow = document.body.style.overflow
    panel.showModal()
    window.dispatchEvent(new Event('ps:catalog-drawer-open'))
    document.body.style.overflow = 'hidden'
    window.ym?.(108789843, 'reachGoal', 'catalog_synergy_offer_open', { offer: credential ? 'attestat-14-days' : 'proschools-14-days' })
    return () => {
      panel.close()
      document.body.style.overflow = previousOverflow
      opener.current?.focus({ preventScroll: true })
    }
  }, [open, credential])

  return (
    <div data-catalog-synergy-offer={kind}>
      <button
        ref={opener}
        type="button"
        className={styles.banner}
        aria-haspopup="dialog"
        aria-controls={panelId}
        onClick={() => setOpen(true)}
      >
        <span className={styles.bannerCopy}>
          <span className={`${styles.bannerTitle} ${credential ? styles.credentialTitle : ''}`}>{credential ? <><span>Онлайн-школа</span><strong>с аттестатом государственного образца</strong></> : <>Попробуйте <strong>14 дней бесплатно</strong><span>в онлайн-школе «Синергия»</span></>}</span>
          <span className={styles.bannerDescription}>{credential ? <>Учитесь из любой точки мира<span className={styles.bannerGrade}>Для учеников 5–11 классов</span></> : 'Школьная программа для 5–11 классов'}</span>
          <span className={styles.bannerCta}>{credential ? 'Попробовать 14 дней бесплатно' : 'Получить бесплатный доступ'} <span aria-hidden="true">→</span></span>
          <span className={styles.bannerNote}>Спецпредложение ProSchools</span>
        </span>
        {/* Generated campaign illustration; not a photograph of actual school staff. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.bannerPhoto} src={image} alt={imageAlt} width="1448" height="1086" loading="lazy" />
      </button>

      {open && createPortal(<dialog
        ref={dialog}
        id={panelId}
        className={`${styles.panel} ${credential ? styles.credentialPanel : ''}`}
        aria-labelledby={headingId}
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
        onClick={event => { if (event.target === event.currentTarget) setOpen(false) }}
      >
        <header className={styles.header}>
          <span>Онлайн-школа «Синергия»</span>
          <button type="button" onClick={() => setOpen(false)} className={styles.close} aria-label="Закрыть информацию об онлайн-школе">×</button>
        </header>
        <div className={styles.panelBody}>
          <div className={styles.hero}>
            <h2 id={headingId}>{credential ? 'Учитесь онлайн.' : 'Попробуйте онлайн-школу'}<br /><span>{credential ? 'Получите аттестат гособразца' : '14 дней бесплатно'}</span></h2>
            <p className={styles.heroGrade}>Для учеников 5–11 классов</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.panelPhoto} src={image} alt={imageAlt} width="1448" height="1086" />
            <p className={styles.heroDescription}>{credential ? 'Занимайтесь из любой точки мира по школьной программе.' : 'Познакомьтесь с уроками и платформой до выбора школы.'}</p>
          </div>

          <div className={styles.form}>
            <LeadForm
              compact
              schoolName="Онлайн-школа «Синергия»"
              source={source}
              defaultGoal={goal}
              title={credential ? 'Попробуйте школу 14 дней бесплатно' : 'Получить бесплатный доступ'}
              submitLabel="Попробовать 14 дней бесплатно"
              showGiftNotice={false}
            />
          </div>

          <section className={styles.details} aria-label="Об онлайн-школе Синергия">
            <h3>{credential ? 'Школа и аттестат — в одном месте' : 'Что вас ждёт в онлайн-школе'}</h3>
            <ul>{details.map(([title, text], index) => <li key={title}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ul>
          </section>

          <div className={styles.conditions}>
            <h3>Что важно знать</h3>
            <p>Бесплатный доступ предоставляется на 14 дней по спецпредложению ProSchools. Консультант «Синергии» уточнит порядок подключения, дату начала и доступные занятия. Дальнейшее обучение платное.</p>
            <p>Вопросы перевода, зачисления и аттестаций обсуждаются отдельно. Государственные ОГЭ и ЕГЭ проходят очно в Москве.</p>
          </div>
          <button type="button" className={styles.back} onClick={() => setOpen(false)}>Вернуться к выбору школы</button>
        </div>
      </dialog>, document.body)}
    </div>
  )
}
