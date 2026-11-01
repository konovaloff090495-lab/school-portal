"""Import the public partner catalogue; preserve approval flags and exact offer IDs."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
raw=(ROOT/'work/sale-context/data.js').read_text()
items,_=json.JSONDecoder().raw_decode(raw[len('window.OFFERS='):])
keywords={
 'ege-pair':['ege','егэ'], 'oge-pair':['oge','огэ'],
 'first-game':['sozdan.*igr','sozdani.*igr','создани.*игр','igry.*ii','игр.*ии','gamedev'],
 'school-calm':['stress','стресс','trevozh','тревож','shkol.*strah','школ.*страх','adaptaci','адаптац'],
 'homeschool':['domashn','домашн.*обуч','onlajn.shkol','онлайн.школ','семейн.*обуч','semeyn'],
 'vibecoding':['vibe','вайб','ai.*kod','ии.*код','programmirovani.*ii','программирован.*ии'],
 'blogging':['bloging','блогинг','blogger','блогер','kontent','контент','social.*set','социал.*сет'],
 'ai-design':['dizajn.*ii','дизайн.*ии','figma','фигма','nejro.*diz','нейро.*диз'],
 'skills':['soft.skills','гибк.*навык','gibk','kommunik','коммуникац','uverenn','уверенн','emoc','эмоц','obshchen','общени'],
 'ai-study':['uchim.uchits','учим.учиться','ii.*uch','ии.*учеб','ии.*учёб','нейросет.*учеб','nejroset.*uch'],
 'lecture':['lektor','лектор','besplatn.*zanyat','бесплатн.*занят','besplatn.*kurs','бесплатн.*курс'],
 'money':['finansov.*gramot','финансов.*грамот','карманн.*деньг','karmann.*den','бюджет.*подрост'],
 'world-junior':['scratch','скретч','скрэтч','roblox','роблокс','minecraft','майнкрафт','igrov.*mir','игров.*мир'],
 'premium':['premium','премиум','profiln.*klass','профильн.*класс'],
 'hoodie':['podrost.*klub','подрост.*клуб','druzhb','дружб','sverstnik','сверстник','lyudi.v.hudi','люди.в.худи'],
 'fullstack':['fullstack','full.stack','фулст','javascript','java.script','html','css','veb.razrab','веб.разраб','frontend','фронтенд','react'],
 'profile':['profiln','профильн','профил.*выбор','proforient','профориент'],
 'future':['navyk.*budush','навык.*будущ','lider','лидер','kritich.*mysh','критич.*мыш'],
 'artist-young':['risovan','рисован','рисун','cifrov.*ris','цифров.*рис','kak.narisovat','как.нарисовать'],
 'tutor':['diagnost.*znan','диагност.*знан','probel','пробел','uspevaem','успеваем','repetitor','репетитор'],
 'world-teen':['python','питон','пайтон','godot','годот','unity','unreal','blender','блендер','3d.igr'],
 'artist-teen':['dizajn','дизайн','3d','modelirovan','моделирован','photoshop','фотошоп','illustrator','иллюстратор'],
 'externat':['ekstern','экстерн','attestat','аттестат','vechern','вечерн','ne.zakonchil','не.закончил'],
 'trial-it':['programmirov','программиров','kodirov','кодиров','компьютерн.*курс','kompyutern.*kurs'],
 'trial-skills':['diagnost.*navyk','диагност.*навык','diagnost.*reben','диагност.*реб'],
 'comfort':['komfort','комфорт','перевод.*школ','perevod.*shkol','zaoch','заоч'],
 'ai-basics':['nejroset','нейросет','iskusstvenn.*intellekt','искусственн.*интеллект','chatgpt','чатгпт','нейрон','neyron'],
 'standard':['urok.*zapis','урок.*запис','videourok','видеоурок','samostoyat.*obuch','самостоятельн.*обуч'],
 'ege-tutor':['repetitor.*ege','репетитор.*егэ','individual.*ege','индивидуальн.*егэ'],
 'oge-tutor':['repetitor.*oge','репетитор.*огэ','individual.*oge','индивидуальн.*огэ'],
 'school-tutor':['shkoln.*programm','школьн.*программ','pomoch.*ucheb','помочь.*уч','домашн.*задан','domashn.*zadan'],
 'november-kit':['nejroset.*nach','нейросет.*нач','знакомств.*ии','znakomstv.*ii'],
 'dubai-campus':['dubai','dubay','дубай','оаэ','uae'],
 'dubai-innovation':['dubai.*biznes','дубай.*бизнес','innovation','инновац'],
 'international-double':['dvojn.*diplom','двойн.*диплом','dva.diplom','два.диплом','mezhdunarod.*obuch','международ.*обуч'],
 'china-multimedia':['kitaj.*diplom','кита.*диплом','multimedia','мультимедиа'],
 'china-study':['kitaj','китай','kitay','китае'],
 'camp-comics':['komiks','комикс','animaci','анимаци','art.kemp','арт.кэмп'],
 'camp-china':['lager.*kit','лагер.*кита','кита.*лагер','kit.*lager'],
 'camp-it':['it.lager','ит.лагер','programmirov.*lager','программирован.*лагер'],
 'vneurochka-all':['vneuroch','внеуроч','dop.*obrazovan','доп.*образован'],
}
subjects={
 'angliyskiy':['anglij','angliys','english','англий','am.is.are','артикл','artikl','transkrip','транскрип','present','past','future.simple'],
 'razgovornyy-angliyskiy':['razgovorn.*angl','разговорн.*англ','speaking','dialog.*angl','диалог.*англ'],
 'ispanskiy':['ispansk','испанск','spanish'], 'algebra':['algebra','алгебр','uravnen','уравнен','квадратн','kvadratn'],
 'geometriya':['geometri','геометри','treugol','треугол','окружност','okruzhnost'],
 'nachertatelnaya-geometriya':['nachertateln','начертательн','cherchen','черчен'],
 'informatika':['informatik','информатик','алгоритм','algoritm'],
 'literatura':['literatur','литератур','pushkin','пушкин','chehov','чехов','tolstoj','толсто','lermontov','лермонтов','proizveden','произведен'],
 'obshchestvoznanie':['obshchestvoz','обществоз','obshestvoz'],
 'olimpiadnaya-matematika':['olimpiad.*matem','олимпиад.*матем','matem.*olimp','матем.*олимп'],
 'olimpiadnyy-russkiy':['olimpiad.*russ','олимпиад.*рус','russ.*olimp','рус.*олимп'],
 'eksperimentalnaya-biologiya-himiya':['biolog','биолог','himi','хими','khimi'],
 'zhivoy-mehanizm':['anatomi','анатоми','fiziolog','физиолог','organizm','организм'],
 'finansovaya-gramotnost':['finansov','финансов','dengi','деньги'],
 'iskusstvo-i-tvorchestvo':['iskusstv','искусств','tvorch','творч','рисован','risovan'],
 'literaturnyy-klub':['чтен','chten','knig','книг','чита','chita'],
 'soft-skills':['soft.skills','гибк.*навык','gibk'], 'etika':['etik','этик','moral','морал'],
 'psihologicheskaya-razgruzka':['psiholog','психолог','stress','стресс','тревож','trevozh'],
 'proforientaciya':['proforient','профориент','vybor.profess','выбор.професс','kem.stat','кем.стать'],
 'fitnes-i-gimnastika':['fitnes','фитнес','gimnast','гимнаст','zaryadk','зарядк','fizkultur','физкультур'],
 'itogovoe-sobesedovanie':['itogov.*sobesed','итогов.*собесед','ustn.*sobesed','устн.*собесед'],
 'itogovoe-sochinenie':['itogov.*sochinen','итогов.*сочинен'],
}
faculties={
 '4':['yurid','юрид','pravo','право','юрист','yurist'], '6':['informacionn.*tehnolog','информационн.*технолог','it.profess','ит.професс'],
 '3':['menedzh','менедж'], '13':['psiholog','психолог'], '7':['biznes','бизнес'], '58':['basta','баста','sovremenn.*muzyk','современн.*музык'],
 '1':['ekonom','эконом'], '9':['dizajn','дизайн'], '28':['pedagog','педагог','uchitel','учител'], '20':['medicin','медицин','vrach','врач'],
 '57':['inzhener','инженер'], '42':['kiberbez','кибербез'], '52':['logistik','логистик'], '36':['mezhdunarod.*biznes','международ.*бизнес'],
 '35':['komiks','комикс'], '56':['igrov.*industr','игров.*индустр'], '16':['sport','спорт'],
 '55':['muzykaln.*industr','музыкальн.*индустр'], '45':['animac','анимац'], '48':['tehnich.*uprav','технич.*управ'],
 '8':['reklam','реклам'], '10':['inostrann.*yazyk','иностранн.*язык'], '49':['teploener','теплоэнер'],
 '12':['kino','кино','televid','телевид'], '18':['mezhdunarod.*otnoshen','международ.*отношен'], '23':['programmirov','программиров'],
 '54':['stroitel','строител'], '46':['gosudarst.*uprav','государств.*управ'], '11':['zhurnal','журнал'],
 '14':['turizm','туризм','gostepriim','гостеприим'], '34':['internet.profess','интернет.професс'],
 '44':['tehnosfer','техносфер'], '22':['gejmdizajn','геймдизайн','game.design'], '41':['blokchejn','блокчейн','kriptov','криптов'],
 '47':['elektroener','электроэнер','elektrotehn','электротех'], '17':['art.fak','арт.фак','iskusstv','искусств'],
 '50':['politolog','политолог'], '37':['komyuniti','комьюнити'], '5':['bankov','банков'], '32':['ivent','ивент','event'],
 '27':['tehnolog.*predprinim','технолог.*предприним'], '21':['e.commerce','elektronn.*torg','электронн.*торг'],
 '31':['iskusstvenn.*intellekt','искусственн.*интеллект'],
}
out=[]
for o in items:
 id=o['id']; kw=keywords.get(id,[])
 if id.startswith('lektoriy-'):kw=subjects.get(id[9:],[])
 if id.startswith(('college-','university-')):
  kw=faculties.get(id.split('-')[1],[])
  # All exact subject names also participate; generic words never become rules.
  if not kw:
   words=re.findall(r'[А-Яа-яёЁa-zA-Z]{5,}',o.get('sub','').lower());kw=[w[:7] for w in words if w not in ['факультет','колледж','школа','индустрии']]
 if not kw:raise ValueError('Missing relevance rules: '+id)
 approval=o.get('offerApprovalRequired',False)
 title=o.get('cardTitle') or o['title']; discount=o['discount'];description=o.get('cardText') or o.get('sub') or o['explainer']
 if approval:
  title=re.sub(r'^−30%\s*·\s*','',title);title=('Колледж: ' if id.startswith('college-') else 'Университет: ')+title
  discount='Спецусловия';description='Программы по направлению. Стоимость, набор и доступные скидки уточняются на странице предложения.'
 out.append({'id':id,'brand':o['brand'],'category':o['cat'],'title':title,'description':description,'benefit':discount,'age':o['age'],'minAge':o['amin'],'maxAge':o['amax'],'image':o['image'],'keywords':kw,'approvalRequired':approval,'free':o.get('isFree',False) or discount=='Бесплатно'})
(ROOT/'public/sale-context/offers.json').write_text(json.dumps({'version':'20261101','source':'https://school-university.com/sale/','verifiedAt':'2026-11-01','offers':out},ensure_ascii=False,separators=(',',':'))+'\n')
print('Imported',len(out),'offers;',sum(x['approvalRequired'] for x in out),'approval flags preserved')
