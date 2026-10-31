# coding: utf-8
import json,pathlib,datetime,re,os,collections
from zoneinfo import ZoneInfo
from geodata import source_index,apply
from enrich import enrich
from selections import prepare
R=pathlib.Path(os.environ.get('AFISHA_ROOT',pathlib.Path(__file__).resolve().parents[2]));W=R/'work/afisha-scale';P=R/'work/afisha-production';M=R/'work/moscow-preview'
def read(p,default):return json.loads(p.read_text())if p.exists()else default
def norm(v):return re.sub(r'[^а-я0-9]','',(v or'').lower().replace('ё','е'))
RU='абвгдеёжзийклмнопрстуфхцчшщъыьэюя';EN=['a','b','v','g','d','e','e','zh','z','i','y','k','l','m','n','o','p','r','s','t','u','f','kh','ts','ch','sh','shch','','y','','e','yu','ya'];TR=dict(zip(RU,EN))
def slug(v):return re.sub('-+','-',re.sub('[^a-z0-9-]','', ''.join(TR.get(c,c)for c in v.lower()).replace(' ','-'))).strip('-')
resolved=read(W/'cities-resolved.json',[]);byname={c['name']:c for c in resolved};mo=read(P/'mo-cities.json',[]);monames={c['name']for c in mo};registry=read(P/'registry-input.json',[]);registry=[c for c in registry if c.get('scope')!='region'];names={norm(c['name']):c['name']for c in registry};names[norm('Московская область')]='Московская область'
for c in registry:
 c['slug']=slug(c['name']);c['base']='/afisha/'+('moskovskaya-oblast/'if c['name']in monames else'')+c['slug']+'/';c['center']=[37.62,55.75]if c['name']=='Москва'else None
 v=byname.get(c['name'],{}).get('city_coords')or{}
 if v.get('x')and v.get('y'):c['center']=[v['x'],v['y']]
 c['timezone']=byname.get(c['name'],{}).get('timezone')or('Europe/Moscow'if c['name']in monames or c['name']=='Москва'else None)
 c['inCity']= 'в Москве'if c['name']=='Москва'else'в Санкт-Петербурге'if c['name']=='Санкт-Петербург'else'в городе '+c['name'];c['isMO']=c['name']in monames
phrases=read(P/'city-phrases.json',{})
for c in registry:c['inCity']=phrases.get(c['name'],c['inCity'])
registry.append({'name':'Московская область','slug':'moskovskaya-oblast','base':'/afisha/moskovskaya-oblast/','inCity':'в Московской области','isMO':True,'scope':'region','center':[37.6,55.7]})
media={};raw={}
for f in (W/'cache').glob('*-[0-9]*.json'):
 try:j=read(f,{});es=j.get('events',{}).get('items',[])
 except Exception:continue
 for e in es:
  im=e.get('thumbnailFile')or{};pid=im.get('publicId');meta=im.get('meta')or{}
  if pid:media[str(e['_id'])]={'url':'https://cdn.culture.ru/images/'+pid,'credit':meta.get('author')or meta.get('source')or'Культура.РФ'}
for f in (W/'afisha-cache').glob('*.json'):
 for e in read(f,{}).get('items',[]):
  im=e.get('Image16x9')or e.get('Image1x1')or{}
  if im.get('Url'):media['afisha-'+str(e['ID'])]={'url':im['Url'],'credit':im.get('Copyright')or im.get('Author')or'Афиша.ру'}
