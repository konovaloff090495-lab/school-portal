"""Районы городов (кроме Москвы/СПб) для карточек каталога.
Границы районов — OSM (Overpass, relation admin_level=9 в bbox города), координаты школ — свои
lat/lon (уникальные; точки-дубли считаем фальшивыми) или DaData suggest по адресу с улицей.
Район = точка в полигоне (shapely). Пишет district (+lat/lon новым) в src/data/schools.ts и
печатает записи для реестра cityDistricts. Кэш: scripts/districts-cache/<region>.json.
Запуск: python3 scripts/geocode-city-districts.py <region-slug> [...] [--apply]
"""
import json,re,sys,time,os,collections,urllib.request,urllib.parse
from shapely.geometry import Polygon,MultiPolygon,Point,LineString
from shapely.ops import linemerge,unary_union,polygonize
KEY=os.environ.get("DADATA_KEY","91bad0ef4b4fdc6ca1d82a670aa54d134bf04f8d")
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TS=os.path.join(ROOT,'src/data/schools.ts'); CD=os.path.join(ROOT,'scripts/districts-cache')
UA={"User-Agent":"pro-schools-districts/1.0","Content-Type":"application/json","Accept":"application/json"}
def dadata(path,body):
    r=urllib.request.Request("https://suggestions.dadata.ru/suggestions/api/4_1/rs/"+path,data=json.dumps(body).encode(),headers={**UA,"Authorization":"Token "+KEY})
    for i in range(3):
        try: return json.load(urllib.request.urlopen(r,timeout=30))['suggestions']
        except Exception as e: time.sleep(2*(i+1)); err=e
    print("  ERR dadata",body.get('query'),err); return None
def overpass(q):
    for m in ["https://overpass-api.de/api/interpreter","https://overpass.private.coffee/api/interpreter","https://overpass.kumi.systems/api/interpreter"]:
        try:
            r=urllib.request.Request(m,data=urllib.parse.urlencode({"data":q}).encode(),headers={"User-Agent":"pro-schools-districts/1.0"})
            return json.load(urllib.request.urlopen(r,timeout=180))
        except Exception as e: print("  overpass",m,str(e)[:60]); time.sleep(5)
    return None
def rel_polygon(rel):
    lines=[]
    for mbr in rel.get('members',[]):
        if mbr.get('type')=='way' and mbr.get('role') in ('outer','') and mbr.get('geometry'):
            lines.append(LineString([(p['lon'],p['lat']) for p in mbr['geometry']]))
    if not lines: return None
    merged=linemerge(unary_union(lines))
    polys=list(polygonize(merged))
    if not polys: return None
    return MultiPolygon(polys) if len(polys)>1 else polys[0]
def translit(t):
    m={'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',' ':'-','-':'-'}
    return ''.join(m.get(ch,'') for ch in t.lower())
def decline(label):
    # прилагательные на -ский/-ый/-ой/-ий → родительный и предложный
    w=label.split(' ')[-1]; head=' '.join(label.split(' ')[:-1]); head=head+' ' if head else ''
    if w.endswith('ский') or w.endswith('цкий'): g=w[:-2]+'ого'; p=w[:-2]+'ом'
    elif w.endswith('ый') or w.endswith('ой'): g=w[:-2]+'ого'; p=w[:-2]+'ом'
    elif w.endswith('ий'): g=w[:-2]+'его'; p=w[:-2]+'ем'
    else: return None
    v='во' if re.match(r'^[фв][^аеёиоуыэюя]',label.lower()) else 'в'
    return f"{head}{g} района", f"{v} {head}{p} районе"
