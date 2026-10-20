"""Add course-specific facts from the already verified original page receipts.

Do not copy generic brand ages to products or pad sparse cards for indexing.
"""
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[2];DATA=ROOT/'data/courses'
cache=json.loads((ROOT/'work/programming-online/source-cache.json').read_text())
verified=json.loads((ROOT/'src/data/programming-online-verified.json').read_text())
ids={c['id'] for c in verified['courses']};catalog=json.loads((DATA/'catalog.json').read_text())
for c in catalog:
 if c['id'] not in ids:continue
 source=cache.get(c['sourceUrl'],{});text=source.get('text','').replace('\xa0',' ')
 age=c.get('ageRange');facts=c.get('facts',[]);modules=c.get('modules',[])
 if c['brandId']=='rocket-tech-school':
  m=re.search(r'(?<!\d)([4-9]|1[0-7])\s*[-–—]\s*([5-9]|1[0-8])\s*лет',source.get('title',''))
  if m and int(m[1])<=int(m[2]):
   age=[int(m[1]),int(m[2])];c['ageEvidence']=m[0]+' — собственный заголовок программы'
 if c['brandId']=='codim-online':
  # Skip the generic 5–17 header. The course hero follows the second contacts menu.
  head=text[:1200];menus=list(re.finditer(r'Контакты',head,re.I));hero=head[menus[-1].end():] if menus else ''
  m=re.search(r'(?<!\d)([4-9]|1[0-7])\s*[-–—]\s*([5-9]|1[0-8])\s*лет',hero)
  if m and int(m[1])<=int(m[2]):age=[int(m[1]),int(m[2])];c['ageEvidence']=m[0]+' — основной блок программы'
  m=re.search(r'Реб[её]нок научится\s*:\s*(.*?)(?:Выбрать тариф|Посмотреть демо|Ссылка на|Программа курса)',text,re.I|re.S)
  if m:
   chunks=[re.sub(r'\s+',' ',s).strip(' •–-:') for s in re.split(r'•|\n',m[1])]
   modules=list(dict.fromkeys(s for s in chunks if 2<len(s)<90))[:8]
 if age:
  c['ageRange']=age
  if not any(str(f[0]).startswith('Возраст') for f in facts):facts.append(['Возраст',f'{age[0]}–{age[1]} лет'])
 if c['brandId']=='skillbox-kids' and 'it-start' in c['sourceUrl']:
  modules=['Работа с компьютером','Проекты в Scratch','Создание мира Minecraft']
  facts.extend([['Объём программы','27 уроков, три модуля'],['Продолжительность','7 месяцев']])
 c['modules']=modules;c['facts']=list({tuple(f):f for f in facts}.values())
 description=f'«{c["title"]}» — программа школы {c["brand"]}. Формат: {c["format"].lower()}.'
 if age:description+=f' На собственной странице указан возраст {age[0]}–{age[1]} лет.'
 if c.get('grade'):description+=' Аудитория: '+c['grade']+'.'
 if modules:description+=' В опубликованном плане: '+', '.join(modules)+'.'
 description+=' Полная стоимость и текущая группа уточняются у организатора.'
 c['editorialDescription']=description;c['editorialCheckedAt']='2026-10-20'
(DATA/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
print('Course-specific source facts updated:',len(ids))
