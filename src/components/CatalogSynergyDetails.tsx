'use client'

import { useRef } from 'react'
import LeadForm from './LeadForm'
import { trackCatalogOffer, type CatalogOfferKind, type CatalogOfferFormPosition } from '@/lib/catalog-offer-tracking'
import styles from './CatalogSynergyOffer.module.css'

const OFFICIAL = 'https://school-university.com'
const teachers = [
  { name: 'Ирина Николаевна Войнова', subject: 'Математика', experience: '10 лет педагогического стажа', education: 'Высшее образование и профессиональная переподготовка по преподаванию математики.', image: 'teacher-voynova-20261026.webp' },
  { name: 'Александра Владимировна Соляных', subject: 'Русский язык и литература', experience: '9 лет педагогического стажа', education: 'Педагогическое образование. Также преподаёт русский язык иностранным ученикам.', image: 'teacher-solyanyh-20261026.webp' },
  { name: 'Анна Алексеевна Шандорина', subject: 'Английский язык', experience: '7 лет педагогического стажа', education: 'Педагогическое образование и международный сертификат преподавателя TEFL.', image: 'teacher-shandorina-20261026.webp' },
]
const questions = [
  ['Можно учиться из другой страны?', 'Да, к платформе и занятиям можно подключаться из любой точки мира. Расписание живых уроков, часовой пояс и условия зачисления обсудите с консультантом. Для ОГЭ и ЕГЭ потребуется приехать в Москву.'],
  ['Что входит в бесплатные 14 дней?', 'Это специальный пробный доступ для заявок с ProSchools. Консультант уточнит дату подключения и доступные занятия выбранного класса. Пробный период помогает познакомиться с форматом; дальнейшее обучение платное.'],
  ['Кто выдаёт аттестат?', 'По информации школы, обучение и зачисление проходят на базе Университета «Синергия», который самостоятельно выдаёт аттестаты государственного образца за 9 и 11 классы. Для получения аттестата нужно освоить программу и пройти итоговую аттестацию.'],
  ['Экстернат — это живые уроки по расписанию?', 'На экстернате основа занятий — записи уроков и самостоятельная работа на платформе. Можно выбрать прохождение одного класса за год или ускоренную программу двух классов за год. Пары классов, нагрузку и сроки согласуют при поступлении.'],
  ['Можно перейти в течение учебного года?', 'Возможность перевода зависит от класса, выбранной программы и сроков аттестаций. Консультант подскажет порядок зачисления и список документов. Сначала уточните условия, затем принимайте решение о переводе.'],
  ['Сколько стоит обучение после пробного периода?', 'Стоимость зависит от класса, тарифа и темпа обучения. У школы есть разные варианты оплаты, в том числе рассрочка через банк-партнёр. Попросите консультанта рассчитать полную стоимость и назвать условия до заключения договора.'],
]

