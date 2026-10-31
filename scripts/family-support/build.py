#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build an independently publishable catalogue and native, disk-backed blog posts."""
from pathlib import Path
import json, html, re, csv, collections

ROOT=Path(__file__).resolve().parents[2]
DATA=ROOT/'research/family-support'
OUT=ROOT/'work/family-support'
OUT.mkdir(parents=True,exist_ok=True)
def read(p): return json.loads(p.read_text())
def write(p,x):
 p.parent.mkdir(parents=True,exist_ok=True)
 p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def esc(x): return html.escape(str(x),quote=True)
measures=sum([read(DATA/p) for p in ['measures.json','measures-extra.json','measures-school.json','measures-continued.json']],[])
assert len({r['id'] for r in measures})==len(measures)
sources=read(DATA/'sources.json')
sources['kindergarten-law']='https://epp.genproc.gov.ru/ru/proc_26/activity/legal-education/explain/e245574/'
write(DATA/'sources.json',sources)
source_labels={'unified':'СФР: единое пособие','assessment':'СФР: оценка нуждаемости','birth':'СФР: пособие при рождении','care':'СФР: уход до 1,5 лет','pregnancy':'СФР: беременность и роды','adoption':'СФР: передача ребёнка в семью','annual':'СФР: ежегодная семейная выплата','capital':'СФР: материнский капитал','housing':'Минтруд: жилищная поддержка','contract':'Минтруд: социальный контракт','tax-standard':'ФНС: стандартные вычеты','tax-education':'ФНС: вычет за обучение','disability-care':'СФР: выплата ухаживающему','nsu':'СФР: набор социальных услуг','disability':'Минтруд: помощь людям с инвалидностью','military-child':'СФР: пособие детям погибшего','military-utilities':'СФР: компенсация ЖКУ','military-repair':'СФР: ремонт дома','military-injury':'СФР: компенсация военной травмы','meals':'Минпросвещения: горячее питание','tomsk-education':'Департамент образования Томской области','tomsk-contract':'Соцзащита Томской области: соцконтракт','mo-utilities':'Московская область: субсидия ЖКУ','mo-uniform':'Соцзащита Московской области: школьная форма','mo-uniform-2026':'Правительство Московской области: выплата 2026 года','multi-law':'СФР: Указ Президента № 63','kindergarten-law':'Прокуратура: компенсация платы за детский сад','admission':'Минобрнауки: правила и вопросы приёма','admission-2026':'Минобрнауки: приёмная кампания 2026 года'}
source_labels.update(read(DATA/'source-labels.json'))
required=['purpose','eligible','criteria','exclusions','amount','authority','channels','documents','steps','deadlines','renewal','combination','refusal','sources','law']
for m in measures:
 assert all(m.get(k) for k in required),m['id']
 assert all(k in sources for k in m['sources']),m['id']
 m.update(url='/blog/'+m['id']+'/',checked='2026-10-31')
