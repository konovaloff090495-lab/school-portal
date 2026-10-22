"""Render reviewed programming directories without a full Next build.

Uses the site's shared chrome/fonts, preserves existing canonical school paths,
and creates real HTML pagination. No synthetic city offices or course inventory.
"""
import html,json,re,math,shutil,subprocess
from pathlib import Path
from urllib.parse import quote, urlparse
from collections import Counter
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[2]
WORK=ROOT/'work/programming';OUT=WORK/'release';BASE='https://pro-schools.ru'
MEDIA=json.loads((ROOT/'src/data/school-media.json').read_text())
D=json.loads((WORK/'runtime.json').read_text());HUB='/shkoly/tipy/programmirovanie/'
CHROME=ROOT/'scripts/courses/design'
shared=json.loads((ROOT/'src/site-navigation/chrome.json').read_text())
HEADER='<div class="ps-chrome ps-chrome-header" data-navigation-version="'+shared['version']+'">'+shared['header']+'</div>'
FOOTER='<div class="ps-chrome ps-chrome-footer" data-navigation-version="'+shared['version']+'">'+shared['footer']+'</div>'
METRIKA=(CHROME/'metrika.html').read_text()
E=lambda x:html.escape(str(x or ''),quote=True)
CATALOG=[c for c in D['courses'] if c.get('active')]
TOPICS={'scratch':'Scratch','python':'Python','roblox':'Roblox и Lua','minecraft':'Minecraft','unity':'Unity','web-razrabotka':'Создание сайтов','mobilnye-prilozheniya':'Мобильные приложения','iskusstvennyy-intellekt':'Искусственный интеллект','robototehnika':'Робототехника','kiberbezopasnost':'Кибербезопасность'}
IT=set(TOPICS)|{'programmirovanie'}
COURSES=[c for c in CATALOG if set(c['tags'])&IT]
INDEX=[];ALL=[];PAGE_SIZE=24
def num(n):return 'площадка' if n%10==1 and n%100!=11 else 'площадки' if n%10 in [2,3,4] and n%100 not in [12,13,14] else 'площадок'
def write(path,text):
 p=OUT/path.lstrip('/');p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text)
def a(path,label,cls=''):return f'<a href="{E(path)}"'+(f' class="{E(cls)}"' if cls else '')+'>'+E(label)+'</a>'
def doc(path,title,description,body,index=True,schema=None):
 title=title+' | ProSchools';ALL.append(path)
 if index:INDEX.append(path)
 payload=json.dumps(schema or {'@context':'https://schema.org','@type':'CollectionPage','name':title,'url':BASE+path},ensure_ascii=False).replace('<','\\u003c')
 h=f'''<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{E(title)}</title><meta name="description" content="{E(description)}"><meta name="robots" content="{'index' if index else 'noindex'},follow"><link rel="canonical" href="{BASE+path}"><meta property="og:title" content="{E(title)}"><meta property="og:description" content="{E(description)}"><meta property="og:url" content="{BASE+path}"><meta property="og:type" content="website"><link rel="icon" href="/favicon.ico"><link rel="stylesheet" href="/kursy/assets/fonts.css"><link rel="stylesheet" href="/kursy/assets/style.css"><link rel="stylesheet" href="/site-navigation/navigation.css?v=20261020"><link rel="stylesheet" href="/_programming/style.css?v=20261022-media"><script type="application/ld+json">{payload}</script><script defer src="/_programming/catalog.js?v=20261022-media"></script></head><body>{HEADER}<main id="main" class="ps-main">{body}</main>{FOOTER}{METRIKA}</body></html>'''
 h=h.replace('</head>','<script defer src="/site-navigation/navigation.js?v=20261020"></script></head>')
 start=h.find('<nav class="ps-tabs"');end=h.find('</nav>',start)
 if start>=0:
  tab=h[start:end];tab=tab.replace('href="'+path+'"','href="'+path+'" aria-current="page"');h=h[:start]+tab+h[end:]
 write(path+'index.html',h)
def nav():
 return '<nav class="ps-tabs" aria-label="Формат и программы">'+a(HUB,'Школы по городам')+a(HUB+'online/','Онлайн-школы')+a('/kursy/programmirovanie/','Все курсы')+a(HUB+'besplatno/','Бесплатно')+a(HUB+'dlya-podrostkov/','Для подростков')+'</nav>'
