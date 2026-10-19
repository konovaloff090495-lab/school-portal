#!/usr/bin/env python3
"""Build the lightweight courses section without rebuilding the Next.js site."""
import hashlib, html, json, re, shutil, os
from pathlib import Path
from datetime import datetime, date
from urllib.parse import urlparse, urlsplit, urlunsplit, parse_qsl, urlencode

ROOT=Path(__file__).resolve().parents[2]
DATA=ROOT/'data/courses'
OUT=Path(os.environ.get('COURSES_OUTPUT_DIR',str(ROOT/'public/kursy')))
BASE='https://pro-schools.ru'
TODAY=date.today()
esc=lambda s:html.escape(str(s),quote=True)
fmt=lambda n:f'{n:,}'.replace(',',' ')
def programme_word(n):return 'программа' if n%10==1 and n%100!=11 else 'программы' if n%10 in [2,3,4] and n%100 not in [12,13,14] else 'программ'
def load(name):return json.loads((DATA/name).read_text())
def script_json(value):return json.dumps(value,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026')
COURSES=[c for c in load('catalog.json') if c.get('active')]
CATEGORIES=load('categories.json')
CATS={c['id']:c for c in CATEGORIES}
PARTNERS=load('partners.json')
BRANDS={c['brandId']:c['brand'] for c in COURSES}
SUBJECT_CASES={'matematika':'математике','russkiy':'русскому языку','angliyskiy':'английскому языку','fizika':'физике','himiya':'химии','biologiya':'биологии','informatika':'информатике','istoriya':'истории','obshchestvoznanie':'обществознанию','literatura':'литературе','geografiya':'географии'}
COMBINATIONS=[]
for exam in ['ege','oge']:
    for subject,noun in SUBJECT_CASES.items():
        if sum(exam in c['tags'] and subject in c['tags'] for c in COURSES)>=2:
            COMBINATIONS.append({'id':exam+'/'+subject,'filters':[exam,subject],'label':CATS[exam]['label']+': '+CATS[subject]['label'].lower(),'title':'Курсы подготовки к '+('ЕГЭ' if exam=='ege' else 'ОГЭ')+' по '+noun,'intro':'Подготовка к '+('ЕГЭ' if exam=='ege' else 'ОГЭ')+' по '+noun+'. Сравните учебные программы, проверку домашних работ, расписание и стоимость занятий в разных школах.','guide':CATS[exam]['guide']+' '+CATS[subject]['guide']})
TINTS=['#ffe1c2','#e1eadf','#ffe8a5','#e2e9ed','#f4dbd2','#e3dfef']
def url(c):return '/kursy/kurs/'+c['id']+'/'
def caturl(id):return '/kursy/'+id+'/'
def brandurl(id):return '/kursy/shkoly/'+id+'/'
def age(c):return f'{c["ageRange"][0]}–{c["ageRange"][1]} лет' if c.get('ageRange') else c.get('grade') or 'Возраст уточняется'
def fresh(item,days):return item and (TODAY-date.fromisoformat(item['checkedAt'])).days<=days
def price(c):return c['price'] if fresh(c.get('price'),7) else None
def offer(c):return c['offer'] if fresh(c.get('offer'),3) else None
def tint(c):return TINTS[int(hashlib.sha256(c['category'].encode()).hexdigest()[:4],16)%len(TINTS)]
def indexable(c):
    if re.search(r'\b202[0-6]\b',c['title']) and not re.search(r'2027',c['title']):return False
    # Sparse records stay useful to visitors but do not create thin search pages.
    return bool(len(c.get('editorialDescription','').split())>=35 or (price(c) and (c.get('ageRange') or c.get('grade') or c.get('modules'))) or (c.get('ageRange') and (len(c.get('modules',[]))>=2 or c.get('facts'))))

def partner_url(c):
    approved=PARTNERS.get('approvedLinks',{}).get(c['id']) or PARTNERS.get('approvedLinks',{}).get(c['brandId'])
    dest=approved['url'] if approved and approved.get('status')=='approved' else c['sourceUrl']
    u=urlsplit(dest)
    if u.scheme!='https' or not u.hostname or u.username:raise ValueError('Unsafe destination '+c['id'])
    original_host=urlparse(c['sourceUrl']).hostname
    if u.hostname!=original_host and not (approved and approved.get('status')=='approved'):
        raise ValueError('Unapproved destination '+c['id'])
    params=dict(parse_qsl(u.query,keep_blank_values=True))
    # Preserve CPA identifiers and query parameters. UTM is not a substitute for CPA approval.
    params.update(utm_source=PARTNERS['utmSource'],utm_medium=PARTNERS['synergyMedium'] if c['brandId']=='synergy' else PARTNERS['defaultMedium'],utm_campaign=PARTNERS['utmCampaign'],utm_term=c['id'],utm_content='course_card')
    return urlunsplit((u.scheme,u.netloc,u.path,urlencode(params),u.fragment))

def price_html(c):
    p=price(c)
    if not p:return '<div class="price unknown">Цена у школы</div><div class="price-unit">условия и пакеты занятий</div>'
    return f'<div class="price">{"от " if p["from"] else ""}{fmt(p["amount"])} ₽</div><div class="price-unit">за {esc(p["unit"])}{(" · пакет 4 предмета" if c["brandId"]=="sotka" else "")}</div>'

def card(c):
    p=price(c);o=offer(c);category=CATS[c['category']]
    ds={'brand':c['brandId'],'title':c['title'],'search':c['title']+' '+c['brand']+' '+' '.join(CATS[t]['label'] for t in c['tags']),'unit':p['unit'] if p else '', 'price':p['amount'] if p else '', 'offer':'1' if o and o.get('kind')=='trial' else '0','discount':'1' if o and o.get('kind')=='discount' else '0','online':'1' if c['online'] else '0'}
    if c.get('ageRange'):ds.update({'age-min':c['ageRange'][0],'age-max':c['ageRange'][1]})
    if c.get('grade'):
        grades=re.findall(r'\d+',c['grade'])
        if grades:ds.update({'grade-min':grades[0],'grade-max':grades[-1]})
    attrs=' '.join(f'data-{k}="{esc(v)}"' for k,v in ds.items())
    return f'''<article class="course-card" data-course-card {attrs}>
      <a href="{url(c)}" class="course-cover" style="--cover:{tint(c)}" aria-label="{esc(c['title'])}"><span class="symbol" aria-hidden="true">{esc(category['symbol'])}</span></a>
      <div><a class="course-brand" href="{brandurl(c['brandId'])}"><i class="brand-dot"></i>{esc(c['brand'])}</a><h3><a href="{url(c)}">{esc(c['title'])}</a></h3>
      <div class="course-meta"><span>{esc(age(c))}</span><span>{esc(c['format'])}</span></div><p class="course-topics">{' · '.join(esc(CATS[t]['label']) for t in c['tags'][:3])}</p></div>
      <div class="course-action"><div>{f'<div class="offer-label">{esc(o["text"])}</div>' if o else ''}{price_html(c)}</div><a class="button" href="{url(c)}">Подробнее <span aria-hidden="true">↗</span></a></div></article>'''

def breadcrumbs(items):
    visual='<div class="breadcrumbs" aria-label="Хлебные крошки">'+'<span aria-hidden="true">/</span>'.join(f'<a href="{esc(path)}">{esc(label)}</a>' if path else f'<span aria-current="page">{esc(label)}</span>' for label,path in items)+'</div>'
    schema={'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':i+1,'name':label,**({'item':BASE+path} if path else {})} for i,(label,path) in enumerate(items)]}
    return visual+f'<script type="application/ld+json">{script_json(schema)}</script>'

