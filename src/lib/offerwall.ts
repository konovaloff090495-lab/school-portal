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
  { key: 'ege', label: 'ЕГЭ и ОГЭ' },
  { key: 'deti', label: 'Детям' },
  { key: 'posle9', label: 'После 9 и 11' },
  { key: 'bonus', label: 'Бонусы' },
]

/** Ключ пиктограммы на плитке оффера — рисуются в OfferIcon.tsx */
export type WallIcon =
  | 'school' | 'rocket' | 'home' | 'certificate' | 'moon' | 'calendar' | 'target'
  | 'puzzle' | 'exam' | 'teacher' | 'play' | 'blocks' | 'palette' | 'code'
  | 'heart' | 'college' | 'cap' | 'globe' | 'route' | 'pdf' | 'search'
  | 'ticket' | 'mountain'

export interface WallOffer {
  id: string
  category: WallCategory
  /** Чей это продукт — мелкая подпись над заголовком строки */
  brand: string
  /** Короткий ярлык на плитке (1–2 слова) */
  tile: string
  /** Пиктограмма на плитке */
  icon: WallIcon
  /** Цвета плитки — назначаются автоматически, чтобы соседние офферы были разного цвета */
  tint: [string, string]
  /** Крупная плашка в первом ряду «ваши подарки» */
  featured?: boolean
  /**
   * Что человек получает, в формулировке подарка («Неделя обучения в подарок»).
   * Условие то же, что на посадочной (`offer` в su-products.ts) — меняется подача,
   * а не обещание: витрина не может сулить больше, чем лендинг.
   */
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
  icon: WallIcon,
  tile: string,
  bullets: string[],
  opts: { featured?: boolean; brand?: string; gift?: string } = {},
): WallOffer {
  const p = SU_PRODUCTS[key]
  const { featured = false, brand = 'Синергия', gift } = opts
  return {
    id: key,
    category,
    brand,
    tile,
    icon,
    tint: ['', ''],
    featured,
    badge: gift ?? p.offer,
    title: p.title,
    lead: p.text,
    bullets,
    cta: p.cta,
    accent: p.accent,
    productName: p.name,
    suProduct: key,
  }
}

/** Яркие плитки: белый текст и иконка читаются на каждом из градиентов. */
const TINTS: [string, string][] = [
  ['#2563EB', '#4F8DF7'],
  ['#7C3AED', '#A855F7'],
  ['#059669', '#10B981'],
  ['#E0561F', '#FB923C'],
  ['#0891B2', '#22B8D9'],
  ['#DB2777', '#F472B6'],
  ['#4F46E5', '#6366F1'],
  ['#B45309', '#F59E0B'],
  ['#0F766E', '#14B8A6'],
  ['#9333EA', '#C084FC'],
]

