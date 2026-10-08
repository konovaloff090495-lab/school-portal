"""Обновить локальный каталог изображений Wikimedia для тем учебника.

Запускать вручную из корня проекта: python3 scripts/textbook/build_image_catalog.py
Нужны requests и доступ к API Википедии и Wikimedia Commons.
"""

import hashlib, html, json, requests, subprocess, time
from pathlib import Path
from html.parser import HTMLParser

ROOT=Path(__file__).resolve().parents[2]
SELECTED={
'hero':('Students reading in leisure time.jpg','Школьники читают книги'),
'math_default':('Abacus actually in use at kimono shop in Otaru.jpg','Счёты для работы с числами'),
'math_fraction':('Pie chart example 01.svg','Круговая диаграмма долей'),
'math_clock':('Reloj analógico h0641.svg','Циферблат часов'),
'math_shapes':('UCB Geometric Shapes.png','Геометрические фигуры'),
'math_measure':('Ruler image.jpg','Линейка для измерения длины'),
'math_divisibility':('Divisibility graph.png','Граф делимости чисел'),
'algebra_default':('Graph of quadratic function y=x²-3x-4.png','График квадратичной функции'),
'algebra_probability':('Dice-111.svg','Игральные кости для задач по вероятности'),
'geometry_default':('Geom compass ruler.png','Циркуль и линейка'),
'geometry_triangle':('Triangle-angles.svg','Углы треугольника'),
'geometry_circle':('Circle and arc diagram japanese.svg','Окружность и дуга'),
'geometry_solids':('Platonic Solids Transparent.svg','Объёмные геометрические тела'),
'geometry_section':('Hexagonal cross section of the cube 3.png','Сечение куба плоскостью'),
'russian_default':('Russian handwriting 19 century.jpg','Образец русской рукописи'),
'russian_alphabet':('Russian alphabet, printed and cursive.png','Печатные и рукописные буквы русского алфавита'),
'russian_exclamation':('Orange exclamation mark.svg','Восклицательный знак'),
'literature_default':('Books on shelves (121).jpg','Книги на полках библиотеки'),
'literature_fairy':('Russian Wonder Tales 081.jpg','Иллюстрация к русской сказке'),
'literature_pushkin':('Kiprensky Pushkin.jpg','Портрет Александра Пушкина'),
'literature_tolstoy':('Ivan Nikolayevich Kramskoi - Portrait of Leo Tolstoy, 1873.jpg','Портрет Льва Толстого'),
'literature_chekhov':('Chekhov 1898 by Osip Braz.jpg','Портрет Антона Чехова'),
'literature_lermontov':('Mikhail lermontov.jpg','Портрет Михаила Лермонтова'),
'english_default':('A pile of English grammar books.png','Книги по английскому языку'),
'english_fruit':('Apples and bananas.jpg','Яблоки и бананы'),
'english_pets':('Like cat & dog (3043446170).jpg','Кошка и собака'),
'english_grammar':('Tenses-in-english.jpg','Схема времён английского языка'),
'physics_default':('A physics laboratory.jpg','Физическая лаборатория'),
'physics_electric':('RC circuit vector diagram.PNG','Схема электрической цепи'),
'physics_motion':("Newton's Cradle.jpg",'Маятник Ньютона'),
'physics_light':('Prism-rainbow.svg','Разложение света призмой'),
'physics_atom':('Bohr atom model.svg','Модель атома Бора'),
'chemistry_default':('Laboratory equipment of modern chemistry classroom.jpg','Оборудование кабинета химии'),
'chemistry_periodic':('Periodic table large.svg','Современная периодическая таблица химических элементов'),
'chemistry_molecule':('Amobarbital ball-and-stick.png','Объёмная модель молекулы'),
'biology_default':('Biology laboratory.jpg','Биологическая лаборатория'),
'biology_cell':('Plant cell structure-en.svg','Строение растительной клетки'),
'biology_dna':('DNA double helix horizontal.png','Двойная спираль ДНК'),
'biology_plant':('Leaf 1 web.jpg','Лист растения крупным планом'),
'biology_animal':('Animal diversity October 2007.jpg','Разнообразие животных'),
'history_default':('Historical documents in the Swedish National archives.jpg','Исторические документы в архиве'),
'history_china':('Great Wall of China (I) (7183821235).jpg','Великая Китайская стена'),
'history_france':('Prise de la Bastille.jpg','Взятие Бастилии во время Французской революции'),
'history_ww2':('Preveli World War II Memorial.JPG','Памятник Второй мировой войне'),
'history_kulikovo':('Dmitry Donskoy in the Battle of Kulikovo.jpg','Картина о Куликовской битве'),
'history_byzantium':('Theotokos Mosaic, Hagia Sophia, Constaninople (3245887692).jpg','Византийская мозаика в соборе Святой Софии'),
'history_egypt':('All Gizah Pyramids.jpg','Пирамиды Гизы в Египте'),
'history_greece':('Parthenon from south.jpg','Парфенон в Афинах'),
'history_rome':('Colosseum in Rome, Italy - April 2007.jpg','Колизей в Риме'),
'history_medieval':('Leeds Castle, Kent, England 3 - May 09.jpg','Средневековый замок'),
'history_russia':('Moscow 05-2012 Kremlin 22.jpg','Московский Кремль'),
'society_default':('Family Reading Hour.jpg','Семья читает вместе'),
'society_law':('Courtroom (4055605570).jpg','Зал суда'),
'society_economy':('Scales and coins AncRus GIM.jpg','Монеты и весы'),
'geography_default':('German terrestrial globe, circa 1725.jpg','Глобус Земли'),
'geography_mountain':('Landscape Arnisee-region.JPG','Горный ландшафт'),
'geography_ocean':('Ocean beach at low tide against the sun.jpg','Океанское побережье'),
'geography_climate':('Cloud cumulonimbus at baltic sea(1).jpg','Грозовые облака над морем'),
'informatics_default':('Keyboard in a college computer lab.jpg','Клавиатура в компьютерном классе'),
'informatics_code':('Programming code.jpg','Программный код на экране'),
'informatics_network':('DMZ network diagram 1 firewall.svg','Схема компьютерной сети'),
'informatics_table':('Libreoffice-calc.png','Электронная таблица LibreOffice Calc'),
'informatics_ai':('Artificial Intelligence (AI) and Robotics exhibition at the Heinz Nixdorf MuseumsForum.jpg','Выставка об искусственном интеллекте и робототехнике'),
'world_default':('Connecting children with nature. (9468387424).jpg','Дети изучают природу'),
'world_space':('NASA-Apollo8-Dec24-Earthrise.jpg','Земля, увиденная из космоса'),
'world_water':('Dülmen, Hausdülmen, Kettbach -- 2015 -- 8499-503.jpg','Ручей в природе'),
'world_body':('Human Skeleton Upper Body Anterior View.jpg','Скелет верхней части тела человека'),
}
class Strip(HTMLParser):
 def __init__(self):super().__init__();self.parts=[]
 def handle_data(self,d):self.parts.append(d)