def head(title,desc,path,index=True):
    return f'''<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(title)}</title><meta name="description" content="{esc(desc)}"><meta name="robots" content="{'index,follow' if index else 'noindex,follow'}"><link rel="canonical" href="{BASE+path}"><meta property="og:type" content="website"><meta property="og:locale" content="ru_RU"><meta property="og:site_name" content="ProSchools"><meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(desc)}"><meta property="og:url" content="{BASE+path}"><link rel="icon" href="/favicon.ico"><link rel="stylesheet" href="/kursy/assets/catalog.css?v=1"><script defer src="/kursy/assets/catalog.js?v=1"></script></head>'''

HEADER='''<a href="#content" class="skip">Перейти к содержимому</a><header class="top"><div class="wrap"><a class="logo" href="/" aria-label="ProSchools — главная"><b>P</b><span>pro<em>·</em>school<small>.ru</small></span></a><nav class="nav" aria-label="Главное меню"><a class="desktop" href="/shkoly/">Школы</a><a class="current" href="/kursy/" aria-current="page">Курсы</a><a class="desktop" href="/uchebnik/">Учебник</a><a class="minor" href="/ege/">ЕГЭ</a><a class="minor" href="/blog/">Журнал</a><a class="nav-cta" href="/kursy/#catalog">Подобрать курс ↗</a></nav></div></header>'''
FOOTER='''<footer class="footer"><div class="wrap"><div><a class="logo" href="/">pro·school.ru</a><p>Курсы для интересов, школьных задач и первых больших проектов.</p><p>На сайте есть партнёрские ссылки.</p></div><div><a href="/kursy/">Все курсы</a> · <a href="/shkoly/">Школы России</a><p><a href="/politika-konfidentsialnosti/">Конфиденциальность</a> · <a href="/reklama/">Рекламодателям</a></p><p>© 2026 ProSchools</p></div></div></footer>'''
METRIKA='''<script>(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r)return;}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');ym(108789843,'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true});</script>'''

