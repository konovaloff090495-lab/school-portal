# coding: utf-8
import pathlib,json,re,os,html,hashlib,datetime,base64,shutil,ast,gzip,sys
from bs4 import BeautifulSoup
from guide import city_guide,city_directory
from selections import TOPICS,select,landing_specs,selection_copy
R=pathlib.Path(os.environ.get('AFISHA_ROOT',pathlib.Path(__file__).resolve().parents[2]));P=R/'work/afisha-production';H=pathlib.Path(__file__).parent;OUT=pathlib.Path(os.environ.get('AFISHA_RELEASE',P/'release'));A=OUT/'afisha/assets';A.mkdir(parents=True,exist_ok=True);(A/'apps').mkdir(exist_ok=True);(OUT/'afisha/data').mkdir(exist_ok=True)
TEMPORAL=os.environ.get('AFISHA_TEMPORAL_ONLY')=='1';history_path=pathlib.Path(os.environ.get('AFISHA_PUBLISHED_SELECTIONS',str(P/'published-selections.json')));history=json.loads(history_path.read_text())if history_path.exists()else{};next_history={k:dict(v)for k,v in history.items()};
def shared_values(row):
 # Source calendars repeat the same dates, venue URLs and locality thousands of times.
 for key,value in row.items():
  if isinstance(value,str)and key in ['date','time','iso','endIso','source','timezone','city','place','address']:row[key]=sys.intern(value)
  elif key=='slots'and isinstance(value,list):row[key]=[sys.intern(v)if isinstance(v,str)else v for v in value]
 return row
registry=json.loads((P/'registry.json').read_text());all_events=json.loads((P/'events.json').read_text(),object_hook=shared_values);bycity={c['name']:c for c in registry};seen={c['name']:[]for c in registry}
for event_row in all_events:
 if event_row.get('listingStatus')in ['age_review','published_dates_finished']:continue
 if event_row['city']in seen:seen[event_row['city']].append(event_row)
 if event_row['city']!='Московская область'and bycity.get(event_row['city'],{}).get('isMO'):seen['Московская область'].append(event_row)
basejs=(H/'app.template.js').read_text();shell=BeautifulSoup((H/'shell.template.html').read_text(),'html.parser');root=shell.select_one('#ps-afisha-mock')or shell
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
shelltext=''.join(str(x)for x in root.contents).replace('Организатор мероприятия','Площадка мероприятия')
if not TEMPORAL:(A/'shell.html.gz').write_bytes(gzip.compress(shelltext.encode(),compresslevel=6));(A/'shell.html').write_bytes(b'')
css=(H/'style.template.css').read_text()+'''\n#ps-afisha-mock{border:0!important;border-radius:0!important;max-width:none!important}#ps-afisha-mock .ps-site-viewport{height:100dvh!important;max-height:none!important;border-radius:0!important}#ps-afisha-mock .ps-design-bar,#ps-afisha-mock .ps-mock-toolbar,#ps-afisha-mock .ps-prototype-note{display:none!important}#ps-afisha-mock .ps-city-options{max-height:60vh;overflow:auto}#ps-afisha-mock .ps-city-options button{text-align:left} .ps-ssr{max-width:1180px;margin:0 auto;padding:32px 24px}.ps-ssr-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:22px}.ps-ssr a{color:inherit}.ps-ssr-card{border:1px solid #e5dccf;border-radius:18px;overflow:hidden;background:#fffdf8}.ps-ssr-card img{width:100%;height:190px;object-fit:cover}.ps-ssr-card div{padding:18px}.ps-ssr-links{display:flex;flex-wrap:wrap;gap:12px;margin:24px 0}.ps-ssr-links a{border:1px solid #ded7cc;border-radius:20px;padding:9px 14px}.ps-load-error{padding:20px;background:#fff1dd;border-radius:12px}\n'''
if not TEMPORAL:(A/'style.css').write_text(css)
def compressed(path,text):
 gz=path.with_suffix(path.suffix+'.gz');tmp=gz.with_suffix(gz.suffix+'.incoming');tmp.write_bytes(gzip.compress(text.encode(),compresslevel=6,mtime=0));tmp.replace(gz);path.write_bytes(b'')
