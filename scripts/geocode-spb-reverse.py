"""Обратное геокодирование DaData (geolocate/address) для школ СПб без улицы в адресе, но с lat/lon
(OSM). Даёт район и полный адрес. Точки-дубли (фальшивые координаты у нескольких школ) пропускаем."""
import json,re,collections,time,urllib.request,os
KEY=os.environ.get("DADATA_KEY","91bad0ef4b4fdc6ca1d82a670aa54d134bf04f8d")
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TS=os.path.join(ROOT,'src/data/schools.ts'); CACHE=os.path.join(ROOT,'scripts/spb-districts.json')
c=json.load(open(CACHE)); s=open(TS,encoding='utf-8').read()
blocks=re.split(r'\n(?=\s*\{\n)',s)
pts=collections.Counter(); info={}
for b in blocks:
    if "region: 'sankt-peterburg'" not in b: continue
    i=re.search(r"id: '([^']*)'",b)[1]; la=re.search(r"lat: ([-\d.]+)",b); lo=re.search(r"lon: ([-\d.]+)",b)
    if la and lo: info[i]=(la[1],lo[1]); pts[(la[1],lo[1])]+=1
def rev(lat,lon):
    r=urllib.request.Request("https://suggestions.dadata.ru/suggestions/api/4_1/rs/geolocate/address",data=json.dumps({"lat":lat,"lon":lon,"count":1,"radius_meters":150}).encode(),headers={"Authorization":"Token "+KEY,"Content-Type":"application/json","Accept":"application/json"})
    for i in range(3):
        try: return json.load(urllib.request.urlopen(r,timeout=30))['suggestions']
        except Exception as e: time.sleep(2*(i+1)); err=e
    print("ERR",lat,lon,err); return None
n=0;dup=0;ok=0
for k,x in c.items():
    if x.get('district') or k not in info or x.get('rev'): continue
    la,lo=info[k]
    if pts[(la,lo)]>1: dup+=1; continue   # одна точка на несколько школ — фальшивка
    d=rev(la,lo); n+=1
    x['rev']=True
    if d:
        dd=d[0]['data']; x.update({'district':dd.get('city_district_with_type'),'city':dd.get('city'),'value':d[0]['value'],'qc':'rev','street':dd.get('street_with_type'),'house':dd.get('house')})
        if x['district']: ok+=1
    if n%50==0: json.dump(c,open(CACHE,'w'),ensure_ascii=False,indent=0); print(n,flush=True)
    time.sleep(0.12)
json.dump(c,open(CACHE,'w'),ensure_ascii=False,indent=0)
print("обратных запросов",n,"дубли-точки пропущены",dup,"получили район",ok)
print("итого с районом:",sum(1 for x in c.values() if x.get('district') and x.get('city')=='Санкт-Петербург'))