def crumbs(items):return '<nav class="ps-crumbs" aria-label="Хлебные крошки">'+a('/','Главная')+' / '+a(HUB,'Программирование')+''.join(' / '+E(x) for x in items)+'</nav>'
def hero(title,intro,items=(),image=False):
 art='<img src="/kursy/assets/illustrations/programmirovanie.webp" alt="Программирование и создание собственных проектов" width="420" height="320" fetchpriority="high">' if image else ''
 return '<section class="ps-hero'+(' ps-hero-art' if image else '')+'"><div><p class="ps-kicker">ДЕТИ И ПОДРОСТКИ · ПРОГРАММИРОВАНИЕ</p><h1>'+E(title)+'</h1><p class="ps-intro">'+E(intro)+'</p><div class="ps-pills">'+''.join('<span>'+E(x)+'</span>' for x in items)+'</div></div>'+art+'</section>'+nav()
def rating(s):
 if not s.get('yandexRating'):return ''
 reviews=s.get('yandexReviewCount');info=f'Яндекс Карты: {s["yandexRating"]:g}'+(f' · {reviews} отзывов' if reviews is not None else '')+' · сентябрь 2026'
 return '<p class="ps-map-rating">'+a(s.get('yandexMapsUrl') or 'https://yandex.ru/maps/?text='+quote(s['name']+' '+s['city']+' '+s['address']),info)+'</p>'
def cover(s):
 fallback='/blog/images/editorial-20261021/inzhenernye-klassy-v-shkole.webp'
 src=fallback;label='Иллюстрация';kind='illustration'
 if MEDIA['photos'].get(s['slug']):
  src='/schools/'+s['slug']+'-1.jpg';label='Фото школы';kind='photo'
 else:
  host=urlparse(s.get('website') or '').hostname or '';host=host.removeprefix('www.')
  network=next((d for d in ['kiber-one.com','coddyschool.com','top-academy.ru','algoritmika.org'] if host.endswith('.'+d)),None)
  official=MEDIA['websites'].get(host) or MEDIA['websites'].get(network)
  if official:src=official['src'];label='С сайта школы';kind='official'
 return '<a class="ps-card-cover ps-card-cover-'+kind+'" href="/shkola/'+E(s['slug'])+'/"><img data-school-cover data-fallback="'+fallback+'" src="'+E(src)+'" alt="'+E(s['name']+' — '+label)+'" width="600" height="315" loading="lazy"><span>'+label+'</span></a>'
def card(s):
 age=f'Ориентир сети: {s["ageRange"][0]}–{s["ageRange"][1]} лет' if s.get('ageRange') else 'Возраст и группы уточняются'
 return f'''<article class="ps-card" data-card data-search="{E(' '.join([s['name'],s['city'],s['address']]))}" data-rating="{s.get('yandexRating','')}" data-reviews="{s.get('yandexReviewCount','')}">{cover(s)}<div class="ps-card-top"><span class="ps-label">Очная площадка</span></div><h3>{a('/shkola/'+s['slug']+'/',s['name'])}</h3><p class="ps-address">{E(s['city'])}, {E(s['address'])}</p><p class="ps-small">{E(age)}</p>{rating(s)}<div class="ps-card-bottom">{a('/shkola/'+s['slug']+'/','Контакты и условия →')}{'<a href="tel:'+E(re.sub('[^+0-9]','',s['phone']))+'">Позвонить</a>' if s.get('phone') else ''}</div></article>'''
def brand_card(b):
 arr=[c for c in COURSES if c['brandId']==b['id'] and c['online']]
 topics=[TOPICS.get(t,t) for t in b.get('topics',[]) if t in TOPICS]
 return '<article class="ps-card">'+cover(b)+'<div class="ps-card-top"><span class="ps-label">'+E(b.get('format','Онлайн'))+'</span></div><h3>'+a('/shkola/'+b['slug']+'/',b['name'])+'</h3><p>'+E(b['description'])+'</p>'+('<p class="ps-small">'+E(' · '.join(topics))+'</p>' if topics else '')+'<div class="ps-card-bottom">'+a('/shkola/'+b['slug']+'/','О школе →')+(a('/kursy/shkoly/'+b['id']+'/',str(len(arr))+' программ →') if arr else '')+'</div></article>'
def tools(count,hasratings=True):
 return f'''<div class="ps-tools"><label class="ps-search">Найти на этой странице<input type="search" id="ps-search" placeholder="Название, улица или город"></label><label>Сортировать<select id="ps-sort"><option value="default">По названию</option>{'<option value="rating">По оценке Карт</option><option value="reviews">По отзывам Карт</option>' if hasratings else ''}</select></label><p id="ps-count" aria-live="polite">{count} {num(count)} на странице</p></div>'''
