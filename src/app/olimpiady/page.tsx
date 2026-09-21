import type { Metadata } from 'next'
import Link from 'next/link'
import { olimpSubjects, olimpStages, olimpPapers, papersBySubject, olimpYears } from '@/data/olimp'
import YandexRTBBanner from '@/components/YandexRTBBanner'
import { AD_BLOCKS, AD_SLOT_2, AD_SLOT_3 } from '@/lib/ads'
import { olimpGuides } from '@/data/olimp-guides'
import { prepSubjects, getOlimpSubject } from '@/data/olimp'

const SITE = 'https://pro-schools.ru'

export const metadata: Metadata = {
  title: 'Олимпиады для школьников — задания прошлых лет с ответами по всем предметам (ВсОШ)',
  description: 'Архив заданий Всероссийской олимпиады школьников: школьный, муниципальный, региональный и заключительный этапы за 2023–2026 годы. 28 предметов, 4–11 классы, PDF с заданиями и решениями, текст для прорешивания онлайн.',
  keywords: 'олимпиады для школьников, всош задания, олимпиада задания прошлых лет, олимпиадные задания с ответами, всероссийская олимпиада школьников',
  alternates: { canonical: `${SITE}/olimpiady/` },
}

const STAGE_HINT: Record<string, string> = {
  'priglasitelnyj-etap': 'Онлайн-тур весной для всех желающих: пробный формат перед школьным этапом.',
  'shkolnyj-etap': 'Сентябрь–октябрь, участвуют все желающие с 4 класса. Самый массовый этап.',
  'municipalnyj-etap': 'Ноябрь–декабрь, для победителей и призёров школьного этапа (7–11 классы).',
  'regionalnyj-etap': 'Январь–февраль, 9–11 классы. Дипломы дают преимущество при поступлении.',
  'zaklyuchitelnyj-etap': 'Март–апрель. Победители и призёры поступают в вузы без экзаменов.',
}

