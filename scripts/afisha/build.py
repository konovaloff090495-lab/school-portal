# coding: utf-8
import pathlib,json,re,os,html,hashlib,datetime,base64,shutil,ast,gzip
from bs4 import BeautifulSoup
from guide import city_guide,city_directory
R=pathlib.Path(os.environ.get('AFISHA_ROOT',pathlib.Path(__file__).resolve().parents[2]));P=R/'work/afisha-production';H=pathlib.Path(__file__).parent;OUT=pathlib.Path(os.environ.get('AFISHA_RELEASE',P/'release'));A=OUT/'afisha/assets';A.mkdir(parents=True,exist_ok=True);(A/'apps').mkdir(exist_ok=True);(OUT/'afisha/data').mkdir(exist_ok=True)
registry=json.loads((P/'registry.json').read_text());seen=json.loads((P/'city-events.json').read_text());all_events=json.loads((P/'events.json').read_text());bycity={c['name']:c for c in registry};basejs=(H/'app.template.js').read_text();shell=BeautifulSoup((H/'shell.template.html').read_text(),'html.parser');root=shell.select_one('#ps-afisha-mock')or shell
# Production uses the current canonical shared navigation, never the mock toolbar.
chrome_path=R/'src/site-navigation/chrome.json'
chrome=json.loads((chrome_path if chrome_path.exists()else H/'chrome.json').read_text())
for part in ['header','footer']:
 w=root.select_one('.ps-chrome-'+part)
 if w:w.clear();w.append(BeautifulSoup(chrome[part],'html.parser'));w['data-navigation-version']=chrome['version']
for selector in ['.ps-design-toolbar','.ps-prototype-note','.ps-preview-note','.ps-feedback']:
 for e in root.select(selector):e.decompose()
for e in root.select('[data-screen]'):
 if e.parent and e.parent.get('aria-label')=='Экраны макета':e.parent.parent.decompose();break
# Decorative preview toolbar classes are removed by their explicit container label too.
for e in list(root.select('[aria-label="Предпросмотр дизайна"]')):e.decompose()
for e in root.select('.ps-chrome-header,.ps-chrome-footer'):pass
shelltext=''.join(str(x)for x in root.contents)
(A/'shell.html.gz').write_bytes(gzip.compress(shelltext.encode(),compresslevel=6));(A/'shell.html').write_bytes(b'')
css=(H/'style.template.css').read_text()+'''\n#ps-afisha-mock{border:0!important;border-radius:0!important;max-width:none!important}#ps-afisha-mock .ps-site-viewport{height:100dvh!important;max-height:none!important;border-radius:0!important}#ps-afisha-mock .ps-design-bar,#ps-afisha-mock .ps-mock-toolbar,#ps-afisha-mock .ps-prototype-note{display:none!important}#ps-afisha-mock .ps-city-options{max-height:60vh;overflow:auto}#ps-afisha-mock .ps-city-options button{text-align:left} .ps-ssr{max-width:1180px;margin:0 auto;padding:32px 24px}.ps-ssr-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:22px}.ps-ssr a{color:inherit}.ps-ssr-card{border:1px solid #e5dccf;border-radius:18px;overflow:hidden;background:#fffdf8}.ps-ssr-card img{width:100%;height:190px;object-fit:cover}.ps-ssr-card div{padding:18px}.ps-ssr-links{display:flex;flex-wrap:wrap;gap:12px;margin:24px 0}.ps-ssr-links a{border:1px solid #ded7cc;border-radius:20px;padding:9px 14px}.ps-load-error{padding:20px;background:#fff1dd;border-radius:12px}\n'''
(A/'style.css').write_text(css)
def compressed(path,text):
 gz=path.with_suffix(path.suffix+'.gz');tmp=gz.with_suffix(gz.suffix+'.incoming');tmp.write_bytes(gzip.compress(text.encode(),compresslevel=6,mtime=0));tmp.replace(gz);path.write_bytes(b'')
# Reuse existing illustrative assets only in the home-learning bridge, not event cards.
m=re.search(r'const assets=(\{.*?\});',basejs,re.S);assets=json.loads(m[1]);urls={}
for name,data in assets.items():
 if data.startswith('data:image/'):
  ext='png'if'image/png'in data[:30]else'jpg';file='learning-'+name+'.'+ext;(A/file).write_bytes(base64.b64decode(data.split(',',1)[1]));urls[name]='/afisha/assets/'+file