def courses_table(arr,limit=None):
 selected=arr if limit is None else arr[:limit]
 rows=''.join('<tr><td>'+a('/kursy/kurs/'+c['id']+'/',c['title'])+'</td><td>'+a('/kursy/shkoly/'+c['brandId']+'/',c['brand'])+'</td><td>'+E(f'{c["ageRange"][0]}–{c["ageRange"][1]} лет' if c.get('ageRange') else c.get('grade') or 'Уточняется')+'</td><td>'+E(c['format'])+'</td></tr>' for c in selected)
 return '<div class="ps-table-scroll"><table><thead><tr><th>Программа</th><th>Школа</th><th>Возраст / класс</th><th>Формат</th></tr></thead><tbody>'+rows+'</tbody></table></div>' if rows else '<p>Подтверждённых программ в этой выборке пока нет.</p>'
GUIDES=[('programmirovanie-dlya-detej','С чего начать'),('onlajn-kursy-programmirovaniya-dlya-detej','Как выбрать онлайн-формат'),('programmirovanie-dlya-detej-po-vozrastam','Выбор по возрасту'),('skolko-stoyat-kursy-programmirovaniya-dlya-detej','Как сравнивать стоимость'),('kruzhki-programmirovaniya-dlya-detej','Как выбрать кружок рядом'),('besplatnye-kursy-programmirovaniya-dlya-detej','Бесплатное обучение')]
def guides():return '<section class="ps-section"><h2>Как выбрать обучение</h2><div class="ps-links">'+''.join(a('/blog/'+slug+'/',label) for slug,label in GUIDES)+'</div></section>'
def topics():return '<section class="ps-section"><h2>Чему хочет научиться ребёнок?</h2><div class="ps-links">'+''.join(a(HUB+t+'/',label) for t,label in TOPICS.items())+'</div></section>'
def city_nav():
 counts=Counter(s['region'] for s in D['physical']);items=[]
 for slug,label in sorted(D['regions'].items(),key=lambda x:x[1]):
  if counts[slug]:items.append(a('/shkoly/'+slug+'/programmirovanie/',label+' · '+str(counts[slug])))
 return '<section class="ps-section"><h2>Школы программирования по городам</h2><p>Цифра — число адресов в каталоге. Сети представлены отдельными учебными локациями.</p><div class="ps-city-grid">'+''.join(items)+'</div></section>'
def city_select(path):
 counts=Counter(s['region'] for s in D['physical']);options='<option value="'+HUB+'">Все города</option>'
 for slug,label in sorted(D['regions'].items(),key=lambda x:x[1]):
  if not counts[slug]:continue
  value='/shkoly/'+slug+'/programmirovanie/'
  options+='<option value="'+value+'"'+(' selected' if path.startswith(value) else '')+'>'+E(label)+' · '+str(counts[slug])+'</option>'
 return '<div class="ps-city-select"><label for="ps-city">Выберите город</label><select id="ps-city">'+options+'</select><p>'+a(HUB+'online/','Нужны занятия из дома? Выберите онлайн-школу →')+'</p></div>'
def mo_nav():
 counts=Counter(s['city'] for s in D['physical'] if s['region']=='moskovskaya-oblast')
 return '<section class="ps-section"><h2>Города Подмосковья</h2><div class="ps-links">'+''.join(a('/shkoly/moskovskaya-oblast/gorod/'+slug+'/programmirovanie/',label+' · '+str(counts[label])) for slug,label in sorted(D['moCities'].items(),key=lambda x:x[1]) if counts[label])+'</div></section>'