def clean(s):
 p=Strip();p.feed(s or '');return ' '.join(html.unescape(''.join(p.parts)).split())[:180]

# Берём актуальные темы прямо из кода. Поиск выполняется только здесь, офлайн,
# а не при каждом открытии урока пользователем.
topics=json.loads(subprocess.check_output([
 'npx','tsx','-e',
 "import { textbookTopics } from './src/data/textbook'; process.stdout.write(JSON.stringify(textbookTopics.map(t=>({subject:t.subject,klass:t.klass,slug:t.slug,title:t.title}))))"
],cwd=ROOT,text=True))
s=requests.Session();s.headers['User-Agent']='ProSchoolsTextbookIllustrations/1.0 (https://pro-schools.ru/; educational images)'
found={}
titles=list(dict.fromkeys(t['title'] for t in topics))
for i in range(0,len(titles),50):
 chunk=titles[i:i+50]
 for attempt in range(3):
  try:
   response=s.post('https://ru.wikipedia.org/w/api.php',data={
    'action':'query','format':'json','formatversion':2,'redirects':1,
    'titles':'|'.join(chunk),'prop':'pageimages','piprop':'name|thumbnail','pithumbsize':720,
   },timeout=35)
   response.raise_for_status();data=response.json()['query'];break
  except Exception as exc:
   if attempt==2:print('Wikipedia batch failed',i,str(exc)[:100]);data={}
   else:time.sleep(2)
 aliases={x['from']:x['to'] for x in data.get('normalized',[])+data.get('redirects',[])}
 pages={page['title']:page for page in data.get('pages',[])}
 for title in chunk:
  target=title
  for _ in range(3):target=aliases.get(target,target)
  page=pages.get(target)
  if page and page.get('pageimage') and page.get('thumbnail'):
   found[title]={'file':page['pageimage']}
 time.sleep(.15)
