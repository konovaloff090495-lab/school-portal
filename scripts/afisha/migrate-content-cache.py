"""Stream existing cache into a bounded-memory SQLite fact store."""
import pathlib,os,json,sqlite3,gzip,hashlib,shutil
R=pathlib.Path(os.environ['AFISHA_ROOT']);W=R/'work/afisha-production';p=W/'content-facts.json';db=sqlite3.connect(W/'content-facts.sqlite');db.execute('CREATE TABLE IF NOT EXISTS facts(key TEXT PRIMARY KEY, content TEXT NOT NULL, checked TEXT NOT NULL)');decoder=json.JSONDecoder();count=0
with p.open()as src:
 buffer='';pos=0
 def more():
  global buffer,pos
  buffer=buffer[pos:]+src.read(65536);pos=0
 def spaces():
  global pos
  while True:
   while pos<len(buffer)and buffer[pos].isspace():pos+=1
   if pos<len(buffer):return
   more()
 def char():
  global pos
  spaces();c=buffer[pos];pos+=1;return c
 def value():
  global pos
  while True:
   spaces()
   try:v,n=decoder.raw_decode(buffer,pos);pos=n;return v
   except json.JSONDecodeError:more()
 assert char()=='{';first=True
 while True:
  spaces()
  if buffer[pos]=='}':break
  if not first:assert char()==','
  key=value();assert char()==':';v=value();db.execute('INSERT OR REPLACE INTO facts VALUES(?,?,?)',(key,json.dumps(v,ensure_ascii=False,separators=(',',':')),v.get('contentChecked','')));count+=1;first=False
  if count%100==0:db.commit()
db.commit();assert db.execute('SELECT count(*) FROM facts').fetchone()[0]>=count;db.close()
# Keep a verified, recoverable compressed snapshot of the old format.
backup=p.with_name('content-facts-migrated.json.gz')
with p.open('rb')as src,gzip.open(backup,'wb',compresslevel=4)as dst:shutil.copyfileobj(src,dst,1024*1024)
a=hashlib.sha256();b=hashlib.sha256()
with p.open('rb')as f:
 for block in iter(lambda:f.read(1024*1024),b''):a.update(block)
with gzip.open(backup,'rb')as f:
 for block in iter(lambda:f.read(1024*1024),b''):b.update(block)
assert a.digest()==b.digest();p.unlink();print(json.dumps({'migrated':count,'sqlite_bytes':(W/'content-facts.sqlite').stat().st_size,'legacy_snapshot':backup.name}),flush=True)
