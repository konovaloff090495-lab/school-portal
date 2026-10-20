"""Rebuild only the catalogue; preserve common chrome, original art and lead modules."""
from pathlib import Path
from datetime import datetime,timedelta
import json,html,math,re,shutil,hashlib,os
from bs4 import BeautifulSoup
from update import iso,MSK,write
ROOT=Path(__file__).resolve().parents[2];BASE='https://pro-schools.ru';HUB='/besplatnye-uroki/';ASSET=HUB+'assets/'
ESC=lambda s:html.escape(str(s or ''),quote=True)
MONTH=['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];DAYS=['пн','вт','ср','чт','пт','сб','вс'];FULLDAYS=['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье']
def parse(s):return BeautifulSoup(s,'html.parser')
def age(e):
 g=e.get('grades',[])
 if g:return str(g[0])+' класс' if len(g)==1 else (str(g[0])+'–'+str(g[-1]) if g==list(range(g[0],g[-1]+1)) else ', '.join(map(str,g)))+' классы'
 a=e.get('ages');return (str(a[0])+('–'+str(a[1]) if a[1] else '+')+' лет') if a else 'Возраст уточняется'
def card(e,topics):
 own=e['id'].startswith('su-');title=ESC(e.get('shortTitle') or e['title']);kind={'scheduled':'По расписанию','recording':'Видеозапись','appointment':'По записи'}[e['kind']]
 if e.get('start'):
  t=iso(e['start']).astimezone(MSK);when=f'{t.day} {MONTH[t.month-1]} · {t:%H:%M} МСК'
 else:when='Смотрите в удобное время' if e['kind']=='recording' else 'Время согласуется при записи'
 action=f'<button class="card-action" data-lektoriy="{ESC(e["id"])}">Записаться <span>↗</span></button>' if own else f'<a class="card-action" href="{ESC(e["outboundUrl"])}" target="_blank" rel="noopener noreferrer">'+('Смотреть' if e['kind']=='recording' else 'На сайт школы')+' <span>↗</span></a>'
 return f'''<article class="card"><div class="card-visual"><a class="cover photographic" href="{ESC(e['url'])}" aria-label="{title}"><img src="{ESC(e['cover'])}" alt="" loading="lazy" decoding="async" width="1536" height="1024"><span class="cover-gradient"></span><span class="cover-label">{ESC(topics.get(e['topics'][0],'Занятие'))}</span><span class="poster-title">{title}</span><span class="cover-bottom">{kind}</span></a><button class="save" aria-label="В избранное: {title}" aria-pressed="false" data-save="{ESC(e['id'])}">♡</button><span class="free-badge">0 ₽</span></div><div class="card-copy"><p class="date">{when}</p><h3><a href="{ESC(e['url'])}">{title}</a></h3><p class="meta">{age(e)} · {str(e['duration'])+' мин' if e.get('duration') else 'Длительность уточняется'}</p><p class="org">{ESC(e.get('publicOrganizer',e['organizer']))} · онлайн</p><div class="card-foot"><span>{'Бесплатное участие' if own else 'Бесплатный старт' if e['kind']=='appointment' else 'Бесплатная запись'}</span>{action}</div></div></article>'''
def clipped(s,n):return s if len(s)<=n else s[:n-1].rsplit(' ',1)[0]+'…'
def crumbs(items):return {'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':i+1,'name':name,'item':BASE+url} for i,(name,url) in enumerate(items)]}

