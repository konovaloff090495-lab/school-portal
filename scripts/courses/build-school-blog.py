#!/usr/bin/env python3
"""Publish reviewed subject/class comparisons from first-party catalog evidence.

Deliberate editorial command, never part of the price cron. Does not touch the
catalog renderer, public/kursy, the Next bundle or unrelated blog articles.
"""
import html
import json
import re
from pathlib import Path
import school

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'data/courses'
BLOG = ROOT / 'content/blog'
HUB = 'luchshie-kursy-po-predmetam-i-klassam'
DATE = '2026-10-19'
E = lambda v: html.escape(str(v), quote=True)
P = lambda v: '<p>' + E(v) + '</p>'
A = lambda url, text: '<a href="' + E(url) + '">' + E(text) + '</a>'
STYLE = '<style data-school-course-guide>.post-layout main>div:has(>a[href="/shkoly/"]){display:none}@media(max-width:767px){.post-layout>main{min-width:0}.post-layout h1{overflow-wrap:anywhere}.post-body table{max-width:100%}}</style>'


def card(c):
    return '/kursy/kurs/' + c['id'] + '/'


def scope(c, grade, subject=None):
    grades = c.get('schoolSubjectGrades', {}).get(subject, c['grades'])
    if grades == [grade]:
        return f'Отдельная программа {grade} класса'
    return 'Для ' + ', '.join(map(str, grades)) + f' классов; {grade}-й входит в диапазон'


def course_detail(c, grade, subject):
    facts = dict(c.get('facts', []))
    body = '<h3>' + E(c['brand'] + ': ' + c['title']) + '</h3>'
    # Source-backed editorial descriptions are not sales promises. The article
    # then explains the consequences of level, scope and delivery separately.
    summary = c.get('editorialDescription') or c.get('summary', '')
    # A multi-grade product has the same generic synopsis in every grade. Its
    # verified scope is in the table; the reviewed brief explains this year's fit.
    if summary and c['grades'] == [grade]:
        body += P(summary)
    details = []
    for key in ['Объём программы', 'УМК / система']:
        if facts.get(key):
            details.append(key + ': ' + facts[key])
    if details:
        body += P('; '.join(details) + '.')
    # Range products may list the first grade's modules. Never present those as
    # this grade's syllabus. Exact-grade source topics are safe to attribute.
    if c['grades'] == [grade] and c.get('modules'):
        body += P('Школа выделяет в программе: ' + '; '.join(c['modules'][:5]) + '.')
    title = c['title'].lower()
    if c.get('packages'):
        lengths = sorted({p['lessons'] for p in c['packages']})
        body += P('Доступные объёмы одного пакета: ' + ', '.join(map(str, lengths)) + ' уроков. План ' + str(grade) + ' класса согласуйте отдельно.')
    elif c['brandId'] == 'sotka':
        body += P('У «Сотки» уточните состав предметной подписки и суммарную нагрузку по включённым дисциплинам.')
    elif re.search(r'аудиодиктант|5 сложных|всё о прилагательном|математика для \d+ класса\.', title):
        body += P('Тематический модуль: сопоставьте его с конкретным пробелом. Это не замена всему предметному году.')
    elif 'углублен' in title or 'углублён' in title or 'продвинут' in title:
        body += P('Углублённый уровень: перед выбором проверьте входные требования на самостоятельной задаче.')
    body += '<p>' + A(card(c), 'Программа и актуальные условия курса ' + c['brand']) + '.</p>'
    return body


def save(slug, title, excerpt, body, tags):
    target = BLOG / (slug + '.json')
    old = json.loads(target.read_text()) if target.exists() else {}
    plain = re.sub('<[^>]+>', ' ', body)
    post = dict(slug=slug, title=title, excerpt=excerpt, category='Курсы для детей',
                tags=tags, author='Редакция pro-schools.ru',
                authorRole='Редакция образовательного каталога',
                publishedAt=old.get('publishedAt', DATE),
                readTime=max(3, round(len(plain.split()) / 160)),
                imageAlt=title, content=body)
    target.write_text(json.dumps(post, ensure_ascii=False, indent=2) + '\n')


