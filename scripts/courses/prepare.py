"""Turn harvested evidence into a reviewable catalogue, with conservative facts."""
import hashlib, json, re, unicodedata
from collections import Counter
from urllib.parse import urlparse
from bs4 import BeautifulSoup
from discover import ROOT, WORK
from taxonomy import CATEGORIES, RULES

DATA=ROOT/'data/courses'
EDITORIAL=json.loads((DATA/'editorial.json').read_text()) if (DATA/'editorial.json').exists() else {}
def clean(s): return re.sub(r'\s+',' ',s or '').strip()
def number(s): return int(re.sub(r'\D','',s))

def curriculum(c):
    """Read labels only inside an actual curriculum section, never sales headings."""
    cache=WORK/(hashlib.sha256(c['sourceUrl'].encode()).hexdigest()[:16]+'.html')
    if not cache.exists():return []
    soup=BeautifulSoup(cache.read_text(),'html.parser');labels=[]
    for heading in soup.select('h2,h3,h4'):
        text=clean(heading.get_text(' ',strip=True))
        if not re.search(r'^(?:программа курса|содержание курса|что изучим|чему научится|программа обучения)',text,re.I):continue
        for i,node in enumerate(heading.find_all_next()):
            if i>180:break
            if node.name in ['h2','h3','h4'] and int(node.name[1])<=int(heading.name[1]):break
            if node.name not in ['li','h3','h4','h5']:continue
            label=clean(node.get_text(' ',strip=True))
            if 3<len(label)<75 and len(label.split())<=9 and not re.search(r'скидк|тариф|запис|заявк|оплат|подар|платформ|отзыв|преподав|цена|почему|запись|групп|поддержк|урок|вам|ты |тебе|мы |наш|ребен|ребён|родит|бесплат|результат|попроб|знаком|стоим|500|вы |курс|фильтр|вопрос|структур|актуальн|ситуаци|проблем|преимущ|команд|методик|будущ|фишки|требован|подойд',label,re.I):labels.append(label)
    return list(dict.fromkeys(labels))[:4]

