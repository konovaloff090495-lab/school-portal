import type { Metadata } from 'next'
import Link from 'next/link'
import ExamShell, { AdInline, Crumbs, breadcrumbLd } from '@/components/exam/ExamShell'
import { capBlocks } from '@/components/exam/ExamDocPage'
import {
  type Exam, type ExamDoc, siteSubjects, docsFor, docsByKind, docPath, yearsOf, getDocText, minutesLabel, fmtSize, pagesWord,
  EXAM_NAME, CURRENT_YEAR, KIND_NAME,
} from '@/data/exam'

const SITE = 'https://pro-schools.ru'

/** Общие (кросс-предметные) страницы раздела: /ege/demoversii-2027/, /ege/izmeneniya-2027/, /oge/itogovoe-sobesedovanie/ … */
export interface SpecialPage {
  slug: string
  kind: 'demoversii' | 'varianty' | 'izmeneniya' | 'navigator' | 'kriterii' | 'mr' | 'dokumenty' | 'sochinenie' | 'sobesedovanie' | 'rezultaty' | 'shkala'
  year: number | null
  h1: string
  h1short: string
  title: string
  description: string
  keywords: string
  blurb: string
  hub: boolean
}

export function specialPages(exam: Exam): SpecialPage[] {
  const ex = EXAM_NAME[exam]; const exl = ex.toLowerCase()
  const out: SpecialPage[] = []
  for (const y of yearsOf(exam, 'demo')) {
    out.push({
      slug: `demoversii-${y}`, kind: 'demoversii', year: y, hub: y === CURRENT_YEAR,
      h1: `Демоверсии ${ex} ${y} ФИПИ по всем предметам — скачать PDF с ответами`, h1short: `Демоверсии ${ex} ${y}`,
      title: `Демоверсии ${ex} ${y} по всем предметам от ФИПИ: скачать PDF, ответы, спецификации и кодификаторы`,
      description: `Официальные демонстрационные варианты ${ex} ${y} года по всем предметам с сайта ФИПИ: PDF для скачивания, текст заданий, ответы и критерии, спецификации и кодификаторы. Сколько заданий, сколько времени и баллов по каждому предмету.`,
      keywords: `демоверсии ${exl} ${y}, демоверсия ${exl} ${y} фипи, демоверсии ${exl} ${y} по всем предметам, ${exl} ${y} демоверсии скачать`,
      blurb: `Все предметы: PDF, ответы, число заданий и баллов`,
    })
  }
  for (const y of yearsOf(exam, 'variant')) {
    out.push({
      slug: `varianty-${y}`, kind: 'varianty', year: y, hub: y === CURRENT_YEAR - 1,
      h1: `Открытые варианты ${ex} ${y} от ФИПИ — реальные КИМ досрочного периода по всем предметам`, h1short: `Реальные варианты ${ex} ${y}`,
      title: `Реальные варианты ${ex} ${y} по всем предметам с ответами — открытые КИМ ФИПИ (досрочный период)`,
      description: `Открытые варианты ${ex} ${y}: настоящие контрольные измерительные материалы досрочного периода, опубликованные ФИПИ после экзамена, по всем предметам. Скачать PDF, прорешать онлайн, свериться с официальными ответами.`,
      keywords: `варианты ${exl} ${y}, реальные варианты ${exl} ${y}, досрочный ${exl} ${y} варианты, открытые варианты ким ${exl} ${y}, варианты ${exl} с ответами`,
      blurb: `Настоящие КИМ ${y} с официальными ответами`,
    })
  }
  const izmYears = [...new Set([...yearsOf(exam, 'izmeneniya'), ...yearsOf(exam, 'spec')])].sort((a, b) => b - a).filter(y => y >= 2022)
  for (const y of izmYears) {
    out.push({
      slug: `izmeneniya-${y}`, kind: 'izmeneniya', year: y, hub: y === CURRENT_YEAR,
      h1: `Изменения в ${ex} ${y} по всем предметам — что нового в КИМ ФИПИ`, h1short: `Изменения ${ex} ${y}`,
      title: `Изменения ${ex} ${y}: что нового по каждому предмету — официальный документ ФИПИ и разбор по спецификациям`,
      description: `Все изменения в КИМ ${ex} ${y} года по сравнению с ${y - 1}: сводная таблица по предметам из спецификаций ФИПИ, официальный документ «Изменения в КИМ» в PDF и текстом, число заданий, время и первичные баллы.`,
      keywords: `изменения ${exl} ${y}, изменения в ${exl} ${y} по всем предметам, что изменилось в ${exl} ${y}, новое в ${exl} ${y} фипи`,
      blurb: `Сводка по предметам + документ ФИПИ`,
    })
  }
  for (const y of yearsOf(exam, 'mr').filter(y => docsByKind(exam, 'mr', y).some(d => d.stats?.avg))) {
    out.push({
      slug: `rezultaty-${y}`, kind: 'rezultaty', year: y, hub: y === CURRENT_YEAR - 1,
      h1: `Результаты ${ex} ${y} по предметам: средние баллы, участники, доля не сдавших — данные ФИПИ`, h1short: `Результаты ${ex} ${y}`,
      title: `Результаты ${ex} ${y} по всем предметам: средний тестовый балл, участники, не преодолевшие минимум — данные ФИПИ`,
      description: `Официальная статистика ${ex} ${y} года из аналитических материалов ФИПИ: средний тестовый балл по каждому предмету, число участников, доля не набравших минимальный балл и высокобалльников, что изменилось по сравнению с ${y - 1} годом.`,
      keywords: `результаты ${exl} ${y}, средний балл ${exl} ${y}, статистика ${exl} ${y}, итоги ${exl} ${y} по предметам, сколько сдавали ${exl} ${y}`,
      blurb: `Средние баллы и статистика ФИПИ`,
    })
  }
  for (const y of yearsOf(exam, 'scale').filter(y => docsByKind(exam, 'scale', y).some(d => d.scale?.length))) {
    out.push({
      slug: `shkala-perevoda-ballov-${y}`, kind: 'shkala', year: y, hub: true,
      h1: `Шкала перевода баллов ${ex} ${y} в оценки по всем предметам — официальные рекомендации Рособрнадзора`, h1short: `Шкала перевода баллов ${ex} ${y}`,
      title: `Шкала перевода баллов ${ex} ${y}: первичные баллы в оценку по всем предметам (таблица Рособрнадзора)`,
      description: `Официальная шкала перевода первичных баллов ${ex} ${y} в отметки «2», «3», «4», «5» по русскому языку, математике, физике, химии, биологии, географии, обществознанию, истории, литературе, информатике и иностранным языкам, плюс минимальные баллы для профильных классов — из рекомендаций Рособрнадзора.`,
      keywords: `шкала перевода баллов ${exl} ${y}, баллы ${exl} ${y} в оценку, перевод баллов ${exl} в оценки, сколько баллов на 4 ${exl}, минимальный балл ${exl} ${y}`,
      blurb: `Первичные баллы → оценка по каждому предмету`,
    })
  }
  out.push({
    slug: 'navigator', kind: 'navigator', year: null, hub: true,
    h1: `Навигатор самостоятельной подготовки к ${ex} от ФИПИ — все предметы и темы`, h1short: `Навигатор подготовки ФИПИ`,
    title: `Навигатор самостоятельной подготовки к ${ex} (ФИПИ): рекомендации и теория по темам для всех предметов`,
    description: `Официальный навигатор ФИПИ по самостоятельной подготовке к ${ex}: рекомендации по каждому предмету за ${yearsOf(exam, 'nav-rec').slice(-1)[0]}–${yearsOf(exam, 'nav-rec')[0]} годы и разделы теории по темам с примерами заданий. Бесплатно, PDF и текст.`,
    keywords: `навигатор подготовки ${exl}, навигатор самостоятельной подготовки фипи, самостоятельная подготовка к ${exl}, как подготовиться к ${exl} самостоятельно`,
    blurb: `Рекомендации и теория по темам от ФИПИ`,
  })
  if (docsByKind(exam, 'criteria').length) out.push({
    slug: 'kriterii-ocenivaniya', kind: 'kriterii', year: null, hub: true,
    h1: `Критерии оценивания ${ex} ${yearsOf(exam, 'criteria')[0]} по всем предметам — материалы ФИПИ для экспертов`, h1short: `Критерии оценивания ${ex}`,
    title: `Критерии оценивания ${ex} ${yearsOf(exam, 'criteria')[0]} по всем предметам: методические материалы ФИПИ для предметных комиссий`,
    description: `Как эксперты проверяют задания с развёрнутым ответом на ${ex}: официальные методические материалы ФИПИ для председателей и членов предметных комиссий по каждому предмету — критерии, образцы ответов, разбор оценивания.`,
    keywords: `критерии оценивания ${exl}, критерии оценивания ${exl} ${yearsOf(exam, 'criteria')[0]}, как проверяют ${exl}, эксперты ${exl} критерии`,
    blurb: `Как проверяют часть 2: материалы для экспертов`,
  })
  if (docsByKind(exam, 'mr').length) out.push({
    slug: 'metodicheskie-rekomendacii', kind: 'mr', year: null, hub: true,
    h1: `Методические рекомендации ФИПИ по итогам ${ex}: анализ типичных ошибок по всем предметам`, h1short: `Анализ ошибок ${ex} (ФИПИ)`,
    title: `Методические рекомендации ФИПИ по итогам ${ex} ${yearsOf(exam, 'mr')[0]}: типичные ошибки и статистика по всем предметам`,
    description: `Аналитические материалы ФИПИ по результатам ${ex} за ${yearsOf(exam, 'mr').slice(-1)[0]}–${yearsOf(exam, 'mr')[0]} годы: какие задания выполняют хуже всего, типичные ошибки участников, рекомендации по подготовке — по каждому предмету, PDF и текст.`,
    keywords: `методические рекомендации фипи ${exl}, анализ результатов ${exl}, типичные ошибки ${exl}, статистика ${exl} по заданиям`,
    blurb: `Что сдают хуже всего — по данным ФИПИ`,
  })
  if (docsByKind(exam, 'doc').length) out.push({
    slug: 'dokumenty', kind: 'dokumenty', year: null, hub: false,
    h1: `Нормативные документы ${ex}: порядок проведения, минимальные баллы, шкалы`, h1short: `Нормативные документы`,
    title: `Нормативные документы ${ex} ${CURRENT_YEAR}: приказы и письма Рособрнадзора и Минпросвещения`,
    description: `Официальные документы, регулирующие ${ex}: порядок проведения ГИА, минимальные баллы, рекомендации по переводу первичных баллов — в PDF с сайта ФИПИ.`,
    keywords: `порядок проведения ${exl}, минимальные баллы ${exl}, документы ${exl} рособрнадзор`,
    blurb: `Приказы и письма Рособрнадзора`,
  })
  if (exam === 'ege' && docsByKind(exam, 'sochinenie').length) out.push({
    slug: 'itogovoe-sochinenie', kind: 'sochinenie', year: null, hub: true,
    h1: `Итоговое сочинение ${CURRENT_YEAR - 1}/${CURRENT_YEAR}: структура, критерии, разделы банка тем — документы ФИПИ`, h1short: `Итоговое сочинение`,
    title: `Итоговое сочинение ${CURRENT_YEAR - 1}–${CURRENT_YEAR}: критерии оценивания, структура закрытого банка тем, комментарии ФИПИ (PDF и текст)`,
    description: `Все официальные документы ФИПИ по итоговому сочинению: структура закрытого банка тем, критерии оценивания, комментарии к разделам, образцы тем прошлых лет и методические рекомендации — бесплатно, PDF и текст.`,
    keywords: `итоговое сочинение ${CURRENT_YEAR}, темы итогового сочинения, критерии итогового сочинения, банк тем итогового сочинения фипи, итоговое сочинение ${CURRENT_YEAR - 1} ${CURRENT_YEAR}`,
    blurb: `Критерии, структура банка тем, документы ФИПИ`,
  })
  if (exam === 'oge' && docsByKind(exam, 'sobesedovanie').length) out.push({
    slug: 'itogovoe-sobesedovanie', kind: 'sobesedovanie', year: null, hub: true,
    h1: `Итоговое собеседование ${CURRENT_YEAR} по русскому языку: демоверсия, критерии, спецификация — документы ФИПИ`, h1short: `Итоговое собеседование`,
    title: `Итоговое собеседование ${CURRENT_YEAR} (9 класс): демоверсия ФИПИ, критерии оценивания, спецификация — PDF и текст`,
    description: `Официальные материалы ФИПИ к итоговому собеседованию по русскому языку в 9 классе: демонстрационный вариант, спецификация, критерии оценивания. Что будет на собеседовании и как его оценивают.`,
    keywords: `итоговое собеседование ${CURRENT_YEAR}, итоговое собеседование 9 класс демоверсия, критерии итогового собеседования, устное собеседование ${CURRENT_YEAR}`,
    blurb: `Демоверсия и критерии устного экзамена`,
  })
  return out
}
export function getSpecial(exam: Exam, slug: string): SpecialPage | undefined {
  return specialPages(exam).find(p => p.slug === slug)
}
export function specialMetadata(exam: Exam, p: SpecialPage): Metadata {
  return { title: p.title, description: p.description, keywords: p.keywords, alternates: { canonical: `${SITE}/${exam}/${p.slug}/` } }
}

