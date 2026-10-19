#!/usr/bin/env python3
"""Refresh explicit price facts; route curriculum/terms changes to review."""
import concurrent.futures as cf
import json, re, os
from datetime import datetime, timezone
from pathlib import Path
from harvest import harvest, ROOT, WORK
from prepare import price_fact, clean

def refresh():
    path=ROOT/'data/courses/catalog.json';courses=json.loads(path.read_text())
    pending_path=ROOT/'data/courses/review-queue.json'
    pending=json.loads(pending_path.read_text()) if pending_path.exists() else {}
    changes=[];failures=[]
    # Foxford refuses ordinary HTTP. Its prices are verified from the visible
    # public browser catalogue by the scheduled Codex workflow; never refresh
    # the date from a stale snapshot or parse an authentication error as a course.
    browser_sources=[c for c in courses if c.get('active') and c.get('verificationMethod')=='public-browser']
    active=[c for c in courses if c.get('active') and c.get('verificationMethod')!='public-browser']
    def pull(c):return harvest({'brandId':c['brandId'],'brand':c['brand'],'sourceUrl':c['sourceUrl'],'navLabel':c['title']},use_cache=False)
    with cf.ThreadPoolExecutor(max_workers=3) as pool:
        for course,new in zip(active,pool.map(pull,active)):
            if new.get('status')!=200 or '/404' in new['sourceUrl'] or len(new.get('h1',''))<3:
                failures.append({'course':course['id'],'error':new.get('error','No valid programme page')})
                pending[course['id']]={'reason':'Source unavailable','sourceUrl':course['sourceUrl'],'checkedAt':datetime.now(timezone.utc).isoformat()}
                continue
            oldprice=course.get('price');newprice=price_fact(new)
            changed_title=clean(new['h1'])!=course.get('sourceTitle',clean(new['h1']))
            if changed_title:
                pending[course['id']]={'reason':'Programme title changed; review before updating facts','sourceUrl':course['sourceUrl'],'oldTitle':course.get('sourceTitle'),'newTitle':clean(new['h1']),'newHeadings':new['headings'][:16],'checkedAt':new['checkedAt']}
                # A different programme must never inherit the old price.
                if oldprice:course['price']=None;changes.append({'course':course['id'],'type':'price_hidden_title_change'})
                course['offer']=None
                course['packages']=[]
                continue
            if oldprice and newprice and newprice['unit']==oldprice['unit'] and ((oldprice['amount']==newprice['amount']==0) or (oldprice['amount']>0 and .5<=newprice['amount']/oldprice['amount']<=1.5)):
                course['price']=newprice
                if oldprice['amount']!=newprice['amount']:changes.append({'course':course['id'],'type':'price','old':oldprice['amount'],'new':newprice['amount'],'unit':newprice['unit']})
            elif oldprice and not newprice:
                course['price']=None;changes.append({'course':course['id'],'type':'price_no_longer_confirmed'})
            elif newprice and (not oldprice or newprice!=oldprice):
                pending[course['id']]={'reason':'New price or unit requires review','sourceUrl':course['sourceUrl'],'priceCandidate':newprice,'checkedAt':new['checkedAt']}
                if oldprice:course['price']=None
            if course.get('offer'):
                if re.search(re.escape(course['offer']['evidence']),new['text'],re.I) and (not course['offer'].get('conditionEvidence') or re.search(re.escape(course['offer']['conditionEvidence']),new['text'],re.I)):course['offer']['checkedAt']=new['checkedAt'][:10]
                else:course['offer']=None;changes.append({'course':course['id'],'type':'offer_removed'})
            if new['contentHash']!=course['contentHash']:
                pending.setdefault(course['id'],{'reason':'Source content changed; check description, curriculum and conditions','sourceUrl':course['sourceUrl'],'newHeadings':new['headings'][:16],'checkedAt':new['checkedAt']})
            course['lastSourceCheck']=new['checkedAt'][:10]
            course['lastSeenHash']=new['contentHash']
            for package in course.get('packages',[]):
                observed=harvest({'brandId':course['brandId'],'brand':course['brand'],'sourceUrl':package['sourceUrl'],'navLabel':package['sourceTitle']},use_cache=False)
                if observed.get('status')!=200:continue
                candidate=price_fact(observed);previous=package.get('price')
                if clean(observed.get('h1',''))!=package['sourceTitle']:
                    package['price']=None;continue
                if candidate and previous and candidate['unit']==previous['unit'] and .5<=candidate['amount']/previous['amount']<=1.5:package['price']=candidate
                elif not candidate:package['price']=None
                else:
                    pending[course['id']+'-package-'+str(package['lessons'])]={'reason':'Lesson package price needs review','sourceUrl':package['sourceUrl'],'checkedAt':new['checkedAt']}
                    package['price']=None
    tmp=path.with_suffix('.tmp');tmp.write_text(json.dumps(courses,ensure_ascii=False,indent=2)+'\n');os.replace(tmp,path)
    pending_path.write_text(json.dumps(pending,ensure_ascii=False,indent=2)+'\n')
    report={'checkedAt':datetime.now(timezone.utc).isoformat(),'checked':len(active),'browserVerifiedSources':len(browser_sources),'changes':changes,'failures':failures,'pendingReview':len(pending)}
    (WORK/'refresh-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'checked':len(active),'changes':len(changes),'failures':len(failures),'pendingReview':len(pending)}))
if __name__=='__main__':refresh()
