#!/usr/bin/env python3
"""Аудит поисковых запросов pro-schools.ru по Яндекс.Вебмастеру (снимок + анализ).
Использование:
  python3 scripts/seo/wm_audit.py pull            # снимает данные в scripts/seo/wm-data/<дата>/
  python3 scripts/seo/wm_audit.py report          # печатает отчёт по последнему снимку
  python3 scripts/seo/wm_audit.py effect <дата>   # позиции/CTR страниц из списка до/после даты (14 дн.)
Что снимает pull:
  history.json  — показы/клики/позиция по дням за всю историю хоста (search-queries/all/history)
  windows.json  — топ-2500 запросов по показам в двухнедельных окнах с 01.06 (search-queries/popular)
  urls.json     — по каждому URL: показы/клики/CTR/позиция по дням за 14 дн. + главный запрос (query-analytics, URL)
  queries.json  — по каждому запросу: то же + URL, который ранжируется (query-analytics, QUERY) — ~20 000 строк
Ключевой приём: связка «запрос → URL» из queries.json говорит, ЗАНЯТ ли интент своей страницей.
Если по запросу с показами уже ранжируется наш URL — новую страницу НЕ писать, усиливать эту.
"""
import json,sys,os,time,datetime as dt,collections,urllib.request
TOK=os.environ.get("YW_TOKEN","y0__wgBEJHt6LABGNnGRCCDvcOLGFDZMa8ZuWa2fgotAE8dNc-rjJ9Y")
BASE="https://api.webmaster.yandex.net/v4/user/370816657/hosts/https:pro-schools.ru:443"
ROOT=os.path.dirname(os.path.abspath(__file__)); DATA=os.path.join(ROOT,'wm-data')
H={"Authorization":"OAuth "+TOK,"Content-Type":"application/json"}
def get(u):  return json.load(urllib.request.urlopen(urllib.request.Request(u,headers=H),timeout=120))
def post(u,b): return json.load(urllib.request.urlopen(urllib.request.Request(u,data=json.dumps(b).encode(),headers=H,method="POST"),timeout=120))
def qa(indicator):
    rows=[]
    for off in range(0,50000,100):
        r=post(BASE+"/query-analytics/list",{"offset":off,"limit":100,"device_type_indicator":"ALL","text_indicator":indicator})
        t=r.get("text_indicator_to_statistics",[]); rows+=t
        if len(t)<100: break
        time.sleep(0.2)
    return rows
def agg(r):
    st={}
    for s in r['statistics']: st.setdefault(s['date'],{})[s['field']]=s['value']
    imp=sum(v.get('IMPRESSIONS',0) for v in st.values()); cl=sum(v.get('CLICKS',0) for v in st.values())
    pos=sum(v.get('POSITION',0)*v.get('IMPRESSIONS',0) for v in st.values())/max(imp,1)
    return imp,cl,pos,st
def pull():
    today=dt.date.today(); d=os.path.join(DATA,str(today)); os.makedirs(d,exist_ok=True)
    json.dump(get(BASE+f"/search-queries/all/history?query_indicator=TOTAL_SHOWS&query_indicator=TOTAL_CLICKS&query_indicator=AVG_SHOW_POSITION&date_from=2026-01-01&date_to={today}"),open(d+'/history.json','w'))
    W={}; a=dt.date(2026,6,4)
    while a<today:
        b=min(a+dt.timedelta(days=13),today); qs=[]
        for off in range(0,2500,500):
            r=get(BASE+f"/search-queries/popular?order_by=TOTAL_SHOWS&order_direction=DESC&date_from={a}&date_to={b}&limit=500&offset={off}&query_indicator=TOTAL_SHOWS&query_indicator=TOTAL_CLICKS&query_indicator=AVG_SHOW_POSITION")
            q=r.get('queries',[]); qs+=q
            if len(q)<500: break
        W[f"{a}_{b}"]=qs; print(a,b,len(qs),file=sys.stderr); a=b+dt.timedelta(days=1)
    json.dump(W,open(d+'/windows.json','w'),ensure_ascii=False)
    json.dump(qa("URL"),open(d+'/urls.json','w'),ensure_ascii=False); print("urls ok",file=sys.stderr)
    json.dump(qa("QUERY"),open(d+'/queries.json','w'),ensure_ascii=False); print("queries ok",file=sys.stderr)
    print("снимок:",d)
def latest():
    ds=sorted(os.listdir(DATA)) if os.path.exists(DATA) else []
    if not ds: sys.exit("нет снимков — сначала pull")
    return os.path.join(DATA,ds[-1])