function FileList({ docs, showTitle = true }: { docs: ExamDoc[]; showTitle?: boolean }) {
  return (
    <div className="ol-dl">
      {docs.flatMap(d => d.files.filter(f => f.ext === 'pdf').map(f => (
        <a key={f.url} href={f.url} target="_blank" rel="noopener">📄 {showTitle && d.title && d.files.length > 1 ? `${d.title}: ` : ''}{f.label} <small>PDF{f.pages ? ` · ${f.pages} ${pagesWord(f.pages)}` : ''}{f.size ? ` · ${fmtSize(f.size)}` : ''}</small></a>
      )))}
    </div>
  )
}

function DocText({ d, cap = 40_000, open = false }: { d: ExamDoc; cap?: number; open?: boolean }) {
  const t = getDocText(d.id)
  if (!t) return null
  const { blocks } = capBlocks(t.texts, cap)
  return (
    <>
      {blocks.map((b, i) => b.paras.length < 3 ? null : (
        <section className="ol-text" key={i}>
          <details open={open && i === 0}>
            <summary>{b.label} — текст документа</summary>
            <p className="note">Текст извлечён из PDF ФИПИ автоматически; таблицы и формулы могут отображаться неточно.</p>
            {b.paras.map((p, j) => <p key={j}>{p}</p>)}
          </details>
        </section>
      ))}
    </>
  )
}

