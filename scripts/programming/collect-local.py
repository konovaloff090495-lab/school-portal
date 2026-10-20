#!/usr/bin/env python3
"""Collect public KIBERone and TOP campus data, never infer an address from an office/footer.

The provider's public city picker /?citys discovers city URLs. Each city page
contains locationsObj JSON used by the visible campus map. Only active records
from this object enter the catalogue. No crawling search snippets as evidence.

Usage: python3 scripts/programming/collect-local.py [--workers 3]
       python3 scripts/programming/collect-local.py --ssh-socket /tmp/live.sock
       python3 scripts/programming/collect-local.py --provider top --gaps-only
       python3 scripts/programming/collect-local.py --parse-only

Raw HTML is gzip-cached locally; repeat runs reuse it. Network failures or city
mismatches are kept in the report, never substituted with invented campuses.
"""
import argparse, concurrent.futures, datetime, gzip, hashlib, html, json
from pathlib import Path
import re, shlex, subprocess, time, urllib.parse, urllib.request

ROOT=Path(__file__).resolve().parents[2]
CACHE=ROOT/'work/programming/local-cache'
OUT=ROOT/'src/data/programming-local-verified.json'
REPORT=ROOT/'work/programming/local-collection-report.json'
TODAY=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=3))).date().isoformat()
USER_AGENT='Mozilla/5.0 (compatible; ProSchools factual catalogue review)'

def clean(s):return re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]+>',' ',s))).strip()
def norm(s):return re.sub(r'[^a-zа-я0-9]+','',s.lower().replace('ё','е'))
def read_regions():
    src=(ROOT/'src/data/schools.ts').read_text()
    block=re.search(r'export const regionLabels: Record<RegionSlug, string> = (\{[\s\S]*?\n\})',src)[1]
    labels=dict(re.findall(r"['\"]?([a-z0-9-]+)['\"]?:\s*['\"]([^'\"]+)['\"]",block))
    family=json.loads((ROOT/'src/data/family-geography.json').read_text())
    for slug,row in family.get('regions',{}).items(): labels.setdefault(slug,row['label'])
    return labels,family

def fetch(url,args):
    path=CACHE/(hashlib.sha256(url.encode()).hexdigest()[:24]+'.html.gz')
    if path.exists():return gzip.decompress(path.read_bytes()).decode('utf-8')
    if args.parse_only:raise RuntimeError('missing_cache')
    error=None
    for attempt in range(3):
        try:
            if args.ssh_socket:
                remote="import sys,urllib.request;u=sys.argv[1];r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':"+repr(USER_AGENT)+"}),timeout=25);sys.stdout.buffer.write(r.read())"
                result=subprocess.run(['ssh','-S',args.ssh_socket,'-oControlMaster=no','-oConnectTimeout=8','root@45.80.70.209','python3 -c '+shlex.quote(remote)+' '+shlex.quote(url)],capture_output=True,timeout=35)
                if result.returncode:raise RuntimeError(result.stderr.decode()[-300:])
                data=result.stdout
            else:
                with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':USER_AGENT}),timeout=25) as r:data=r.read()
            text=data.decode('utf-8')
            if len(text)<500 or 'DDoS-Guard' in text[:2000]:raise RuntimeError('empty_or_challenge')
            path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(gzip.compress(data,compresslevel=6))
            return text
        except Exception as e:
            error=e
            if attempt<2:time.sleep(1+attempt*2)
    raise RuntimeError(str(error))

def discover(args):
    if args.provider=='top':
        picker=fetch('https://top-academy.ru/about/contacts',args)
        allowed='top-academy.ru'
    else:
        picker=fetch('https://kiber-one.com/?citys',args)
        allowed='kiber-one.com'
    links=[];seen=set()
    for url,title in re.findall(r'<a\b[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>',picker,re.S):
        url=url.replace('http://','https://').rstrip('/')+'/'
        host=urllib.parse.urlparse(url).hostname
        city=clean(title)
        if host and host.endswith(allowed) and city and not '<svg' in title and len(city)<45 and (city,url) not in seen:
            links.append({'city':city,'url':url});seen.add((city,url))
    return links

def target_rows(cities,labels,family):
    lookup={norm(label):(slug,label) for slug,label in labels.items()}
    # All existing Moscow Oblast locality filters, plus named gaps requested by user.
    mo={'Балашиха','Дмитров','Долгопрудный','Домодедово','Железнодорожный','Клин','Коломна','Королёв','Красногорск','Люберцы','Мытищи','Ногинск','Одинцово','Подольск','Раменское','Реутов','Руза','Серпухов','Химки','Щёлково','Ивантеевка','Фрязино','Пушкино','Сергиев Посад','Лобня','Лыткарино','Дубна','Жуковский','Воскресенск','Видное','Егорьевск','Наро-Фоминск','Орехово-Зуево','Павловский Посад','Солнечногорск','Ступино','Чехов','Электросталь','Апрелевка','Истра','Звенигород','Котельники'}
    for row in family.get('moCities',{}).values():mo.add(row['label'])
    for c in mo:lookup.setdefault(norm(c),('moskovskaya-oblast',c))
    lookup[norm('Зеленоград')]=('moskva','Зеленоград')
    # Known official spelling variants, never infer actual street from them.
    lookup[norm('Орёл')]=('orel','Орёл');lookup[norm('Артём')]=('artem','Артём')
    out=[]
    for row in cities:
        if norm(row['city']) in lookup:
            slug,city=lookup[norm(row['city'])]
            out.append({**row,'region':slug,'city':city})
    return out

