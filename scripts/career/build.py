#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Render exact-route career release; source content and approved site chrome."""
import argparse,datetime,hashlib,html,json,re,shutil,urllib.parse
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'work/career/release';AS=OUT/'career-assets'
VERSION='20261106.2';SITE='https://pro-schools.ru';TEST='/proforientaciya/karta-interesov/';RESULT='/proforientaciya/rezultat/'
E=lambda x:html.escape(str(x),quote=True)
def load():
 global chrome,P
 chrome=json.loads((ROOT/'src/site-navigation/chrome.json').read_text())
 P=json.loads((ROOT/'content/career/pages.json').read_text())
 if isinstance(P,dict):P=P['pages']
def nav(part):return f'<div class="ps-chrome ps-chrome-{part}" data-navigation-version="{E(chrome["version"])}">'+chrome[part]+'</div>'
def localnav():return '<nav class="local-nav" aria-label="Профориентация"><a href="/proforientaciya/">Профориентация</a><div><a href="/proforientaciya/#classes">По классам</a><a href="/proforientaciya/#methods">Методики</a><a href="/proforientaciya/#parents">Родителям</a><a href="'+TEST+'">Карта интересов ↗</a></div></nav>'
def doc(title,desc,path,body,private=False,ld=None):
 robots='noindex,nofollow,noarchive' if private else 'index,follow'
 analytics='' if private else '''<script>window.ym=window.ym||function(){(window.ym.a=window.ym.a||[]).push(arguments)};window.ym.l=Date.now();ym(108789843,'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:false});</script><script async src="https://mc.yandex.ru/metrika/tag.js"></script>'''
 schema='' if private or not ld else '<script type="application/ld+json">'+json.dumps(ld,ensure_ascii=False).replace('</','<\\/')+'</script>'
 runtime='/career-assets/privacy-navigation.js' if private else '/site-navigation/navigation.js'
 return f'''<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{E(title)}</title><meta name="description" content="{E(desc)}"><meta name="robots" content="{robots}"><meta name="referrer" content="{'no-referrer' if private else 'strict-origin-when-cross-origin'}"><link rel="canonical" href="{SITE+path}"><link rel="icon" href="/favicon.ico"><link rel="stylesheet" href="/site-navigation/navigation.css?v={E(chrome['version'])}"><link rel="stylesheet" href="/career-assets/style.css?v={VERSION}">{schema}{analytics}</head><body data-career-page="{'private' if private else 'public'}"><a class="screen-reader" href="#main">К содержимому</a>{nav('header')}<main class="pf" id="main">{localnav()}{body}</main>{nav('footer')}<script src="{runtime}?v={E(chrome['version'])}" defer></script><script type="module" src="/career-assets/client.js?v={VERSION}"></script></body></html>'''
def save(path,text):
 assert path.startswith('/') and path.endswith('/') and '..' not in path
 p=OUT/path.strip('/')/'index.html';p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text)
def cta(p):
 q=p.get('cta') or {};href=q.get('href',TEST)
 if href.split('?')[0]==TEST:
  params=dict(urllib.parse.parse_qsl(urllib.parse.urlsplit(href).query));params['from']=p['path']
  match=re.search(r'(?:^|[/_-])(1[01]|[5-9])-(?:1[01]|[5-9])-(?:klass|klassa|klasse)(?:[/_-]|$)',p['path']) or re.search(r'(?:^|[/_-])(1[01]|[5-9])-(?:klass|klassa|klasse)(?:[/_-]|$)',p['path'])
  if match:params.setdefault('grade',match.group(1))
  href=TEST+'?'+urllib.parse.urlencode(params)
 return f'<aside class="inline-cta"><p class="eyebrow">ОТ ИНТЕРЕСОВ К ПЕРВОЙ ПРОБЕ</p><h2>Понять, что интересно попробовать</h2><p>Авторский опрос из 24 вопросов для школьников 10–18 лет, 5–11 классов. Не измеряет способности и не назначает профессию.</p><a class="btn primary" href="{E(href)}">{E(q.get("label","Пройти карту интересов"))} ↗</a><p class="micro">Примерно 5–7 минут. Полный результат открывается после email и подтверждения совершеннолетнего родителя или самого участника 18 лет. Передача партнёру — отдельный выбор.</p></aside>'
