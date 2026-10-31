#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Keep Wordstat observations intact; never sum overlapping broad frequencies."""
import csv,json,re,collections,datetime
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'research/family-support';O=R/'outputs/family-support';O.mkdir(parents=True,exist_ok=True)
raw=json.loads((D/'raw/wordstat-fresh.json').read_text());measures=json.loads((D/'measures-register.json').read_text());ids={m['id'] for m in measures}
owners={
'пособия на детей':'/podderzhka-semej/','льготы семьям с детьми':'/podderzhka-semej/','единое пособие':'edinoe-posobie','пособие при рождении ребенка':'posobie-rozhdenie-rebenka','пособие по уходу за ребенком':'posobie-uhod-do-polutora-let','пособие по беременности и родам':'posobie-beremennost-rody','материнский капитал':'matkapital','ежегодная семейная выплата':'ezhegodnaya-vyplata-semyam','льготы многодетным':'lgoty-mnogodetnym-semyam-shkola','пособие малоимущим семьям':'/podderzhka-semej/','социальный контракт':'socialnyj-kontrakt-semyam','семейная ипотека':None,'450 тысяч на ипотеку':'450-tysyach-ipoteka','субсидия жкх':None,'налоговый вычет на детей':'nalogovyj-vychet-na-detej','вычет за обучение ребенка':'nalogovyj-vychet-obuchenie-detej-2026','компенсация за детский сад':'kompensaciya-detskij-sad','бесплатное питание в школе':'besplatnoe-pitanie-v-shkole-komu-polozheno','выплаты к школе':'posobie-k-shkole-vyplaty-2026','льготы детям инвалидам':'/podderzhka-semej/','пособие по уходу за ребенком инвалидом':'uhod-rebenok-invalid','пособие при усыновлении':'posobie-usynovlenie-opeka','выплаты опекунам':'posobie-usynovlenie-opeka','льготы матерям одиночкам':'/podderzhka-semej/','льготы детям участников сво':'/podderzhka-semej/','выплаты семьям погибших сво':'/podderzhka-semej/','льготы детям ветеранов боевых действий':'/podderzhka-semej/','льготы детям пропавших без вести':'/podderzhka-semej/','путевки в лагерь бесплатно':None,'бесплатные лекарства детям':None,'льготы на проезд детям':None,'льготы при поступлении детям сво':'postuplenie-deti-uchastnikov-svo','пособия москва дети':None,'пособия санкт петербург дети':None,'пособия московская область дети':None}
def url(slug):return ('https://pro-schools.ru'+slug if slug.startswith('/') else 'https://pro-schools.ru/blog/'+slug+'/') if slug else ''
def norm(p):return re.sub(r'\s+',' ',p.lower().replace('ё','е')).strip()
obs=[];assoc=[];seeds=[];groups=collections.defaultdict(list)
for seed,x in raw['seeds'].items():
 seeds.append(dict(seed=seed,totalCount=x['total_count'],firstPhraseCount=int(x['results'][0]['count']) if x['results'] else None,rows=len(x['results']),limitReached=len(x['results'])==2000,region='225 Россия',devices='DEVICE_ALL',retrievedAt=x['retrieved_at'],metric='broad,last30days; exact period unavailable',candidateURL=url(owners[seed])))
 for typ,dest in [('results',obs),('associations',assoc)]:
  for n,row in enumerate(x[typ]):
   z=dict(seed=seed,phrase=row['phrase'],count=int(row['count']),position=n+1,region='225 Россия',devices='DEVICE_ALL',retrievedAt=x['retrieved_at'],type=typ)
   dest.append(z)
   if typ=='results':groups[norm(row['phrase'])].append(z)
