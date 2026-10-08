import catalog from '@/data/textbook-images.json'

export interface TextbookImageData {
  url: string
  source: string
  author: string
  license: string
  licenseUrl: string
  width: number
  height: number
  alt: string
}

const images = catalog.images as Record<string, TextbookImageData>
const named = catalog.named as Record<string, string>
const topics = catalog.topics as Record<string, string>

type Rule = { subject: string; test: RegExp; image: string }

// Небольшой проверенный словарь тем. Точное изображение статьи из Википедии
// имеет приоритет, кроме явно переопределённых неоднозначных случаев.
const rules: Rule[] = [
  { subject: 'matematika', test: /сч[её]т|числа|число|цифр|сложен|вычитан|умножен|делен/i, image: 'math_default' },
  { subject: 'matematika', test: /дроб|процент|дол[яьи]|част[ьи]/i, image: 'math_fraction' },
  { subject: 'matematika', test: /час|врем[яеи]|минут/i, image: 'math_clock' },
  { subject: 'matematika', test: /фигур|геометр|куб|шар|прямоуголь|треуголь/i, image: 'math_shapes' },
  { subject: 'matematika', test: /длин|измер|сантиметр|метр/i, image: 'math_measure' },
  { subject: 'matematika', test: /делимост|делител|кратн/i, image: 'math_divisibility' },
  { subject: 'algebra', test: /функци|график|парабол|координат/i, image: 'algebra_default' },
  { subject: 'algebra', test: /вероятност|случайн|комбинатор/i, image: 'algebra_probability' },
  { subject: 'geometriya', test: /треуголь/i, image: 'geometry_triangle' },
  { subject: 'geometriya', test: /окружност|круг|радиус|хорд|дуг/i, image: 'geometry_circle' },
  { subject: 'geometriya', test: /многогран|пространств|призм|пирамид|тел[ао] вращен/i, image: 'geometry_solids' },
  { subject: 'geometriya', test: /сечени/i, image: 'geometry_section' },
  { subject: 'russkiy-yazyk', test: /алфавит|букв|азбук/i, image: 'russian_alphabet' },
  { subject: 'russkiy-yazyk', test: /восклицательн/i, image: 'russian_exclamation' },
  { subject: 'literatura', test: /пушкин/i, image: 'literature_pushkin' },
  { subject: 'literatura', test: /толст(ой|ого)|война и мир/i, image: 'literature_tolstoy' },
  { subject: 'literatura', test: /чехов/i, image: 'literature_chekhov' },
  { subject: 'literatura', test: /лермонтов/i, image: 'literature_lermontov' },
  { subject: 'literatura', test: /сказк|фольклор|былин/i, image: 'literature_fairy' },
  { subject: 'literatura', test: /природ|лес|дерев|времен[аи] года|весн|лет[оа]|осен|зим[аы]|цвет[ыио]|птиц/i, image: 'biology_plant' },
  { subject: 'literatura', test: /животн|звер|собак|кошк|рыб/i, image: 'biology_animal' },
  { subject: 'literatura', test: /войн|фронт|побед|солдат/i, image: 'history_ww2' },
  { subject: 'literatura', test: /истори|летопис|древн/i, image: 'history_default' },
  { subject: 'angliiskiy-yazyk', test: /времен[аи]|глагол|грамматик/i, image: 'english_grammar' },
  { subject: 'angliiskiy-yazyk', test: /фрукт|яблок|банан|ед[аы]|пищ/i, image: 'english_fruit' },
  { subject: 'angliiskiy-yazyk', test: /домашн.*животн|кошк|собак|питомц/i, image: 'english_pets' },
  { subject: 'angliiskiy-yazyk', test: /животн|птиц|рыб/i, image: 'biology_animal' },
  { subject: 'angliiskiy-yazyk', test: /семь[яи]|родител|дет[ией]/i, image: 'society_default' },
  { subject: 'angliiskiy-yazyk', test: /погод|облак|дожд/i, image: 'geography_climate' },
  { subject: 'fizika', test: /электр|ток|цеп[ьи]|сопротивлен|закон ома/i, image: 'physics_electric' },
  { subject: 'fizika', test: /движен|сил[аы]|ньютон|инерци/i, image: 'physics_motion' },
  { subject: 'fizika', test: /свет|оптик|призм|цвет|спектр/i, image: 'physics_light' },
  { subject: 'fizika', test: /атом|квант|электрон/i, image: 'physics_atom' },
  { subject: 'khimiya', test: /менделеев|периодическ|элемент/i, image: 'chemistry_periodic' },
  { subject: 'khimiya', test: /молекул|химическ.*связ/i, image: 'chemistry_molecule' },
  { subject: 'biologiya', test: /клетк/i, image: 'biology_cell' },
  { subject: 'biologiya', test: /генетик|днк|наследствен|хромосом/i, image: 'biology_dna' },
  { subject: 'biologiya', test: /растен|лист|цветок|фотосинтез/i, image: 'biology_plant' },
  { subject: 'biologiya', test: /животн|млекопита|птиц|рыб/i, image: 'biology_animal' },
  { subject: 'istoriya', test: /египет|фараон|пирамид/i, image: 'history_egypt' },
  { subject: 'istoriya', test: /визант|константинопол/i, image: 'history_byzantium' },
  { subject: 'istoriya', test: /греци|афин|спарт|эллин/i, image: 'history_greece' },
  { subject: 'istoriya', test: /древн.*рим|римск|колизе/i, image: 'history_rome' },
  { subject: 'istoriya', test: /средневек|феодал|рыцар|замк/i, image: 'history_medieval' },
  { subject: 'istoriya', test: /кита[йя]|пекин|цинь|хань/i, image: 'history_china' },
  { subject: 'istoriya', test: /франц|бастил|наполеон/i, image: 'history_france' },
  { subject: 'istoriya', test: /втор[ао]я миров|великая отечествен|1941|1945|фашизм/i, image: 'history_ww2' },
  { subject: 'istoriya', test: /росси|москв|кремл|русск|древняя русь|петр[ауы]? I/i, image: 'history_russia' },
  { subject: 'obshchestvoznanie', test: /право|суд|закон|конституц/i, image: 'society_law' },
  { subject: 'obshchestvoznanie', test: /эконом|деньг|рынок|спрос|предложен|налог/i, image: 'society_economy' },
  { subject: 'obshchestvoznanie', test: /образован|учеб|школ|знани/i, image: 'hero' },
  { subject: 'geografiya', test: /гор[аы]|рельеф|хребет/i, image: 'geography_mountain' },
  { subject: 'geografiya', test: /океан|мор[ея]|побереж|течени/i, image: 'geography_ocean' },
  { subject: 'geografiya', test: /климат|погод|облак|атмосфер/i, image: 'geography_climate' },
  { subject: 'geografiya', test: /земл[яи]|планет|материк|континент|глобус|карт[аы]/i, image: 'geography_default' },
  { subject: 'informatika', test: /программ|код|алгоритм|язык python/i, image: 'informatics_code' },
  { subject: 'informatika', test: /сеть|интернет|маршрутизатор/i, image: 'informatics_network' },
  { subject: 'informatika', test: /таблиц|данн|excel|ячейк/i, image: 'informatics_table' },
  { subject: 'informatika', test: /искусственн.*интеллект|нейросет|робот/i, image: 'informatics_ai' },
  { subject: 'informatika', test: /компьютер|клавиатур|мыш[ьи]|монитор|устройств/i, image: 'informatics_default' },
  { subject: 'okruzhayushchiy-mir', test: /космос|планет|солнц|лун[аы]|зв[её]зд/i, image: 'world_space' },
  { subject: 'okruzhayushchiy-mir', test: /куликовск|донск|древняя русь/i, image: 'history_kulikovo' },
  { subject: 'okruzhayushchiy-mir', test: /вод[аы]|рек[аие]|озер|руч[её]й/i, image: 'world_water' },
  { subject: 'okruzhayushchiy-mir', test: /растен|дерев|лист|цветок/i, image: 'biology_plant' },
  { subject: 'okruzhayushchiy-mir', test: /животн|птиц|рыб/i, image: 'biology_animal' },
  { subject: 'okruzhayushchiy-mir', test: /тело|скелет|орган[ыо]|здоров/i, image: 'world_body' },
]

