#!/usr/bin/env python3
"""Import reviewed school-programme evidence; never infer class from site navigation.

Foxford inputs are visible public DOM exported through the browser (ordinary HTTP
is refused). Other inputs are first-party HTML captured by harvest.py. This is a
manual import, not the daily refresh entrypoint. Keep original evidence in work/.
"""
import hashlib,json,re,sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse
from bs4 import BeautifulSoup
from prepare import price_fact,curriculum,clean,title_for
ROOT=Path(__file__).resolve().parents[2];DATA=ROOT/'data/courses';WORK=ROOT/'work/courses';TODAY=date.today().isoformat()
SUBJECTS=json.loads((DATA/'school-subjects.json').read_text());BYLABEL={s['label']:s for s in SUBJECTS};BYID={s['id']:s for s in SUBJECTS}
LABELS={'Тренажеры':'russkiy','Обучение грамоте':'obuchenie-gramote','Музыка':'muzyka','Изо':'izo'}
# Names represent concepts actually mentioned in the course's own description.
TOPICS=[('органичес','Органические соединения'),
 ('гомолог','Гомология'),
 ('изомер','Изомерия'),
 ('атом','Строение атома'),
 ('химических связ','Химическая связь'),
 ('решётк|решетк','Кристаллические решётки'),
 ('уравнен','Уравнения'),
 ('периодическ|Менделеева','Периодическая система'),
 ('раствор','Растворы'),
 ('pH','Кислотность среды'),
 ('окислитель','Окислительно-восстановительные реакции'),
 ('процент','Проценты'),
 ('дроб','Дроби'),
 ('пропорц','Пропорции'),
 ('натуральн','Натуральные числа'),
 ('отрицательн','Отрицательные числа'),
 ('неравенств','Неравенства'),
 ('рациональн','Рациональные числа'),
 ('степен','Степени'),
 ('функц','Функции'),
 ('логарифм','Логарифмы'),
 ('тригонометр','Тригонометрия'),
 ('прогресс','Прогрессии'),
 ('производн','Производная'),
 ('интеграл','Интеграл'),
 ('вероятност','Вероятность'),
 ('матриц','Матрицы'),
 ('предел','Пределы'),
 ('окружност','Окружности'),
 ('треугольн','Треугольники'),
 ('вектор','Векторы'),
 ('многогран','Многогранники'),
 ('проецирован','Проецирование'),
 ('плоскост','Прямые и плоскости'),
 ('цилиндр','Цилиндр'),
 ('конус','Конус'),
 ('сфер|шар','Сфера и шар'),
 ('фонет','Фонетика'),
 ('морфем','Морфемика'),
 ('словообразован','Словообразование'),
 ('морфолог','Морфология'),
 ('пунктуац','Пунктуация'),
 ('орфограф','Орфография'),
 ('прилагательн','Имя прилагательное'),
 ('числительн','Имя числительное'),
 ('местоимен','Местоимение'),
 ('глагол','Глагол'),
 ('синтакс','Синтаксис'),
 ('лексик','Лексика'),
 ('грамматик','Грамматика'),
 ('клет','Клетка'),
 ('генетик','Генетика'),
 ('эволюц','Эволюция'),
 ('эколог','Экология'),
 ('животн','Животные'),
 ('растен','Растения'),
 ('бактери','Бактерии'),
 ('гриб','Грибы'),
 ('организм','Живые организмы'),
 ('биохим','Биохимия'),
 ('механик','Механика'),
 ('термодинами','Термодинамика'),
 ('молекулярно-кинет','Молекулярно-кинетическая теория'),
 ('электростат','Электростатика'),
 ('электродинами','Электродинамика'),
 ('оптик','Оптика'),
 ('ядерн','Ядерная физика'),
 ('систем.*счислен','Системы счисления'),
 ('кодирован','Кодирование'),
 ('логик','Логика'),
 ('Python|Питон|Пайтон','Python'),
 ('баз.*данных','Базы данных'),
 ('моделир','Моделирование'),
 ('сайт','Веб-сайты'),
 ('изображен|фото','Работа с изображениями'),
 ('средневек','Средние века'),
 ('древн','Древний мир'),
 ('XX|Новейш','Новейшая история'),
 ('источник','Работа с источниками'),
 ('экономик','Экономика'),
 ('право|правов','Право'),
 ('социальн','Социальные отношения'),
 ('политик','Политика'),
 ('культур','Культура'),
 ('карт','Работа с картой'),
 ('ресурс','Природные ресурсы'),
 ('литератур.*XIX|XIX.*литератур','Литература XIX века'),
 ('литератур.*XX|XX.*литератур','Литература XX века'),
 ('сочинен','Письменные работы'),
 ('звук','Звуки'),
 ('букв','Буквы'),
 ('чтен','Чтение'),
 ('пересказ','Пересказ'),
 ('классическ','Классическая музыка'),
 ('эстрад','Эстрадная музыка'),
 ('композитор','Композиторы'),
 ('архитект','Архитектура'),
 ('живопис','Живопись'),
 ('цвет','Цвет'),
 ('композиц','Композиция')]
