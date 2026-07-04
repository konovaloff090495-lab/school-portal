#!/usr/bin/env node
/**
 * Добавляет темы из on-line-school.ru в очередь blog-topics.json
 * Исключает семантические дубликаты существующих статей.
 *
 * Запуск: node scripts/add-online-school-topics.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const BLOG_TS = path.join(ROOT, 'src', 'data', 'blog.ts')
const QUEUE = path.join(__dirname, 'blog-topics.json')

// Все существующие slugи (из blog.ts и очереди)
const blogContent = readFileSync(BLOG_TS, 'utf-8')
const existingSlugs = new Set([
  ...[...blogContent.matchAll(/slug:\s*'([^']+)'/g)].map(m => m[1]),
  ...JSON.parse(readFileSync(QUEUE, 'utf-8')).topics.map(t => t.slug).filter(Boolean),
])

// Темы с on-line-school.ru, которые нужно добавить
// Семантические дубликаты уже убраны вручную (см. комментарии)
const newTopics = [
  // === ФОРМЫ ОБУЧЕНИЯ ===
  { slug: 'semejnoe-obuchenie-2026', title: 'Семейное обучение в 2026 году: как перейти, оформить и получить аттестат', category: 'Домашнее обучение', keywords: 'семейное обучение 2026' },
  { slug: 'semejnoe-obuchenie-mladshie-klassy', title: 'Семейное обучение в начальной школе: особенности 1–4 классов', category: 'Домашнее обучение', keywords: 'семейное обучение начальная школа' },
  { slug: 'gruppovoe-obuchenie-doma', title: 'Групповое домашнее обучение: как организовать учёбу с другими семьями', category: 'Домашнее обучение', keywords: 'групповое домашнее обучение' },
  { slug: 'kak-pomoch-rebenku-s-fizikoj', title: 'Как помочь ребёнку с физикой: методы и ресурсы для родителей', category: 'Советы родителям', keywords: 'помочь ребёнку с физикой' },
  { slug: 'semejnoe-obuchenie-i-sport', title: 'Семейное обучение и спорт: как совмещать тренировки с учёбой', category: 'Домашнее обучение', keywords: 'семейное обучение спорт' },
  { slug: 'zaochnoe-obuchenie-dlya-vzroslyh', title: 'Заочное обучение для взрослых: как получить школьный аттестат после 18', category: 'Формы обучения', keywords: 'заочное обучение для взрослых аттестат' },
  { slug: 'kak-uchit-rebenka-matematike-doma', title: 'Как учить ребёнка математике дома: методики и практические советы', category: 'Советы родителям', keywords: 'как учить математике дома' },
  { slug: 'eksternat-v-10-klasse', title: 'Экстернат в 10–11 классе: как пройти старшую школу быстрее', category: 'Формы обучения', keywords: 'экстернат 10 11 класс' },
  { slug: 'nadomnoe-obuchenie-po-zdorovyu', title: 'Надомное обучение по медицинским показаниям: права и порядок оформления', category: 'Домашнее обучение', keywords: 'надомное обучение по здоровью' },
  { slug: 'kak-prohodit-domashneye-obuchenie', title: 'Как проходит домашнее обучение: расписание, уроки и аттестации изнутри', category: 'Домашнее обучение', keywords: 'как проходит домашнее обучение' },
  { slug: 'eksternat-za-9-klass', title: 'Экстернат за 9 класс: как сдать ОГЭ раньше срока', category: 'Формы обучения', keywords: 'экстернат 9 класс ОГЭ' },
  { slug: 'chem-otlichaetsya-nadomnoe-ot-semejnogo', title: 'Надомное vs семейное обучение: в чём принципиальная разница', category: 'Домашнее обучение', keywords: 'надомное семейное обучение разница' },
  { slug: 'zaochnoe-obuchenie-v-shkole', title: 'Заочная форма обучения в школе: плюсы, минусы и как перейти', category: 'Формы обучения', keywords: 'заочное обучение в школе' },
  { slug: 'semejnoe-obuchenie-podrostok', title: 'Семейное обучение подростка 7–9 класс: мотивация и организация', category: 'Домашнее обучение', keywords: 'семейное обучение подросток' },
  { slug: 'semejnoe-obuchenie-kak-proishodit', title: 'Как на самом деле проходит семейное обучение: организация изнутри', category: 'Домашнее обучение', keywords: 'как проходит семейное обучение' },
  { slug: 'semejnoe-obuchenie-starshaya-shkola', title: 'Семейное обучение в 10–11 классе: подготовка к ЕГЭ и поступлению', category: 'Домашнее обучение', keywords: 'семейное обучение старшая школа ЕГЭ' },
  { slug: 'kak-prohodit-distancionnoe-obuchenie', title: 'Как проходит дистанционное обучение в школе: расписание и уроки', category: 'Формы обучения', keywords: 'дистанционное обучение школа как проходит' },
  { slug: 'ochno-zaochnaya-forma-obucheniya', title: 'Очно-заочная форма обучения: что это и как оформить', category: 'Формы обучения', keywords: 'очно-заочная форма обучения' },
  { slug: 'raznovozrastnoe-obuchenie', title: 'Разновозрастное обучение: что это такое и как работает на практике', category: 'Образовательные системы', keywords: 'разновозрастное обучение' },
  { slug: 'smeshannoe-obuchenie-blended', title: 'Смешанное обучение (blended learning): как сочетать онлайн и очный формат', category: 'Образовательные системы', keywords: 'смешанное обучение blended learning' },
  { slug: 'anskuling-chto-eto', title: 'Анскулинг: обучение без программы — что это и кому подходит', category: 'Образовательные системы', keywords: 'анскулинг что это' },
  { slug: 'obuchenie-detej-s-sdvg', title: 'Обучение детей с СДВГ: как организовать учёбу и какой формат выбрать', category: 'Советы родителям', keywords: 'обучение ребёнок СДВГ' },
  { slug: 'obuchenie-levshej', title: 'Обучение леворуких детей: нужно ли переучивать и как помочь', category: 'Советы родителям', keywords: 'обучение леворукий ребёнок' },
  { slug: 'obuchenie-dvuyazychnyh-detej', title: 'Обучение двуязычных детей: как поддержать оба языка и не навредить', category: 'Советы родителям', keywords: 'обучение двуязычный ребёнок' },
  { slug: 'obuchenie-rebyonka-v-emigracii', title: 'Обучение ребёнка в эмиграции: как сохранить российскую программу за рубежом', category: 'Домашнее обучение', keywords: 'обучение ребёнок эмиграция' },
  { slug: 'raznica-ochnogo-i-zaochnogo', title: 'Очное и заочное обучение: в чём разница и что выбрать', category: 'Формы обучения', keywords: 'очное заочное обучение разница' },
  { slug: 'legalno-li-uchitsya-doma', title: 'Можно ли учиться дома легально: что говорит закон об образовании', category: 'Домашнее обучение', keywords: 'домашнее обучение легально закон' },
  { slug: 'kto-mozhet-pereyti-na-semejnoe', title: 'Кому подходит семейное обучение: условия и кто может перейти', category: 'Домашнее обучение', keywords: 'кто может перейти семейное обучение' },
  { slug: 's-kakogo-klassa-semejnoe-obuchenie', title: 'С какого класса можно перейти на семейное обучение', category: 'Домашнее обучение', keywords: 'с какого класса семейное обучение' },
  { slug: 'kak-ustroen-uchebnyj-god-na-semejnom', title: 'Как устроен учебный год на семейном обучении: расписание и темп', category: 'Домашнее обучение', keywords: 'учебный год семейное обучение' },
  { slug: 'mozhno-li-vernutsya-v-shkolu-posle-semejnogo', title: 'Можно ли вернуться в обычную школу после семейного обучения', category: 'Домашнее обучение', keywords: 'вернуться в школу после семейного обучения' },
  { slug: 'eksternat-vs-onlajn-shkola', title: 'Экстернат или онлайн-школа: в чём разница и что выбрать', category: 'Формы обучения', keywords: 'экстернат онлайн-школа разница' },
  { slug: 'komu-podhodit-distancionnoe-obuchenie', title: 'Кому подходит дистанционное обучение: честный разбор и критерии', category: 'Формы обучения', keywords: 'кому подходит дистанционное обучение' },
  { slug: 'kak-organizovat-semejnoe-obuchenie', title: 'Как организовать семейное обучение с нуля: пошаговый план', category: 'Домашнее обучение', keywords: 'как организовать семейное обучение' },
  { slug: 'semejnoe-obuchenie-mnogodetnym', title: 'Семейное обучение в многодетной семье: как организовать нескольких детей', category: 'Домашнее обучение', keywords: 'семейное обучение многодетная семья' },
  { slug: 'semejnoe-obuchenie-v-puteshestvii', title: 'Семейное обучение в путешествии: учёба в поездках', category: 'Домашнее обучение', keywords: 'семейное обучение путешествие' },
  { slug: 'worldschooling-chto-eto', title: 'Worldschooling: что это такое и как учиться путешествуя', category: 'Образовательные системы', keywords: 'worldschooling обучение в путешествиях' },
  { slug: 'eksternat-posle-9-klassa', title: 'Экстернат после 9 класса: как ускоренно пройти 10–11 классы', category: 'Формы обучения', keywords: 'экстернат после 9 класса' },
  { slug: 'predprofilnaya-podgotovka', title: 'Предпрофильная подготовка в 8–9 классе: что это и как выбрать направление', category: 'Советы родителям', keywords: 'предпрофильная подготовка 8 9 класс' },

  // === ОНЛАЙН-ШКОЛА ===
  { slug: 'kak-rabotat-s-elektronnymi-uchebnikami', title: 'Как работать с электронными учебниками: организация и лайфхаки', category: 'Учёба и навыки', keywords: 'электронные учебники школьник' },
  { slug: 'onlajn-resursy-dlya-domashnego-obucheniya', title: 'Лучшие онлайн-ресурсы для домашнего обучения: платформы и тренажёры', category: 'Домашнее обучение', keywords: 'онлайн ресурсы домашнее обучение' },
  { slug: 'vechernyaya-shkola-onlajn', title: 'Вечерняя школа онлайн: дистанционное обучение для работающих', category: 'Формы обучения', keywords: 'вечерняя школа онлайн' },
  { slug: 'kak-pomoch-s-matematicheskimi-zadachami', title: 'Как помочь ребёнку с математикой без слёз и репетиторов', category: 'Советы родителям', keywords: 'помочь ребёнку с математикой' },
  { slug: 'kak-organizovat-uchebnoe-mesto', title: 'Как организовать учебное место дома: освещение, мебель и зонирование', category: 'Советы родителям', keywords: 'учебное место дома школьник' },
  { slug: 'kak-nauchit-uchitsya-samostoyatelno', title: 'Как научить ребёнка учиться самостоятельно: пошаговый подход', category: 'Советы родителям', keywords: 'учиться самостоятельно ребёнок' },
  { slug: 'kak-spravitsya-s-domashnej-rabotoj', title: 'Как справляться с домашней работой быстро: чтобы не растягивалось на весь вечер', category: 'Учёба и навыки', keywords: 'домашняя работа быстро' },
  { slug: 'kak-ne-otvlekatsya-na-urokah-onlajn', title: 'Как не отвлекаться на онлайн-уроках: рабочие приёмы концентрации', category: 'Учёба и навыки', keywords: 'концентрация онлайн урок' },
  { slug: 'kak-postupit-v-vuz-posle-onlajn-shkoly', title: 'Как поступить в вуз после онлайн-школы: пошаговый план', category: 'Поступление', keywords: 'поступить в вуз онлайн-школа' },
  { slug: 'kak-chitat-otzyvy-ob-onlajn-shkolah', title: 'Отзывы об онлайн-школах: как читать и не ошибиться с выбором', category: 'Советы родителям', keywords: 'отзывы онлайн-школа как выбрать' },
  { slug: 'onlajn-doska-dlya-uchyoby', title: 'Онлайн-доска для учёбы: инструменты и как использовать', category: 'Учёба и навыки', keywords: 'онлайн доска учёба' },
  { slug: 'onlajn-kursy-dlya-shkolnikov', title: 'Онлайн-курсы для школьников: какие бывают и как выбрать', category: 'Советы родителям', keywords: 'онлайн курсы школьник' },
  { slug: 'onlajn-repetitor-vs-onlajn-shkola', title: 'Онлайн-репетитор или онлайн-школа: разница и как выбрать', category: 'Советы родителям', keywords: 'онлайн репетитор онлайн-школа разница' },
  { slug: 'onlajn-olimpiady-dlya-shkolnikov', title: 'Онлайн-олимпиады для школьников: какие бывают и как получить льготы', category: 'Советы родителям', keywords: 'онлайн олимпиады школьники' },
  { slug: 'proktoring-na-onlajn-ekzamenah', title: 'Прокторинг на онлайн-экзаменах: что это и как подготовиться', category: 'Учёба и навыки', keywords: 'прокторинг онлайн экзамен' },
  { slug: 'obrazovatelnye-prilozheniya-dlya-shkolnika', title: 'Образовательные приложения для школьника: как выбрать полезные', category: 'Учёба и навыки', keywords: 'образовательные приложения школьник' },
  { slug: 'ocenki-v-onlajn-shkole', title: 'Есть ли оценки в онлайн-школе и как там оценивают', category: 'Формы обучения', keywords: 'оценки онлайн-школа' },
  { slug: 'kak-poluchit-attestat-onlajn', title: 'Как получить аттестат государственного образца онлайн', category: 'Документы', keywords: 'аттестат онлайн государственного образца' },
  { slug: 'kak-onlajn-shkola-gotovit-k-ekzamenam', title: 'Как онлайн-школа готовит к ОГЭ и ЕГЭ: форматы и результаты', category: 'ОГЭ и ЕГЭ', keywords: 'онлайн-школа подготовка ЕГЭ ОГЭ' },

  // === ПЕРЕХОД В ОНЛАЙН ===
  { slug: 'smena-shkoly-v-podrostkovom-vozraste', title: 'Смена школы в подростковом возрасте: как помочь адаптироваться', category: 'Советы родителям', keywords: 'смена школы подросток адаптация' },
  { slug: 'kak-ne-boyatsya-perehoda-na-onlajn', title: 'Как не бояться перехода на онлайн-обучение: разбор главных страхов', category: 'Формы обучения', keywords: 'страх перехода онлайн обучение' },
  { slug: 'perehod-na-domashnee-obuchenie-s-chego-nachat', title: 'Переход на домашнее обучение: с чего начать и как подготовиться', category: 'Домашнее обучение', keywords: 'переход домашнее обучение с чего начать' },
  { slug: 'pervyj-mesyac-na-onlajn-obuchenii', title: 'Первый месяц на онлайн-обучении: чего ждать и как пройти', category: 'Формы обучения', keywords: 'первый месяц онлайн обучение' },
  { slug: 'onlajn-shkola-v-malenkom-gorode', title: 'Онлайн-школа в маленьком городе: сильное образование вне мегаполиса', category: 'Советы родителям', keywords: 'онлайн-школа маленький город' },
  { slug: 'kak-perejti-na-onlajn-v-10-klasse', title: 'Как перейти на онлайн-обучение в 10 классе: пошаговый план', category: 'Формы обучения', keywords: 'перейти онлайн 10 класс' },
  { slug: 'kak-zabrat-lichnoe-delo-iz-shkoly', title: 'Как забрать личное дело из школы: какие документы и порядок', category: 'Документы', keywords: 'личное дело школа забрать' },
  { slug: 'kak-soobshchit-shkole-ob-uhode', title: 'Как сообщить школе об уходе: корректно и по правилам', category: 'Документы', keywords: 'сообщить школе об уходе' },
  { slug: 'perevod-v-onlajn-iz-za-bullinga', title: 'Перевод в онлайн-школу из-за буллинга: как вернуть безопасность', category: 'Советы родителям', keywords: 'перевод онлайн буллинг' },
  { slug: 'perevod-v-onlajn-iz-za-zdorovya', title: 'Перевод в онлайн из-за здоровья: учёба без вреда для самочувствия', category: 'Домашнее обучение', keywords: 'перевод онлайн здоровье' },
  { slug: 'perevod-v-onlajn-iz-za-sporta', title: 'Перевод в онлайн из-за спорта: как совмещать тренировки и учёбу', category: 'Советы родителям', keywords: 'онлайн школа спорт совмещать' },
  { slug: 'kak-ponyat-podhodit-li-onlajn-rebyonku', title: 'Как понять, подходит ли онлайн-обучение вашему ребёнку', category: 'Советы родителям', keywords: 'онлайн обучение подходит ребёнку' },
  { slug: 'kak-rasskazat-rebyonku-o-perevode-v-onlajn', title: 'Как рассказать ребёнку о переводе в онлайн-школу: разговор без страха', category: 'Советы родителям', keywords: 'рассказать ребёнку перевод онлайн' },
  { slug: 'perevod-v-vypusknom-klasse', title: 'Перевод в онлайн в выпускном классе: как не навредить поступлению', category: 'Формы обучения', keywords: 'перевод онлайн выпускной класс' },
  { slug: 'perevod-v-onlajn-posle-bolezni', title: 'Как перейти на онлайн после болезни: без перегруза и стресса', category: 'Домашнее обучение', keywords: 'перейти онлайн после болезни' },
  { slug: 'perevod-iz-gosudarstvennoj-shkoly', title: 'Перевод ребёнка из государственной школы: права родителей', category: 'Документы', keywords: 'перевод государственная школа права' },
  { slug: 'kak-perevesti-letom', title: 'Как перевести ребёнка в онлайн-школу летом: почему каникулы удобны', category: 'Советы родителям', keywords: 'перевести онлайн летом каникулы' },
  { slug: 'perevod-v-onlajn-pri-pereezde', title: 'Перевод в онлайн при переезде за границу: сохранение российской программы', category: 'Домашнее обучение', keywords: 'онлайн школа переезд за границу' },
  { slug: 'chto-delat-esli-shkola-ne-otpuskaet', title: 'Что делать, если школа не отпускает на семейное обучение: ваши права', category: 'Документы', keywords: 'школа не отпускает семейное обучение права' },

  // === ДОКУМЕНТЫ И АТТЕСТАТ ===
  { slug: 'ocenki-pri-semejnom-obuchenii', title: 'Оценки при семейном обучении: как выставляются и что значат', category: 'Домашнее обучение', keywords: 'оценки семейное обучение' },
  { slug: 'individualnyj-uchebnyj-plan', title: 'Индивидуальный учебный план в школе: что это и как оформить', category: 'Документы', keywords: 'индивидуальный учебный план школа' },
  { slug: 'kak-oformit-semejnoe-obuchenie-dokumenty', title: 'Как оформить семейное обучение: документы и пошаговый порядок', category: 'Домашнее обучение', keywords: 'оформить семейное обучение документы' },
  { slug: 'prava-roditelej-na-semejnom-obuchenii', title: 'Права родителей при семейном обучении: что гарантирует закон', category: 'Домашнее обучение', keywords: 'права родителей семейное обучение' },
  { slug: 'attestat-vechernej-shkoly', title: 'Аттестат вечерней школы: равноценен ли обычному и как получить', category: 'Документы', keywords: 'аттестат вечерняя школа' },
  { slug: 'lichnoe-delo-pri-perevode', title: 'Личное дело при переводе в другую школу: что это и как передаётся', category: 'Документы', keywords: 'личное дело перевод школа' },
  { slug: 'rossijskij-attestat-za-granicej', title: 'Российский аттестат за границей: как получить онлайн из другой страны', category: 'Документы', keywords: 'российский аттестат за границей' },
  { slug: 'medkarta-dlya-shkoly', title: 'Медкарта для школы: какие прививки и осмотры нужны', category: 'Документы', keywords: 'медкарта школа прививки' },
  { slug: 'uvedomlenie-o-semejnom-obuchenii', title: 'Уведомление о семейном обучении: как составить и подать в орган опеки', category: 'Документы', keywords: 'уведомление семейное обучение' },
  { slug: 'zayavlenie-na-semejnoe-obuchenie', title: 'Заявление на семейное обучение: образец и порядок подачи', category: 'Документы', keywords: 'заявление семейное обучение образец' },
  { slug: 'dokumenty-dlya-onlajn-shkoly', title: 'Документы для перевода в онлайн-школу: полный список', category: 'Документы', keywords: 'документы перевод онлайн-школа' },
  { slug: 'akademicheskij-otpusk-v-shkole', title: 'Академический отпуск в школе: как оформить и кому положен', category: 'Документы', keywords: 'академический отпуск школа' },
  { slug: 'kak-poluchit-attestat-bez-ekzamenov', title: 'Как получить аттестат без экзаменов: законные пути', category: 'Документы', keywords: 'аттестат без экзаменов' },
  { slug: 'medal-za-osobye-uspehi-shkola', title: 'Медаль «За особые успехи в учении»: условия получения', category: 'Документы', keywords: 'медаль за особые успехи школа' },
  { slug: 'kak-podtverdit-obrazovanie-za-rubezhom', title: 'Как подтвердить российское образование за рубежом: апостиль и перевод', category: 'Документы', keywords: 'подтвердить образование за рубежом апостиль' },
  { slug: 'obuchenie-bez-propiski', title: 'Обучение без прописки: право на образование и как оформить', category: 'Документы', keywords: 'обучение без прописки школа' },
  { slug: 'kak-perehodit-mezhdu-regionami', title: 'Как оформить перевод ребёнка при переезде в другой регион', category: 'Документы', keywords: 'перевод школа другой регион переезд' },
  { slug: 'zaklyuchenie-pmpk', title: 'Заключение ПМПК: как получить и что даёт', category: 'Документы', keywords: 'ПМПК заключение школа' },
  { slug: 'zolotaya-medal-v-onlajn-shkole', title: 'Золотая медаль в онлайн-школе: реально ли получить дистанционно', category: 'Документы', keywords: 'золотая медаль онлайн-школа' },

  // === ОГЭ И ЕГЭ ===
  { slug: 'podgotovka-k-vpr-na-domashnem', title: 'Подготовка к ВПР на домашнем обучении: сроки и форматы', category: 'ОГЭ и ЕГЭ', keywords: 'ВПР домашнее обучение подготовка' },
  { slug: 'kak-sdat-ege-na-domashnem-obuchenii', title: 'Как сдать ЕГЭ на домашнем обучении: регистрация и подготовка', category: 'ОГЭ и ЕГЭ', keywords: 'ЕГЭ домашнее обучение как сдать' },
  { slug: 'kak-sdat-oge-na-domashnem-obuchenii', title: 'Как сдать ОГЭ на домашнем обучении: порядок и подготовка', category: 'ОГЭ и ЕГЭ', keywords: 'ОГЭ домашнее обучение как сдать' },
  { slug: 'oge-po-istorii', title: 'ОГЭ по истории: структура, типичные ошибки и как готовиться', category: 'ОГЭ и ЕГЭ', keywords: 'ОГЭ история подготовка' },
  { slug: 'oge-po-literature', title: 'ОГЭ по литературе: формат, сочинение и критерии оценки', category: 'ОГЭ и ЕГЭ', keywords: 'ОГЭ литература подготовка' },
  { slug: 'rezervnyj-den-ege', title: 'Резервные дни ЕГЭ: кто сдаёт в резерв и как записаться', category: 'ОГЭ и ЕГЭ', keywords: 'резервные дни ЕГЭ' },
  { slug: 'gve-chto-eto-za-ekzamen', title: 'ГВЭ: что это за экзамен и кто его сдаёт вместо ЕГЭ', category: 'ОГЭ и ЕГЭ', keywords: 'ГВЭ государственный выпускной экзамен' },
  { slug: 'oge-po-himii-podgotovka', title: 'ОГЭ по химии: структура, задания и как готовиться', category: 'ОГЭ и ЕГЭ', keywords: 'ОГЭ химия подготовка' },
  { slug: 'oge-po-fizike-podgotovka', title: 'ОГЭ по физике: структура, эксперимент и типичные ошибки', category: 'ОГЭ и ЕГЭ', keywords: 'ОГЭ физика подготовка' },
  { slug: 'oge-po-geografii-podgotovka', title: 'ОГЭ по географии: структура, карты и как готовиться', category: 'ОГЭ и ЕГЭ', keywords: 'ОГЭ география подготовка' },
  { slug: 'ege-po-profilnoj-matematike', title: 'ЕГЭ по профильной математике: структура, темы и советы', category: 'ОГЭ и ЕГЭ', keywords: 'ЕГЭ профильная математика' },
  { slug: 'ege-po-bazovoj-matematike', title: 'ЕГЭ по базовой математике: кому сдавать и чем отличается от профильной', category: 'ОГЭ и ЕГЭ', keywords: 'ЕГЭ базовая математика' },
  { slug: 'oge-po-anglijskomu-podgotovka', title: 'ОГЭ по английскому: письменная и устная части — как готовиться', category: 'ОГЭ и ЕГЭ', keywords: 'ОГЭ английский подготовка' },
  { slug: 'oge-po-biologii-podgotovka', title: 'ОГЭ по биологии: структура, типичные ошибки и план подготовки', category: 'ОГЭ и ЕГЭ', keywords: 'ОГЭ биология подготовка' },
  { slug: 'oge-po-informatike-podgotovka', title: 'ОГЭ по информатике: практические задания и как готовиться', category: 'ОГЭ и ЕГЭ', keywords: 'ОГЭ информатика подготовка' },
  { slug: 'ege-po-anglijskomu-podgotovka', title: 'ЕГЭ по английскому: письменная и устная части — полный разбор', category: 'ОГЭ и ЕГЭ', keywords: 'ЕГЭ английский подготовка' },
  { slug: 'apellyaciya-ege-kak-podat', title: 'Апелляция на ЕГЭ: когда подавать и как правильно оформить', category: 'ОГЭ и ЕГЭ', keywords: 'апелляция ЕГЭ как подать' },
  { slug: 'vpr-chto-eto-takoe', title: 'ВПР: что это такое и зачем нужны всероссийские проверочные работы', category: 'ОГЭ и ЕГЭ', keywords: 'ВПР что это всероссийские проверочные работы' },
  { slug: 'kak-reshat-test-bez-oshibok', title: 'Как решать тестовые задания без ошибок: ловушки и стратегии', category: 'ОГЭ и ЕГЭ', keywords: 'тест без ошибок стратегия' },
  { slug: 'chem-oge-otlichaetsya-ot-ege', title: 'Чем ОГЭ отличается от ЕГЭ: разбираемся в экзаменах', category: 'ОГЭ и ЕГЭ', keywords: 'разница ОГЭ ЕГЭ' },
  { slug: 'dosrochnyj-period-ege-oge', title: 'Досрочный период ЕГЭ и ОГЭ: кто может сдавать раньше', category: 'ОГЭ и ЕГЭ', keywords: 'досрочный период ЕГЭ ОГЭ' },
  { slug: 'ossennyaya-peresdacha-ege', title: 'Осенняя пересдача ЕГЭ: кто имеет право и как подготовиться', category: 'ОГЭ и ЕГЭ', keywords: 'осенняя пересдача ЕГЭ' },
  { slug: 'kak-sdat-vpr-bez-podgotovki', title: 'Как сдать ВПР без долгой подготовки: что успеть в последний момент', category: 'ОГЭ и ЕГЭ', keywords: 'сдать ВПР быстро' },

  // === ПСИХОЛОГИЯ ===
  { slug: 'vygoranie-roditelej-na-semejnom', title: 'Выгорание родителей на семейном обучении: признаки и как справиться', category: 'Советы родителям', keywords: 'выгорание родители семейное обучение' },
  { slug: 'kak-pomoch-rebenku-polyubit-chtenie', title: 'Как помочь ребёнку полюбить чтение: советы для домашнего обучения', category: 'Советы родителям', keywords: 'ребёнок чтение как помочь' },
  { slug: 'kak-pomoch-rebenku-s-anglijskim', title: 'Как помочь ребёнку с английским языком дома: методы и ресурсы', category: 'Советы родителям', keywords: 'помочь ребёнку с английским' },
  { slug: 'pervyj-den-v-novoj-shkole', title: 'Первый день в новой школе: как помочь ребёнку адаптироваться', category: 'Советы родителям', keywords: 'первый день новая школа адаптация' },
  { slug: 'pohvala-i-kritika-rebenka', title: 'Похвала и критика: как правильно хвалить и ругать ребёнка', category: 'Советы родителям', keywords: 'похвала критика ребёнок воспитание' },
  { slug: 'detskaya-lozh-pochemu-i-chto-delat', title: 'Детская ложь: почему ребёнок врёт и что делать родителям', category: 'Советы родителям', keywords: 'детская ложь почему ребёнок врёт' },
  { slug: 'konflikty-bratev-i-syostyor', title: 'Конфликты между братьями и сёстрами: что делать родителям', category: 'Советы родителям', keywords: 'конфликт братья сёстры' },
  { slug: 'zastenchivyj-rebenok-kak-pomoch', title: 'Застенчивый ребёнок: как помочь раскрыться и найти друзей', category: 'Советы родителям', keywords: 'застенчивый ребёнок как помочь' },
  { slug: 'giperaktivnyj-rebenok-uchyoba', title: 'Гиперактивный ребёнок и учёба: СДВГ и как помочь', category: 'Советы родителям', keywords: 'гиперактивный ребёнок СДВГ учёба' },
  { slug: 'rezhim-sna-podrostka', title: 'Режим сна подростка: сколько нужно спать и почему это важно для учёбы', category: 'Советы родителям', keywords: 'режим сна подросток' },
  { slug: 'rebenok-hochet-stat-blogerom', title: 'Ребёнок хочет стать блогером: как реагировать и поддержать', category: 'Советы родителям', keywords: 'ребёнок блогер как реагировать' },
  { slug: 'igrovaya-zavisimost-u-rebenka', title: 'Игровая зависимость у ребёнка: как отличить увлечение от зависимости', category: 'Советы родителям', keywords: 'игровая зависимость ребёнок' },
  { slug: 'disleksiya-u-shkolnika', title: 'Дислексия у школьника: признаки и как помочь с чтением', category: 'Советы родителям', keywords: 'дислексия школьник признаки' },
  { slug: 'nastavnik-dlya-podrostka', title: 'Наставник для подростка: зачем нужен значимый взрослый', category: 'Советы родителям', keywords: 'наставник подросток значимый взрослый' },
  { slug: 'agressiya-u-podrostka', title: 'Агрессия у подростка: откуда берётся и как реагировать родителям', category: 'Советы родителям', keywords: 'агрессия подросток что делать' },
  { slug: 'strah-oshibki-u-rebenka', title: 'Страх ошибки у ребёнка: почему боится и как снять тревожность', category: 'Советы родителям', keywords: 'страх ошибки ребёнок' },
  { slug: 'kak-najti-druzej-podrostku', title: 'Как подростку найти друзей: почему трудно и как помочь', category: 'Советы родителям', keywords: 'подросток найти друзей' },
  { slug: 'strah-publichnyh-vystuplenij-rebenok', title: 'Страх публичных выступлений у ребёнка: как помочь справиться', category: 'Советы родителям', keywords: 'страх публичных выступлений ребёнок' },
  { slug: 'samoocenka-podrostka', title: 'Самооценка подростка: как формируется и что влияет', category: 'Советы родителям', keywords: 'самооценка подросток' },
  { slug: 'nizkaya-motivaciya-k-uchebe', title: 'Низкая мотивация к учёбе: почему пропадает интерес и что делать', category: 'Советы родителям', keywords: 'низкая мотивация учёба' },
  { slug: 'disgrafiya-u-shkolnika', title: 'Дисграфия у школьника: как помочь с письмом', category: 'Советы родителям', keywords: 'дисграфия школьник письмо' },
  { slug: 'granicy-v-vospitanii', title: 'Границы в воспитании: зачем нужны и как устанавливать без криков', category: 'Советы родителям', keywords: 'границы воспитание ребёнок' },
  { slug: 'krizis-7-let', title: 'Кризис 7 лет: признаки, причины и как помочь ребёнку', category: 'Советы родителям', keywords: 'кризис 7 лет ребёнок' },
  { slug: 'infantilnost-podrostka', title: 'Инфантильность подростка: почему не взрослеет и как помочь', category: 'Советы родителям', keywords: 'инфантильность подросток' },
  { slug: 'kak-gotovitsya-k-uroku-effektivno', title: 'Как готовиться к уроку эффективно: меньше времени, больше толку', category: 'Учёба и навыки', keywords: 'готовиться к уроку эффективно' },
  { slug: 'dnevnik-uspehov-rebenka', title: 'Дневник успехов: как вести и зачем нужен школьнику', category: 'Учёба и навыки', keywords: 'дневник успехов школьник' },
  { slug: 'kak-podgotovitsya-k-ekzamenu-za-den', title: 'Как подготовиться к экзамену за один день: реальный план', category: 'ОГЭ и ЕГЭ', keywords: 'подготовиться к экзамену за день' },

  // === СТОИМОСТЬ И ОПЛАТА ===
  { slug: 'skolko-stoit-domashnee-obuchenie', title: 'Сколько стоит домашнее обучение: реальные цены и компенсации', category: 'Финансы образования', keywords: 'стоимость домашнее обучение' },
  { slug: 'kompensaciya-za-semejnoe-obuchenie', title: 'Компенсация за семейное обучение: кому платят, сколько и как получить', category: 'Финансы образования', keywords: 'компенсация семейное обучение' },
  { slug: 'skrytye-rashody-na-shkolu', title: 'Скрытые расходы на школу: на что реально уходят деньги', category: 'Финансы образования', keywords: 'скрытые расходы школа' },
  { slug: 'ekonomiya-na-shkole', title: 'Как сэкономить на школе: где сократить расходы без ущерба для качества', category: 'Финансы образования', keywords: 'экономия школа расходы' },
  { slug: 'skolko-stoit-repetitor-2026', title: 'Сколько стоит репетитор в 2026 году: цены и от чего зависят', category: 'Финансы образования', keywords: 'стоимость репетитор цена 2026' },
  { slug: 'skolko-stoit-onlajn-shkola-2026', title: 'Сколько стоит онлайн-школа в 2026 году: диапазон цен и тарифы', category: 'Финансы образования', keywords: 'стоимость онлайн-школа 2026' },
  { slug: 'podrabotka-dlya-podrostka', title: 'Подработка для подростка: с какого возраста можно работать', category: 'Советы родителям', keywords: 'подработка подросток возраст' },
  { slug: 'materinskij-kapital-na-shkolu', title: 'Как оплатить онлайн-школу материнским капиталом: пошаговый разбор', category: 'Финансы образования', keywords: 'материнский капитал оплата школа' },
  { slug: 'lgoty-dlya-mnogodetnyh-v-shkole', title: 'Льготы для многодетных семей в школе: что положено по закону', category: 'Финансы образования', keywords: 'льготы многодетные школа' },
  { slug: 'skolko-stoit-semejnoe-obuchenie', title: 'Сколько стоит семейное обучение на самом деле: расходы и экономия', category: 'Финансы образования', keywords: 'стоимость семейное обучение' },
  { slug: 'vyplaty-za-semejnoe-obuchenie', title: 'Выплаты за семейное обучение: положены ли родителям деньги от государства', category: 'Финансы образования', keywords: 'выплаты семейное обучение государство' },
  { slug: 'kak-poluchit-kompensaciyu-za-semejnoe', title: 'Как получить компенсацию за семейное обучение: пошаговый разбор', category: 'Финансы образования', keywords: 'получить компенсацию семейное обучение' },
  { slug: 'vygodno-li-eksternat', title: 'Выгодно ли экстернат: сколько экономит по сравнению с обычной школой', category: 'Финансы образования', keywords: 'экстернат стоимость выгодно' },
  { slug: 'kak-platit-za-onlajn-shkolu-v-rassrochku', title: 'Как платить за онлайн-школу в рассрочку: варианты и условия', category: 'Финансы образования', keywords: 'онлайн-школа рассрочка оплата' },
]

// Фильтруем уже существующие
const toAdd = newTopics.filter(t => !existingSlugs.has(t.slug))
console.log(`Всего тем в списке: ${newTopics.length}`)
console.log(`Уже есть в системе: ${newTopics.length - toAdd.length}`)
console.log(`Добавляем в очередь: ${toAdd.length}`)

if (toAdd.length === 0) {
  console.log('Нечего добавлять!')
  process.exit(0)
}

// Загружаем очередь
const queue = JSON.parse(readFileSync(QUEUE, 'utf-8'))
const maxId = Math.max(...queue.topics.map(t => parseInt(t.id.replace('t', ''))))

// Добавляем новые темы
let nextId = maxId + 1
for (const topic of toAdd) {
  queue.topics.push({
    id: `t${String(nextId).padStart(3, '0')}`,
    status: 'pending',
    title: topic.title,
    slug: topic.slug,
    category: topic.category,
    keywords: topic.keywords,
    freq: 500, // средняя частотность
  })
  nextId++
}

// Обновляем мету
queue.meta.totalTopics = queue.topics.length
queue.meta.lastRun = new Date().toISOString()

writeFileSync(QUEUE, JSON.stringify(queue, null, 2))
console.log(`\n✅ Добавлено ${toAdd.length} тем в очередь`)
console.log(`   Всего в очереди: ${queue.meta.totalTopics}`)
console.log(`\nДля генерации статей запусти:`)
console.log(`   ANTHROPIC_API_KEY=sk-ant-... node scripts/generate-blog.mjs --count=20 --no-deploy`)