# Reuse existing illustrative assets only in the home-learning bridge, not event cards.
m=re.search(r'const assets=(\{.*?\});',basejs,re.S);assets=json.loads(m[1]);urls={}
for name,data in assets.items():
 if data.startswith('data:image/'):
  ext='png'if'image/png'in data[:30]else'jpg';file='learning-'+name+'.'+ext;(A/file).write_bytes(base64.b64decode(data.split(',',1)[1]))if not TEMPORAL else None;urls[name]='/afisha/assets/'+file
basejs=basejs[:m.start(1)]+json.dumps(urls)+basejs[m.end(1):]
for name in ['items','geography','mapGeo']:
 token='const '+name+'=';start=basejs.index(token)+len(token);obj,end=json.JSONDecoder().raw_decode(basejs[start:]);replace='payload.items'if name=='items'else'payload.config.geography'if name=='geography'else'{type:"FeatureCollection",features:[]}'
 basejs=basejs[:start]+replace+basejs[start+end:]
slugs=ast.literal_eval(re.search(r'const categorySlugs=(\{.*?\});',basejs,re.S)[1]);copies=ast.literal_eval(re.search(r'const categoryCopy=(\{.*?\});',basejs,re.S)[1]);catheads=ast.literal_eval(re.search(r'const categoryHeadings=(\{.*?\});',basejs,re.S)[1])
basejs=basejs.replace('const priceText=', 'let priceText=').replace('const dateText=', 'let dateText=').replace('const sourceName=', 'let sourceName=').replace('const todayISO=', 'let todayISO=')
basejs=basejs.replace('(()=>{','(async()=>{',1)
setup="""const boot=JSON.parse(document.getElementById('ps-bootstrap').textContent);const [response,fragment]=await Promise.all([fetch(boot.data),fetch('/afisha/assets/shell.html?v='+boot.version)]);if(!response.ok||!fragment.ok)throw Error('Catalogue temporarily unavailable');const payload=await response.json();const needsCatalogue=!boot.event&&(location.pathname!==payload.config.base||location.search||location.hash==='#catalog');if(needsCatalogue&&payload.catalogData){const r=await fetch(payload.catalogData);if(!r.ok)throw Error('catalogue');payload.items=await r.json();payload.fullLoaded=true}if(boot.eventData){const i=payload.items.findIndex(e=>e.id===boot.eventData.id);if(i>=0)payload.items[i]=boot.eventData;else payload.items.push({...boot.eventData,archived:!!boot.eventData.archived||boot.builtAt!==payload.checked_at})}document.getElementById('ps-afisha-mock').innerHTML=await fragment.text();const cityConfig=payload.config;for(const id of ['ps-home','ps-catalog','ps-detail']){const section=document.getElementById(id);if(section)section.innerHTML=section.innerHTML.replaceAll('в '+cityConfig.templatePrep,cityConfig.inCity).replaceAll(cityConfig.templateGen,cityConfig.name).replaceAll(cityConfig.templateCity,cityConfig.name)};"""
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
basejs=basejs.replace("render();restore(window.openai?.widgetState);", "if(boot.event&&items.some(e=>e.id===boot.event)){state.page='detail';state.event=boot.event}render();restore(window.openai?.widgetState);initSiteNavigation();")
a=basejs.index('function drawVenueMap()');b=basejs.index('function renderLocation()',a);basejs=basejs[:a]+(H/'detail-map.production.js').read_text()+'\n'+basejs[b:]
a=basejs.index('function renderMap(a)');b=basejs.index('function renderContext(a)',a);basejs=basejs[:a]+(H/'map.production.js').read_text()+'\n'+basejs[b:]
basejs=basejs.replace('const count=items.filter(e=>(!state.types.length||state.types.some(t=>(e.categories||[e.type]).includes(t)))&&e.dates.some(p=>p.date===iso)).length;','const count=calendarCount(iso);')
basejs=basejs.replace('panel.innerHTML=html;panel.querySelector',"const focusedDate=document.activeElement?.dataset.calDate,focusedMonth=document.activeElement?.dataset.month;panel.innerHTML=html;if(focusedDate)panel.querySelector('[data-cal-date=\"'+focusedDate+'\"]')?.focus();else if(focusedMonth)panel.querySelector('[data-month=\"'+focusedMonth+'\"]')?.focus();panel.querySelector")
# URL-aware transitions and persistent favourites use the same approved UI.
overrides=(H/'production.js').read_text()+'\n'+(H/'experience.production.js').read_text();basejs=basejs.replace("if(boot.event&&items.some",overrides+"\nif(boot.event&&items.some",1)
basejs=basejs.replace("candidates=items.filter(e=>(!state.types.length", "candidates=[...items,...payload.alternatives].filter(e=>(!state.types.length")
basejs=basejs.replace("const heading=relaxed?", "const otherCities=candidates.some(e=>e.city!==cityConfig.name);const heading=otherCities?'В других городах '+(cityConfig.isMO?'Московской области':'России'):relaxed?")
basejs=basejs.replace("${relaxed?'Эти события", "${otherCities?'Эти программы проходят в других городах. Их город и даты указаны в карточках.':relaxed?'Эти события")
basejs=basejs.replace("area.hidden=!candidates.length;if(area.hidden)return;const otherCities", "let otherCategory=false;if(!candidates.length){candidates=payload.alternatives.filter(e=>!exact.some(x=>x.id===e.id)).slice(0,12);otherCategory=true}area.hidden=!candidates.length;if(area.hidden)return;const otherCities")
basejs=basejs.replace("const heading=otherCities?", "const heading=otherCategory?'Другие варианты досуга':otherCities?")
basejs=basejs.replace("${otherCities?'Эти программы", "${otherCategory?'Ниже — реальные события других категорий. Они не являются точным совпадением выбранной категории; город, место и даты указаны в карточках.':otherCities?'Эти программы")
# The original Moscow references are adapted per city below, keeping exact local dictionaries.
basejs=basejs.replace("readRoute();state.page='catalog';state.catalogPage=0;render()","readRoute();state.page=location.pathname.includes('/sobytie/')?'detail':(location.pathname===cityConfig.base&&!location.search?'home':'catalog');render()")
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
if not TEMPORAL:compressed(A/'header.html',nav);compressed(A/'footer.html',footer)
allurls=[];search=[];counts={};now=datetime.datetime.now(datetime.timezone.utc).isoformat();version=hashlib.sha256(now.encode()).hexdigest()[:12];(OUT/'afisha').mkdir(exist_ok=True)
if TEMPORAL or os.environ.get('AFISHA_ONLY_ASSETS')=='1':
 snapshot=json.loads(gzip.decompress((OUT/'afisha/data/russia.json.gz').read_bytes()));now=snapshot['checked_at'];version=snapshot['catalogData'].split('?v=')[-1]
