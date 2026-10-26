'use client'

import { useEffect, useId, useRef, useState } from 'react'
import LeadForm from './LeadForm'
import styles from './CatalogSynergyOffer.module.css'

// Confirmed by the owner on 26.10.2026: a ProSchools-specific 14-day offer.
// The public school-university.com offer remains one week; do not change it globally.
const OFFER_SOURCE = 'Каталог школ: Синергия — 14 дней бесплатно'
const OFFER_GOAL = 'Спецпредложение ProSchools: 14 дней бесплатного доступа в онлайн-школу «Синергия», 5–11 класс'

export default function CatalogSynergyOffer() {
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
    document.body.style.overflow = 'hidden'
    window.ym?.(108789843, 'reachGoal', 'catalog_synergy_offer_open', { offer: 'proschools-14-days' })
    return () => {
      panel.close()
      document.body.style.overflow = previousOverflow
      opener.current?.focus({ preventScroll: true })
    }
  }, [open])

  return (
    <div data-catalog-synergy-offer>
      <button
        ref={opener}
        type="button"
        className={styles.banner}
        aria-haspopup="dialog"
        aria-controls={panelId}
        onClick={() => setOpen(true)}
      >
        <span className={styles.bannerCopy}>
          <span className={styles.bannerTitle}>Попробуйте <strong>14 дней бесплатно</strong><span>в онлайн-школе «Синергия»</span></span>
          <span className={styles.bannerDescription}>Школьная программа для 5–11 классов</span>
          <span className={styles.bannerCta}>Получить бесплатный доступ <span aria-hidden="true">→</span></span>
          <span className={styles.bannerNote}>Спецпредложение ProSchools</span>
        </span>
        {/* Generated campaign illustration; not a photograph of actual school staff. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.bannerPhoto} src="/offers/synergy/online-lesson-gpt-20261026.webp" alt="Иллюстрация: ученик занимается онлайн с преподавателем" width="1448" height="1086" loading="lazy" />
      </button>

      <dialog
        ref={dialog}
        id={panelId}
        className={styles.panel}
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
            <h2 id={headingId}>Попробуйте онлайн-школу<br /><span>14 дней бесплатно</span></h2>
            <p className={styles.heroGrade}>Для учеников 5–11 классов</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.panelPhoto} src="/offers/synergy/online-lesson-gpt-20261026.webp" alt="Иллюстрация онлайн-урока с преподавателем" width="1448" height="1086" />
            <p className={styles.heroDescription}>Познакомьтесь с уроками и платформой до выбора школы.</p>
          </div>

          <div className={styles.form}>
            <LeadForm
              compact
              schoolName="Онлайн-школа «Синергия»"
              source={OFFER_SOURCE}
              defaultGoal={OFFER_GOAL}
              title="Получить бесплатный доступ"
              submitLabel="Попробовать 14 дней бесплатно"
              showGiftNotice={false}
            />
          </div>

          <section className={styles.details} aria-label="Об онлайн-школе Синергия">
            <h3>Что вас ждёт в онлайн-школе</h3>
            <ul>
              <li><span aria-hidden="true">01</span><div><strong>Учёба на одной платформе</strong><p>Уроки, задания и учебные материалы собраны в личном кабинете.</p></div></li>
              <li><span aria-hidden="true">02</span><div><strong>Подходящий формат занятий</strong><p>Живые уроки и записи; состав занятий и поддержки зависит от выбранной программы.</p></div></li>
              <li><span aria-hidden="true">03</span><div><strong>Поддержка в течение учёбы</strong><p>Классный руководитель помогает с организационными вопросами, а родитель может следить за успеваемостью.</p></div></li>
            </ul>
          </section>

          <div className={styles.conditions}>
            <h3>Что важно знать</h3>
            <p>Бесплатный доступ предоставляется на 14 дней по спецпредложению ProSchools. Консультант «Синергии» уточнит порядок подключения, дату начала и доступные занятия. Дальнейшее обучение платное.</p>
            <p>Вопросы перевода, зачисления и аттестаций обсуждаются отдельно. Государственные ОГЭ и ЕГЭ проходят очно.</p>
          </div>
          <button type="button" className={styles.back} onClick={() => setOpen(false)}>Вернуться к выбору школы</button>
        </div>
      </dialog>
    </div>
  )
}
