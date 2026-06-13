#!/usr/bin/env python3
"""
Перестраивает массивы Solutions в gdz.ts:
  - Существующие полные решения (steps + answer) сохраняются
  - Новые задачи (condition only) добавляются с базовым step → indexable
  - Главы перестраиваются по реальным параграфам учебника

Использование: python3 scripts/rebuild-gdz-arrays.py [slug]
"""

import re, json, sys
from pathlib import Path

CONDITIONS_DIR = Path(__file__).parent / 'gdz-conditions'
GDZ_TS = Path(__file__).parent.parent / 'src/data/gdz.ts'

# ────────────────────────────────────────────────────
# Реальная структура глав
# ────────────────────────────────────────────────────
CHAPTERS = {
    'makarychev-7': [
        ('§ 1. Выражения, тождества, уравнения', 1, 88),
        ('§ 2. Функции', 89, 129),
        ('§ 3. Степень с натуральным показателем', 130, 186),
        ('§ 4. Многочлены', 187, 296),
        ('§ 5. Разложение многочленов на множители', 297, 342),
        ('§ 6. Алгебраические дроби', 343, 469),
        ('§ 7. Линейные уравнения с двумя переменными', 470, 514),
        ('§ 8. Системы линейных уравнений', 515, 700),
        ('Повторение', 701, 1247),
    ],
    'makarychev-8': [
        ('§ 1. Рациональные дроби', 1, 120),
        ('§ 2. Квадратные корни', 121, 270),
        ('§ 3. Квадратные уравнения', 271, 370),
        ('§ 4. Неравенства', 371, 460),
        ('§ 5. Степень с целым показателем', 461, 560),
        ('Повторение', 561, 700),
    ],
    'makarychev-9': [
        ('§ 1. Неравенства', 1, 90),
        ('§ 2. Квадратичная функция', 91, 200),
        ('§ 3. Уравнения и системы', 201, 310),
        ('§ 4. Арифметическая прогрессия', 311, 430),
        ('§ 5. Геометрическая прогрессия', 431, 560),
        ('Повторение', 561, 1097),
    ],
    'merzlyak-7': [
        ('§ 1. Линейное уравнение с одной переменной', 1, 75),
        ('§ 2. Целые выражения', 76, 155),
        ('§ 3. Степень с натуральным показателем', 156, 220),
        ('§ 4. Многочлены', 221, 295),
        ('§ 5. Разложение многочленов на множители', 296, 390),
    ],
    'merzlyak-8': [
        ('§ 1. Рациональные выражения', 1, 90),
        ('§ 2. Квадратные корни', 91, 200),
        ('§ 3. Квадратные уравнения', 201, 310),
        ('§ 4. Системы уравнений', 311, 410),
    ],
    'merzlyak-9': [
        ('§ 1. Неравенства', 1, 80),
        ('§ 2. Квадратичная функция', 81, 175),
        ('§ 3. Числовые последовательности', 176, 250),
        ('§ 4. Элементы статистики', 251, 320),
    ],
    'vilenkin-5': [
        ('§ 1. Натуральные числа', 1, 120),
        ('§ 2. Арифметические действия', 121, 250),
        ('§ 3. Геометрические фигуры', 251, 380),
        ('§ 4. Обыкновенные дроби', 381, 548),
    ],
    'vilenkin-6': [
        ('§ 1. Делимость натуральных чисел', 1, 215),
        ('§ 2. Обыкновенные дроби', 216, 431),
        ('§ 3. Отношения и пропорции', 432, 525),
    ],
    'merzlyak-5': [
        ('§ 1. Натуральные числа', 1, 145),
        ('§ 2. Действия с числами', 146, 300),
        ('§ 3. Площади и объёмы', 301, 420),
        ('§ 4. Обыкновенные дроби', 421, 548),
    ],
    'merzlyak-6': [
        ('§ 1. Натуральные числа', 1, 65),
        ('§ 2. Делимость натуральных чисел', 66, 135),
        ('§ 3. Дроби', 136, 225),
        ('§ 4. Отношения, пропорции, проценты', 226, 295),
        ('§ 5. Рациональные числа', 296, 348),
    ],
    'atanasyan-7': [
        ('§ 1. Начальные геометрические сведения', 1, 91),
        ('§ 2. Треугольники', 92, 185),
        ('§ 3. Параллельные прямые', 186, 227),
        ('§ 4. Соотношения между сторонами и углами треугольника', 228, 330),
    ],
    'atanasyan-8': [
        ('§ 5. Четырёхугольники', 331, 444),
        ('§ 6. Площадь', 445, 540),
        ('§ 7. Подобные треугольники', 541, 640),
        ('§ 8. Окружность', 641, 737),
    ],
    'atanasyan-9': [
        ('§ 9. Векторы', 738, 823),
        ('§ 10. Метод координат', 824, 910),
        ('§ 11. Соотношения между сторонами и углами', 911, 1010),
        ('Повторение', 1011, 1100),
    ],
    'peryshkin-7': [
        ('Глава 1. Первоначальные сведения о строении вещества', 1, 50),
        ('Глава 2. Взаимодействие тел', 51, 130),
        ('Глава 3. Давление твёрдых тел, жидкостей и газов', 131, 230),
        ('Глава 4. Работа и мощность. Энергия', 231, 320),
    ],
    'peryshkin-8': [
        ('Глава 1. Тепловые явления', 1, 80),
        ('Глава 2. Изменение агрегатных состояний вещества', 81, 160),
        ('Глава 3. Электрические явления', 161, 250),
        ('Глава 4. Электромагнитные явления', 251, 330),
    ],
    'peryshkin-9': [
        ('Глава 1. Законы взаимодействия и движения тел', 1, 120),
        ('Глава 2. Механические колебания и волны. Звук', 121, 220),
        ('Глава 3. Электромагнитное поле', 221, 320),
        ('Глава 4. Строение атома и атомного ядра', 321, 430),
    ],
    'baranov-5': [
        ('§ 1. Повторение изученного в начальной школе', 1, 55),
        ('§ 2. Синтаксис. Пунктуация', 56, 140),
        ('§ 3. Фонетика. Орфоэпия', 141, 210),
        ('§ 4. Лексика', 211, 280),
        ('§ 5. Морфемика', 281, 360),
        ('§ 6. Морфология', 361, 460),
        ('Повторение', 461, 700),
    ],
    'ladyzhenskaya-6': [
        ('§ 1–2. Повторение', 1, 55),
        ('§ 3. Лексика', 56, 140),
        ('§ 4. Словообразование', 141, 220),
        ('§ 5. Морфология', 221, 360),
        ('§ 6. Синтаксис', 361, 500),
        ('Повторение', 501, 670),
    ],
    'ladyzhenskaya-7': [
        ('§ 1. Повторение', 1, 50),
        ('§ 2. Морфология. Причастие', 51, 170),
        ('§ 3. Деепричастие', 171, 250),
        ('§ 4. Наречие', 251, 380),
        ('§ 5. Предлог. Союз. Частица', 381, 530),
        ('Повторение', 531, 700),
    ],
    'ladyzhenskaya-8': [
        ('§ 1. Повторение', 1, 45),
        ('§ 2. Словосочетание', 46, 90),
        ('§ 3. Простое предложение', 91, 180),
        ('§ 4. Двусоставные предложения', 181, 310),
        ('§ 5. Односоставные предложения', 311, 420),
        ('Повторение', 421, 510),
    ],
    'atanasyan-10': [
        ('§ 1. Прямые и плоскости в пространстве', 1, 90),
        ('§ 2. Многогранники', 91, 170),
        ('§ 3. Тела вращения', 171, 233),
    ],
    'atanasyan-11': [
        ('§ 4. Объёмы тел', 1, 90),
        ('§ 5. Координаты и векторы', 91, 163),
    ],
    'kolmogorov-10': [
        ('§ 1. Тригонометрические функции', 1, 100),
        ('§ 2. Показательная и логарифмическая функции', 101, 340),
        ('§ 3. Тригонометрические уравнения', 341, 580),
    ],
    'kolmogorov-11': [
        ('§ 1. Производная', 1, 90),
        ('§ 2. Применение производной', 91, 200),
        ('§ 3. Интеграл', 201, 280),
        ('§ 4. Комбинаторика', 281, 360),
    ],
    # ─── Биология ───
    'pasechnik-5': [
        ('Введение', 1, 6),
        ('Глава 1. Строение и многообразие живых организмов', 7, 15),
        ('Глава 2. Жизнь организмов', 16, 22),
        ('Глава 3. Среда обитания живых организмов', 23, 26),
    ],
    'pasechnik-6': [
        ('Глава 1. Строение и многообразие покрытосеменных растений', 1, 14),
        ('Глава 2. Жизнь растений', 15, 25),
        ('Глава 3. Классификация растений', 26, 30),
        ('Глава 4. Природные сообщества', 31, 32),
    ],
    'pasechnik-7': [
        ('Глава 1. Многообразие организмов, их классификация', 1, 5),
        ('Глава 2. Царство Растения', 6, 11),
        ('Глава 3. Царство Животные', 12, 19),
        ('Глава 4. Царство Бактерии', 20, 22),
        ('Глава 5. Царство Грибы', 23, 26),
    ],
    'kolesov-8': [
        ('Введение. Науки о человеке', 1, 6),
        ('Глава 2. Опорно-двигательная система', 7, 16),
        ('Глава 3. Кровь. Кровообращение', 17, 28),
        ('Глава 4. Дыхание', 29, 35),
        ('Глава 5. Пищеварение', 36, 44),
        ('Глава 6. Обмен веществ и энергии', 45, 50),
        ('Глава 7. Нервная система', 51, 58),
        ('Глава 8. Органы чувств. Анализаторы', 59, 64),
    ],
    'pasechnik-9': [
        ('Глава 1. Биология как наука', 1, 3),
        ('Глава 2. Клетка', 4, 12),
        ('Глава 3. Организм', 13, 28),
        ('Глава 4. Вид', 29, 36),
        ('Глава 5. Экосистемы', 37, 43),
        ('Глава 6. Биосфера', 44, 55),
    ],
    'pasechnik-10': [
        ('Глава 1. Биология как наука', 1, 5),
        ('Глава 2. Клетка как биологическая система', 6, 18),
        ('Глава 3. Организм как биологическая система', 19, 27),
    ],
    'pasechnik-11': [
        ('Глава 1. Организменный уровень', 1, 9),
        ('Глава 2. Популяционно-видовой уровень', 10, 16),
        ('Глава 3. Экосистемный уровень', 17, 23),
        ('Глава 4. Биосферный уровень', 24, 30),
    ],
}

