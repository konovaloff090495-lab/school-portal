#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Prepare reviewed online programming evidence without editing the course catalog.

Input: collect-online.py receipts in work/programming-online/source-cache.json.
Output: src/data/programming-online-verified.json. No inferred prices, age-to-grade
conversions, city branches, affiliate links, or independent duplicate ProgKids SKU.
"""
import argparse
import hashlib
import json
import pathlib
import re
from urllib.parse import urldefrag, urlsplit

ROOT = pathlib.Path(__file__).resolve().parents[2]
CACHE = ROOT / 'work/programming-online/source-cache.json'
OUTPUT = ROOT / 'src/data/programming-online-verified.json'
DATE = '2026-10-19'
KNOWN_CATEGORIES = {x['id'] for x in json.loads((ROOT / 'data/courses/categories.json').read_text())}

# A null age is intentional. A brand's age range is never copied to its courses.
BRANDS = [
    ('skysmart', 'Skysmart', 'https://skysmart.ru/programmirovanie-dlya-detej/', ['Скайсмарт']),
    ('synergy', 'Синергия', 'https://school-university.com/kursy-dlya-detey/robototehnika-ot-idei-do-prototipa/', ['Школа Синергия']),
    ('algoritmika', 'Алгоритмика', 'https://online.algoritmika.org/', ['Algorithmics']),
    ('kodland', 'Kodland', 'https://www.kodland.org/ru/courses/coding', ['Кодланд']),
    ('coddy', 'CODDY', 'https://coddyschool.com/online/', ['Кодди']),
    ('easycode', 'EasyCode', 'https://easycode.tech/', ['ИзиКод', 'Изи Код']),
    ('rebotica', 'Реботика', 'https://rebotica.ru/', ['Rebotica']),
    ('pixel', 'Пиксель', 'https://clubpixel.ru/', ['Pixel', 'Клуб Пиксель']),
    ('hello-world', 'Hello World School', 'https://hwschool.online/', ['Хеллоу Ворлд']),
    ('rostelecom-lyceum', 'Лицей Ростелеком', 'https://lc.rt.ru/', ['Ростелеком Лицей']),
    ('itgenio', 'Айтигенио', 'https://itgen.io/', ['ITGenio', 'Итгенио']),
    ('sirius', 'Сириус.Курсы', 'https://sochisirius.ru/obuchenie/distant', ['Сириус Курсы']),
    ('foxford', 'Фоксфорд', 'https://foxford.ru/catalog/courses/learn-to-code', ['Foxford']),
    ('skillbox-kids', 'Skillbox Kids', 'https://kids.skillbox.ru/catalog/programming', ['Скиллбокс Кидс', 'Skillbox для детей']),
    ('kvantastica', 'Квантастика', 'https://kvantastica.ru/', ['Kvantastica', 'Квантастика онлайн']),
    ('rocket-tech-school', 'Rocket Tech School / ProgKids', 'https://www.rts.school/', ['RTS', 'ProgKids', 'ПрогКидс', 'Рокет Тех Скул']),
    ('codim-online', 'CODIM.ONLINE', 'https://lesson.codim.online/', ['Кодим', 'Codim online']),
    ('mshp', 'Московская школа программистов', 'https://informatics.ru/', ['МШП', 'Школа программистов МШП']),
]

TOPICS = {'programmirovanie', 'python', 'scratch', 'roblox', 'minecraft', 'unity',
          'web-razrabotka', 'mobilnye-prilozheniya', 'kompyuternaya-gramotnost',
          'iskusstvennyy-intellekt', 'robototehnika', '3d-modelirovanie',
          'kiberbezopasnost', 'java', 'javascript', 'cpp', 'godot', 'informatika'}

# name, stable official product path, primary category, proof-backed subject labels.
SKILLBOX = [
    ('IT-Старт: цифровая грамотность', 'it-start', 'kompyuternaya-gramotnost', ['scratch', 'minecraft']),
    ('Программирование на Python PRO и нейросети', 'python-programmer-pro', 'python', ['iskusstvennyy-intellekt', 'kiberbezopasnost']),
    ('Python с нуля до первых проектов и нейросети', 'python-junior', 'python', ['minecraft', 'iskusstvennyy-intellekt']),
    ('Программирование на Python', 'python', 'python', ['web-razrabotka']),
    ('Разработка сайтов', 'website-developer', 'web-razrabotka', ['python']),
    ('Кибербезопасность и приложения на Python', 'python-security', 'kiberbezopasnost', ['python']),
    ('Создание сайтов', 'website-development', 'web-razrabotka', ['javascript']),
    ('Minecraft: программирование на Python', 'minecraft-python', 'minecraft', ['python']),
]
CODIM = [
    ('Scratch Junior', 'scratchjr', 'scratch', []),
    ('Minecraft Junior', 'minecraftjr', 'minecraft', []),
    ('Scratch: первый уровень', 'scratch_1', 'scratch', []),
    ('Scratch: второй уровень', 'scratch_2', 'scratch', []),
    ('Scratch: Большое путешествие', 'scratch_3', 'scratch', []),
    ('Scratch: Наглядная математика', 'scratchHM', 'scratch', []),
    ('Roblox Studio: создание игр', 'roblox', 'roblox', []),
    ('Minecraft: блочное программирование', 'minecraft', 'minecraft', []),
    ('App Inventor: мобильные приложения', 'appinventor', 'mobilnye-prilozheniya', []),
    ('CoSpaces: виртуальные миры', 'cospaces', 'programmirovanie', ['3d-modelirovanie']),
    ('Python в Minecraft', 'pythonvm', 'minecraft', ['python']),
    ('Python: первый уровень', 'python', 'python', []),
    ('Python: второй уровень', 'python2', 'python', []),
    ('Pygame: создание игр', 'pygame', 'python', []),
    ('Unity: блочное программирование', 'Unity_1', 'unity', []),
    ('Unity: программирование на C#', 'Unity_2', 'unity', []),
    ('Java для детей', 'java', 'programmirovanie', ['java']),
    ('Colobot: программирование роботов', 'colobot', 'programmirovanie', []),
    ('Telegram-боты на Python', 'tg_bot', 'python', []),
    ('Веб-разработка: HTML, CSS и JavaScript', 'web', 'web-razrabotka', ['javascript']),
    ('Arduino: робототехника', 'arduino', 'robototehnika', ['programmirovanie']),
    ('Искусственный интеллект просто', 'ai', 'iskusstvennyy-intellekt', []),
    ('3D-моделирование в Tinkercad', '3d_tinkercad', '3d-modelirovanie', []),
    ('Компьютерная азбука', 'komp_azbuka', 'kompyuternaya-gramotnost', []),
    ('Компьютерная грамотность', 'https://lesson.codim.online/komp_gramotnost', 'kompyuternaya-gramotnost', []),
]
RTS = [
    ('Junior: первое знакомство с компьютером и кодом', 'junior', 'kompyuternaya-gramotnost', ['programmirovanie']),
    ('Scratch: создание игр и анимаций', 'scratch', 'scratch', []),
    ('Roblox: разработка игровых миров', 'roblox', 'roblox', []),
    ('Minecraft: программирование', 'minecraft', 'minecraft', []),
    ('Python для школьников', 'python', 'python', []),
    ('Unity: создание игр', 'unity', 'unity', []),
    ('Веб-разработка: создание сайтов', 'sozdaniye-saytov-dlya-detey', 'web-razrabotka', ['javascript']),
    ('AI Start: нейросети для детей', 'neyroseti-dlya-detey', 'iskusstvennyy-intellekt', []),
    ('Графический дизайн', 'graficheskiy-dizayn', 'dizayn', []),
    ('Цифровое творчество', 'tsifrovoye-tvorchestvo', 'dizayn', []),
]
FOX = [
    ('Компьютерная грамотность и кибербезопасность', 'courses/15376/landing', 'kompyuternaya-gramotnost', ['kiberbezopasnost'], '3–6 класс', 'Видеокурс онлайн'),
    ('Основы компьютерной грамотности', 'courses/14771/landing', 'kompyuternaya-gramotnost', [], 'Дошкольники, 1–2 класс', 'Видеокурс онлайн'),
    ('Питон: начальный курс', 'mini_groups/16966/landing', 'python', [], '3–5 класс', 'Онлайн в мини-группе'),
    ('Питон: базовый курс, 1 ступень', 'mini_groups/17277/landing', 'python', [], '6–10 класс', 'Онлайн в мини-группе'),
    ('Питон: базовый курс, 2 ступень', 'mini_groups/17278/landing', 'python', [], '6–10 класс', 'Онлайн в мини-группе'),
    ('Скретч: визуальное программирование', 'mini_groups/17276/landing', 'scratch', [], '2–4 класс', 'Онлайн в мини-группе'),
    ('Питон: продвинутый курс, 1 ступень', 'mini_groups/17280/landing', 'python', [], '8–11 класс', 'Онлайн в мини-группе'),
]

# These descriptions summarize the actual curriculum, not navigation labels.
# Keys are brand + official product path so unrelated courses never inherit facts.
PROGRAM_NOTES = {
    ('skillbox-kids', 'it-start'): 'Единая начальная программа из 27 уроков: работа с файлами и безопасным интернетом, первые игры и мультфильмы в Scratch, затем своя карта Minecraft. Она предназначена для детей, которые начинают пользоваться компьютером с нуля.',
    ('skillbox-kids', 'python-programmer-pro'): 'Длинная траектория объединяет основы Python с созданием игр, сайтов и чат-ботов. В план входят защита данных, работа с нейросетями и проверка предложенного ИИ кода. Это программа на18месяцев, а не короткое вводное занятие.',
    ('skillbox-kids', 'python-junior'): 'Программирование начинается внутри Minecraft, а затем переходит к собственным проектам на Python. В опубликованной траектории есть 2D-игры, сайты и боты; обучение рассчитано на17месяцев и включает работу с нейросетями.',
    ('skillbox-kids', 'python'): 'Курс начинается с переменных, типов данных, условий и циклов. Дальше ученик пишет 2D-игры с Pygame, знакомится с веб-разработкой на Flask и создаёт Telegram-бота. В плане указаны10месяцев и несколько самостоятельных проектов.',
    ('skillbox-kids', 'website-developer'): 'Программа на18месяцев соединяет создание сайтов с последующей разработкой. Начальная ступень содержит HTML, CSS, Flexbox и JavaScript; ученики делают адаптивные страницы, работают с библиотеками и пробуют командную разработку.',
    ('skillbox-kids', 'python-security'): 'В программе есть защита паролей и данных, виртуальные машины, настольные приложения на PyQt и работа с API. Среди проектов — графический редактор и приложения для анализа данных. Продолжительность на странице курса —8месяцев.',
    ('skillbox-kids', 'website-development'): 'За8месяцев дети осваивают HTML, CSS, адаптивную вёрстку и основы JavaScript. В программу входят Flexbox, готовые библиотеки и командная работа; предусмотрены18онлайн-вебинаров и14видеоуроков, а результат собирается в6проектов.',
    ('skillbox-kids', 'minecraft-python'): 'Через задания внутри Minecraft ученик осваивает условия, циклы, функции и объектно-ориентированное программирование на Python. План завершается работой с файлами и собственной мини-игрой; заявлены8месяцев обучения и более20проектов.',
    ('codim-online', 'scratchjr'): 'ScratchJr знакомит с программированием через визуальные команды. Ребёнок собирает небольшие игры, мультфильмы и интерактивные истории. В описании отдельно указано, что можно начинать до освоения чтения.',
    ('codim-online', 'minecraftjr'): 'Логические задачи в Minecraft знакомят с алгоритмами через управление черепашкой в трёхмерном лабиринте. Это младшая программа со своими заданиями, отличная от полного курса Minecraft. Часть материалов использует Code.org; доступ к демо следует проверить перед оплатой.',
    ('codim-online', 'scratch_1'): 'Первая ступень Scratch разбирает спрайты, скрипты, костюмы, циклы, звуки и управление персонажами. Ребёнок создаёт анимации и игры, постепенно добавляя условия и сенсорные блоки. В плане перечислены отдельные проекты и демонстрационные уроки.',
    ('codim-online', 'scratch_2'): 'Второй уровень продолжает практическую работу в Scratch. Ученик создаёт игры и мультфильмы и усложняет собственные проекты с помощью визуальных команд. Перед выбором уровня полезно сравнить демонстрационные задания с уже пройденной первой ступенью.',
    ('codim-online', 'scratch_3'): 'Большое путешествие соединяет Scratch с задачами на английский язык и географию. Ученик создаёт интерактивные проекты и развивает логику через сюжетные задания. Это самостоятельная тематическая ступень, а не другое название начального курса.',
    ('codim-online', 'scratchHM'): 'Математика изучается через проекты в Scratch: арифметические операторы, сравнения, отрицательные числа, проценты, направления, градусы и координаты. Эти инструменты нужны для управления персонажами и создания игровых механик.',
    ('codim-online', 'roblox'): 'Курс посвящён Roblox Studio: созданию собственных игровых миров и поведению объектов. Учебные задания переводят интерес к готовым играм в работу над своим проектом. Программа и демонстрационные уроки опубликованы отдельно от тарифов.',
    ('codim-online', 'minecraft'): 'Ребёнок программирует робота-черепашку, который строит, копает и выполняет команды внутри Minecraft. Используются визуальные блоки; это отдельная программа от курса Python в Minecraft. Для занятий устанавливается учебное окружение.',
    ('codim-online', 'appinventor'): 'В App Inventor дети собирают мобильные приложения для Android из визуальных блоков. Проект создаётся на компьютере, а затем проверяется на телефоне. Такой формат знакомит с интерфейсом и логикой приложения до перехода к текстовым языкам.',
    ('codim-online', 'cospaces'): 'Программа знакомит с созданием трёхмерных проектов и виртуальной реальностью в CoSpaces. Дети собирают сцены, анимации и игровые взаимодействия. Школа рекомендует заранее проверить запуск платформы и демонстрационных материалов.',
    ('codim-online', 'pythonvm'): 'Python изучается через программирование объектов и построек в Minecraft. Это маршрут с текстовым кодом, отдельный от блочного курса Minecraft. Работа в знакомом игровом мире помогает увидеть результат выполнения программы.',
    ('codim-online', 'python'): 'Первая ступень Python использует Turtle и рисование по координатам. В плане есть типы данных, ввод и вывод, строки, списки, кортежи, словари и циклы. Перед покупкой школа предлагает проверить установку среды и демо-уроки.',
    ('codim-online', 'python2'): 'Продолжение начального курса Python посвящено оконным приложениям: полям ввода, кнопкам, спискам и изображениям. Ученик работает с JSON и API сайтов, получает данные и использует их в собственных программах.',
    ('codim-online', 'pygame'): 'Третья ступень использует библиотеку Pygame для создания двумерных игр на Python. Ученик работает с игровыми объектами и логикой собственного проекта. Pygame является библиотекой Python и не подменяется курсом Unity.',
    ('codim-online', 'Unity_1'): 'На первой ступени Unity дети создают 2D- и 3D-игры с помощью визуальных блоков и постепенно переходят к C#. В опубликованном плане встречаются физические компоненты, префабы, появление объектов и игровые сцены.',
    ('codim-online', 'Unity_2'): 'Вторая ступень Unity использует C#: переменные, циклы и условия применяются к игровым проектам. В плане перечислены TileMap, анимация, камера, префабы, звук и визуальные эффекты. Один из учебных проектов — приключенческая игра.',
    ('codim-online', 'java'): 'Курс Java начинается с основ языка и простых программ, затем ведёт к собственным проектам. На странице заявлены практические задания и поддержка куратора в чате. Предложение рассчитано на подростков и также доступно взрослым; в этом каталоге рассматривается детский маршрут.',
    ('codim-online', 'colobot'): 'В Colobot ребёнок программирует роботов для освоения виртуальной планеты: добычи ресурсов, строительства и защиты базы. Среда знакомит с конструкциями программирования, близкими к C++ и Java, через задачи трёхмерной стратегической игры.',
    ('codim-online', 'tg_bot'): 'Программа посвящена Telegram-ботам на Python и подключению ИИ. Ученик продумывает диалоги и логику, работает с данными и запускает бота на сервере. На странице есть разные варианты сопровождения; доступность тарифа уточняется при записи.',
    ('codim-online', 'web'): 'Веб-разработка начинается с HTML и CSS, затем добавляется интерактивность на JavaScript. В программе есть позиционирование, анимации, формы, DOM и события; финальные задания включают собственные страницы и игру на Canvas.',
    ('codim-online', 'arduino'): 'Курс Arduino соединяет программирование с основами электроники и робототехники. Для старта школа предлагает проверить установку используемых инструментов и демонстрационные материалы. Конкретное оборудование и доступность среды следует согласовать до покупки.',
    ('codim-online', 'ai'): 'Занятия знакомят с запросами к нейросетям, сравнением ответов, подготовкой презентаций и созданием медиапроектов. В плане есть работа с изображением, видео и озвучкой. Это освоение ИИ-инструментов, а не обязательное программирование собственной нейросети.',
    ('codim-online', '3d_tinkercad'): 'В браузерной среде Tinkercad дети моделируют трёхмерные объекты для собственных проектов. Курс относится к3D-моделированию, а не автоматически к написанию кода. На странице школа просит проверить доступность среды и демо до оплаты.',
    ('codim-online', 'komp_azbuka'): 'Компьютерная азбука помогает самостоятельно готовить доклады и презентации и делиться файлами через Google Диск. Это базовая работа с компьютером и цифровыми документами, отдельная от курса языка программирования.',
    ('codim-online', 'komp_gramotnost'): 'Начальная компьютерная грамотность предназначена для освоения повседневных действий на компьютере. Она помогает подготовиться к самостоятельной работе с учебными материалами и программами. Языки программирования выбираются следующей отдельной ступенью.',
    ('rocket-tech-school', 'junior'): 'Младшая программа знакомит с визуальными блоками через игры, интерактивные миры и мультфильмы. В описании разрешён старт до освоения чтения. Ученик тренирует управление компьютером и последовательность действий.',
    ('rocket-tech-school', 'scratch'): 'В Scratch дети создают аркады, мультфильмы и небольшие приложения. План включает управление персонажем, условия победы, математические операторы, клонирование и списки. Визуальные команды позволяют работать с логикой игры без сложного текстового синтаксиса.',
    ('rocket-tech-school', 'roblox'): 'Курс Roblox посвящён собственным персонажам, трёхмерным мирам и игровым проектам. Ученик переходит от создания сцены к настройке поведения и игровых взаимодействий. Проект можно дополнять по мере изучения инструментов Roblox Studio.',
    ('rocket-tech-school', 'minecraft'): 'Minecraft используется как среда для освоения команд и программирования игровых миров. В опубликованном плане есть координаты, циклы, условия и функции. Итоговые задания связаны с собственными постройками и взаимодействиями внутри игры.',
    ('rocket-tech-school', 'python'): 'В программе Python есть цифровой помощник, чат-бот с квестом, двумерная игра на Pygame и клиент-серверный веб-проект. Отдельная ступень знакомит с ИИ и обучением первой нейросети. Выполненные работы собираются в портфолио.',
    ('rocket-tech-school', 'unity'): 'Программа Unity использует C# для создания двумерных и трёхмерных игр. Ученик осваивает игровой движок и собирает собственные игровые миры. В описании результата заявлены законченные проекты для портфолио.',
    ('rocket-tech-school', 'sozdaniye-saytov-dlya-detey'): 'Курс создания сайтов охватывает HTML, CSS и JavaScript, адаптацию страниц под разные устройства и публикацию веб-портфолио. При выборе следует смотреть собственный план веб-разработки: в одном из общих промоблоков сайта остался текст про Unity.',
    ('rocket-tech-school', 'neyroseti-dlya-detey'): 'AI Start знакомит с использованием нейросетей для комиксов, видео, мини-игр и сайта-портфолио. В программу входят цифровая грамотность и безопасная работа с ИИ. Это проектная практика с инструментами, а не обещание заменить все школьные предметы.',
    ('rocket-tech-school', 'graficheskiy-dizayn'): 'Графический дизайн использует Figma: от иллюстраций и стикеров до макетов лендингов и интерфейсов приложений. В плане есть адаптивный дизайн и перенос проекта в Tilda. Эта программа сохраняется в разделе дизайна, без автоматической метки программирования.',
    ('rocket-tech-school', 'tsifrovoye-tvorchestvo'): 'Цифровое творчество объединяет иллюстрацию, анимацию, дизайн, видео и проекты с ИИ. Ученик пробует разные способы создания визуального контента и собирает собственные работы. Это творческое направление, отдельное от курса языка программирования.',
    ('foxford', '15376'): 'Видеокурс из24занятий учит работать с текстом, презентациями и таблицами. Блок кибербезопасности охватывает пароли, фишинг, цифровой этикет и защиту документов. Каждый раздел закрепляется небольшим проектом.',
    ('foxford', '14771'): 'Начальный видеокурс знакомит дошкольников и учеников1–2классов с мышью, клавиатурой и работой за компьютером. Дети рисуют и создают собственные цифровые проекты в игровом формате. В официальном каталоге указаны24занятия.',
    ('foxford', '16966'): 'Начальный Python для3–5классов объясняет основы языка через задачи виртуального города и ситуации из повседневной жизни. В официальном предложении указаны36занятий в мини-группе с общением с преподавателем и доступом к записям.',
    ('foxford', '17277'): 'Первая базовая ступень Python рассчитана на6–10классы и использует сюжет об ИТ-компании. Ученики создают простые программы, работают в команде и представляют результаты. Опубликованы36занятий в мини-группе.',
    ('foxford', '17278'): 'Вторая базовая ступень Python продолжает первую: дети отрабатывают изученные конструкции и применяют их в практических задачах и приложениях. Для6–10классов опубликованы32занятия в мини-группе с возможностью пересмотра записей.',
    ('foxford', '17276'): 'Scratch для2–4классов знакомит с логикой кода через игры и анимации. Вместо текстового синтаксиса используются визуальные блоки и небольшие проекты. В программе36занятий в мини-группе с преподавателем.',
    ('foxford', '17280'): 'Первая продвинутая ступень Python рассчитана на8–11классы. Ученики работают с данными и библиотеками, создают игры и приложения и собирают портфолио. В официальном предложении указаны32занятия в мини-группе.',
}


def norm(text):
    return re.sub(r'\s+', ' ', text).strip()


def receipt(cache, url):
    direct = cache.get(urldefrag(url)[0], {})
    return direct if direct.get('verified') else None


def snippet(text, pattern, radius=90):
    match = re.search(pattern, text, re.I)
    return norm(text[max(0, match.start() - radius):match.end() + radius]) if match else ''


def modules(source):
    lines = source['text'].splitlines()
    values = []
    for line in lines:
        if re.match(r'\s*Модуль\s+\d+\.', line, re.I):
            value = re.sub(r'^\s*Модуль\s+\d+\.\s*', '', line, flags=re.I).strip()
            if value and value not in values:
                values.append(value)
    return values[:8]


def age_from_hero(source):
    # Testimonials, other programs and footer links must not supply ages.
    text = source['text'][:1800]
    match = re.search(r'(?<!\d)([4-9]|1[0-7])\s*[-–—−]\s*([5-9]|1[0-8])\s*лет', text)
    if not match:
        return None, ''
    lo, hi = map(int, match.groups())
    if lo > hi:
        return None, ''
    return [lo, hi], match.group(0)


def course(brand, title, url, category, tags, source, fmt, *, grade='', module_list=None,
           evidence_url=None, description=None, age_enabled=True):
    age, age_evidence = age_from_hero(source) if age_enabled else (None, '')
    identity = hashlib.sha256(url.encode()).hexdigest()[:10]
    title_evidence = source.get('title', title)
    evidence = snippet(source['text'], r'онлайн|online|дистанц|в записи|видеоурок|виртуальн')
    if not evidence:
        raise ValueError(f'Missing online evidence for {url}')
    if description is None:
        description = (f'Программа «{title}» школы {brand[1]}. '
                       f'Перед записью сравните задания из программы с опытом ребёнка и уточните требования к компьютеру. '
                       f'Формат: {fmt.lower()}. Полная стоимость и условия доступа уточняются у школы; '
                       f'бесплатное знакомство с платформой не означает бесплатное прохождение всей программы.')
    return {
        'id': f'{brand[0]}-{identity}', 'title': title, 'brandId': brand[0], 'brand': brand[1],
        'category': category, 'tags': list(dict.fromkeys(
            ([category] if category in ['dizayn', '3d-modelirovanie', 'kompyuternaya-gramotnost', 'iskusstvennyy-intellekt']
             else ['programmirovanie', category]) + tags)),
        'ageRange': age, 'grade': grade, 'format': fmt, 'online': True,
        'price': None, 'offer': None, 'sourceUrl': url,
        'sourceTitle': title_evidence, 'sourceDiscoveryUrl': evidence_url or url,
        'checkedAt': DATE, 'editorialCheckedAt': DATE, 'active': True,
        'modules': module_list if module_list is not None else modules(source),
        'facts': ([['Возраст', age_evidence]] if age_evidence else []) +
                 ([['Классы', grade]] if grade else []),
        'summary': '', 'editorialDescription': description,
        'onlineEvidence': evidence, 'ageEvidence': age_evidence,
        'contentHash': source.get('contentHash') or hashlib.sha256(source['text'].encode()).hexdigest(),
        'verification': {'kind': 'official-public-source', 'transport': source.get('transport'),
                         'capturedAt': source.get('checkedAt', DATE)},
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache', type=pathlib.Path, default=CACHE)
    parser.add_argument('--output', type=pathlib.Path, default=OUTPUT)
    args = parser.parse_args()
    cache = json.loads(args.cache.read_text())
    current = json.loads((ROOT / 'data/courses/catalog.json').read_text())
    by_id = {brand[0]: brand for brand in BRANDS}
    courses, excluded = [], []

    def add(brand_id, title, url, category, tags, fmt, **kwargs):
        source = receipt(cache, url)
        # The visible official catalog itself is valid discovery/format evidence
        # when Foxford denies raw HTTP. Do not fabricate a 200 product receipt.
        if source is None and brand_id == 'foxford':
            source = receipt(cache, by_id['foxford'][2])
            if source and norm(title).casefold() not in norm(source['text']).casefold():
                source = None
            kwargs['evidence_url'] = by_id['foxford'][2]
        if source is None:
            excluded.append({'brandId': brand_id, 'url': url, 'reason': 'No successful official evidence capture'})
            return
        row = course(by_id[brand_id], title, url, category, tags, source, fmt, **kwargs)
        courses.append(row)

    for title, path, category, tags in SKILLBOX:
        add('skillbox-kids', title, 'https://kids.skillbox.ru/courses/' + path,
            category, tags, 'Онлайн-занятия с преподавателем и видеоматериалы')
    for title, path, category, tags in CODIM:
        url = path if path.startswith('https:') else 'https://codim.online/' + path
        add('codim-online', title, url, category, tags, 'Видеокурс онлайн с поддержкой', age_enabled=False)
    for title, path, category, tags in RTS:
        add('rocket-tech-school', title, 'https://www.rts.school/ru/' + path,
            category, tags, 'Индивидуальные или параллельные занятия онлайн', age_enabled=False)
    for title, path, category, tags, grade, fmt in FOX:
        add('foxford', title, 'https://foxford.ru/' + path, category, tags,
            fmt, grade=grade, age_enabled=False)

    kv = [
        ('Junior', 'rec855344604', ['ScratchJr', 'Scratch', 'Minecraft', 'Tinkercad', 'Kodu Game Lab', 'Stencyl', 'App Inventor', 'Roblox Studio'], ['scratch', 'minecraft', 'roblox']),
        ('Middle', 'rec855344612', ['Scratch', 'Minecraft', 'Stencyl', 'App Inventor', 'Roblox Studio', 'JavaScript', 'Blender', 'Unity 3D', 'HTML/CSS/JS', 'Python'], ['scratch', 'python', 'unity', 'web-razrabotka']),
        ('High', 'rec855344614', ['Scratch', 'App Inventor', 'Stencyl', 'Roblox Studio', 'JavaScript', 'Unity 3D', 'Blender', 'Unreal Engine', 'HTML/CSS/JS', 'Python', 'Java-Android'], ['python', 'unity', 'web-razrabotka', 'mobilnye-prilozheniya']),
    ]
    for label, section, module_list, tags in kv:
        add('kvantastica', 'Программирование: ' + label, 'https://kvantastica.ru/#' + section,
            'programmirovanie', tags, 'Занятия с преподавателем онлайн',
            module_list=module_list, age_enabled=False,
            description=f'Траектория {label} Квантастики объединяет несколько инструментов в одну программу. '
                        f'В опубликованном плане: {", ".join(module_list[:5])}. '
                        'Это ступени общего курса, а не отдельные оплачиваемые программы по каждому языку. '
                        'Возраст набора, начальный уровень и условия перехода между модулями следует уточнить перед записью.')

    add('mshp', 'Виртуальный класс: фундаментальная программа МШП', 'https://vc.informatics.ru/',
        'programmirovanie', ['python', 'web-razrabotka', 'iskusstvennyy-intellekt'],
        'Онлайн в виртуальном классе с преподавателем', grade='Набор в 3–10 класс',
        module_list=['Основы программирования', 'Прикладные технологии', 'Проектирование систем и сетей', 'Промышленное программирование'],
        age_enabled=False,
        description='Виртуальный класс МШП рассчитан на обучение в течение учебного года. '
                    'Ученики общаются с преподавателем и одноклассниками в реальном времени. '
                    'Содержание меняется по ступеням подготовки: от основ алгоритмов до проектов и технологий разработки. '
                    'На странице подтверждён набор на 2026/27 год; вступительное тестирование помогает выбрать подходящую группу. '
                    'Классы набора не переводились в предполагаемый возраст.')

    existing_sources = {(x['brandId'], x['sourceUrl'].rstrip('/')) for x in current}
    courses = [x for x in courses if (x['brandId'], x['sourceUrl'].rstrip('/')) not in existing_sources]
    brands = []
    for brand_id, name, source_url, aliases in BRANDS:
        source = receipt(cache, source_url)
        if source is None:
            excluded.append({'brandId': brand_id, 'url': source_url, 'reason': 'Brand source needs a successful capture'})
            continue
        evidence = snippet(source['text'], r'онлайн|online|дистанц|видеоурок|виртуальн')
        if not evidence:
            excluded.append({'brandId': brand_id, 'url': source_url, 'reason': 'No online-format evidence in brand source'})
            continue
        relevant = [x for x in current + courses if x['brandId'] == brand_id and x.get('active')]
        topics = sorted({tag for x in relevant for tag in [x['category']] + x.get('tags', []) if tag in TOPICS})
        fmt = ('Видеокурсы онлайн с поддержкой' if brand_id == 'codim-online' else
               'Индивидуальные или параллельные занятия онлайн' if brand_id == 'rocket-tech-school' else
               'Онлайн; формат зависит от программы')
        desc = f'{name}: проверенный онлайн-формат. Направления и условия смотрите в карточке конкретной программы.'
        row = {'id': brand_id, 'name': name, 'website': source_url, 'sourceUrl': source_url,
               'checkedAt': DATE, 'ageRange': None, 'format': fmt,
               'description': desc, 'aliases': aliases, 'topics': topics,
               'online': True, 'onlineEvidence': evidence,
               'verification': {'kind': 'official-public-source', 'transport': source.get('transport')}}
        if brand_id == 'rocket-tech-school':
            row.update(description='Rocket Tech School и ProgKids объединились. Реестр сохраняет оба названия для поиска; текущие программы учитываются один раз под RTS.',
                       relatedSourceUrls=['https://www.progkids.com/', 'https://www.rts.school/for-progkids'],
                       relationship='ProgKids joined Rocket Tech School; aliases do not create additional independent providers')
        if brand_id == 'mshp':
            row.update(description='МШП предлагает очное обучение, виртуальный класс и гибкий онлайн-формат. Здесь подтверждена действующая программа виртуального класса. На отдельной старой онлайн-странице остался набор 2025/26; её цена и сроки не перенесены.',
                       relatedSourceUrls=['https://vc.informatics.ru/', 'https://www.online.informatics.ru/'])
        if brand_id == 'foxford':
            row['description'] = 'Собственные курсы и мини-группы Фоксфорда с официальными ID программ. Общие страницы programming также предлагают занятия с Алгоритмикой: это партнёрское предложение не размножается как отдельный независимый провайдер.'
        if brand_id == 'sotka':
            row['description'] = 'Онлайн-школа со школьными курсами информатики. Карточки информатики не означают наличие отдельной полноценной IT-школы по каждому языку программирования.'
        brands.append(row)

    assert len({x['id'] for x in brands}) == len(brands)
    assert len({x['id'] for x in courses}) == len(courses)
    for row in courses:
        assert row['price'] is None and row['offer'] is None
        assert row['onlineEvidence'] and row['sourceUrl'].startswith('https://')
        assert not row['ageRange'] or row['ageEvidence']
        assert row['brandId'] in {b['id'] for b in brands}, row['brandId']
    output = {'checkedAt': DATE, 'scope': 'children-and-teenagers-online-programming',
              'brands': brands, 'courses': courses,
              'notes': ['Реестр не означает исчерпывающий список всех школ России.',
                        'Неподтверждённые цены, возрастные границы и филиалы не заполняются.',
                        'Программы уже существующих брендов не импортируются повторно по совпадающему sourceUrl.',
                        'Квантастика: модули не превращены в самостоятельные SKU.',
                        'ProgKids и RTS представлены одной связанной записью с поисковыми псевдонимами.'],
              'excluded': excluded}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n')
    print(f'{len(brands)} verified brands; {len(courses)} new course records; {len(excluded)} exclusions')


if __name__ == '__main__':
    main()