def parse_page(row,page):
    title=clean(re.search(r'<title[^>]*>(.*?)</title>',page,re.S)[1])
    # Cross-check visible city selection against discovery. A wildcard domain may redirect.
    selected=re.search(r'reg-menu__region[^>]*>\s*<span[^>]*>(.*?)</span>',page,re.S)
    actual=clean(selected[1]) if selected else ''
    if actual and norm(actual)!=norm(row['city']):
        raise RuntimeError('city_mismatch:'+actual)
    marker=re.search(r'\blocationsObj\s*=\s*',page)
    if not marker:return [],{'city':row['city'],'url':row['url'],'status':'no_locations_json','title':title}
    obj,end=json.JSONDecoder().raw_decode(page[marker.end():])
    if not isinstance(obj,dict):return [],{'city':row['city'],'url':row['url'],'status':'no_locations_dict'}
    phone=re.search(r'href=["\']tel:([^"\']+)',page,re.I)
    age=re.search(r'от\s+(\d+)\s+до\s+(\d+)\s+лет',title)
    ageRange=f'{age[1]}–{age[2]} лет' if age else None
    # Modules are city-level offers; do not promise availability at every address.
    module_html=page.split('catalog_menu_item',1)[-1].split('location-widget',1)[0]
    terms=[('Scratch',r'\bscratch\b'),('Python',r'\bpython\b'),('Roblox',r'\broblox\b'),('Minecraft',r'\bminecraft\b'),('Unity',r'\bunity\b'),('Godot',r'\bgodot\b'),('JavaScript',r'\bjavascript\b'),('Создание сайтов',r'HTML')]
    directions=[name for name,pattern in terms if re.search(pattern,module_html,re.I)]
    records=[]
    for sid,loc in obj.items():
        if str(loc.get('active'))!='1':continue
        address=clean(loc.get('address',''))
        if len(address)<5 or not re.search(r'\d',address):continue
        if 'Сакко и Ванцетти' in address:continue # corporate footer office must never leak
        # Explicit other settlement inside campus address cannot be assigned to page city.
        explicit=re.search(r'\bг\.\s*([А-ЯЁ][А-ЯЁа-яё-]+(?:\s+[А-ЯЁ][А-ЯЁа-яё-]+)?)',address)
        if explicit and not norm(explicit[1]).startswith(norm(row['city'])):continue
        coords=[float(x.strip()) for x in loc.get('coords','').split(',') if re.fullmatch(r'\s*-?\d+(?:\.\d+)?\s*',x)]
        record={'id':'kiberone-location-'+str(sid),'brand':'KIBERone','name':'KIBERone — '+address,'region':row['region'],'city':row['city'],'address':address,'website':row['url'],'phone':clean(phone[1]) if phone else '', 'ageRange':ageRange,'directions':directions,'directionsScope':'Направления на официальном сайте города; группу по конкретному адресу уточняйте у школы','sourceUrl':row['url'],'checkedAt':TODAY,'sourceId':str(sid),'sourceUpdatedAt':loc.get('dateedited'),'sourceEvidence':'Активная учебная локация в locationsObj официальной городской страницы','locationTitle':clean(loc.get('title',''))}
        if len(coords)==2:record['lat'],record['lon']=coords
        if loc.get('metro'):record['metro']=clean(loc['metro'])
        records.append(record)
    return records,{'city':row['city'],'region':row['region'],'url':row['url'],'status':'ok','campuses':len(records),'title':title,'selectedCity':actual}

