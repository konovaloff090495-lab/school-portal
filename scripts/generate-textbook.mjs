#!/usr/bin/env node
/**
 * Генератор статей для онлайн-учебника
 * Использование:
 *   node scripts/generate-textbook.mjs --subject=matematika --klass=5
 *   node scripts/generate-textbook.mjs --subject=algebra --klass=8 --topic=kvadratnoe-uravnenie
 *   node scripts/generate-textbook.mjs --all --limit=10
 */

import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dir, '..')
const ARTICLES_FILE = resolve(ROOT, 'src/data/textbook-articles.ts')

// ─── Аргументы ───────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => {
      const [k, v] = a.slice(2).split('=')
      return [k, v ?? true]
    })
)

const SUBJECT = args.subject
const KLASS = args.klass ? Number(args.klass) : null
const TOPIC_SLUG = args.topic ?? null
const ALL = args.all === true
const LIMIT = args.limit ? Number(args.limit) : 5
const DRY_RUN = args['dry-run'] === true

// ─── Данные тем ──────────────────────────────────────────────────────────────
// Читаем напрямую из файла данных (без импорта TS)
const textbookData = readFileSync(resolve(ROOT, 'src/data/textbook.ts'), 'utf-8')

// Простая экстракция тем через регулярки из RAW_TOPICS
function extractTopics() {
  const topics = []
  const subjectRegex = /(\w[\w-]*):\s*\{/g
  const klassRegex = /(\d+):\s*\[/g
  const topicRegex = /\{\s*slug:\s*'([^']+)',\s*title:\s*'([^']+)',\s*excerpt:\s*'([^']+)'/g

  let match
  // Более надёжно: читаем из сгенерированного JSON файла
  // Вместо парсинга TS, используем Node.js require после сборки
  // Для скрипта используем статический список тем
  return topics
}

// Статический список тем (дублируем из textbook.ts для скрипта)
const ALL_TOPICS = [
  { subject: 'matematika', klass: 1, slug: 'schyot-do-10', title: 'Счёт до 10' },
  { subject: 'matematika', klass: 1, slug: 'slozhenie-vychitanie-do-10', title: 'Сложение и вычитание до 10' },
  { subject: 'matematika', klass: 1, slug: 'schyot-do-20', title: 'Счёт до 20' },
  { subject: 'matematika', klass: 1, slug: 'slozhenie-do-20-s-perehodom', title: 'Сложение и вычитание в пределах 20' },
  { subject: 'matematika', klass: 1, slug: 'geometricheskie-figury-1', title: 'Геометрические фигуры' },
  { subject: 'matematika', klass: 1, slug: 'izmerenie-dliny', title: 'Измерение длины' },
  { subject: 'matematika', klass: 1, slug: 'zadachi-v-1-deystvie', title: 'Простые задачи' },
  { subject: 'matematika', klass: 1, slug: 'poryadok-chisel', title: 'Порядок чисел и неравенства' },
  { subject: 'matematika', klass: 2, slug: 'tablitsa-slozheniya', title: 'Таблица сложения' },
  { subject: 'matematika', klass: 2, slug: 'tablitsa-mnozheniya', title: 'Таблица умножения' },
  { subject: 'matematika', klass: 2, slug: 'delenie', title: 'Деление' },
  { subject: 'matematika', klass: 2, slug: 'dvuznachnye-chisla', title: 'Двузначные числа' },
  { subject: 'matematika', klass: 2, slug: 'slozhenie-vychitanie-do-100', title: 'Сложение и вычитание до 100' },
  { subject: 'matematika', klass: 2, slug: 'ploshhad-i-perimetr', title: 'Площадь и периметр' },
  { subject: 'matematika', klass: 2, slug: 'edinitsy-vremeni', title: 'Единицы времени' },
  { subject: 'matematika', klass: 2, slug: 'zadachi-v-2-deystviya', title: 'Задачи в 2 действия' },
  { subject: 'matematika', klass: 3, slug: 'tablitsa-mnozheniya-polnaya', title: 'Полная таблица умножения' },
  { subject: 'matematika', klass: 3, slug: 'trёzнachnye-chisla', title: 'Трёхзначные числа' },
  { subject: 'matematika', klass: 3, slug: 'deление-s-ostatkom', title: 'Деление с остатком' },
  { subject: 'matematika', klass: 3, slug: 'umnozhenie-na-10-100', title: 'Умножение и деление на 10, 100' },
  { subject: 'matematika', klass: 3, slug: 'doли-drobi', title: 'Доли и дроби' },
  { subject: 'matematika', klass: 3, slug: 'edinitsy-dliny', title: 'Единицы длины' },
  { subject: 'matematika', klass: 3, slug: 'ploshhad-edinitsy', title: 'Единицы площади' },
  { subject: 'matematika', klass: 3, slug: 'slozhenie-vychitanie-trekhzn', title: 'Действия с трёхзначными числами' },
  { subject: 'matematika', klass: 4, slug: 'bolshie-chisla', title: 'Большие числа. Миллион' },
  { subject: 'matematika', klass: 4, slug: 'umnozhenie-mnozhn', title: 'Умножение многозначных чисел' },
  { subject: 'matematika', klass: 4, slug: 'delenie-mnozhn', title: 'Деление многозначных чисел' },
  { subject: 'matematika', klass: 4, slug: 'obyknovennye-drobi', title: 'Обыкновенные дроби' },
  { subject: 'matematika', klass: 4, slug: 'sravnenie-drobey', title: 'Сравнение дробей' },
  { subject: 'matematika', klass: 4, slug: 'ploshhad-treugolnika', title: 'Площадь треугольника' },
  { subject: 'matematika', klass: 4, slug: 'edinitsy-massy', title: 'Единицы массы и объёма' },
  { subject: 'matematika', klass: 4, slug: 'uravneniya-4', title: 'Уравнения' },
  { subject: 'matematika', klass: 5, slug: 'naturalnye-chisla-5', title: 'Натуральные числа и шкалы' },
  { subject: 'matematika', klass: 5, slug: 'delitelnost-chisel', title: 'Делимость чисел' },
  { subject: 'matematika', klass: 5, slug: 'nod-i-nok', title: 'НОД и НОК' },
  { subject: 'matematika', klass: 5, slug: 'obyknovennye-drobi-5', title: 'Обыкновенные дроби' },
  { subject: 'matematika', klass: 5, slug: 'dejstviya-s-drobyami', title: 'Действия с дробями' },
  { subject: 'matematika', klass: 5, slug: 'smeshannye-chisla', title: 'Смешанные числа' },
  { subject: 'matematika', klass: 5, slug: 'desyatichnye-drobi-5', title: 'Десятичные дроби' },
  { subject: 'matematika', klass: 5, slug: 'koordinatnaya-ploshhad', title: 'Координатная плоскость' },
  { subject: 'matematika', klass: 5, slug: 'protsenty', title: 'Проценты' },
  { subject: 'algebra', klass: 7, slug: 'algebraicheskie-vyrazheniya', title: 'Алгебраические выражения' },
  { subject: 'algebra', klass: 7, slug: 'monomials', title: 'Одночлены' },
  { subject: 'algebra', klass: 7, slug: 'polinomy', title: 'Многочлены' },
  { subject: 'algebra', klass: 7, slug: 'umnozhenie-polinomov', title: 'Умножение многочленов' },
  { subject: 'algebra', klass: 7, slug: 'formuly-sokrashchennogo-umnozheniya', title: 'Формулы сокращённого умножения' },
  { subject: 'algebra', klass: 7, slug: 'razlozhenie-na-mnozhiteli', title: 'Разложение на множители' },
  { subject: 'algebra', klass: 7, slug: 'lineynye-uravneniya', title: 'Линейные уравнения' },
  { subject: 'algebra', klass: 7, slug: 'sistemy-uravneniy-7', title: 'Системы линейных уравнений' },
  { subject: 'algebra', klass: 7, slug: 'neravenstva-7', title: 'Линейные неравенства' },
  { subject: 'algebra', klass: 7, slug: 'funktsiya-ponyatie', title: 'Понятие функции' },
  { subject: 'algebra', klass: 8, slug: 'ratsionalnye-drobi', title: 'Рациональные дроби' },
  { subject: 'algebra', klass: 8, slug: 'dejstviya-s-ratsionalnymi', title: 'Действия с рациональными дробями' },
  { subject: 'algebra', klass: 8, slug: 'kvadratnye-korni', title: 'Квадратные корни' },
  { subject: 'algebra', klass: 8, slug: 'preobrazovaniya-s-kornyami', title: 'Преобразования выражений с корнями' },
  { subject: 'algebra', klass: 8, slug: 'kvadratnoe-uravnenie', title: 'Квадратное уравнение' },
  { subject: 'algebra', klass: 8, slug: 'teorema-vieta', title: 'Теорема Виета' },
  { subject: 'algebra', klass: 8, slug: 'kvadratnye-neravenstva', title: 'Квадратные неравенства' },
  { subject: 'algebra', klass: 8, slug: 'funktiya-kvadratichnaya', title: 'Квадратичная функция' },
  { subject: 'algebra', klass: 8, slug: 'sistemy-s-kvadratnym', title: 'Системы с квадратными уравнениями' },
  { subject: 'algebra', klass: 9, slug: 'stepeni', title: 'Степени с целым показателем' },
  { subject: 'algebra', klass: 9, slug: 'kvadratnyj-trekhchlen', title: 'Квадратный трёхчлен' },
  { subject: 'algebra', klass: 9, slug: 'chislovy-posledovatelnosti', title: 'Числовые последовательности' },
  { subject: 'algebra', klass: 9, slug: 'geometricheskaya-progressiya', title: 'Геометрическая прогрессия' },
  { subject: 'algebra', klass: 9, slug: 'stepennaya-funktsia', title: 'Степенная функция' },
  { subject: 'algebra', klass: 9, slug: 'neravenstva-s-modulem', title: 'Уравнения и неравенства с модулем' },
  { subject: 'algebra', klass: 9, slug: 'veroytnost-9', title: 'Вероятность' },
  { subject: 'algebra', klass: 9, slug: 'statistika-9', title: 'Статистика' },
  { subject: 'algebra', klass: 10, slug: 'trigonometriya-osnovy', title: 'Тригонометрические функции' },
  { subject: 'algebra', klass: 10, slug: 'trigonometricheskie-formuly', title: 'Тригонометрические формулы' },
  { subject: 'algebra', klass: 10, slug: 'trigonometricheskie-uravneniya', title: 'Тригонометрические уравнения' },
  { subject: 'algebra', klass: 10, slug: 'pokazatelnaya-funktsia', title: 'Показательная функция' },
  { subject: 'algebra', klass: 10, slug: 'logarifmy', title: 'Логарифмы' },
  { subject: 'algebra', klass: 10, slug: 'logarifmicheskaya-funktsia', title: 'Логарифмическая функция' },
  { subject: 'algebra', klass: 10, slug: 'pokazatelnye-uravneniya', title: 'Показательные и логарифмические уравнения' },
  { subject: 'algebra', klass: 10, slug: 'kombinatorika', title: 'Комбинаторика' },
  { subject: 'geometriya', klass: 7, slug: 'osnovnye-ponyatiya', title: 'Основные понятия геометрии' },
  { subject: 'geometriya', klass: 7, slug: 'ugly', title: 'Углы' },
  { subject: 'geometriya', klass: 7, slug: 'treugolniki-osnovy', title: 'Треугольники' },
  { subject: 'geometriya', klass: 7, slug: 'priznak-ravенства-tr', title: 'Признаки равенства треугольников' },
  { subject: 'geometriya', klass: 7, slug: 'ravnobedrenny-treugolnik', title: 'Равнобедренный треугольник' },
  { subject: 'geometriya', klass: 7, slug: 'parallelnye-pryamye', title: 'Параллельные прямые' },
  { subject: 'geometriya', klass: 7, slug: 'teorema-parfallogramme', title: 'Четырёхугольники' },
  { subject: 'geometriya', klass: 7, slug: 'okruzhnost-7', title: 'Окружность' },
  { subject: 'geometriya', klass: 8, slug: 'ploshhad-figur', title: 'Площади фигур' },
  { subject: 'geometriya', klass: 8, slug: 'teorema-pifagora', title: 'Теорема Пифагора' },
  { subject: 'geometriya', klass: 8, slug: 'podob-treugolniki', title: 'Подобные треугольники' },
  { subject: 'geometriya', klass: 8, slug: 'sinus-kosinus-tr', title: 'Синус, косинус и тангенс угла' },
  { subject: 'geometriya', klass: 8, slug: 'vpisannye-opisannye', title: 'Вписанные и описанные окружности' },
  { subject: 'geometriya', klass: 8, slug: 'seredinnye-linii', title: 'Средняя линия треугольника и трапеции' },
  { subject: 'geometriya', klass: 8, slug: 'vektor-8', title: 'Векторы' },
  { subject: 'geometriya', klass: 8, slug: 'koordinaty-8', title: 'Метод координат' },
  { subject: 'geometriya', klass: 9, slug: 'sin-kosin-teorema', title: 'Теоремы синусов и косинусов' },
  { subject: 'geometriya', klass: 9, slug: 'pravilnye-mnogoug', title: 'Правильные многоугольники' },
  { subject: 'geometriya', klass: 9, slug: 'dlina-okruzhnosti', title: 'Длина окружности и площадь круга' },
  { subject: 'geometriya', klass: 9, slug: 'dvizhenie', title: 'Движения в геометрии' },
  { subject: 'geometriya', klass: 9, slug: 'preobrazovanie-podobiya', title: 'Преобразование подобия' },
  { subject: 'geometriya', klass: 9, slug: 'vektor-9', title: 'Векторный метод' },
  { subject: 'geometriya', klass: 10, slug: 'prostranstvo-aksiomy', title: 'Аксиомы стереометрии' },
  { subject: 'geometriya', klass: 10, slug: 'parallelnost-v-prostranstve', title: 'Параллельность в пространстве' },
  { subject: 'geometriya', klass: 10, slug: 'perpendikulyarnost', title: 'Перпендикулярность' },
  { subject: 'geometriya', klass: 10, slug: 'mnogogranniki', title: 'Многогранники' },
  { subject: 'geometriya', klass: 10, slug: 'tela-vrashheniya', title: 'Тела вращения' },
  { subject: 'geometriya', klass: 11, slug: 'koordinaty-prostranstvo', title: 'Координаты в пространстве' },
  { subject: 'geometriya', klass: 11, slug: 'vektor-prostranstvo', title: 'Векторы в пространстве' },
  { subject: 'geometriya', klass: 11, slug: 'uravnenie-ploskosti', title: 'Уравнение плоскости' },
  { subject: 'geometriya', klass: 11, slug: 'pravilnye-mnogogr', title: 'Правильные многогранники' },
  { subject: 'geometriya', klass: 11, slug: 'sechenia-tel', title: 'Сечения многогранников' },
  { subject: 'geometriya', klass: 1, slug: 'zvuki-bukvy', title: 'Звуки и буквы' },
  { subject: 'geometriya', klass: 1, slug: 'slog-udarenie', title: 'Слог и ударение' },
  { subject: 'geometriya', klass: 1, slug: 'zhshi-chashha', title: 'Сочетания жи-ши, ча-ща, чу-щу' },
  { subject: 'geometriya', klass: 1, slug: 'bolshaya-bukva', title: 'Заглавная буква' },
  { subject: 'geometriya', klass: 1, slug: 'predlozhenie', title: 'Предложение' },
  { subject: 'geometriya', klass: 1, slug: 'tekst', title: 'Текст' },
  { subject: 'literatura', klass: 5, slug: 'ustnoye-narodnoe-tvorchestvo', title: 'Устное народное творчество' },
  { subject: 'literatura', klass: 5, slug: 'krylov-basni', title: 'Басни Крылова' },
  { subject: 'literatura', klass: 5, slug: 'pushkin-5', title: 'А.С. Пушкин' },
  { subject: 'literatura', klass: 5, slug: 'gogol-5', title: 'Н.В. Гоголь «Вечера на хуторе»' },
  { subject: 'literatura', klass: 5, slug: 'turgenev-5', title: 'И.С. Тургенев «Муму»' },
  { subject: 'literatura', klass: 5, slug: 'nekrasov-5', title: 'Н.А. Некрасов' },
  { subject: 'literatura', klass: 5, slug: 'chekhov-5', title: 'А.П. Чехов' },
  { subject: 'literatura', klass: 9, slug: 'slovo-o-polku', title: '«Слово о полку Игореве»' },
  { subject: 'literatura', klass: 9, slug: 'pushkin-evgeny-onegin', title: 'А.С. Пушкин «Евгений Онегин»' },
  { subject: 'literatura', klass: 9, slug: 'lermontov-geroi-nashego', title: 'М.Ю. Лермонтов «Герой нашего времени»' },
  { subject: 'literatura', klass: 9, slug: 'gogol-mertvye-dushi', title: 'Н.В. Гоголь «Мёртвые души»' },
  { subject: 'literatura', klass: 9, slug: 'griboedov-gore', title: 'А.С. Грибоедов «Горе от ума»' },
  { subject: 'literatura', klass: 11, slug: 'bulgakov-master', title: 'М.А. Булгаков «Мастер и Маргарита»' },
  { subject: 'literatura', klass: 11, slug: 'sholokhov-tihiy-don', title: 'М.А. Шолохов «Тихий Дон»' },
  { subject: 'literatura', klass: 11, slug: 'akhmatova-requiem', title: 'А.А. Ахматова «Реквием»' },
  { subject: 'literatura', klass: 11, slug: 'pasternak-doktor-zhivago', title: 'Б.Л. Пастернак «Доктор Живаго»' },
  { subject: 'literatura', klass: 11, slug: 'ege-literatura', title: 'Подготовка к ЕГЭ по литературе' },
  { subject: 'literatura', klass: 5, slug: 'present-simple', title: 'Present Simple' },
  { subject: 'literatura', klass: 5, slug: 'past-simple', title: 'Past Simple' },
  { subject: 'literatura', klass: 5, slug: 'future-simple', title: 'Future Simple (will)' },
  { subject: 'literatura', klass: 5, slug: 'present-continuous', title: 'Present Continuous' },
  { subject: 'literatura', klass: 5, slug: 'modal-verbs-5', title: 'Модальные глаголы' },
  { subject: 'literatura', klass: 5, slug: 'articles', title: 'Артикли' },
  { subject: 'literatura', klass: 9, slug: 'perfect-tenses', title: 'Perfect Tenses' },
  { subject: 'literatura', klass: 9, slug: 'passive-voice', title: 'Страдательный залог' },
  { subject: 'literatura', klass: 9, slug: 'conditionals', title: 'Условные предложения' },
  { subject: 'literatura', klass: 9, slug: 'reported-speech', title: 'Косвенная речь' },
  { subject: 'literatura', klass: 9, slug: 'gerund-infinitive', title: 'Герундий и инфинитив' },
  { subject: 'literatura', klass: 9, slug: 'oge-english', title: 'Подготовка к ОГЭ по английскому' },
  { subject: 'literatura', klass: 11, slug: 'complex-grammar', title: 'Сложные грамматические конструкции' },
  { subject: 'literatura', klass: 11, slug: 'ege-english-writing', title: 'Письмо в ЕГЭ' },
  { subject: 'literatura', klass: 11, slug: 'ege-english-speaking', title: 'Устная часть ЕГЭ' },
  { subject: 'literatura', klass: 7, slug: 'fizicheskie-velichiny', title: 'Физические величины и измерения' },
  { subject: 'literatura', klass: 7, slug: 'mekhanika-dvizheniya', title: 'Механическое движение' },
  { subject: 'literatura', klass: 7, slug: 'sila', title: 'Силы в природе' },
  { subject: 'literatura', klass: 7, slug: 'zakony-nyutona', title: 'Законы Ньютона' },
  { subject: 'literatura', klass: 7, slug: 'davlenie', title: 'Давление. Закон Паскаля' },
  { subject: 'literatura', klass: 7, slug: 'arkhimed', title: 'Архимедова сила' },
  { subject: 'literatura', klass: 7, slug: 'rabota-moshhnost', title: 'Работа и мощность' },
  { subject: 'fizika', klass: 7, slug: 'fizicheskie-velichiny', title: 'Физические величины и измерения' },
  { subject: 'fizika', klass: 7, slug: 'mekhanika-dvizheniya', title: 'Механическое движение' },
  { subject: 'fizika', klass: 7, slug: 'sila', title: 'Силы в природе' },
  { subject: 'fizika', klass: 7, slug: 'zakony-nyutona', title: 'Законы Ньютона' },
  { subject: 'fizika', klass: 7, slug: 'davlenie', title: 'Давление. Закон Паскаля' },
  { subject: 'fizika', klass: 7, slug: 'arkhimed', title: 'Архимедова сила' },
  { subject: 'fizika', klass: 7, slug: 'rabota-moshhnost', title: 'Работа и мощность' },
  { subject: 'fizika', klass: 9, slug: 'ravnouskorennoe', title: 'Равноускоренное движение' },
  { subject: 'fizika', klass: 9, slug: 'krugovoe', title: 'Равномерное движение по окружности' },
  { subject: 'fizika', klass: 9, slug: 'zakon-vsemirnogo', title: 'Закон всемирного тяготения' },
  { subject: 'fizika', klass: 9, slug: 'impuls', title: 'Импульс. Закон сохранения импульса' },
  { subject: 'fizika', klass: 9, slug: 'energiya', title: 'Механическая энергия' },
  { subject: 'fizika', klass: 9, slug: 'elektricheskoe-pole', title: 'Электрическое поле' },
  { subject: 'fizika', klass: 9, slug: 'postoyanny-tok', title: 'Постоянный ток' },
  { subject: 'fizika', klass: 9, slug: 'oge-fizika', title: 'Подготовка к ОГЭ по физике' },
  { subject: 'fizika', klass: 11, slug: 'elektrodinamika-11', title: 'Электродинамика' },
  { subject: 'fizika', klass: 11, slug: 'kolebaniya-volny', title: 'Колебания и волны' },
  { subject: 'fizika', klass: 11, slug: 'optika', title: 'Оптика' },
  { subject: 'fizika', klass: 11, slug: 'kvantovaya', title: 'Квантовая физика' },
  { subject: 'fizika', klass: 11, slug: 'ege-fizika', title: 'Подготовка к ЕГЭ по физике' },
  { subject: 'fizika', klass: 8, slug: 'atom-molekula', title: 'Атом и молекула' },
  { subject: 'fizika', klass: 8, slug: 'tablitsa-mendeleeva', title: 'Периодическая система Менделеева' },
  { subject: 'fizika', klass: 8, slug: 'himicheskaya-svyaz', title: 'Химическая связь' },
  { subject: 'fizika', klass: 8, slug: 'oksidy', title: 'Оксиды' },
  { subject: 'fizika', klass: 8, slug: 'kisloty', title: 'Кислоты' },
  { subject: 'fizika', klass: 8, slug: 'osnovaniya', title: 'Основания' },
  { subject: 'fizika', klass: 8, slug: 'soli', title: 'Соли' },
  { subject: 'fizika', klass: 8, slug: 'himicheskie-uravneniya', title: 'Химические уравнения' },
  { subject: 'fizika', klass: 9, slug: 'okislenie-vosstanovlenie', title: 'Окисление и восстановление' },
  { subject: 'fizika', klass: 9, slug: 'metally', title: 'Металлы' },
  { subject: 'fizika', klass: 9, slug: 'nemetally', title: 'Неметаллы' },
  { subject: 'fizika', klass: 9, slug: 'elektroliticheskaya-dissotsiatsiya', title: 'Электролитическая диссоциация' },
  { subject: 'fizika', klass: 9, slug: 'oge-khimiya', title: 'Подготовка к ОГЭ по химии' },
  { subject: 'fizika', klass: 10, slug: 'organicheskaya-khimiya-vvedenie', title: 'Введение в органическую химию' },
  { subject: 'fizika', klass: 10, slug: 'uglevodorodyi', title: 'Углеводороды' },
  { subject: 'fizika', klass: 10, slug: 'kislorodzoderjashchie', title: 'Кислородсодержащие соединения' },
  { subject: 'khimiya', klass: 8, slug: 'atom-molekula', title: 'Атом и молекула' },
  { subject: 'khimiya', klass: 8, slug: 'tablitsa-mendeleeva', title: 'Периодическая система Менделеева' },
  { subject: 'khimiya', klass: 8, slug: 'himicheskaya-svyaz', title: 'Химическая связь' },
  { subject: 'khimiya', klass: 8, slug: 'oksidy', title: 'Оксиды' },
  { subject: 'khimiya', klass: 8, slug: 'kisloty', title: 'Кислоты' },
  { subject: 'khimiya', klass: 8, slug: 'osnovaniya', title: 'Основания' },
  { subject: 'khimiya', klass: 8, slug: 'soli', title: 'Соли' },
  { subject: 'khimiya', klass: 8, slug: 'himicheskie-uravneniya', title: 'Химические уравнения' },
  { subject: 'khimiya', klass: 9, slug: 'okislenie-vosstanovlenie', title: 'Окисление и восстановление' },
  { subject: 'khimiya', klass: 9, slug: 'metally', title: 'Металлы' },
  { subject: 'khimiya', klass: 9, slug: 'nemetally', title: 'Неметаллы' },
  { subject: 'khimiya', klass: 9, slug: 'elektroliticheskaya-dissotsiatsiya', title: 'Электролитическая диссоциация' },
  { subject: 'khimiya', klass: 9, slug: 'oge-khimiya', title: 'Подготовка к ОГЭ по химии' },
  { subject: 'khimiya', klass: 10, slug: 'organicheskaya-khimiya-vvedenie', title: 'Введение в органическую химию' },
  { subject: 'khimiya', klass: 10, slug: 'uglevodorodyi', title: 'Углеводороды' },
  { subject: 'khimiya', klass: 10, slug: 'kislorodzoderjashchie', title: 'Кислородсодержащие соединения' },
  { subject: 'khimiya', klass: 11, slug: 'azotsoderzhashchie', title: 'Азотсодержащие органические вещества' },
  { subject: 'khimiya', klass: 11, slug: 'polimery', title: 'Полимеры' },
  { subject: 'khimiya', klass: 11, slug: 'ege-khimiya', title: 'Подготовка к ЕГЭ по химии' },
  { subject: 'khimiya', klass: 5, slug: 'biologiya-nauka', title: 'Биология как наука' },
  { subject: 'khimiya', klass: 5, slug: 'kletka', title: 'Клетка — основа жизни' },
  { subject: 'khimiya', klass: 5, slug: 'tsarstvo-rasteny', title: 'Царство растений' },
  { subject: 'khimiya', klass: 5, slug: 'tsarstvo-gribov', title: 'Царство грибов' },
  { subject: 'khimiya', klass: 5, slug: 'tsarstvo-bakteriy', title: 'Бактерии' },
  { subject: 'khimiya', klass: 9, slug: 'genetika', title: 'Основы генетики' },
  { subject: 'khimiya', klass: 9, slug: 'evolyutsiya', title: 'Эволюция органического мира' },
  { subject: 'khimiya', klass: 9, slug: 'ekologiya', title: 'Экология' },
  { subject: 'khimiya', klass: 9, slug: 'chelovek-biologiya', title: 'Человек' },
  { subject: 'khimiya', klass: 9, slug: 'oge-biologiya', title: 'Подготовка к ОГЭ по биологии' },
  { subject: 'khimiya', klass: 11, slug: 'ege-biologiya', title: 'Подготовка к ЕГЭ по биологии' },
  { subject: 'khimiya', klass: 5, slug: 'pervobytnoye-obshhestvo', title: 'Первобытное общество' },
  { subject: 'khimiya', klass: 5, slug: 'drevniy-egipet', title: 'Древний Египет' },
  { subject: 'khimiya', klass: 5, slug: 'drevnyaya-gretsiya', title: 'Древняя Греция' },
  { subject: 'khimiya', klass: 5, slug: 'drevniy-rim', title: 'Древний Рим' },
  { subject: 'khimiya', klass: 6, slug: 'srednevekovaya-evropa', title: 'Средневековая Европа' },
  { subject: 'khimiya', klass: 6, slug: 'drevnyaya-rus', title: 'Древняя Русь' },
  { subject: 'khimiya', klass: 6, slug: 'mongolo-tatarskoe', title: 'Монголо-татарское нашествие' },
  { subject: 'biologiya', klass: 5, slug: 'biologiya-nauka', title: 'Биология как наука' },
  { subject: 'biologiya', klass: 5, slug: 'kletka', title: 'Клетка — основа жизни' },
  { subject: 'biologiya', klass: 5, slug: 'tsarstvo-rasteny', title: 'Царство растений' },
  { subject: 'biologiya', klass: 5, slug: 'tsarstvo-gribov', title: 'Царство грибов' },
  { subject: 'biologiya', klass: 5, slug: 'tsarstvo-bakteriy', title: 'Бактерии' },
  { subject: 'biologiya', klass: 9, slug: 'genetika', title: 'Основы генетики' },
  { subject: 'biologiya', klass: 9, slug: 'evolyutsiya', title: 'Эволюция органического мира' },
  { subject: 'biologiya', klass: 9, slug: 'ekologiya', title: 'Экология' },
  { subject: 'biologiya', klass: 9, slug: 'chelovek-biologiya', title: 'Человек' },
  { subject: 'biologiya', klass: 9, slug: 'oge-biologiya', title: 'Подготовка к ОГЭ по биологии' },
  { subject: 'biologiya', klass: 11, slug: 'ege-biologiya', title: 'Подготовка к ЕГЭ по биологии' },
  { subject: 'biologiya', klass: 5, slug: 'pervobytnoye-obshhestvo', title: 'Первобытное общество' },
  { subject: 'biologiya', klass: 5, slug: 'drevniy-egipet', title: 'Древний Египет' },
  { subject: 'biologiya', klass: 5, slug: 'drevnyaya-gretsiya', title: 'Древняя Греция' },
  { subject: 'biologiya', klass: 5, slug: 'drevniy-rim', title: 'Древний Рим' },
  { subject: 'biologiya', klass: 6, slug: 'srednevekovaya-evropa', title: 'Средневековая Европа' },
  { subject: 'biologiya', klass: 6, slug: 'drevnyaya-rus', title: 'Древняя Русь' },
  { subject: 'biologiya', klass: 6, slug: 'mongolo-tatarskoe', title: 'Монголо-татарское нашествие' },
  { subject: 'biologiya', klass: 9, slug: 'pervaya-mirovaya', title: 'Первая мировая война' },
  { subject: 'biologiya', klass: 9, slug: 'revolyutsiya-1917', title: 'Революции 1917 года' },
  { subject: 'biologiya', klass: 9, slug: 'grazhdanskaya-voyna', title: 'Гражданская война' },
  { subject: 'biologiya', klass: 9, slug: 'sssr-stalinizm', title: 'СССР в 1930-е годы' },
  { subject: 'biologiya', klass: 9, slug: 'vtoraya-mirovaya', title: 'Вторая мировая война' },
  { subject: 'biologiya', klass: 9, slug: 'oge-istoriya', title: 'Подготовка к ОГЭ по истории' },
  { subject: 'biologiya', klass: 11, slug: 'kholodnaya-voyna', title: 'Холодная война' },
  { subject: 'biologiya', klass: 11, slug: 'sssr-raspas', title: 'Распад СССР' },
  { subject: 'biologiya', klass: 11, slug: 'rossiya-90e', title: 'Россия в 1990-е годы' },
  { subject: 'biologiya', klass: 11, slug: 'ege-istoriya', title: 'Подготовка к ЕГЭ по истории' },
  { subject: 'biologiya', klass: 6, slug: 'chelovek-obshhestvo', title: 'Человек и общество' },
  { subject: 'biologiya', klass: 6, slug: 'semya', title: 'Семья' },
  { subject: 'biologiya', klass: 6, slug: 'shkola', title: 'Образование' },
  { subject: 'biologiya', klass: 9, slug: 'ekonomika-9', title: 'Экономика' },
  { subject: 'biologiya', klass: 9, slug: 'pravo-9', title: 'Право' },
  { subject: 'biologiya', klass: 9, slug: 'politika-9', title: 'Политика' },
  { subject: 'biologiya', klass: 9, slug: 'sotsialnaya-sfera', title: 'Социальная сфера' },
  { subject: 'biologiya', klass: 9, slug: 'oge-obshhestvo', title: 'Подготовка к ОГЭ по обществознанию' },
  { subject: 'istoriya', klass: 5, slug: 'pervobytnoye-obshhestvo', title: 'Первобытное общество' },
  { subject: 'istoriya', klass: 5, slug: 'drevniy-egipet', title: 'Древний Египет' },
  { subject: 'istoriya', klass: 5, slug: 'drevnyaya-gretsiya', title: 'Древняя Греция' },
  { subject: 'istoriya', klass: 5, slug: 'drevniy-rim', title: 'Древний Рим' },
  { subject: 'istoriya', klass: 6, slug: 'srednevekovaya-evropa', title: 'Средневековая Европа' },
  { subject: 'istoriya', klass: 6, slug: 'drevnyaya-rus', title: 'Древняя Русь' },
  { subject: 'istoriya', klass: 6, slug: 'mongolo-tatarskoe', title: 'Монголо-татарское нашествие' },
  { subject: 'istoriya', klass: 9, slug: 'pervaya-mirovaya', title: 'Первая мировая война' },
  { subject: 'istoriya', klass: 9, slug: 'revolyutsiya-1917', title: 'Революции 1917 года' },
  { subject: 'istoriya', klass: 9, slug: 'grazhdanskaya-voyna', title: 'Гражданская война' },
  { subject: 'istoriya', klass: 9, slug: 'sssr-stalinizm', title: 'СССР в 1930-е годы' },
  { subject: 'istoriya', klass: 9, slug: 'vtoraya-mirovaya', title: 'Вторая мировая война' },
  { subject: 'istoriya', klass: 9, slug: 'oge-istoriya', title: 'Подготовка к ОГЭ по истории' },
  { subject: 'istoriya', klass: 11, slug: 'kholodnaya-voyna', title: 'Холодная война' },
  { subject: 'istoriya', klass: 11, slug: 'sssr-raspas', title: 'Распад СССР' },
  { subject: 'istoriya', klass: 11, slug: 'rossiya-90e', title: 'Россия в 1990-е годы' },
  { subject: 'istoriya', klass: 11, slug: 'ege-istoriya', title: 'Подготовка к ЕГЭ по истории' },
  { subject: 'istoriya', klass: 6, slug: 'chelovek-obshhestvo', title: 'Человек и общество' },
  { subject: 'istoriya', klass: 6, slug: 'semya', title: 'Семья' },
  { subject: 'istoriya', klass: 6, slug: 'shkola', title: 'Образование' },
  { subject: 'istoriya', klass: 9, slug: 'ekonomika-9', title: 'Экономика' },
  { subject: 'istoriya', klass: 9, slug: 'pravo-9', title: 'Право' },
  { subject: 'istoriya', klass: 9, slug: 'politika-9', title: 'Политика' },
  { subject: 'istoriya', klass: 9, slug: 'sotsialnaya-sfera', title: 'Социальная сфера' },
  { subject: 'istoriya', klass: 9, slug: 'oge-obshhestvo', title: 'Подготовка к ОГЭ по обществознанию' },
  { subject: 'istoriya', klass: 11, slug: 'ege-obshhestvo', title: 'Подготовка к ЕГЭ по обществознанию' },
  { subject: 'istoriya', klass: 5, slug: 'zemlya-planeta', title: 'Земля — планета Солнечной системы' },
  { subject: 'istoriya', klass: 5, slug: 'geograficheskaya-karta', title: 'Географическая карта' },
  { subject: 'istoriya', klass: 5, slug: 'litosfery', title: 'Литосфера' },
  { subject: 'istoriya', klass: 7, slug: 'materiki-okeany', title: 'Материки и океаны' },
  { subject: 'istoriya', klass: 7, slug: 'afrika', title: 'Африка' },
  { subject: 'istoriya', klass: 7, slug: 'ameriki', title: 'Северная и Южная Америка' },
  { subject: 'istoriya', klass: 7, slug: 'evraziya', title: 'Евразия' },
  { subject: 'istoriya', klass: 8, slug: 'rossiya-geografiya', title: 'Россия: общий обзор' },
  { subject: 'istoriya', klass: 8, slug: 'klimat-rossii', title: 'Климат России' },
  { subject: 'istoriya', klass: 8, slug: 'reki-ozera-rossii', title: 'Реки и озёра России' },
  { subject: 'obshchestvoznanie', klass: 6, slug: 'chelovek-obshhestvo', title: 'Человек и общество' },
  { subject: 'obshchestvoznanie', klass: 6, slug: 'semya', title: 'Семья' },
  { subject: 'obshchestvoznanie', klass: 6, slug: 'shkola', title: 'Образование' },
  { subject: 'obshchestvoznanie', klass: 9, slug: 'ekonomika-9', title: 'Экономика' },
  { subject: 'obshchestvoznanie', klass: 9, slug: 'pravo-9', title: 'Право' },
  { subject: 'obshchestvoznanie', klass: 9, slug: 'politika-9', title: 'Политика' },
  { subject: 'obshchestvoznanie', klass: 9, slug: 'sotsialnaya-sfera', title: 'Социальная сфера' },
  { subject: 'obshchestvoznanie', klass: 9, slug: 'oge-obshhestvo', title: 'Подготовка к ОГЭ по обществознанию' },
  { subject: 'obshchestvoznanie', klass: 11, slug: 'ege-obshhestvo', title: 'Подготовка к ЕГЭ по обществознанию' },
  { subject: 'obshchestvoznanie', klass: 5, slug: 'zemlya-planeta', title: 'Земля — планета Солнечной системы' },
  { subject: 'obshchestvoznanie', klass: 5, slug: 'geograficheskaya-karta', title: 'Географическая карта' },
  { subject: 'obshchestvoznanie', klass: 5, slug: 'litosfery', title: 'Литосфера' },
  { subject: 'obshchestvoznanie', klass: 7, slug: 'materiki-okeany', title: 'Материки и океаны' },
  { subject: 'obshchestvoznanie', klass: 7, slug: 'afrika', title: 'Африка' },
  { subject: 'obshchestvoznanie', klass: 7, slug: 'ameriki', title: 'Северная и Южная Америка' },
  { subject: 'obshchestvoznanie', klass: 7, slug: 'evraziya', title: 'Евразия' },
  { subject: 'obshchestvoznanie', klass: 8, slug: 'rossiya-geografiya', title: 'Россия: общий обзор' },
  { subject: 'obshchestvoznanie', klass: 8, slug: 'klimat-rossii', title: 'Климат России' },
  { subject: 'obshchestvoznanie', klass: 8, slug: 'reki-ozera-rossii', title: 'Реки и озёра России' },
  { subject: 'obshchestvoznanie', klass: 9, slug: 'ekonomika-rossii-geo', title: 'Экономика России' },
  { subject: 'obshchestvoznanie', klass: 9, slug: 'regiony-rossii', title: 'Экономические регионы России' },
  { subject: 'obshchestvoznanie', klass: 9, slug: 'oge-geografiya', title: 'Подготовка к ОГЭ по географии' },
  { subject: 'obshchestvoznanie', klass: 5, slug: 'informatsiya', title: 'Информация и её виды' },
  { subject: 'obshchestvoznanie', klass: 5, slug: 'kompyuter', title: 'Устройство компьютера' },
  { subject: 'obshchestvoznanie', klass: 5, slug: 'programmy', title: 'Программное обеспечение' },
  { subject: 'obshchestvoznanie', klass: 7, slug: 'algoritmy', title: 'Алгоритмы' },
  { subject: 'obshchestvoznanie', klass: 7, slug: 'sistemy-schisleniya', title: 'Системы счисления' },
  { subject: 'obshchestvoznanie', klass: 7, slug: 'tekstovy-redaktor', title: 'Текстовый редактор' },
  { subject: 'obshchestvoznanie', klass: 9, slug: 'programmirovanie-9', title: 'Основы программирования' },
  { subject: 'obshchestvoznanie', klass: 9, slug: 'bazy-dannykh', title: 'Базы данных' },
  { subject: 'obshchestvoznanie', klass: 9, slug: 'seti-internet', title: 'Компьютерные сети и интернет' },
  { subject: 'obshchestvoznanie', klass: 9, slug: 'oge-informatika', title: 'Подготовка к ОГЭ по информатике' },
  { subject: 'obshchestvoznanie', klass: 11, slug: 'ege-informatika', title: 'Подготовка к ЕГЭ по информатике' },
  { subject: 'geografiya', klass: 5, slug: 'zemlya-planeta', title: 'Земля — планета Солнечной системы' },
  { subject: 'geografiya', klass: 5, slug: 'geograficheskaya-karta', title: 'Географическая карта' },
  { subject: 'geografiya', klass: 5, slug: 'litosfery', title: 'Литосфера' },
  { subject: 'geografiya', klass: 7, slug: 'materiki-okeany', title: 'Материки и океаны' },
  { subject: 'geografiya', klass: 7, slug: 'afrika', title: 'Африка' },
  { subject: 'geografiya', klass: 7, slug: 'ameriki', title: 'Северная и Южная Америка' },
  { subject: 'geografiya', klass: 7, slug: 'evraziya', title: 'Евразия' },
  { subject: 'geografiya', klass: 8, slug: 'rossiya-geografiya', title: 'Россия: общий обзор' },
  { subject: 'geografiya', klass: 8, slug: 'klimat-rossii', title: 'Климат России' },
  { subject: 'geografiya', klass: 8, slug: 'reki-ozera-rossii', title: 'Реки и озёра России' },
  { subject: 'geografiya', klass: 9, slug: 'ekonomika-rossii-geo', title: 'Экономика России' },
  { subject: 'geografiya', klass: 9, slug: 'regiony-rossii', title: 'Экономические регионы России' },
  { subject: 'geografiya', klass: 9, slug: 'oge-geografiya', title: 'Подготовка к ОГЭ по географии' },
  { subject: 'geografiya', klass: 5, slug: 'informatsiya', title: 'Информация и её виды' },
  { subject: 'geografiya', klass: 5, slug: 'kompyuter', title: 'Устройство компьютера' },
  { subject: 'geografiya', klass: 5, slug: 'programmy', title: 'Программное обеспечение' },
  { subject: 'geografiya', klass: 7, slug: 'algoritmy', title: 'Алгоритмы' },
  { subject: 'geografiya', klass: 7, slug: 'sistemy-schisleniya', title: 'Системы счисления' },
  { subject: 'geografiya', klass: 7, slug: 'tekstovy-redaktor', title: 'Текстовый редактор' },
  { subject: 'geografiya', klass: 9, slug: 'programmirovanie-9', title: 'Основы программирования' },
  { subject: 'geografiya', klass: 9, slug: 'bazy-dannykh', title: 'Базы данных' },
  { subject: 'geografiya', klass: 9, slug: 'seti-internet', title: 'Компьютерные сети и интернет' },
  { subject: 'geografiya', klass: 9, slug: 'oge-informatika', title: 'Подготовка к ОГЭ по информатике' },
  { subject: 'geografiya', klass: 11, slug: 'ege-informatika', title: 'Подготовка к ЕГЭ по информатике' },
  { subject: 'informatika', klass: 5, slug: 'informatsiya', title: 'Информация и её виды' },
  { subject: 'informatika', klass: 5, slug: 'kompyuter', title: 'Устройство компьютера' },
  { subject: 'informatika', klass: 5, slug: 'programmy', title: 'Программное обеспечение' },
  { subject: 'informatika', klass: 7, slug: 'algoritmy', title: 'Алгоритмы' },
  { subject: 'informatika', klass: 7, slug: 'sistemy-schisleniya', title: 'Системы счисления' },
  { subject: 'informatika', klass: 7, slug: 'tekstovy-redaktor', title: 'Текстовый редактор' },
  { subject: 'informatika', klass: 9, slug: 'programmirovanie-9', title: 'Основы программирования' },
  { subject: 'informatika', klass: 9, slug: 'bazy-dannykh', title: 'Базы данных' },
  { subject: 'informatika', klass: 9, slug: 'seti-internet', title: 'Компьютерные сети и интернет' },
  { subject: 'informatika', klass: 9, slug: 'oge-informatika', title: 'Подготовка к ОГЭ по информатике' },
  { subject: 'informatika', klass: 11, slug: 'ege-informatika', title: 'Подготовка к ЕГЭ по информатике' },
]

// ─── Клиент Anthropic ─────────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const tokenUsage = { input: 0, output: 0 }

function addUsage(u) {
  tokenUsage.input += u?.input_tokens ?? 0
  tokenUsage.output += u?.output_tokens ?? 0
}

function cost() {
  return ((tokenUsage.input / 1e6) * 3 + (tokenUsage.output / 1e6) * 15).toFixed(4)
}

// ─── Промпт для генерации статьи ─────────────────────────────────────────────
function buildPrompt(subject, klass, title) {
  return `Напиши подробную учебную статью для школьного онлайн-учебника.

Параметры:
- Предмет: ${subject}
- Класс: ${klass}
- Тема: ${title}

Требования:
1. Объём: 800–1200 слов
2. Структура: H2 заголовки для разделов, H3 для подразделов
3. Содержание:
   - Краткое определение/суть темы
   - Основная теория с формулами (если нужно — в виде текста)
   - 2–3 разобранных примера с пошаговым решением
   - Ключевые правила / «запомни»
   - Типичные ошибки
4. Язык: понятный для школьника, без лишнего усложнения
5. Формат: только HTML (без markdown), используй: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <table>, <blockquote>
6. Для формул: записывай в виде обычного текста или <code>формула</code>
7. Добавь блок «Проверь себя» с 2–3 короткими вопросами в конце

Начни сразу с контента, без <html>/<body>/<head>.`
}

// ─── Генерация одной статьи ───────────────────────────────────────────────────
async function generateArticle(subjectTitle, klass, title) {
  const msg = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: buildPrompt(subjectTitle, klass, title),
    }],
  })
  addUsage(msg.usage)
  return msg.content[0].text.trim()
}

