"""Keep programming courses linked to the address and online-school directories."""
from pathlib import Path
import argparse,json,re,html
ROOT=Path(__file__).resolve().parents[2];HUB='/shkoly/tipy/programmirovanie/'
IT={'programmirovanie','python','scratch','roblox','minecraft','unity','web-razrabotka','mobilnye-prilozheniya','iskusstvennyy-intellekt','robototehnika','kiberbezopasnost'}
def main():
 p=argparse.ArgumentParser();p.add_argument('--out',required=True);a=p.parse_args();out=Path(a.out)
 courses=json.loads((ROOT/'data/courses/catalog.json').read_text());registry=ROOT/'data/courses/programming-brand-map.json';brands=json.loads(registry.read_text()) if registry.exists() else {}
 paths={out/'programmirovanie/index.html'}
 bypath={}
 for c in courses:
  if not c.get('active') or not set(c['tags'])&IT:continue
  file=out/'kurs'/c['id']/'index.html';paths.add(file);bypath[file]=c['brandId']
  paths.add(out/'shkoly'/c['brandId']/'index.html')
 count=0
 for file in paths:
  if not file.exists():continue
  s=file.read_text();s=re.sub(r'<section[^>]*data-programming-related[^>]*>.*?</section>','',s,flags=re.S)
  links=[(HUB,'Очные школы программирования по городам'),(HUB+'online/','Онлайн-школы программирования')]
  bid=bypath.get(file)
  if bid in brands:links.append(('/shkola/'+brands[bid]+'/','Школа: формат, источники и программы'))
  block='<section class="seo-note" data-programming-related><h2>Школы и форматы программирования</h2><p>Сравните конкретную программу с занятиями рядом с домом и дистанционными школами. Наличие онлайн-курса не подтверждает его проведение в каждом очном филиале.</p><ul>'+''.join('<li><a href="'+u+'">'+html.escape(t)+'</a></li>' for u,t in links)+'</ul></section>'
  s=s.replace('</main>',block+'</main>',1);file.write_text(s);count+=1
 print('Programming reciprocal links:',count)
if __name__=='__main__':main()