def build(catalog,destination,baseline,now,last_fetch=None):
 dest=Path(destination);baseline=Path(baseline);assets=dest/'besplatnye-uroki/assets';assets.mkdir(parents=True,exist_ok=True)
 def copy_asset(src,dst):
  if str(src).endswith('.webp'):
   try:os.link(src,dst);return dst
   except OSError:pass
  return shutil.copy2(src,dst)
 shutil.copytree(baseline/'besplatnye-uroki/assets',assets,dirs_exist_ok=True,copy_function=copy_asset)
 for p in (ROOT/'public/besplatnye-uroki/assets/covers').glob('*.webp'):
  if not (assets/'covers'/p.name).exists():shutil.copy2(p,assets/'covers'/p.name)
 for name in ['app.js','lead-form.js']:
  source=ROOT/'public/besplatnye-uroki/assets'/name
  if source.exists():shutil.copy2(source,assets/name)
 chrome=json.loads((ROOT/'src/site-navigation/chrome.json').read_text());tax=json.loads((ROOT/'data/free-lessons/taxonomy.json').read_text());topics={x['slug']:x['name'] for x in tax};active=[e for e in catalog if e.get('status')=='active'];active.sort(key=lambda e:(e.get('start') or 'z',e['title']));by={e['id']:e for e in catalog};active_ids={e['id'] for e in active};meta={};indexed=[]
 if not active:raise ValueError('Empty catalogue: publishing refused')
 for e in catalog:
  assert re.fullmatch(r'[a-z0-9-]+',e['id']) and re.fullmatch(r'/besplatnye-uroki/zanyatiya/[a-z0-9-]+/',e['url'])
  assert e.get('topics') and all(t in topics for t in e['topics'])
  assert e['cover'].startswith(ASSET+'covers/') and '..' not in e['cover'] and (dest/e['cover'].lstrip('/')).is_file(),e['id']
  assert e.get('price')==0 and e['outboundUrl'].startswith('https://')
 hashes=[hashlib.sha256((dest/e['cover'].lstrip('/')).read_bytes()).hexdigest() for e in catalog];assert len(hashes)==len(set(hashes)),'Repeated cover'
 templates={k:(ROOT/f'scripts/free-lessons/templates/{k}.html').read_text() for k in ['catalog','subject','lesson']}
 titles=set();descriptions=set()
 def save(doc,path,title,desc,image,index=True,schema=None,page=None):
  assert path.startswith(HUB) and '..' not in path
  title=clipped(title,78);desc=clipped(' '.join(desc.split()),190)
  if title in titles:title=clipped(title,60)+' · '+hashlib.sha256(path.encode()).hexdigest()[:5]
  if desc in descriptions:desc=clipped(desc,160)+' '+topics.get(path.strip('/').split('/')[-1],path.strip('/').split('/')[-1])+'.'
  titles.add(title);descriptions.add(desc);doc.title.string=title
  doc.select_one('meta[name=description]')['content']=desc;doc.select_one('meta[name=robots]')['content']='index,follow' if index else 'noindex,follow';doc.select_one('link[rel=canonical]')['href']=BASE+path
  for key,value in [('og:title',title),('og:description',desc),('og:url',BASE+path),('og:image',BASE+image)]:
   el=doc.select_one(f'meta[property="{key}"]')
   if el:el['content']=value
  for key,value in [('twitter:title',title),('twitter:description',desc),('twitter:image',BASE+image)]:
   el=doc.select_one(f'meta[name="{key}"]')
   if el:el['content']=value
  for part in ['header','footer']:
   w=doc.select_one('.ps-chrome-'+part);w.clear();w.append(parse(chrome[part]));w['data-navigation-version']=chrome['version']
  for s in doc.select('script[type="application/ld+json"]'):s.decompose()
  for x in schema or []:
   s=doc.new_tag('script',type='application/ld+json');s.string=json.dumps(x,ensure_ascii=False).replace('<','\\u003c');doc.head.append(s)
  for s in doc.select('script'):
   if s.string and 'window.INITIAL_PAGE=' in s.string:s.string=f'window.INITIAL_PAGE={page or 1};'
  assert len(doc.select('h1'))==1 and len(doc.select('header'))==len(doc.select('footer'))==1
  p=dest/path.lstrip('/')/'index.html';p.parent.mkdir(parents=True,exist_ok=True);p.write_text(str(doc));meta[path]={'title':title,'description':desc,'indexable':index}
  if index:indexed.append(path)
 def schema_list(name,path,events):return {'@context':'https://schema.org','@type':'CollectionPage','name':name,'url':BASE+path,'mainEntity':{'@type':'ItemList','itemListElement':[{'@type':'ListItem','position':i+1,'url':BASE+e['url'],'name':e.get('shortTitle',e['title'])} for i,e in enumerate(events)]}}
 base=parse(templates['catalog']);track=base.select_one('.hero-track')
 for slide in list(track.select('.hero-slide')):
  eid=Path(slide.img['src']).stem
  if eid not in active_ids:slide.decompose()
 seen={Path(s.img['src']).stem for s in track.select('.hero-slide')}
 for e in active:
  if len(track.select('.hero-slide'))>=8:break
  if e['id'] in seen:continue
  own=e['id'].startswith('su-');cta=f'<button class="hero-cta" data-lektoriy="{ESC(e["id"])}">Записаться бесплатно ↗</button>' if own else f'<a class="hero-cta" href="{ESC(e["outboundUrl"])}" target="_blank" rel="noopener noreferrer">На сайт организатора ↗</a>'
  track.append(parse(f'<article class="hero-slide" role="group" aria-roledescription="слайд"><img src="{ESC(e["cover"])}" alt="" width="1536" height="1024" loading="lazy"><div class="hero-shade"></div><span class="hero-tag">Бесплатное участие · Онлайн</span><div class="hero-copy"><p>{ESC(age(e))}</p><h2>{ESC(e.get("shortTitle",e["title"]))}</h2>{cta}</div><span class="hero-price">0 ₽</span></article>'));seen.add(e['id'])
 slides=track.select('.hero-slide')
 for i,s in enumerate(slides):s['aria-label']=f'{i+1} из {len(slides)}'
 dots=base.select_one('.hero-dots');dots.clear();dots.append(parse(''.join(f'<button aria-label="Показать баннер {i+1}" aria-current="{str(i==0).lower()}" data-slide="{i}"></button>' for i in range(len(slides)))))
 base.select_one('.hero-counter').string='01 / '+str(len(slides)).zfill(2)
 counts={t:sum(t in e['topics'] for e in active) for t in topics}
 for a in base.select('.interest-section a[href]'):
  t=a['href'].strip('/').split('/')[-1]
  if counts.get(t):a.select_one('span').string=str(counts[t])
  else:a.decompose()
 for label,field,items in [('topic','topics',[(t,topics[t]) for t,n in counts.items() if n]),('organizer','organizer',[(o,'Бесплатные уроки' if o=='Лекторий Синергии' else o) for o in sorted({e['organizer'] for e in active})])]:
  select=base.select_one('#'+label);first=select.find('option');first.extract();select.clear();select.append(first)
  for value,text in items:option=base.new_tag('option',value=value);option.string=text;select.append(option)
 strip=base.select_one('[aria-label="Выбор даты"]')
 if strip:
  for b in strip.select('button[data-date]'):
   if b['data-date']:b.decompose()
  anchor=strip.select_one('button[data-date=""]')
  for i in range(7):
   day=now.astimezone(MSK).date()+timedelta(days=i);b=base.new_tag('button');b['data-date']=str(day);b['aria-pressed']='false';b.append(parse(f'<b>{day.day} {MONTH[day.month-1]}</b>{DAYS[day.weekday()]}'));anchor.insert_after(b);anchor=b
 label=iso(last_fetch).astimezone(MSK).strftime('%d.%m.%Y') if last_fetch else now.astimezone(MSK).strftime('%d.%m.%Y');base.select_one('#hint').string='Время — московское. Данные обновлены '+label+'.';base.select_one('#count').string=str(len(active))+' занятий'
 pages=max(1,math.ceil(len(active)/12))
 for n in range(1,pages+1):
  doc=parse(str(base));rows=active[(n-1)*12:n*12];doc.select_one('#cards').clear();doc.select_one('#cards').append(parse(''.join(card(e,topics) for e in rows)))
  pagination=doc.select_one('.afisha-pagination');pagination.clear();pagination.append(parse(''.join(f'<a href="{HUB if i==1 else HUB+f"page/{i}/"}"'+(' aria-current="page"' if i==n else '')+f'>{i}</a>' for i in range(1,pages+1))))
  path=HUB if n==1 else HUB+f'page/{n}/';title='Бесплатные уроки для детей — афиша онлайн-занятий'+(f', страница {n}' if n>1 else '')+' | ProSchools';desc='Бесплатные уроки для детей: школьные предметы, языки, программирование и шахматы. Расписание, классы, возраст и условия участия. Выберите занятие и запишитесь.' if n==1 else f'Страница {n} афиши бесплатных уроков. Темы: '+', '.join(dict.fromkeys(topics[t] for e in rows for t in e['topics']))+'. Программа и запись.'
  save(doc,path,title,desc,rows[0]['cover'],schema=[crumbs([('Главная','/'),('Бесплатные уроки',HUB)]),schema_list('Бесплатные уроки',path,rows)],page=n)
 for e in catalog:
  existing=baseline/e['url'].lstrip('/')/'index.html';doc=parse(existing.read_text() if existing.exists() else templates['lesson']);title=e.get('shortTitle',e['title']);topic=e['topics'][0];main=doc.select_one('main');main.h1.string=title;main.select_one('.lesson-art img')['src']=e['cover'];crumb=main.select_one('.crumb');crumb.clear();crumb.append(parse(f'<a href="{HUB}">Бесплатные уроки</a> / <a href="{HUB+topic}/">{ESC(topics[topic])}</a> / {ESC(title)}'))
  if not existing.exists():
   main.h1.find_next('p').string=e['description'];section=main.select_one('.detail-grid section');section.clear();section.append(parse('<h2>Об уроке</h2><p>'+ESC(e['description'])+'</p><h2>Условия участия</h2><p>'+ESC(e['freeScope'])+'</p><p>'+ESC(age(e))+'</p><p><a href="'+ESC(e['sourceUrl'])+'" target="_blank" rel="noopener">Страница организатора ↗</a></p>'))
   if e.get('slots'):section.insert(0,parse('<h2>Расписание занятий</h2><ul></ul><p class="small">Даты рассчитаны по опубликованному еженедельному расписанию. Переносы уточняйте у организатора.</p>'))
   aside=main.select_one('.detail-grid aside')
   if aside:
    own=e['id'].startswith('su-');aside.clear();aside.append(parse('<strong>0 ₽</strong><p>'+ESC(e['freeScope'])+'</p><p>'+ESC(age(e))+'</p><p>Онлайн</p>'+('<button class="primary" data-lektoriy="'+ESC(e['id'])+'">Записаться бесплатно ↗</button>' if own else '<a class="primary" href="'+ESC(e['outboundUrl'])+'" target="_blank" rel="noopener noreferrer">На сайт организатора ↗</a>')))
  pills=main.select('.detail-grid .pill')
  if pills:pills[0].string=age(e)
  if len(pills)>1:pills[1].string={'scheduled':'По расписанию','recording':'Видеозапись','appointment':'По записи'}[e['kind']]
  if e['id'].startswith('su-'):
   facts=main.select('.detail-grid aside > p')
   if len(facts)>1:
    facts[1].clear();facts[1].append(parse((str(e['duration'])+' минут' if e.get('duration') else 'Длительность зависит от класса')+'<br>'+ESC(age(e))+'<br>Онлайн'))
  # Refresh the actual weekly slot list while preserving the reviewed programme.
  schedule=next((h for h in main.select('h2') if h.get_text(' ',strip=True)=='Расписание занятий'),None)
  if schedule and e.get('slots'):
   ul=schedule.find_next_sibling('ul')
   if ul:ul.clear();ul.append(parse(''.join('<li>'+ESC(FULLDAYS[s['day']]+', '+s['from']+'–'+s['to']+' МСК · '+', '.join(map(str,s['grades']))+' классы · '+s.get('teacher',''))+'</li>' for s in e['slots'])))
  for x in main.select('.lesson-status'):x.decompose()
  for a in main.select('[data-lektoriy],.detail-grid aside a[href]'):
   if a.name=='button':a['data-lektoriy']=e['id']
   elif a.get('href','').startswith('https://') and 'pro-schools.ru' not in a['href']:a['href']=e['outboundUrl']
  if e['status']!='active':
   text={'expired':('Это мероприятие уже завершилось. ' if e.get('end') or e.get('duration') else 'Время начала этого мероприятия уже прошло. ')+'Выберите другое бесплатное занятие в афише.','unverified':'Уточняем актуальное расписание. Пока можно выбрать другие занятия в афише.','withdrawn':'Организатор снял это предложение. Выберите другое бесплатное занятие.'}[e['status']]
   main.h1.insert_before(parse('<p class="lesson-status" role="status">'+text+f' <a href="{HUB}">Смотреть афишу →</a></p>'))
   for action in main.select('[data-lektoriy],.detail-grid aside a[href]'):action.decompose()
  # Related links contain active offers only.
  related=next((h for h in main.select('h2') if h.get_text(' ',strip=True)=='Другие занятия по теме'),None)
  if related:
   ul=related.find_next_sibling('ul')
   if ul:
    ul.clear();related_rows=[r for r in active if r['id']!=e['id'] and topic in r['topics']][:5]
    if related_rows:ul.append(parse(''.join(f'<li><a href="{r["url"]}">{ESC(r.get("shortTitle",r["title"]))}</a></li>' for r in related_rows)))
  desc=f'{title}. {e.get("publicOrganizer",e["organizer"])}: {age(e)}. '+('Время начала мероприятия уже прошло. Другие бесплатные уроки в афише.' if e['status']=='expired' else 'Программа, условия бесплатного участия, актуальное расписание и запись.')
  save(doc,e['url'],title+' — бесплатно | ProSchools',desc,e['cover'],index=e['status']=='active',schema=[crumbs([('Главная','/'),('Бесплатные уроки',HUB),(topics[topic],HUB+topic+'/'),(title,e['url'])]),{'@context':'https://schema.org','@type':'WebPage','name':title,'url':BASE+e['url'],'description':desc,'image':BASE+e['cover']}])
 # Keep old topic URLs usable, but empty sections are noindex and out of sitemap/search.
 old_topics={p.parent.name for p in (baseline/'besplatnye-uroki').glob('*/index.html') if p.parent.name in topics}
 for t in set(t for e in catalog for t in e['topics'])|old_topics:
  group=[e for e in active if t in e['topics']];old=baseline/(HUB+t+'/').lstrip('/')/'index.html';doc=parse(old.read_text() if old.exists() else templates['subject']);heading=doc.h1.get_text(' ',strip=True) if old.exists() else 'Бесплатные уроки: '+topics[t];doc.h1.string=heading;intro=doc.h1.find_next_sibling('p');
  if intro:intro.string='Выберите занятие по интересу и удобному времени. Сейчас в подборке: '+str(len(group))+'. Условия бесплатного участия указаны в карточках.'
  container=doc.select_one('.subject-results');container.clear();container.append(parse('<div class="cards">'+''.join(card(e,topics) for e in group)+'</div>' if group else f'<p>Сейчас новых занятий по этому направлению нет. <a href="{HUB}">Посмотрите всю афишу</a>.</p>'))
  save(doc,HUB+t+'/',heading+' для детей онлайн | ProSchools',heading+f' для детей онлайн: {len(group)} предложений. Выберите класс, время и формат. Открытые уроки, пробные занятия и записи.',(group or active)[0]['cover'],index=bool(group),schema=[crumbs([('Главная','/'),('Бесплатные уроки',HUB),(heading,HUB+t+'/')]),schema_list(heading,HUB+t+'/',group)])
 write(assets/'events.json',catalog)
 (assets/'data.js').write_text('window.CATALOG='+json.dumps(active,ensure_ascii=False).replace('<','\\u003c')+';window.TOPICS='+json.dumps(topics,ensure_ascii=False)+';window.CATALOG_UPDATED_LABEL='+json.dumps(label)+';')
 (dest/'besplatnye-uroki/sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>'+BASE+ESC(p)+'</loc></url>' for p in indexed)+'</urlset>')
 search=[{'t':m['title'].split(' |')[0],'u':path,'y':'page','s':'Бесплатные занятия для детей','k':m['description'],'region':''} for path,m in meta.items() if m['indexable'] and '/page/' not in path]
 write(dest/'besplatnye-uroki/search-index.json',search);write(dest/'besplatnye-uroki/update-status.json',{'updatedAt':now.isoformat(),'sourceCheckedAt':last_fetch,'active':len(active),'archived':len(catalog)-len(active)})
 write(dest/'metadata.json',meta)
 return {'pages':len(meta),'active':len(active),'searchRecords':len(search),'navigationVersion':chrome['version']}