basejs=basejs[:m.start(1)]+json.dumps(urls)+basejs[m.end(1):]
for name in ['items','geography','mapGeo']:
 token='const '+name+'=';start=basejs.index(token)+len(token);obj,end=json.JSONDecoder().raw_decode(basejs[start:]);replace='payload.items'if name=='items'else'payload.config.geography'if name=='geography'else'{type:"FeatureCollection",features:[]}'
 basejs=basejs[:start]+replace+basejs[start+end:]
slugs=ast.literal_eval(re.search(r'const categorySlugs=(\{.*?\});',basejs,re.S)[1]);copies=ast.literal_eval(re.search(r'const categoryCopy=(\{.*?\});',basejs,re.S)[1]);catheads=ast.literal_eval(re.search(r'const categoryHeadings=(\{.*?\});',basejs,re.S)[1])
basejs=basejs.replace('(()=>{','(async()=>{',1)
setup="""const boot=JSON.parse(document.getElementById('ps-bootstrap').textContent);const [response,fragment]=await Promise.all([fetch(boot.data,{cache:'no-cache'}),fetch('/afisha/assets/shell.html',{cache:'no-cache'})]);if(!response.ok||!fragment.ok)throw Error('Catalogue temporarily unavailable');const payload=await response.json();if(boot.eventData&&!payload.items.some(e=>e.id===boot.eventData.id))payload.items.push({...boot.eventData,archived:true});document.getElementById('ps-afisha-mock').innerHTML=await fragment.text();const cityConfig=payload.config;for(const id of ['ps-home','ps-catalog','ps-detail']){const section=document.getElementById(id);if(section)section.innerHTML=section.innerHTML.replaceAll('в '+cityConfig.templatePrep,cityConfig.inCity).replaceAll(cityConfig.templateGen,cityConfig.name).replaceAll(cityConfig.templateCity,cityConfig.name)};"""
basejs=basejs.replace('(async()=>{','(async()=>{\n'+setup,1)
# Remove prototype-only interception of real site navigation.
a=basejs.index("if(b.closest('.ps-chrome')");b=basejs.index("});\nroot.addEventListener('change'",a);basejs=basejs[:a]+basejs[b:]
basejs=basejs.replace("if(action==='city'||b.hasAttribute('data-city-open'))", "if(action==='city')")
basejs=basejs.replace("function current(){return items.find(x=>x.id===state.event)||items[0]}","function current(){return items.find(x=>x.id===state.event)||items[0]}")
basejs=basejs.replace("updateChrome();renderHome();renderCatalog();renderDetail();hydrate();icons()", "updateChrome();if(state.page==='home')renderHome();if(state.page==='catalog')renderCatalog();if(state.page==='detail'&&items.length)renderDetail();hydrate();icons();productionMeta()")
basejs=basejs.replace("function renderPoster(announce=false){let slides=posterSlides();", "function renderPoster(announce=false){let slides=posterSlides();$('#ps-poster').hidden=!slides.length;if(!slides.length)return;")
basejs=re.sub(r"const heroIds=\[[^;]*;", "const heroIds=items.filter(e=>e.media.length&&(!e.dates.length||e.dates.some(d=>d.date>new Date().toISOString().slice(0,10)))).sort((a,b)=>(a.type==='Мастер-классы'?-1:1)-(b.type==='Мастер-классы'?-1:1)).slice(0,3).map(e=>e.id);",basejs,count=1)
basejs=re.sub(r"const cities=\[[^;]*;", "const cities=payload.cities.map(c=>c.name);",basejs,count=1)
basejs=re.sub(r"const categories=\[[^;]*;", "const categories=Object.keys(payload.categories).map(t=>[t,'calendar-days',payload.categories[t]+' событий']);",basejs,count=1)
basejs=basejs.replace("event:\"ps-abaa7073555a5b88a4\"", "event:items[0]?.id||''")
basejs=basejs.replace("state.catalogPage=0;render();restore(window.openai?.widgetState);", "if(boot.event&&items.some(e=>e.id===boot.event)){state.page='detail';state.event=boot.event}state.catalogPage=0;render();restore(window.openai?.widgetState);initSiteNavigation();")
a=basejs.index('function drawVenueMap()');b=basejs.index('function renderLocation()',a);basejs=basejs[:a]+(H/'detail-map.production.js').read_text()+'\n'+basejs[b:]
a=basejs.index('function renderMap(a)');b=basejs.index('function renderContext(a)',a);basejs=basejs[:a]+(H/'map.production.js').read_text()+'\n'+basejs[b:]
# URL-aware transitions and persistent favourites use the same approved UI.
overrides=(H/'production.js').read_text();basejs=basejs.replace("if(boot.event&&items.some",overrides+"\nif(boot.event&&items.some",1)
basejs=basejs.replace("candidates=items.filter(e=>(!state.types.length", "candidates=[...items,...payload.alternatives].filter(e=>(!state.types.length")
basejs=basejs.replace("const heading=relaxed?", "const otherCities=candidates.some(e=>e.city!==cityConfig.name);const heading=otherCities?'В других городах '+(cityConfig.isMO?'Московской области':'России'):relaxed?")
basejs=basejs.replace("${relaxed?'Эти события", "${otherCities?'Эти программы проходят в других городах. Их город и даты указаны в карточках.':relaxed?'Эти события")
basejs=basejs.replace("area.hidden=!candidates.length;if(area.hidden)return;const otherCities", "let otherCategory=false;if(!candidates.length){candidates=payload.alternatives.filter(e=>!exact.some(x=>x.id===e.id)).slice(0,12);otherCategory=true}area.hidden=!candidates.length;if(area.hidden)return;const otherCities")
basejs=basejs.replace("const heading=otherCities?", "const heading=otherCategory?'Другие варианты досуга':otherCities?")
basejs=basejs.replace("${otherCities?'Эти программы", "${otherCategory?'Ниже — реальные события других категорий. Они не являются точным совпадением выбранной категории; город, место и даты указаны в карточках.':otherCities?'Эти программы")
# The original Moscow references are adapted per city below, keeping exact local dictionaries.
basejs=basejs.replace("readRoute();state.page='catalog';state.catalogPage=0;render()","readRoute();state.page=location.pathname.includes('/sobytie/')?'detail':(location.pathname===cityConfig.base&&!location.search?'home':'catalog');state.catalogPage=0;render()")
basejs=basejs.replace("'Все 12 округов'", "'Все округа'")
basejs=basejs.replace("const p=", "const p=")
basejs=basejs.replace("})();", "})().catch(()=>{const p=document.createElement('p');p.className='ps-load-error';p.textContent='Не удалось загрузить фильтры. События и ссылки доступны ниже. Обновите страницу.';document.querySelector('.ps-ssr')?.prepend(p)});",1)
# Add explicit city to event cards, not the donor's search namespace.
basejs=basejs.replace('<br>Москва${e.district', '<br>${esc(e.city)}${e.district')
basejs=basejs.replace("text='+encodeURIComponent('Москва '+e.address", "text='+encodeURIComponent(e.city+' '+e.address")
basejs=basejs.replace("encodeURIComponent('Москва '+current().address)","encodeURIComponent(current().city+' '+current().address)")
# Static rendering: unique metadata and crawlable cards exist before JS.
def esc(x):return html.escape(str(x or''),quote=True)
def eventpath(e):return bycity.get(e['city'],bycity['Московская область'])['base']+'sobytie/'+e['id']+'/'
def card(e):
 im='<img src="'+esc(e['media'][0]['url'])+'" alt="'+esc(e['title'])+'" loading="lazy">'if e['media']else'';p=e['priceData'];price='Бесплатно'if p['free_confirmed']else'Цена уточняется'if p['min']is None else'от '+str(p['min'])+' ₽'+(' '+p['unit']if p.get('unit')else'');date=e['date']if e['date']else'Расписание у площадки'
 return '<article class="ps-ssr-card"><a href="'+eventpath(e)+'">'+im+'<div><h2>'+esc(e['title'])+'</h2><p>'+esc(e['city']+' · '+e['place'])+'</p><p>'+esc(date+' · '+price)+'</p></div></a></article>'
