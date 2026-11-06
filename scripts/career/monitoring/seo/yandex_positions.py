from common import *
import argparse,base64,csv,xml.etree.ElementTree as ET
from urllib.parse import urlsplit
parser=argparse.ArgumentParser();parser.add_argument('--date',default=dt.datetime.now(dt.timezone(dt.timedelta(hours=3))).date().isoformat());parser.add_argument('--limit',type=int,default=55);args=parser.parse_args()
config=json.loads((HERE/'config.json').read_text());key_file=Path.home()/'.config/card-open/yandex-search-api-key';assert key_file.stat().st_mode&0o077==0;key=key_file.read_text().strip();folder='b1g5kmmka4v1fp2di7q1';results=[]
for n,item in enumerate(config['queries'][:args.limit],1):
 q=item['query'];name=f'yandex-cloud/{args.date}/{n:02}.json';p=OUT/name
 if p.exists():
  r=json.loads(p.read_text());results.append(r)
  if r.get('http_status')==429:print('Cached quota stop for this date; no further requests.',flush=True);break
  continue
 body={'query':{'searchType':'SEARCH_TYPE_RU','queryText':q,'page':'0','fixTypoMode':'FIX_TYPO_MODE_OFF'},'groupSpec':{'groupMode':'GROUP_MODE_FLAT','groupsOnPage':'100','docsInGroup':'1'},'region':'225','folderId':folder,'responseFormat':'FORMAT_XML'}
 response=http('https://searchapi.api.cloud.yandex.net/v2/web/search','POST',body,{'Authorization':'Api-Key '+key},45);r={'query':q,'engine':'Yandex Cloud Search API RU','region_key':225,'requested_depth':100,'checked_at':now(),'status':'unavailable','position':None}
 data=response.get('data') or {}
 if response.get('status')==200 and data.get('rawData'):
  try:
   xml=base64.b64decode(data['rawData']);xmlpath=OUT/'yandex-cloud'/args.date/f'{n:02}.xml';xmlpath.parent.mkdir(parents=True,exist_ok=True);xmlpath.write_bytes(xml);root=ET.fromstring(xml);error=root.find('.//error');docs=[]
   if error is not None:r['error']='XML '+''.join(error.itertext())[:200]
   else:
    for pos,d in enumerate(root.findall('.//doc'),1):
     get=lambda k:''.join(d.find(k).itertext()) if d.find(k) is not None else ''
     docs.append({'position':pos,'url':get('url'),'title':get('title')})
    ours=[d for d in docs if (urlsplit(d['url']).hostname or '').removeprefix('www.')=='pro-schools.ru'];r.update(returned_docs=len(docs),observed_depth=len(docs),docs=docs,matching_urls=ours,position=min((d['position'] for d in ours),default=None),status='found' if ours else 'not_found_within_observed_depth')
  except Exception as e:r['error']=type(e).__name__
 else:r.update(http_status=response.get('status'),error=response.get('error'))
 save(name,r);results.append(r);print(n,'/',min(args.limit,55),q,r['status'],r.get('position'),'depth',r.get('observed_depth'),flush=True)
 if response.get('status')==429:break
 time.sleep(.25)
save('yandex-cloud/'+args.date+'/positions.json',results)
with (OUT/'yandex-cloud'/args.date/'positions.csv').open('w',encoding='utf-8-sig',newline='') as f:
 fields=['query','engine','region_key','checked_at','requested_depth','observed_depth','position','status','matching_urls'];w=csv.DictWriter(f,fieldnames=fields,extrasaction='ignore');w.writeheader();w.writerows(results)