def write(path,c,title,description,content,event=None,schema=None):
 bootstrap={'data':'/afisha/data/'+c['slug']+'.json?v='+version,'version':version,'event':event['id']if event else None,'eventData':event,'path':path,'builtAt':now,'title':title};canonical='https://pro-schools.ru'+path;ld=schema or{'@context':'https://schema.org','@type':'CollectionPage','name':title,'url':canonical};scripts='<script type="application/ld+json">'+json.dumps(ld,ensure_ascii=False).replace('</','<\\/')+'</script><script id="ps-bootstrap" type="application/json">'+json.dumps(bootstrap,ensure_ascii=False).replace('</','<\\/')+'</script><script defer src="/afisha/assets/apps/'+c['slug']+'.js?v='+version+'"></script>'
 page='<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title)+' | ProSchools</title><meta name="description" content="'+esc(description)+'"><link rel="canonical" href="'+canonical+'"><meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(description)+'"><meta property="og:url" content="'+canonical+'"><link rel="stylesheet" href="/site-navigation/navigation.css"><link rel="stylesheet" href="/afisha/assets/style.css?v='+version+'"><script defer src="https://unpkg.com/lucide@0.468.0/dist/umd/lucide.min.js"></script></head><body><div id="ps-afisha-mock">'+'<!--ps-header-->'+'<main id="main" class="ps-ssr"><nav><a href="/afisha/">Афиша России</a> / <a href="'+c['base']+'">'+esc(c['name'])+'</a></nav><h1>'+esc(title)+'</h1>'+content+'</main>'+'<!--ps-footer-->'+'</div>'+scripts+'</body></html>'
 f=OUT/path.strip('/')/'index.html';f.parent.mkdir(parents=True,exist_ok=True);compressed(f,page);allurls.append(canonical)
 if not event:search.append({'t':title,'u':path,'y':'afisha','s':c['name'],'k':description})