def price_fact(c):
    t=clean(c['text']); b=c['brandId']
    if b in {'hello-world','virtuozy-msk','deutsch-online','yes-online'}:
        from expansion_prices import price
        return price(c)
    if b=='naukacity' and 'Бесплатно — подписка на десять онлайн-курсов без ограничения по времени.' in t:
        return {'amount':0,'unit':'курс','from':False,'condition':'Бесплатная общая подписка после регистрации; условия доступа у организатора','evidence':'Бесплатно — подписка на десять онлайн-курсов без ограничения по времени.','checkedAt':c['checkedAt'][:10]}
    if b=='skysmart' and 'selfstudy' in c.get('sourceUrl',''):
        # Read the programme's own tariff, before recommendations or FAQs.
        start=t.find(clean(c.get('h1','')))
        if start<0 or 'Что входит в тариф' not in t[start:]:return None
        scope=t[max(0,start):].split('Что входит в тариф')[0]
        paid=re.search(r'([\d\s\u202f]+)\s*₽\s*при оплате сразу',scope,re.I)
        if paid:
            amount=number(paid[1]);evidence=clean(paid[0]);condition='Полная стоимость при разовой оплате; общая сумма рассрочки может отличаться'
        else:
            paid=re.search(r'Видеокурс\s+(?:Предпродажа\s+)?([\d\s\u202f]+)\s*₽',scope,re.I)
            if not paid:return None
            amount=number(paid[1]);evidence=clean(paid[0]);condition='Полная стоимость видеокурса или общего комбо; начало доступа и предпродажу уточнить у школы'
        if 200<=amount<=500000:return {'amount':amount,'unit':'курс','from':False,'condition':condition,'evidence':evidence,'checkedAt':c['checkedAt'][:10]}
        return None
    patterns={
      'synergy':(r'от\s+([\d\s\u202f]+)\s*₽\s*за урок','урок','При оплате курса на тарифе «Стандарт»'),
      'skysmart':(r'всего\s+([\d\s\u202f]+)\s*₽\s*за курс','курс','За пакет занятий, указанный в названии курса; рассрочка считается отдельно'),
      'foxford':(r'([\d\s\u202f]+)\s*₽\s*за\s*курс','курс','Полная стоимость выбранного предметного курса; рассрочка считается отдельно'),
      '100points':(r'от\s+([\d\s\u202f]+)\s*₽\s*/\s*блок','блок','За учебный блок. Итог зависит от тарифа и количества блоков'),
      'umschool':(r'от\s+([\d\s\u202f]+)\s*₽\s*/\s*мес','месяц','Стартовая цена программы; длительность и тариф указаны у школы'),
      'sotka':(r'от\s*([\d\s\u202f]+)\s*₽\s*в месяц за 4 предмета','месяц','Пакет подготовки по четырём предметам, а не цена одного предмета'),
      'pixel':(r'Цена:\s*от\s*([\d\s\u202f]+)\s*руб\.?\s*за 1 занятие','занятие','Минимальная стоимость занятия; пакет и формат уточняются при записи'),
      'teatrika':(r'Цена на урок начинается от\s*([\d\s\u202f]+)\s*руб','урок','Цена зависит от пакета занятий'),
      'lil':(r'Стоимость одного урока начинается от\s*([\d\s\u202f]+)\s*руб','урок','Цена зависит от количества занятий в абонементе'),
    }
    if b not in patterns:return None
    pattern,unit,condition=patterns[b];m=re.search(pattern,t,re.I)
    if not m:return None
    amount=number(m[1])
    if amount<200 or amount>500000:return None
    return {'amount':amount,'unit':unit,'from':b not in ['skysmart','foxford'],'condition':condition,'evidence':clean(m[0]),'checkedAt':c['checkedAt'][:10]}

def title_for(c):
    title=clean(c['h1'])
    if c['brandId']=='rebotica':
        return {'web-designer':'Веб-дизайн для детей','programmer':'Программирование на Python для детей','gamedev':'Разработка игр в Roblox','gamedev_unity':'Разработка игр в Unity','gdevelop':'Создание игр в GDevelop'}.get(urlparse(c['sourceUrl']).path.strip('/'),title)
    if c['brandId']=='lil' and urlparse(c['sourceUrl']).path=='/logoped/':return 'Индивидуальные занятия с логопедом для детей'
    if c['brandId']=='easycode':
        names={'interactive-world-creator-6-9':'Создатель интерактивных миров: Junior, 6–9 лет','interactive-world-creator-10-12':'Создатель интерактивных миров: Middle, 10–12 лет','interactive-world-creator-13-17':'Создатель интерактивных миров: Senior, 13–17 лет','designer-world-technology-6-9':'Художник в мире технологий, 6–9 лет','designer-world-technology-10-17':'Художник в мире технологий, 10–17 лет','fullstack-10-17':'Fullstack-разработчик, 10–17 лет'}
        return names.get(urlparse(c['sourceUrl']).path.strip('/'),title)
    if c['brandId']=='umschool':
        specific=next((h for h in c['headings'] if re.match(r'(Годовой|Полугодовой|Курс)',h)),None)
        if specific: title=specific
    overrides={'algoritmika':'Программирование для детей 6–18 лет','chess':'Шахматы для детей в ChessFirst','iqsha':'Развивающие занятия для детей 2–11 лет','logiclike':'Логика и мышление на LogicLike'}
    if c['brandId'] in overrides and urlparse(c['sourceUrl']).path=='/':return overrides[c['brandId']]
    title=re.split(r'\s*[|•]\s*',title)[0]
    title=re.sub(r'\s*—\s*(?:задания|IQsha|онлайн-школа|онлайн.курс).*','',title,flags=re.I)
    title=re.sub(r'\s*[-–]\s*IQsha\.ru.*','',title,flags=re.I)
    title=title.replace('с любого уровня на максимум','').strip(' :–—')
    if c['brandId']=='100points':
        subject=next((label for slug,label,*_ in CATEGORIES if slug in dict(classify(c,title)) and slug in ['himiya','biologiya','matematika','russkiy','fizika','informatika','literatura','istoriya','obshchestvoznanie','angliyskiy','geografiya']), '')
        title=(subject+': '+title) if subject else title
    return title[:150]

