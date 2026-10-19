"""Extend the existing code-native course illustrations to every production course.

Each output is a standalone, accessible, 800 × 480 SVG. Only real catalog facts
are printed: recognizable subject, school, optional known age/class and a short
course-specific line. No prices, invented promises or enrollment conditions.
"""
from pathlib import Path
import hashlib
import html
import json
import re
import xml.etree.ElementTree as ET
from collections import Counter
WORK = Path(__file__).resolve().parent
DEST = WORK / 'proschools-preview/dist/assets/course-covers'
DARK = '#292b25'
CREAM = '#fff9ee'
CORAL = '#ed8866'
BLUE = '#7f9fbc'
MINT = '#adc3a8'
GOLD = '#e9bd75'
LILAC = '#b5a2c6'
PALETTES = [
    ('#e5ebdf', CORAL, BLUE, MINT),
    ('#f8e5d5', BLUE, CORAL, MINT),
    ('#e1ebee', CORAL, MINT, GOLD),
    ('#eee4ed', MINT, CORAL, BLUE),
    ('#f4e8cd', BLUE, CORAL, LILAC),
    ('#e8eddb', CORAL, BLUE, GOLD),
]
LABELS = {
    'shkolnye-predmety': 'Школьные предметы', 'kompyuternaya-gramotnost': 'Компьютер',
    'mobilnye-prilozheniya': 'Приложения', 'programmirovanie': 'Код и игры',
    'python': 'Python', 'scratch': 'Scratch', 'roblox': 'Roblox', 'minecraft': 'Minecraft',
    'unity': 'Создание игр', 'web-razrabotka': 'Сайты', 'iskusstvennyy-intellekt': 'Нейросети',
    'robototehnika': 'Роботы', 'kiberbezopasnost': 'Киберзащита',
    'angliyskiy': 'Английский', 'matematika': 'Математика', 'russkiy': 'Русский язык',
    'fizika': 'Физика', 'himiya': 'Химия', 'biologiya': 'Биология', 'informatika': 'Информатика',
    'istoriya': 'История', 'obshchestvoznanie': 'Обществознание', 'literatura': 'Литература',
    'geografiya': 'География', 'shahmaty': 'Шахматы', 'dizayn': 'Дизайн',
    '3d-modelirovanie': '3D-модели', 'risovanie': 'Рисование', 'videomontazh': 'Видео',
    'muzyka': 'Музыка', 'podgotovka-k-shkole': 'Скоро в школу', 'logika': 'Логика',
    'chtenie': 'Чтение', 'logoped': 'Чёткая речь', 'soft-skills': 'Навыки общения',
    'finansovaya-gramotnost': 'Деньги', 'ege': 'ЕГЭ', 'oge': 'ОГЭ',
}
SUBJECTS = ['matematika', 'russkiy', 'angliyskiy', 'fizika', 'himiya', 'biologiya',
            'informatika', 'istoriya', 'obshchestvoznanie', 'literatura', 'geografiya']
def esc(s):
    return html.escape(str(s), quote=True)
def rect(x, y, w, h, fill, r=12, stroke=None, sw=3):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"' + (f' stroke="{stroke}" stroke-width="{sw}"' if stroke else '') + '/>'
def path(d, fill='none', stroke=DARK, sw=4, **kwargs):
    attrs = ' '.join(f'{k.replace("_", "-")}="{v}"' for k, v in kwargs.items())
    return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" {attrs}/>'
def circle(x, y, r, fill, stroke=None, sw=3):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}"' + (f' stroke="{stroke}" stroke-width="{sw}"' if stroke else '') + '/>'
def text(s, x, y, size=50, color=DARK, weight=800, anchor='start'):
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" font-weight="{weight}" text-anchor="{anchor}">{esc(s)}</text>'
def browser(inside, accent=CORAL):
    return (rect(8, 33, 285, 200, DARK, 18) + rect(0, 24, 285, 200, CREAM, 18, DARK)
            + path('M1 64H284', sw=3) + circle(23, 44, 5, accent)
            + circle(43, 44, 5, GOLD) + circle(63, 44, 5, MINT) + inside)