# Root is a genuine national landing, not a silent Moscow redirect.
country={'name':'Россия','slug':'russia','base':'/afisha/','inCity':'в России','isMO':False,'scope':'country','center':[65,57],'geography':{'districts':[],'okrugs':[],'stations':[]}}
seen['Россия']=sorted([e for e in all_events if e.get('listingStatus')not in ['age_review','published_dates_finished']],key=lambda e:(not bool(e['media']),e['date']or'9999'));registry=[country]+registry;bycity['Россия']=country
def slim(e,front=False):
 result={k:v for k,v in e.items()if k not in ['about','result','priceNote','attendanceNote','preparation','contentSource','contentChecked','venueSchedule','coordinate_source','coordinate_precision','coordinate_address','coordinate_checked_at','address_source','slots']}
 dates=e.get('dates',[])[:60]if front else e.get('dates',[])
 result['slots']=[d['iso']for d in dates];result['about']=(e.get('about')or'')[:160];result['media']=e.get('media',[])[:1];result['dates']=[{k:v for k,v in d.items()if k in ['date','time','iso','endIso','kind']}for d in dates];return result

def front_events(events,c):
 from zoneinfo import ZoneInfo
 today=datetime.datetime.now(ZoneInfo(c.get('timezone')or'Europe/Moscow')).date();chosen={}
 for offset in range(7):
  date=(today+datetime.timedelta(days=offset)).isoformat()
  matches=[e for e in events if any(d['date']==date for d in e.get('dates',[]))]
  for e in sorted(matches,key=lambda e:(not bool(e.get('media')),e.get('type')!='Мастер-классы'))[:6]:chosen[e['id']]=e
 for e in events:
  if len(chosen)>=48:break
  chosen.setdefault(e['id'],e)
 return list(chosen.values())[:48]

def compressed_catalog(path,events):
 target=path.with_name(path.name+'.gz');temp=target.with_name(target.name+'.incoming')
 with gzip.open(temp,'wt',encoding='utf-8',compresslevel=6)as f:
  f.write('[')
  for index,event in enumerate(events):
   if index:f.write(',')
   json.dump(slim(event),f,ensure_ascii=False,separators=(',',':'))
  f.write(']')
 temp.replace(target);path.write_bytes(b'')

def pagination(path,page,total):
 return '<nav class="ps-ssr-links" aria-label="Страницы каталога">'+''.join('<a href="'+path+('page/'+str(n)+'/'if n>1 else'')+'"'+(' aria-current="page"'if n==page else'')+'>'+str(n)+'</a>'for n in sorted({1,max(1,page-1),page,min(total,page+1),total}))+'</nav>'if total>1 else''

def eventfacts(e):
 rows=[('Возрастной ценз',str(e['ageRestriction'])+'+'if e['ageRestriction']is not None else'Не опубликован'),('Возрастная аудитория',(e.get('recommendedAgeLabel')or str(e['recommendedAge'][0])+'–'+str(e['recommendedAge'][1])+' лет')if e.get('recommendedAge')else'Не опубликована'),('Длительность',e.get('duration')or'Не опубликована'),('Состав билета',e.get('priceNote')or e['priceData'].get('unit')or'Единица цены не опубликована'),('Сопровождение и запись',e.get('attendanceNote')or'Условия уточните у площадки')]
 return '<dl>'+''.join('<dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd>'for k,v in rows)+'</dl>'