export default function ExamSpecialPage({ exam, p }: { exam: Exam; p: SpecialPage }) {
  const ex = EXAM_NAME[exam]
  const subjects = siteSubjects(exam)
  const ld = [breadcrumbLd([{ name: 'Главная', href: '/' }, { name: ex, href: `/${exam}/` }, { name: p.h1short, href: `/${exam}/${p.slug}/` }]),
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: p.h1, url: `${SITE}/${exam}/${p.slug}/`, inLanguage: 'ru' }]
  const siblings = specialPages(exam).filter(x => x.slug !== p.slug && (x.kind !== p.kind || x.hub || x.kind === 'demoversii'))

  let body: React.ReactNode = null
  if (p.kind === 'demoversii' || p.kind === 'varianty') {
    const kind = p.kind === 'demoversii' ? 'demo' : 'variant'
    const rows = subjects.map(s => ({ s, doc: docsFor(exam, s, kind).find(d => d.year === p.year), spec: docsFor(exam, s, 'spec').find(d => d.year === p.year), codif: docsFor(exam, s, 'codif').find(d => d.year === p.year) })).filter(r => r.doc)
    body = (
      <>
        <section className="ol-text ol-guide">
          <h2>{p.kind === 'demoversii' ? `Демоверсии ${ex} ${p.year} по предметам` : `Открытые варианты ${ex} ${p.year} по предметам`}</h2>
          <table>
            <thead><tr><th>Предмет</th><th>{p.kind === 'demoversii' ? 'Демоверсия' : 'Вариант'}</th><th>Заданий</th><th>Время</th><th>Перв. балл</th>{p.kind === 'demoversii' && <th>Документы</th>}</tr></thead>
            <tbody>
              {rows.map(({ s, doc, spec, codif }) => {
                const sm = { ...(doc!.summary ?? {}), ...(spec?.summary ?? {}) }
                return (
                  <tr key={s.slug}>
                    <td>{s.icon} <Link href={`/${exam}/${s.slug}/`}>{s.name}</Link></td>
                    <td><Link href={docPath(doc!)!}>{KIND_NAME[doc!.kind]} {p.year} →</Link></td>
                    <td>{sm.tasks ?? '—'}</td><td>{sm.minutes ? minutesLabel(sm.minutes) : '—'}</td><td>{sm.maxPrimary ?? '—'}</td>
                    {p.kind === 'demoversii' && <td>{spec && <Link href={docPath(spec)!}>спецификация</Link>}{spec && codif ? ' · ' : ''}{codif && <Link href={docPath(codif)!}>кодификатор</Link>}</td>}
                  </tr>
                )
              })}
            </tbody>
          </table>
          {p.kind === 'demoversii' && <p>Демоверсия показывает формат каждого задания и содержит ответы с критериями. Точное число заданий, время и первичные баллы — по спецификации ФИПИ того же года. Изменения по предметам — на странице <Link href={`/${exam}/izmeneniya-${p.year}/`}>«Изменения {ex} {p.year}»</Link>.</p>}
          {p.kind === 'varianty' && <p>Открытые варианты — это настоящие КИМ досрочного периода, которые ФИПИ публикует после экзамена. Используйте их как пробник: засеките время по спецификации и сверьтесь с официальными ответами.</p>}
        </section>
        <section className="gdz-section">
          <div className="gdz-section-head"><h2>Другие годы</h2></div>
          <div className="ol-stage-block"><div className="rows">
            {yearsOf(exam, kind).filter(y => y !== p.year).map(y => <Link key={y} href={`/${exam}/${p.kind}-${y}/`}>{y}</Link>)}
          </div></div>
        </section>
      </>
    )
  } else if (p.kind === 'izmeneniya') {
    const docs = docsByKind(exam, 'izmeneniya', p.year)
    const rows = subjects.map(s => ({ s, spec: docsFor(exam, s, 'spec').find(d => d.year === p.year), prev: docsFor(exam, s, 'spec').find(d => d.year === (p.year ?? 0) - 1) })).filter(r => r.spec)
    body = (
      <>
        {docs.length > 0 && <FileList docs={docs} />}
        <section className="ol-text ol-guide">
          <h2>Изменения {ex} {p.year} по предметам — сводка из спецификаций ФИПИ</h2>
          <table>
            <thead><tr><th>Предмет</th><th>Заданий</th><th>Перв. балл</th><th>Что изменилось</th></tr></thead>
            <tbody>
              {rows.map(({ s, spec, prev }) => {
                const sm = spec!.summary ?? {}; const pm = prev?.summary ?? {}
                const diff = (a?: number, b?: number) => a && b && a !== b ? ` (было ${b})` : ''
                return (
                  <tr key={s.slug}>
                    <td>{s.icon} <Link href={`/${exam}/${s.slug}/`}>{s.name}</Link></td>
                    <td>{sm.tasks ?? '—'}{diff(sm.tasks, pm.tasks)}</td>
                    <td>{sm.maxPrimary ?? '—'}{diff(sm.maxPrimary, pm.maxPrimary)}</td>
                    <td>{sm.changes?.length ? sm.changes.join(' ') : 'нет данных'} <Link href={docPath(spec!)!}>→ спецификация</Link></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
        {docs.map(d => <DocText key={d.id} d={d} open />)}
      </>
    )
  } else if (p.kind === 'rezultaty') {
    // базовая математика оценивается по пятибалльной шкале: отчёт ФИПИ общий, средний тестовый балл относится к профилю
    const rows = subjects.filter(s => s.level !== 'base').map(s => ({ s, mr: docsFor(exam, s, 'mr').find(d => d.year === p.year) })).filter(r => r.mr && r.mr.stats)
    body = (
      <>
        <section className="ol-text ol-guide">
          <h2>Средний балл {ex} {p.year} по предметам</h2>
          <table>
            <thead><tr><th>Предмет</th><th>Средний тестовый балл</th><th>Источник</th></tr></thead>
            <tbody>
              {rows.map(({ s, mr }) => (
                <tr key={s.slug}>
                  <td>{s.icon} <Link href={`/${exam}/${s.slug}/`}>{s.name}</Link></td>
                  <td><b>{mr!.stats!.avg ? String(mr!.stats!.avg).replace('.', ',') : '—'}</b></td>
                  <td><Link href={docPath(mr!)!}>анализ ФИПИ →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>Средний тестовый балл взят из методических рекомендаций ФИПИ, подготовленных на основе анализа типичных ошибок участников {ex} {p.year} года (основной период). Где ФИПИ не называет показатель в тексте явно, стоит прочерк — см. полный документ по ссылке. Ниже — дословные выдержки о числе участников, минимальном балле и доле не сдавших по каждому предмету.</p>
        </section>
        {rows.map(({ s, mr }) => mr!.stats!.excerpt?.length ? (
          <section className="ol-text" key={s.slug}>
            <h2>{s.icon} {ex} {p.year} по {s.dat}: что говорит ФИПИ</h2>
            {mr!.stats!.excerpt!.map((e, i) => <p key={i}>{e}</p>)}
            <p><Link href={docPath(mr!)!} style={{ color: 'var(--coral-600)', fontWeight: 700 }}>Полный анализ результатов по {s.dat} →</Link></p>
          </section>
        ) : null)}
        <section className="gdz-section">
          <div className="gdz-section-head"><h2>Другие годы</h2></div>
          <div className="ol-stage-block"><div className="rows">
            {specialPages(exam).filter(x => x.kind === 'rezultaty' && x.year !== p.year).map(x => <Link key={x.slug} href={`/${exam}/${x.slug}/`}>{x.year}</Link>)}
          </div></div>
        </section>
      </>
    )
  } else if (p.kind === 'shkala') {
    const doc = docsByKind(exam, 'scale', p.year).find(d => d.scale?.length)!
    const subjOf = (fipi: string) => subjects.find(s => s.fipi === fipi)
    body = (
      <>
        <section className="ol-text ol-guide">
          <h2>Перевод первичных баллов {ex} {p.year} в отметку</h2>
          <table>
            <thead><tr><th>Предмет</th><th>Макс. балл</th><th>«2»</th><th>«3»</th><th>«4»</th><th>«5»</th><th>В профильный класс</th></tr></thead>
            <tbody>
              {doc.scale!.map(r => {
                const s = subjOf(r.subject)
                return (
                  <tr key={r.subject}>
                    <td>{s ? <Link href={`/${exam}/${s.slug}/`}>{s.icon} {s.name}</Link> : r.name}</td>
                    <td>{r.max}</td>
                    <td>{r.marks['2'][0]}–{r.marks['2'][1]}</td><td>{r.marks['3'][0]}–{r.marks['3'][1]}</td><td>{r.marks['4'][0]}–{r.marks['4'][1]}</td><td>{r.marks['5'][0]}–{r.marks['5'][1]}</td>
                    <td>{r.profile ? `от ${r.profile}` : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p>Таблица составлена по письму Рособрнадзора с рекомендациями по переводу суммы первичных баллов за экзаменационные работы {ex} {p.year} в пятибалльную систему. Для русского языка отметки «4» и «5» дополнительно требуют минимума баллов за грамотность (ГК1–ГК4), для математики — не менее 2 баллов за задания по геометрии; подробности — в документе ниже. Окончательное решение о шкале принимает региональный орган управления образованием.</p>
        </section>
        <FileList docs={[doc]} />
        <DocText d={doc} cap={60_000} />
      </>
    )
  } else if (p.kind === 'navigator') {
    body = (
      <>
        {subjects.map(s => {
          const recs = docsFor(exam, s, 'nav-rec').filter(d => docPath(d)); const topics = docsFor(exam, s, 'nav-topic').filter(d => docPath(d))
          if (!recs.length && !topics.length) return null
          return (
            <section className="gdz-section" key={s.slug}>
              <div className="gdz-section-head"><h2>{s.icon} {ex} по {s.dat}</h2><Link className="more" href={`/${exam}/${s.slug}/`}>Все материалы →</Link></div>
              <div className="ol-stage-block">
                {recs.length > 0 && <><h3>Рекомендации по самостоятельной подготовке</h3><div className="rows" style={{ marginBottom: 10 }}>{recs.map(d => <Link key={d.id} href={docPath(d)!}>{d.year} год</Link>)}</div></>}
                {topics.length > 0 && <><h3>Теория по темам</h3><div className="rows">{topics.map(d => <Link key={d.id} href={docPath(d)!}>{d.title}</Link>)}</div></>}
              </div>
            </section>
          )
        })}
      </>
    )
  } else if (p.kind === 'kriterii' || p.kind === 'mr') {
    const kind = p.kind === 'kriterii' ? 'criteria' : 'mr'
    body = (
      <>
        {yearsOf(exam, kind).map(y => (
          <section className="gdz-section" key={y}>
            <div className="gdz-section-head"><h2>{KIND_NAME[kind]} {ex} {y}</h2></div>
            <div className="ol-stage-block"><div className="rows">
              {subjects.map(s => docsFor(exam, s, kind).find(d => d.year === y)).filter((d): d is ExamDoc => !!d && !!docPath(d)).map(d => {
                const s = subjects.find(x => x.fipi === d.subject && (d.level === null || x.level === d.level))!
                return <Link key={d.id} href={docPath(d)!}>{s.icon} {s.name}</Link>
              })}
            </div></div>
          </section>
        ))}
        {(() => { const gen = docsByKind(exam, kind).filter(d => !d.subject); return gen.length ? <section className="gdz-section"><div className="gdz-section-head"><h2>Общие документы</h2></div><FileList docs={gen} /></section> : null })()}
      </>
    )
  } else {
    const kind = p.kind === 'dokumenty' ? 'doc' : p.kind
    const docs = docsByKind(exam, kind)
    body = (
      <>
        <FileList docs={docs} />
        {docs.map(d => <DocText key={d.id} d={d} cap={80_000} />)}
      </>
    )
  }

  return (
    <ExamShell exam={exam} suffix="ex-spec" ld={ld}>
      <Crumbs items={[{ name: 'Главная', href: '/' }, { name: ex, href: `/${exam}/` }, { name: p.h1short }]} />
      <div className="gdz-pagehead">
        <div className="gdz-eyebrow"><span className="dot"></span>{ex} · ФИПИ{p.year ? ` · ${p.year}` : ''}</div>
        <h1>{p.h1}</h1>
        <p className="lede">{p.description}</p>
      </div>
      <AdInline slot="mobile" suffix="ex-spec" />
      {body}
      <AdInline slot={2} suffix="ex-spec" />
      <section className="gdz-section">
        <div className="gdz-section-head"><h2>Другие справочники {ex}</h2></div>
        <div className="ol-stage-block"><div className="rows">
          {siblings.filter(x => x.hub || x.kind === 'demoversii').slice(0, 14).map(x => <Link key={x.slug} href={`/${exam}/${x.slug}/`}>{x.h1short}</Link>)}
        </div></div>
      </section>
      <AdInline slot={3} suffix="ex-spec" />
    </ExamShell>
  )
}