def listing(path,title,intro,arr,extra='',index=True):
 arr=sorted(arr,key=lambda x:(x['name'].lower(),x['city'],x['address']))
 n=max(1,math.ceil(len(arr)/PAGE_SIZE))
 for page in range(1,n+1):
  current=path if page==1 else path+'stranica/'+str(page)+'/'
  visible=arr[(page-1)*PAGE_SIZE:page*PAGE_SIZE]
  h1=title+(f': страница {page}' if page>1 else '')
  body=crumbs([title])+hero(h1,intro,[str(len(arr))+' '+num(len(arr)),'Очные занятия','Программы уточняются по адресу'],path==HUB and page==1)
  body+=city_select(path)
  if path=='/shkoly/moskovskaya-oblast/programmirovanie/' and page==1:body+=mo_nav()
  if not arr:body+='<section class="ps-empty"><h2>Подтверждённых очных площадок пока нет</h2><p>Обычные школы с IT-классами не заменяют кружки программирования. Пока можно выбрать дистанционные занятия из отдельного каталога.</p>'+a(HUB+'online/','Посмотреть онлайн-школы','ps-button')+'</section>'
  else:body+=tools(len(visible))+'<div class="ps-grid" id="ps-grid">'+''.join(card(s) for s in visible)+'</div><p id="ps-empty-search" hidden>На этой странице совпадений нет. Посмотрите другие страницы или измените запрос.</p>'
  if n>1:body+='<nav class="ps-pages" aria-label="Страницы каталога">'+''.join('<span aria-current="page">'+str(i)+'</span>' if i==page else a(path if i==1 else path+'stranica/'+str(i)+'/',str(i)) for i in range(1,n+1))+'</nav>'
  if page==1:body+=extra+topics()+guides()
  schema={'@context':'https://schema.org','@type':'CollectionPage','name':h1,'url':BASE+current,'mainEntity':{'@type':'ItemList','numberOfItems':len(visible),'itemListElement':[{'@type':'ListItem','position':(page-1)*PAGE_SIZE+i+1,'url':BASE+'/shkola/'+s['slug']+'/','name':s['name']} for i,s in enumerate(visible)]}}
  doc(current,h1,intro,body,index=index and bool(arr),schema=schema)
def school(s):
 path='/shkola/'+s['slug']+'/'
 remote=bool(s.get('remoteOnly'));name=s['name'];intro=s.get('fullDescription') or s.get('description') or ''
 body=crumbs([name])+hero(name,s.get('description') or intro,['Онлайн' if remote else 'Очные занятия',s['city'] if not remote else 'Из любого города'])
 body+='<div class="ps-detail"><section><h2>Обучение и контакты</h2><p>'+E(intro)+'</p><dl><dt>Формат</dt><dd>'+E(s.get('programmingFormat') or ('Онлайн' if remote else 'Очные занятия'))+'</dd>'
 if not remote:body+='<dt>Адрес</dt><dd>'+E(s['city']+', '+s['address'])+'</dd>'
 if s.get('ageRange'):body+='<dt>Возраст</dt><dd>'+E(f'{s["ageRange"][0]}–{s["ageRange"][1]} лет. Условия конкретной группы уточняются у школы.')+'</dd>'
 if s.get('phone'):body+='<dt>Телефон</dt><dd>'+a('tel:'+re.sub('[^+0-9]','',s['phone']),s['phone'])+'</dd>'
 body+='</dl>'+rating(s)
 if s.get('website'):body+=a(s['website'],'Официальный сайт школы ↗','ps-button')
 if not remote:body+='<p>'+a('https://yandex.ru/maps/?text='+quote(s['name']+' '+s['city']+' '+s['address']),'Посмотреть адрес на Яндекс Картах ↗')+'</p>'
 body+='<h2>Что уточнить перед записью</h2><ul><li>Есть ли набор по этому адресу и на какой возраст.</li><li>Какие язык или среда входят в программу выбранной группы.</li><li>Продолжительность урока, размер группы и проверка проектов.</li><li>Полная цена, число занятий, правила переноса и возврата.</li></ul>'
 body+='<p class="ps-small">'+(a(s['sourceUrl'],'Источник адреса и условий')+' · проверено '+E(s.get('checkedAt')) if s.get('sourceUrl') else 'Адрес и контакты: данные Яндекс Карт, сентябрь 2026. Актуальный набор подтвердит школа.')+'</p></section><aside><h2>Подобрать программу</h2><p>Адрес филиала и общая программа сети — разные сведения. Не все направления обязательно доступны в каждой группе.</p>'+a('/kursy/programmirovanie/','Сравнить курсы','ps-button')+'<p>'+a(HUB+'online/','Онлайн-школы программирования')+'</p><p>'+a(HUB,'Все очные школы')+'</p></aside></div>'
 arr=[c for c in COURSES if c['brandId']==s.get('programmingBrandId')]
 if arr:body+='<section class="ps-section"><h2>Программы этой школы</h2><p>Формат указан у каждой программы. Наличие онлайн-курса не подтверждает его проведение в этом очном филиале.</p>'+courses_table(arr)+'</section>'
 body+=guides()
 schema={'@context':'https://schema.org','@type':'EducationalOrganization','name':name,'url':BASE+path}
 if not remote:schema['address']={'@type':'PostalAddress','addressLocality':s['city'],'streetAddress':s['address'],'addressCountry':'RU'}
 if s.get('phone'):schema['telephone']=s['phone']
 if s.get('website'):schema['sameAs']=[s['website']]
 # External map ratings are never serialized as our AggregateRating.
 doc(path,name+(' — онлайн' if remote else ' — '+s['city']+', '+s['address'])+' — программирование для детей',f'{name}: '+('онлайн-занятия' if remote else s['city']+', '+s['address'])+'. Программы, возраст, контакты и условия записи в школу программирования для детей.',body,True,schema)
