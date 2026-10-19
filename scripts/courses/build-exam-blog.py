#!/usr/bin/env python3
"""Render reviewed EGE/OGE subject comparisons; never run from the price cron."""
import html
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
DATA=ROOT/'data/courses'
BLOG=ROOT/'content/blog'
DATE='2026-10-19'
HUBS={'ege':'kursy-podgotovki-k-ege-luchshie','oge':'luchshie-kursy-podgotovki-k-oge'}
E=lambda v:html.escape(str(v),quote=True)
P=lambda v:'<p>'+E(v)+'</p>'
A=lambda path,label:'<a href="'+E(path)+'">'+E(label)+'</a>'
STYLE='<style data-exam-course-guide>.post-layout main>div:has(>a[href="/shkoly/"]){display:none}@media(max-width:767px){.post-layout>main{min-width:0}.post-layout h1{overflow-wrap:anywhere}.post-body table{max-width:100%}}</style>'


def card(c):return '/kursy/kurs/'+c['id']+'/'
def selection(exam,subject):return '/kursy/'+exam+'/'+subject+'/'
def matches(c,exam,subject):return c.get('active') and exam in c['tags'] and subject in c['tags']
def course_label(c):
    if c.get('grade'):return c['grade']
    if c.get('ageRange'):return '–'.join(map(str,c['ageRange']))+' лет'
    return 'Уточнить у школы'


def cta(path,text):
    return '<section data-exam-course-cta style="background:#fff2e9;border-radius:20px;padding:24px;margin:28px 0"><h2 style="margin-top:0">Подберите курс под свою задачу</h2>'+P(text)+'<a href="'+E(path)+'" style="display:inline-block;background:#ff6b3d;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">Сравнить курсы →</a></section>'


def update_block(slug,marker,block,front=False):
    path=BLOG/(slug+'.json');p=json.loads(path.read_text())
    p['content']=re.sub('<section '+marker+'>.*?</section>','',p['content'],flags=re.S)
    if front:
        # Preserve the old prose while making the two exam-specific reviews easy
        # to reach before the broad subject comparison.
        pos=p['content'].find('<h2')
        if pos<0:pos=len(p['content'])
        p['content']=p['content'][:pos]+block+p['content'][pos:]
    else:p['content']+=block
    path.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')