def save(path,doc,index=True,lastmod=None):
    dest=OUT/path.removeprefix('/kursy/');dest.mkdir(parents=True,exist_ok=True)
    (dest/'index.html').write_text(doc+METRIKA+'</body></html>')
    if index:SITEMAP.append((path,lastmod or max(c['checkedAt'] for c in COURSES)))

def direction_links():
    return '<div class="direction-grid">'+''.join(f'<a href="{caturl(t["id"])}">{esc(t["label"])}<small>{sum(t["id"] in c["tags"] for c in COURSES)}</small></a>' for t in CATEGORIES if any(t['id'] in c['tags'] for c in COURSES))+'</div>'

def combination_links(category):
    if not category:return ''
    links=[]
    for item in COMBINATIONS:
        if item['filters'][0]==category['id'].split('/')[0]:
            links.append('<a class="pill" href="'+caturl(item['id'])+'">'+esc(item['label'])+'</a> ')
    return '<div class="hero-points">'+''.join(links)+'</div>'

def filters(path,brand=None):
    basepath='/'.join(path.split('/')[:3])+'/'
    opts='<option value="/kursy/">Все направления</option>'+''.join(f'<option value="{caturl(t["id"])}" {"selected" if basepath==caturl(t["id"]) else ""}>{esc(t["label"])}</option>' for t in CATEGORIES if any(t['id'] in c['tags'] for c in COURSES))
    brandopts=''.join(f'<option value="{esc(k)}" {"selected" if k==brand else ""}>{esc(v)}</option>' for k,v in sorted(BRANDS.items(),key=lambda b:b[1]))
    ages=''.join(f'<option value="{n}">{n} {"года" if n==4 else "лет"}</option>' for n in range(4,18))
    grades=''.join(f'<option value="{n}">{n} класс</option>' for n in range(1,12))
    programmes=[c for c in COMBINATIONS if caturl(c['filters'][0])==basepath]
    programme=''
    if programmes:
        programme='<label class="field"><span>Предмет экзамена</span><select name="programme"><option value="'+basepath+'">Все предметы</option>'+''.join(f'<option value="{caturl(p["id"])}" {"selected" if caturl(p["id"])==path else ""}>{esc(CATS[p["filters"][1]]["label"])}</option>' for p in programmes)+'</select></label>'
    return f'''<button type="button" class="filter-toggle" id="filter-toggle" aria-expanded="false" aria-controls="course-filters">Фильтры <span aria-hidden="true">☷</span></button><form class="filters" id="course-filters" action="{path}" method="get"><div class="filter-head"><strong>Подобрать курс</strong><button class="reset" type="button" data-reset>Сбросить</button></div><label class="field"><span>Направление</span><select name="direction">{opts}</select></label>{programme}<label class="field"><span>Школа</span><select name="brand"><option value="">Все школы</option>{brandopts}</select></label><label class="field"><span>Возраст ребёнка</span><select name="age"><option value="">Любой возраст</option>{ages}</select></label><label class="field"><span>Класс</span><select name="grade"><option value="">Любой класс</option>{grades}</select></label><label class="field"><span>Единица оплаты</span><select name="unit"><option value="">Все варианты</option><option value="урок">За урок</option><option value="занятие">За занятие</option><option value="месяц">За месяц</option><option value="курс">За курс</option><option value="блок">За блок</option></select></label><label class="check"><input type="checkbox" name="offer" value="1">Бесплатный первый урок</label><label class="check"><input type="checkbox" name="discount" value="1">Курсы со скидкой</label><label class="check"><input type="checkbox" name="online" value="1">Только онлайн</label><button type="submit" class="button apply">Показать курсы</button><p class="filter-note">Выбирайте формат и программу под ребёнка. В карточках — условия занятий и переход к школе.</p></form>'''

