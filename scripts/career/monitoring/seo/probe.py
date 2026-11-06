from common import *
from concurrent.futures import ThreadPoolExecutor,as_completed
from urllib.parse import quote
PID=28653775
jobs={
 'topvisor-project':lambda:tv('get/projects_2/projects',{'filters':[{'name':'id','operator':'EQUALS','values':[PID]}],'fields':['id','name','site','on','url'],'show_searchers_and_regions':1}),
 'topvisor-bank':lambda:tv('get/bank_2/info',{}),
 'topvisor-groups':lambda:tv('get/keywords_2/groups',{'project_id':PID,'fields':['id','name','on']}),
 'ywm-quota':lambda:ywm('hosts/https:pro-schools.ru:443/recrawl/quota'),
 'indexnow-key':lambda:http(SITE+'/'+indexmod.KEY+'.txt'),
 'career-sitemap':lambda:http(SITEMAP),
}
def checkgsc():
 try:
  token=gscmod.access_token();return gsc('sites',token)
 except Exception as e:return {'status':None,'error':type(e).__name__,'retrieved_at':now()}
jobs['gsc-sites']=checkgsc
with ThreadPoolExecutor(max_workers=3) as pool:
 fs={pool.submit(f):name for name,f in jobs.items()}
 for future in as_completed(fs):
  name=fs[future];r=future.result();save('probe/'+name+'.json',r)
  if name=='indexnow-key':print(name,r.get('status'),'key_matches',r.get('text','').strip()==indexmod.KEY,flush=True)
  elif name=='gsc-sites':print(name,r.get('status'),[x for x in (r.get('data') or {}).get('siteEntry',[]) if 'pro-schools' in x.get('siteUrl','')],flush=True)
  elif name=='career-sitemap':print(name,r.get('status'),len(r.get('text') or ''),flush=True)
  else:print(name,r.get('status'),str(r.get('data') or r.get('error'))[:2200],flush=True)
