# -*- coding: utf-8 -*-
"""Publish deliberately reviewed school overviews; never run in price cron."""
import html,json,re
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
DATA=ROOT/'data/courses';BLOG=ROOT/'content/blog';DATE='2026-10-19'
HUB='obzory-onlayn-shkol-dlya-detej'
E=lambda v:html.escape(str(v),quote=True)
P=lambda v:'<p>'+E(v)+'</p>'
A=lambda url,label:'<a href="'+E(url)+'">'+E(label)+'</a>'
STYLE='<style data-brand-course-guide>.post-layout main>div:has(>a[href="/shkoly/"]){display:none}@media(max-width:767px){.post-layout>main{min-width:0}.post-layout h1{overflow-wrap:anywhere}.post-body table{max-width:100%}}</style>'
def save(slug,title,excerpt,body,tags):
 path=BLOG/(slug+'.json');old=json.loads(path.read_text()) if path.exists() else {}
 post=dict(slug=slug,title=title,excerpt=excerpt,content=STYLE+body,category='Курсы для детей',tags=tags,author='Редакция pro-schools.ru',authorRole='Редакция образовательного каталога',publishedAt=old.get('publishedAt',DATE),readTime=max(3,round(len(re.sub('<[^>]+>',' ',body).split())/160)),imageAlt=title)
 path.write_text(json.dumps(post,ensure_ascii=False,indent=2)+'\n')