def selection(slug,title,intro,arr,guide):
 path=HUB+slug+'/'
 body=crumbs([title])+hero(title,intro,[str(len(arr))+' программ',str(len({c['brandId'] for c in arr}))+' школ'])
 body+='<section class="ps-section"><h2>Программы и форматы</h2>'+courses_table(arr)+'</section><section class="ps-section"><h2>Как выбирать</h2><p>'+E(guide)+'</p><p>Сравнивайте занятия одного формата и одинаковой продолжительности. Возраст, расписание и стоимость подтверждает школа перед заключением договора.</p></section>'+topics()+guides()
 doc(path,title,intro,body,index=len(arr)>=2)
def main():
 if OUT.exists():shutil.rmtree(OUT)
 OUT.mkdir(parents=True)
 static=ROOT/'scripts/programming/assets';shutil.copytree(static,OUT/'_programming')
 onlineextra='<section class="ps-section"><div class="ps-section-heading"><h2>Учиться из дома</h2>'+a(HUB+'online/','Все онлайн-школы →')+'</div><p>Онлайн-школы доступны из разных городов и не считаются местными очными филиалами.</p><div class="ps-grid">'+''.join(brand_card(b) for b in D['online'][:6])+'</div></section>'
 listing(HUB,'Школы программирования для детей и подростков',f'{len(D["physical"])} очных площадок в каталоге и {len(D["online"])} онлайн-школ. Выберите город, сравните форматы и перейдите к конкретным программам.',D['physical'],onlineextra+city_nav())
 brands={}
 for s in D['physical']:brands.setdefault(s.get('programmingBrandId','local'),[]).append(s)
 brand_names={'kiberone':'KIBERone','top-academy':'Компьютерная академия TOP','algoritmika':'Алгоритмика','coddy':'CODDY','mshp':'Московская школа программистов'}
 for brand,arr in brands.items():
  if brand not in brand_names:continue
  name=brand_names[brand]
  listing(HUB+'shkoly/'+brand+'/',name+': школы программирования для детей',f'Учебные адреса {name} в разных городах России. Выберите ближайшую площадку, проверьте контакт и программу конкретного филиала. В списке {len(arr)} {num(len(arr))}.',arr,city_nav())
 for region,label in D['regions'].items():
  arr=[s for s in D['physical'] if s['region']==region]
  loc=D['locatives'].get(region,'в городе '+label)
  extra='<section class="ps-section"><h2>Онлайн-альтернативы</h2><p>Если рядом нет подходящей программы или не подходит расписание, сравните занятия из дома. Это отдельные дистанционные школы.</p>'+a(HUB+'online/','Выбрать онлайн-школу','ps-button')+' '+a('/kursy/programmirovanie/','Посмотреть курсы')+'</section>'
  listing('/shkoly/'+region+'/programmirovanie/','Школы программирования для детей '+loc,f'Очные детские IT-школы и кружки {loc}: адреса, контакты и источники. В каталоге {len(arr)} {num(len(arr))}. Программу и набор проверяйте для конкретного филиала.',arr,extra,index=bool(arr))
 for slug,label in D['moCities'].items():
  arr=[s for s in D['physical'] if s['region']=='moskovskaya-oblast' and s['city']==label]
  if arr:listing('/shkoly/moskovskaya-oblast/gorod/'+slug+'/programmirovanie/','Школы программирования для детей: '+label,f'Детское программирование: {label}. Подтверждённые учебные адреса, контакты и ссылки на официальные страницы школ. Сравните очный и онлайн-формат.',arr)
 # Mirror every legacy microgeo URL with an honest noindex response until real
 # geographic attributes establish a relevant, non-empty selection.
 source=WORK/'upstream-sitemap.xml'
 if source.exists():
  for el in ET.parse(source).iter():
   if not el.tag.endswith('}loc') or not el.text:continue
   p=el.text.removeprefix(BASE)
   if not p.endswith('/programmirovanie/') or not any(t in p for t in ['/metro/','/rayon/']):continue
   parts=p.strip('/').split('/');region=parts[1];kind=parts[2];slug=parts[3]
   geo=D.get('metro',{}).get(slug,slug) if kind=='metro' else D.get('districtLabels',{}).get(slug,slug)
   arr=[s for s in D['physical'] if s['region']==region and s.get('metro' if kind=='metro' else 'district')==geo]
   listing(p,'Программирование для детей: '+D['regions'].get(region,region)+', '+str(geo),f'Очные школы программирования: {D["regions"].get(region,region)}, {geo}. В списке только площадки с подтверждённой привязкой к этой территории.',arr,index=bool(arr))
 for s in D['physical']:school(s)
 for b in D['online']:
  school({'slug':b['slug'],'name':b['name'],'description':b['description'],'remoteOnly':True,'city':'Онлайн','address':'','programmingFormat':b.get('format','Онлайн'),'programmingBrandId':b['id'],'ageRange':b.get('ageRange'),'website':b['website'],'sourceUrl':b.get('sourceUrl') or b['website'],'checkedAt':b.get('checkedAt')})
 path=HUB+'online/'
 body=crumbs(['Онлайн-школы'])+hero('Онлайн-школы программирования для детей',f'{len(D["online"])} школ: живые занятия, индивидуальные уроки и записи с поддержкой. Сравните программы и формат, прежде чем выбирать пакет обучения.',image=True)
 body+='<div class="ps-grid">'+''.join(brand_card(b) for b in D['online'])+'</div>'+topics()+guides()
 doc(path,'Онлайн-школы программирования для детей: программы и форматы',f'Сравнение {len(D["online"])} онлайн-школ программирования для детей и подростков: программы, возраст, занятия с преподавателем и видеокурсы, официальные источники.',body)
 for t,label in TOPICS.items():
  arr=[c for c in COURSES if t in c['tags']]
  selection(t,label+' для детей: школы и программы',f'Программы по направлению «{label}» для детей и школьников. В каждой строке указаны школа, подтверждённый возраст или класс и формат. Выбирайте курс по интересу и уровню ребёнка.',arr,'Попросите пример детского проекта и план первых занятий. Уточните стартовый уровень, установку программ и помощь преподавателя с ошибками.')
 for slug,title,lo,hi in [('6-8-let','Программирование для детей 6–8 лет',6,8),('9-12-let','Программирование для детей 9–12 лет',9,12),('dlya-podrostkov','Программирование для подростков 13–17 лет',13,17)]:
  arr=[c for c in COURSES if c.get('ageRange') and c['ageRange'][0]<=hi and c['ageRange'][1]>=lo]
  selection(slug,title,f'Курсы с подтверждённым возрастным диапазоном, который пересекается с возрастом {lo}–{hi} лет. Точный возраст каждой программы указан в таблице: не каждая программа рассчитана на весь диапазон.',arr,'Возраст — первый ориентир. После него сравните опыт ребёнка и цель: визуальные алгоритмы, игры, сайты или текстовый код. Выберите программу, в чей возрастной диапазон ребёнок действительно попадает.')
 free=[c for c in COURSES if c.get('price',{} ) and c['price']['amount']==0 and c.get('freeAccessEvidence') and (not c.get('accessUntil') or c['accessUntil']>='2026-10-19')]
 selection('besplatno','Бесплатное программирование для детей и школьников','Программы с подтверждённым бесплатным доступом. Бесплатный пробный урок платной школы не считается бесплатным курсом. Проверьте сроки регистрации и условия конкретной программы.',free,'У самостоятельного курса может не быть проверки работ преподавателем. Если доступ ограничен потоком, проверьте дату завершения и возможность продолжить учиться после неё.')
 write('_programming/manifest.json',json.dumps({'indexable':list(dict.fromkeys(INDEX)),'allPaths':list(dict.fromkeys(ALL)),'stats':D['stats']},ensure_ascii=False))
 content=WORK/'content-slugs.json'
 if content.exists():write('_programming/content-paths.json',json.dumps(['/blog/'+s+'/' for s in json.loads(content.read_text())]))
 print(json.dumps({'pages':len(ALL),'indexable':len(INDEX),**D['stats']}))
if __name__=='__main__':main()
