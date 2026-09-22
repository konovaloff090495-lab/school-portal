import type { Metadata } from 'next'
import Link from 'next/link'
import ExamShell, { AdInline, Crumbs, breadcrumbLd } from '@/components/exam/ExamShell'
import OnlineLeadCta from '@/components/OnlineLeadCta'
import {
  type Exam, type SiteSubject, type DocKind, docsFor, docPath, currentSummary, minutesLabel, pagesWord,
  EXAM_NAME, KIND_PLURAL, CURRENT_YEAR, PREV_YEAR, siteSubjects,
} from '@/data/exam'

const SITE = 'https://pro-schools.ru'
const KINDS: DocKind[] = ['demo', 'variant', 'spec', 'codif', 'nav-rec', 'mr', 'criteria']

export function subjectMetadata(exam: Exam, s: SiteSubject): Metadata {
  const ex = EXAM_NAME[exam]; const sm = currentSummary(exam, s)
  const hasVar = docsFor(exam, s, 'variant').length > 0
  return {
    // Вордстат: «егэ по математике 2027», «демоверсия егэ 2027 по …», «варианты егэ по …», «кодификатор егэ по …»
    title: `${ex} ${CURRENT_YEAR} по ${s.dat}: демоверсия ФИПИ, ${hasVar ? 'реальные варианты, ' : ''}кодификатор, разбор заданий`,
    description: `Всё для подготовки к ${ex} по ${s.dat} в ${CURRENT_YEAR} году: официальная демоверсия${sm.tasks ? ` (${sm.tasks} заданий${sm.minutes ? `, ${minutesLabel(sm.minutes)}` : ''}${sm.maxPrimary ? `, ${sm.maxPrimary} первичных баллов` : ''})` : ''}, спецификация и кодификатор ФИПИ, ${hasVar ? `открытые варианты ${PREV_YEAR} с ответами, ` : ''}навигатор подготовки, методические рекомендации и разбор каждого задания. Бесплатно, PDF и текст.`,
    keywords: `${ex.toLowerCase()} по ${s.dat} ${CURRENT_YEAR}, ${ex.toLowerCase()} ${s.short.toLowerCase()}, подготовка к ${ex.toLowerCase()} по ${s.dat}, демоверсия ${ex.toLowerCase()} ${CURRENT_YEAR} ${s.short.toLowerCase()}, задания ${ex.toLowerCase()} ${s.short.toLowerCase()}`,
    alternates: { canonical: `${SITE}/${exam}/${s.slug}/` },
  }
}