def section(s,i):return f'<section id="{E(s.get("id","section-"+str(i)))}"><h2>{E(s["heading"])}</h2>{s.get("html","")}</section>'
def render(p):
 path=p['path'];title=p['title'];desc=p.get('description','');lead=p.get('lead',desc);original=None
 if p.get('original_mode')=='append':
  original_path=p.get('original_path',path);slug=original_path.strip('/').split('/')[-1].removesuffix('.json')
  original_file=ROOT/original_path if original_path.startswith('content/') else ROOT/'content/blog'/f'{slug}.json'
  original=json.loads(original_file.read_text());title=original['title'];desc=original.get('excerpt',desc);lead=desc
 sections=''.join(section(s,i) for i,s in enumerate(p.get('sections',[])))
 original_html=''
 if original:
  original_html=original.get('content','')
  if isinstance(original_html,list):raise ValueError('Unsupported original content type '+path)
  sections='<div data-preserved-original>'+original_html+'</div>'+sections
 faq=p.get('faq',[])
 if faq:sections+='<section class="faq"><h2>Вопросы и ответы</h2>'+''.join('<details><summary>'+E(x['question'])+'</summary><p>'+E(x['answer'])+'</p></details>' for x in faq)+'</section>'
 if p.get('sources'):sections+='<section class="sources"><h2>Источники</h2><ul>'+''.join('<li><a href="'+E(x['url'])+'" target="_blank" rel="noopener noreferrer">'+E(x['title'])+'</a></li>' for x in p['sources'])+'</ul></section>'
 related=[] if path=='/proforientaciya/' else p.get('related',[])
 if related:sections+='<section><h2>Продолжить изучение</h2><ul class="catalog">'+''.join('<li><a href="'+E(x['path'])+'">'+E(x['title'])+'</a></li>' for x in related)+'</ul></section>'
 body=f'<div class="crumb"><a href="/">Главная</a> / <a href="/proforientaciya/">Профориентация</a> / Материал</div><section class="editorial-head"><p class="eyebrow">{E(p.get("audience","ДЛЯ ШКОЛЬНИКОВ И РОДИТЕЛЕЙ"))}</p><h1>{E(title)}</h1><p class="lead">{E(lead)}</p><p class="micro">{E(original.get("author","Редакция ProSchools") if original else "Редакция ProSchools")} · дополнено 6 ноября 2026</p></section><div class="article-grid"><article>{sections}{cta(p)}</article><aside class="sticky-note"><span class="eyebrow">ПЕРВЫЙ ШАГ</span><h3>Не выбирать раз и навсегда. Начать с интереса.</h3><p>Пройдите оригинальный опрос и выберите небольшую пробу на неделю.</p><a class="btn primary" href="{TEST}">Карта интересов ↗</a><p class="micro">24 вопроса. Полный результат после контакта взрослого. Предложения партнёров — по желанию.</p><a class="text-link" href="/proforientaciya/">Все материалы раздела</a></aside></div>'
 if p.get('kind')=='legal':body=f'<section class="editorial-head"><p class="eyebrow">УСЛОВИЯ СЕРВИСА</p><h1>{E(title)}</h1><p class="lead">{E(lead)}</p></section><article class="legal-article">'+sections+'</article>'
 if path=='/proforientaciya/':body=hub_body(p)+body[body.find('<div class="article-grid">'):]
 ld={'@context':'https://schema.org','@type':'Article','headline':title,'description':desc,'mainEntityOfPage':SITE+path,'dateModified':'2026-11-06','author':{'@type':'Organization','name':original.get('author','Редакция ProSchools') if original else 'Редакция ProSchools'},'publisher':{'@type':'Organization','name':'ProSchools','url':SITE},'inLanguage':'ru'}
 if original and original.get('publishedAt'):ld['datePublished']=original['publishedAt']
 if p.get('kind')!='legal':body=body.replace('href="'+TEST+'"','href="'+TEST+'?from='+urllib.parse.quote(path,safe='')+'"')
 rendered=doc(title+' | ProSchools',desc,path,body,private=bool(p.get('noindex')),ld=ld)
 if original:
  preview=ROOT/'work/career/existing-preview'/path.strip('/')/'index.html';preview.parent.mkdir(parents=True,exist_ok=True);preview.write_text(rendered)
 else:save(path,rendered)
 return {'path':path,'original_path':p.get('original_path'),'original_sha256':hashlib.sha256(original_html.encode()).hexdigest() if original else None,'preserved_original':bool(original),'noindex':bool(p.get('noindex'))}
