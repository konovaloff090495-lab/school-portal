#!/usr/bin/env python3
"""Render manually authored course comparisons. Run deliberately, never in price cron.

Editorial prose and course choices live in data/courses/blog-guides.json. Financial
figures stay on live course cards so articles do not duplicate expiring offers.
"""
import html
import json
import re
import school
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'data/courses'
BLOG = ROOT / 'content/blog'
TODAY = date.today().isoformat()
esc = lambda value: html.escape(str(value), quote=True)
link = lambda path, label: f'<a href="{esc(path)}">{esc(label)}</a>'
para = lambda text: '<p>' + esc(text) + '</p>'
# These articles use long Russian titles and comparison tables. Keep the existing
# blog grid within the phone viewport without rebuilding the large Next bundle.
RESPONSIVE = '<style data-course-guide>@media(max-width:767px){.post-layout>main{min-width:0}.post-layout h1{overflow-wrap:anywhere}.post-body table{max-width:100%}}</style>'

# Preserve useful project tutorials at their existing URLs when adding comparisons.
KEEP = {
    'python': ['Три первых проекта', 'Пример задания на понимание', 'Что делать после базового курса'],
    'scratch': ['Первый проект: игра «поймай предмет»', 'Частые ошибки в первом проекте', 'Идеи следующих проектов'],
    'roblox': ['Первый проект: полоса препятствий', 'Как отличить прогресс от копирования шаблона'],
    'minecraft': ['Пример первого задания', 'Как проверить результат', 'Блоки или текстовый код'],
    'unity': ['Пример маршрута на три месяца', 'Когда переходить к игровому движку'],
    'web-razrabotka': ['Первый проект: страница школьного клуба', 'Частые ошибки в начале', 'Когда изучать JavaScript'],
}