FAQ=[('Как выбрать курс для ребёнка?','Начните с задачи: подтянуть предмет, подготовиться к экзамену или попробовать новое увлечение. Сравните возраст, формат обратной связи и общую стоимость пакета. На первом занятии оцените, понимает ли ребёнок преподавателя и хочет ли продолжать.'),('Почему цены указаны по-разному?','Школы продают уроки, месяцы, учебные блоки и целые программы. Единица оплаты указана рядом с каждой ценой. Пакеты по нескольким предметам отмечены отдельно. Для сравнения можно отфильтровать одинаковую единицу оплаты.'),('Можно ли сначала попробовать бесплатно?','У части школ есть бесплатный первый урок. Такие предложения можно отобрать фильтром. Условия записи, длительность пробного занятия и доступность времени смотрите на сайте школы.'),('Где записаться и оплатить обучение?','Откройте карточку программы и нажмите «Перейти на сайт школы». Запись, договор и оплата проходят непосредственно у выбранной школы.'),('Как часто обновляются цены?','У каждой цены есть дата проверки. Каталог учитывает изменение условий на сайтах школ. Если подтверждённой цены нет, показано «Цена у школы». Итоговую сумму и состав пакета можно проверить перед записью.')]
def faq_html(items=FAQ):return '<div class="faq">'+''.join(f'<details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>' for q,a in items)+'</div>'