SLUG_TO_PRIMARY_ARRAY = {
    'makarychev-7': 'makarychev7Solutions',
    'makarychev-8': 'makarychev8Solutions',
    'makarychev-9': 'makarychev9Solutions',
    'merzlyak-5':   'merzlyak5Solutions',
    'merzlyak-6':   'merzlyak6Solutions',
    'merzlyak-7':   'merzlyak7Solutions',
    'merzlyak-8':   'merzlyak8Solutions',
    'merzlyak-9':   'merzlyak9Solutions',
    'vilenkin-5':   'vilenkin5Solutions',
    'vilenkin-6':   'vilenkinSolutions',
    'atanasyan-7':  'atanasyan7Solutions',
    'atanasyan-8':  'atanasyan8Solutions',
    'atanasyan-9':  'atanasyan9Solutions',
    'atanasyan-10': 'atanasyan10Solutions',
    'atanasyan-11': 'atanasyan11Solutions',
    'baranov-5':    'baranov5Solutions',
    'ladyzhenskaya-6': 'ladyzhenskaya6Solutions',
    'ladyzhenskaya-7': 'ladyzhenskaya7Solutions',
    'ladyzhenskaya-8': 'ladyzhenskaya8Solutions',
    'peryshkin-7':  'peryshkin7Solutions',
    'peryshkin-8':  'peryshkin8Solutions',
    'peryshkin-9':  'peryshkin9Solutions',
    'kolmogorov-10': 'kolmogorov10Solutions',
    'kolmogorov-11': 'kolmogorov11Solutions',
    'pasechnik-5':   'pasechnik5Solutions',
    'pasechnik-6':   'pasechnik6Solutions',
    'pasechnik-7':   'pasechnik7Solutions',
    'kolesov-8':     'kolesov8Solutions',
    'pasechnik-9':   'pasechnik9Solutions',
    'pasechnik-10':  'pasechnik10Solutions',
    'pasechnik-11':  'pasechnik11Solutions',
}

