# coding:utf-8
"""Join published venue coordinates by source identity and matching address."""
import json,re,pathlib,math

def norm(v):return re.sub('[^а-я0-9]','',(v or'').lower().replace('ё','е'))
def valid(p):return isinstance(p,list)and len(p)==2 and all(isinstance(v,(int,float))and math.isfinite(v)for v in p)and -180<=p[0]<=180 and 40<=p[1]<=85 and p!=[0,0]

def read(path):return json.loads(path.read_text())if path.exists()else{}
def source_index(root):
 w=pathlib.Path(root)/'work/afisha-production';inst=read(w/'venue-geography.json');afisha=read(w/'afisha-venue-geography.json');places=read(w/'event-venue-geography.json');national=read(pathlib.Path(root)/'outputs/ProSchools-afisha-national.json');result={};verified=read(pathlib.Path(__file__).parent/'seeds/verified-venue-locations.json');manual={v['venue_source_id']:v for v in verified}if isinstance(verified,list)else{};manual_address={v['city']+'|'+norm(v['address']):v for v in manual.values()}
 for e in national.get('events',[]):
  v=e['venue'];key=str(v['source_id']);override=manual.get(key)or manual_address.get(e['cities'][0]+'|'+norm(v.get('address')),{})
  if override and norm(override['address'])==norm(v.get('address')):
   fresh=inst.get(str(override.get('institution_id')),{});point=fresh.get('coordinates')if norm(fresh.get('address'))==norm(override.get('source_address'))and valid(fresh.get('coordinates'))else override['coordinates'];result[e['id']]={**override,'coordinates':point,'coordinate_precision':'verified_venue_address_alias'};continue
  candidates=[places.get(key,{}),inst.get(str((v.get('institution')or{}).get('_id')),{}),afisha.get(key,{})]
  for g in candidates:
   if valid(g.get('coordinates'))and norm(g.get('address'))and (norm(g.get('address'))==norm(v.get('address'))or g.get('match')=='published_event_place'):
    result[e['id']]={**g,'coordinate_precision':'published_venue'};break
 return result

def apply(rows,index):
 for e in rows:
  g=index.get(e['id'])
  if g:
   if g.get('match')=='published_event_place'and norm(e.get('address'))!=norm(g['address']):e['address']=g['address'];e['address_source']=g['source']
   e.update({'coordinates':g['coordinates'],'coordinate_source':g['source'],'coordinate_precision':g['coordinate_precision'],'coordinate_address':g['address'],'coordinate_checked_at':g.get('checked')})
 # Cross-source identity is accepted only at the exact same city and numbered address.
 addresses={};conflicts=set()
 for e in rows:
  if not valid(e.get('coordinates'))or not re.search(r'\d',e.get('address','')):continue
  k=e['city']+'|'+norm(e['address']);p=e['coordinates']
  if k in addresses and max(abs(p[i]-addresses[k]['coordinates'][i])for i in [0,1])>.003:conflicts.add(k)
  else:addresses[k]=e
 for e in rows:
  if valid(e.get('coordinates')):continue
  k=e['city']+'|'+norm(e.get('address'));g=addresses.get(k)
  if g and k not in conflicts:
   e.update({field:g[field]for field in ['coordinates','coordinate_source','coordinate_precision','coordinate_address','coordinate_checked_at']if field in g});e['coordinate_match']='same_city_exact_numbered_address'
  if not valid(e.get('coordinates')):e['coordinate_status']='organizer_meeting_point_unpublished'if e.get('sourceProvider')=='Tripster'else'published_point_not_verified'
 return rows