media.update(read(M/'media.json',{}).get('by_source_id',{}))
geo=read(M/'geography.json',{});venues=geo.get('venues',{});national=read(R/'outputs/ProSchools-afisha-national.json',{});venuegeo=read(P/'venue-geography.json',{});events=[];held=[]
# Exact locality facts take precedence over broad donor /msk/ namespace.
for e in national.get('events',[]):
 v=e['venue'];loc=v.get('locale')or{};explicit=names.get(norm(re.sub(r'^Город\s+','',loc.get('title')or'',flags=re.I)));addr=v.get('address')or'';city=explicit if explicit else e['cities'][0];moved=False
 if city=='Москва'and (v.get('source_id','').startswith('/msk/')or explicit is None):
  for n in sorted(monames,key=len,reverse=True):
   if re.search(r'(?:^|[,(\s])(?:г\.?\s*)?'+re.escape(n)+r'(?:$|[,.)\s])',addr,re.I)or re.search(r'\('+re.escape(n)+r'\)',v.get('title')or'',re.I):city=n;moved=True;break
  if not moved and re.search(r'Московск\w*\s+обл|Московская область|Одинцовск\w*\s+р|Ленинск\w*\s+р|Монино|Новоивановск',addr+' '+(v.get('title')or''),re.I):city='Московская область'
 if city not in {c['name']for c in registry}:continue
 if city=='Московская область':
  for n in sorted(monames,key=len,reverse=True):
   if re.search(r'(?:^|[,\s])г(?:ород)?\.?\s*'+re.escape(n)+r'(?:$|[,.)\s])',addr,re.I):city=n;break
 source=e['source_records'];im=next((media.get(str(s['id']))for s in source if media.get(str(s['id']))),None);g=venues.get(str(v['source_id']),{});dates=[]
 for x in e['sessions']:
  try:d=datetime.datetime.fromisoformat(x['start'].replace('Z','+00:00'));tz=datetime.timezone(datetime.timedelta(hours=3));zone=byname.get(city,{}).get('timezone')or('Europe/Moscow'if city=='Москва'or city in monames else x.get('timezone'));d=d.astimezone(ZoneInfo(zone))if zone else d;dates.append({'date':d.strftime('%Y-%m-%d'),'time':d.strftime('%H:%M'),'source':x['source_url'],'iso':d.isoformat()})
  except ValueError:pass
 schedule=e['source_schedules'][0]if e['source_schedules']else{};row={**g,'id':e['id'],'title':e['title'],'type':e['category'],'format':e['category'],'image':'','city':city,'district':g.get('district')or'','okrug':g.get('okrug')or'','metro':'','place':v.get('title')or'Площадка уточняется','address':addr,'media':(im.get('gallery')or[im])if im else[],'date':dates[0]['date']if dates else'','time':dates[0]['time']if dates else'','slots':[x['time']for x in dates],'dates':dates,'age':[e['age_restriction']or 0,17],'ageRestriction':e['age_restriction'],'price':e['price']['min'],'priceData':e['price'],'duration':'','family':False,'sources':source,'schedule':schedule,'checked':e['source_checked_at'],'about':'','result':''}
 if im:
  for m in row['media']:m.setdefault('source_url',source[0]['url'])
 vg=venuegeo.get(str((v.get('institution')or{}).get('_id')),{});point=vg.get('coordinates')
 if point and norm(vg.get('address'))==norm(addr)and not row.get('coordinates'):row['coordinates']=point;row['coordinate_source']=vg['source']
 events.append(row)
# Direct source calendars. Out-of-city tours are kept separate from city venues.
products={str(e['id']):e for e in read(R/'work/excursion-donors/tripster-catalog.json',[])}
for e in read(M/'extra-events.json',[]):
 product=products.get(e['id'].replace('ps-tripster-',''),{});tags=product.get('tag_slugs',[])
 if any(t in tags for t in ['za-gorodom','po-podmoskovyu','iz-moskvy','podmoskove']):e={**e,'city':'Московская область','outOfCity':True,'address':'Выезд из Москвы · '+e['address']}
 events.append(e)
# A programme can appear under several explicit categories, never inflate unique IDs.
events=prepare(enrich(apply(events,source_index(R)),R,national,byname))
unique={e['id']:e for e in events};events=list(unique.values());seen={c['name']:[]for c in registry}
for e in events:
 if e.get('ageRestriction')is not None and e['ageRestriction']>=18:e['listingStatus']='age_review';e['archived']=True;continue
 if e.get('finished'):continue
 if e['city']in seen:seen[e['city']].append(e)
 if e['city']in monames:seen['Московская область'].append(e)
metro=read(P/'metro-all.json',[]);metromap={c['name']:c for c in metro};districts=read(P/'districts.json',{})
for c in registry:
 n=c['name'];c['count']=len(seen[n]);g={'districts':[],'okrugs':[],'stations':[]};h=metromap.get(n,{})
 if n=='Москва':g={k:v for k,v in geo.items()if k!='venues'}
 else:
  for line in h.get('lines',[]):
   for st in line['stations']:g['stations'].append({'id':st['id'],'name':st['name'],'line':line['name'],'lat':st['lat'],'lng':st['lng']})
  g['districts']=[{'id':d,'name':d,'okrug':''}for d in districts.get(c['slug'],[])]
 c['geography']=g
P.mkdir(exist_ok=True)
for filename,value in [('registry.json',registry),('events.json',events)]:
 target=P/filename;temp=target.with_suffix('.incoming')
 with temp.open('w',encoding='utf-8')as f:json.dump(value,f,ensure_ascii=False,separators=(',',':'))
 temp.replace(target)
print('Prepared',len(events),'events',len(registry)-1,'cities',len(monames),'MO; media',sum(bool(e['media'])for e in events))