files=list(dict.fromkeys(['File:'+v[0] for v in SELECTED.values()]+['File:'+v['file'] for v in found.values()]))
s=requests.Session();s.headers['User-Agent']='ProSchoolsTextbookIllustrations/1.0 (https://pro-schools.ru/; educational images)'
metadata={}
for i in range(0,len(files),40):
 for attempt in range(3):
  try:
   r=s.post('https://commons.wikimedia.org/w/api.php',data={'action':'query','format':'json','formatversion':2,'titles':'|'.join(files[i:i+40]),'prop':'imageinfo','iiprop':'url|size|mime|extmetadata','iiurlwidth':960},timeout=35)
   r.raise_for_status();data=r.json()['query'];break
  except Exception as e:
   if attempt==2:print('failed batch',i,str(e)[:100]);data={}
   else:time.sleep(2)
 for page in data.get('pages',[]):
  if page.get('imageinfo'):metadata[page['title']]=page['imageinfo'][0]
 time.sleep(.2)

def record(title,alt):
 ii=metadata.get('File:'+title) or metadata.get('File:'+title.replace('_',' '))
 if not ii:return None
 ext=ii.get('extmetadata',{});lic=clean(ext.get('LicenseShortName',{}).get('value',''))
 if not (lic in ('CC0','Public domain') or lic.startswith(('CC BY ','CC BY-SA '))):return None
 if ii.get('mime') not in ('image/jpeg','image/png','image/svg+xml','image/webp'):return None
 width=ii.get('thumbwidth') or ii.get('width') or 960; height=ii.get('thumbheight') or ii.get('height') or 540
 if ii.get('mime')!='image/svg+xml' and min(width,height)<180:return None
 return {'url':ii.get('thumburl') or ii.get('url'),'source':ii.get('descriptionurl'),'author':clean(ext.get('Artist',{}).get('value','')) or 'Автор указан на Wikimedia Commons','license':lic,'licenseUrl':clean(ext.get('LicenseUrl',{}).get('value','')).replace('http://','https://'),'width':width,'height':height,'alt':alt}
images={};named={};by_topic={}
def add(title,alt):
 rec=record(title,alt)
 if not rec:return None
 key=hashlib.sha1(title.encode()).hexdigest()[:12]
 if key not in images:images[key]=rec
 return key
for name,(file,alt) in SELECTED.items():
 key=add(file,alt)
 if key:named[name]=key
 else:print('missing curated',name,file)
BAD={('russkiy-yazyk','Частица'),('russkiy-yazyk','Текст'),('angliiskiy-yazyk','Части тела'),('literatura','Сказки о животных'),('literatura','Волшебные сказки'),('literatura','Басни'),('obshchestvoznanie','Свободное время'),('obshchestvoznanie','Политика'),('obshchestvoznanie','Добро и зло')}
for t in topics:
 match=found.get(t['title'])
 if not match or (t['subject'],t['title']) in BAD:continue
 key=add(match['file'],f"Изображение по теме «{t['title']}»")
 if key:by_topic[f"{t['subject']}/{t['klass']}/{t['slug']}"]=key
out={'images':images,'named':named,'topics':by_topic}
path=ROOT/'src/data/textbook-images.json';path.write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n')
print('images',len(images),'curated',len(named),'specific topics',len(by_topic),'bytes',path.stat().st_size)