nav='<div class="ps-chrome ps-chrome-header" data-navigation-version="'+chrome['version']+'">'+chrome['header']+'</div>';footer='<div class="ps-chrome ps-chrome-footer" data-navigation-version="'+chrome['version']+'">'+chrome['footer']+'</div>'
allurls=[];search=[];counts={};now=datetime.datetime.now(datetime.timezone.utc).isoformat();(OUT/'afisha').mkdir(exist_ok=True)
def write(path,c,title,description,content,event=None,schema=None):
 bootstrap={'data':'/afisha/data/'+c['slug']+'.json','event':event['id']if event else None,'eventData':event,'path':path};canonical='https://pro-schools.ru'+path;ld=schema or{'@context':'https://schema.org','@type':'CollectionPage','name':title,'url':canonical};scripts='<script type="application/ld+json">'+json.dumps(ld,ensure_ascii=False).replace('</','<\\/')+'</script><script id="ps-bootstrap" type="application/json">'+json.dumps(bootstrap,ensure_ascii=False).replace('</','<\\/')+'</script><script defer src="/afisha/assets/apps/'+c['slug']+'.js"></script>'
 page='<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title)+' | ProSchools</title><meta name="description" content="'+esc(description)+'"><link rel="canonical" href="'+canonical+'"><meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(description)+'"><meta property="og:url" content="'+canonical+'"><link rel="stylesheet" href="/site-navigation/navigation.css"><link rel="stylesheet" href="/afisha/assets/style.css"><script defer src="https://unpkg.com/lucide@0.468.0/dist/umd/lucide.min.js"></script></head><body><div id="ps-afisha-mock">'+nav+'<main id="main" class="ps-ssr"><nav><a href="/afisha/">Афиша России</a> / <a href="'+c['base']+'">'+esc(c['name'])+'</a></nav><h1>'+esc(title)+'</h1>'+content+'</main>'+footer+'</div>'+scripts+'</body></html>'
 f=OUT/path.strip('/')/'index.html';f.parent.mkdir(parents=True,exist_ok=True);f.with_suffix('.html.gz').write_bytes(gzip.compress(page.encode(),compresslevel=6,mtime=0));f.write_bytes(b'');allurls.append(canonical)
 if not event:search.append({'t':title,'u':path,'y':'afisha','s':c['name'],'k':description})
