"""Import reviewed online programmes and their original-source audit trail."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[2];DATA=ROOT/'data/courses'
read=lambda p:json.loads(p.read_text())
def save(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
source=read(ROOT/'src/data/programming-online-verified.json')
catalog=read(DATA/'catalog.json');ids={c['id'] for c in catalog};urls={c['sourceUrl'].rstrip('/') for c in catalog};cats={c['id'] for c in read(DATA/'categories.json')}
review=read(DATA/'market-review.json');records={r['courseId']:r for r in review['verifiedSourcePages']};added=[]
for c in source['courses']:
 if c['id'] in ids:continue
 if c['sourceUrl'].rstrip('/') in urls:continue
 if c['category'] not in cats:raise ValueError('Unknown course category '+c['category'])
 c['tags']=[t for t in c['tags'] if t in cats]
 assert c['onlineEvidence'] and c['contentHash'] and c['sourceUrl'].startswith('https://')
 assert c['price'] is None or c['price'].get('evidence')
 catalog.append(c);ids.add(c['id']);urls.add(c['sourceUrl'].rstrip('/'));added.append(c['id'])
 records[c['id']]={'courseId':c['id'],'sourceUrl':c['sourceUrl'],'sourceHash':c['contentHash'],'checkedAt':c['checkedAt'],'evidence':c['onlineEvidence'],'sourceDiscoveryUrl':c.get('sourceDiscoveryUrl',c['sourceUrl'])}
review['verifiedSourcePages']=list(records.values());review['reviewedAt']='2026-10-19';review['newCourses']=len(records)
save(DATA/'catalog.json',catalog);save(DATA/'market-review.json',review)
(ROOT/'work/programming/imported-course-ids.json').write_text(json.dumps(added,ensure_ascii=False))
print('New reviewed courses:',len(added),'Active inventory:',sum(bool(c.get('active')) for c in catalog))
