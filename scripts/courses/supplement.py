"""Additional programme links observed in official navigation."""
import json, concurrent.futures as cf
from harvest import harvest, WORK

URLS={
 'easycode':('EasyCode',['https://easycode.tech/interactive-world-creator-6-9','https://easycode.tech/interactive-world-creator-10-12','https://easycode.tech/interactive-world-creator-13-17']),
 'advance':('Advance',['https://advance.ru/online/oge_math/','https://advance.ru/online/uchis_uchitsya_nachalo/','https://advance.ru/online/uchis_uchitsya_5-7/','https://advance.ru/online/uchis_uchitsya/']),
 'iqsha':('Айкьюша',['https://iqsha.ru/uprazhneniya/topic/logika-i-myshlenie','https://iqsha.ru/uprazhneniya/topic/matematika','https://iqsha.ru/uprazhneniya/topic/chtenie-i-gramota','https://iqsha.ru/uprazhneniya/topic/vnimanie-i-pamyat','https://iqsha.ru/uprazhneniya/topic/anglijskiy-jazyk']),
}
if __name__=='__main__':
    plan=[{'brandId':k,'brand':b,'sourceUrl':u,'navLabel':''} for k,(b,urls) in URLS.items() for u in urls]
    with cf.ThreadPoolExecutor(max_workers=4) as p: results=list(p.map(harvest,plan))
    (WORK/'supplement.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
    for r in results: print(r['brandId'],r.get('h1',r.get('error')))