export default function CatalogSynergyDetails({ kind, source, goal }: { kind: CatalogOfferKind; source: string; goal: string }) {
  const credential = kind === 'attestat'
  const sections = useRef<Record<string, HTMLElement | null>>({})
  const jump = (target: string) => {
    const section = sections.current[target]
    section?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
    section?.querySelector('input')?.focus({ preventScroll: true })
  }
  const leadCta = (placement: 'programs' | 'externat') => {
    trackCatalogOffer(kind, 'cta_click', placement)
    jump('bottom-form')
  }
  const form = (placement: CatalogOfferFormPosition, title: string, intro: string) => (
    <section ref={element => { sections.current[`${placement}-form`] = element }} className={styles.formSection} aria-label={title}>
      <p className={styles.formIntro}>{intro}</p>
      <div className={styles.form}>
        <LeadForm compact schoolName="Онлайн-школа «Синергия»" source={`${source} · ${placement === 'middle' ? 'середина' : 'конец'} панели`} defaultGoal={goal} title={title} submitLabel="Попробовать 14 дней бесплатно" showGiftNotice={false} offerTracking={{ kind, placement }} />
      </div>
    </section>
  )
  const documents = (
    <section ref={element => { sections.current.documents = element }} className={`${styles.landingSection} ${styles.documents}`} aria-label="Лицензия, аккредитация и аттестат">
      <span className={styles.eyebrow}>Официальное школьное образование</span>
      <h3>Аттестат — не просто сертификат о курсе</h3>
      <p>Онлайн-школа «Синергия» работает на лицензии и государственной аккредитации Университета «Синергия» по программам основного и среднего общего образования.</p>
      <div className={styles.documentGrid}>
        <div><span>01</span><h4>Лицензия</h4><p>Подтверждает право организации вести образовательную деятельность. Сведения доступны в реестре Рособрнадзора.</p></div>
        <div><span>02</span><h4>Аккредитация</h4><p>На официальном сайте указана аккредитация школьных программ — основного общего и среднего общего образования.</p></div>
      </div>
      <div className={styles.diplomaPath}><strong>После 9 класса — аттестат об основном общем образовании.<br />После 11 класса — о среднем общем образовании.</strong><p>Школа зачисляет ученика в свой контингент и выдаёт аттестат самостоятельно. Перед поступлением уточните, что зачисление и аттестация входят в выбранную программу.</p></div>
      <p className={styles.examNote}><strong>Обучение — онлайн. ОГЭ и ЕГЭ — очно в Москве.</strong> Для получения аттестата необходимо пройти программу и итоговые испытания; пробный доступ не заменяет зачисление.</p>
      <div className={styles.sourceLinks}><a href="https://islod.obrnadzor.gov.ru/rlic/" target="_blank" rel="noopener noreferrer">Реестр лицензий ↗</a><a href={`${OFFICIAL}/s-attestatom/`} target="_blank" rel="noopener noreferrer">Аттестат и документы школы ↗</a></div>
    </section>
  )

  return <>
    <nav className={styles.sectionNav} aria-label="Разделы об онлайн-школе">
      {[['school', 'О школе'], ['teachers', 'Преподаватели'], ['documents', 'Аттестат'], ['externat', 'Экстернат']].map(([target, label]) => <button type="button" key={target} onClick={() => jump(target)}>{label}</button>)}
    </nav>

    <section ref={element => { sections.current.school = element }} className={styles.landingSection} aria-label="О школе Синергия">
      <span className={styles.eyebrow}>Школа, которая помещается в ноутбуке</span>
      <h3>Полноценная школьная программа. Больше свободы для вашей семьи.</h3>
      <p>Онлайн-школа «Синергия» объединяет учебную платформу, педагогов и сопровождение ученика. Ребёнок изучает предметы своего класса, выполняет задания и готовится к аттестациям, а семья выбирает подходящий формат занятий.</p>
      <div className={styles.schoolFacts}><div><strong>5–11</strong><span>классы школьной программы</span></div><div><strong>40</strong><span>педагогов в составе школы</span></div><div><strong>10 000+</strong><span>материалов на платформе</span></div></div>
      <div className={styles.benefitRows}>
        <div><span>01</span><div><h4>Понятно, что делать сегодня</h4><p>Уроки, конспекты, тесты и тренажёры собраны в личном кабинете. Проверка заданий и отчёты помогают видеть прогресс.</p></div></div>
        <div><span>02</span><div><h4>Есть к кому обратиться</h4><p>Классный руководитель помогает с организацией учёбы, вопросы по заданиям можно задать в чате. Объём сопровождения зависит от тарифа.</p></div></div>
        <div><span>03</span><div><h4>Учёба вписывается в жизнь</h4><p>Можно совместить школьную программу с переездом, тренировками и творчеством. Для самостоятельного темпа предусмотрен экстернат.</p></div></div>
      </div>
    </section>

    {credential && documents}

    <section ref={element => { sections.current.teachers = element }} className={styles.landingSection} aria-label="Преподаватели Синергии">
      <span className={styles.eyebrow}>Знакомство до поступления</span>
      <h3>За экраном — живые преподаватели</h3>
      <p>Школа публикует анкеты учителей: образование, стаж и предметы. По данным официального сайта, педагоги проходят предметную диагностику МЦКО на экспертном уровне. Вот несколько преподавателей из команды:</p>
      <div className={styles.teachers}>
        {teachers.map(teacher => <article key={teacher.name} className={styles.teacher}>
          {/* Official school portraits, not AI-generated images. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/offers/synergy/${teacher.image}`} alt={teacher.name} width="88" height="110" loading="lazy" />
          <div><span>{teacher.subject}</span><h4>{teacher.name}</h4><strong>{teacher.experience}</strong><p>{teacher.education}</p></div>
        </article>)}
      </div>
      <p className={styles.smallNote}>Фото и сведения — с официального сайта школы. Преподавателей конкретного класса и расписание уточните при консультации.</p>
      <a className={styles.textLink} href={`${OFFICIAL}/prepodavateli/`} target="_blank" rel="noopener noreferrer">Познакомиться со всей командой ↗</a>
    </section>

    {form('middle', 'Познакомьтесь со школой за 14 дней', 'Посмотрите, как устроены уроки и платформа, и задайте вопросы консультанту до выбора программы.')}

    <section className={styles.landingSection} aria-label="Форматы онлайн-обучения">
      <span className={styles.eyebrow}>Формат под ребёнка, а не наоборот</span>
      <h3>Больше самостоятельности или больше поддержки?</h3>
      <p>У школы есть несколько форматов. Состав занятий, зачисление, проверки домашних работ и сопровождение зависят от выбранного тарифа.</p>
      <div className={styles.programCards}>
        <div><span>«Комфорт»</span><h4>Вебинары и понятная структура</h4><p>Платформа, занятия в формате вебинаров, автоматическая проверка заданий, отчёт об успеваемости и помощь классного руководителя.</p></div>
        <div><span>«Премиум»</span><h4>Мини-классы и больше обратной связи</h4><p>В школьной программе предусмотрены мини-классы, ручная проверка домашних заданий и более подробные отчёты для родителей.</p></div>
      </div>
      <p className={styles.smallNote}>Индивидуальные занятия с репетитором и дополнительные курсы подготовки могут оформляться отдельно. Программу, полный состав услуг и стоимость уточнит консультант.</p>
      <button type="button" className={styles.inlineCta} onClick={() => leadCta('programs')}>Подобрать формат и попробовать бесплатно <span aria-hidden="true">→</span></button>
    </section>

    <section ref={element => { sections.current.externat = element }} className={`${styles.landingSection} ${styles.externat}`} aria-label="Программа экстерната">
      <span className={styles.eyebrow}>Для тех, кому нужен свой темп</span>
      <h3>Экстернат: один или два класса за учебный год</h3>
      <p>Это отдельная программа с самостоятельными занятиями по записям уроков, конспектам и тренажёрам. Живых уроков по обязательному расписанию здесь нет: важно уметь планировать учёбу и регулярно заниматься.</p>
      <ul className={styles.checklist}><li>Выбор темпа: один класс за год или доступная пара классов за год.</li><li>Домашние задания с автопроверкой и сопровождение наставника.</li><li>Прикрепление к школе и промежуточные аттестации онлайн по условиям программы.</li><li>Путь к аттестату после прохождения программы и очных итоговых экзаменов.</li></ul>
      <p className={styles.smallNote}>Классы, сроки приёма, нагрузку и периоды аттестаций согласуют индивидуально. Ускоренный формат требует самостоятельности и не означает сокращённую школьную программу.</p>
      <button type="button" className={styles.inlineCta} onClick={() => leadCta('externat')}>Узнать, подходит ли нам экстернат <span aria-hidden="true">→</span></button>
      <a className={styles.textLink} href={`${OFFICIAL}/externat/`} target="_blank" rel="noopener noreferrer">Официальная программа экстерната ↗</a>
    </section>

    {!credential && documents}

    <section className={styles.landingSection} aria-label="Поступление в онлайн-школу">
      <span className={styles.eyebrow}>Переход без лишней неизвестности</span>
      <h3>Как начать учиться</h3>
      <ol className={styles.enrollment}><li><span>1</span><div><h4>Обсудите задачу семьи</h4><p>Назовите класс и желаемый формат: обычный учебный год, больше сопровождения или экстернат.</p></div></li><li><span>2</span><div><h4>Познакомьтесь с платформой</h4><p>Уточните условия спецпредложения и воспользуйтесь пробным доступом на 14 дней.</p></div></li><li><span>3</span><div><h4>Выберите программу и оформите документы</h4><p>Консультант объяснит условия зачисления, стоимость, договор и аттестации. Для выпускных классов отдельно проверьте сроки экзаменов.</p></div></li><li><span>4</span><div><h4>Получите доступ к учёбе</h4><p>После подключения программы ученик работает на платформе, а семья понимает расписание и порядок связи со школой.</p></div></li></ol>
    </section>

    <section className={`${styles.landingSection} ${styles.familySupport}`} aria-label="Общение и поддержка семьи">
      <span className={styles.eyebrow}>Школа — это ещё и общение</span>
      <h3>Не только уроки и домашние задания</h3>
      <p>У школы есть групповые внеурочные занятия: языки, творчество, олимпиадные направления и другие интересы. Это возможность общаться со сверстниками после уроков.</p>
      <p>В зависимости от программы доступны помощь психолога и профориентация. Родители получают отчёт об учёбе, а организационные вопросы можно решать с классным руководителем.</p>
      <p className={styles.smallNote}>Кружки, психолог и профориентация входят не во все тарифы. Актуальное расписание и объём поддержки уточняйте для выбранного класса.</p>
      <a className={styles.textLink} href={`${OFFICIAL}/vneurochka/`} target="_blank" rel="noopener noreferrer">Занятия после уроков ↗</a>
    </section>

    <section className={styles.landingSection} aria-label="Вопросы об онлайн-школе">
      <span className={styles.eyebrow}>Перед тем как решиться</span>
      <h3>Ответы на вопросы родителей</h3>
      <div className={styles.faq}>{questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div>
    </section>

    {form('bottom', credential ? 'Начните путь к аттестату — попробуйте школу' : 'Попробуйте онлайн-школу 14 дней бесплатно', 'Оставьте контакты: консультант расскажет о школе, поможет выбрать программу и уточнит подключение пробного доступа.')}
    <p className={styles.sourceNote}>Сведения о школе, преподавателях и программах проверены по <a href={OFFICIAL} target="_blank" rel="noopener noreferrer">официальному сайту «Синергии»</a> 26 октября 2026 года. Условия выбранной программы закрепляются в договоре.</p>
  </>
}