def main():
 guides=json.loads((DATA/'brand-blog-guides.json').read_text());courses=[c for c in json.loads((DATA/'catalog.json').read_text()) if c.get('active')];cats={c['id']:c for c in json.loads((DATA/'categories.json').read_text())};brands={c['brandId']:c['brand'] for c in courses}
 assert {g['brandId'] for g in guides}==set(brands),'Every catalog brand requires its own reviewed brief'
 report=[];hub=P('Обзоры помогают сравнить учебные направления, аудиторию и условия разных площадок. Начните с интереса ребёнка, затем откройте страницу школы и конкретную программу. Здесь собраны редакционные разборы всех '+str(len(brands))+' площадок, представленных в нашем каталоге; порядок не является рейтингом результатов учеников.')
 hub+='<p>'+A('/kursy/','Все курсы для детей')+' · '+A('/blog/luchshie-kursy-dlya-detej/','Подборки по направлениям')+'.</p><ul>'
 for g in sorted(guides,key=lambda g:brands[g['brandId']]):
  b=g['brandId'];name=brands[b];arr=[c for c in courses if c['brandId']==b];counts=Counter(t for c in arr for t in c['tags']);top=[t for t,_ in counts.most_common(8)];selected=[];seen=set()
  # One example per subject/format first, then the detailed brand catalog.
  for cid in g.get('featuredCourseIds',[]):
   c=next(c for c in arr if c['id']==cid)
   assert len(selected)<8 and c not in selected,'Invalid featured school course'
   selected.append(c);seen.add((c['category'],c['format']))
  for c in sorted(arr,key=lambda c:(not bool(c.get('editorialDescription')),c['category'],c['id'])):
   key=(c['category'],c['format'])
   if key not in seen and len(selected)<8:selected.append(c);seen.add(key)
  g['courseIds']=[c['id'] for c in selected]
  title=name+': обзор курсов для детей и условий обучения';g['title']=title
  excerpt=name+': '+', '.join(cats[t]['label'].lower() for t in top[:3])+'. Кому подходят программы, как проходят занятия и что уточнить перед оплатой.'
  if len(excerpt)>210:excerpt=name+': обзор направлений, аудитории и условий обучения. Ссылки на страницу школы и карточки курсов в каталоге ProSchools.'
  body=P(g['lead'])+P('Редакционный обзор публичных программ. Сведения проверены 19 октября 2026 года; текущие цены и даты их проверки указаны в карточках.')
  body+='<p>'+A('/kursy/shkoly/'+b+'/','Все программы '+name+' в каталоге')+' — '+str(len(arr))+' предложений в собранной части каталога.</p>'
  body+='<h2>Какие направления есть у '+E(name)+'</h2><ul>'
  for t in top:body+='<li>'+A('/kursy/'+t+'/',cats[t]['label'])+' — '+str(counts[t])+' предложений '+E(name)+' в каталоге по этому тегу.</li>'
  body+='</ul>'+P('Одна программа может относиться к нескольким направлениям. Числа по тегам не нужно складывать: полный список уникальных предложений находится на странице школы.')
  body+='<h2>Кому подходят программы и как выбрать маршрут</h2>'+P(g['fit'])
  body+='<h2>Примеры программ '+E(name)+'</h2><table><thead><tr><th>Программа</th><th>Аудитория</th><th>Формат</th></tr></thead><tbody>'
  for c in selected:
   age=f'{c["ageRange"][0]}–{c["ageRange"][1]} лет' if c.get('ageRange') else c.get('grade') or 'Уточнить у организатора'
   body+='<tr><td>'+A('/kursy/kurs/'+c['id']+'/',c['title'])+'</td><td>'+E(age)+'</td><td>'+E(c['format'])+'</td></tr>'
  body+='</tbody></table><p>'+A('/kursy/shkoly/'+b+'/','Смотреть полный состав программ '+name+' и фильтры')+'.</p>'
  body+='<h2>Оплата, доступ и условия занятий</h2>'+P(g['terms'])
  body+='<h2>'+E(g['question'])+'</h2>'+P(g['answer'])
  body+='<section data-brand-course-cta style="background:#fff2e9;border-radius:20px;padding:24px;margin:28px 0"><h2 style="margin-top:0">Сравните программы '+E(name)+'</h2><p>Откройте карточки подходящих курсов: в них — содержание, условия и переход к организатору.</p>'+A('/kursy/shkoly/'+b+'/','Выбрать курс '+name+' →')+'</section>'
  body+='<h2>Что проверить в выбранной карточке</h2>'+P('Сопоставьте возраст или класс, начальную подготовку, объём программы и обратную связь. Уточните доступность набора, полный состав пакета, продолжительность доступа и правила переноса до оплаты. Запись и договор оформляются у организатора после перехода из карточки. Источник и дата проверки указаны у каждой программы.')
  body+='<p>'+A('/blog/'+HUB+'/','Обзоры других школ и площадок')+' · '+A('/kursy/','Сравнить все курсы для детей')+'.</p>'
  save(g['slug'],title,excerpt,body,[name,'Обзор школы','Курсы для детей'])
  hub+='<li><strong>'+A('/blog/'+g['slug']+'/',name)+'</strong> — '+E(', '.join(cats[t]['label'].lower() for t in top[:3]))+'. '+A('/kursy/shkoly/'+b+'/','Программы в каталоге')+'.</li>'
  report.append(dict(brandId=b,slug=g['slug'],courses=len(arr),linkedCourses=len(selected),words=len(re.sub('<[^>]+>',' ',body).split())))
 hub+='</ul><h2>Как пользоваться обзорами</h2>'+P('Сначала определите учебную задачу и подходящий формат. Прочитайте разбор двух площадок, затем перейдите к конкретным курсам и сопоставьте одинаковый объём. Общий бренд может объединять разные продукты: условия одной программы не распространяются автоматически на все остальные.')
 save(HUB,'Обзоры онлайн-школ и курсов для детей: программы и условия','Все '+str(len(brands))+' площадок нашего каталога: направления, аудитория, форматы и условия со ссылками на страницы школ и курсов.',hub,['Обзор школы','Курсы для детей'])
 p=BLOG/'luchshie-kursy-dlya-detej.json';post=json.loads(p.read_text());marker='<section data-brand-reviews>'
 post['content']=re.sub(r'<section data-brand-reviews>.*?</section>','',post['content'],flags=re.S)+marker+'<h2>Обзоры школ</h2><p>'+A('/blog/'+HUB+'/','Что предлагают школы и кому подходят их курсы')+'. Внутри — форматы, условия и ссылки на программы каждой площадки.</p></section>';p.write_text(json.dumps(post,ensure_ascii=False,indent=2)+'\n')
 (DATA/'brand-blog-guides.json').write_text(json.dumps(guides,ensure_ascii=False,indent=2)+'\n');(ROOT/'work/courses/market/brand-blog-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(dict(brandReviews=len(report),hub=HUB,minWords=min(x['words'] for x in report),maxWords=max(x['words'] for x in report))))
if __name__=='__main__':main()
