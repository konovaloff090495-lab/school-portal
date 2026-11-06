#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Оригинальные тексты и бланки. Запуск не меняет исходные статьи и прод."""
import hashlib
import html
import json
import re
from pathlib import Path
from grade_data import GRADES
from teacher_data import TEACHER
from family_data import FAMILY
from practice_data import PRACTICES
try:
    from method_data import METHODS
except ImportError:
    METHODS={}

ROOT=Path(__file__).resolve().parent
PROJECT=ROOT.parents[1]
RESEARCH=PROJECT/'research/proforientaciya-2026-11-06'
BRIEFS=json.loads((ROOT/'plan.json').read_text())
TEST='/proforientaciya/karta-interesov/'
HUB='/proforientaciya/'
E=html.escape
SOURCES={
 'bvb':('Билет в будущее: официальный конструктор','https://kb.bvbinfo.ru/'),
 'pryazhnikov':('Н. С. Пряжников. Активные методы профессионального самоопределения — библиотека МГППУ','https://psychlib.ru/mgppu/PAm/PAM-001.HTM'),
 'prof':('Профориентатор: официальный оператор','https://proforientator.ru/'),
 'nav':('Навигатум: материалы родителям','https://navigatum.ru/roditelyam/'),
 'nav-video':('Навигатум: мультсериал «В мире профессий»','https://navigatum.ru/vmp/'),
 'mif':('МИФ: «Играем в профессии», Лизбет Слегерс','https://www.mann-ivanov-ferber.ru/catalog/product/igraem-v-professii/'),
 'mif-road':('МИФ: материал о книге «Дорожная карта»','https://deti.mann-ivanov-ferber.ru/2018/09/03/proforientaciya-kak-pomoch-rebenku-s-vyborom-professii/'),
 'onet':('O*NET Interest Profiler: официальный инструмент','https://www.onetcenter.org/IP.html'),
 'onet-license':('O*NET: лицензирование инструментов','https://www.onetcenter.org/license_tools.html'),
 'rezapkina':('Портал наследия Г. В. Резапкиной: книги и методики','https://rezapkina.ru/knigi-metodiki-stati/'),
 'gia':('РЦОИ Московской области: проект «ГИА. Осознанность. Профориентация»','https://rcoi50.ru/1699-initsiativnyj-proekt-podmoskovya-gia-osoznannost-proforientatsiya.html'),
 'klimov':('ДДО и современные инструменты: Вестник Московского университета. Психология','https://msupsyj.ru/articles/article/4291/'),
 'golomshtok':('АлтГПУ: материал по карте интересов А. Е. Голомштока','https://biysk.altspu.ru/images/pedkl/doc/METOD_A_E_Golomshtok.pdf'),
 'jovayshi':('Национальная академия образования: методические материалы','https://uba.edu.kz/storage/app/media/999%20AAA%20RS%20RS.pdf'),
 'schein':('Wiley: Career Anchors Reimagined','https://www.wiley.com/en-au/career-anchors-reimagined-finding-direction-and-opportunity-in-the-changing-world-of-work-5th-edition-p-9781119899495'),
 'potemkina':('Донецкий государственный университет: научный сборник, упоминание методики О. Ф. Потёмкиной','https://science.donnu.ru/wp-content/uploads/2023/10/dch-2023-tom-9-filosofskie-i-psihologicheskie-nauki.pdf'),
 'ovcharov':('Астраханский государственный университет: учебные материалы с методикой Р. В. Овчаровой','https://asu-edu.ru/api/server/ajax/opop/?file=2024_37.03.01_26723_rpd_29067.pdf')}

def p(text):return '<p>'+E(text)+'</p>'
def listing(items):return '<ol>'+''.join('<li>'+E(x)+'</li>' for x in items)+'</ol>'
def table(cols,rows):return '<div class="career-table-wrap"><table><thead><tr>'+''.join('<th scope="col">'+E(x)+'</th>' for x in cols)+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+E(x)+'</td>' for x in row)+'</tr>' for row in rows)+'</tbody></table></div>'
def sec(id,heading,body):return {'id':id,'heading':heading,'html':body}