def main():
    guides = json.loads((DATA / 'blog-guides.json').read_text())
    categories = {c['id']: c for c in json.loads((DATA / 'categories.json').read_text())}
    courses = [c for c in json.loads((DATA / 'catalog.json').read_text()) if c.get('active')]
    by_cat = {g['categoryId']: g for g in guides}
    assert set(by_cat) == set(categories), 'Every course type must have one article'
    assert len({g['slug'] for g in guides}) == len(guides)
    report = []
    for g in guides:
        cat = g['categoryId']
        target = BLOG / (g['slug'] + '.json')
        old = json.loads(target.read_text()) if target.exists() else {}
        picks = []
        for choice in g['courses']:
            matches = [c for c in courses if c['id'].startswith(choice['match'])]
            assert len(matches) == 1, (cat, choice['match'], len(matches))
            c = matches[0]
            assert cat in c['tags'], (cat, c['id'])
            choice['courseId'] = c['id']
            picks.append((c, choice['comment']))

        body = RESPONSIVE + para(g['lead'])
        if cat in school.SUBJECT_MAP:
            body+='<p>Для обычной школьной программы, без экзаменационной подготовки: '+link(school.path(cat),'курсы по '+school.SUBJECT_MAP[cat]['case']+' с выбором класса')+'. В этой выборке собраны предметные программы и пакеты уроков.</p>'
        body += '<p><strong>Подборка обновлена 19 октября 2026 года.</strong> Выбирайте программу по задаче ребёнка: порядок ниже не означает места в рейтинге результатов.</p>'
        body += '<p>' + link('/kursy/' + cat + '/', 'Открыть все курсы: ' + categories[cat]['label']) + ' — сравнить программы и условия в каталоге.</p>'
        body += '<h2 id="sravnenie">Какие программы сравнить</h2>'
        # Three short columns also remain legible within the existing mobile blog.
        body += '<table><thead><tr><th>Программа</th><th>Возраст или класс</th><th>Формат</th></tr></thead><tbody>'
        for c, comment in picks:
            age = (f"{c['ageRange'][0]}–{c['ageRange'][1]} лет" if c.get('ageRange') else c.get('grade') or 'Уточнить у школы')
            body += '<tr><td>' + link('/kursy/kurs/' + c['id'] + '/', c['brand'] + ': ' + c['title']) + '</td><td>' + esc(age) + '</td><td>' + esc(c['format']) + '</td></tr>'
        body += '</tbody></table>'
        for section in g['sections']:
            body += '<h2>' + esc(section['title']) + '</h2>' + para(section['text'])
        body += '<h2>Программы подробнее: кому какой вариант рассмотреть</h2>'
        for c, comment in picks:
            body += '<h3>' + esc(c['brand'] + ' — ' + c['title']) + '</h3>' + para(comment)
            # Summarise only source-backed curriculum labels, never inferred benefits.
            topics = [re.sub(r'[.;,]+$', '', x.strip()) for x in c.get('modules', []) if 5 <= len(x.strip()) <= 130][:3]
            if topics:
                body += para('В описании программы выделены темы: ' + '; '.join(topics) + '.')
            body += '<p>' + link('/kursy/kurs/' + c['id'] + '/', 'Посмотреть программу, цену и условия ' + c['brand']) + '.</p>'

        for heading in KEEP.get(cat, []):
            for section in re.findall(r'(<h2[^>]*>.*?</h2>.*?)(?=<h2|\Z)', old.get('content', ''), re.S):
                if re.match(r'<h2[^>]*>' + re.escape(heading) + r'</h2>', section):
                    assert "'+a(" not in section and "'+ a(" not in section, heading
                    body += section

        body += '<h2>Как сравнить стоимость и условия</h2>'
        body += para('Откройте карточки двух подходящих программ и сравните одинаковую единицу: урок, месяц или полный курс. Месячный платёж по рассрочке не равен стоимости обучения. Проверьте число занятий, длительность, проверку работ, срок доступа, правила пропусков и возврата. Цены и акции собраны в карточках с датой проверки, поэтому здесь они не дублируются.')
        if any(c['brandId'] == 'sotka' for c, _ in picks):
            body += para('У «Сотки» опубликованная цена может относиться к пакету из четырёх предметов. Сопоставляйте состав пакета и общую нагрузку, а не считайте такую сумму ценой одного предмета.')
        body += '<p>' + link('/kursy/' + cat + '/', 'Сравнить актуальные предложения по направлению «' + categories[cat]['label'] + '»') + '.</p>'
        body += '<h2>' + esc(g['question']) + '</h2>' + para(g['answer'])
        if cat in {'ege', 'oge', 'matematika', 'russkiy', 'fizika', 'himiya', 'biologiya', 'informatika', 'istoriya', 'obshchestvoznanie', 'literatura', 'geografiya', 'angliyskiy'}:
            body += '<p>Для экзаменационной цели сверяйте программу с официальными материалами ФИПИ: <a href="https://fipi.ru/ege/demoversii-specifikacii-kodifikatory" target="_blank" rel="noopener noreferrer">ЕГЭ</a> и <a href="https://fipi.ru/oge/demoversii-specifikacii-kodifikatory" target="_blank" rel="noopener noreferrer">ОГЭ</a>.</p>'
        body += '<h2>Смежные подборки</h2><ul>'
        for other in g['related']:
            body += '<li>' + link('/blog/' + by_cat[other]['slug'] + '/', by_cat[other]['title']) + '</li>'
        body += '<li>' + link('/blog/luchshie-kursy-dlya-detej/', 'Все подборки курсов для детей по направлениям') + '</li></ul>'
        body += '<p>Сведения о программах взяты из карточек каталога, где указаны страница школы и дата проверки. Перед оплатой подтвердите доступный поток, состав программы и условия выбранного тарифа.</p>'
        text = html.unescape(re.sub('<[^>]+>', ' ', body))
        post = {
            'slug': g['slug'], 'title': g['title'],
            'excerpt': g['lead'].split('. ')[0] + '. ' + 'Сравнение программ, возрастов и форматов со ссылками на карточки курсов.',
            'category': 'Курсы для детей',
            'tags': [categories[cat]['label'], 'курсы для детей', 'выбор курса'],
            'author': 'Редакция pro-schools.ru', 'authorRole': 'Редакция образовательного каталога',
            'publishedAt': old.get('publishedAt', TODAY),
            'readTime': max(3, round(len(text.split()) / 170)),
            'imageAlt': 'Подборка программ: ' + categories[cat]['label'],
            'content': body,
        }
        if old.get('imageUrl'):
            post['imageUrl'] = old['imageUrl']
            post['imageAlt'] = old.get('imageAlt', post['imageAlt'])
        target.write_text(json.dumps(post, ensure_ascii=False, indent=2) + '\n')
        report.append({'category': cat, 'slug': g['slug'], 'new': not bool(old), 'words': len(text.split()), 'courses': [c['id'] for c, _ in picks]})

    hub = f'<p>Найдите курсы под интерес и возраст ребёнка: от первых занятий чтением и логикой до программирования, творческих проектов и экзаменов. Здесь собраны отдельные подборки по всем {len(guides)} направлениям каталога. В каждой — конкретные программы, различия форматов и ссылки на внутренние карточки с ценами и условиями.</p>'
    hub += '<p>Начните с задачи, которую хотите решить. Для нового увлечения сравните небольшие первые проекты, для школьного предмета — диагностику пробелов, для экзамена — программу и проверку работ. После знакомства с подборкой откройте карточки двух подходящих курсов и сопоставьте условия. </p>'
    # Explicit grouping avoids depending on taxonomy file order.
    groups = [
        ('Программирование и цифровые технологии', ['kompyuternaya-gramotnost','mobilnye-prilozheniya','programmirovanie','python','scratch','roblox','minecraft','unity','web-razrabotka','iskusstvennyy-intellekt','robototehnika','kiberbezopasnost']),
        ('Языки, школьные предметы и экзамены', ['shkolnye-predmety','ege','oge','angliyskiy','matematika','russkiy','fizika','himiya','biologiya','informatika','istoriya','obshchestvoznanie','literatura','geografiya']),
        ('Творчество и цифровые проекты', ['dizayn','3d-modelirovanie','risovanie','videomontazh','muzyka']),
        ('Развитие и подготовка к школе', ['shahmaty','podgotovka-k-shkole','logika','chtenie','logoped','soft-skills','finansovaya-gramotnost']),
    ]
    grouped={cat for _,ids in groups for cat in ids}
    groups.append(('Новые направления: безопасность, языки и навыки', [cat for cat in by_cat if cat not in grouped]))
    for heading, ids in groups:
        hub += '<h2>' + heading + '</h2><ul>'
        for cat in ids:
            g = by_cat[cat]
            hub += '<li><strong>' + link('/blog/' + g['slug'] + '/', g['title']) + '</strong> — ' + esc(g['lead'].split('. ')[0]) + '.</li>'
        hub += '</ul>'
    hub += '<h2>Как найти выгодное предложение</h2><p>Сравнивайте полную стоимость, число занятий и формат обратной связи. Бесплатное знакомство помогает проверить преподавателя, но не означает бесплатного основного курса. У скидки могут быть ограничения по пакету и сроку. Актуальные предложения и даты проверки смотрите в ' + link('/kursy/', 'каталоге курсов для детей') + '.</p>'
    hub += '<p>Для текущей учёбы откройте '+link(school.path(),'курсы по школьной программе с выбором предмета и класса')+'. Алгебра, геометрия, химия и другие предметы собраны отдельно от подготовки к ЕГЭ и ОГЭ.</p>'
    hub += '<h2>Что сделать после выбора направления</h2><ol><li>Прочитайте профильную подборку и определите подходящий уровень.</li><li>Откройте внутренние карточки выбранных программ: сравните возраст, темы, формат и условия.</li><li>На карточке перейдите на страницу школы, чтобы уточнить поток и записаться.</li></ol>'
    hub_new = not (BLOG / 'luchshie-kursy-dlya-detej.json').exists()
    hub_post = dict(slug='luchshie-kursy-dlya-detej', title=f'Лучшие курсы для детей: подборки по {len(guides)} направлениям', excerpt='Программирование, английский, школьные предметы, творчество и развитие: все подборки курсов для детей со сравнением программ и ссылками на карточки.', category='Курсы для детей', tags=['курсы для детей','выбор курса','онлайн-курсы'], author='Редакция pro-schools.ru', authorRole='Редакция образовательного каталога', publishedAt=TODAY, readTime=8, imageAlt='Направления обучения и подборки курсов для детей', content=RESPONSIVE + hub)
    (BLOG / 'luchshie-kursy-dlya-detej.json').write_text(json.dumps(hub_post, ensure_ascii=False, indent=2) + '\n')
    (DATA / 'blog-guides.json').write_text(json.dumps(guides, ensure_ascii=False, indent=2) + '\n')
    out = ROOT / 'work/courses/blog-report.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'guides': len(report), 'new': sum(p['new'] for p in report) + int(hub_new), 'updated': sum(not p['new'] for p in report), 'hub': hub_post['slug'], 'minWords': min(p['words'] for p in report), 'maxWords': max(p['words'] for p in report)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