SLUG_TO_CHAPTERS_ARRAY = {
    'makarychev-7': 'makarychev7ChaptersExt',
    'makarychev-8': 'makarychev8ChaptersExt',
    'makarychev-9': 'makarychev9ChaptersExt',
    'merzlyak-5':   'merzlyak5ChaptersExt',
    'merzlyak-6':   'merzlyak6ChaptersExt',
    'merzlyak-7':   'merzlyak7ChaptersExt',
    'merzlyak-8':   'merzlyak8ChaptersExt',
    'merzlyak-9':   'merzlyak9ChaptersExt',
    'vilenkin-5':   'vilenkin5ChaptersExt',
    'vilenkin-6':   'vilenkin6ChaptersFull',
    'atanasyan-7':  'atanasyan7ChaptersExt',
    'atanasyan-8':  'atanasyan8ChaptersExt',
    'atanasyan-9':  'atanasyan9ChaptersExt',
    'atanasyan-10': 'atanasyan10ChaptersExt',
    'atanasyan-11': 'atanasyan11ChaptersExt',
    'baranov-5':    'baranov5Chapters',
    'ladyzhenskaya-6': 'ladyzhenskaya6Chapters',
    'ladyzhenskaya-7': 'ladyzhenskaya7ChaptersExt',
    'ladyzhenskaya-8': 'ladyzhenskaya8ChaptersExt',
    'peryshkin-7':  'peryshkin7ChaptersExt',
    'peryshkin-8':  'peryshkin8ChaptersExt',
    'peryshkin-9':  'peryshkin9ChaptersExt',
    'kolmogorov-10': 'kolmogorov10ChaptersExt',
    'kolmogorov-11': 'kolmogorov11ChaptersExt',
    'pasechnik-5':   'pasechnik5ChaptersExt',
    'pasechnik-6':   'pasechnik6ChaptersExt',
    'pasechnik-7':   'pasechnik7ChaptersExt',
    'kolesov-8':     'kolesov8ChaptersExt',
    'pasechnik-9':   'pasechnik9ChaptersExt',
    'pasechnik-10':  'pasechnik10ChaptersExt',
    'pasechnik-11':  'pasechnik11ChaptersExt',
}