def parse_top(row,page):
    rsc=''.join(json.loads(x) for x in re.findall(r'self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)',page))
    marker=re.search(r'"city":(\{"filials":)',rsc)
    if not marker:raise RuntimeError('no_city_filials_json')
    city=json.JSONDecoder().raw_decode(rsc[marker.start(1):])[0]
    if norm(city.get('name',''))!=norm(row['city']):raise RuntimeError('city_mismatch:'+city.get('name',''))
    if city.get('state')!='active' or city.get('hidden'):raise RuntimeError('city_not_active')
    data_marker=re.search(r'"data":(\{"filials":)',rsc)
    if not data_marker:raise RuntimeError('no_contacts_data_json')
    data=json.JSONDecoder().raw_decode(rsc[data_marker.start(1):])[0]
    child_courses=[c for c in data.get('popularCourses',[]) if c.get('ageType')=='children' and c.get('state')=='published' and c.get('city')==city['key']]
    if not child_courses:raise RuntimeError('no_published_local_child_courses')
    course_text=' '.join(c.get('name','') for c in child_courses)
    directions=[name for name,pattern in [('Программирование','компьютер|программирован|цифров'),('Python',r'\bPython\b'),('Нейросети','нейросет'),('Создание игр','создани[ея] игр')] if re.search(pattern,course_text,re.I)]
    if not directions:raise RuntimeError('no_child_programming_evidence')
    programme_evidence=[{'name':c.get('name'),'ageRange':c.get('cardSettings',{}).get('age'),'sourceUrl':row['url'].rstrip('/')+c['url']['pathname']} for c in child_courses if c.get('url',{}).get('pathname')]
    geo_by_id={loc['id']:loc.get('geo') for loc in data.get('filials',[])}
    records=[]
    for loc in city['filials']:
        street=loc.get('address',{}).get('street','');building=loc.get('address',{}).get('building','')
        address=clean(street+', '+building).strip(' ,')
        if len(address)<5 or not re.search(r'\d',address):continue
        # Do not relabel a separate school/college-only campus as a children's club.
        if re.search(r'колледж|школа|университет',address,re.I):continue
        phone=next((c['value'] for d in loc.get('departments',[]) for c in d.get('contacts',[]) if c.get('type')=='phone'),city.get('contacts',{}).get('phone',''))
        records.append({'id':'top-location-'+str(loc['id']),'brand':'Компьютерная академия TOP','name':'Компьютерная академия TOP — '+address,'region':row['region'],'city':row['city'],'address':address,'website':row['url'],'phone':phone,'ageRange':None,'directions':directions,'directionsScope':'Детские программы на официальном сайте города; наличие группы по адресу уточняйте у школы','sourceUrl':row['url']+'about/contacts','programSourceUrl':programme_evidence[0]['sourceUrl'],'programmesOnCitySite':programme_evidence,'checkedAt':TODAY,'sourceId':str(loc['id']),'sourceEvidence':'Учебный филиал из city.filials официальной страницы контактов; детские программы подтверждены опубликованными popularCourses с тем же city и ageType=children'})
    for record in records:
        geo=geo_by_id.get(int(record['sourceId']))
        if isinstance(geo,list) and len(geo)==2:record['lat'],record['lon']=geo
    return records,{'city':row['city'],'region':row['region'],'url':row['url'],'status':'ok','campuses':len(records),'childCourses':len(programme_evidence)}

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--provider',choices=['kiberone','top'],default='kiberone');p.add_argument('--workers',type=int,default=3);p.add_argument('--ssh-socket');p.add_argument('--parse-only',action='store_true');p.add_argument('--limit',type=int);p.add_argument('--gaps-only',action='store_true');args=p.parse_args()
    if not 1<=args.workers<=3:p.error('workers must be 1–3')
    CACHE.mkdir(parents=True,exist_ok=True)
    labels,family=read_regions();cities=discover(args);targets=target_rows(cities,labels,family)
    previous=json.loads(OUT.read_text()) if OUT.exists() else []
    if args.gaps_only:
        covered_cities={norm(r['city']) for r in previous if r['id'].startswith('kiberone-')}
        targets=[t for t in targets if norm(t['city']) not in covered_cities]
    if args.limit:targets=targets[:args.limit]
    print(json.dumps({'discoveredOfficialCities':len(cities),'matchedTargetCities':len(targets)},ensure_ascii=False),flush=True)
    all_records=[];reports=[]
    other=previous if args.gaps_only else [r for r in previous if not r['id'].startswith('kiberone-' if args.provider=='kiberone' else 'top-')]
    def save_records():
        dedup={r['id']:r for r in sorted(other+all_records,key=lambda x:x['sourceUrl'])}
        records=sorted(dedup.values(),key=lambda x:(x['region'],x['city'],x['address']))
        temp=OUT.with_suffix('.json.tmp')
        temp.write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n');temp.replace(OUT)
        return records

    def one(row):
        try:
            if args.provider=='top':return parse_top(row,fetch(row['url']+'about/contacts',args))
            return parse_page(row,fetch(row['url'],args))
        except Exception as e:return [],{**row,'status':'error','error':str(e)}
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures={pool.submit(one,row):row for row in targets}
        for f in concurrent.futures.as_completed(futures):
            records,report=f.result();all_records.extend(records);reports.append(report)
            if len(reports)%20==0:save_records()
            print(json.dumps({'done':len(reports),'total':len(targets),'city':report['city'],'status':report['status'],'records':len(records)},ensure_ascii=False),flush=True)
    # A location can appear on two provider domains: stable source id deduplicates it.
    records=save_records()
    summary={'checkedAt':TODAY,'provider':args.provider,'source':'https://kiber-one.com/?citys' if args.provider=='kiberone' else 'https://top-academy.ru/about/contacts','discoveredOfficialCities':len(cities),'targetCities':len(targets),'records':len(records),'regions':len({r['region'] for r in records}),'cities':len({r['city'] for r in records}),'coverage':{slug:sum(r['region']==slug for r in records) for slug in labels},'cityPages':sorted(reports,key=lambda x:x['city'])}
    REPORT.with_name('local-'+args.provider+'-report.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in summary.items() if k not in ('coverage','cityPages')},ensure_ascii=False))

if __name__=='__main__':main()