def classify(c,title):
    # The page's meta often lists every school product. Classify the actual
    # title and path instead, so an English course does not become a Python one.
    scope=title+' '+c['sourceUrl']
    tags=[(slug,True) for slug,p in RULES if re.search(p,scope,re.I)]
    ids=[s for s,_ in tags]
    if c['brandId']=='easycode' and 'interactive-world' in scope:tags.extend([('unity',True),('programmirovanie',True)])
    if 'domashnee-zadanie' in scope:tags.append(('shkolnye-predmety',True))
    if c['brandId']=='iqsha' and urlparse(c['sourceUrl']).path=='/':tags.extend([('logika',True),('podgotovka-k-shkole',True)])
    if re.search(r'программир|programmir|coding|swift|java|c-sharp|блокчейн|blockchain',scope,re.I) or c['brandId']=='algoritmika' or any(s in ids for s in ['python','scratch','roblox','minecraft','unity','web-razrabotka','robototehnika','kiberbezopasnost']):
        if 'programmirovanie' not in ids: tags.append(('programmirovanie',True))
    if c['brandId']=='novakid' and 'angliyskiy' not in ids: tags.append(('angliyskiy',True))
    if c['brandId']=='artfox' and 'risovanie' not in ids: tags.append(('risovanie',True))
    if c['brandId']=='chess' and 'shahmaty' not in ids: tags.append(('shahmaty',True))
    return tags

