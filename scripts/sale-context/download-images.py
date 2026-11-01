import json,subprocess,concurrent.futures
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];folder=ROOT/'public/sale-context/images';folder.mkdir(exist_ok=True)
offers=json.loads((ROOT/'public/sale-context/offers.json').read_text())['offers']
def download(o):
 p=folder/(o['id']+'.webp')
 if p.exists():return p.stat().st_size
 b=subprocess.check_output(['curl','--interface','en0','--retry','3','--max-time','30','-fsSL','https://school-university.com/sale/'+o['image']])
 assert b[:4]==b'RIFF' and b[8:12]==b'WEBP',o['id']
 p.write_bytes(b);return len(b)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 sizes=list(pool.map(download,offers))
print('Downloaded',len(sizes),'partner images;',round(sum(sizes)/1024/1024,2),'MiB')