assets=read(ROOT/'data/blog-visuals/editorial-library.json')['images']
visuals=[r for r in assets if 'documents' in r['groups'] or 'family' in r['groups']]
posts=[]
retained=read(DATA/'retained-content.json')
for i,m in enumerate(measures):
 f=ROOT/'content/blog'/(m['id']+'.json')
 old=read(f) if f.exists() else {}
 if old:
  backup=OUT/'source-before'/(m['id']+'.json')
  if not backup.exists():write(backup,old)
 related=sorted([r for r in measures if r['id']!=m['id']],key=lambda r: -(len(set(m['situations'])&set(r['situations']))+2*(m['kind']==r['kind'])))[:3]
 cover=visuals[i%len(visuals)];inline=visuals[(i+5)%len(visuals)]
 parts=[f'<p><a href="/podderzhka-semej/">← Каталог помощи семьям с детьми</a></p>',f'<p><strong>Проверено 31 октября 2026 года. Территория: {esc(m["region"])}.</strong> {esc(m["purpose"])}</p>']
 for title,key in [('Кому доступна помощь','eligible'),('Какие условия проверяют','criteria'),('Кому мера не подходит','exclusions'),('Размер и порядок расчёта','amount')]:parts.append(f'<h2>{title}</h2><p>{esc(m[key])}</p>')
 parts.append(f'<figure class="post-photo"><img src="{inline["imageUrl"]}" alt="{esc(inline["imageAlt"])}" width="1536" height="1024" loading="lazy" decoding="async"><figcaption>Тематическая иллюстрация, созданная с помощью ИИ.</figcaption></figure>')
 parts += [f'<h2>Куда обращаться и кто принимает решение</h2><p><strong>Решение:</strong> {esc(m["authority"])}</p><p><strong>Подача:</strong> {esc(m["channels"])}</p>',f'<h2>Какие документы подготовить</h2><p>{esc(m["documents"])}</p>','<h2>Порядок оформления</h2><ol>'+''.join('<li>'+esc(x)+'</li>' for x in m['steps'])+'</ol>']
 for title,key in [('Сроки подачи и рассмотрения','deadlines'),('Продление и изменение обстоятельств','renewal'),('Можно ли сочетать с другой поддержкой','combination'),('Если отказали: что исправить и как обжаловать','refusal')]:parts.append(f'<h2>{title}</h2><p>{esc(m[key])}</p>')
 if m['id'] in retained:parts.append(retained[m['id']])
 parts.append('<h2>Официальные источники</h2><p>'+esc(m['law'])+'. Дата проверки сведений: 31.10.2026. Часть порталов ограничивает автоматическое открытие. Если ссылка временно недоступна, найдите услугу по названию на официальном сайте органа.</p><ul>'+''.join('<li><a href="'+esc(sources[k])+'" rel="noopener" target="_blank">'+esc(source_labels.get(k,k))+'</a></li>' for k in m['sources'])+'</ul>')
 parts.append('<h2>Что проверить ещё</h2><ul>'+''.join('<li><a href="'+r['url']+'">'+esc(r['title'])+'</a></li>' for r in related)+'</ul><p><a href="/podderzhka-semej/">Все меры: по ситуации, виду помощи и региону →</a></p>')
 post={**old,'slug':m['id'],'title':m['title'],'excerpt':m['purpose'],'category':'Помощь семьям','tags':list(dict.fromkeys([m['kind'],m['region']]+m['situations'])),'author':'Редакция pro-schools.ru','authorRole':'Редакция справочного раздела','publishedAt':old.get('publishedAt','2026-10-31'),'updatedAt':'2026-10-31','readTime':max(4,round(len(' '.join(parts).split())/160)),'imageUrl':old.get('imageUrl',cover['imageUrl']),'imageAlt':old.get('imageAlt',cover['imageAlt']),'content':'\n'.join(parts)}
 write(f,post);posts.append(post)
index=read(ROOT/'content/blog/index.json');by={p['slug']:p for p in posts}
index=[{k:v for k,v in by.get(p['slug'],p).items() if k!='content'} for p in index]
known={p['slug'] for p in index}
index += [{k:v for k,v in p.items() if k!='content'} for p in posts if p['slug'] not in known]
write(ROOT/'content/blog/index.json',index)
search=ROOT/'public/site-navigation/search-index.js'
prefix='window.PRO_SEARCH_INDEX='
rows=json.loads(search.read_text().removeprefix(prefix).strip().removesuffix(';'))
targets={'/blog/'+p['slug']+'/':{'t':p['title'],'u':'/blog/'+p['slug']+'/','y':'page','s':'Помощь семьям','k':' '.join(p['tags']),'region':''} for p in posts}
targets['/podderzhka-semej/']={'t':'Пособия, льготы и субсидии семьям с детьми','u':'/podderzhka-semej/','y':'page','s':'Помощь семьям','k':'поддержка пособия льготы выплаты дети семья','region':''}
seen=set()
for n,row in enumerate(rows):
 path=row['u'].removeprefix('https://pro-schools.ru')
 if path in targets:rows[n]={**row,**targets[path],'u':row['u']};seen.add(path)