# Root is a genuine national landing, not a silent Moscow redirect.
country={'name':'Россия','slug':'russia','base':'/afisha/','inCity':'в России','isMO':False,'scope':'country','center':[65,57],'geography':{'districts':[],'okrugs':[],'stations':[]}}
seen['Россия']=sorted(all_events,key=lambda e:(not bool(e['media']),e['date']or'9999'));registry=[country]+registry;bycity['Россия']=country
for c in registry:
 c.update({'templateCity':'Москва','templatePrep':'Москве','templateGen':'Москвы'});name=c['name'];items=seen.get(name,[]);cats={cat:sum(cat in e.get('categories',[e['type']])for e in items)for cat in slugs};pool=[e for e in all_events if (not c['isMO']or e['city']in {x['name']for x in registry if x.get('isMO')})and e['city']!=name];alternatives=[]
 for cat in slugs:alternatives.extend([e for e in pool if cat in e.get('categories',[e['type']])][:6])
 alternatives=list({e['id']:e for e in alternatives}.values());payload={'config':c,'items':items,'categories':cats,'cities':[{k:x[k]for k in ['name','base','isMO']}for x in registry],'alternatives':alternatives,'checked_at':now,'guide':city_guide(c,items,slugs),'directory':city_directory(c,registry)};compressed(OUT/'afisha/data'/f"{c['slug']}.json",json.dumps(payload,ensure_ascii=False,separators=(',',':')))
 script=basejs.replace("timeZone:'Europe/Moscow'","timeZone:cityConfig.timezone||'Europe/Moscow'").replace('Время московское','Местное время').replace("'/afisha/moskva/'",json.dumps(c['base'],ensure_ascii=False)).replace('в Москве',c['inCity']).replace('по Москве','по городу '+name).replace('Москвы',name).replace('Москва',name).replace('[37.62,55.75]',json.dumps(c.get('center')or[37.62,55.75]))
 compressed(A/'apps'/f"{c['slug']}.js",script)
 if os.environ.get('AFISHA_ONLY_ASSETS')=='1':continue
 links='<div class="ps-ssr-links">'+''.join('<a href="'+c['base']+v+'/">'+esc(k)+' ('+str(cats[k])+')</a>'for k,v in slugs.items())+'</div>'
 citylinks='<div class="ps-ssr-links">'+''.join('<a href="'+x['base']+'">'+esc(x['name'])+'</a>'for x in registry if x['name']!=name and(x.get('isMO')if c.get('isMO')else True))+'</div>'
 for cat in [None]+list(slugs):
  selected=[e for e in items if not cat or cat in e.get('categories',[e['type']])];title=(catheads[cat].replace('в Москве',c['inCity'])if cat else'Афиша для детей '+c['inCity']);path=c['base']+(slugs[cat]+'/'if cat else'');description=title+'. '+str(len(selected))+' событий: даты, цены, возраст, площадки и Яндекс Карты.';body='<p>'+esc(description)+'</p>'+links
  body+='<div class="ps-ssr-grid">'+''.join(card(e)for e in selected[:24])+'</div>'
  if len(selected)<6:
   alt=[e for e in alternatives if not cat or cat in e.get('categories',[e['type']])][:6];other_category=not bool(alt);alt=alt or alternatives[:6];body+=('<h2>Другие варианты досуга</h2><p>Это реальные события других категорий. Они не являются точным совпадением выбранной категории. Смотрите город и дату в карточке.</p>'if other_category else'<h2>В других городах '+('Московской области'if c.get('isMO')else'России')+'</h2><p>Эти события проходят в других городах. Смотрите город, адрес и дату в карточке.</p>')+'<div class="ps-ssr-grid">'+''.join(card(e)for e in alt)+'</div>'
  if cat:cp=[v.replace('в Москве',c['inCity']).replace('Москвы',c['name'])for v in copies[cat]];body+='<h2>'+esc(cp[0])+'</h2><p>'+esc(cp[1])+'</p><h2>'+esc(cp[2])+'</h2><p>'+esc(cp[3])+'</p>'
  body+=city_directory(c,registry)
  if not cat:body+=city_guide(c,items,slugs)
  write(path,c,title,description,body)
 counts[name]={'events':len(items),'categories':cats,'base':c['base']}