def selection_navigation(c,items,include_venues=False):
 specs=list(landing_specs(c,items,slugs,catheads))
 def link(x,label=None):return '<a href="'+c['base']+x[0]+'" title="'+esc(x[-1])+'">'+esc(label or x[-1])+'</a>'
 labels={'besplatno':'Бесплатно','vykhodnye':'На выходных','segodnya':'Сегодня','zavtra':'Завтра','free_weekend':'Бесплатно на выходных','novyy-god':'Новый год'}
 primary='<nav class="ps-selection-nav" aria-label="Популярные подборки">'+''.join(link(x,labels[x[2]])for x in specs if not x[1]and x[2]in labels)+'</nav>'
 ages='<details class="ps-venue-nav"><summary>Возраст ребёнка</summary>'+''.join(link(x,x[3].split('-')[0]+' лет'if len(set(x[3].split('-')))==1 else x[3].replace('-','–')+' лет')for x in specs if x[3])+'</details>'
 topics='<details class="ps-venue-nav"><summary>Темы мастер-классов</summary>'+''.join(link(x,TOPICS[x[4]]['title'])for x in specs if x[4])+'</details>'
 places='<details class="ps-venue-nav"><summary>Афиша по площадкам</summary>'+''.join(link(x)for x in specs if x[5])+'</details>'if include_venues else''
 return primary+ages+topics+places