def cube(x, y, size=70, a=CORAL, b=BLUE, c=MINT):
    h = size / 2
    return (path(f'M{x} {y}l{h} {-h*.5} {h} {h*.5} {-h} {h*.5}Z', a, DARK, 3)
            + path(f'M{x} {y}v{size*.7}l{h} {h*.5}v{-size*.7}Z', b, DARK, 3)
            + path(f'M{x+h} {y+h*.5}l{h} {-h*.5}v{size*.7}l{-h} {h*.5}Z', c, DARK, 3))
def book(a=CORAL, b=BLUE, letters='Аа'):
    return (path('M30 58Q90 32 150 64Q210 32 270 58V224Q210 197 150 229Q90 197 30 224Z', CREAM, DARK, 4)
            + path('M150 66V226', sw=3) + text(letters, 48, 140, 50, a)
            + path('M52 166h72M52 185h60M176 96h70M176 117h52M176 139h70M176 161h60M176 184h68', stroke=b, sw=7))
def notebook(a=CORAL, b=BLUE, content='x² + y²'):
    return (rect(33, 15, 222, 244, CREAM, 16, DARK)
            + path('M61 21V253', stroke=a, sw=3)
            + path('M75 62h155M75 106h155M75 150h155M75 194h155M75 237h155', stroke='#dce2d7', sw=2)
            + ''.join(rect(22, y, 26, 8, b, 4) for y in [46, 92, 138, 184, 230])
            + text(content, 82, 151, 42, a)
            + path('m185 206 15 15 32-38', stroke=b, sw=8))