def catalogue(category=None,brand=None):
    path=caturl(category['id']) if category else brandurl(brand) if brand else '/kursy/'
    selected=[c for c in COURSES if (not category or all(t in c['tags'] for t in category.get('filters',[category['id']]))) and (not brand or c['brandId']==brand)]
    if not selected:return
    # Stable, varied first screen; no claim of editorial ranking.
    selected.sort(key=lambda c:(not bool(offer(c)),not bool(price(c)),c['brandId'],c['id']))
    bybrand={}; mixed=[]
    for c in selected:bybrand.setdefault(c['brandId'],[]).append(c)
    while any(bybrand.values()):
        for values in bybrand.values():
            if values:mixed.append(values.pop(0))
    selected=mixed
    heading=category['title'] if category else f'Курсы {BRANDS[brand]} для детей' if brand else 'Курсы для детей'
    intro=category['intro'] if category else f'Программы {BRANDS[brand]}: сравните направления, возраст, формат и стоимость. Откройте карточку, чтобы посмотреть условия и перейти к записи.' if brand else 'Программирование, языки, экзамены и любимые увлечения. Сравните программы и цены разных школ — от первого интереса до уверенного результата.'
    title=heading+' — цены и программы | ProSchools'
    desc=f'{heading}: {len(selected)} программ. '+intro
    heroheading=esc(heading) if category or brand else 'Найдите лучшие курсы<br>для своего ребёнка<br><span>по выгодной цене</span>'
    guide=category['guide'] if category else 'Смотрите на задачу ребёнка, а затем — на программу и формат занятий. Для нового увлечения удобно начать с пробного урока. Для экзамена важны план подготовки и проверка работ. Сопоставляйте одинаковую единицу оплаты: цена одного урока и цена целого курса решают разные задачи.'
    crumb=[('Главная','/'),('Курсы','/kursy/' if category or brand else '')]
    if category or brand:crumb.append((category['label'] if category else BRANDS[brand],''))
    chips=['programmirovanie','ege','oge','angliyskiy','shahmaty','dizayn','podgotovka-k-shkole','logoped']
    doc=head(title,desc[:310],path,index=not category or len(selected)>=2)+f'<body data-heading="{esc(heading)}" data-base-brand="{esc(brand or "")}">'+HEADER+'<main id="content"><div class="wrap">'+breadcrumbs(crumb)
    doc+=f'''<section class="hero"><div><div class="eyebrow">Курсы, которые подходят вашему ребёнку</div><h1>{heroheading}</h1><p class="hero-copy">{esc(intro)}</p><div class="hero-points"><span class="pill">✓ Сравнение школ и программ</span><span class="pill green">↗ Бесплатные первые уроки</span><span class="pill">Без регистрации</span></div></div><div class="art" aria-hidden="true"><span class="art-star">✳</span><div class="art-window"><div class="dots"><i></i><i></i><i></i></div><div class="art-code"><span>&lt;</span> hello! <span>/&gt;</span></div></div><div class="art-ticket"><small>БОЛЬШИЕ ИНТЕРЕСЫ</small><strong>начинаются<br>с малого</strong><small>найдём то самое ↗</small></div><div class="art-chess">♞</div></div></section>
    <div class="stats"><span><strong>{len(COURSES)}</strong> программ в каталоге</span><span><strong>{len(BRANDS)}</strong> образовательных компаний</span><span><strong>{len([t for t in CATEGORIES if any(t['id'] in c['tags'] for c in COURSES)])}</strong> направлений</span><span>Цены с датой проверки</span></div><nav class="category-chips" aria-label="Популярные направления"><a class="chip {'active' if not category and not brand else ''}" href="/kursy/">Все курсы</a>'''
    doc+=''.join(f'<a class="chip {"active" if category and category["id"]==id else ""}" href="{caturl(id)}">{esc(CATS[id]["label"])}</a>' for id in chips)
    doc+='</nav><section class="catalog-layout" id="catalog">'+filters(path,brand)
    doc+=f'''<div><div class="result-toolbar"><h2>Найдено <span id="result-count">{len(selected)}</span> <span id="programme-word">{programme_word(len(selected))}</span></h2><label><span class="skip">Сортировка</span><select id="sort" aria-label="Сортировка"><option value="">По направлениям</option><option value="title">По названию</option><option value="price-lesson">Дешевле за урок</option><option value="price-month">Дешевле за месяц</option><option value="price-course">Дешевле за курс</option></select></label></div><label class="search-box"><span aria-hidden="true">⌕</span><input id="course-search" type="search" placeholder="Название курса, школа или интерес" aria-label="Поиск по курсам"></label><div class="course-list" id="course-results">'''
    doc+=''.join(card(c) for c in selected)
    doc+='''</div><div class="empty" id="empty" hidden><h3>Попробуем по-другому?</h3><p>Курсов с таким сочетанием пока нет. Уберите один из фильтров.</p><button class="button light" data-reset type="button">Сбросить фильтры</button></div><button class="button load-more" id="load-more" type="button" hidden>Показать ещё программы ↓</button><p class="catalog-aside">Цена «от» зависит от тарифа и пакета. Условия бесплатного занятия и итоговую стоимость смотрите в карточке и на сайте школы.</p></div></section>'''
    doc+=f'<section class="seo-section"><div class="eyebrow">Найти своё направление</div><h2 style="margin-top:13px">Что интересно вашему ребёнку?</h2>{direction_links()}{combination_links(category)}<h2>На что обратить внимание при выборе</h2><p>{esc(guide)}</p></section><section class="seo-section"><h2>Вопросы о курсах</h2>{faq_html()}</section></div></main>'+FOOTER
    schema={'@context':'https://schema.org','@type':'ItemList','name':heading,'numberOfItems':len(selected),'itemListElement':[{'@type':'ListItem','position':i+1,'url':BASE+url(c),'name':c['brand']+': '+c['title']} for i,c in enumerate(selected)]}
    doc+=f'<script id="list-schema" type="application/ld+json">{script_json(schema)}</script>'
    save(path,doc,index=not category or len(selected)>=2)

