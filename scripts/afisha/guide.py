# coding:utf-8
import html,collections

def esc(v):return html.escape(str(v or ''),quote=True)
def city_guide(c,events,slugs):
 counts=collections.Counter(t for e in events for t in e.get('categories',[e['type']]))
 types=sorted(counts,key=counts.get,reverse=True)
 venues=list(dict.fromkeys(e['place']for e in events if not e['place'].startswith('Tripster')))
 h='<section class="ps-selection-content ps-city-guide"><h2>Куда сходить с ребёнком '+esc(c['inCity'])+'</h2>'
 h+='<p>В этой афише — '+str(len(events))+' мероприятий: '+esc(', '.join(t.lower()for t in types[:5]))+'. Выберите конкретный день или выходные, затем сравните время, стоимость и опубликованный возрастной ценз. У каждого события указаны площадка и адрес.</p>'if events else'<p>Расписание этого города уточняется. На странице доступны реальные варианты в других городах с указанием места и дат. Проверяйте адрес перед поездкой.</p>'
 if types:h+='<h3>Что есть в афише</h3><div class="ps-guide-categories">'+''.join('<a href="'+c['base']+slugs[t]+'/">'+esc(t)+' <span>'+str(counts[t])+'</span></a>'for t in types if t in slugs)+'</div>'
 if venues:h+='<h3>Площадки '+esc(c['inCity'])+'</h3><p>'+esc(' · '.join(venues[:6]))+'.</p>'
 h+='<h3>Как спланировать посещение</h3><p>Откройте карточку: в ней собраны опубликованные даты, цена и место проведения. Выбирайте события по интересам ребёнка; возрастной ценз обозначает ограничение организатора. Для прогулки с несколькими остановками сравните адреса на карте и оставьте время на дорогу.</p><p>Перед посещением проверьте расписание, свободные места, условия детских билетов и сопровождения на сайте организатора. Если источник не опубликовал точное время или цену, они указаны как требующие уточнения.</p></section>'
 return h

def city_directory(c,cities):
 options=[x for x in cities if x['name'] not in [c['name'],'Россия']and(not c.get('isMO')or x.get('isMO'))]
 popular=options[:6]if c.get('isMO')else[x for n in ['Москва','Санкт-Петербург','Московская область','Екатеринбург','Казань','Новосибирск','Нижний Новгород','Краснодар']for x in options if x['name']==n]
 h='<section class="ps-city-directory" aria-label="Афиша по городам"><div class="ps-directory-head"><div><h2>'+('Города Московской области'if c.get('isMO')else'Афиша по городам')+'</h2><p>Выберите свой город — найдём, куда сходить с ребёнком.</p></div><label class="ps-directory-search"><span>Поиск города</span><input type="search" data-directory-search placeholder="Начните вводить название" aria-label="Поиск по городам афиши"></label></div><div class="ps-directory-popular">'+''.join('<a href="'+esc(x['base'])+'">'+esc(x['name'])+'</a>'for x in popular)+'</div><div class="ps-directory-groups">'
 for label,start,end in [('А — И','А','И'),('К — О','К','О'),('П — С','П','С'),('Т — Я','Т','Я')]:
  group=sorted([x for x in options if start<=x['name'][0].upper().replace('Ё','Е').replace('Й','И')<=end],key=lambda x:x['name'])
  if not group:continue
  h+='<details><summary><span>'+label+'</span><small>'+str(len(group))+'</small></summary><div class="ps-directory-links">'+''.join('<a href="'+esc(x['base'])+'">'+esc(x['name'])+'</a>'for x in group)+'</div></details>'
 return h+'</div><p class="ps-directory-empty" hidden>Город не найден. Попробуйте другое название.</p></section>'