const OFFERS_RAW: WallOffer[] = [
  // ——— Школа 5–11 ———
  fromSu('online-school', 'shkola', 'school', 'Онлайн-школа', [
    'Уроки в прямом эфире и в записи по программе 5–11 класса',
    'Классный руководитель, наставник и психолог',
    'Аттестация и аттестат гособразца без перевода в другую школу',
  ], { featured: true, gift: 'Неделя обучения в подарок' }),
  fromSu('externat', 'shkola', 'rocket', 'Экстернат', [
    'Уплотнённая программа: два класса за один учебный год',
    'Аттестации по графику ученика, а не по расписанию школы',
    'Государственный аттестат того же образца',
  ], { gift: 'Неделя экстерната в подарок' }),
  fromSu('semeynaya-shkola', 'shkola', 'home', 'Семейная', [
    'Школа берёт на себя прикрепление и документы',
    'Промежуточные аттестации по всем предметам',
    'Родителю остаётся расписание, а не бумаги',
  ], { gift: 'Неделя семейного обучения в подарок' }),
  fromSu('attestaciya', 'shkola', 'certificate', 'Аттестация', [
    'Для тех, кто учится сам и ищет, где аттестоваться',
    'Зачисление, аттестация по всем предметам, перевод в следующий класс',
    'Оформление онлайн, 5–11 класс',
  ], { gift: 'Консультация по аттестации — бесплатно' }),
  fromSu('vechernyaya-shkola', 'shkola', 'moon', 'Вечерняя', [
    'Аттестат за 9 и 11 класс взрослым — онлайн',
    'Учёба совмещается с работой',
    'Тот же государственный аттестат',
  ], { gift: 'Неделя обучения в подарок' }),
  fromSu('zaochnaya-shkola', 'shkola', 'calendar', 'Заочная', [
    'Заочная форма с зачислением в школу',
    'Меньше уроков в расписании, больше самостоятельной работы',
    'Аттестации и аттестат — как на очной форме',
  ], { gift: 'Неделя обучения в подарок' }),
  fromSu('profilnye-klassy', 'shkola', 'target', 'Профили', [
    'Профили: IT, дизайн, предпринимательство',
    'Углублённые предметы профиля для 9–10 класса',
    'Бесплатно ученикам онлайн-школы',
  ], { gift: 'Профильные предметы бесплатно ученикам' }),
  fromSu('vneurochka', 'shkola', 'puzzle', 'Внеурочка', [
    '23 занятия после уроков — кружки и клубы',
    'Для учеников онлайн-школы — бесплатно',
    'Запись по интересам ребёнка',
  ], { gift: '23 занятия бесплатно ученикам школы' }),

  // ——— ЕГЭ, ОГЭ и репетиторы ———
  fromSu('kursy-ege', 'ege', 'exam', 'Курсы ЕГЭ', [
    '56 тематических вебинаров на предмет и 1 000+ тренажёров',
    'Три пробника в формате КИМ с разбором ошибок',
    'Куратор, который держит план подготовки',
  ], { featured: true, gift: 'Пробный день на курсах ЕГЭ в подарок' }),
  fromSu('kursy-oge', 'ege', 'exam', 'Курсы ОГЭ', [
    '11 предметов, вебинары по расписанию и тренажёры',
    'Три пробника в формате КИМ: сентябрь, декабрь, май',
    'Куратор ведёт план до экзамена',
  ], { gift: 'Пробный день на курсах ОГЭ в подарок' }),
  fromSu('repetitor', 'ege', 'teacher', 'Репетитор', [
    'Индивидуально, урок 40 минут',
    'Школьная программа и подготовка к ОГЭ/ЕГЭ',
    'Педагог проверяет домашние задания',
  ], { featured: true, gift: 'Первый урок с репетитором бесплатно' }),
  fromSu('lektoriy', 'ege', 'play', 'Лекторий', [
    'Открытые занятия для школьников всей России',
    'Разборы тем и экзаменационных заданий',
    'Участие бесплатное',
  ], { gift: 'Доступ к Лекторию — бесплатно' }),

  // ——— Детям 1–9 класса ———
  fromSu('nachalnaya-shkola', 'deti', 'blocks', '1–4 класс', [
    'Математика, русский, чтение и английский для 1–4 класса',
    'Занятия в мини-группах Synergy Kids',
    'Первый урок — бесплатно',
  ], { gift: 'Первый урок Synergy Kids бесплатно', brand: 'Synergy Kids' }),
  fromSu('kursy-dlya-detey', 'deti', 'palette', 'Курсы детям', [
    '18 онлайн-курсов для детей и подростков 9–17 лет',
    'Направления от творчества до технологий',
    'Подбор по возрасту — бесплатно',
  ], { gift: 'Подбор курса по возрасту бесплатно' }),
  fromSu('programmirovanie', 'deti', 'code', 'EasyCode', [
    'Программирование для детей 7–17 лет (EasyCode)',
    'От Scratch до настоящего кода и проектов',
    'Пробный урок с преподавателем без оплаты',
  ], { gift: 'Пробный урок EasyCode бесплатно', brand: 'EasyCode' }),
  fromSu('soft-skills', 'deti', 'heart', 'Ukids', [
    'Гибкие навыки для детей 6–15 лет (Академия Ukids)',
    'Общение, уверенность, работа в команде',
    'Диагностика 45 минут и карта навыков — бесплатно',
  ], { gift: 'Диагностика Ukids 45 минут бесплатно', brand: 'Ukids' }),

  // ——— После 9 и 11 класса ———
  fromSu('kolledzh', 'posle9', 'college', 'Колледж', [
    'Колледж «Синергия» после 9 и 11 класса',
    'Расчёт стоимости со скидками, рассрочкой и маткапиталом',
    'Диплом о среднем профессиональном образовании',
  ], { gift: 'Расчёт цены со скидкой и рассрочкой' }),
  fromSu('vuz', 'posle9', 'cap', 'Университет', [
    'Университет «Синергия»: 156 программ',
    'Разбор проходных баллов и вариантов оплаты',
    'Очно, онлайн и заочно',
  ], { gift: 'Разбор проходных баллов бесплатно' }),
  fromSu('obuchenie-za-rubezhom', 'posle9', 'globe', 'За рубежом', [
    'Двойной диплом: Дубай, Китай, Малайзия, Сербия, Таиланд',
    'Часть программы — за рубежом, часть — дома',
    'Скидка 10% при оплате года',
  ], { gift: 'Скидка 10% при оплате года' }),
  fromSu('soprovozhdenie-do-postupleniya', 'posle9', 'route', 'Наставник', [
    'Наставник ведёт до зачисления',
    'Персональный план поступления',
    'Документы, сроки и запасные варианты',
  ], { gift: 'Персональный план поступления' }),
  fromSu('materialy', 'posle9', 'pdf', 'Гид в PDF', [
    'Гид абитуриента в PDF',
    'Документы, сроки подачи и как платить меньше',
    'Бесплатно, сразу после заявки',
  ], { featured: true, gift: 'Гид абитуриента в PDF бесплатно' }),

  // ——— Партнёрские карточки: уходим на внешний сайт, формы у нас нет ———
  {
    id: 'obr-kredit',
    brand: 'Открытый колледж',
    tile: 'Кредит 3%',
    icon: 'certificate',
    tint: ['', ''],
    category: 'posle9',
    featured: true,
    badge: 'Учёба от 100–300 ₽ в месяц первый год',
    title: 'Образовательный кредит с господдержкой: ставка 3%',
    lead: 'Целевая государственная программа: большую часть процентов банку платит государство, деньги переводятся напрямую в колледж',
    bullets: [
      'Фиксированные 3% годовых — остальное компенсирует государство',
      'Во время учёбы и ещё 9 месяцев после выпуска платятся только проценты: обычно 100–300 ₽ в месяц в первый год',
      'Основной долг — после выпуска, срок погашения до 15 лет, досрочно можно закрыть в любой момент',
    ],
    cta: 'Узнать про кредит',
    accent: ['#0B3B2E', '#10B981'],
    productName: 'Образовательный кредит с господдержкой (Открытый колледж)',
    partner: true,
    partnerHost: 'open-college.ru',
    partnerUrl:
      'https://open-college.ru/enrollee/credit/?utm_source=portal_college_dimas&utm_medium=referral&utm_campaign=proschools_offerwall',
  },
  {
    id: 'open-college',
    brand: 'Открытый колледж',
    tile: 'Колледж',
    icon: 'college',
    tint: ['', ''],
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
    brand: 'iColleges',
    tile: 'Каталог',
    icon: 'search',
    tint: ['', ''],
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
    brand: 'Open Card',
    tile: 'Промокоды',
    icon: 'ticket',
    tint: ['', ''],
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
    brand: 'Open Card',
    tile: 'Россия',
    icon: 'mountain',
    tint: ['', ''],
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

/** Цвет плитки — по позиции в списке: соседние офферы всегда разного цвета. */
export const WALL_OFFERS: WallOffer[] = OFFERS_RAW.map((o, i) => ({
  ...o,
  tint: TINTS[i % TINTS.length],
}))

export const FEATURED_OFFERS = WALL_OFFERS.filter(o => o.featured)

export function getWallOffer(id: string): WallOffer | undefined {
  return WALL_OFFERS.find(o => o.id === id)
}