def worksheet(slug,title,task,cols,rows,fields,steps):
    out=ROOT/'worksheets';out.mkdir(exist_ok=True)
    inputs=''.join('<label>'+E(f.strip())+'<div contenteditable="true" role="textbox" aria-label="'+E(f.strip())+'"></div></label>' for f in fields.split(';') if f.strip())
    document='<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>'+E(title)+' — бланк ProSchools</title><style>body{font:17px/1.55 Georgia,serif;color:#172628;max-width:900px;margin:32px auto;padding:0 20px}h1{font-size:30px;line-height:1.2}table{width:100%;border-collapse:collapse}th,td{border:1px solid #aaa;padding:9px;text-align:left;vertical-align:top}label{display:block;margin:20px 0;font-weight:bold}[contenteditable]{min-height:55px;border:1px solid #999;padding:10px;margin-top:5px;font-weight:normal}button{padding:10px 18px;font:inherit;border:1px solid #172628;background:#e1f4ed;cursor:pointer}.note{font-size:14px;color:#456}@media print{button,.back{display:none}body{margin:0;font-size:11pt}h1{font-size:20pt}label,li,tr{break-inside:avoid}[contenteditable]{min-height:38px}}</style><body><a class="back" href="/proforientaciya/">ProSchools · Профориентация</a><h1>'+E(title)+'</h1>'+p(task)+p('Оригинальный учебный бланк ProSchools. Это не диагностическая методика. Поля редактируются прямо на странице; данные никуда не отправляются. Для сохранения выберите печать в PDF в своём браузере. После закрытия несохранённые записи могут потеряться.')+'<button id="print" type="button">Распечатать или сохранить в PDF</button><h2>Как выполнить</h2>'+listing(steps)+'<h2>Пример и ориентиры</h2>'+table(cols,rows)+'<h2>Мои записи</h2>'+inputs+'<p class="note">Не указывайте фамилию, телефон и сведения о здоровье. Результат учебного задания не определяет профессиональную пригодность. Материал ProSchools, 6 ноября 2026.</p><script src="/career-assets/worksheets/print.js" defer></script></body></html>'
    (out/(slug+'.html')).write_text(document)
    return '/career-assets/worksheets/'+slug+'.html'

def shared_worksheet_section(url,kind,fields):
    if kind=='teacher':
        text='Сначала откройте бланк и адаптируйте формулировки под класс. Перед раздачей проверьте понятность инструкции на одном примере. Попросите записывать конкретные действия и наблюдения, не фамилии и не оценки личности. После занятия сохраните только то, что необходимо для учебной задачи.'
    else:
        text='Заполняйте бланк после собственного действия, а не по впечатлению от названия профессии. Достаточно коротких записей с конкретным примером. Сравните ожидание и опыт, затем выберите одно продолжение. Бланк можно оставить себе: для учебных записей не нужно отправлять заявку или сообщать личные данные.'
    return p(text)+'<p><a href="'+E(url)+'" target="_blank" rel="noopener">Открыть бланк для заполнения и печати</a> · <a href="'+E(url)+'" download>Скачать HTML-бланк</a></p>'+p('Поля бланка: '+fields)