def prepare():
    raw=json.loads((WORK/'harvest.json').read_text())+json.loads((WORK/'supplement.json').read_text())
    if (WORK/'remaining-harvest.json').exists():raw+=json.loads((WORK/'remaining-harvest.json').read_text())
    byurl={c['sourceUrl']:c for c in raw}; out=[]; excluded=[]
    for c in byurl.values():
        if c.get('status')!=200 or not c.get('h1') or '/404' in c['sourceUrl'] or (c['brandId']=='advance' and urlparse(c['sourceUrl']).path=='/'):
            excluded.append({'url':c['sourceUrl'],'reason':c.get('error','No programme content / general root')});continue
        title=title_for(c)
        if re.match('[а-яё]',title):title=title[0].upper()+title[1:]
        tags=list(dict(classify(c,title)))
        editorial=EDITORIAL.get(c['sourceUrl'],{})
        if editorial.get('tags'):tags=editorial['tags']
        if not tags: excluded.append({'url':c['sourceUrl'],'reason':'Unclassified: requires editorial review'});continue
        # Adults-only programmes are not published in the children's catalogue.
        if re.search(r'для взрослых|18\+',title,re.I) and not re.search(r'дет',title,re.I):continue
        primary=next((s for s in tags if s in ['ege','oge','podgotovka-k-shkole','logoped']),tags[0])
        source_text=c['text']; pos=source_text.lower().find(clean(c['h1']).lower())
        opening=source_text[max(0,pos):max(0,pos)+1200]
        scope=title+' '+c['meta'][:200]+' '+c['navLabel']+' '+opening
        age=re.search(r'(?:от\s*)?(\d{1,2})\s*(?:[–—−-]|до)\s*(\d{1,2})\s*(?:лет|года)',scope)
        ageRange=[int(age[1]),int(age[2])] if age and int(age[1])<=int(age[2])<19 else None
        grade=re.search(r'(\d{1,2})(?:[–—-](\d{1,2}))?\s*(?:класс|класса|классов)|/(\d{1,2})(?:-class|-klass|class)/',scope)
        gradeLabel=''
        if grade and primary!='podgotovka-k-shkole' and not re.search('дошкол',title,re.I): gradeLabel=((grade[1]+('–'+grade[2] if grade[2] else '')) if grade[1] else grade[3])+' класс'
        if not ageRange and not gradeLabel and primary=='ege':gradeLabel='10–11 класс'
        if not ageRange and not gradeLabel and primary=='oge':gradeLabel='8–9 класс'
        online=bool(re.search(r'онлайн|online|дистанцион',c['meta']+' '+c['text'][:10000],re.I))
        if c['brandId']=='chess':online=False # root describes clubs; online programme not verified.
        fmt='Самостоятельно' if c['brandId'] in ['iqsha','logiclike'] else 'Онлайн' if online else 'Уточнить формат'
        if c['brandId'] in ['teatrika','lil','uchi-doma','novakid'] or 'С репетитором' in c['meta']:fmt='Индивидуально онлайн' if online else 'Индивидуально'
        if c['brandId']=='synergy' and re.search(r'один на один|индивидуальн',c['meta'],re.I):fmt='Индивидуально онлайн'
        price=price_fact(c)
        offer=None
        # Only a clear, repeated offer on the course source; no inferred percentages.
        if c['brandId'] in ['synergy','teatrika','kodland','rebotica','novakid','easycode']:
            m=re.search(r'первый урок бесплатно|бесплатный пробный урок|бесплатный вводный урок',c['text'],re.I)
            if m:offer={'kind':'trial','text':'Бесплатный первый урок','evidence':m[0],'checkedAt':c['checkedAt'][:10]}
        if c['brandId']=='pixel' and re.search(r'Скидка 10% новым клиентам',c['text'],re.I) and re.search(r'в день обращения при покупке абонемента от 12 занятий',c['text'],re.I):
            offer={'kind':'discount','text':'−10% новым клиентам','condition':'В день обращения при покупке абонемента от 12 занятий','evidence':'Скидка 10% новым клиентам','conditionEvidence':'в день обращения при покупке абонемента от 12 занятий','checkedAt':c['checkedAt'][:10]}
        if c['brandId']=='skysmart':
            m=re.search(r'со скидкой\s+(\d{1,2})\s*%',c['text'][:2500],re.I)
            if m:offer={'kind':'discount','text':'Скидка '+m[1]+'%','condition':'Скидка указана школой для выбранной программы; актуальные условия смотрите перед оплатой','evidence':m[0],'checkedAt':c['checkedAt'][:10]}
        slug=c['brandId']+'-'+hashlib.sha256(c['sourceUrl'].encode()).hexdigest()[:10]
        # Descriptive slug, stable hash only protects against long or colliding source names.
        tail=urlparse(c['sourceUrl']).path.rstrip('/').split('/')[-1]
        ascii_tail=re.sub('[^a-z0-9-]+','-',tail.lower().replace('_','-')).strip('-')[:58]
        if ascii_tail:slug=c['brandId']+'-'+ascii_tail+'-'+hashlib.sha256(c['sourceUrl'].encode()).hexdigest()[:5]
        body=c['text']; start=body.lower().find(clean(c['h1']).lower()); body=body[max(0,start):]
        # Keep only a short set of source curriculum labels (no copied description).
        banned=r'отзыв|тариф|стоим|почему|вопрос|преподав|родител|соглас|оплат|бесплат|запи|заяв|акци|формат|курат|школ|партнер|получ|помож|результ|мы |как |что |наши|ваш|надеж|любят|₽|^\d+$|контакт|лиценз|педагог|подар|гарант|программ[аы]|курс|коротко|кому|подойд|рекоменд|стандарт|премиум|системн|надёж|другие|содержан|цели|также|чему|зачем|три |две |кто |заняти|предмет|полезен|детям|уровень \d|^уровни|^о |суть|включают|ведёт|^4 раздела|^Старт|^Технологии|прозрачн'
        modules=curriculum(c)
        # Title + displayed source labels never exceed 25 quoted words per source.
        budget=max(0,24-len(title.split())); safe=[]
        for h in modules:
            n=len(h.split())
            if n<=budget:safe.append(h);budget-=n
        record={'id':slug,'title':title,'brandId':c['brandId'],'brand':c['brand'],'category':primary,'tags':tags,
          'ageRange':ageRange,'grade':gradeLabel,'format':fmt,'online':online,'price':price,'offer':offer,'modules':safe,
          'sourceUrl':c['sourceUrl'],'checkedAt':c['checkedAt'][:10],'contentHash':c['contentHash'],'active':True}
        record['sourceTitle']=clean(c['h1'])
        facts=[]
        n=re.search(r'(\d{1,3})\s*(?:урок(?:а|ов)?|заняти[еяй])',title+' '+c['meta'])
        if n and 1<=int(n[1])<=200:facts.append(['Объём программы',n[1]+' занятий'])
        n=re.search(r'Занятий в месяц:\s*(\d{1,2})',opening,re.I)
        if n:facts.append(['Учебная нагрузка',n[1]+' занятий в месяц'])
        n=re.search(r'Длительность:\s*([а-яё]+\s*[–—-]\s*[а-яё]+)',opening,re.I)
        if n:facts.append(['Период обучения',n[1]])
        tools=[]
        for tool,pattern in [('Python',r'\bpython\b'),('Scratch',r'\bscratch\b|скретч'),('Roblox Studio',r'roblox'),('Minecraft',r'minecraft'),('Unity',r'\bunity\b'),('Blender',r'\bblender\b'),('Figma',r'figma'),('Tilda',r'\btilda\b'),('HTML',r'\bhtml\b'),('CSS',r'\bcss\b'),('JavaScript',r'\bjavascript\b'),('GDevelop',r'gdevelop'),('Godot',r'godot'),('Django',r'django'),('Photoshop',r'photoshop'),('GIMP',r'\bgimp\b'),('Illustrator',r'illustrator'),('Procreate',r'procreate'),('CapCut',r'capcut'),('Premiere Pro',r'premiere'),('Ableton',r'ableton'),('YandexGPT',r'yandexgpt'),('GigaChat',r'gigachat'),('Kandinsky',r'kandinsky')]:
            if re.search(pattern,title+' '+source_text[max(0,pos):max(0,pos)+2500],re.I):tools.append(tool)
        if tools:facts.append(['Инструменты',', '.join(tools[:6])])
        record['facts']=facts
        record['summary']=('В описании программы — '+', '.join(tools[:5])+'. ' if tools else '')+('Объём: '+facts[0][1]+'. ' if facts and facts[0][0]=='Объём программы' else '')
        if editorial:
            record['editorialDescription']=editorial['description']
            record['modules']=editorial.get('modules',record['modules'])
            record['facts'].extend(editorial.get('facts',[]))
            record['editorialCheckedAt']='2026-10-19'
        out.append(record)
    (DATA/'catalog.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
    (DATA/'categories.json').write_text(json.dumps([{'id':s,'label':l,'symbol':i,'title':t,'intro':d,'guide':g} for s,l,i,t,d,g in CATEGORIES],ensure_ascii=False,indent=2)+'\n')
    (WORK/'excluded.json').write_text(json.dumps(excluded,ensure_ascii=False,indent=2))
    print('Courses',len(out),'brands',len(set(c['brandId'] for c in out)))
    print(dict(Counter(c['brandId'] for c in out)))
    print('Prices',sum(bool(c['price']) for c in out),'offers',sum(bool(c['offer']) for c in out))
if __name__=='__main__':prepare()