// ─── Читаем/пишем articles файл ──────────────────────────────────────────────
function readArticles() {
  try {
    const content = readFileSync(ARTICLES_FILE, 'utf-8')
    // Извлекаем массив статей
    const match = content.match(/const articles[^=]*=\s*(\[[\s\S]*?\])\s*\n\nexport/)
    if (!match) return []
    // Не парсим TS напрямую — используем eval-like подход через JSON
    // Просто вернём пустой массив и будем аппендить
    return []
  } catch { return [] }
}

function appendArticle(article) {
  let content = readFileSync(ARTICLES_FILE, 'utf-8')
  const escapedContent = article.content
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${')

  const newEntry = `  {
    subject: '${article.subject}',
    klass: ${article.klass},
    topicSlug: '${article.topicSlug}',
    publishedAt: '${article.publishedAt}',
    content: \`${escapedContent}\`,
  },`

  // Вставляем перед "// Статьи генерируются" или перед ]
  const marker = '  // Статьи генерируются автоматически'
  if (content.includes(marker)) {
    content = content.replace(marker, newEntry + '\n' + marker)
  } else {
    content = content.replace(/^]$/m, newEntry + '\n]')
  }
  writeFileSync(ARTICLES_FILE, content)
}

function articleExists(subject, klass, topicSlug) {
  const content = readFileSync(ARTICLES_FILE, 'utf-8')
  return content.includes(`subject: '${subject}'`) && content.includes(`topicSlug: '${topicSlug}'`) &&
    content.includes(`klass: ${klass}`)
}