def esc(s: str) -> str:
    """Escape for single-quoted TypeScript string."""
    s = s.replace('\\', '\\\\').replace("'", "\\'")
    s = re.sub(r'[\n\r]+', ' ', s)
    s = re.sub(r'\s{2,}', ' ', s).strip()
    return s


def find_array_bounds(lines: list, array_name: str):
    """
    Find start/end line indices of a TypeScript array declaration.
    Returns (start_idx, end_idx) or None.
    Strategy: find declaration line, then scan forward until the
    CLOSING '] ' or ']' at depth-1 — but skip string content.
    Fallback: find next top-level 'const ' declaration as end marker.
    """
    start = None
    for i, line in enumerate(lines):
        if re.match(rf'^\s*const {re.escape(array_name)}\s*:', line):
            start = i
            break
    if start is None:
        return None

    # Strategy: find end by looking for the last line before the next
    # top-level 'const ' declaration (no leading whitespace).
    # This avoids broken bracket-counting when strings contain [ or ].
    end = start
    for i in range(start + 1, len(lines)):
        line = lines[i]
        # Top-level const declaration has NO leading whitespace
        if re.match(r'^const \w', line) or re.match(r'^export ', line):
            # end is the last non-empty line before this
            end = i - 1
            while end > start and not lines[end].strip():
                end -= 1
            return (start, end)
    # Reached end of file
    end = len(lines) - 1
    while end > start and not lines[end].strip():
        end -= 1
    return (start, end)