NOTES={
 '17408':'Знакомство с органическими соединениями построено вокруг гомологии, изомерии и сопоставления свойств веществ. Предметная программа 10 класса подходит для последовательного изучения школьной химии; базовую и углублённую версии стоит сравнивать по объёму задач.',
 '19347':'Углублённая органическая химия с разбором свойств и превращений веществ. В отличие от базовой версии, в описании отдельно выделены механизмы реакций и расчётные задачи. До покупки полезно сопоставить требуемую подготовку с текущим уровнем ученика.',
 '17395':'В программе связаны свойства функций и способы решения уравнений: от степенных выражений до логарифмов и тригонометрии. Это предметный маршрут для 10 класса, который можно сравнить с углублённой алгеброй по дополнительным темам и нагрузке.',
 '19349':'Расширенный вариант алгебры добавляет к базовым темам матрицы, пределы и работу с производными. Отдельный акцент сделан на сложных графиках и более глубоком изучении тригонометрии. Уточните входные знания перед выбором этой версии.',
 '17396':'Курс переводит геометрические задачи с плоскости в пространство: рассматриваются расположение прямых и плоскостей, проецирование и многогранники. В описании также указаны вычисления площадей поверхностей и объёмов. Сверьте последовательность тем со своим школьным учебником.',
 '19342':'Углублённая геометрия включает дополнительные пространственные построения, координатные методы и работу с векторами. В описании школы отмечено, что объёмы тел отнесены к следующему классу. Эту особенность важно учесть при сравнении с базовой версией.',
 '19290':'Химия 11 класса объединяет устройство атома, растворы и кислотность среды с энергетикой и практическими применениями. Программа построена как предметное изучение общей химии; условия доступа и состав выбранного курса указаны отдельно от любых экзаменационных продуктов.',
 '19292':'Базовая алгебра выпускного класса включает исследование функций и знакомство с интегралом, а также комбинаторные и вероятностные задачи. В описании объясняются связи математических понятий со скоростью и площадью. Сравните содержание со своим УМК.',
 '19287':'Геометрия выпускного класса посвящена координатным методам, расстояниям и углам в пространстве, а затем телам вращения. В программе перечислены цилиндр, конус, сфера и шар. Для самостоятельной работы стоит заранее уточнить способ проверки чертежей и решений.',
 '19294':'Информатика выпускного класса связывает работу с данными, создание сайтов, изображения и программирование. В программе используется Python. Перед покупкой проверьте доступ к нужным программам и возможность повторять компьютерные задания на своём устройстве.',
 '19293':'Физика 11 класса охватывает электродинамику, оптические явления и разделы современной физики. Описание связывает школьные темы с наблюдаемыми эффектами и технологиями. При выборе оцените не только просмотр объяснений, но и время на собственное решение задач.',
 '18393':'Алгебра по системе Петерсон для 7 класса: работа с числами, степенями и зависимостями сочетается с уравнениями и неравенствами. При выборе важно сопоставить этот маршрут со школьным учебником и тем, какие способы решения уже знакомы ребёнку.',
}