export default function ExamSubjectPage({ exam, s }: { exam: Exam; s: SiteSubject }) {
  const ex = EXAM_NAME[exam]
  const sm = currentSummary(exam, s)
  const demo = docsFor(exam, s, 'demo').find(d => d.year === CURRENT_YEAR) ?? docsFor(exam, s, 'demo')[0]
  const groups = KINDS.map(k => ({ kind: k, docs: docsFor(exam, s, k).filter(d => docPath(d)) })).filter(g => g.docs.length)
  const topics = docsFor(exam, s, 'nav-topic').filter(d => docPath(d))
  const tasks = s.tasks?.tasks ?? []
  const part1 = tasks.filter(t => t.maxScore === 1), part2 = tasks.filter(t => t.maxScore > 1)
  const other: Exam = exam === 'ege' ? 'oge' : 'ege'
  const twin = siteSubjects(other).find(x => x.fipi === s.fipi)
  const olimpSlug: Record<string, string> = { khimiya: 'himiya', 'angliiskiy-yazyk': 'angliyskiy-yazyk', 'nemetskiy-yazyk': 'nemeckiy-yazyk', 'frantsuzskiy-yazyk': 'francuzskiy-yazyk' }
  const url = `${SITE}/${exam}/${s.slug}/`

  const faq = [
    { q: `Сколько заданий в ${ex} ${sm.year ?? CURRENT_YEAR} по ${s.dat}?`, a: sm.tasks ? `По спецификации ФИПИ ${sm.year} года экзаменационная работа содержит ${sm.tasks} заданий${sm.minutes ? `, на выполнение отводится ${minutesLabel(sm.minutes)} (${sm.minutes} минут)` : ''}${sm.maxPrimary ? `, максимальный первичный балл — ${sm.maxPrimary}` : ''}.` : `Структура работы описана в спецификации ФИПИ — см. документы на этой странице.` },
    { q: `Где скачать демоверсию ${ex} ${CURRENT_YEAR} по ${s.dat}?`, a: demo ? `Официальная демоверсия ФИПИ ${demo.year} года по ${s.dat} доступна на этой странице: PDF для скачивания, текст заданий и ответы — ${SITE}${docPath(demo)}.` : 'Демоверсия появится сразу после публикации ФИПИ.' },
    { q: `Что изменилось в ${ex} ${CURRENT_YEAR} по ${s.dat}?`, a: sm.changes?.length ? sm.changes.join(' ') : 'Изменения структуры и содержания КИМ по данным ФИПИ отсутствуют.' },
  ]
  const ld = [
    breadcrumbLd([{ name: 'Главная', href: '/' }, { name: ex, href: `/${exam}/` }, { name: s.name, href: `/${exam}/${s.slug}/` }]),
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${ex} по ${s.dat}: материалы ФИПИ`, url, inLanguage: 'ru' },
  ]

  return (
    <ExamShell exam={exam} suffix="ex-subj" ld={ld} active={s.slug}>
      <Crumbs items={[{ name: 'Главная', href: '/' }, { name: ex, href: `/${exam}/` }, { name: s.name }]} />
      <div className="gdz-pagehead">
        <div className="gdz-eyebrow"><span className="dot"></span>{s.icon} {ex} · {s.klass} класс · материалы ФИПИ</div>
        <h1>{ex} {CURRENT_YEAR} по {s.dat}: демоверсия, варианты, кодификатор и разбор заданий</h1>
        <p className="lede">
          {sm.tasks ? `Экзамен ${sm.year} года по ${s.dat} состоит из ${sm.tasks} заданий${sm.minutes ? `, на работу отводится ${minutesLabel(sm.minutes)}` : ''}${sm.maxPrimary ? `, максимальный первичный балл — ${sm.maxPrimary}` : ''}. ` : ''}
          На этой странице собраны официальные материалы ФИПИ: демоверсии {ex} по годам с ответами и критериями, спецификации и кодификаторы,
          {groups.some(g => g.kind === 'variant') ? ' реальные открытые варианты досрочного периода,' : ''} навигатор самостоятельной подготовки и методические рекомендации по итогам прошлых экзаменов — всё бесплатно, в PDF и текстом.
        </p>
      </div>

      {(sm.tasks || sm.minutes || sm.maxPrimary) && (
        <div className="ex-facts">
          {sm.tasks ? <div><b>{sm.tasks}</b><span>заданий</span></div> : null}
          {sm.minutes ? <div><b>{minutesLabel(sm.minutes)}</b><span>на выполнение</span></div> : null}
          {sm.maxPrimary ? <div><b>{sm.maxPrimary}</b><span>первичных баллов</span></div> : null}
          <div><b>{sm.changes && sm.changes.length && !/отсутствуют/i.test(sm.changes[0]) ? 'есть' : 'нет'}</b><span>изменений в {sm.year ?? CURRENT_YEAR}</span></div>
        </div>
      )}

      {demo && (
        <section className="ex-hero-doc">
          <div>
            <div className="gdz-eyebrow"><span className="dot"></span>Главный документ сезона</div>
            <h2>Демоверсия {ex} {demo.year} по {s.dat}</h2>
            <p>Официальный демонстрационный вариант ФИПИ{demo.pages ? ` (${demo.pages} ${pagesWord(demo.pages)})` : ''}: задания в формате экзамена, ответы к части 1 и критерии оценивания части 2.{sm.changes?.length && !/отсутствуют/i.test(sm.changes[0]) ? ' В этом году есть изменения — они разобраны на странице демоверсии.' : ''}</p>
            <div className="ol-dl" style={{ margin: '12px 0 0' }}>
              <Link href={docPath(demo)!} className="pri">Открыть демоверсию {demo.year} →</Link>
              {demo.files.filter(f => f.ext === 'pdf').slice(0, 2).map(f => <a key={f.url} href={f.url} target="_blank" rel="noopener">📄 {f.label} <small>PDF</small></a>)}
            </div>
          </div>
        </section>
      )}

      <AdInline slot="mobile" suffix="ex-subj" />

      {groups.map(g => (
        <section className="gdz-section" key={g.kind}>
          <div className="gdz-section-head"><h2>{KIND_PLURAL[g.kind]} {ex} по {s.dat}</h2></div>
          <div className="ol-stage-block">
            <div className="rows">
              {g.docs.map(d => (
                <Link key={d.id} href={docPath(d)!}>
                  {g.kind === 'nav-rec' || g.kind === 'mr' || g.kind === 'criteria' ? `${d.year} год` : `${d.year}`}
                  {d.year === CURRENT_YEAR && <span className="ct">· новая</span>}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}

      {topics.length > 0 && (
        <section className="gdz-section">
          <div className="gdz-section-head"><h2>Навигатор подготовки ФИПИ: теория по темам {ex} по {s.dat}</h2></div>
          <div className="ol-theory">{topics.map(d => <Link key={d.id} href={docPath(d)!}>{d.title}</Link>)}</div>
        </section>
      )}

      <AdInline slot={2} suffix="ex-subj" />

      {tasks.length > 0 && (
        <section className="gdz-section" id="zadaniya">
          <div className="gdz-section-head"><h2>Разбор заданий {ex} по {s.dat}</h2></div>
          {[{ t: 'Часть 1 — краткий ответ', list: part1 }, { t: 'Часть 2 — развёрнутый ответ', list: part2 }].filter(x => x.list.length).map(x => (
            <div className="ol-stage-block" key={x.t}>
              <h3>{x.t}</h3>
              <div className="rows">
                {x.list.map(t => <Link key={t.slug} href={`/${exam}/${s.slug}/${t.slug}/`}>{t.title} <span className="ct">· {t.shortDesc}</span></Link>)}
              </div>
            </div>
          ))}
        </section>
      )}

      <OnlineLeadCta
        source={`${exam}-subject-${s.slug}`}
        heading={`Подготовка к ${ex} по ${s.dat} с преподавателем`}
        text={`Оставьте номер — подберём онлайн-курс подготовки к ${ex} по ${s.dat}: расписание, формат, пробный урок. Перезвоним и расскажем, как готовиться по материалам ФИПИ без пробелов.`}
        bullets={['занятия по кодификатору и демоверсии текущего года', 'пробники в формате экзамена с разбором ошибок', 'бесплатный пробный урок']}
      />

      <section className="ol-text ol-seo">
        <h2>Как готовиться к {ex} по {s.dat} по материалам ФИПИ</h2>
        <p>Порядок, который рекомендует сам ФИПИ в навигаторе самостоятельной подготовки: сначала откройте <strong>кодификатор</strong> — это полный список тем, из которых собирают варианты. Затем разберите <strong>демоверсию</strong>: она показывает формат каждого задания, а в конце документа — ответы и критерии оценивания части 2. <strong>Спецификация</strong> покажет, сколько баллов «стоит» каждое задание и сколько времени на него закладывать.</p>
        <p>{groups.some(g => g.kind === 'variant') ? `Для тренировки используйте открытые варианты досрочного периода — это настоящие КИМ прошлого года с официальными ответами. ` : ''}Методические рекомендации по итогам экзамена написаны для учителей, но полезны и выпускникам: там перечислены задания с самым низким процентом выполнения и типичные ошибки — именно на них стоит потратить больше времени.</p>
        {faq.map(f => (<details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>))}
      </section>

      <section className="gdz-section">
        <div className="gdz-section-head"><h2>Смотрите также</h2></div>
        <div className="ol-stage-block"><div className="rows">
          {twin && <Link href={`/${other}/${twin.slug}/`}>{EXAM_NAME[other]} по {twin.dat}</Link>}
          <Link href={`/${exam}/demoversii-${CURRENT_YEAR}/`}>Все демоверсии {ex} {CURRENT_YEAR}</Link>
          <Link href={`/${exam}/izmeneniya-${CURRENT_YEAR}/`}>Изменения {ex} {CURRENT_YEAR}</Link>
          <Link href={`/olimpiady/${olimpSlug[s.fipi] ?? s.fipi}/`}>Олимпиады по {s.dat}</Link>
          <Link href={`/shkoly/osobennosti/podgotovka-k-${exam}/`}>Школы с подготовкой к {ex}</Link>
        </div></div>
      </section>

      <AdInline slot={3} suffix="ex-subj" />
    </ExamShell>
  )
}
