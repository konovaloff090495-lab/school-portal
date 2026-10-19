"""Apply the approved courses UI to freshly rendered, policy-checked course HTML.

The core renderer owns facts, inventory, price expiry, indexing and JSON-LD.
This layer owns presentation only. It never writes outside the section output.
"""
from pathlib import Path
import html,json,re,shutil,importlib.util,hashlib
from bs4 import BeautifulSoup
HERE=Path(__file__).resolve().parent
BASE='https://pro-schools.ru'

def text(node):return node.get_text(' ',strip=True) if node else ''
def module(name,file):
 spec=importlib.util.spec_from_file_location(name,HERE/file);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m

def apply(out,source):
 out=Path(out);source=Path(source)
 courses_source={c['id']:c for c in json.loads((source/'catalog.json').read_text()) if c.get('active')}
 configs={c['id']:c for c in json.loads((source/'categories.json').read_text())}
 docs={}
 for file in out.rglob('index.html'):
  slug=file.parent.relative_to(out).as_posix();slug='' if slug=='.' else slug
  docs[slug]=BeautifulSoup(file.read_text(),'html.parser')
 root=docs[''];cards=root.select('[data-course-card]')
 cards_by_id={a.select_one('h3 a')['href'].rstrip('/').split('/')[-1]:a for a in cards}
 assert set(cards_by_id)==set(courses_source),'Generated course inventory must equal active source'
 categories=[];landings=[];brands=[];metadata={}
 for slug,doc in docs.items():
  path='/kursy/'+(slug+'/' if slug else '')
  metadata[path]={'robots':doc.select_one('meta[name=robots]')['content'],'schemas':[str(x) for x in doc.select('script[type="application/ld+json"]')],'guides':[str(x) for x in doc.select('.seo-section') if 'Поможем выбрать программу' in text(x)],'crumbs':str(doc.select_one('.breadcrumbs') or ''),'packages':str(doc.select_one('.package-scroll') or ''),'date':text(doc.select_one('.checked'))}
  if slug.startswith('kurs/'):continue
  ids=[a.select_one('h3 a')['href'].rstrip('/').split('/')[-1] for a in doc.select('[data-course-card]')]
  kind='category' if slug in configs else 'school' if slug.startswith('shkoly/') else 'exam-subject' if slug.startswith(('ege/','oge/')) else 'school-programme' if slug.startswith('shkolnaya-programma') else 'catalog'
  config=configs.get(slug,{})
  landing=dict(slug=slug,path=path,kind=kind,parent=slug.split('/')[0] if kind=='exam-subject' else '',title=text(doc.title),description=doc.select_one('meta[name=description]')['content'],h1=text(doc.h1),intro=text(doc.select_one('.hero-copy')),canonical=BASE+path,courseIds=ids,count=len(ids),label=config.get('label',text(doc.h1)),guide=config.get('guide',''))
  landing['schoolPaths']=json.loads(doc.body.get('data-school-paths','{}'));landing['baseGrade']=doc.body.get('data-base-grade','')
  landing['supplement']=''.join(str(x) for x in doc.select('.seo-section') if 'Школьная программа: предметы и классы' in text(x) or 'Что есть в этой подборке' in text(x))
  if kind=='school':
   id=slug.split('/')[-1];name=next(c['brand'] for c in courses_source.values() if c['brandId']==id)
   landing.update(brandSlug=id,label=name);brands.append(dict(id=id,name=name,count=len(ids),path=path,courseIds=ids))
  if kind=='category':categories.append(dict(landing))
  landings.append(landing)
 courses=[]
 for id,card in cards_by_id.items():
  src=courses_source[id];doc=docs['kurs/'+id];panel=doc.select_one('.price-panel');facts={text(e.dt):text(e.dd) for e in doc.select('.fact-grid > div')}
  number=lambda k:int(card['data-'+k]) if card.get('data-'+k) else None
  c=dict(id=id,slug=id,fullTitle=text(doc.h1),title=text(doc.h1),brand=src['brand'],brandSlug=src['brandId'],age=text(card.select_one('.course-meta > span')),min=number('age-min'),max=number('age-max'),gradeMin=number('grade-min'),gradeMax=number('grade-max'),grade=src.get('grade'),grades=src.get('grades',[]),format=src['format'],online=src['online'],price=text(panel.select_one('.price')),priceValue=number('price'),unit=text(panel.select_one('.price-unit')),unitKey=card.get('data-unit',''),trial=card.get('data-offer')=='1',discount=card.get('data-discount')=='1',offer=text(panel.select_one('.offer-label')),offerCondition=(src.get('offer') or {}).get('condition',''),about='\n\n'.join(text(x) for x in doc.select('#about > p')) or src.get('summary',''),topics=[text(x) for x in doc.select('#programme li')],tools=facts.get('Инструменты',''),condition=text(panel.select_one('.condition')),url=panel.select_one('[data-partner-link]')['href'],sourceUrl=src['sourceUrl'],path='/kursy/kurs/'+id+'/',categories=src['tags'],tags=src['tags'],primaryCategory=src['category'],checkedAt=src['checkedAt'],facts=facts,metaTitle=text(doc.title),metaDescription=doc.select_one('meta[name=description]')['content'])
  courses.append(c)
 data=dict(courses=courses,categories=categories,brands=brands,landings=landings)
 shutil.copytree(HERE/'assets',out/'assets',dirs_exist_ok=True)
 m=module('courses_design_template','template.py');m.OUT=out;m.D=data;m.B=json.loads((HERE/'category-briefs.json').read_text());m.COURSES={c['id']:c for c in courses};m.CATS={c['slug']:c for c in categories};m.LANDINGS={l['slug']:l for l in landings};m.ORIGIN=BASE
 prototype=(HERE/'overlays.html').read_text()
 m.HEADER=(HERE/'chrome/header.html').read_text();m.FOOTER=(HERE/'chrome/footer.html').read_text()+prototype
 original_save=m.save
 def save(path,content):
  if path.startswith('/kursy/'):path=path.removeprefix('/kursy/')
  elif not path.startswith('assets/'):raise ValueError('Refusing to write outside /kursy/: '+path)
  if path.endswith('index.html'):
   pagepath='/kursy/'+path.removesuffix('index.html');meta=metadata[pagepath]
   page=BeautifulSoup(content,'html.parser')
   page.select_one('meta[name=robots]')['content']=meta['robots'];page.body['data-catalog-design']='compact-v3'
   for s in page.select('script[type="application/ld+json"]'):s.decompose()
   page.head.append(BeautifulSoup(''.join(meta['schemas']),'html.parser'))
   for filename in ['site-chrome.css','production.css']:
    link=page.new_tag('link',rel='stylesheet',href='/kursy/assets/'+filename+'?v=design4');page.head.append(link)
   script=page.new_tag('script',src='/kursy/assets/site-chrome.js?v=design4',defer=True);page.head.append(script)
   icon=page.new_tag('link',rel='icon',href='/favicon.ico');page.head.append(icon)
   for a in page.select('a[href]'):
    if str(a['href']).startswith('https://pro-schools.ru/'):a['href']=a['href'].removeprefix(BASE)
    if 'utm_campaign=proschools_courses' in str(a['href']):
     a['rel']=['sponsored','nofollow','noopener'];a['data-partner-link']='';a['data-course']=pagepath.rstrip('/').split('/')[-1];a['data-brand']=courses_source.get(a['data-course'],{}).get('brandId','')
   main=page.select_one('main > .wrap')
   if meta['guides']:main.append(BeautifulSoup(''.join(meta['guides']),'html.parser'))
   if pagepath.startswith('/kursy/kurs/'):
    id=pagepath.rstrip('/').split('/')[-1];c=m.COURSES[id]
    if meta['packages']:
     page.select_one('#conditions').append(BeautifulSoup('<h3>Пакеты занятий</h3><p>Стоимость полного пакета, без подмены ежемесячным платежом.</p>'+meta['packages'],'html.parser'))
    facts=page.select_one('#about');dl=page.new_tag('dl',attrs={'class':'production-facts'})
    for k,v in c['facts'].items():
     if k in ['Школа','Возраст','Формат']:continue
     div=page.new_tag('div');dt=page.new_tag('dt');dt.string=k;dd=page.new_tag('dd');dd.string=v;div.append(dt);div.append(dd);dl.append(div)
    facts.append(dl)
    date=page.new_tag('p',attrs={'class':'minor-note'});date.string=meta['date'];page.select_one('.price-panel').append(date)
   else:
    l=m.LANDINGS[pagepath.removeprefix('/kursy/').strip('/')]
    if l['supplement']:main.append(BeautifulSoup(l['supplement'],'html.parser'))
    page.body['data-school-paths']=json.dumps(l['schoolPaths'],ensure_ascii=False);page.body['data-base-grade']=l['baseGrade'];page.body['data-base-brand']=l.get('brandSlug','')
    if l['baseGrade']:page.select_one('#grade').find('option',value=l['baseGrade'])['selected']=''
    if l['kind']=='school-programme':
     catselect=page.select_one('#category');[x.attrs.pop('selected',None) for x in catselect.select('option')];catselect.find('option',value='/kursy/shkolnaya-programma/')['selected']=''
     subjects=json.loads((source/'school-subjects.json').read_text());selected_subject=l['slug'].split('/')[1] if len(l['slug'].split('/'))>1 and not l['slug'].split('/')[1].endswith('-klass') else ''
     choices=[('/kursy/shkolnaya-programma/','Все предметы','')]
     for subject in subjects:
      slug='shkolnaya-programma/'+subject['id'];grade_slug=slug+'/'+str(l['baseGrade'])+'-klass' if l['baseGrade'] else slug
      if grade_slug in m.LANDINGS:choices.append(('/kursy/'+grade_slug+'/',subject['label'],subject['id']))
     field=BeautifulSoup('<div class="field"><label for="programme">Предмет</label><select id="programme" data-navigate>'+''.join('<option value="'+html.escape(url,quote=True)+'"'+(' selected' if id==selected_subject else '')+'>'+html.escape(label)+'</option>' for url,label,id in choices)+'</select></div>','html.parser')
     page.select_one('#category').parent.insert_after(field)

    # Keep favorites in course tools so the global header remains identical.
    target=page.select_one('.catalog-tools');target.append(BeautifulSoup('<button id="saved" class="saved-button" aria-label="Избранные курсы">♡ <span>Избранное</span><small id="saved-count">0</small></button>','html.parser'))
   if not page.select_one('#saved-count'):
    count=page.new_tag('span',id='saved-count',hidden=True);page.body.append(count)
   page.body.append(BeautifulSoup((HERE/'metrika.html').read_text(),'html.parser'))
   for el in page.select('[href],[src]'):
    for attr in ['href','src']:
     v=el.get(attr,'')
     if v.startswith('/kursy/assets/') and v.endswith(('.js','.css')):el[attr]=v+'?v=design4'
   content=str(page).replace('viewbox=','viewBox=')
  original_save(path,content)
 m.save=save
 art=module('courses_design_illustrations','illustrations.py')
 # New reviewed directions use native vectors in the existing palette.
 # The approved illustrated assets remain the first choice.
 aliases={'marketing':'web-razrabotka','predprinimatelstvo':'finansovaya-gramotnost','bezopasnost':'kiberbezopasnost','pdd':'kiberbezopasnost','kitayskiy':'angliyskiy','oratorskoe-masterstvo':'soft-skills','emocionalnyy-intellekt':'soft-skills','triz':'logika','skorochtenie':'chtenie','pamyat-i-vnimanie':'logika','akterskoe-masterstvo':'soft-skills','fotografiya':'videomontazh','bloging':'videomontazh','animaciya':'dizayn','kibersport':'unity','estestvennye-nauki':'fizika','astronomiya':'fizika','proorientaciya':'soft-skills','zhurnalistika':'literatura','psihologiya':'soft-skills'}
 (out/'assets/direction-cards').mkdir(exist_ok=True)
 for cat in categories:
  slug=cat['slug'];target=out/'assets/direction-cards'/(slug+'.svg')
  if target.exists():continue
  brief=m.B[slug];lines=brief['cardLines'];seed=int(hashlib.sha256(slug.encode()).hexdigest()[:8],16)
  drawing=art.scene(aliases.get(slug,slug),art.CORAL,art.BLUE,art.MINT,seed)
  label=''.join(f'<text x="54" y="{630+i*80}" font-family="Arial,sans-serif" font-size="64" font-weight="700" fill="#24231f">{html.escape(line)}</text>' for i,line in enumerate(lines))
  if brief.get('hideLabel'):label=''
  target.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="820" viewBox="0 0 1000 820"><rect width="1000" height="820" rx="54" fill="{brief["color"]}"/><g transform="translate(260 80) scale(1.65)">{drawing}</g>{label}</svg>')
 for folder in ['course-covers','course-thumbnails']:(out/'assets'/folder).mkdir(exist_ok=True)
 for c in courses:
  cover,_=art.create(c);(out/'assets/course-covers'/ (c['id']+'.svg')).write_text(cover)
  seed=int(hashlib.sha256(c['id'].encode()).hexdigest()[:12],16);bg,a,b,d=art.PALETTES[seed%len(art.PALETTES)];domain,_,_=art.course_theme(c)
  thumb=f'<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320"><rect width="320" height="320" rx="36" fill="{bg}"/><ellipse cx="160" cy="284" rx="118" ry="11" fill="{art.DARK}" opacity=".06"/><g transform="translate(10 23) rotate({seed%9-4} 150 130) scale(.96)">{art.scene(domain,a,b,d,seed)}</g></svg>'
  (out/'assets/course-thumbnails'/(c['id']+'.svg')).write_text(thumb)
 for l in landings:m.category_page(l)
 for c in courses:m.course_page(c)
 mini=[{k:c[k] for k in ['id','path','fullTitle','brand','age','format','price','unit','trial']} for c in courses]
 m.save('assets/catalog-data.js','window.PRO_COURSES='+json.dumps(mini,ensure_ascii=False).replace('<','\\u003c')+';')
 print(json.dumps({'design':'approved-compact-v3','courses':len(courses),'landings':len(landings),'sharedChrome':True}))

if __name__=='__main__':
 import argparse
 p=argparse.ArgumentParser();p.add_argument('--out',required=True);p.add_argument('--data',required=True);args=p.parse_args();apply(args.out,args.data)