if os.environ.get('AFISHA_ONLY_ASSETS')=='1':
 print('Shared assets updated for',len(registry),'geographic pages');raise SystemExit(0)
# Canonical event URL belongs to the actual venue city; region repeats are links only.
for e in all_events:
 c=bycity.get(e['city']);
 if not c:continue
 path=eventpath(e);title=e['title']+' — '+e['city'];description=e['title']+'. '+e['place']+'. '+e['address'];body=card(e)+'<h2>Где проходит</h2><p>'+esc(e['place']+' · '+e['address'])+'</p><p><a href="'+esc(e['sources'][0]['url'])+'" rel="nofollow noopener" target="_blank">Расписание, билеты и условия у организатора</a></p>'
 if e.get('about'):body+='<p>'+esc(e['about'])+'</p>'
 ld={'@context':'https://schema.org','@type':'Event','name':e['title'],'url':'https://pro-schools.ru'+path,'location':{'@type':'Place','name':e['place'],'address':e['address']}}
 if e['dates']:ld['startDate']=e['dates'][0]['date']+'T'+e['dates'][0]['time'].split('–')[0]+':00'
 if e['media']:ld['image']=[m['url']for m in e['media'][:3]]
 write(path,c,title,description,body,event=e,schema=ld)
xml='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>'+esc(u)+'</loc></url>'for u in allurls)+'</urlset>'
(OUT/'afisha/sitemap.xml').write_text(xml);(OUT/'afisha/cities.json').write_text(json.dumps([{k:c.get(k)for k in ['name','slug','base','inCity','isMO']}for c in registry],ensure_ascii=False));(OUT/'afisha/search-index.json').write_text(json.dumps(search,ensure_ascii=False));(OUT/'afisha/status.json').write_text(json.dumps({'published_at':now,'cities':len(registry)-2,'moscow_oblast_cities':sum(x.get('isMO',False)and x.get('scope')!='region'for x in registry),'unique_events':len(all_events),'pages':len(allurls),'refresh_interval_hours':48,'coverage':counts},ensure_ascii=False,indent=2));print('Built',len(allurls),'pages;',len(all_events),'events')
