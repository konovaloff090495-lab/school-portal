"""Incremental IndexNow queue for every ProSchools sitemap, not just Afisha."""
import pathlib,json,sqlite3,datetime,urllib.request,urllib.error,urllib.parse,xml.etree.ElementTree as ET,re,fcntl,os
HOST='https://pro-schools.ru';NS={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}

def fetch(url):
 if urllib.parse.urlsplit(url).netloc!='pro-schools.ru':raise ValueError('Unexpected sitemap host')
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'ProSchools-Sitemap-Notifier/1.0'}),timeout=40)as response:
  data=response.read(52428801)
  if len(data)>52428800:raise ValueError('Sitemap exceeds 50 MiB')
  return data

def scan():
 roots=[line.split(':',1)[1].strip()for line in fetch(HOST+'/robots.txt').decode().splitlines()if line.lower().startswith('sitemap:')]
 pending=roots[:];seen=set();rows={};maps=[]
 while pending:
  url=pending.pop(0)
  if url in seen:continue
  seen.add(url);body=fetch(url);tree=ET.fromstring(body);kind=tree.tag.split('}')[-1]
  if len(tree)>50000:raise ValueError('Sitemap exceeds 50,000 entries')
  maps.append({'url':url,'type':kind,'entries':len(tree),'bytes':len(body)})
  if kind=='sitemapindex':pending.extend(n.text for n in tree.findall('s:sitemap/s:loc',NS));continue
  if kind!='urlset':raise ValueError('Invalid sitemap root')
  for node in tree.findall('s:url',NS):
   loc=node.findtext('s:loc','',NS);parts=urllib.parse.urlsplit(loc)
   if parts.scheme!='https'or parts.netloc!='pro-schools.ru'or parts.query or parts.fragment:raise ValueError('Noncanonical sitemap URL')
   modified=node.findtext('s:lastmod','',NS);rows[loc]=max(rows.get(loc,''),modified)
 if not rows:raise ValueError('No URLs found; queue unchanged')
 return rows,maps

def prepare(db,rows,initial_urls,now):
 db.execute('CREATE TABLE IF NOT EXISTS urls(url TEXT PRIMARY KEY, modified TEXT NOT NULL)')
 db.execute('CREATE TABLE IF NOT EXISTS pending(url TEXT PRIMARY KEY, modified TEXT NOT NULL)')
 db.execute('CREATE TABLE IF NOT EXISTS receipts(id INTEGER PRIMARY KEY, submitted_at TEXT, count INTEGER, http_status INTEGER)')
 first=db.execute('SELECT COUNT(*) FROM urls').fetchone()[0]==0;cutoff=(now-datetime.timedelta(days=3)).date().isoformat()
 with db:
  for url,modified in rows.items():
   old=db.execute('SELECT modified FROM urls WHERE url=?',(url,)).fetchone()
   changed=(not first and old is None)or(old is not None and modified and old[0]!=modified)
   initial=first and(url in initial_urls or modified and modified[:10]>=cutoff)
   if changed or initial:db.execute('INSERT OR REPLACE INTO pending VALUES(?,?)',(url,modified))
   db.execute('INSERT OR REPLACE INTO urls VALUES(?,?)',(url,modified))
 return first

def main():
 state=pathlib.Path(os.environ.get('PROSCHOOLS_INDEXNOW_STATE','/var/lib/portfolio/proschools-indexing'));state.mkdir(parents=True,exist_ok=True)
 lock=(state/'notify.lock').open('a')
 try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
 except BlockingIOError:print('Site indexing notification already running');return
 config=json.loads((state/'public-key.json').read_text());key=config['key']
 if not re.fullmatch(r'[A-Za-z0-9-]{8,128}',key):raise ValueError('Invalid public verification key')
 if fetch(HOST+'/'+key+'.txt').decode().strip()!=key:raise ValueError('Public IndexNow key verification failed')
 rows,maps=scan();seed=state/'initial-urls.json';initial=set(json.loads(seed.read_text()))if seed.exists()else set();now=datetime.datetime.now(datetime.timezone.utc);db=sqlite3.connect(state/'queue.sqlite');first=prepare(db,rows,initial,now)
 report={'checked_at':now.isoformat(),'scope':'all website sitemaps in robots.txt','unique_urls':len(rows),'sitemaps':maps,'first_baseline':first,'submitted':0,'accepted_key_pending':0,'batches':[]}
 while True:
  urls=[x[0]for x in db.execute('SELECT url FROM pending ORDER BY url LIMIT 10000')]
  if not urls:break
  payload={'host':'pro-schools.ru','key':key,'keyLocation':HOST+'/'+key+'.txt','urlList':urls}
  request=urllib.request.Request('https://api.indexnow.org/indexnow',data=json.dumps(payload).encode(),headers={'Content-Type':'application/json; charset=utf-8'},method='POST')
  try:
   with urllib.request.urlopen(request,timeout=45)as response:status=response.status
  except urllib.error.HTTPError as error:status=error.code
  except (urllib.error.URLError,TimeoutError,OSError):status=0
  report['batches'].append({'count':len(urls),'http_status':status})
  if status not in [200,202]:break
  with db:
   db.executemany('DELETE FROM pending WHERE url=?',[(u,)for u in urls]);db.execute('INSERT INTO receipts(submitted_at,count,http_status) VALUES(?,?,?)',(now.isoformat(),len(urls),status))
  report['submitted'if status==200 else'accepted_key_pending']+=len(urls)
 report['pending']=db.execute('SELECT COUNT(*) FROM pending').fetchone()[0];db.close();tmp=state/'status.incoming';tmp.write_text(json.dumps(report,ensure_ascii=False,indent=2));tmp.replace(state/'status.json');print(json.dumps(report,ensure_ascii=False),flush=True)
 if report['pending']:raise SystemExit(1)

if __name__=='__main__':main()