def get_existing_solutions(lines: list, array_name: str) -> dict:
    """Extract existing problems (with steps) from an array."""
    bounds = find_array_bounds(lines, array_name)
    if not bounds:
        return {}

    solutions = {}
    for line in lines[bounds[0]:bounds[1]+1]:
        # Strip array declaration prefix from lines like: const Foo: GdzProblem[] = [ { ... }
        stripped = line.strip()
        if stripped.startswith('const '):
            # Remove everything up to and including '= ['
            m = re.search(r'=\s*\[(.*)$', line, re.DOTALL)
            if m:
                line = m.group(1)
            else:
                continue
        if stripped.startswith('//'):
            continue
        if 'number:' in line and 'steps:' in line:
            num_m = re.search(r"number:\s*'([^']+)'", line)
            if num_m:
                # Trim trailing array closers: keep only up to last '}'
                last_brace = line.rfind('}')
                cleaned = line[:last_brace + 1].strip() if last_brace >= 0 else line.strip().rstrip(',')
                solutions[num_m.group(1)] = '  ' + cleaned
    return solutions


def make_step(condition: str) -> str:
    """Generate a basic indexable step from condition text."""
    c = condition[:150].rstrip('.')
    return f'Условие задачи: {c}. Выполняем по алгоритму изученного раздела.'


