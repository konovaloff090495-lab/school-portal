#!/usr/bin/env python3
"""Apply fresh visible-catalogue prices without altering programmes or classes."""
import argparse,json,re,os
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parents[2]
def clean(s):return re.sub(r'\s+',' ',s).strip()

def update(snapshot,apply=False):
    assert snapshot['sourceUrl']=='https://foxford.ru/catalog/courses/externship'
    assert snapshot['checkedAt']==date.today().isoformat(),'Only a same-day browser observation can refresh dates'
    assert 10<=len(snapshot['cards'])<=1000,'Incomplete or unexpected catalogue snapshot'
    observed={}
    for row in snapshot['cards']:
        u=urlparse(row['url'])
        assert u.scheme=='https' and u.hostname=='foxford.ru' and re.fullmatch(r'/courses/\d+',u.path)
        assert 'Освоить школьную программу' in row['text']
        key=u.path.split('/')[-1];assert key not in observed
        observed[key]=row
    path=ROOT/'data/courses/catalog.json';courses=json.loads(path.read_text())
    queue_path=ROOT/'data/courses/review-queue.json';queue=json.loads(queue_path.read_text()) if queue_path.exists() else {}
    changes=[];checked=0;pending=[]
    for c in courses:
        if c.get('verificationMethod')!='public-browser' or c['brandId']!='foxford':continue
        row=observed.get(urlparse(c['sourceUrl']).path.split('/')[2])
        reason=None
        if not row:reason='Course missing from current public school catalogue'
        elif clean(row['title'])!=c['sourceTitle']:reason='Public course title changed'
        else:
            m=re.search(r'(\d[\d\s\u00a0\u202f]{0,12})\s*₽\s*за\s*курс',row['text'])
            amount=int(re.sub(r'\D','',m[1])) if m else None
            previous=c.get('price')
            if not amount:reason='Price not confirmed in current public card'
            elif not previous or not .5<=amount/previous['amount']<=1.5:reason='New price or price change over 50%; needs review'
            else:
                checked+=1
                if amount!=previous['amount']:changes.append({'course':c['id'],'old':previous['amount'],'new':amount})
                c['price']={**previous,'amount':amount,'checkedAt':snapshot['checkedAt'],'evidence':clean(m[0])}
                c['lastBrowserPriceCheck']=snapshot['checkedAt']
        if reason:
            pending.append(c['id']);queue[c['id']]={'reason':reason,'sourceUrl':c['sourceUrl'],'checkedAt':snapshot['checkedAt']}
            c['price']=None
    report={'checkedAt':snapshot['checkedAt'],'confirmed':checked,'changes':changes,'pendingReview':pending,'applied':apply}
    if apply:
        tmp=path.with_suffix('.tmp');tmp.write_text(json.dumps(courses,ensure_ascii=False,indent=2)+'\n');os.replace(tmp,path)
        queue_path.write_text(json.dumps(queue,ensure_ascii=False,indent=2)+'\n')
        (ROOT/'work/courses/browser-refresh-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    return report

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--input',required=True);p.add_argument('--apply',action='store_true');args=p.parse_args()
    print(json.dumps(update(json.loads(Path(args.input).read_text()),args.apply),ensure_ascii=False))