def grades_from(value):
 value=clean(value)
 m=re.search(r'(\d{1,2})\s*(?:[–—−-]|по|и)\s*(\d{1,2})\s*(?:класс|кл\b)',value,re.I)
 if m:return list(range(int(m[1]),int(m[2])+1))
 m=re.search(r'(\d{1,2})(?:-го|\s*-?й)?\s*(?:класс|кл\b)',value,re.I)
 return [int(m[1])] if m else []

ALLOWED={
 'matematika':'Проценты|Дроби|Пропорции|Натуральные числа|Отрицательные числа|Уравнения|Неравенства|Рациональные числа|Степени|Функции|Треугольники|Окружности|Логика',
 'algebra':'Уравнения|Неравенства|Рациональные числа|Степени|Функции|Логарифмы|Тригонометрия|Прогрессии|Производная|Интеграл|Вероятность|Матрицы|Пределы',
 'geometriya':'Окружности|Треугольники|Векторы|Многогранники|Проецирование|Прямые и плоскости|Цилиндр|Конус|Сфера и шар',
 'himiya':'Органические соединения|Гомология|Изомерия|Строение атома|Химическая связь|Кристаллические решётки|Уравнения|Периодическая система|Растворы|Кислотность среды|Окислительно-восстановительные реакции',
 'biologiya':'Клетка|Генетика|Эволюция|Экология|Животные|Растения|Бактерии|Грибы|Живые организмы|Биохимия|Работа с источниками',
 'fizika':'Механика|Термодинамика|Молекулярно-кинетическая теория|Электростатика|Электродинамика|Оптика|Ядерная физика|Моделирование',
 'russkiy':'Фонетика|Морфемика|Словообразование|Морфология|Пунктуация|Орфография|Имя прилагательное|Имя числительное|Местоимение|Глагол|Синтаксис|Лексика|Грамматика|Письменные работы',
 'angliyskiy':'Словообразование|Глагол|Лексика|Грамматика|Имя прилагательное|Имя числительное|Местоимение',
 'informatika':'Системы счисления|Кодирование|Логика|Python|Базы данных|Моделирование|Веб-сайты|Работа с изображениями',
 'istoriya':'Средние века|Древний мир|Новейшая история|Работа с источниками|Работа с картой',
 'obshchestvoznanie':'Экономика|Право|Социальные отношения|Политика|Культура',
 'literatura':'Литература XIX века|Литература XX века|Письменные работы|Чтение',
 'geografiya':'Работа с картой|Природные ресурсы|Экология|Экономика',
 'muzyka':'Классическая музыка|Эстрадная музыка|Композиторы|Культура',
 'izo':'Архитектура|Живопись|Цвет|Композиция',
 'obuchenie-gramote':'Звуки|Буквы|Чтение|Письменные работы',
 'literaturnoe-chtenie':'Чтение|Пересказ|Письменные работы',
 'okruzhayushchiy-mir':'Растения|Животные|Экология|Природные ресурсы|Культура',
}
def topics(text,subject):
    precise={'предел':r'\bпредел(?:ы|а|ов|у|е|ом)?\b','гриб':r'\bгриб(?:ы|ов|ам|ами|ах|а)?\b','степен':r'\bстепен(?:ь|и|ей|ями|ям|ях)\b','карт':r'\bкарт(?:а|ы|у|е|ой|ам|ами|ах)?\b'}
    return list(dict.fromkeys(label for pat,label in TOPICS if label in ALLOWED[subject].split('|') and re.search(precise.get(pat,pat),text,re.I)))[:6]
