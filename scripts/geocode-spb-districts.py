"""Районы Санкт-Петербурга для карточек каталога через DaData suggest/address (бесплатно, 10k/сутки).
Пишет district (и lat/lon при точности «дом») в src/data/schools.ts. Результаты кэшируются в
scripts/spb-districts.json, чтобы повторный запуск не дёргал API. Запуск: python3 scripts/geocode-spb-districts.py [--apply]
"""
import json,re,sys,time,urllib.request,os
KEY=os.environ.get("DADATA_KEY","91bad0ef4b4fdc6ca1d82a670aa54d134bf04f8d")
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TS=os.path.join(ROOT,'src/data/schools.ts'); CACHE=os.path.join(ROOT,'scripts/spb-districts.json')
cache=json.load(open(CACHE)) if os.path.exists(CACHE) else {}
def sug(q):
    r=urllib.request.Request("https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address",data=json.dumps({"query":q,"count":1,"locations":[{"city":"Санкт-Петербург"}]}).encode(),headers={"Authorization":"Token "+KEY,"Content-Type":"application/json","Accept":"application/json"})
    for i in range(3):
        try: return json.load(urllib.request.urlopen(r,timeout=30))['suggestions']
        except Exception as e: time.sleep(2*(i+1)); err=e
    print("ERR",q,err); return None
s=open(TS,encoding='utf-8').read()
blocks=re.split(r'\n(?=\s*\{\n)',s)
n=0;hit=0
for i,b in enumerate(blocks):
    if "region: 'sankt-peterburg'" not in b: continue
    sid=re.search(r"id: '([^']*)'",b)[1]; addr=re.search(r"address: '([^']*)'",b)[1]
    if sid not in cache:
        d=sug("Санкт-Петербург, "+addr)
        if d is None: continue
        x=d[0]['data'] if d else {}
        cache[sid]={'district':x.get('city_district_with_type'),'lat':x.get('geo_lat'),'lon':x.get('geo_lon'),'qc':x.get('qc_geo'),'city':x.get('city'),'value':d[0]['value'] if d else None}
        n+=1
        if n%50==0: json.dump(cache,open(CACHE,'w'),ensure_ascii=False,indent=0); print(n,'запросов',flush=True)
        time.sleep(0.15)
    c=cache[sid]
    if c.get('district') and c.get('city')=='Санкт-Петербург': hit+=1
json.dump(cache,open(CACHE,'w'),ensure_ascii=False,indent=0)
print("всего SPb",sum(1 for b in blocks if "region: 'sankt-peterburg'" in b),"с районом",hit)
import collections
print(collections.Counter(c['district'] for c in cache.values()).most_common(25))
if '--apply' in sys.argv:
    out=[];upd=0;geo=0
    for b in blocks:
        if "region: 'sankt-peterburg'" in b:
            sid=re.search(r"id: '([^']*)'",b)[1]; c=cache.get(sid,{})
            d=c.get('district')
            if d and c.get('city')=='Санкт-Петербург':
                label=d.replace(' р-н','')
                if re.search(r"\n(\s*)district: '[^']*',",b): b=re.sub(r"district: '[^']*',",f"district: '{label}',",b,count=1)
                else: b=re.sub(r"(\n(\s*)address: '[^']*',)",lambda m:m.group(1)+f"\n{m.group(2)}district: '{label}',",b,count=1)
                upd+=1
                if c.get('qc') in ('0',0) and c.get('lat'):
                    if re.search(r"\n\s*lat: ",b): b=re.sub(r"lat: [-\d.]+",f"lat: {c['lat']}",b,count=1); b=re.sub(r"lon: [-\d.]+",f"lon: {c['lon']}",b,count=1)
                    else: b=re.sub(r"(\n(\s*)district: '[^']*',)",lambda m:m.group(1)+f"\n{m.group(2)}lat: {c['lat']},\n{m.group(2)}lon: {c['lon']},",b,count=1)
                    geo+=1
        out.append(b)
    open(TS,'w',encoding='utf-8').write('\n'.join(out)); print("записано district:",upd,"lat/lon:",geo)