def detail(c):
    path=url(c);p=price(c);o=offer(c);cat=CATS[c['category']]
    topics=[CATS[t]['label'] for t in c['tags']]
    title=f'{c["brand"]}: {c["title"]} — цена и программа | ProSchools'
    description=f'{c["title"]} — программа школы {c["brand"]}. '+('Стоимость '+('от ' if p['from'] else '')+fmt(p['amount'])+' ₽ за '+p['unit']+'. ' if p else '')+f'{age(c)}. {c["format"]}. Условия, направления и запись на сайте школы.'
    crumbs=[('Главная','/'),('Курсы','/kursy/'),(cat['label'],caturl(c['category'])),(c['brand'],'')]
    details=[('Школа',c['brand']),('Возраст / класс',age(c)),('Формат',c['format']),('Направления',', '.join(topics))]
    if p:details.extend([('Стоимость',('от ' if p['from'] else '')+fmt(p['amount'])+' ₽ за '+p['unit']),('Условия цены',p['condition'])])
    details.extend([tuple(f) for f in c.get('facts',[])])
    details.extend([('Проверка страницы',datetime.fromisoformat(c['checkedAt']).strftime('%d.%m.%Y')),('Запись и договор','На сайте школы')])
    overview_html='<p>'+esc(c['editorialDescription'])+'</p>' if c.get('editorialDescription') else ''
    programme=''.join(f'<li>{esc(m)}</li>' for m in c['modules'])
    if not programme:programme=''.join(f'<li><a href="{caturl(t)}">{esc(CATS[t]["label"])}</a></li>' for t in c['tags'])
    dest=partner_url(c)
    button=f'<a class="button" href="{esc(dest)}" target="_blank" rel="sponsored nofollow noopener" data-partner-link data-course="{c["id"]}" data-brand="{c["brandId"]}">Перейти на сайт школы ↗</a>'
    date_label=datetime.fromisoformat((p or c)['checkedAt']).strftime('%d.%m.%Y')
    doc=head(title,description,path,indexable(c))+'<body data-detail>'+HEADER+'<main id="content"><div class="wrap">'+breadcrumbs(crumbs)
    doc+=f'''<section class="detail-hero"><div class="detail-left"><a class="eyebrow" href="{brandurl(c['brandId'])}">{esc(c['brand'])} · {esc(cat['label'])}</a><h1>{esc(c['title'])}</h1><p class="intro">{esc(c['brand'])} · {esc(age(c))} · {esc(c['format'])}</p><div class="detail-tags">{''.join(f'<a class="pill" href="{caturl(t)}">{esc(CATS[t]["label"])}</a>' for t in c['tags'])}</div><div class="detail-banner" style="--cover:{tint(c)}"><span class="course-word">{esc(c['brand'])}<br><br>{esc(cat['label'])}</span><span class="symbol" aria-hidden="true">{esc(cat['symbol'])}</span></div></div><aside class="price-panel" aria-label="Стоимость и запись">{f'<div class="offer-label">{esc(o["text"])}</div>' if o else ''}{price_html(c)}{button}<p class="condition">{esc(p['condition']) if p else 'Школа подберёт тариф и сообщит стоимость перед записью.'}</p><p class="checked">{'Цена' if p else 'Страница школы'} проверена {date_label}</p></aside></section><nav class="detail-nav" aria-label="О курсе"><a href="#about">О программе</a><a href="#programme">Направления и темы</a><a href="#conditions">Цена и условия</a><a href="#related">Похожие курсы</a></nav><div class="detail-content"><div><section class="detail-section" id="about"><h2>О программе</h2>{overview_html}<dl class="fact-grid">{''.join(f'<div><dt>{esc(k)}</dt><dd>{esc(v)}</dd></div>' for k,v in details)}</dl></section><section class="detail-section" id="programme"><h2>Направления и темы</h2><ul class="topic-list">{programme}</ul><p>Полный учебный план и доступные группы — на странице программы {esc(c['brand'])}.</p><a class="source-link" href="{esc(dest)}" target="_blank" rel="sponsored nofollow noopener" data-partner-link data-course="{c['id']}" data-brand="{c['brandId']}">Посмотреть программу у школы ↗</a></section><section class="detail-section" id="conditions"><h2>Цена и условия записи</h2>'''
    if p:doc+=f'<p><strong>{("От " if p["from"] else "")+fmt(p["amount"])} ₽ за {esc(p["unit"])}.</strong> {esc(p["condition"])}. Цена проверена {date_label}.</p>'
    else:doc+='<p>Стоимость зависит от выбранной программы и пакета занятий. Посмотрите тарифы на сайте школы перед записью.</p>'
    if o:doc+=f'<p>{esc(o["text"])}. {esc(o.get("condition","Доступное время и условия пробного занятия уточняются при записи"))}.</p>'
    doc+=f'''<p>Заявка, договор и оплата проходят на сайте {esc(c['brand'])}. Перед оплатой проверьте размер группы, количество занятий в пакете и правила переноса уроков.</p><div style="margin-top:20px">{button}</div></section></div><aside><div class="brand-note"><div class="eyebrow">Школа</div><h3 style="margin-top:12px">{esc(c['brand'])}</h3><p>Другие направления и программы этой школы в каталоге.</p><a href="{brandurl(c['brandId'])}">Все курсы {esc(c['brand'])} ↗</a></div></aside></div><section class="seo-section" id="related"><h2>Сравните с другими программами</h2><p class="comparison-note">Курсы похожего направления. Цена и единица оплаты указаны отдельно для каждой программы.</p><div class="course-list" style="margin-top:22px">'''
    related=sorted([x for x in COURSES if x['id']!=c['id'] and any(t in x['tags'] for t in c['tags'])],key=lambda x:(x['brandId']==c['brandId'],not bool(price(x)),x['id']))[:4]
    doc+=''.join(card(x) for x in related)+'</div></section></div></main>'+FOOTER+f'<div class="mobile-cta"><div><strong>{("от " if p and p["from"] else "")+fmt(p["amount"])+" ₽" if p else "Цена у школы"}</strong><small>{"за "+esc(p["unit"]) if p else esc(c["brand"])}</small></div>{button}</div>'
    schema={'@context':'https://schema.org','@type':'Course','name':c['title'],'description':description,'url':BASE+path,'provider':{'@type':'Organization','name':c['brand'],'url':urlunsplit(('https',urlparse(c['sourceUrl']).netloc,'/','',''))},'inLanguage':'ru','about':[{'@type':'Thing','name':t} for t in topics]}
    if c.get('ageRange'):schema['typicalAgeRange']=f'{c["ageRange"][0]}-{c["ageRange"][1]}'
    if p and p['unit']=='курс' and not p['from']:schema['offers']={'@type':'Offer','price':p['amount'],'priceCurrency':'RUB','url':dest}
    doc+=f'<script type="application/ld+json">{script_json(schema)}</script>'
    save(path,doc,indexable(c),c['checkedAt'])