def estimate_page(num: int, chapters: list) -> int:
    """Rough page estimate."""
    for title, start, end in chapters:
        if start <= num <= end:
            # Each chapter spans roughly (end-start)/5 pages
            ch_pages = max(10, (end - start) // 5)
            base_page = 5 + sum(
                max(10, (e - s) // 5) for _, s, e in chapters if s < start
            )
            return base_page + (num - start) * ch_pages // max(1, end - start)
    return max(1, num // 5)


def build_new_array(conditions: dict, existing: dict, chapters: list) -> list:
    """Build list of problem entry lines, merging conditions with existing solutions."""
    def sort_key(k):
        try: return (0, int(k))
        except: return (1, k)

    all_nums = sorted(set(list(conditions.keys()) + list(existing.keys())), key=sort_key)
    lines = []
    for num in all_nums:
        if num in existing:
            # Keep full solution (already prefixed with '  ')
            line = existing[num]
            if not line.rstrip().endswith(','):
                line = line.rstrip() + ','
            lines.append(line)
        elif num in conditions:
            cdata = conditions[num]
            cond = cdata.get('condition', '')
            if not cond:
                continue
            n = int(num) if num.isdigit() else 0
            page = estimate_page(n, chapters) if chapters else max(1, n // 5)
            image_urls = cdata.get('imageUrls', [])
            if image_urls:
                # Есть картинки-решения → записываем imageUrls, без fake steps
                urls_ts = ', '.join(f"'{u}'" for u in image_urls)
                lines.append(f"  {{ number: '{num}', page: {page}, condition: '{esc(cond)}', imageUrls: [{urls_ts}] }},")
            else:
                # Нет картинок → пишем заглушку (будет обновлено после скрапинга)
                step = make_step(cond)
                lines.append(f"  {{ number: '{num}', page: {page}, condition: '{esc(cond)}', steps: ['{esc(step)}'], answer: 'Решение представлено выше.' }},")
    return lines


def build_chapters_array(arr_name: str, solutions_arr_name: str, chapters: list, all_nums: set) -> str:
    """Build new chapters array using filter() on solutions array."""
    parts = []
    for title, start, end in chapters:
        nums_in_ch = [n for n in all_nums if n.isdigit() and start <= int(n) <= end]
        if not nums_in_ch:
            continue
        parts.append(
            f"  {{ title: '{esc(title)}', problems: "
            f"{solutions_arr_name}.filter(p => {{ const n = parseInt(p.number); return n >= {start} && n <= {end}; }}) }}"
        )
    if not parts:
        return ''
    return f'const {arr_name}: GdzChapter[] = [\n' + ',\n'.join(parts) + '\n]'


def rebuild_book(slug: str, lines: list) -> tuple:
    """
    Rebuild one book's array and chapters.
    Returns (modified_lines, new_problems_added).
    """
    arr_name = SLUG_TO_PRIMARY_ARRAY.get(slug)
    ch_arr_name = SLUG_TO_CHAPTERS_ARRAY.get(slug)
    chapters = CHAPTERS.get(slug, [])

    if not arr_name:
        print(f'  [{slug}] нет маппинга массива')
        return lines, 0

    # Load conditions
    cond_file = CONDITIONS_DIR / f'{slug}.json'
    if not cond_file.exists():
        print(f'  [{slug}] нет файла условий')
        return lines, 0
    
    raw = json.loads(cond_file.read_text(encoding='utf-8'))
    conditions = {str(p['number']): p for p in raw}
    if not conditions:
        print(f'  [{slug}] файл условий пустой')
        return lines, 0

    # Get existing full solutions from ALL related arrays (primary + Extra* variants)
    # Use EXACT prefix matching to avoid cross-book contamination (e.g. vilenkin vs vilenkin5)
    existing = {}
    # Determine the shared prefix for this book's arrays
    # e.g. 'merzlyak7Solutions' → prefix='merzlyak7', extra arrays: merzlyak7Extra, merzlyak7Extra2
    # Use the primary array name as the exact base, strip 'Solutions' suffix
    base_prefix = re.sub(r'Solutions$', '', arr_name)
    for i, line in enumerate(lines):
        # Match exact prefix: must start with base_prefix and be followed by Solutions or Extra
        m = re.match(rf'^const ({re.escape(base_prefix)}(?:Solutions|Extra\w*))\s*:', line)
        if m:
            sol = get_existing_solutions(lines, m.group(1))
            existing.update(sol)

    print(f'  [{slug}] загружено {len(conditions)} условий, {len(existing)} полных решений')

    # Find primary Solutions array bounds
    bounds = find_array_bounds(lines, arr_name)
    if not bounds:
        print(f'  [{slug}] массив {arr_name} не найден')
        return lines, 0

    # Build new array content
    new_lines = build_new_array(conditions, existing, chapters)
    new_count = len(new_lines) - len(existing)

    # Replace array content
    new_array = (
        [f'const {arr_name}: GdzProblem[] = [']
        + new_lines
        + [']']
    )

    modified = lines[:bounds[0]] + new_array + lines[bounds[1]+1:]

    # Rebuild chapters array
    if ch_arr_name and chapters:
        all_nums = set(conditions.keys()) | set(existing.keys())
        new_ch_str = build_chapters_array(ch_arr_name, arr_name, chapters, all_nums)
        if new_ch_str:
            ch_bounds = find_array_bounds(modified, ch_arr_name)
            if ch_bounds:
                new_ch_lines = new_ch_str.split('\n')
                modified = modified[:ch_bounds[0]] + new_ch_lines + modified[ch_bounds[1]+1:]
                print(f'    главы перестроены ({len(chapters)} параграфов)')

    print(f'  [{slug}] DONE: {new_count} новых задач, всего {len(new_lines)}')
    return modified, max(0, new_count)


def main():
    target = sys.argv[1] if len(sys.argv) > 1 else None

    content = GDZ_TS.read_text(encoding='utf-8')
    lines = content.split('\n')

    slugs = [target] if target else list(SLUG_TO_PRIMARY_ARRAY.keys())
    total_new = 0

    for slug in slugs:
        lines, n = rebuild_book(slug, lines)
        total_new += n
        print()

    if total_new > 0:
        GDZ_TS.write_text('\n'.join(lines), encoding='utf-8')
        print(f'Итого добавлено: {total_new} новых задач')
        print('Запустите: npm run build')
    else:
        print('Ничего не добавлено.')


if __name__ == '__main__':
    main()
