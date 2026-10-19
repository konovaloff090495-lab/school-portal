"""Fetch candidate programmes from official navigation for editorial review."""
import concurrent.futures as cf
import hashlib, json, re
from urllib.parse import urlparse
from datetime import datetime, timezone
from bs4 import BeautifulSoup
from discover import ROOT, WORK, fetch

LIMITS={'coddy':75,'synergy':80,'umschool':35,'sotka':32,'100points':30,'skysmart':25,'pixel':20}
ALLOWED={
 'skysmart':r'/courses/(?:[^/]+-urokov|[^/]+/[^/]+/[^/]+-urokov)$',
 'umschool':r'/(?:ege/(?:10|11)-class|oge|srednyaya-shkola/[78]-class|olimpiady)/[^/]+/$',
 'sotka':r'/(?:ege/(?:10|11)class|oge/[89]class|(?:middle|primary)school/\d+class)/[^/]+$',
 '100points':r'/course/[^/]+/$',
 'synergy':r'/(?:kursy-dlya-detey|programmirovanie-dlya-detey|kursy-ege|kursy-oge|nachalnaya-shkola|soft-skills)/[^/]+/$',
 'pixel':r'/(?:detskoe_programmirovanie_scratch|scratch_s_ii|kurs_gimp_dlya_detej|scratch|programmirovanie-python-v-minecraft-s-ii|webdesign-mladshie-shkolniki|roblox_s_ii|roblox|roblox-modelirovanie|python_ai_dlja_detej|python|webdesign|django_dlya_detej|kurs-unity-dlya-detey-razrabotka-mobilnyh-igr)$',
 'coddy':r'/courses/[^/]+/$',
 'kodland':r'/ru/courses/coding/[^/]+$',
 'easycode':r'/(?:designer-world-technology-6-9|designer-world-technology-10-17|junior|middle|senior|fullstack)[^/]*$',
 'rebotica':r'/(?:web-designer|programmer|gamedev|gamedev_unity|gdevelop)$',
 'uchi-doma':r'/(?:ege|oge|math|english|russian|preschool|programming)[^/]*$',
 'teatrika':r'/(?:matematika_|preschool|english_kids|english|logoped|russkiy|fizika|himiya|biologiya|informatika|istoriya|obshchestvoznanie)[^/]*$',
 'novakid':r'/programs/[^/]+/$',
 'artfox':r'/online-kursi/(?:dlya-detey|zhivopis|individualnye-zanyatiya-risovaniya)/$',
 'lil':r'/(?:logoped|logoped-dlya-bilingvov|logoped-dlya-shkolnikov|podgotovka-k-shkole)/$',
}
SINGLE={'algoritmika','chess','iqsha','logiclike','advance'}

def candidates():
    found={}
    brands=json.loads((WORK/'expanded.json').read_text())
    for b in brands:
        key=b['id']
        if 'status' not in b: continue
        if key in SINGLE:
            found[(key,b['url'])]={'brandId':key,'brand':b['name'],'sourceUrl':b['url'],'navLabel':b['title']}
        for u,label in b.get('links',{}).items():
            if key in ALLOWED and re.search(ALLOWED[key],urlparse(u).path):
                found[(key,u)]={'brandId':key,'brand':b['name'],'sourceUrl':u,'navLabel':label}
    counts={}; out=[]
    for (key,u),c in found.items():
        if counts.get(key,0)>=LIMITS.get(key,15): continue
        counts[key]=counts.get(key,0)+1; out.append(c)
    return out

def harvest(c,use_cache=True):
    if c.get('brandId')=='sirius':
        from sirius_source import harvest_public
        return harvest_public(c)
    url=c['sourceUrl']; key=hashlib.sha256(url.encode()).hexdigest()[:16]
    try:
        cache=WORK/(key+'.html')
        if use_cache and cache.exists(): html=cache.read_text(); final=url
        else:
            r=fetch(url); html=r.text; final=r.url; cache.write_text(html)
        soup=BeautifulSoup(html,'html.parser')
        title=soup.find('h1') or soup.title
        h1=title.get_text(' ',strip=True) if title else c['navLabel']
        meta=soup.find('meta',attrs={'name':'description'})
        headings=[re.sub(r'\s+',' ',h.get_text(' ',strip=True)) for h in soup.select('h2,h3')]
        for el in soup.select('script,style,nav,footer,header,noscript'): el.decompose()
        text=re.sub(r'\s+',' ',soup.get_text(' ',strip=True))
        priceContexts=[text[max(0,m.start()-60):m.end()+90] for m in re.finditer(r'\d[\d\s\u00a0\u202f]{1,10}\s*(?:₽|руб\.?|рублей)',text)]
        ages=[m.group(0) for m in re.finditer(r'(?:от\s*)?\d{1,2}\s*(?:[–—−-]|до)\s*\d{1,2}\s*(?:лет|года|класс[а-я]*)',text)]
        return {**c,'sourceUrl':final,'h1':h1,'meta':meta.get('content','') if meta else '',
          'headings':headings[:70],'priceContexts':priceContexts[:45],'ageEvidence':list(dict.fromkeys(ages))[:20],
          'contentHash':hashlib.sha256(text.encode()).hexdigest(),'checkedAt':datetime.now(timezone.utc).isoformat(),
          'text':text[:50000], 'status':200}
    except Exception as e: return {**c,'error':str(e)[:200]}

if __name__=='__main__':
    plan=candidates(); (WORK/'candidates.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2))
    print('Candidates:',len(plan),flush=True)
    results=[]
    with cf.ThreadPoolExecutor(max_workers=4) as pool:
        for i,r in enumerate(pool.map(harvest,plan)):
            results.append(r)
            if i%20==0: print(i+1,r['brandId'],r.get('status',r.get('error')),flush=True)
    (WORK/'harvest.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
    from collections import Counter
    print('Verified:',dict(Counter(x['brandId'] for x in results if x.get('status')==200)))