export default function OlimpHub() {
  const subjects = olimpSubjects()
  const total = olimpPapers().length
  const years = olimpYears()
  const yearsLabel = `${years[years.length - 1].slice(0, 4)}–${years[0].slice(0, 4)}`
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'CollectionPage',
    name: 'Олимпиады для школьников — задания прошлых лет', url: `${SITE}/olimpiady/`,
    hasPart: subjects.map(s => ({ '@type': 'WebPage', name: `Олимпиада по ${s.dat}`, url: `${SITE}/olimpiady/${s.slug}/` })),
  }
  return (
    <div className="gdz-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="gdz-main">
        <nav className="gdz-crumbs" aria-label="Хлебные крошки">
          <Link href="/">Главная</Link><span className="sep">/</span><span className="cur">Олимпиады</span>
        </nav>

        <div className="gdz-pagehead">
          <div className="gdz-eyebrow"><span className="dot"></span>{total} комплектов заданий · {subjects.length} предметов · {yearsLabel}</div>
          <h1>Олимпиады для школьников — задания прошлых лет с ответами</h1>
          <p className="lede">
            Архив Всероссийской олимпиады школьников (ВсОШ): задания и решения всех этапов — от пригласительного до
            заключительного — за последние учебные годы. Скачивайте PDF, прорешивайте задания онлайн и сверяйтесь с ответами.
          </p>
        </div>

        <section className="gdz-section">
          <div className="gdz-section-head"><h2>Выберите предмет</h2></div>
          <div className="gdz-subj-grid">
            {subjects.map(s => {
              const n = papersBySubject(s.slug).length
              return (
                <Link key={s.slug} className="gdz-subj-card" href={`/olimpiady/${s.slug}/`}>
                  <span className="gdz-subj-ic">{s.icon}</span>
                  <span className="gdz-subj-txt"><span className="name">{s.name}</span><span className="count">{n} комплектов</span></span>
                </Link>
              )
            })}
          </div>
        </section>

        <aside className="gdz-ad gdz-ad-inline ol-ad-mobile" aria-label="Реклама">
          <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
          <div className="gdz-ad-slot"><YandexRTBBanner blockId={AD_BLOCKS.gdzUchebnik} suffix="ol-index-inline" viewport="mobile" /></div>
        </aside>

        <section className="gdz-section">
          <div className="gdz-section-head"><h2>По классам</h2></div>
          <div className="gdz-class-grid">
            {[3, 4, 5, 6, 7, 8, 9, 10, 11].map(n => {
              const cnt = olimpPapers().filter(p => p.classes.includes(n)).length
              return (
                <Link key={n} className="gdz-class-card" href={`/olimpiady/klass/${n}-klass/`}>
                  <span className="corner"></span>
                  <span className="gdz-class-num">{n}</span>
                  <span className="lbl">{n} класс</span>
                  <span className="sub">{cnt} комплектов</span>
                </Link>
              )
            })}
          </div>
        </section>

        <aside className="gdz-ad gdz-ad-inline" aria-label="Реклама">
          <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
          <div className="gdz-ad-slot"><YandexRTBBanner blockId={AD_SLOT_3} suffix="ol-index-pop" /></div>
        </aside>

        <section className="gdz-section">
          <div className="gdz-section-head"><h2>Справочник: ВсОШ 2026/2027, перечневые олимпиады, подготовка</h2></div>
          <div className="ol-paper-grid">
            {olimpGuides.map(g => (
              <Link key={g.slug} className="ol-paper" href={`/olimpiady/${g.slug}/`}>
                <span className="yr">{g.eyebrow}</span>
                <span className="t">{g.h1}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="gdz-section">
          <div className="gdz-section-head"><h2>Подготовка к олимпиаде по предметам</h2></div>
          <div className="ol-stage-block"><div className="rows">
            {prepSubjects().map(sl => getOlimpSubject(sl)).filter(Boolean).map(x => (
              <Link key={x!.slug} href={`/olimpiady/${x!.slug}/podgotovka/`}>{x!.icon} {x!.name}</Link>
            ))}
          </div></div>
        </section>

        <section className="gdz-section">
          <div className="gdz-section-head"><h2>Этапы ВсОШ: как устроена олимпиада</h2></div>
          <div className="ol-stages">
            {olimpStages().map(st => (
              <div key={st.slug}><b>{st.name}</b><span>{STAGE_HINT[st.slug]}</span></div>
            ))}
          </div>
        </section>

        <section className="gdz-section ol-seo">
          <h2>Зачем решать олимпиады прошлых лет</h2>
          <p>
            Задания каждого этапа ВсОШ из года в год строятся по одной модели: те же типы задач, та же структура работы и
            близкие темы. Поэтому лучший способ подготовиться — прорешать комплекты прошлых лет своего класса и сверить
            ответы с официальными решениями и критериями. На каждой странице раздела — PDF с заданиями, PDF с решениями
            и текст заданий, который удобно читать с телефона.
          </p>
          <h2>Что дают олимпиады при поступлении</h2>
          <ul>
            <li><b>Заключительный этап ВсОШ</b> — победители и призёры зачисляются в любой вуз по профилю без вступительных испытаний (БВИ), льгота действует 4 года.</li>
            <li><b>Региональный этап</b> — диплом даёт дополнительные баллы к ЕГЭ во многих вузах (обычно 3–10 баллов за индивидуальные достижения).</li>
            <li><b>Школьный и муниципальный этапы</b> — путь к региональному и заключительному, плюс баллы в портфолио и при отборе в профильные классы.</li>
          </ul>
          <p>
            Помимо ВсОШ существуют перечневые олимпиады («Ломоносов», «Высшая проба», «Физтех», «Росатом», «Покори Воробьёвы горы!»
            и другие): их дипломы тоже дают БВИ или 100 баллов за ЕГЭ по профильному предмету при подтверждении результата ЕГЭ.
          </p>
        </section>

        <aside className="gdz-ad gdz-ad-inline" aria-label="Реклама">
          <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
          <div className="gdz-ad-slot"><YandexRTBBanner blockId={AD_SLOT_2} suffix="ol-index-mid" /></div>
        </aside>
      </main>

      <aside className="gdz-rail" aria-label="Реклама">
        <div className="gdz-rail-sticky">
          <div className="gdz-ad">
            <div className="gdz-ad-label"><span>Реклама</span><span className="age">16+</span></div>
            <div className="gdz-ad-slot gdz-ad-slot--tall"><YandexRTBBanner blockId={AD_BLOCKS.gdzUchebnik} suffix="ol-index-sidebar" viewport="desktop" /></div>
          </div>
        </div>
      </aside>
    </div>
  )
}