def make_grade(n):
    d=GRADES[n];slug=f'{n}-klass';fields=d['prompt']
    worksheet_url=worksheet(slug,d['name'],d['goal'],['Этап','Действие','Наблюдение'],d['rows'],fields,d['steps'])
    timeline=[[time,step] for time,step in zip(['0–5 минут','5–13 минут','13–28 минут','28–40 минут','40–45 минут'],d['steps'])]
    sections=[sec('age-task',f'Задача профориентации в {n} классе',p(d['goal'])+p('Учитель может использовать сценарий с классом, а семья — выбрать одно действие для спокойной домашней пробы. Ни обсуждение, ни рабочий лист не требуют от ребёнка обещания выбрать профессию.')),
      sec('lesson',f'Занятие «{d["name"]}»: 45 минут',p('Материалы: '+d['materials'])+table(['Время','Ход работы'],timeline)),
      sec('practice','Что записать после практической части',table(['Часть','Конкретное действие','Вопрос для проверки'],d['rows'])+p(d['result'])),
      sec('family','Как продолжить дома',p(d['home'])),
      sec('worksheet','Бланк участника и печать',shared_worksheet_section(worksheet_url,'teacher',fields))]
    return dict(title=f'Профориентация в {n} классе: {d["name"].lower()}',lead=d['goal'],sections=sections,
      faq=[{'question':'Нужно ли после занятия выбирать профессию?','answer':'Нет. Результат — опыт конкретных действий, вопросы и небольшой следующий шаг. Образовательный маршрут требует отдельной проверки условий.'},
           {'question':'Что делать, если ребёнок не хочет отвечать перед классом?','answer':'Предложить письменную, графическую или индивидуальную форму обсуждения. Учебное задание не требует публичного раскрытия личных результатов.'}],
      sources=['bvb','pryazhnikov'],kind='class-material',audience='Педагог, школьник и родитель',worksheet_url=worksheet_url)

def make_teacher(key):
    d=TEACHER[key];fields='Цель и возраст; действие участника; материалы и условия; результат; что заметили; следующий шаг'
    worksheet_url=worksheet('pedagogam-'+key,d['artifact'],d['task'],d['cols'],d['rows'],fields,d['steps'])
    return dict(title=d['title'],lead=d['lead'],kind='teacher-material',audience='Педагоги и организаторы школьной работы',worksheet_url=worksheet_url,
      sections=[sec('reader-task',d['task'],p(d['lead'])+p('Материал можно адаптировать к своей группе. Перед использованием уточните возраст, доступные ресурсы и требования школы. Ниже — самостоятельный редакционный пример, а не обязательная форма отчётности и не утверждённая программа.')),
        sec('implementation','Порядок работы: '+d['artifact'].lower(),listing(d['steps'])),
        sec('example-table','Пример заполнения и критерии',table(d['cols'],d['rows'])+p(d['example'])),
        sec('limits','Что важно учесть',p(d['boundary'])),
        sec('worksheet','Открыть редактируемый материал',shared_worksheet_section(worksheet_url,'teacher',fields))],
      faq=[{'question':'Можно ли использовать материал на занятии без заявки?','answer':'Да. Оригинальный бланк доступен для заполнения, скачивания и печати. Персональные сведения для доступа не требуются.'},
           {'question':'Это официальный комплект курса «Россия — мои горизонты»?','answer':'Нет. Это авторский учебный материал ProSchools. Официальный курс, действующие темы и документы проверяют в конструкторе «Билета в будущее».'}],sources=['bvb','pryazhnikov'])

