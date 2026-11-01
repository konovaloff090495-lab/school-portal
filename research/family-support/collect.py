from pathlib import Path
import json,time,urllib.request,urllib.error,datetime
ROOT=Path(__file__).resolve().parent/'raw'
phrases=json.loads((ROOT.parent/'seeds.json').read_text())
(ROOT/'fresh-seeds.json').write_text(json.dumps(phrases,ensure_ascii=False,indent=2))
f=ROOT/'wordstat-fresh.json'
d=json.loads(f.read_text()) if f.exists() else {'source':'Yandex Cloud Wordstat GetTop v2','geo':'225','devices':'all','collected_date':'2026-10-31','metric':'broad queries over last30days; exact boundaries unavailable','seeds':{},'errors':[]}
keyfile=Path('/Users/dmitriikonovalov/.config/card-open/yandex-search-api-key');assert keyfile.stat().st_mode&0o077==0;key=keyfile.read_text().strip()
for i,phrase in enumerate(phrases):
 if phrase in d['seeds']:continue
 req=urllib.request.Request('https://searchapi.api.cloud.yandex.net/v2/wordstat/topRequests',json.dumps({'phrase':phrase,'numPhrases':2000,'regions':['225'],'devices':['DEVICE_ALL'],'folderId':'b1g5kmmka4v1fp2di7q1'},ensure_ascii=False).encode(),{'Authorization':'Api-key '+key,'Content-Type':'application/json'},method='POST')
 try:
  with urllib.request.urlopen(req,timeout=25) as response:result=json.load(response)
  d['seeds'][phrase]={'phrase':phrase,'retrieved_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'total_count':int(result.get('totalCount',0)),'results':result.get('results',[]),'associations':result.get('associations',[])}
  print(i+1,phrase,'rows',len(result.get('results',[])),flush=True)
 except urllib.error.HTTPError as e:
  d['errors'].append({'phrase':phrase,'status':e.code});print('HTTP',e.code,phrase,flush=True)
  if e.code in (401,403,429):f.write_text(json.dumps(d,ensure_ascii=False));break
 except Exception as e:d['errors'].append({'phrase':phrase,'error':type(e).__name__});print('ERROR',type(e).__name__,phrase,flush=True)
 f.write_text(json.dumps(d,ensure_ascii=False));time.sleep(.8)
print('COMPLETE',len(d['seeds']),'errors',len(d['errors']),flush=True)