def main():
    guides=json.loads((DATA/'exam-blog-guides.json').read_text())
    courses={c['id']:c for c in json.loads((DATA/'catalog.json').read_text()) if c.get('active')}
    categories={c['id']:c for c in json.loads((DATA/'categories.json').read_text())}
    broad={g['categoryId']:g for g in json.loads((DATA/'blog-guides.json').read_text())}
    report=[]
    for g in guides:
        exam,subject=g['exam'],g['subjectId'];name=exam.upper().replace('EGE','ЕГЭ').replace('OGE','ОГЭ')
        picks=[courses[cid] for cid in g['courseIds']]
        assert picks and all(matches(c,exam,subject) for c in picks)
        assert set(g['courseIds'])=={c['id'] for c in courses.values() if matches(c,exam,subject)}
        by_brand={}
        for c in picks:by_brand.setdefault(c['brandId'],[]).append(c)
        assert set(by_brand)==set(g['schoolComments'])
        body=STYLE+P(g['lead'])
        body+='<p>'+A(g['catalogPath'],'Все курсы '+name+' по '+g['subjectCase'])+'. В обзоре '+str(len(picks))+' программ, школ — '+str(len(by_brand))+'. Порядок не означает места в рейтинге результатов.</p>'
        for section in g['sections'][:2]:body+='<h2>'+E(section['title'])+'</h2>'+P(section['text'])
        body+='<h2>Программы и форматы подготовки</h2><table><thead><tr><th>Школа и курс</th><th>Класс</th><th>Формат</th></tr></thead><tbody>'
        for c in picks:
            body+='<tr><td>'+A(card(c),c['brand']+' — '+c['title'])+'</td><td>'+E(course_label(c))+'</td><td>'+E(c['format'])+'</td></tr>'
        body+='</tbody></table>'
        for brand,items in by_brand.items():
            body+='<h3>'+E(items[0]['brand'])+'</h3>'+P(g['schoolComments'][brand])
            body+='<ul>'
            for c in items:
                body+='<li>'+A(card(c),c['title'])
                facts=dict(c.get('facts',[]))
                # No generic synopsis copied into eleven different subjects.
                # Only nonfinancial source attributes are listed below.
                details=[]
                for k in ['Объём программы','Учебная нагрузка','Период обучения']:
                    if facts.get(k):details.append(facts[k])
                if details:body+=' — '+E('; '.join(details))
                body+='.</li>'
            body+='</ul>'
        for section in g['sections'][2:]:body+='<h2>'+E(section['title'])+'</h2>'+P(section['text'])
        body+='<h2>'+E(g['question'])+'</h2>'+P(g['answer'])
        body+='<p>Официальные материалы: '+A('https://fipi.ru/'+exam+'/demoversii-specifikacii-kodifikatory','демоверсии и спецификации ФИПИ')+'.</p>'
        body+=cta(g['catalogPath'],'Откройте карточки подходящих программ: там собраны содержание, актуальные условия и переход на сайт выбранной школы.')
        body+='<h2>Другие обзоры подготовки</h2><ul>'
        other=next(x for x in guides if x['exam']!=exam and x['subjectId']==subject)
        body+='<li>'+A('/blog/'+other['slug']+'/',other['title'])+'</li>'
        for sid in g['related']:
            x=next(x for x in guides if x['exam']==exam and x['subjectId']==sid)
            body+='<li>'+A('/blog/'+x['slug']+'/',x['title'])+'</li>'
        body+='<li>'+A('/blog/'+HUBS[exam]+'/',name+': все предметы и форматы')+'</li>'
        body+='<li>'+A('/blog/'+broad[subject]['slug']+'/','Курсы по предмету: школьная программа и экзамены')+'</li></ul>'
        body+=P('Сведения сверены 19 октября 2026 года. Источники и дата проверки — в карточках. Цены и акции здесь не дублируются. Оценок результата учеников редакция не проводила; условия выбранного тарифа уточняйте до оплаты.')
        target=BLOG/(g['slug']+'.json');old=json.loads(target.read_text()) if target.exists() else {}
        post=dict(slug=g['slug'],title=g['title'],excerpt=g['excerpt'],category='Курсы для детей',tags=[name,categories[subject]['label'],'Подготовка к экзаменам'],author='Редакция pro-schools.ru',authorRole='Редакция образовательного каталога',publishedAt=old.get('publishedAt',DATE),readTime=max(3,round(len(re.sub('<[^>]+>',' ',body).split())/160)),imageAlt=g['title'],content=body)
        target.write_text(json.dumps(post,ensure_ascii=False,indent=2)+'\n')
        report.append({'slug':g['slug'],'cards':len(picks)})
    # Use existing exam hubs; avoid making another competing general EGE page.
    for exam,slug in HUBS.items():
        group=[g for g in guides if g['exam']==exam];name='ЕГЭ' if exam=='ege' else 'ОГЭ'
        block='<section data-exam-subject-guides><h2>'+name+': выберите предмет</h2><p>Отдельные обзоры с программами школ и критериями выбора для каждого предмета.</p><ul>'
        for g in group:block+='<li>'+A('/blog/'+g['slug']+'/',g['title'])+' · '+A(g['catalogPath'],'подборка курсов')+'</li>'
        block+='</ul></section>'
        update_block(slug,'data-exam-subject-guides',block,front=True)
        path=BLOG/(slug+'.json');p=json.loads(path.read_text())
        p['content']=re.sub(r'<style data-exam-course-guide>.*?</style>','',p['content'],flags=re.S)
        p['content']=STYLE+p['content']
        p['content']=re.sub(r'<section data-exam-course-cta.*?</section>','',p['content'],flags=re.S)+cta('/kursy/'+exam+'/','Сравните программы подготовки по нужным предметам и откройте карточку перед переходом к школе.')
        path.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
    for subject in {g['subjectId'] for g in guides}:
        group=[g for g in guides if g['subjectId']==subject]
        block='<section data-subject-exam-guides><h2>Подготовка к экзаменам по предмету</h2><ul>'+''.join('<li>'+A('/blog/'+g['slug']+'/',g['title'])+'</li>' for g in group)+'</ul></section>'
        update_block(broad[subject]['slug'],'data-subject-exam-guides',block,front=True)
    print(json.dumps({'examSubjectGuides':len(report),'existingHubsUpdated':len(HUBS),'existingSubjectGuidesUpdated':len({g['subjectId'] for g in guides})},ensure_ascii=False))


if __name__=='__main__':main()