def main():
    guides = json.loads((DATA / 'school-blog-guides.json').read_text())
    courses = {c['id']: c for c in json.loads((DATA / 'catalog.json').read_text()) if c.get('active')}
    actual = {(s['school']['subject'], s['school']['grade']) for s in school.selections(list(courses.values())) if all(s['school'].values())}
    assert {(g['subjectId'], g['grade']) for g in guides} == actual
    assert len({g['slug'] for g in guides}) == len(guides)
    for g in guides:
        subject, grade = g['subjectId'], g['grade']
        s = school.SUBJECT_MAP[subject]
        assert g['catalogPath'] == school.path(subject, grade)
        picks = [courses[x] for x in g['courseIds']]
        assert picks and all(school.matches(c, subject, grade) for c in picks)
        found = [c for c in courses.values() if school.matches(c, subject, grade)]
        body = STYLE + P(g['lead'])
        body += '<p>' + A(g['catalogPath'], f'Курсы по {s["case"]} для {grade} класса в каталоге') + ' — все подтверждённые предложения этой выборки.</p>'
        brands = list(dict.fromkeys(c['brand'] for c in found))
        if len(found) == 1:
            body += P('Сейчас подтверждено одно предложение. Ниже — разбор его назначения и ограничений; сопоставления нескольких школ для этой пары пока нет.')
        body += P(f'В выборке {len(found)} ' + school.offer_word(len(found)) + ('. Все — у школы «' + brands[0] + '»: ниже сравниваем содержание и форматы её программ.' if len(brands) == 1 else '. Представлены школы: ' + ', '.join(brands) + '. Порядок в статье не означает места в рейтинге.'))
        for section in g['sections']:
            body += '<h2>' + E(section['title']) + '</h2>' + P(section['text'])
        body += '<h2>Какие программы рассмотреть</h2><table><thead><tr><th>Курс</th><th>Класс и объём</th><th>Формат</th></tr></thead><tbody>'
        for c in picks:
            facts = dict(c.get('facts', []))
            body += '<tr><td>' + A(card(c), c['brand'] + ' — ' + c['title']) + '</td><td>' + E(scope(c, grade, subject) + ('; ' + facts['Объём программы'] if facts.get('Объём программы') else '')) + '</td><td>' + E(c['format']) + '</td></tr>'
        body += '</tbody></table>'
        if len(picks) < len(found):
            body += '<p>В статье разобраны разные типы предложений. Остальные варианты — в ' + A(g['catalogPath'], 'полной подборке для этого предмета и класса') + '.</p>'
        for c in picks:
            body += course_detail(c, grade, subject)
        body += '<h2>' + E(g['decisionTitle']) + '</h2>' + P(g['decision'])
        body += '<p>Цены и дата проверки — в карточках. Уточните доступность, проверку работ и условия аттестации отдельно.</p>'
        body += '<section data-course-comparison-cta style="background:#fff2e9;border-radius:20px;padding:24px;margin:28px 0"><h2 style="margin-top:0">Выберите подходящую программу</h2><p>Сравните содержание, формат и условия занятий по ' + E(s['case']) + f' для {grade} класса.</p><a href="' + E(g['catalogPath']) + '" style="display:inline-block;background:#ff6b3d;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">Смотреть курсы →</a></section>'
        body += '<h2>Другие классы и подборки</h2><ul>'
        neighbors = sorted([x for x in guides if x['subjectId'] == subject and x['grade'] != grade], key=lambda x: abs(x['grade'] - grade))[:3]
        for n in sorted(neighbors, key=lambda x:x['grade']):
            body += '<li>' + A('/blog/' + n['slug'] + '/', n['title']) + '</li>'
        companions = {'matematika':['algebra','geometriya'], 'algebra':['geometriya'], 'geometriya':['algebra'], 'russkiy':['literatura'], 'literatura':['russkiy'], 'himiya':['biologiya'], 'biologiya':['himiya'], 'literaturnoe-chtenie':['obuchenie-gramote'], 'obuchenie-gramote':['literaturnoe-chtenie']}
        for sid in companions.get(subject, []):
            companion = next((x for x in guides if x['subjectId']==sid and x['grade']==grade), None)
            if companion:
                body += '<li>' + A('/blog/' + companion['slug'] + '/', companion['title']) + '</li>'
        body += '<li>' + A(school.path(grade=grade), f'Все предметные курсы для {grade} класса') + '</li>'
        body += '<li>' + A('/blog/' + HUB + '/', 'Все обзоры курсов по предметам и классам') + '</li></ul>'
        body += '<p>Проверено 19 октября 2026 года. Источники — в карточках. Выбор по учебной задаче; результатов учеников редакция не тестировала.</p>'
        excerpt = g['excerpt']
        save(g['slug'], g['title'], excerpt, body, [s['label'], f'{grade} класс', 'Школьная программа', 'Курсы для детей'])
    body = STYLE + P('Предметный курс помогает разобрать школьную программу, повторить пропущенный материал или выбрать более сложный уровень. Здесь собраны обзоры по конкретным классам: внутри каждого — программы школ, различия форматов и ссылки на карточки с актуальными условиями.')
    body += '<p>' + A(school.path(), 'Открыть каталог школьных курсов с фильтрами') + '.</p>'
    body += P('Начните с предмета и класса ребёнка. В математике после 6 класса можно отдельно посмотреть алгебру и геометрию. Для русского языка, английского и естественных наук сверяйте темы и учебник: одинаковый номер класса не гарантирует одинаковый порядок материала. Статьи посвящены обычным занятиям по школьной программе; экзаменационные курсы вынесены в другие обзоры.')
    for s in school.SUBJECTS:
        group = [g for g in guides if g['subjectId'] == s['id']]
        body += '<h2>' + E(s['label']) + '</h2>' + P(s['guide']) + '<ul>'
        for g in group:
            body += '<li>' + A('/blog/' + g['slug'] + '/', g['title']) + ' · ' + A(g['catalogPath'], 'подборка курсов') + '</li>'
        body += '</ul>'
    body += '<h2>Как перейти от обзора к выбору</h2>' + P('В статье сначала определите задачу: весь год, отдельная тема, базовый или углублённый уровень. Затем откройте две подходящие карточки и сопоставьте объём занятий, формат обратной связи и полную стоимость. Пакет уроков на несколько классов требует индивидуального плана, а короткий тематический модуль не заменяет годовой предметный курс.')
    body += P('Количество подтверждённых предложений различается: иногда доступны программы нескольких школ, иногда несколько курсов одного автора, а для отдельных классов пока найден только один вариант. Это указано в самих обзорах. Новые предложения появляются в каталоге после проверки предмета, класса и цели обучения на странице школы.')
    body += '<p>' + A('/blog/luchshie-kursy-dlya-detej/', 'Другие направления детских курсов') + '.</p>'
    save(HUB, 'Лучшие курсы по школьным предметам и классам: все обзоры', 'Обзоры курсов для 1–11 классов: математика, алгебра, химия, русский и другие предметы. Ссылки на подборки и карточки программ школ.', body, ['Школьная программа', 'Курсы для детей', '1–11 классы'])
    # One clear entry from the existing course guide hub, preserved outside it.
    hubpath = BLOG / 'luchshie-kursy-dlya-detej.json'
    hub = json.loads(hubpath.read_text())
    block = '<section data-school-class-guides><h2>Курсы по предметам и классам</h2><p>' + A('/blog/' + HUB + '/', 'Обзоры школьных курсов для 1–11 классов') + ': алгебра, химия, русский язык и другие предметы со ссылками на программы школ.</p></section>'
    hub['content'] = re.sub(r'<section data-school-class-guides>.*?</section>', '', hub['content'], flags=re.S) + block
    hubpath.write_text(json.dumps(hub, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'guides':len(guides), 'newHub':HUB, 'updatedHub':hub['slug']}, ensure_ascii=False))


if __name__ == '__main__':
    main()
