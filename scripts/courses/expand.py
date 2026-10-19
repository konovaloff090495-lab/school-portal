"""Expand verified navigation, without guessing landing URLs."""
import concurrent.futures as cf
import json, re
from discover import WORK, discover

EXTRA = [
 ('pixel','Пиксель','https://clubpixel.ru/'),
 ('algoritmika','Алгоритмика','https://algoritmika.org/'),
 ('kodland','Kodland','https://www.kodland.org/ru/courses'),
 ('easycode','EasyCode','https://easycode.tech/courses'),
 ('coddy','CODDY','https://coddyschool.com/online/'),
 ('synergy','Синергия','https://school-university.com/kursy-dlya-detey/'),
 ('synergy','Синергия','https://school-university.com/programmirovanie-dlya-detey/'),
 ('skysmart','Skysmart','https://skysmart.ru/courses/python'),
 ('advance','Advance','https://advance-club.ru/'),
 ('amakids','AMAKids','https://amakids.ru/'),
 ('foxford','Фоксфорд','https://foxford.ru/courses/8883/landing'),
]
if __name__=='__main__':
    previous=json.loads((WORK/'discovery.json').read_text())
    with cf.ThreadPoolExecutor(max_workers=4) as pool: extra=list(pool.map(discover,EXTRA))
    (WORK/'expanded.json').write_text(json.dumps(previous+extra,ensure_ascii=False,indent=2))
    for b in extra:
        print(b['id'],b.get('status',b.get('error')),len(b.get('links',{})))
        for u,t in b.get('links',{}).items():
            if re.search(r'course|kurs|python|scratch|roblox|design|шахмат|рисован|скорочтен|ментальн|программ|курсы|логик|памят',u+' '+t,re.I) and not re.search(r'blog|article|journal|wiki|news|review|politic|privacy|cookie',u,re.I): print(' ',u,t[:75])