SITEMAP=[]
if __name__=='__main__':
    OUT.mkdir(parents=True,exist_ok=True);(OUT/'assets').mkdir(exist_ok=True)
    for asset in ['catalog.css','catalog.js','navigation.js']:shutil.copy(Path(__file__).with_name(asset),OUT/'assets'/asset)
    shutil.copytree(Path(__file__).with_name('fonts'),OUT/'assets/fonts',dirs_exist_ok=True)
    css=(Path(__file__).with_name('catalog.css')).read_text()
    css=re.sub(r'^@font-face\{[^}]+\}\n@font-face\{[^}]+\}\n','',css)
    (OUT/'assets/catalog.css').write_text(Path(__file__).with_name('fonts.css').read_text()+'\n'+css)
    catalogue()
    for category in CATEGORIES+COMBINATIONS:catalogue(category=category)
    for brand in BRANDS:catalogue(brand=brand)
    for c in COURSES:detail(c)
    xml='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join(f'<url><loc>{BASE+path}</loc><lastmod>{date}</lastmod></url>' for path,date in SITEMAP)+'</urlset>'
    (OUT/'sitemap.xml').write_text(xml)
    manifest={'builtAt':datetime.now().isoformat(),'courses':len(COURSES),'brands':len(BRANDS),'pages':1+len(BRANDS)+len(COMBINATIONS)+sum(any(t['id'] in c['tags'] for c in COURSES) for t in CATEGORIES)+len(COURSES),'indexablePages':len(SITEMAP),'indexableCourses':sum(indexable(c) for c in COURSES),'prices':sum(bool(price(c)) for c in COURSES),'offers':sum(bool(offer(c)) for c in COURSES),'sitemap':[BASE+p for p,_ in SITEMAP]}
    (ROOT/'work/courses/build-report.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
    print(json.dumps({k:v for k,v in manifest.items() if k!='sitemap'},ensure_ascii=False))