def make_family(key):
    d=FAMILY[key];fields=d['worksheet'];worksheet_url=worksheet(key,d['title']+': рабочий лист',d['task'],d['cols'],d['rows'],fields,d['steps'])
    sources=['bvb','pryazhnikov']
    if key in ['geo','consultation','courses','reviews']:sources=['prof','bvb','nav']
    if key=='book':sources=['mif','mif-road']
    if key=='video':sources=['nav-video','nav']
    if key=='methods':sources=['klimov','onet','rezapkina']
    if key=='public-programs':sources=['bvb','gia']
    if key in ['test-middle','test-high','results','unscientific','ai']:sources=['onet','pryazhnikov']
    return dict(title=d['title'],lead=d['lead'],kind='family-guide',audience='Школьники и родители',worksheet_url=worksheet_url,
      sections=[sec('action',d['heading'],p(d['lead'])+listing(d['steps'])),
        sec('compare','Сравнение действий и условий',table(d['cols'],d['rows'])),
        sec('worked-example','Разберём на учебном примере',p(d['example'])),
        sec('try-today','Небольшое действие, которое можно начать сегодня',p(PRACTICES[key])),
        sec('limits','Границы вывода и важные условия',p(d['boundary'])),
        sec('worksheet','Личный план: заполнить и сохранить',shared_worksheet_section(worksheet_url,'family',fields))],
      faq=[{'question':'Какой результат считать полезным?','answer':d['task']+'. Достаточно конкретного наблюдения и выполнимого следующего шага; не нужно немедленно выбирать дело на всю жизнь.'},
           {'question':'Заявка обязательна для чтения и рабочего листа?','answer':'Нет. Материал и бланк доступны без контактов. Условия сохранения расширенной карты интересов показаны отдельно до начала опроса.'}],sources=sources)

def make_method(key):
    d=METHODS[key]
    fields='Точный инструмент и версия; что измеряет; мой реальный пример; что пока не пробовал; проверочная задача; следующий шаг'
    url=worksheet('method-'+key,d['title']+': лист обсуждения','Сопоставить описание результата с собственным опытом, не делая вывода о единственной профессии.',d['cols'],d['rows'],fields,d['steps'])
    return dict(title=d['title'],lead=d['lead'],kind='method-review',audience='Подростки, родители и педагоги',worksheet_url=url,
      sections=[sec('subject','Что помогает обсудить этот подход',p(d['purpose'])),
        sec('version','Версия инструмента и источник',p(d['version'])),
        sec('reading','Как связать результат с реальным опытом',listing(d['steps'])+table(d['cols'],d['rows'])),
        sec('example','Учебный пример: гипотеза вместо ярлыка',p(d['example'])),
        sec('rights','Что опубликовано на этой странице',p(d['boundary'])),
        sec('worksheet','Собственный лист обсуждения',shared_worksheet_section(url,'family',fields))],
      faq=[{'question':'Здесь можно пройти оригинальный авторский тест?','answer':'На этой странице опубликован обзор. Полные авторские вопросы, ключи и нормы не воспроизводятся. Ссылки ведут к источникам и официальным материалам; собственная карта интересов ProSchools обозначена отдельно.'},
        {'question':'Можно ли выбирать обучение только по результату?','answer':'Нет. Предпочтения и мотивы сопоставляют с опытом, затем проверяют содержание программы и актуальные условия следующего шага.'}],sources=d['sources'])