rows.extend(value for path,value in targets.items() if path not in seen)
search.write_text(prefix+json.dumps(rows,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')+';\n')
write(OUT/'posts.json',posts);write(DATA/'measures-register.json',measures)
chrome=read(ROOT/'src/site-navigation/chrome.json')
for part in ['header','footer']:
 chrome[part]=f'<div class="ps-chrome ps-chrome-{part}" data-navigation-version="{chrome["version"]}">'+chrome[part]+'</div>'
css=(ROOT/'scripts/family-support/catalog.css').read_text()
js=(ROOT/'scripts/family-support/catalog.js').read_text()
regions=sorted({r['region'] for r in measures});kinds=sorted({r['kind'] for r in measures});situations=sorted({s for r in measures for s in r['situations']})
def options(items):return '<option value="">Все варианты</option>'+''.join('<option>'+esc(x)+'</option>' for x in items)
cards=[]
for m in measures:
 cards.append('<article class="help-card" data-kind="'+esc(m['kind'])+'" data-region="'+esc(m['region'])+'" data-situations="'+esc('|'.join(m['situations']))+'"><div class="help-tags"><span>'+esc(m['kind'])+'</span><span>'+esc(m['region'])+'</span></div><h3><a href="'+m['url']+'">'+esc(m['title'])+'</a></h3><p>'+esc(m['purpose'])+'</p><p class="help-amount">'+esc(m['amount'])+'</p><a class="help-link" href="'+m['url']+'">Условия и оформление <span aria-hidden="true">↗</span></a></article>')
scenarios=[('Один родитель','Развод, единственный родитель и потеря кормильца — разные основания. Для вычета «единственный родитель» не означает просто проживание без супруга. В едином пособии отдельно проверяют состав семьи и алименты; с марта 2026 года изменилось вменение алиментов в предусмотренных случаях.'),('Опека','Усыновитель юридически становится родителем. Опекун, попечитель и приёмный родитель действуют на других основаниях. Разовая выплата при передаче, содержание ребёнка и вознаграждение приёмному родителю оформляются отдельно; маткапитал не возникает только от обычной опеки.'),('Семья военного','Участие в СВО и удостоверение ветерана не заменяют проверку конкретного основания. При ранении отдельно устанавливают военную травму и инвалидность. Пропажа без вести, признание безвестно отсутствующим и объявление умершим — разные юридические состояния. Орган и документы зависят от вида службы и меры.'),('Инвалидность','Инвалидность ребёнка и ОВЗ — разные статусы. Пенсия, ЕДВ, НСУ, выплата ухаживающему и образовательные гарантии имеют самостоятельные условия. Инвалидность родителя не означает автоматически инвалидность ребёнка или право на все детские меры.'),('Многодетная семья','Бессрочный статус семьи не означает бессрочную выплату каждой льготы. Проверяют число и возраст учитываемых детей, очное обучение и региональный порядок.'),('Невысокий доход','Не существует единой справки, которая автоматически назначает все пособия. Единое пособие, соцконтракт, ежегодная семейная выплата и ЖКУ используют разные периоды, состав доходов и критерии.')]
scenario_html=''.join('<details><summary>'+esc(t)+'</summary><p>'+esc(v)+'</p></details>' for t,v in scenarios)
hero=visuals[0]
page='<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Пособия, льготы и субсидии семьям с детьми — ProSchools</title><meta name="description" content="Каталог помощи семьям с детьми: федеральные пособия, маткапитал, налоги, жильё, школьные льготы и проверенные региональные меры. Условия и официальные источники."><link rel="canonical" href="https://pro-schools.ru/podderzhka-semej/"><meta name="robots" content="index,follow"><link rel="stylesheet" href="/site-navigation/navigation.css"><style>'+css+'</style></head><body>'+chrome['header']+'<main class="help-main"><nav class="help-breadcrumb" aria-label="Хлебные крошки"><a href="/">Главная</a> / <a href="/blog/">Блог</a> / Помощь семьям</nav><section class="help-hero"><div><p class="help-eyebrow">ПОНЯТНО О ПОДДЕРЖКЕ • ПРОВЕРЕНО 31.10.2026</p><h1>Помощь семье.<br>С чего начать?</h1><p class="help-lead">Пособия, льготы и субсидии семьям с детьми. Выберите ситуацию — и разберитесь, какие условия проверить и куда обратиться.</p><a class="help-button" href="#catalog">Найти подходящую меру ↓</a><p class="help-scope">'+str(len(measures))+' подробных материалов · Федеральные правила + проверенные региональные инструкции</p></div><figure><img src="'+hero['imageUrl']+'" alt="Тематическая иллюстрация: родитель разбирается с документами" width="1536" height="1024"><figcaption>Иллюстрация, созданная с помощью ИИ</figcaption></figure></section><section class="help-start"><h2>Три проверки перед заявлением</h2><div><p><b>01. Основание</b>Возраст, доход, состав семьи, юридический статус — по правилам конкретной меры.</p><p><b>02. Территория</b>Федеральная помощь и региональные услуги отмечены отдельно. Не переносите чужую сумму на свой регион.</p><p><b>03. Порядок</b>В каждой карточке: документы, орган, подача, сроки и действия при отказе.</p></div></section><section id="catalog" class="help-catalog"><div class="help-heading"><div><p class="help-eyebrow">КАТАЛОГ ПОДДЕРЖКИ</p><h2>Выберите свою ситуацию</h2></div><p id="help-count" role="status" aria-live="polite">'+str(len(measures))+' материалов</p></div><div class="help-filters" role="search" aria-label="Фильтры каталога"><label>Поиск по названию<input id="help-search" type="search" placeholder="Например, уход или обучение"></label><label>Ситуация семьи<select id="help-situation">'+options(situations)+'</select></label><label>Вид помощи<select id="help-kind">'+options(kinds)+'</select></label><label>Территория<select id="help-region">'+options(regions)+'</select></label><label class="help-national"><input type="checkbox" id="help-national" checked> Добавлять федеральные меры к выбранному региону</label><button type="button" id="help-reset">Сбросить фильтры</button></div><p class="help-note">Фильтр показывает направления для проверки, а не подтверждает право семьи. В разделе нет анкет с персональными данными. «Региональные правила» — общий разбор порядка, а не услуга одного региона.</p><div class="help-grid">'+''.join(cards)+'</div><div id="help-empty" hidden><h3>В этой выборке нет подходящей карточки</h3><p>Попробуйте снять часть фильтров и проверьте официальные услуги своего региона. Отсутствие карточки не означает отсутствие права.</p></div><noscript><p>Все материалы доступны выше. Для фильтров включите JavaScript.</p></noscript></section><section class="help-status"><h2>Похожие слова — разные основания</h2>'+scenario_html+'</section><section class="help-coverage"><h2>Как читать этот справочник</h2><p>Основной слой — федеральные меры. Региональная выборка включает Москву, Санкт-Петербург, Московскую область, Томскую область и Пермский край. Для каждой меры указана её территория. Это не полный реестр местных выплат России.</p><p>В каталоге разобраны пособия, ипотека с октября 2026 года, опека, инвалидность, отдых, транспорт, лекарства, налоги и образовательные гарантии. Там, где сумма или срок зависит от региона, ведомства либо индивидуального расчёта, это указано прямо. Подробности своего региона проверяйте через <a href="/blog/regionalnaya-pomoshch-semyam/">официальный маршрут поиска помощи</a>.</p><p>Суммы и правила имеют дату актуальности. Решение принимает уполномоченный орган после проверки обстоятельств. Источники и действующие нормативные основания указаны в подробных материалах.</p><p><a href="/blog/posobie-k-shkole-vyplaty-2026/">Как искать региональную выплату к школе →</a></p></section></main>'+chrome['footer']+'<script src="/site-navigation/navigation.js" defer></script><script>'+js+'</script></body></html>'
page=page.replace('<main class="help-main">','<main id="main" class="help-main">')
schema={'@context':'https://schema.org','@type':'CollectionPage','name':'Помощь семьям с детьми','url':'https://pro-schools.ru/podderzhka-semej/','dateModified':'2026-10-31','mainEntity':{'@type':'ItemList','itemListElement':[{'@type':'ListItem','position':i+1,'name':m['title'],'url':'https://pro-schools.ru'+m['url']} for i,m in enumerate(measures)]}}
page=page.replace('</head>','<script type="application/ld+json">'+json.dumps(schema,ensure_ascii=False).replace('<','\\u003c')+'</script></head>')
page=page.replace('</body>',(ROOT/'scripts/courses/design/metrika.html').read_text()+'</body>')
for dest in [OUT/'site/podderzhka-semej/index.html',ROOT/'public/podderzhka-semej/index.html']:
 dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(page)
write(OUT/'build-report.json',{'articles':len(posts),'new':sum(not x.get('existing') for x in measures),'updated':sum(bool(x.get('existing')) for x in measures),'regions':regions,'sources':len(sources),'date':'2026-10-31'})
print((OUT/'build-report.json').read_text())
