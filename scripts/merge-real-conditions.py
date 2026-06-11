#!/usr/bin/env python3
"""
Мёрджер: берёт спарсенные реальные условия из JSON
и обновляет src/data/gdz.ts — заменяет фиктивные condition
на реальные, сохраняя наши оригинальные steps и answer.

Логика:
  1. Читает все JSON-файлы из scripts/gdz-conditions/
  2. Для каждой книги строит словарь {номер → condition}
  3. В gdz.ts находит все блоки *Solutions и *Extra*
     с совпадающим номером и заменяет строку condition:
"""

import re
import json
from pathlib import Path

CONDITIONS_DIR = Path(__file__).parent / 'gdz-conditions'
GDZ_TS = Path(__file__).parent.parent / 'src/data/gdz.ts'

# Карта: имя нашего файла JSON → префиксы массивов в gdz.ts
FILE_TO_PREFIX = {
    'makarychev-7':     ['makarychev7'],
    'merzlyak-7':       ['merzlyak7'],
    'atanasyan-7':      ['atanasyan7'],
    'makarychev-8':     ['makarychev8'],
    'merzlyak-8':       ['merzlyak8'],
    'atanasyan-8':      ['atanasyan8'],
    'makarychev-9':     ['makarychev9'],
    'merzlyak-9':       ['merzlyak9'],
    'atanasyan-9':      ['atanasyan9'],
    'vilenkin-5':       ['vilenkin5'],
    'merzlyak-5':       ['merzlyak5'],
    'vilenkin-6':       ['vilenkin', 'vilenkin6'],
    'merzlyak-6':       ['merzlyak6'],
    'kolmogorov-10':    ['kolmogorov10'],
    'kolmogorov-11':    ['kolmogorov11'],
    'atanasyan-10':     ['atanasyan10'],
    'atanasyan-11':     ['atanasyan11'],
    'ladyzhenskaya-6':  ['ladyzhenskaya6'],
    'ladyzhenskaya-7':  ['ladyzhenskaya7'],
    'ladyzhenskaya-8':  ['ladyzhenskaya8'],
    'baranov-5':        ['baranov5'],
    'peryshkin-7':      ['peryshkin7'],
    'peryshkin-8':      ['peryshkin8'],
    'spotlight-6':      ['spotlight6'],
}

# Для книг с нестандартными номерами условий нужен маппинг.
# Kolmogorov-10 и kolmogorov-11 используют общую нумерацию (1-580+).
# Kolmogorov-10 → задачи 1-199, kolmogorov-11 → 200+.
# Если JSON содержит задачи из обоих диапазонов,
# merger применит только те номера, что есть в соответствующем массиве gdz.ts.


def load_conditions(json_file: Path) -> dict:
    """Возвращает {номер_строкой → condition}"""
    with open(json_file, encoding='utf-8') as f:
        data = json.load(f)
    return {str(p['number']): p['condition'] for p in data}


def escape_ts_string(s: str) -> str:
    """Экранирует строку для вставки в TypeScript строку (одинарные кавычки)."""
    s = s.replace('\\', '\\\\')
    s = s.replace("'", "\\'")
    # Убираем переносы строк
    s = s.replace('\n', ' ').replace('\r', '')
    # Убираем лишние пробелы
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def replace_condition_in_line(line: str, new_condition: str) -> str:
    """Заменяет значение condition: '...' в строке."""
    escaped = escape_ts_string(new_condition)
    # Паттерн: condition: '...' или condition: "..."
    new_line = re.sub(
        r"condition:\s*['\"].*?['\"]",
        f"condition: '{escaped}'",
        line
    )
    return new_line


def merge_book(json_file: Path, prefixes: list, content: str) -> tuple:
    """
    Заменяет conditions для одной книги.
    Возвращает (новый контент, кол-во замен).
    """
    conditions = load_conditions(json_file)
    if not conditions:
        return content, 0

    lines = content.split('\n')
    replacements = 0

    # Определяем, в каком массиве мы находимся
    current_array_prefix = None

    for i, line in enumerate(lines):
        # Начало массива Solutions/Extra
        m = re.match(r'^const (\w+)(?:Solutions\d*|Extra\d*): GdzProblem\[\]', line)
        if m:
            arr_name = m.group(1)
            # Проверяем, относится ли к нашей книге
            if any(arr_name.startswith(p) for p in prefixes):
                current_array_prefix = arr_name
            else:
                current_array_prefix = None
            continue

        # Конец массива
        if line.strip() == ']' and current_array_prefix:
            current_array_prefix = None
            continue

        # Замена condition в строке внутри нужного массива
        if current_array_prefix and 'condition:' in line and 'number:' in line:
            # Извлекаем номер задачи из строки
            num_m = re.search(r"number:\s*['\"](\d+(?:\.\d+)?)['\"]", line)
            if num_m:
                num = num_m.group(1)
                if num in conditions:
                    new_line = replace_condition_in_line(line, conditions[num])
                    if new_line != line:
                        lines[i] = new_line
                        replacements += 1

    return '\n'.join(lines), replacements


def run():
    if not GDZ_TS.exists():
        print(f'Файл не найден: {GDZ_TS}')
        return

    with open(GDZ_TS, encoding='utf-8') as f:
        content = f.read()

    total_replacements = 0
    processed_files = 0

    for json_file in sorted(CONDITIONS_DIR.glob('*.json')):
        book_slug = json_file.stem
        prefixes = FILE_TO_PREFIX.get(book_slug)
        if not prefixes:
            print(f'  Нет маппинга для {book_slug}, пропускаем')
            continue

        conditions = load_conditions(json_file)
        if not conditions:
            continue

        content, n = merge_book(json_file, prefixes, content)
        total_replacements += n
        processed_files += 1
        print(f'  [{book_slug}] заменено {n} условий (спарсено: {len(conditions)})')

    if total_replacements > 0:
        with open(GDZ_TS, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'\nИтого: {total_replacements} замен в {processed_files} книгах')
        print(f'Файл обновлён: {GDZ_TS}')
    else:
        print('Замен не найдено. Проверьте, что JSON-файлы не пустые.')


if __name__ == '__main__':
    run()