for c in registry:
 if os.environ.get('AFISHA_TEST_CITIES')and c['slug']not in os.environ['AFISHA_TEST_CITIES'].split(','):continue
 c.update({'templateCity':'Москва','templatePrep':'Москве','templateGen':'Москвы'});name=c['name'];items=seen.get(name,[]);cats={cat:sum(cat in e.get('categories',[e['type']])for e in items)for cat in slugs};pool=[e for e in all_events if e.get('listingStatus')not in ['age_review','published_dates_finished']and(not c['isMO']or e['city']in {x['name']for x in registry if x.get('isMO')})and e['city']!=name];alternatives=[]
 for cat in slugs:alternatives.extend([e for e in pool if cat in e.get('categories',[e['type']])][:6])
 alternatives=list({e['id']:e for e in alternatives}.values());catalogData='/afisha/data/'+c['slug']+'-catalog.json';
 if not TEMPORAL:compressed_catalog(OUT/catalogData.strip('/'),items)
 payload={'config':c,'items':[slim(e,True)for e in front_events(items,c)],'total':len(items),'catalogData':catalogData+'?v='+version,'categories':cats,'topics':{k:{'title':v['title']}for k,v in TOPICS.items()},'cities':[{k:x[k]for k in ['name','base','isMO']}for x in registry],'alternatives':[slim(e,True)for e in alternatives],'checked_at':now,'guide':city_guide(c,items,slugs),'directory':city_directory(c,registry),'selectionNavigation':selection_navigation(c,items,True)};
 if not TEMPORAL:compressed(OUT/'afisha/data'/f"{c['slug']}.json",json.dumps(payload,ensure_ascii=False,separators=(',',':')))
 if not TEMPORAL:script=basejs.replace("timeZone:'Europe/Moscow'","timeZone:cityConfig.timezone||'Europe/Moscow'").replace('Время московское','Местное время').replace("'/afisha/moskva/'",json.dumps(c['base'],ensure_ascii=False)).replace('в Москве',c['inCity']).replace('по Москве','по городу '+name).replace('Москвы',name).replace('Москва',name).replace('[37.62,55.75]',json.dumps(c.get('center')or[37.62,55.75]))
 if not TEMPORAL:compressed(A/'apps'/f"{c['slug']}.js",script)
 if os.environ.get('AFISHA_ONLY_ASSETS')=='1':continue
 current_specs=list(landing_specs(c,items,slugs,catheads));spec_map={x[0]:x for x in current_specs};old_specs=history.get(c['slug'],{});next_history.setdefault(c['slug'],{})
 for tail,record in old_specs.items():spec_map.setdefault(tail,tuple(record['spec']))
 specs=list(spec_map.values())
 if TEMPORAL:specs=[x for x in specs if x[2]in ['segodnya','zavtra','vykhodnye','free_weekend','novyy-god']]
 links='<div class="ps-ssr-links">'+''.join('<a href="'+c['base']+v+'/">'+esc(k)+' ('+str(cats[k])+')</a>'for k,v in slugs.items())+'</div>'
 scenarioLinks=selection_navigation(c,items)
 venueLinks='<details><summary>Афиша по площадкам</summary><div class="ps-ssr-links">'+''.join('<a href="'+c['base']+tail+'">'+esc(title)+'</a>'for tail,cat,mode,age,topic,venue,title in specs if venue)+'</div></details>'
 for tail,cat,mode,age,topic,venue,title in specs:
  selected=select(items,c,cat,mode,age,topic,venue);path=c['base']+tail;description=title+'. '+str(len(selected))+' событий: программа, даты, возрастная аудитория, цены и адреса.';copy=selection_copy(c,selected,mode,age,topic,venue);pages=max(1,(len(selected)+23)//24,old_specs.get(tail,{}).get('pages',1));next_history[c['slug']][tail]={'spec':[tail,cat,mode,age,topic,venue,title],'pages':pages}
  for page in range(1,pages+1):
   pagepath=path+('page/'+str(page)+'/'if page>1 else'');pageTitle=title+(' — страница '+str(page)if page>1 else'');body='<p>'+esc(copy)+'</p>'+links+scenarioLinks+('<nav class="ps-ssr-links">'+''.join('<a href="'+c['base']+x[0]+'">'+esc(x[-1])+'</a>'for x in specs if cat and x[1]==cat and x[2]in ['besplatno','vykhodnye','free_weekend'])+'</nav>'if cat else'')
   body+='<div class="ps-ssr-grid">'+''.join(card(e)for e in selected[(page-1)*24:page*24])+'</div>'+pagination(path,page,pages)
   if page>1 and not selected[(page-1)*24:page*24]:body+='<h2>Актуальные события подборки</h2><p>На этой странице сейчас нет сеансов. <a href="'+path+'">Откройте начало подборки</a> или посмотрите актуальные варианты ниже.</p><div class="ps-ssr-grid">'+''.join(card(e)for e in selected[:6])+'</div>'
   if len(selected)<6:
    alt=[e for e in items if e not in selected and(not cat or cat in e.get('categories',[e['type']]))and(not age or(not e.get('recommendedAge')and not e.get('ageConflict')and(e.get('ageRestriction')is None or e['ageRestriction']<=int(age.split('-')[0]))))and(mode not in ['besplatno','free_weekend']or e['priceData']['free_confirmed'])][:6];alt=alt or[e for e in alternatives if not cat or cat in e.get('categories',[e['type']])][:6];alt=alt or alternatives[:6];body+='<h2>Другие варианты — проверьте город, дату и условия</h2><p>Это реальные события с другими условиями. Они не являются точными совпадениями этой подборки.</p><div class="ps-ssr-grid">'+''.join(card(e)for e in alt)+'</div>'
   body+='<h2>Как выбрать событие</h2><p>'+esc(copy)+'</p><p>Возрастной ценз не заменяет рекомендацию организатора. Сравните длительность, состав билета, участие взрослого и способ записи. Наличие мест подтвердите у площадки.</p>'
   if page==1:
    if cat:cp=[v.replace('в Москве',c['inCity']).replace('Москвы',c['name'])for v in copies[cat]];body+='<h2>'+esc(cp[0])+'</h2><p>'+esc(cp[1])+'</p>'
    if not tail:body+=city_directory(c,registry)+city_guide(c,items,slugs)+venueLinks
   write(pagepath,c,pageTitle,description,body)
 counts[name]={'events':len(items),'categories':cats,'base':c['base']}
if os.environ.get('AFISHA_ONLY_ASSETS')=='1':
 print('Shared assets updated for',len(registry),'geographic pages');raise SystemExit(0)
if TEMPORAL:
 registry_temp=history_path.with_suffix('.incoming');registry_temp.write_text(json.dumps(next_history,ensure_ascii=False,separators=(',',':')));registry_temp.replace(history_path);print('Date selections recalculated from the published snapshot; no source requests');raise SystemExit(0)
(OUT/'afisha/published-selections.json').write_text(json.dumps(next_history,ensure_ascii=False,separators=(',',':')))
for e in all_events:
 c=bycity.get(e['city'])
 if not c:continue
 if os.environ.get('AFISHA_TEST_CITIES')and c['slug']not in os.environ['AFISHA_TEST_CITIES'].split(','):continue
 path=eventpath(e);title=e['title']+' — '+e['city'];description=(e.get('about')or e['title']+'. '+e['place']+'. '+e['address'])[:250];body=(('<p>Возраст источника изменился на 18+. Событие исключено из детского каталога; условия приведены для справки.</p>'if e.get('listingStatus')=='age_review'else'')+card(e)+'<h2>Что будет на мероприятии</h2>')
 body+=('<p>'+esc(e['about'])+'</p><p>Краткая выдержка из программы организатора. <a href="'+esc(e.get('contentSource')or e['sources'][0]['url'])+'" rel="nofollow noopener">Полная программа</a>.</p>'if e.get('about')else'<p>Подробная программа в доступном источнике пока не опубликована. Уточните действия участника до записи.</p>')
 if e.get('ageConflict'):body+='<p>Возрастные сведения в источнике различаются. Уточните допустимый возраст у организатора.</p>'
 body+=eventfacts(e)+'<h2>Где проходит</h2><p>'+esc(e['place']+' · '+e['address'])+'</p><h2>Опубликованные сеансы</h2>'+(''.join('<p>'+esc(d['date']+' · '+d['time'])+' · местное время</p>'for d in e['dates'][:50])if e['dates']else'<p>Точный будущий сеанс уточните у площадки.</p>')+'<p><a href="'+esc(e.get('bookingUrl')or e['sources'][0]['url'])+'" rel="nofollow noopener" target="_blank">'+('Билеты и запись на сайте площадки'if e.get('bookingUrl')else'Условия в источнике')+'</a></p>'
 ld={'@context':'https://schema.org','@type':'Event'if not e.get('archived')and e['dates']and e['dates'][0].get('kind')!='booking_window'else'WebPage','name':e['title'],'url':'https://pro-schools.ru'+path,'description':description}
 if not e.get('archived')and e['dates']and e['dates'][0].get('kind')!='booking_window':
  ld['startDate']=e['dates'][0].get('iso')or e['dates'][0]['date']+'T'+e['dates'][0]['time']+':00';ld['location']={'@type':'Place','name':e['place'],'address':{'@type':'PostalAddress','streetAddress':e['address'],'addressLocality':e['city'],'addressCountry':'RU'}}
  if e.get('setting')=='online':ld['location']={'@type':'VirtualLocation','url':e.get('bookingUrl')or e['sources'][0]['url']};ld['eventAttendanceMode']='https://schema.org/OnlineEventAttendanceMode'
  if e.get('coordinates')and e.get('setting')!='online':ld['location']['geo']={'@type':'GeoCoordinates','longitude':e['coordinates'][0],'latitude':e['coordinates'][1]}
  if e['priceData'].get('min')is not None and(e['priceData']['min']>0 or e['priceData']['free_confirmed']):ld['offers']={'@type':'Offer','price':e['priceData']['min'],'priceCurrency':'RUB','url':e.get('bookingUrl')or e['sources'][0]['url']}
 if e['media']:ld['image']=[m['url']for m in e['media'][:3]]
 write(path,c,title,description,body,event=e,schema=ld)
def sitemap_urls(path):
 import xml.etree.ElementTree as ET
 tree=ET.parse(path).getroot();values=[node.text for node in tree if node.tag.endswith('url')or node.tag.endswith('sitemap')]
 if tree.tag.endswith('sitemapindex'):
  result=[]
  for node in tree:
   u=next(x.text for x in node if x.tag.endswith('loc'));result+=sitemap_urls(OUT/u.replace('https://pro-schools.ru/',''))
  return result
 return[next(x.text for x in node if x.tag.endswith('loc'))for node in tree]
previous=pathlib.Path(os.environ['AFISHA_PREVIOUS_RELEASE'])if os.environ.get('AFISHA_PREVIOUS_RELEASE')else None
if previous and(previous/'afisha/sitemap.xml').exists():
 import xml.etree.ElementTree as ET
 def old_urls(p):
  t=ET.parse(p).getroot()
  if t.tag.endswith('sitemapindex'):return sum([old_urls(previous/next(x.text for x in node if x.tag.endswith('loc')).replace('https://pro-schools.ru/',''))for node in t],[])
  return[next(x.text for x in node if x.tag.endswith('loc'))for node in t]
 known=set(allurls)
 for url in old_urls(previous/'afisha/sitemap.xml'):
  if url in known:continue
  path=url.replace('https://pro-schools.ru/','');source=previous/path/'index.html.gz';dest=OUT/path/'index.html.gz'
  if not source.exists():continue
  body=gzip.decompress(source.read_bytes()).decode()
  if'/sobytie/'in path:
   tree=BeautifulSoup(body,'html.parser');node=tree.select_one('#ps-bootstrap')
   if node:
    data=json.loads(node.string);data['eventData']['archived']=True;node.string=json.dumps(data,ensure_ascii=False).replace('</','<\\/')
   main=tree.select_one('#main')
   if main:main.insert(1,BeautifulSoup('<p>Событие отсутствует в текущем источнике. Актуальность, даты и условия уточните у организатора; публикация сохранена для справки.</p>','html.parser'))
   schema=tree.select_one('script[type="application/ld+json"]')
   if schema:
    ld=json.loads(schema.string);ld['@type']='WebPage'
    for key in ['startDate','endDate','offers','eventAttendanceMode']:ld.pop(key,None)
    schema.string=json.dumps(ld,ensure_ascii=False).replace('</','<\\/')
   body=str(tree)
  dest.parent.mkdir(parents=True,exist_ok=True);compressed(dest.with_suffix(''),body);allurls.append(url);known.add(url)
header='<?xml version="1.0" encoding="UTF-8"?>'
def xml_urls(urls):return header+'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>'+esc(u)+'</loc></url>'for u in urls)+'</urlset>'
if len(allurls)<=45000:(OUT/'afisha/sitemap.xml').write_text(xml_urls(allurls))
else:
 parts=[]
 for offset in range(0,len(allurls),40000):
  name='sitemap-'+str(offset//40000+1)+'.xml';(OUT/'afisha'/name).write_text(xml_urls(allurls[offset:offset+40000]));parts.append('https://pro-schools.ru/afisha/'+name)
 (OUT/'afisha/sitemap.xml').write_text(header+'<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<sitemap><loc>'+esc(u)+'</loc></sitemap>'for u in parts)+'</sitemapindex>')
(OUT/'afisha/cities.json').write_text(json.dumps([{k:c.get(k)for k in ['name','slug','base','inCity','isMO']}for c in registry],ensure_ascii=False));(OUT/'afisha/search-index.json').write_text(json.dumps(search,ensure_ascii=False));(OUT/'afisha/status.json').write_text(json.dumps({'published_at':now,'cities':len(registry)-2,'moscow_oblast_cities':sum(x.get('isMO',False)and x.get('scope')!='region'for x in registry),'unique_events':len(all_events),'pages':len(allurls),'refresh_interval_hours':48,'coverage':counts},ensure_ascii=False,indent=2));print('Built',len(allurls),'pages;',len(all_events),'events')