def scene(kind, a, b, c, n):
    """Large vector objects, readable at thumbnail size; no decorative microcopy."""
    if kind in ['python', 'programmirovanie', 'kompyuternaya-gramotnost', 'informatika']:
        symbol = 'print( )' if kind == 'python' else ('0 1' if kind == 'informatika' else '</>')
        inside = text(symbol, 142, 147, 62, a, anchor='middle') + path('M36 183h110m20 0h68', stroke=b, sw=10)
        return browser(inside, a) + path('m224 174 8 64 17-18 20 31 14-10-20-29 24-6Z', c, DARK, 3)
    if kind == 'scratch':
        g = ''
        for i, color in enumerate([a, GOLD, b, c]):
            x = 22 + (i % 2) * 16
            y = 22 + i * 55
            g += path(f'M{x} {y}h28v-8h25v8h171v47H{x+53}v8h-25v-8H{x}Z', color, DARK, 3)
            g += path(f'M{x+24} {y+24}h{110-i*15}', stroke=CREAM, sw=8)
        return g + path('m234 170 7 59 17-18 16 25 13-9-17-25 21-6Z', CREAM, DARK, 3)
    if kind in ['roblox', 'minecraft', '3d-modelirovanie']:
        if kind == 'roblox':
            return ('<g transform="rotate(17 160 109)">' + rect(91, 17, 146, 146, a, 10, DARK)
                    + rect(138, 64, 52, 52, '#e9e8de', 1, DARK) + '</g>'
                    + cube(13, 176, 105, b, a, c) + cube(187, 194, 77, c, b, GOLD))
        return (cube(104, 48, 145, a, b, c) + cube(12, 162, 105, c, a, b)
                + cube(194, 190, 80, GOLD, b, a)
                + (path('M175 8v27M276 105h25M85 77H57', stroke=DARK, sw=4) if kind == '3d-modelirovanie' else ''))
    if kind == 'unity':
        return (rect(9, 15, 280, 180, CREAM, 17, DARK)
                + circle(224, 57, 21, GOLD) + path('M9 159 80 73l91 110 49-64 69 57V195H9Z', c, DARK, 3)
                + path('M74 173Q84 150 110 157H192Q219 150 231 176l19 61Q252 262 231 256l-39-28h-82l-35 28Q48 268 56 238Z', a, DARK, 4)
                + path('M86 185v34M69 202h34', sw=7) + circle(202, 191, 7, CREAM) + circle(220, 210, 7, CREAM))
    if kind in ['web-razrabotka', 'dizayn']:
        inner = rect(22, 84, 108, 100, a, 8) + rect(152, 88, 105, 17, b, 8)
        inner += rect(152, 121, 85, 10, '#d2d4c7', 5) + rect(152, 145, 65, 10, '#d2d4c7', 5) + rect(152, 172, 86, 24, c, 8)
        inner += path('m44 163 28-44 37 44Z', CREAM, CREAM, 2)
        return browser(inner, a) + path('m233 157 6 69 18-18 20 31 15-10-22-31 27-7Z', CREAM, DARK, 3)
    if kind == 'mobilnye-prilozheniya':
        return (rect(70, 0, 149, 265, DARK, 26) + rect(78, 9, 133, 246, CREAM, 21)
                + rect(110, 18, 70, 12, DARK, 6) + rect(94, 51, 101, 71, a, 14)
                + ''.join(rect(x, y, 37, 37, color, 9) for x, y, color in [(95, 139, b), (157, 139, c), (95, 195, GOLD), (157, 195, a)])
                + circle(48, 99, 24, GOLD, DARK) + path('m35 99 9 10 17-21', sw=4))
    if kind == 'iskusstvennyy-intellekt':
        g = ''
        pts = [(147, 22), (70, 61), (225, 65), (38, 144), (141, 126), (261, 146), (77, 224), (218, 225)]
        for p, q in [(0, 1), (0, 2), (1, 3), (1, 4), (2, 4), (2, 5), (3, 6), (4, 6), (4, 7), (5, 7), (6, 7)]:
            g += path(f'M{pts[p][0]} {pts[p][1]}L{pts[q][0]} {pts[q][1]}', stroke=DARK, sw=5)
        for i, (x, y) in enumerate(pts):
            g += circle(x, y, 22 if i != 4 else 42, [a, b, c, GOLD][i % 4], DARK)
        return g + text('AI', 141, 139, 33, DARK, anchor='middle')
    if kind == 'robototehnika':
        return (rect(62, 38, 174, 142, c, 28, DARK) + path('M150 11v27', sw=5) + circle(150, 9, 11, a, DARK)
                + rect(86, 69, 126, 54, CREAM, 15, DARK) + circle(119, 95, 13, b) + circle(181, 95, 13, b)
                + path('M118 147h64', sw=7) + rect(91, 192, 115, 56, a, 11, DARK)
                + path('M64 105H37v92M236 105h31v92M119 248v20M180 248v20', sw=10))
    if kind == 'kiberbezopasnost':
        return (path('M149 6Q202 43 263 44v95Q250 211 149 264Q49 211 36 139V44Q96 43 149 6Z', c, DARK, 4)
                + rect(87, 110, 127, 98, CREAM, 15, DARK) + path('M108 110V86a42 42 0 0 1 84 0v24', sw=9)
                + circle(150, 150, 13, a) + path('M150 160v21', stroke=a, sw=10))
    if kind == 'angliyskiy':
        return (rect(0, 24, 214, 132, a, 30, DARK) + path('m47 156-13 29 61-29', a, DARK, 3)
                + text('Hello!', 22, 109, 54, CREAM) + rect(139, 145, 151, 99, CREAM, 26, DARK)
                + text('Hi!', 177, 213, 54, b) + path('m254 244 19 20-47-20', CREAM, DARK, 3))
    if kind == 'matematika':
        return notebook(a, b, 'x² + y²') + path('M229 19 282 90h-88Z', c, DARK, 3)
    if kind == 'russkiy':
        return notebook(a, b, 'Аа Бб') + text('Я', 222, 247, 78, c)
    if kind == 'fizika':
        return (''.join(f'<ellipse cx="150" cy="136" rx="132" ry="48" fill="none" stroke="{col}" stroke-width="6" transform="rotate({rot} 150 136)"/>' for rot, col in [(0, a), (60, b), (120, DARK)])
                + circle(150, 136, 24, c, DARK) + circle(26, 119, 12, a, DARK) + circle(217, 51, 12, b, DARK) + circle(225, 211, 12, GOLD, DARK))
    if kind == 'himiya':
        return (path('M42 16h72M58 18v89L8 215Q-2 244 30 244h98Q158 244 147 215L99 107V18', CREAM, DARK, 4)
                + path('m43 159-27 61q-3 13 16 13h92q19 0 14-13l-27-61Z', a, 'none', 0)
                + path('M198 32h60M212 33v76l-40 84q-13 32 17 32h89q30 0 15-32l-40-84V33', CREAM, DARK, 4)
                + path('m199 165-18 38q-7 12 10 12h81q16 0 9-12l-18-38Z', b, 'none', 0)
                + circle(74, 185, 9, CREAM) + circle(97, 209, 7, CREAM) + circle(234, 182, 8, CREAM))
    if kind == 'biologiya':
        return (path('M149 256V68', stroke=DARK, sw=8)
                + path('M149 188Q49 203 24 101Q138 91 149 188Z', c, DARK, 3)
                + path('M151 123Q246 135 278 30Q173 18 151 123Z', b, DARK, 3)
                + path('M150 74Q78 71 81 0Q154 9 150 74Z', a, DARK, 3)
                + path('M149 188 62 133M151 123l87-61', sw=3))
    if kind == 'istoriya':
        return (path('M14 71 149 0l136 71Z', a, DARK, 4) + rect(15, 79, 270, 25, CREAM, 3, DARK)
                + ''.join(rect(x, 109, 39, 127, c if i % 2 else b, 2, DARK) for i, x in enumerate([38, 128, 218]))
                + rect(13, 238, 275, 29, CREAM, 3, DARK))
    if kind in ['obshchestvoznanie', 'soft-skills']:
        return (rect(20, 7, 227, 95, CREAM, 25, DARK) + path('m75 102-14 22 57-22', CREAM, DARK, 3)
                + circle(82, 163, 37, a, DARK) + circle(216, 163, 37, b, DARK)
                + path('M15 261v-20a67 67 0 0 1 134 0v20Z', c, DARK, 4)
                + path('M149 261v-20a67 67 0 0 1 134 0v20Z', GOLD, DARK, 4)
                + path('m74 57 23 18 42-43M172 49h43M172 70h30', stroke=a, sw=6))
    if kind in ['literatura', 'chtenie']:
        return book(a, b, 'Аа' if kind == 'chtenie' else 'Книга')
    if kind == 'geografiya':
        return (circle(146, 125, 111, b, DARK, 4)
                + path('M54 64 100 57l30 29-17 32-47-7-21 32M190 34l-31 37 8 44 44 13 8 62 35-12 3-69M132 176l-9 28 22 30', c, DARK, 3)
                + path('M235 27Q305 110 243 208Q205 263 91 250', sw=7)
                + path('m127 263 65 0M161 238v25', sw=7))
    if kind == 'shahmaty':
        return (path('M8 196h277v64H8Z', CREAM, DARK, 3)
                + ''.join(rect(x, y, 46, 32, c, 0) for j, y in enumerate([196, 228]) for x in range(8 + (j % 2) * 46, 285, 92))
                + path('m109 51-8-34 27 13 17-30 21 40 43 29 9 70-51-8-10-29-29 31-15 42h94l10 22H87l12-22 24-64-39 10-19-27Z', b, DARK, 4)
                + circle(143, 65, 6, CREAM))
    if kind == 'risovanie':
        return (rect(44, 15, 214, 239, CREAM, 8, DARK) + circle(174, 78, 38, a)
                + path('m63 223 59-94 49 71 41-53 27 76Z', c, DARK, 3)
                + '<g transform="rotate(20 50 153)">' + rect(29, 89, 25, 153, b, 9, DARK)
                + path('M29 89V61Q41 30 54 61v28Z', a, DARK, 3) + '</g>')
    if kind == 'videomontazh':
        return (browser(rect(23, 83, 239, 107, b, 10) + path('m119 104 53 31-53 31Z', CREAM, CREAM, 2), a)
                + rect(31, 206, 245, 47, CREAM, 9, DARK)
                + ''.join(rect(x, 216, 44, 27, col, 4) for x, col in [(42, a), (96, c), (150, GOLD), (204, b)])
                + path('M167 198v67', stroke=DARK, sw=4))
    if kind == 'muzyka':
        return (rect(23, 24, 129, 224, b, 15, DARK) + circle(87, 88, 28, CREAM, DARK)
                + circle(87, 179, 45, DARK) + circle(87, 179, 21, a)
                + path('M212 172V32l73-20v134', stroke=DARK, sw=9)
                + path('M212 58 285 36', stroke=a, sw=14)
                + '<ellipse cx="195" cy="180" rx="25" ry="17" fill="' + a + '" transform="rotate(-20 195 180)"/>'
                + '<ellipse cx="267" cy="153" rx="25" ry="17" fill="' + a + '" transform="rotate(-20 267 153)"/>')
    if kind == 'logika':
        return (path('M20 21h87v-8q0-25 24-25t24 25v8h87v87h12q25 0 25 24t-25 24h-12v87h-87v-12q0-25-24-25t-24 25v12H20v-87h12q25 0 25-24t-25-24H20Z', c, DARK, 4)
                + text('?', 123, 157, 92, a, anchor='middle'))
    if kind == 'logoped':
        return (rect(3, 25, 253, 144, CREAM, 35, DARK) + path('m60 169-15 34 63-34', CREAM, DARK, 3)
                + text('Р-р-р!', 24, 123, 64, a) + circle(229, 228, 48, c, DARK)
                + path('M206 228q24 28 47 0', sw=6))
    if kind == 'finansovaya-gramotnost':
        return (rect(13, 82, 274, 164, c, 21, DARK) + rect(181, 127, 120, 76, a, 14, DARK)
                + circle(211, 165, 10, CREAM) + circle(90, 57, 51, GOLD, DARK)
                + text('₽', 90, 77, 61, DARK, anchor='middle')
                + path('M44 123h87', stroke=CREAM, sw=7))
    return (book(a, b, 'АБ') + '<g transform="rotate(17 260 170)">' + rect(241, 37, 23, 193, a, 7, DARK)
            + path('m241 230 12 32 11-32Z', GOLD, DARK, 3) + '</g>')
