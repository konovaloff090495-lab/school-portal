"""School-programme facets backed by explicit first-party subject/class evidence."""
import html,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SUBJECTS=json.loads((ROOT/'data/courses/school-subjects.json').read_text())
SUBJECT_MAP={s['id']:s for s in SUBJECTS}
PREFIX='shkolnaya-programma'
esc=lambda v:html.escape(str(v),quote=True)
def offer_word(n):return 'предложение' if n%10==1 and n%100!=11 else 'предложения' if n%10 in [2,3,4] and n%100 not in [12,13,14] else 'предложений'

def path(subject=None,grade=None):
    return '/kursy/'+PREFIX+'/'+(subject+'/' if subject else '')+(str(grade)+'-klass/' if grade else '')

def matches(course,subject=None,grade=None):
    if course.get('learningGoal')!='school' or set(course['tags'])&{'ege','oge'}:return False
    offered=course.get('schoolSubjects',[])
    if subject=='matematika':
        if not set(offered)&{'matematika','algebra','geometriya'}:return False
    elif subject and subject not in offered:return False
    supported=course.get('schoolSubjectGrades',{}).get(subject,course.get('grades',[]))
    return not grade or grade in supported

def selections(courses):
    result=[]
    def add(subject=None,grade=None):
        items=[c for c in courses if matches(c,subject,grade)]
        if not items:return
        s=SUBJECT_MAP.get(subject)
        label=(s['label'] if s else 'Школьная программа')+(f' — {grade} класс' if grade else '')
        title=(f'Курсы по {s["case"]}' if s else 'Курсы по школьной программе')+(f' для {grade} класса' if grade else ' для школьников')
        exact=sum(c.get('grades')==[grade] for c in items) if grade else 0
        intro=(f'Занятия по {s["case"]}' if s else 'Предметные занятия по школьной программе')+(f' для {grade} класса' if grade else '')+'. Здесь собраны обычные школьные курсы, тематические модули и пакеты уроков. Подготовка к ЕГЭ и ОГЭ вынесена в отдельные разделы.'
        if len(items)==1:intro+=' Сейчас в этой выборке одно подтверждённое предложение.'
        # A class page needs a real class-specific offer and a choice to compare.
        allow=len(items)>=2 and (not grade or exact>0)
        result.append({'id':path(subject,grade).removeprefix('/kursy/').rstrip('/'),'label':label,'title':title,'intro':intro,'guide':s['guide'] if s else 'Выберите школьный предмет и класс. Видеокурс удобен для последовательного повторения, индивидуальные уроки — для собственных вопросов и разбора ошибок. Проверьте УМК, объём занятий, способ проверки работ и срок доступа. Пакет одного предмета и подписка на несколько направлений имеют разный состав.','school':{'subject':subject,'grade':grade},'allowIndex':allow,'articleCategories':[s['baseCategory']] if s else [],'exactClassOffers':exact})
    add()
    for n in range(1,12):add(grade=n)
    for s in SUBJECTS:
        add(subject=s['id'])
        for n in range(1,12):add(s['id'],n)
    return result

def navigation(courses,context=None):
    context=context or {};subject=context.get('subject');grade=context.get('grade')
    out='<section class="seo-section"><h2>Школьная программа: предметы и классы</h2><p>Выборки с обычными предметными занятиями. Курс появляется в классе только при подтверждённом соответствии на странице школы.</p><div class="direction-grid">'
    for s in SUBJECTS:
        arr=[c for c in courses if matches(c,s['id'],grade)]
        if arr:out+=f'<a href="{path(s["id"],grade)}">{esc(s["label"])}<small>{len(arr)}</small></a>'
    out+='</div><div class="hero-points"><a class="pill" href="'+path(subject)+'">Все классы</a>'
    for n in range(1,12):
        if any(matches(c,subject,n) for c in courses):out+=f'<a class="pill" href="{path(subject,n)}">{n} класс</a>'
    return out+'</div></section>'

def content(courses,context):
    subject=context.get('subject');grade=context.get('grade')
    selected=[c for c in courses if matches(c,subject,grade)]
    out='<section class="seo-section"><h2>Что есть в этой подборке</h2>'
    if grade:
        exact=[c for c in selected if c.get('grades')==[grade]]
        ranges=[c for c in selected if len(c.get('grades',[]))>1]
        out+=f'<p>Для {grade} класса найдено {len(selected)} {offer_word(len(selected))}. Из них {len(exact)} относятся именно к этому классу'
        if ranges:out+=f', ещё {len(ranges)} рассчитаны на несколько классов, включая {grade}-й'
        out+='.'
        if ranges:out+=' У курса с диапазоном классов уточните индивидуальный план: весь объём такого пакета не обязательно посвящён одному учебному году.'
        out+='</p>'
    formats={c['format'] for c in selected}
    out+='<p>Доступные форматы: '+esc('; '.join(sorted(formats)))+'. Записанные уроки и индивидуальные встречи дают разный объём личной обратной связи. Сравните, кто проверяет работу, как задать вопрос и сколько времени нужно на самостоятельную практику.</p>'
    # Actual curricula distinguish classes and textbook systems; never fabricate a
    # universal syllabus for a grade by borrowing an exam course's curriculum.
    examples=[c for c in selected if c.get('modules')]
    if examples:
        out+='<h3>Темы, указанные в программах школ</h3><ul>'
        for c in examples[:6]:
            out+=f'<li><a href="/kursy/kurs/{c["id"]}/">{esc(c["brand"]+": "+c["title"])}</a>: '+esc('; '.join(c['modules'][:4]))+'.</li>'
        out+='</ul><p>Это темы конкретных предложений, а не единый обязательный план для всех школ. Порядок материала может различаться по УМК и уровню.</p>'
    return out+'</section>'