phrases=[]
for key,rows in groups.items():
 rows.sort(key=lambda r:r['retrievedAt']);last=rows[-1];seed=last['seed'];phrase=last['phrase'];p=norm(phrase);target=owners[seed];note='Редакторская группировка, не SERP-overlap; покрытие уточнить по содержанию'
 # A specific legal intent takes precedence over the seed it happened to appear in.
 rules=[(r'инвалид.*уход|уход.*инвалид','uhod-rebenok-invalid'),(r'вычет.*обуч|обуч.*вычет','nalogovyj-vychet-obuchenie-detej-2026'),(r'семейн.*выплат|семейн.*налог','ezhegodnaya-vyplata-semyam'),(r'450.*ипотек|ипотек.*450','450-tysyach-ipoteka'),(r'социал.*контракт.*томск|томск.*социал.*контракт','socialnyj-kontrakt-tomsk'),(r'субсиди.*жк.*московск|московск.*субсиди.*жк','subsidia-zhku-moskovskaya-oblast'),(r'усынов.*пособ|пособ.*усынов','posobie-usynovlenie-opeka'),(r'поступ.*сво|сво.*поступ','postuplenie-deti-uchastnikov-svo')]
 for pattern,slug in rules:
  if re.search(pattern,p):target=slug;break
 exclusion=bool(re.search(r'беларус|казахстан|украин|германи|узбекистан|кыргыз|армении|азербайджан',p))
 historic=bool(re.search(r'\b20(?:1\d|2[0-5])\b',p))
 status='Кандидат URL, нужна редакторская проверка'
 if exclusion:status='Исключено: другая страна';target=None
 elif historic:status='Исторический запрос: отдельная проверка';target=None
 elif target is None:status='Пробел: нет проверенной страницы'
 elif norm(seed)==p:status='Основной запрос группы'
 if target and not target.startswith('/') and target not in ids:raise ValueError(target)
 phrases.append(dict(phrase=phrase,count=last['count'],countMin=min(x['count'] for x in rows),countMax=max(x['count'] for x in rows),observations=len(rows),seed=seed,allSeeds=' | '.join(dict.fromkeys(x['seed'] for x in rows)),candidateURL=url(target),status=status,region='225 Россия',devices='DEVICE_ALL',retrievedAt=last['retrievedAt'],metric='broad,last30days; exact period unavailable',note=note))
phrases.sort(key=lambda r:-r['count'])
byurl={url(m['id']):m for m in measures}
for q in phrases:
 p=norm(q['phrase']);m=byurl.get(q['candidateURL'],{})
 q['aidType']=m.get('kind','Требует уточнения')
 q['lifeSituation']=' | '.join(m.get('situations',[]))
 q['recipientIntent']=' | '.join(label for pattern,label in [(r'беремен','Беременная'),(r'многодет','Многодетная семья'),(r'малоимущ|малообесп','Малоимущая семья'),(r'одиноч|единственн.*родител','Один родитель'),(r'инвалид','Инвалидность'),(r'опек|приемн','Опека / приёмная семья'),(r'усынов','Усыновление'),(r'сво|военнослуж|ветеран','Семья военного / ветеран')] if re.search(pattern,p))
 q['conditionIntent']=' | '.join(label for pattern,label in [(r'доход|мрот|минимум','Доход'),(r'имуществ|квартир|машин|автомобил','Имущество'),(r'возраст|лет|месяц|1.5|1,5','Возраст / период'),(r'отказ|не одобр','Отказ'),(r'срок|когда|рассмотр','Сроки'),(r'документ|справк','Документы')] if re.search(pattern,p))
 q['channelIntent']=' | '.join(label for pattern,label in [(r'госуслуг','Госуслуги'),(r'мфц','МФЦ'),(r'сфр|социальн.*фонд','СФР'),(r'соцзащит','Соцзащита'),(r'фнс|налогов','ФНС / налоговый интент'),(r'школ|сад','Образовательная организация / тема')] if re.search(pattern,p))
 q['territoryScope']=m.get('region','Не определена')
def save(name,rows):
 (O/(name+'.json')).write_text(json.dumps(rows,ensure_ascii=False,indent=2))
 if rows:
  with (O/(name+'.csv')).open('w',encoding='utf-8-sig',newline='') as f:
   w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
for name,rows in [('phrases',phrases),('seed-queries',seeds),('observations',obs),('associations',assoc)]:save(name,rows)
summary={'seeds':len(seeds),'observations':len(obs),'uniquePhrases':len(phrases),'associations':len(assoc),'statuses':dict(collections.Counter(p['status'] for p in phrases)),'saturatedSeeds':[s['seed'] for s in seeds if s['limitReached']],'hypotheses':0,'errors':raw['errors'],'frequencyPolicy':'Latest observation; range retained. Counts are overlapping, never summed. totalCount is not phrase count.'}
(O/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2));print(json.dumps(summary,ensure_ascii=False))