def report():
    d=latest(); print("снимок",d)
    h=json.load(open(d+'/history.json'))['indicators']
    S={x['date'][:10]:x['value'] for x in h['TOTAL_SHOWS']}; C={x['date'][:10]:x['value'] for x in h['TOTAL_CLICKS']}
    wk=collections.OrderedDict()
    for day in sorted(S):
        if not S[day]: continue
        dd=dt.date.fromisoformat(day); mon=str(dd-dt.timedelta(days=dd.weekday())); x=wk.setdefault(mon,[0,0]); x[0]+=S[day]; x[1]+=C.get(day,0)
    print("\n## Недели: показы / клики / CTR (последние 8)")
    for k,v in list(wk.items())[-8:]: print(f"  {k}  {int(v[0]):7d} {int(v[1]):6d}  {v[1]/v[0]*100:5.2f}%")
    U=[(r['text_indicator']['value'],r.get('popular_complementary_indicator',{}).get('value',''))+agg(r)[:3] for r in json.load(open(d+'/urls.json'))]
    sec=collections.defaultdict(lambda:[0,0,0])
    for u,q,imp,cl,pos in U:
        k='/'.join(u.split('/')[:2])+'/'; sec[k][0]+=imp; sec[k][1]+=cl; sec[k][2]+=1
    print("\n## Разделы (14 дн.)")
    for k,v in sorted(sec.items(),key=lambda x:-x[1][0])[:8]: print(f"  {k:14s} стр {v[2]:5d} показы {int(v[0]):7d} клики {int(v[1]):5d} CTR {v[1]/max(v[0],1)*100:5.2f}%")
    print("\n## Страницы: показы ≥ 300, CTR < 1.5 % (кандидаты на усиление)")
    for u,q,imp,cl,pos in sorted(U,key=lambda x:-x[2]):
        if imp>=300 and cl/imp<0.015: print(f"  {int(imp):6d} {int(cl):4d} {cl/imp*100:5.2f}% поз{pos:5.1f}  {u}  | {q}")
    Q=[(r['text_indicator']['value'],r.get('popular_complementary_indicator',{}).get('value',''))+agg(r)[:3] for r in json.load(open(d+'/queries.json'))]
    print("\n## Запросы: показы ≥ 40, позиция ≥ 15 (интент, где страница слабая или не та)")
    for q,u,imp,cl,pos in sorted(Q,key=lambda x:-x[2]):
        if imp>=40 and pos>=15 and len(q)<80: print(f"  {int(imp):5d}/{int(cl):2d} поз{pos:5.1f} {q:50s} {u}")
    print("\n## Запросы: показы ≥ 100, CTR < 1 % — по URL, который ранжируется")
    byurl=collections.defaultdict(list)
    for q,u,imp,cl,pos in Q:
        if imp>=100 and cl/imp<0.01: byurl[u].append((imp,q,pos))
    for u,qs in sorted(byurl.items(),key=lambda x:-sum(a[0] for a in x[1]))[:40]:
        print(f"  {int(sum(a[0] for a in qs)):6d}  {u}  ← "+'; '.join(f'{q} ({int(i)}@{p:.0f})' for i,q,p in sorted(qs,reverse=True)[:3]))
def effect(date):
    d=latest(); rows=json.load(open(d+'/urls.json'))
    want=[l.strip() for l in sys.stdin if l.strip()]
    print("страница | показы/день до→после | CTR до→после | позиция до→после")
    for r in rows:
        u=r['text_indicator']['value']
        if u not in want: continue
        imp,cl,pos,st=agg(r)
        a=[k for k in st if k<=date]; b=[k for k in st if k>date]
        def f(ks):
            i=sum(st[k].get('IMPRESSIONS',0) for k in ks); c=sum(st[k].get('CLICKS',0) for k in ks); p=sum(st[k].get('POSITION',0)*st[k].get('IMPRESSIONS',0) for k in ks)/max(i,1)
            return i/max(len(ks),1),c/max(i,1)*100,p
        A=f(a);B=f(b); print(f"  {u} | {A[0]:.0f}→{B[0]:.0f} | {A[1]:.2f}→{B[1]:.2f} % | {A[2]:.1f}→{B[2]:.1f}")
if __name__=="__main__":
    cmd=sys.argv[1] if len(sys.argv)>1 else 'report'
    {'pull':pull,'report':report,'effect':lambda:effect(sys.argv[2])}[cmd]()