def course_theme(course):
    title = course['fullTitle'].lower()
    tags = course['categories']
    exam = 'ЕГЭ' if 'ege' in tags else ('ОГЭ' if 'oge' in tags else None)
    if exam:
        domain = next((s for s in SUBJECTS if s in tags), None)
        subject = LABELS.get(domain, 'Подготовка')
        if domain == 'matematika' and re.search(r'профильн', title):
            subject = 'Профильная математика'
        elif domain == 'matematika' and re.search(r'базов', title):
            subject = 'Базовая математика'
        return domain or 'matematika', exam, subject
    for regex, domain in [
        (r'figma', 'dizayn'), (r'python|django|питон', 'python'),
        (r'scratch|скретч', 'scratch'), (r'roblox|роблокс|luau', 'roblox'),
        (r'minecraft|майнкрафт', 'minecraft'), (r'unity|godot|unreal', 'unity'),
        (r'blender|3d|3д|тр[её]хмер', '3d-modelirovanie'),
        (r'нейросет|искусственн|нейро|chatgpt|ai\b', 'iskusstvennyy-intellekt'),
        (r'fullstack|html|css|javascript|java script|сайт|веб|web', 'web-razrabotka'),
        (r'мобильн|приложен|android|ios', 'mobilnye-prilozheniya'),
    ]:
        if re.search(regex, title):
            keyword = 'Figma' if 'figma' in title else LABELS[domain]
            return domain, keyword, ''
    domain = course['primaryCategory']
    return domain, LABELS.get(domain, 'Новый интерес'), ''
