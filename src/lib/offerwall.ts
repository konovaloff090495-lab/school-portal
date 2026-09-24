/**
 * ВИТРИНА ПОДАРКОВ (offerwall) — страница, на которую попадает человек сразу после заявки.
 *
 * Логика как у Flocktory/RefProm: пользователь совершил целевое действие (оставил заявку
 * на pro-schools.ru) → вместо пустого «спасибо» получает витрину офферов, где может забрать
 * ещё один продукт. Каждый забранный оффер — вторая заявка в CRM Синергии и партнёрский
 * переход с меткой gerasimov_lav.
 *
 * ИСТОЧНИК ОФФЕРОВ — `su-products.ts`: там строки `offer` сверены с самими посадочными
 * school-university.com. Здесь НЕ дублируются и НЕ переписываются обещания: витрина берёт
 * title/text/offer/cta из реестра продуктов. Если оффер поменялся — правится su-products.ts.
 *
 * Партнёрские карточки (`partner: true`) — внешние сайты без нашей формы: человек уходит
 * по ссылке, заявку собирает партнёр.
 */

import { SU_PRODUCTS, SU_BASE, SU_UTM_SOURCE, SU_UTM_MEDIUM, type SuProduct } from '@/lib/su-products'

/** Кампания витрины — отделяет её заявки от блога (proschools_blog) в отчётах Метрики. */
export const WALL_CAMPAIGN = 'proschools_offerwall'

export type WallCategory = 'shkola' | 'ege' | 'deti' | 'posle9' | 'bonus'

export const WALL_CATEGORIES: { key: WallCategory; label: string }[] = [
  { key: 'shkola', label: 'Школа 5–11' },
  { key: 'ege', label: 'ЕГЭ, ОГЭ и репетиторы' },
  { key: 'deti', label: 'Детям 1–9 класса' },
  { key: 'posle9', label: 'После 9 и 11 класса' },
  { key: 'bonus', label: 'Бонусы' },
]

export interface WallOffer {
  id: string
  category: WallCategory
  /** Крупная плашка в первом ряду «ваши подарки» */
  featured?: boolean
  /** Бейдж — сам оффер («Первая неделя бесплатно») */
  badge: string
  /** Заголовок карточки */
  title: string
  /** Одна строка под заголовком */
  lead: string
  /** Что входит — 3 пункта, разворачиваются в шторке */
  bullets: string[]
  /** Надпись на кнопке */
  cta: string
  /** Градиент плашки */
  accent: [string, string]
  /** Имя продукта для подписи заявки в CRM */
  productName: string
  /** Куда ведём после заявки (наши продукты) */
  suProduct?: string
  /** Внешний партнёр: уходим по ссылке, формы нет */
  partner?: boolean
  partnerUrl?: string
  partnerHost?: string
}

/** Ссылка на посадочную school-university.com с партнёрской меткой витрины. */
export function wallUrl(productKey: string, place: string): string {
  const product: SuProduct | undefined = SU_PRODUCTS[productKey]
  const params = new URLSearchParams({
    utm_source: SU_UTM_SOURCE,
    utm_medium: SU_UTM_MEDIUM,
    utm_campaign: WALL_CAMPAIGN,
    utm_term: productKey,
    utm_content: place,
  })
  return `${SU_BASE}${product?.path || '/'}?${params.toString()}`
}

/** Карточка из продукта school-university.com: обещания берём как есть из su-products.ts. */
function fromSu(
  key: string,
  category: WallCategory,
  bullets: string[],
  featured = false,
): WallOffer {
  const p = SU_PRODUCTS[key]
  return {
    id: key,
    category,
    featured,
    badge: p.offer,
    title: p.title,
    lead: p.text,
    bullets,
    cta: p.cta,
    accent: p.accent,
    productName: p.name,
    suProduct: key,
  }
}