def hub_body(p):
 art=(ROOT/'scripts/career/hero-art.html').read_text()
 head=f'<div class="crumb">Главная / Профориентация</div><section class="hero"><div><p class="eyebrow">ПРОФОРИЕНТАЦИЯ / ШКОЛЬНИКАМ И РОДИТЕЛЯМ</p><h1>Профориентация<br>для школьников.<br><em>Найти, что твоё.</em></h1><p class="lead">Поможем школьнику заметить свои интересы, а родителям — понять, что предложить попробовать дальше. Без давления и единственного правильного ответа.</p><a class="btn primary" href="{TEST}">Пройти карту интересов ↗</a><p class="micro">24 вопроса · примерно 5–7 минут. Полный результат после email взрослого. Заявка партнёру — отдельный выбор.</p></div>{str(art)}</section><div class="promise-strip"><span>01 <b>Заметить интересы</b></span><span>02 <b>Выбрать первые пробы</b></span><span>03 <b>Найти подходящее занятие</b></span></div>'
 groups={'classes':('По классам и возрасту',[]),'methods':('Тесты и методики',[]),'teachers':('Педагогам: занятия и материалы',[]),'parents':('Родителям и школьникам',[])}
 for q in P:
  if q['path']=='/proforientaciya/':continue
  kind=str(q.get('kind',''));aud=str(q.get('audience','')).lower();path=q['path']
  group='methods' if '/testy/' in path or 'method' in kind else 'classes' if re.fullmatch(r'/proforientaciya/(?:[1-9]|10|11)-klass/',path) or any(x in path for x in ['test-5-8','test-9-11','dlya-detey','dlya-podrostkov']) else 'teachers' if '/pedagogam/' in path or 'teacher' in kind else 'parents'
  groups[group][1].append(q)
 for ident,(name,qs) in groups.items():
  head+=f'<section id="{ident}"><p class="eyebrow">ВЫБЕРИТЕ СВОЮ ЗАДАЧУ</p><h2>{name}</h2>'
  if ident=='classes':
   classpages=[q for q in qs if re.fullmatch(r'/proforientaciya/(?:[1-9]|10|11)-klass/',q['path'])]
   classpages.sort(key=lambda q:int(q['path'].split('/')[2].split('-')[0]))
   head+='<nav class="grade-switch" aria-label="Материалы по классам">'+''.join('<a href="'+E(q['path'])+'">'+q['path'].split('/')[2].split('-')[0]+' класс</a>' for q in classpages)+'</nav>'
   qs=[q for q in qs if q not in classpages]
  preferred={'methods':['/proforientaciya/testy/klimov/','/proforientaciya/testy/holland/','/proforientaciya/testy/golomshtok/'],'teachers':['/proforientaciya/pedagogam/lessons/','/proforientaciya/pedagogam/scenarios/','/proforientaciya/pedagogam/worksheets/']}.get(ident,[])
  qs=sorted(qs,key=lambda q:preferred.index(q['path']) if q['path'] in preferred else len(preferred)) if preferred else qs
  shown,more=qs[:3],qs[3:]
  head+='<div class="cards three">'+''.join('<a class="white-card" href="'+E(q['path'])+'"><h3>'+E(q['title'])+'</h3><p>'+E(q.get('lead',q.get('description','')))[:260]+'</p><span class="text-link">Открыть материал ↗</span></a>' for q in shown)+'</div>'
  if more:head+='<details class="hub-more"><summary>Все материалы: '+str(len(qs))+' · открыть список</summary><div class="hub-link-list">'+''.join('<a href="'+E(q['path'])+'">'+E(q['title'])+' ↗</a>' for q in more)+'</div></details>'
  head+='</section>'
 head+='<section><h2>Уже знакомы с прежними тестами?</h2><p><a href="/test/">Прежний тест на профориентацию</a> и <a href="/test/extended/">расширенный тест</a> остаются доступны по своим адресам.</p></section>'
 return head

