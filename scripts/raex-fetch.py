"""Рейтинги школ RAEX 2026 по субъектам РФ (открытые страницы raex-rr.com): два списка по 20 школ на
регион — «Масштаб» (school_regions) и «Конкурентоспособность выпускников» (schools_by_compete).
Сохраняет src/data/raex-schools-2026.json: [{list, region_slug, region_title, rank, name, city}].
Источник указывается на страницах сайта. Запуск: python3 scripts/raex-fetch.py"""
import re,json,time,urllib.request,os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'src/data/raex-schools-2026.json')
UA={"User-Agent":"Mozilla/5.0 (pro-schools.ru; ratings aggregation)"}
def fetch(u):
    for i in range(3):
        try: return urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=60).read().decode('utf-8','ignore')
        except Exception as e: time.sleep(3); err=e
    print("ERR",u,err); return ''
idx=fetch("https://raex-rr.com/education/schools/")
links=sorted(set(re.findall(r'href="(/education/(?:school_regions|schools_by_compete)/[^"]+/2026/)"',idx)))
print("страниц:",len(links))
rows=[]
for l in links:
    h=fetch("https://raex-rr.com"+l); time.sleep(1.0)
    title=(re.findall(r'<h1[^>]*>([^<]*)',h) or [''])[0].strip()
    lst='compete' if 'schools_by_compete' in l else 'scale'
    slug=l.split('/')[3]
    for r in re.findall(r'<tr[^>]*>(.*?)</tr>',h,flags=re.S):
        cells=[re.sub(r'\s+',' ',re.sub(r'<[^>]+>','',c)).strip() for c in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>',r,flags=re.S)]
        if len(cells)>=3 and cells[0].isdigit():
            rows.append({'list':lst,'region_slug':slug,'region_title':title,'rank':int(cells[0]),'name':cells[1],'city':cells[2]})
    print(l,len([x for x in rows if x['region_slug']==slug and x['list']==lst]),flush=True)
json.dump(rows,open(OUT,'w'),ensure_ascii=False,indent=0)
print("итого строк:",len(rows),"→",OUT)
