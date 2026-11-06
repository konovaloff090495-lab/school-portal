# -*- coding: utf-8 -*-
"""Create only the explicit runtime blog additions and search records for rollout."""
from pathlib import Path
import json,html
from urllib.parse import urlencode
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'work/career'
P=json.loads((ROOT/'content/career/pages.json').read_text())
if isinstance(P,dict):P=P['pages']
E=lambda s:html.escape(str(s),quote=True)
updates=[]
for p in P:
 if not p['path'].startswith('/blog/'):continue
 sections=''.join('<section id="career-'+E(s.get('id',str(i)))+'"><h2>'+E(s['heading'])+'</h2>'+s['html']+'</section>' for i,s in enumerate(p['sections']))
 href='/proforientaciya/karta-interesov/?'+urlencode({'from':p['path']})
 sections+='<aside class="career-practical-next"><h2>От интересов — к первой пробе</h2><p>В новом <a href="/proforientaciya/">разделе профориентации</a> собраны занятия по классам, методики и практические пробы. Авторская карта интересов поможет выбрать следующий небольшой шаг.</p><p><a href="'+E(href)+'">Пройти карту интересов: 24 вопроса</a></p><p>Для школьников 10–18 лет, 5–11 классов. Полный результат после email и подтверждения совершеннолетнего заявителя. Это оригинальный опрос интересов, не диагностика способностей и не тест Климова или Холланда. Заявка партнёру — отдельный выбор.</p></aside>'
 related=p.get('related',[])
 if related:sections+='<h3>Продолжить изучение</h3><ul>'+''.join('<li><a href="'+E(x['path'])+'">'+E(x['title'])+'</a></li>' for x in related)+'</ul>'
 updates.append({'path':p['path'],'html':sections})
assert len(updates)==9
OUT.mkdir(parents=True,exist_ok=True)
(OUT/'blog-updates.json').write_text(json.dumps(updates,ensure_ascii=False,indent=2))
records=[{'t':p['title'],'u':'https://pro-schools.ru'+p['path'],'y':'page','s':'Профориентация · '+p.get('audience',''),'k':p.get('description',''),'region':''} for p in P if not p.get('noindex')]
(OUT/'search-records.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
print('Prepared',len(updates),'native blog additions and',len(records),'search records')