// ─── Карта названий предметов ─────────────────────────────────────────────────
const SUBJECT_NAMES = {
  'matematika': 'Математика',
  'algebra': 'Алгебра',
  'geometriya': 'Геометрия',
  'russkiy-yazyk': 'Русский язык',
  'literatura': 'Литература',
  'angliiskiy-yazyk': 'Английский язык',
  'fizika': 'Физика',
  'khimiya': 'Химия',
  'biologiya': 'Биология',
  'istoriya': 'История',
  'obshchestvoznanie': 'Обществознание',
  'geografiya': 'География',
  'informatika': 'Информатика',
}

// ─── Главная логика ───────────────────────────────────────────────────────────
async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ Нужен ANTHROPIC_API_KEY')
    process.exit(1)
  }

  // Определяем что генерировать
  let topics = ALL_TOPICS

  if (TOPIC_SLUG && SUBJECT && KLASS) {
    topics = topics.filter(t => t.subject === SUBJECT && t.klass === KLASS && t.slug === TOPIC_SLUG)
  } else if (SUBJECT && KLASS) {
    topics = topics.filter(t => t.subject === SUBJECT && t.klass === KLASS)
  } else if (SUBJECT) {
    topics = topics.filter(t => t.subject === SUBJECT)
  } else if (!ALL) {
    console.error('Укажи --subject=... или --all')
    console.error('Пример: node scripts/generate-textbook.mjs --subject=algebra --klass=8')
    process.exit(1)
  }

  // Пропускаем уже сгенерированные
  topics = topics.filter(t => !articleExists(t.subject, t.klass, t.slug))

  if (topics.length === 0) {
    console.log('✅ Все статьи уже сгенерированы!')
    process.exit(0)
  }

  // Ограничиваем
  const toGenerate = topics.slice(0, LIMIT)
  console.log(`\n📚 Генерация ${toGenerate.length} статей для учебника\n`)

  let generated = 0
  let errors = 0

  for (const topic of toGenerate) {
    const subjectName = SUBJECT_NAMES[topic.subject] ?? topic.subject
    process.stdout.write(`  📖 ${subjectName} ${topic.klass}кл · ${topic.title.padEnd(35)} `)

    if (DRY_RUN) {
      process.stdout.write('(dry-run)\n')
      continue
    }

    try {
      const content = await generateArticle(subjectName, topic.klass, topic.title)
      const article = {
        subject: topic.subject,
        klass: topic.klass,
        topicSlug: topic.slug,
        publishedAt: new Date().toISOString().slice(0, 10),
        content,
      }
      appendArticle(article)
      process.stdout.write(`✅\n`)
      generated++
    } catch (e) {
      process.stdout.write(`❌ ${e.message}\n`)
      errors++
      if (e.message?.includes('credit balance') || e.message?.includes('insufficient_quota')) {
        console.error('\n💳 Недостаточно средств на API')
        break
      }
    }

    await new Promise(r => setTimeout(r, 800))
  }

  console.log(`\n✅ Сгенерировано: ${generated} | Ошибок: ${errors}`)
  console.log(`💰 Использовано: ~$${cost()} (input: ${tokenUsage.input} / output: ${tokenUsage.output} токенов)`)
  console.log(`📋 Осталось тем: ${topics.length - toGenerate.length}`)
}

main().catch(e => {
  console.error('Fatal:', e)
  process.exit(1)
})
