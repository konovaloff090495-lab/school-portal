// Профили школ: ключевые слова и определение профиля по тексту карточки.
// Единый источник для CatalogClient (клиентская фильтрация) и для серверного
// подбора расширенных выборок (src/lib/related-schools.ts) — не дублировать списки.
export const SCHOOL_PROFILES = [
  { id: 'it',          label: 'IT / Программирование', keywords: ['it', 'программирован', 'кибер', 'цифров', 'алгоритм', 'код', 'робот', 'искусственный интеллект', 'компьютер', 'технолог'] },
  { id: 'medical',     label: 'Медицинский',            keywords: ['медицин', 'биолог', 'химия', 'анатомия', 'фармацевт', 'врач', 'здоровь', 'гиппократ', 'сеченов', 'первый мед'] },
  { id: 'math',        label: 'Физ-мат',                keywords: ['физ-мат', 'физмат', 'математик', 'физика', 'точные науки', 'олимпиад', 'математическ'] },
  { id: 'music',       label: 'Музыкальный',            keywords: ['музык', 'фортепиано', 'скрипка', 'вокал', 'хор', 'соната', 'консерватори', 'инструмент'] },
  { id: 'sport',       label: 'Спортивный',             keywords: ['спорт', 'футбол', 'хоккей', 'теннис', 'олимпийск', 'баскетбол', 'борьба', 'плавание', 'гимнастик'] },
  { id: 'art',         label: 'Художественный',         keywords: ['художеств', 'искусств', 'живопись', 'дизайн', 'архитектур', 'творческ', 'сценическ'] },
  { id: 'humanities',  label: 'Гуманитарный',           keywords: ['гуманитар', 'история', 'литератур', 'языков', 'лингвистик', 'журналист', 'право', 'обществ'] },
  { id: 'economics',   label: 'Экономический',          keywords: ['экономик', 'бизнес', 'финанс', 'предпринимат', 'менеджмент', 'маркетинг', 'управлен'] },
  { id: 'engineering', label: 'Инженерный',             keywords: ['инженер', 'механик', 'авиа', 'судостроен', 'строительн', 'техническ', 'промышленн'] },
  { id: 'languages',   label: 'Языковой',               keywords: ['языков', 'иностранн', 'английск', 'лингвистик', 'переводч', 'международн'] },
  { id: 'ecology',     label: 'Естественнонаучный',     keywords: ['экологи', 'биохими', 'географи', 'геологи', 'естественн', 'природ', 'окружающ'] },
] as const

export type ProfileId = typeof SCHOOL_PROFILES[number]['id']

export function detectProfile(school: { name: string; features: string[]; description: string; fullDescription?: string }): ProfileId | null {
  const haystack = [school.name, school.description, school.fullDescription ?? '', ...school.features]
    .join(' ').toLowerCase()
  for (const p of SCHOOL_PROFILES) {
    if (p.keywords.some(kw => haystack.includes(kw))) return p.id
  }
  return null
}