def split_keyword(keyword):
    if keyword in ['Обществознание', 'Информатика', 'Киберзащита', 'Приложения', 'Английский', 'Математика', 'Литература', 'Нейросети', 'Minecraft', 'Рисование']:
        return [keyword], min(76, int(505 / (len(keyword) * .58)))
    if len(keyword) > 15:
        words = keyword.split()
        if len(words) >= 2:
            half = max(1, len(words)//2)
            return [' '.join(words[:half]), ' '.join(words[half:])], 64
    return [keyword], 80 if len(keyword) <= 8 else 64
def subline(course, domain, exam_subject, keyword):
    if exam_subject:
        return exam_subject
    t = course['fullTitle']
    markers = [(r'django', 'Веб-приложения · Django'), (r'fullstack', 'Разработка · Fullstack'),
               (r'figma', 'Графический дизайн'), (r'blender', 'Моделирование · Blender'),
               (r'pygame', 'Разработка игр · PyGame'), (r'робот|robot', 'Сборка и управление'),
               (r'графическ', 'Графический дизайн'), (r'скорочт', 'Чтение и скорочтение'),
               (r'вокал', 'Уроки вокала'), (r'фотошоп|photoshop', 'Обработка изображений'),
               (r'бот', 'Разработка ботов')]
    for pattern, line in markers:
        if re.search(pattern, t, re.I):
            return line
    words = re.sub(r'^(Курс|Курсы|Обучение|Программа|Онлайн-курс|Индивидуальные занятия)\s+', '', t, flags=re.I)
    words = re.sub(r'\s+(для детей|для школьников|онлайн|в .+|— .*)$', '', words, flags=re.I)
    words = words.strip(' —«»')
    if len(words) <= 31 and keyword.lower() not in words.lower() and words:
        return words[0].upper() + words[1:]
    known = {'python': 'Программирование', 'scratch': 'Визуальное программирование',
             'roblox': 'Создание игровых миров', 'minecraft': 'Игры и программирование',
             'unity': 'Разработка игр', 'web-razrabotka': 'Веб-разработка',
             'kompyuternaya-gramotnost': 'Компьютерная грамотность',
             'mobilnye-prilozheniya': 'Мобильная разработка',
             'iskusstvennyy-intellekt': 'Искусственный интеллект',
             'kiberbezopasnost': 'Безопасность в интернете',
             'finansovaya-gramotnost': 'Финансовая грамотность'}
    return known.get(domain, '')
def create(course):
    seed = int(hashlib.sha256(course['id'].encode()).hexdigest()[:12], 16)
    bg, a, b, c = PALETTES[seed % len(PALETTES)]
    domain, keyword, exam_subject = course_theme(course)
    lines, size = split_keyword(keyword)
    subtitle = subline(course, domain, exam_subject, keyword)
    # Distinct deterministic compositions use real subject objects and course data;
    # their transforms, accent placement and palettes vary, not just the filename.
    variant = (seed >> 4) % 6
    art_x = [458, 448, 460, 442, 455, 450][variant] + ((seed >> 8) % 31) / 10
    art_y = [175, 174, 171, 180, 177, 173][variant] + ((seed >> 13) % 21) / 10
    rotation = [-6, 4, -3, 6, -5, 3][variant] + ((seed >> 18) % 13) / 10
    scale = [1, .98, 1.02, 1, 1.01, .99][variant]
    title_y = 154 if len(lines) == 1 else 140
    title_parts = ''.join(text(line, 45, title_y+i*76, size) for i, line in enumerate(lines))
    subtitle_y = title_y + (len(lines)-1)*76 + 58
    # Long exam subjects fit on two large readable lines.
    subtitle_size = 37 if len(subtitle) < 16 else 29
    if len(subtitle) > 29:
        subtitle_size = 26
    age = course['age'] if course['age'] != 'Возраст уточняется' else ''
    school = course['brand']
    school_size = 24 if len(school) > 20 else 27
    school_width = min(550, 45 + len(school)*school_size*.58)
    art = scene(domain, a, b, c, seed)
    accent = (path('M641 63v27M627 77h27', stroke=a, sw=5)
              if variant % 2 == 0 else circle(701, 92, 17, a))
    # A large, simple theme-specific visual anchors the right half.
    g = f'<g transform="translate({art_x} {art_y}) rotate({rotation} 150 130) scale({scale})">{art}</g>'
    if 'ЕГЭ' in keyword or 'ОГЭ' in keyword:
        g += (circle(738, 363, 34, a, DARK, 3)
              + path('m720 363 12 12 24-29', stroke=CREAM, sw=7))
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="480" viewBox="0 0 800 480" role="img" aria-labelledby="title desc">'
           f'<title id="title">{esc(course["fullTitle"])} — {esc(school)}</title>'
           f'<desc id="desc">{esc(keyword)}. {esc(subtitle)}. {esc(age)}. Авторская векторная обложка программы.</desc>'
           '<g font-family="Arial, Helvetica, sans-serif">'
           + rect(0, 0, 800, 480, bg, 0)
           + f'<ellipse cx="{art_x+157}" cy="437" rx="145" ry="15" fill="{DARK}" opacity=".07"/>'
           + rect(43, 36, round(school_width), 46, CREAM, 23)
           + text(school, 64, 68, school_size, DARK, 700)
           + accent + title_parts
           + (text(subtitle, 48, subtitle_y, subtitle_size, DARK, 600) if subtitle else '')
           + g
           + (rect(44, 393, max(118, len(age)*15+36), 46, CREAM, 23) + text(age, 63, 425, 27, DARK, 700) if age else '')
           + '</g></svg>')
    ET.fromstring(svg)
    return svg, domain
