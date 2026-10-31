# coding:utf-8
"""Read the published main-venue address and coordinates, excluding recommendations."""
import pathlib,json,os,re,urllib.request,datetime,concurrent.futures,time,fcntl
from bs4 import BeautifulSoup
R=pathlib.Path(os.environ['AFISHA_ROOT']);W=R/'work/afisha-production';target=W/'afisha-venue-geography.json';lock=open(W/'afisha-venue-geography.lock','a');fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
cache=json.loads(target.read_text())if target.exists()else{};j=json.loads((R/'outputs/ProSchools-afisha-national.json').read_text());venues={}
for e in j['events']:
 v=e['venue'];key=str(v['source_id'])
 if key.startswith('/'):venues[key]=v
now=datetime.datetime.now(datetime.timezone.utc);todo=[]
for key,v in venues.items():
 old=cache.get(key,{})
 try:fresh=(now-datetime.datetime.fromisoformat(old['checked'])).days<(30 if old.get('coordinates')else 2)
 except (KeyError,ValueError):fresh=False
 if not fresh:todo.append((key,v))
def one(pair):
 time.sleep(.2);key,v=pair;url='https://www.afisha.ru'+key
 try:
  raw=urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'ProSchools venue data verification/1.0'}),timeout=20).read();s=BeautifulSoup(raw,'html.parser');sc=next(x.string for x in s.select('script')if x.string and x.string.strip().startswith('(window.__nrp'));m=json.JSONDecoder().raw_decode(sc.split("['root'] = ",1)[1])[0]['model'];entity=None
  for name in ['PlaceInfo','MuseumInfo','TheatreInfo','CinemaInfo','VenueInfo','InstitutionInfo']:
   if isinstance(m.get(name),dict)and m[name].get('AddressGeoPoint'):entity=m[name];break
  if not entity:return key,None
  pt=entity['AddressGeoPoint'];point=[float(pt['Longitude']),float(pt['Latitude'])]
  if not(-180<=point[0]<=180 and -90<=point[1]<=90):return key,None
  return key,{'coordinates':point,'address':entity.get('Address'),'address_with_city':entity.get('AddressWithOptionalCity'),'title':entity.get('Name'),'source':url,'checked':now.isoformat(),'districts':entity.get('DistrictTags')or[]}
 except Exception:return key,None
print(json.dumps({'requested':len(todo),'cached':len(cache)}),flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=3)as pool:
 for i,(key,row)in enumerate(pool.map(one,todo),1):
  if row:cache[key]=row
  elif not cache.get(key,{}).get('coordinates'):cache[key]={'checked':now.isoformat(),'status':'not_resolved'}
  if i%20==0:
   t=target.with_suffix('.incoming');t.write_text(json.dumps(cache,ensure_ascii=False));t.replace(target)
  if i%100==0:print(json.dumps({'processed':i,'requested':len(todo),'located':sum(bool(v.get('coordinates'))for v in cache.values())}),flush=True)
t=target.with_suffix('.incoming');t.write_text(json.dumps(cache,ensure_ascii=False));t.replace(target)
print(json.dumps({'requested':len(todo),'venues_with_coordinates':sum(bool(v.get('coordinates'))for v in cache.values())}),flush=True)