def main():
    pages=[];retained=[];missing=[]
    for brief in BRIEFS:
        path=brief['url'];keys=brief['cluster_ids']
        if path=='/test/':retained.append({'path':path,'status':'existing_functionality_retained','note':'Свободный существующий тест без изменения функциональности'});continue
        grade=re.search(r'^/proforientaciya/(\d{1,2})-klass/$',path)
        if grade:page=make_grade(int(grade[1]))
        elif any(k.startswith('teacher-') for k in keys):page=make_teacher(next(k.removeprefix('teacher-') for k in keys if k.startswith('teacher-')))
        elif any(k.startswith('method-') for k in keys):
            k=next(k.removeprefix('method-') for k in keys if k.startswith('method-'))
            if k not in METHODS:missing.append(path);continue
            page=make_method(k)
        else:
            k=next((k for k in keys if k in FAMILY),None)
            if not k:missing.append(path);continue
            page=make_family(k)
        page.update(path=path,description=page['lead'][:210],date='2026-11-06',
          cluster_ids=keys,cta={'label':'Открыть карту интересов','href':TEST})
        page['sources']=[{'title':SOURCES[k][0],'url':SOURCES[k][1]} if isinstance(k,str) else k for k in page['sources']]
        if page['kind'].startswith('teacher') or page['kind']=='class-material':page['cta']={'label':'Материалы по классам','href':'/proforientaciya/pedagogam/'}
        if path.startswith('/blog/'):
            original=ROOT/'originals'/(path.strip('/').split('/')[-1]+'.json')
            if not original.exists():original=PROJECT/'content/blog'/(path.strip('/').split('/')[-1]+'.json')
            page.update(original_mode='append',original_path=str(original.relative_to(PROJECT)),original_sha256=hashlib.sha256(original.read_bytes()).hexdigest())
        pages.append(page)
    bypath={p['path']:p for p in pages};fullpaths={b['url'] for b in BRIEFS}
    links=[]
    for page in pages:
        path=page['path'];keys=page['cluster_ids'];candidates=[]
        if path==HUB:candidates=[b['url'] for b in BRIEFS if b['url']!=HUB]
        elif page['kind']=='class-material':
            n=int(re.search(r'/(\d+)-klass/',path)[1]);candidates=['/proforientaciya/pedagogam/lessons/', '/proforientaciya/pedagogam/worksheets/', '/proforientaciya/test-5-8-klass/' if 5<=n<=8 else '/proforientaciya/test-9-11-klass/' if n>=9 else '/blog/proforientaciya-dlya-mladshih-shkolnikov/']
        elif page['kind']=='teacher-material':
            candidates=['/proforientaciya/pedagogam/','/proforientaciya/pedagogam/worksheets/','/proforientaciya/pedagogam/practice/','/proforientaciya/pedagogam/lessons/']
        elif any(k.startswith('method-') for k in keys):candidates=['/blog/test-na-proforientaciyu-kak-vybrat/','/proforientaciya/kak-ponyat-rezultaty/','/proforientaciya/professionalnye-proby/']
        else:candidates=['/proforientaciya/roditelyam/','/proforientaciya/kak-ponyat-rezultaty/','/proforientaciya/professionalnye-proby/','/blog/test-na-proforientaciyu-kak-vybrat/']
        selected=([HUB] if path!=HUB else [])+[u for u in candidates if u!=path]
        selected=list(dict.fromkeys(selected))[:(100 if path==HUB else 4)]
        page['related']=[{'path':u,'title':bypath[u]['title'] if u in bypath else next(b['title'] for b in BRIEFS if b['url']==u)} for u in selected]
        for x in page['related']:links.append({'from':path,'to':x['path'],'anchor':x['title']})
    (ROOT/'worksheets/print.js').write_text("document.getElementById('print')?.addEventListener('click',()=>window.print());\n")
    (ROOT/'pages.json').write_text(json.dumps(pages,ensure_ascii=False,indent=2))
    (ROOT/'linksmatrix.json').write_text(json.dumps({'links':links,'status':'editorially_related','retained':retained},ensure_ascii=False,indent=2))
    wordcounts={p['path']:len(re.findall(r'[\w-]+',re.sub('<[^>]+>',' ',p['lead']+' '+' '.join(s['html'] for s in p['sections'])))) for p in pages}
    coverage={'planned_total':len(BRIEFS),'rendered_descriptions':len(pages),'retained_count':len(retained),'retained':retained,'missing':missing,'unique_paths':len(bypath),
      'existing_append':sum(p.get('original_mode')=='append' for p in pages),'new':sum(not p.get('original_mode') for p in pages),
      'word_counts':wordcounts,'words_total':sum(wordcounts.values()),'min_words':min(wordcounts.values()),'max_words':max(wordcounts.values())}
    (ROOT/'coverage.json').write_text(json.dumps(coverage,ensure_ascii=False,indent=2))
    assert len(bypath)==len(pages)
    assert all(x['to'] in fullpaths for x in links)
    assert all(p['sections'] and p['sources'] and p['faq'] for p in pages)
    print(json.dumps({k:v for k,v in coverage.items() if k!='word_counts'},ensure_ascii=False,indent=2))

if __name__=='__main__':main()