def testbody():return '''<div class="test-top"><a href="/proforientaciya/" class="text-link">← К материалам</a><span>Авторский опрос интересов ProSchools</span><button class="text-button" data-clear type="button">Начать заново</button></div><section class="test-shell"><aside class="test-aside"><p class="eyebrow">ЗНАКОМСТВО С СОБОЙ</p><h2>Здесь нет<br>правильных<br>ответов.</h2><p>Отвечает школьник. Выбирайте то, что интересно сейчас, а не то, что получается лучше всего.</p><div class="small-card"><b>Ещё не пробовал?</b><p>«Не знаю» — тоже ответ. Результат поможет выбрать новые пробы.</p></div><p class="micro">24 вопроса. После ответов email совершеннолетнего родителя или участника 18 лет откроет полный результат. Это оригинальный опрос, а не диагностическая методика Климова или Холланда. Психометрическая валидность не проверялась.</p></aside><div class="question-panel ym-disable-keys" id="test-content" tabindex="-1"><h1>Карта интересов</h1><p role="status">Загружаем вопросы…</p><noscript>Для прохождения опроса нужен JavaScript.</noscript></div></section>'''
def build():
 load();AS.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/'scripts/career/style.css',AS/'style.css');shutil.copy2(ROOT/'content/career/questions.json',AS/'questions.json')
 worksheets=ROOT/'content/career/worksheets'
 if worksheets.exists():shutil.copytree(worksheets,AS/'worksheets',dirs_exist_ok=True)
 legacy_entry=ROOT/'scripts/career/monitoring/funnel/legacy-entry.js'
 if legacy_entry.exists():shutil.copy2(legacy_entry,AS/'legacy-entry.js')
 privacy=ROOT/'scripts/career/privacy-navigation.js'
 if privacy.exists():shutil.copy2(privacy,AS/'privacy-navigation.js')
 pageinfo=[render(p) for p in P if p['path']!='/test/']
 legal_path=ROOT/'content/career/legal-pages.json'
 if legal_path.exists():pageinfo.extend(render(p) for p in json.loads(legal_path.read_text()))
 save(TEST,doc('Карта интересов для школьников — 24 вопроса | ProSchools','Авторский опрос интересов: первые пробы и направления для исследования. Не определяет способности и профессию.',TEST,testbody(),True))
 save(RESULT,doc('Результат карты интересов | ProSchools','Личная карта интересов и план первых проб.',RESULT,'<div id="result-content" class="ym-disable-keys"><h1>Результат карты интересов</h1><p role="status">Проверяем доступ к результату…</p></div><dialog id="partner-dialog" aria-labelledby="partner-title"><button class="dialog-close" data-close aria-label="Закрыть" type="button">×</button><div id="partner-content"></div></dialog><div class="toast" hidden role="status"></div>',True))
 paths=[p['path'] for p in pageinfo if not p['preserved_original'] and not p.get('noindex')];assert len(paths)==len(set(paths));assert TEST not in paths and RESULT not in paths
 (OUT/'sitemap-career.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>'+SITE+x+'</loc><lastmod>2026-11-06</lastmod></url>' for x in paths)+'</urlset>')
 manifest={'version':VERSION,'navigation_version':chrome['version'],'pages':paths,'support_pages':[TEST,RESULT]+[p['path'] for p in pageinfo if p.get('noindex')],'existing_blog_updates':[p['path'] for p in pageinfo if p['preserved_original']],'preservation':pageinfo,'files':[{'path':str(f.relative_to(OUT)),'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'bytes':f.stat().st_size} for f in OUT.rglob('*') if f.is_file()]}
 (ROOT/'work/career/release-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2));print('Rendered',len(paths),'new public pages + 2 private utility pages; existing blog previews separate')
if __name__=='__main__':build()