export const WALL_OFFERS: WallOffer[] = [
  // ——— Школа 5–11 ———
  fromSu('online-school', 'shkola', [
    'Уроки в прямом эфире и в записи по программе 5–11 класса',
    'Классный руководитель, наставник и психолог',
    'Аттестация и аттестат гособразца без перевода в другую школу',
  ], true),
  fromSu('externat', 'shkola', [
    'Уплотнённая программа: два класса за один учебный год',
    'Аттестации по графику ученика, а не по расписанию школы',
    'Государственный аттестат того же образца',
  ]),
  fromSu('semeynaya-shkola', 'shkola', [
    'Школа берёт на себя прикрепление и документы',
    'Промежуточные аттестации по всем предметам',
    'Родителю остаётся расписание, а не бумаги',
  ]),
  fromSu('attestaciya', 'shkola', [
    'Для тех, кто учится сам и ищет, где аттестоваться',
    'Зачисление, аттестация по всем предметам, перевод в следующий класс',
    'Оформление онлайн, 5–11 класс',
  ]),
  fromSu('vechernyaya-shkola', 'shkola', [
    'Аттестат за 9 и 11 класс взрослым — онлайн',
    'Учёба совмещается с работой',
    'Тот же государственный аттестат',
  ]),
  fromSu('zaochnaya-shkola', 'shkola', [
    'Заочная форма с зачислением в школу',
    'Меньше уроков в расписании, больше самостоятельной работы',
    'Аттестации и аттестат — как на очной форме',
  ]),
  fromSu('profilnye-klassy', 'shkola', [
    'Профили: IT, дизайн, предпринимательство',
    'Углублённые предметы профиля для 9–10 класса',
    'Бесплатно ученикам онлайн-школы',
  ]),
  fromSu('vneurochka', 'shkola', [
    '23 занятия после уроков — кружки и клубы',
    'Для учеников онлайн-школы — бесплатно',
    'Запись по интересам ребёнка',
  ]),

  // ——— ЕГЭ, ОГЭ и репетиторы ———
  fromSu('kursy-ege', 'ege', [
    '56 тематических вебинаров на предмет и 1 000+ тренажёров',
    'Три пробника в формате КИМ с разбором ошибок',
    'Куратор, который держит план подготовки',
  ], true),
  fromSu('kursy-oge', 'ege', [
    '11 предметов, вебинары по расписанию и тренажёры',
    'Три пробника в формате КИМ: сентябрь, декабрь, май',
    'Куратор ведёт план до экзамена',
  ]),
  fromSu('repetitor', 'ege', [
    'Индивидуально, урок 40 минут',
    'Школьная программа и подготовка к ОГЭ/ЕГЭ',
    'Педагог проверяет домашние задания',
  ], true),
  fromSu('lektoriy', 'ege', [
    'Открытые занятия для школьников всей России',
    'Разборы тем и экзаменационных заданий',
    'Участие бесплатное',
  ]),

  // ——— Детям 1–9 класса ———
  fromSu('nachalnaya-shkola', 'deti', [
    'Математика, русский, чтение и английский для 1–4 класса',
    'Занятия в мини-группах Synergy Kids',
    'Первый урок — бесплатно',
  ]),
  fromSu('kursy-dlya-detey', 'deti', [
    '18 онлайн-курсов для детей и подростков 9–17 лет',
    'Направления от творчества до технологий',
    'Подбор по возрасту — бесплатно',
  ]),
  fromSu('programmirovanie', 'deti', [
    'Программирование для детей 7–17 лет (EasyCode)',
    'От Scratch до настоящего кода и проектов',
    'Пробный урок с преподавателем без оплаты',
  ]),
  fromSu('soft-skills', 'deti', [
    'Гибкие навыки для детей 6–15 лет (Академия Ukids)',
    'Общение, уверенность, работа в команде',
    'Диагностика 45 минут и карта навыков — бесплатно',
  ]),

  // ——— После 9 и 11 класса ———
  fromSu('kolledzh', 'posle9', [
    'Колледж «Синергия» после 9 и 11 класса',
    'Расчёт стоимости со скидками, рассрочкой и маткапиталом',
    'Диплом о среднем профессиональном образовании',
  ]),
  fromSu('vuz', 'posle9', [
    'Университет «Синергия»: 156 программ',
    'Разбор проходных баллов и вариантов оплаты',
    'Очно, онлайн и заочно',
  ]),
  fromSu('obuchenie-za-rubezhom', 'posle9', [
    'Двойной диплом: Дубай, Китай, Малайзия, Сербия, Таиланд',
    'Часть программы — за рубежом, часть — дома',
    'Скидка 10% при оплате года',
  ]),
  fromSu('soprovozhdenie-do-postupleniya', 'posle9', [
    'Наставник ведёт до зачисления',
    'Персональный план поступления',
    'Документы, сроки и запасные варианты',
  ]),
  fromSu('materialy', 'posle9', [
    'Гид абитуриента в PDF',
    'Документы, сроки подачи и как платить меньше',
    'Бесплатно, сразу после заявки',
  ], true),

  // ——— Партнёрские карточки: уходим на внешний сайт, формы у нас нет ———
  {
    id: 'open-college',
    category: 'posle9',
    badge: 'Экскурсия по колледжу и подбор специальности',
    title: 'Московский городской открытый колледж',
    lead: 'Дизайн, IT, маркетинг, педагогика, спорт, туризм — 20+ специальностей, очно и онлайн',
    bullets: [
      'Дни открытых дверей и экскурсии по колледжу',
      'Скидки на оплату обучения и образовательный кредит с господдержкой',
      'Помогают выбрать специальность и рассказывают про трудоустройство',
    ],
    cta: 'Открыть сайт колледжа',
    accent: ['#1F2A44', '#4F46E5'],
    productName: 'Московский городской открытый колледж',
    partner: true,
    partnerHost: 'open-college.ru',
    partnerUrl:
      'https://open-college.ru/?utm_source=portal_college_dimas&utm_medium=referral&utm_campaign=proschools_offerwall',
  },
  {
    id: 'icolleges',
    category: 'posle9',
    badge: 'Бесплатный подбор колледжа',
    title: 'Каталог колледжей России: 4 900+ учебных заведений',
    lead: 'Выбор по городу, профессии и форме обучения — с программами, ценами и условиями приёма',
    bullets: [
      'Колледжи и техникумы всех регионов в одном каталоге',
      'Фильтры по профессии, форме обучения и бюджету',
      'Разборы специальностей: кем работать и сколько платят',
    ],
    cta: 'Подобрать колледж',
    accent: ['#0B3B36', '#0D9488'],
    productName: 'Каталог колледжей iColleges',
    partner: true,
    partnerHost: 'icolleges.ru',
    partnerUrl: 'https://icolleges.ru/?utm_source=proschools&utm_medium=offerwall&utm_campaign=podarki',
  },
  {
    id: 'promokody',
    category: 'bonus',
    badge: 'Промокоды на поездку',
    title: 'Промокоды на путешествия: отели, билеты, eSIM и аренда авто',
    lead: 'Подборка действующих скидок сервисов — пригодится на каникулы и семейную поездку',
    bullets: [
      'Отели и авиабилеты со скидками по промокодам',
      'eSIM и аренда авто для поездок',
      'Подборка обновляется каждый месяц',
    ],
    cta: 'Открыть промокоды',
    accent: ['#3A1E12', '#EA580C'],
    productName: 'Промокоды на путешествия',
    partner: true,
    partnerHost: 'card-open.ru',
    partnerUrl: 'https://card-open.ru/promokody?utm_source=proschools&utm_medium=offerwall&utm_campaign=podarki',
  },
  {
    id: 'rossiya',
    category: 'bonus',
    badge: 'Куда поехать на каникулах',
    title: 'Путешествия по России: маршруты по дням и сезонные идеи',
    lead: 'Направления внутреннего туризма с ценами в рублях — от Карелии и Золотого кольца до Сочи',
    bullets: [
      'Маршруты по дням для поездки с детьми',
      'Когда ехать: золотая осень, северное сияние, каникулы',
      'Экскурсии и жильё по регионам',
    ],
    cta: 'Выбрать направление',
    accent: ['#10243A', '#0284C7'],
    productName: 'Путешествия по России',
    partner: true,
    partnerHost: 'card-open.ru',
    partnerUrl: 'https://card-open.ru/rossiya?utm_source=proschools&utm_medium=offerwall&utm_campaign=podarki',
  },
]

export const FEATURED_OFFERS = WALL_OFFERS.filter(o => o.featured)

export function getWallOffer(id: string): WallOffer | undefined {
  return WALL_OFFERS.find(o => o.id === id)
}