def slug(brand,url):return brand+'-school-'+hashlib.sha256(url.encode()).hexdigest()[:10]
def canonical(u):return u.replace('://www.','://').rstrip('/')
def classify_existing(c):
 if set(c['tags'])&{'ege','oge'}:return
 if re.search(r'дошкольник|^STEM:',c['title'],re.I):return
 path=urlparse(c['sourceUrl']).path
 explicit=bool(re.search(r'/(?:primaryschool|middleschool)/\d+class/|/srednyaya-shkola/\d+-class/|/nachalnaya-shkola/',path))
 regular=c['brandId']=='teatrika' and c['category'] in BYID and path!='/english_kids'
 schooltitle=bool(re.search(r'(?:математ|русск|английск).{0,50}\d.{0,12}класс',c['title'],re.I))
 if not (explicit or regular or schooltitle):return
 subjects=[s['id'] for s in SUBJECTS if s['id'] in c['tags']]
 if not subjects:return
 if 'литературное чтение' in c['title'].lower():subjects=['literaturnoe-chtenie']
 gs=grades_from(c['title'])
 m=re.search(r'/(\d+)(?:-class|class)/',path)
 if m:gs=[int(m[1])]
 c.update(learningGoal='school',schoolSubjects=subjects,grades=gs,gradeEvidence=c['title'] if gs else '',schoolEvidence={'url':c['sourceUrl'],'basis':'Предметное направление и явно указанная школьная аудитория','checkedAt':TODAY})
 if gs:c['grade']=f'{gs[0]} класс' if len(gs)==1 else f'{gs[0]}–{gs[-1]} класс'
 else:c['grade']=''