args=[a for a in sys.argv[1:] if not a.startswith('--')]; apply='--apply' in sys.argv
s=open(TS,encoding='utf-8').read(); blocks=re.split(r'\n(?=\s*\{\n)',s)
_i=s.find('export const regionLabels:'); regionLabels=dict(re.findall(r"^\s*'([a-z-]+)':\s*'([^']+)',$",s[_i:s.find('\n}\n',_i)],re.M))
registry={}
for region in args:
    city=regionLabels.get(region)
    if not city: print("нет города",region); continue
    cf=os.path.join(CD,region+'.json'); cache=json.load(open(cf)) if os.path.exists(cf) else {}
    print(f"== {city} ({region})")
    if 'bbox' not in cache:
        d=dadata("suggest/address",{"query":city,"count":1,"from_bound":{"value":"city"},"to_bound":{"value":"city"}})
        la,lo=float(d[0]['data']['geo_lat']),float(d[0]['data']['geo_lon'])
        cache['bbox']=[la-0.45,lo-0.7,la+0.45,lo+0.7]
    if 'rels' not in cache:
        b=cache['bbox']
        d=overpass(f'[out:json][timeout:180];rel["boundary"="administrative"]["admin_level"="9"]({b[0]},{b[1]},{b[2]},{b[3]});out geom;')
        if not d: print("  Overpass не ответил"); continue
        cache['rels']=[e for e in d['elements'] if 'район' in (e['tags'].get('name') or '').lower()]
        time.sleep(8)
    polys={}
    for e in cache['rels']:
        name=e['tags']['name']; poly=rel_polygon(e)
        if poly is not None: polys[name]=poly
    print("  районов OSM:",len(polys),'|',', '.join(sorted(polys)))
    pts=collections.Counter()
    recs=[]
    for i,b in enumerate(blocks):
        if f"region: '{region}'" not in b: continue
        sid=re.search(r"id: '([^']*)'",b)[1]; addr=re.search(r"address: '([^']*)'",b); addr=addr[1] if addr else ''
        la=re.search(r"lat: ([-\d.]+)",b); lo=re.search(r"lon: ([-\d.]+)",b)
        ll=(float(la[1]),float(lo[1])) if la and lo else None
        if ll: pts[ll]+=1
        recs.append((i,sid,addr,ll))
    geo=cache.setdefault('geo',{}); n=0
    for i,sid,addr,ll in recs:
        if ll and pts[ll]==1: continue
        if sid in geo: continue
        if not re.search(r'\d',addr) or addr.strip()==f'г. {city}': geo[sid]=None; continue
        d=dadata("suggest/address",{"query":f"{city}, {addr}","count":1,"locations":[{"city":city}]}); n+=1
        x=d[0]['data'] if d else None
        geo[sid]={'lat':x.get('geo_lat'),'lon':x.get('geo_lon'),'qc':x.get('qc_geo'),'city':x.get('city')} if x and x.get('city')==city and x.get('qc_geo') in ('0','1') else None
        time.sleep(0.12)
        if n%50==0: json.dump(cache,open(cf,'w'),ensure_ascii=False)
    json.dump(cache,open(cf,'w'),ensure_ascii=False)
    print("  геокодировано DaData:",n,"успешно:",sum(1 for k in geo if geo[k]))
    assign={}; cnt=collections.Counter(); newll={}
    for i,sid,addr,ll in recs:
        p=ll if (ll and pts[ll]==1) else ((float(geo[sid]['lat']),float(geo[sid]['lon'])) if geo.get(sid) else None)
        if not p: continue
        if not (ll and pts[ll]==1): newll[sid]=p
        pt=Point(p[1],p[0])
        for name,poly in polys.items():
            if poly.contains(pt): assign[sid]=name.replace(' район','').strip(); cnt[assign[sid]]+=1; break
    print("  школ с районом:",len(assign),"из",len(recs),'|',cnt.most_common())
    reg=[]
    for name in sorted(cnt):
        dec=decline(name)
        if not dec: print("  !! не склоняется:",name); continue
        reg.append({'slug':translit(name),'label':name,'gen':dec[0],'prep':dec[1]})
    registry[region]=reg
    if apply:
        for i,sid,addr,ll in recs:
            if sid not in assign: continue
            b=blocks[i]; label=assign[sid]
            if re.search(r"\n\s*district: '[^']*',",b): b=re.sub(r"district: '[^']*',",f"district: '{label}',",b,count=1)
            else: b=re.sub(r"(\n(\s*)address: '[^']*',)",lambda m:m.group(1)+f"\n{m.group(2)}district: '{label}',",b,count=1)
            if sid in newll:
                la,lo=newll[sid]
                if re.search(r"\n\s*lat: ",b): b=re.sub(r"lat: [-\d.]+",f"lat: {la}",b,count=1); b=re.sub(r"lon: [-\d.]+",f"lon: {lo}",b,count=1)
                else: b=re.sub(r"(\n(\s*)district: '[^']*',)",lambda m:m.group(1)+f"\n{m.group(2)}lat: {la},\n{m.group(2)}lon: {lo},",b,count=1)
            blocks[i]=b
if apply: open(TS,'w',encoding='utf-8').write('\n'.join(blocks)); print("schools.ts записан")
json.dump(registry,open(os.path.join(CD,'_registry.json'),'w'),ensure_ascii=False,indent=1)
print("реестр → scripts/districts-cache/_registry.json")
