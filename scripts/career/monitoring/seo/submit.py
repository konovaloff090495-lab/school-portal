from common import *
import argparse,re,xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor,as_completed
from bs4 import BeautifulSoup
parser=argparse.ArgumentParser();parser.add_argument('--submit',action='store_true');args=parser.parse_args()
urls=[SITE+p for p in manifest()['pages']];assert len(urls)==60 and len(set(urls))==60
sm=http(SITEMAP);save('submission/sitemap-response.json',sm)
assert sm['status']==200,'Sitemap is unavailable'
locs=[x.text for x in ET.fromstring(sm['text']).findall('{*}url/{*}loc')];assert set(locs)==set(urls) and len(locs)==60,'Sitemap must contain exactly 60 manifest URLs'
def check(url):
 r=http(url,timeout=30);soup=BeautifulSoup(r.get('text') or '','html.parser');canonical=soup.select_one('link[rel="canonical"]');robots=soup.select_one('meta[name="robots"]');return {'url':url,'http':r['status'],'canonical':canonical.get('href') if canonical else None,'robots':robots.get('content') if robots else None,'ok':r['status']==200 and canonical is not None and canonical.get('href')==url and not (robots and 'noindex' in robots.get('content','').lower()),'retrieved_at':r['retrieved_at'],'error':r.get('error')}
checks=[]
with ThreadPoolExecutor(max_workers=4) as pool:
 for f in as_completed([pool.submit(check,u) for u in urls]):checks.append(f.result())
checks.sort(key=lambda r:urls.index(r['url']));save('submission/url-checks.json',checks);print('canonical checks',sum(x['ok'] for x in checks),'/',len(checks),flush=True)
assert all(x['ok'] for x in checks),'Unsafe URL set; no submissions performed'
if not args.submit:raise SystemExit('Validated only; add --submit for authorized actions')
state_path=OUT/'submission/receipts.json';state=json.loads(state_path.read_text()) if state_path.exists() else {'created_at':now(),'urls':urls,'yandex_recrawl':[]}
# Key verification is compulsory, not just POST acceptance.
key=http(SITE+'/'+indexmod.KEY+'.txt');state['indexnow_key']={'http':key['status'],'matches':(key.get('text') or '').strip()==indexmod.KEY,'retrieved_at':now()}
if state['indexnow_key']['http']==200 and state['indexnow_key']['matches'] and not state.get('indexnow'):
 state['indexnow']=http('https://api.indexnow.org/indexnow','POST',{'host':'pro-schools.ru','key':indexmod.KEY,'keyLocation':SITE+'/'+indexmod.KEY+'.txt','urlList':urls})
else:state.setdefault('indexnow',{'status':None,'reason':'key unavailable or already submitted'})
save('submission/receipts.json',state);print('IndexNow',state['indexnow'].get('status'),flush=True)
base='hosts/https:pro-schools.ru:443/'
quota=ywm(base+'recrawl/quota');state['quota_before']=quota;save('submission/receipts.json',state)
accepted={x['url'] for x in state['yandex_recrawl'] if x['response'].get('status') in (200,201,202)}
for url in urls:
 if url in accepted:continue
 current=ywm(base+'recrawl/quota');remaining=(current.get('data') or {}).get('quota_remainder')
 if current.get('status')!=200 or remaining is None or remaining<=20:
  state['recrawl_stop']={'reason':'quota_reserve_or_access','remaining':remaining,'reserve':20,'at':now()};break
 response=ywm(base+'recrawl/queue','POST',{'url':url});state['yandex_recrawl'].append({'url':url,'quota_before':remaining,'response':response});save('submission/receipts.json',state)
 if response.get('status') not in (200,201,202):state['recrawl_stop']={'reason':'non_success','status':response.get('status'),'at':now()};break
 print('Yandex recrawl',len(state['yandex_recrawl']),'/',len(urls),flush=True);time.sleep(.2)
state['quota_after']=ywm(base+'recrawl/quota')
# Ordinary educational articles use GSC sitemap submission, never Indexing API.
try:
 ping=module('career_gsc_write',PORTFOLIO/'seo-tools/ping_sitemap.py');token=ping.token();site='sc-domain:pro-schools.ru';es=urllib.parse.quote(site,safe='');ef=urllib.parse.quote(SITEMAP,safe='')
 if state.get('gsc_sitemap_submit',{}).get('status') not in (200,201,204):
  for attempt in range(3):
   response=gsc('sites/'+es+'/sitemaps/'+ef,token,'PUT');state.setdefault('gsc_submission_attempts',[]).append(response)
   if response.get('status') in (200,201,204):state['gsc_sitemap_submit']=response;break
   state.setdefault('gsc_sitemap_submit',response)
   if response.get('status') in (400,401,403):break
   time.sleep(2)
 state['gsc_sitemap_status']=gsc('sites/'+es+'/sitemaps/'+ef,token)
except Exception as e:state['gsc_sitemap_submit']={'status':None,'error':type(e).__name__,'retrieved_at':now()}
state['completed_at']=now();state['accepted_recrawl_count']=sum(x['response'].get('status') in (200,201,202) for x in state['yandex_recrawl']);state['not_submitted_urls']=[u for u in urls if u not in {x['url'] for x in state['yandex_recrawl'] if x['response'].get('status') in (200,201,202)}];save('submission/receipts.json',state)
print('DONE',{'recrawl':state['accepted_recrawl_count'],'quota_after':(state['quota_after'].get('data') or {}).get('quota_remainder'),'gsc':state['gsc_sitemap_submit'].get('status'),'indexnow':state['indexnow'].get('status')},flush=True)