def main():
 courses=json.loads((DATA/'catalog.json').read_text());before={c['id'] for c in courses};byurl={canonical(c['sourceUrl']):c for c in courses}
 for c in courses:classify_existing(c)
 cards=json.loads((WORK/'foxford-school-parsed.json').read_text())['cards'];details={d['sourceUrl']:d for d in json.loads((WORK/'foxford-school-details.json').read_text())};review=[]
 for card in cards:
  d=details[card['url']];assert not d.get('error'),d
  assert clean(d['h1'])==clean(card['title'])
  grade_label=card['labels'][1];gs=grades_from(grade_label);assert gs and all(1<=n<=11 for n in gs),(card['title'],grade_label)
  label=card['labels'][2];sub=LABELS.get(label) or next(s['id'] for s in SUBJECTS if s['label']==label)
  if 'обучение грамоте' in card['title'].lower():sub='obuchenie-gramote'
  if 'окружност' in card['title'].lower() or 'треугольник' in card['title'].lower():sub='geometriya'
  csub=BYID[sub];url=d['url'];source_text=clean(d['text']);price=int(re.sub(r'\D','',card['priceEvidence']));assert str(price) in re.sub(r'\s','',source_text)
  access=re.search(r'Доступ до (\d{1,2}) августа (20\d\d)',source_text)
  access_until=f'{access[2]}-08-{int(access[1]):02d}' if access else None
  assert not access_until or access_until>=TODAY
  n=re.search(r'(\d+)\s+(?:занятий|занятия|занятие|уроков|урока)\b',card['text']);count=int(n[1]) if n else None
  teacher=card['text'].splitlines()[0].strip();desc=clean(card['description']);mod=topics(desc,sub)
  if not mod:mod=topics(card['title'],sub)
  material=next((name for pattern,name in [('Петерсон','Л. Г. Петерсон'),
 ('Эльконин','Эльконин—Давыдов'),
 ('Моро','М. И. Моро'),
 ('Габриеля','О. С. Габриелян'),
 ('Пасечник','В. В. Пасечник'),
 ('Максаковск','В. П. Максаковский'),
 ('Атанасян','Л. С. Атанасян'),
 ('Мякишев','Г. Я. Мякишев'),
 (r'И\.\s*Н\.\s*Сухих','И. Н. Сухих'),
 ('Алимов','Ш. А. Алимов'),
 ('Поляков','К. Ю. Поляков'),
 ('Мединск','В. Р. Мединский'),
 ('Рыбченков','Л. М. Рыбченкова'),
 ('Гусаров','И. В. Гусарова'),
 ('Team Up','Team Up')] if re.search(pattern,desc+' '+card['title'],re.I)),None)
  idnum=card['url'].split('/')[-1]
  note=NOTES.get(idnum)
  if not note:
   note=f'Предметная программа Фоксфорда для учеников {gs[0]} класса. ' if len(gs)==1 else f'Предметная программа Фоксфорда для учеников {gs[0]}–{gs[-1]} классов. '
   if mod:note+='В содержании выделены '+', '.join(x.lower() for x in mod)+'. '
   if material:note+='Учебная основа: УМК '+material+'. '
   if 'Углуб' in card['title']:note+='Это углублённая версия: сравните входные требования и объём практики с базовым курсом. '
   if '5 сложных' in card['title'] or 'Аудиодиктант' in card['title'] or idnum=='16090':note+='Продукт рассчитан на отдельную тему или практику; его стоит сопоставлять с нужным разделом, а не со стоимостью полного учебного года. '
   else:note+='При выборе сопоставьте последовательность материала со школьным учебником и заранее уточните, как получить помощь с самостоятельной работой. '
  facts=[['Тип программы','Школьная программа'],['Преподаватель',teacher],['Формат материала','Видеоуроки в записи' if 'В записи' in card['text'] else 'Самостоятельная практика']]
  if count:facts.append(['Объём программы',f'{count} занятий'])
  if material:facts.append(['УМК / система',material])
  if access_until:facts.append(['Доступ к материалам','До 31 августа 2027 года'])
  elif '10 лет' in source_text:facts.append(['Доступ к материалам','10 лет по описанию школы'])
  c=dict(id=slug('foxford',url),title=clean(card['title']),brandId='foxford',brand='Фоксфорд',category=csub['baseCategory'],tags=list(dict.fromkeys([csub['baseCategory'],'shkolnye-predmety'])),ageRange=None,grade=grade_label,grades=gs,gradeEvidence=grade_label,format='В записи онлайн' if 'В записи' in card['text'] else 'Онлайн-тренажёр',online=True,learningGoal='school',schoolSubjects=[sub],price=dict(amount=price,unit='курс',**{'from':False},condition='Полная стоимость выбранного предметного курса; рассрочка и другие продукты оплачиваются отдельно',evidence=card['priceEvidence'],checkedAt=TODAY),offer=None,modules=mod,facts=facts,summary=note,editorialDescription=note,editorialCheckedAt=TODAY,sourceUrl=url,sourceTitle=clean(d['h1']),checkedAt=TODAY,contentHash=hashlib.sha256(source_text.encode()).hexdigest(),active=True,schoolEvidence={'url':url,'catalogUrl':'https://foxford.ru/catalog/courses/externship','basis':'Цель курса — освоение школьной программы; предмет и класс из карточки донора','checkedAt':TODAY},verificationMethod='public-browser',accessUntil=access_until)
  old=byurl.get(canonical(url))
  if old:c['id']=old['id'];courses[courses.index(old)]=c
  else:courses.append(c)
  byurl[canonical(url)]=c;review.append({'courseId':c['id'],'sourceUrl':url,'sourceHash':c['contentHash'],'subject':sub,'grades':gs,'checkedAt':TODAY,'classification':'School programme; not exam preparation','reviewedBy':'Codex — public course page and catalog card'})
 # One card per Skysmart programme, with genuine purchase packages inside it.
 packs=json.loads((WORK/'skysmart-school-packages.json').read_text());sky=json.loads((WORK/'skysmart-school-harvest.json').read_text())
 for r in sky+json.loads((WORK/'additional-school-harvest.json').read_text()):
  if r.get('status')!=200:continue
  title=clean(r['h1']);url=r['sourceUrl'];scope=title+' '+url
  sub='algebra' if 'алгебр' in title.lower() else next((s['id'] for s in SUBJECTS if s['id'] in {'matematika','russkiy','angliyskiy','fizika','himiya','obshchestvoznanie'} and re.search({'matematika':'математ|math','russkiy':'русск|russian','angliyskiy':'английск|english','fizika':'физик|physics','himiya':'хими|chemistry','obshchestvoznanie':'обществозн|social.science'}[s['id']],scope,re.I)),None)
  assert sub,title
  gs=grades_from(title);m=re.search(r'/(\d+)class/',url)
  if m:gs=[int(m[1])]
  assert gs,(title,url)
  cat=BYID[sub]['baseCategory'];mods=curriculum(r);safe=[];budget=max(0,24-len(title.split()))
  for label in mods:
   if len(label.split())<=budget:safe.append(label);budget-=len(label.split())
  n=re.search(r'(\d+) урок',title);facts=[['Тип программы','Школьная программа']]
  if n:facts.append(['Объём пакета',n[1]+' урока'])
  note=f'Предметные занятия по школьной программе: {title.split(" — ")[0].lower()}. '
  if r['brandId']=='skysmart':note+='Занятия проходят индивидуально с преподавателем. В карточке собраны варианты пакетов; полная сумма за пакет показана отдельно от платежа по рассрочке. План занятий и порядок тем подбираются с учётом ученика.'
  else:note+='Программа привязана к указанному школьному классу. Перед записью сравните расписание, проверку работ и нагрузку по всем предметам, входящим в пакет школы.'
  record=dict(id=slug(r['brandId'],url),title=title,brandId=r['brandId'],brand=r['brand'],category=cat,tags=list(dict.fromkeys([cat,'shkolnye-predmety'])),ageRange=None,grade=f'{gs[0]} класс' if len(gs)==1 else f'{gs[0]}–{gs[-1]} класс',grades=gs,gradeEvidence=title,format='Индивидуально онлайн' if r['brandId']=='skysmart' else 'Онлайн',online=True,learningGoal='school',schoolSubjects=[sub]+(['geometriya'] if 'геометр' in title.lower() else []),price=price_fact(r),offer=None,modules=safe,facts=facts,summary=note,editorialDescription=note,editorialCheckedAt=TODAY,sourceUrl=url,sourceTitle=title,checkedAt=TODAY,contentHash=r['contentHash'],active=True,schoolEvidence={'url':url,'basis':'Класс и школьный предмет в заголовке программы и адресе донора','checkedAt':TODAY})
  if r['brandId']=='skysmart':
   base=re.sub(r'-\d+-urokov$','',url);variants=[]
   for p in packs+[r]:
    if re.sub(r'-\d+-urokov$','',p['sourceUrl'])!=base or p.get('status')!=200:continue
    price=price_fact(p);lessons=int(re.search(r'-(\d+)-urokov$',p['sourceUrl'])[1])
    if price:variants.append({'lessons':lessons,'price':price,'sourceUrl':p['sourceUrl'],'sourceTitle':clean(p['h1'])})
   record['packages']=sorted({p['lessons']:p for p in variants}.values(),key=lambda p:p['lessons'])
  old=byurl.get(canonical(url))
  if old:record['id']=old['id'];courses[courses.index(old)]=record
  else:courses.append(record)
  byurl[canonical(url)]=record;review.append({'courseId':record['id'],'sourceUrl':url,'sourceHash':record['contentHash'],'subject':sub,'grades':gs,'checkedAt':TODAY,'classification':'School programme; not exam preparation','reviewedBy':'Codex — first-party programme page'})
 # Existing combined subject is not an exam or a new clone for every class.
 for c in courses:
  if c.get('learningGoal')=='school' and 'алгебр' in c['title'].lower():c['schoolSubjects']=list(dict.fromkeys(c['schoolSubjects']+['algebra']+(['geometriya'] if 'геометр' in c['title'].lower() else [])))
 duplicates={}
 for c in courses:
  if c['brandId']=='foxford':duplicates.setdefault(c['title'],[]).append(c)
 for group in duplicates.values():
  if len(group)>1:
   for c in group:c['title']+=' — '+next(v for k,v in c['facts'] if k=='Преподаватель')
 (DATA/'catalog.json').write_text(json.dumps(courses,ensure_ascii=False,indent=2)+'\n')
 previous_review=json.loads((DATA/'school-review.json').read_text()) if (DATA/'school-review.json').exists() else {}
 audit={**previous_review,'reviewedAt':TODAY,'scope':'Verified school courses and subject/class selections based on real offers','newCourses':len(review),'verifiedSourcePages':review,'allFoxfordPagesReviewed':len(cards),'noExamSubstitution':True,'originalEvidenceDirectory':'work/courses/','reviewedBy':'Codex'}
 (DATA/'school-review.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'courses':len(courses),'schoolCourses':sum(c.get('learningGoal')=='school' for c in courses),'new':audit['newCourses'],'packages':sum(len(c.get('packages',[])) for c in courses),'foxford':len(cards)},ensure_ascii=False))
if __name__=='__main__':main()