const defaults: Record<string, string> = {
  matematika: 'math_default',
  algebra: 'algebra_default',
  geometriya: 'geometry_default',
  'russkiy-yazyk': 'russian_default',
  literatura: 'literature_default',
  'angliiskiy-yazyk': 'english_default',
  fizika: 'physics_default',
  khimiya: 'chemistry_default',
  biologiya: 'biology_default',
  istoriya: 'history_default',
  obshchestvoznanie: 'society_default',
  geografiya: 'geography_default',
  informatika: 'informatics_default',
  'okruzhayushchiy-mir': 'world_default',
}

export function getNamedTextbookImage(name: string): TextbookImageData | null {
  return images[named[name]] ?? null
}

export function getSubjectTextbookImage(subject: string): TextbookImageData | null {
  return getNamedTextbookImage(defaults[subject])
}

export function getTopicTextbookImage(subject: string, klass: number, slug: string, title: string): {
  image: TextbookImageData; topicSpecific: boolean
} | null {
  const override = subject === 'matematika' && /процент/i.test(title) ? 'math_fraction'
    : subject === 'russkiy-yazyk' && /восклицательн/i.test(title) ? 'russian_exclamation'
    : subject === 'russkiy-yazyk' && slug === 'zhshi-chashha' ? 'russian_alphabet'
    : null
  const curated = override ? getNamedTextbookImage(override) : null
  if (curated) return { image: curated, topicSpecific: true }

  const exact = images[topics[`${subject}/${klass}/${slug}`]]
  if (exact) {
    const image = subject === 'istoriya' && slug === 'drevniy-egipet'
      ? { ...exact, alt: 'Большой Сфинкс и пирамида Хеопса в Гизе' }
      : exact
    return { image, topicSpecific: true }
  }

  const rule = rules.find(item => item.subject === subject && item.test.test(title))
  const matched = rule ? getNamedTextbookImage(rule.image) : null
  if (matched) return { image: matched, topicSpecific: true }

  const fallback = getSubjectTextbookImage(subject)
  return fallback ? { image: fallback, topicSpecific: false } : null
}
