from common import *
import csv
if (HERE/'config.json').exists():raise SystemExit('Fixed panel already configured; do not regenerate its identifiers during refresh.')
clusters=json.loads((ROOT/'research/proforientaciya-2026-11-06/semantics/clusters.json').read_text())
base=['профориентация','профориентация для школьников','профориентация для детей','профориентация для подростков','тест на профориентацию','тест на профориентацию для школьников','тест на профориентацию бесплатно','профориентация онлайн','профориентация для младших школьников','как помочь ребенку выбрать профессию','ребенок не знает кем хочет стать']
base += [f'профориентация для {n} класса' for n in range(5,12)]
base += [f'тест на профориентацию {n} класс' for n in range(5,12)]
base += ['тест Климова профориентация','тест Холланда профориентация','карта интересов Голомштока','тест Йовайши профориентация','тест Резапкиной профориентация','тест Кабардовой профориентация','карта интересов Азбель Грецов','тест Ориентация Соломина','как выбрать профессию после 9 класса','как выбрать профессию после 11 класса','колледж или 10 класс','профориентационные игры для школьников','классный час профориентация 5 класс','классный час профориентация 9 класс','профориентация для родителей','профориентация для дошкольников','ранняя профориентация детей','профориентация для школьников москва','профориентация для школьников спб','профориентация стоимость','профориентация для подростков отзывы','лучшие тесты на профориентацию','методики профориентации школьников','профессиональные пробы для школьников','план профориентации в школе','презентация профориентация','профориентация 2026','профориентация россия мои горизонты','билет в будущее профориентация']
base=list(dict.fromkeys(base+['тест на выбор профессии','дифференциально диагностический опросник климова','профориентация для детей 10 лет']))[:55]
assert len(base)==55, len(base)
queries=json.loads((ROOT/'research/proforientaciya-2026-11-06/semantics/queries.json').read_text());print(type(queries).__name__)
# The fixed panel is representative, not all semantic phrases or all pages.
items=[]
for q in base:
 match=[c for c in clusters if q in c.get('representative_queries',[]) or q==c.get('head_query')]
 items.append({'query':q,'target_urls':[c['target_url'] for c in match],'clusters':[c['cluster'] for c in match],'selection':'fixed_representative_panel','introduced':'2026-11-06'})
config={'version':1,'site':SITE,'created_at':now(),'followup_date':'2026-11-13','project_id':28653775,'group_name':'Профориентация 20261106','preferred_region_key':225,'region_policy':'Use existing project default Russia (225), preserving all project searchers, regions and depth. No project-wide changes.','queries':items,'max_check_rub':100,'data_semantics':'Missing GSC rows and positions are unavailable/not_reported, never synthesized as zero.'}
(HERE/'config.json').write_text(json.dumps(config,ensure_ascii=False,indent=2));save('panel.json',config)
with (OUT/'panel.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.DictWriter(f,fieldnames=items[0]);w.writeheader();w.writerows(items)
print('fixed panel',len(items))
