"""Original code-native editorial illustrations, rendered on the VPS without AI/API keys.
No donor image downloads or SVG from untrusted sources. Immutable files + visual fingerprints.
"""
import hashlib,html,io,json,math,random
from pathlib import Path
from update import write
VERSION=1
PALETTES=[('#102e37','#82d3bf','#efbe71'),('#251e46','#ab99f0','#f3c787'),('#4c261c','#ed9b6f','#f9d9a6'),('#19382d','#a6c49b','#e7c278'),('#272d4c','#8fb8d6','#edba87'),('#4c2333','#e0a3b8','#f1cc9d')]
def fingerprint(image):
 from PIL import Image
 im=image.convert('L').resize((9,8),Image.Resampling.LANCZOS);p=list(im.get_flattened_data() if hasattr(im,'get_flattened_data') else im.getdata());return sum((p[y*9+x]>p[y*9+x+1])<<(y*8+x) for y in range(8) for x in range(8))
def distance(a,b):return (a^b).bit_count()
def svg_scene(e,topic_name,attempt=0):
 seed=hashlib.sha256((e['id']+'|'+e['title']+'|'+str(attempt)).encode()).hexdigest();r=random.Random(seed);bg,a,b=r.choice(PALETTES);out=[]
 def add(s):out.append(s)
 def text(x,y,t,size=30,fill=None,extra=''):add(f'<text x="{x}" y="{y}" font-family="DejaVu Sans,sans-serif" font-size="{size}" fill="{fill or b}" {extra}>{html.escape(str(t))}</text>')
 def line(x1,y1,x2,y2,col=None,w=3,extra=''):add(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{col or b}" stroke-width="{w}" {extra}/>')
 def ball(x,y,s=35,fill='url(#orb)'):add(f'<circle cx="{x}" cy="{y}" r="{s}" fill="{fill}"/>')
 add(f'<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="960" viewBox="0 0 1440 960"><defs><radialGradient id="bg"><stop stop-color="{a}" stop-opacity=".25"/><stop offset="1" stop-color="{bg}"/></radialGradient><radialGradient id="orb" cx=".28" cy=".2" r=".85"><stop stop-color="#fff3da"/><stop offset=".35" stop-color="{b}"/><stop offset=".8" stop-color="#8d6845"/><stop offset="1" stop-color="{bg}"/></radialGradient><linearGradient id="metal" x2="1" y2="1"><stop stop-color="#fff2d0"/><stop offset=".4" stop-color="{b}"/><stop offset="1" stop-color="#92623c"/></linearGradient><linearGradient id="glass" x2="1" y2="1"><stop stop-color="{a}" stop-opacity=".85"/><stop offset="1" stop-color="{a}" stop-opacity=".08"/></linearGradient></defs><rect width="1440" height="960" fill="{bg}"/><ellipse cx="{r.randint(500,1000)}" cy="400" rx="850" ry="680" fill="url(#bg)"/>')
 # Quiet astronomical/paper-grain field, individually seeded, not a reused background image.
 for _ in range(240):
  x,y=r.randrange(1440),r.randrange(960);add(f'<circle cx="{x}" cy="{y}" r="{r.choice([.5,.8,1.2])}" fill="#fff5de" opacity="{r.uniform(.05,.25):.2f}"/>')
 add('<ellipse cx="820" cy="797" rx="425" ry="57" fill="#000" opacity=".2"/>')
 topic=e['topics'][0];words=(e['title']+' '+e.get('verification',{}).get('catalogueTitle','')).lower();angle=r.randint(-12,12);cx=r.randint(670,870);cy=r.randint(430,490);scale=r.uniform(.88,1.05)
 add(f'<g transform="translate({cx} {cy}) rotate({angle}) scale({scale})">')
 if topic=='fizika':
  if any(w in words for w in ['волн','колеб','механик','статика']):
   # A physical wave built from individual brass spheres, and suspended pendulums.
   phase=r.random()*math.tau;freq=r.uniform(1.4,2.3)
   for i in range(31):
    x=-420+i*28;y=math.sin(i/30*math.tau*freq+phase)*140
    line(x,220,x,y,a,2,extra='opacity=".42"');ball(x,y,13+r.randrange(7))
   for i in range(4):
    x=-220+i*135;y=-180+r.randrange(90);line(x,-310,x+55,y,b,4);ball(x+55,y,30)
   line(-300,-315,300,-315,b,12);text(-140,300,'F = ma',58)
  else:
   add('<ellipse cx="0" cy="0" rx="350" ry="160" fill="none" stroke="url(#metal)" stroke-width="15" transform="rotate(-28)"/>');ball(0,0,125)
   for i in range(5):
    t=i*math.tau/5+r.random();ball(math.cos(t)*340,math.sin(t)*145,28)
   text(-180,290,'E = mc²',66)
 elif topic in ['informatika','programmirovanie','python','neyroseti']:
  if any(w in words for w in ['таблиц','ворд','word','excel']):
   # A spreadsheet and a document are different objects from a coding lesson.
   add(f'<rect x="-360" y="-240" width="440" height="500" rx="22" fill="url(#glass)" stroke="{a}" stroke-width="3" transform="rotate(-10)"/>')
   for i in range(6):line(-310,-150+i*62,30,-150+i*62,a,2)
   for i in range(5):line(-310+i*85,-150,-310+i*85,160,a,2)
   for i in range(8):
    x=-280+(i%4)*85;y=-110+(i//4)*120;text(x,y,r.randint(1,99),24,b)
   add('<rect x="20" y="-130" width="300" height="400" rx="18" fill="url(#metal)" transform="rotate(12)"/>')
   for i in range(7):line(65,-55+i*38,260 if i%2 else 220,-55+i*38,bg,7)
   text(150,-190,'Aa',74)
  elif any(w in words for w in ['алгоритм','множест','информаци','логик']):
   # A spatial algorithm tree with set diagrams and binary weights.
   nodes=[(-310,-150),(0,-250),(280,-60),(-180,170),(140,220)]
   edges=[(0,1),(1,2),(0,3),(3,4),(2,4)]
   for u,v in edges:line(*nodes[u],*nodes[v],a,6)
   for i,(x,y) in enumerate(nodes):
    add(f'<rect x="{x-65}" y="{y-45}" width="130" height="90" rx="20" fill="url(#glass)" stroke="url(#metal)" stroke-width="4"/>');text(x-29,y+15,['01','x','&','∨','10'][i],38)
   add(f'<circle cx="-30" cy="30" r="120" fill="{a}" opacity=".1" stroke="{a}" stroke-width="3"/><circle cx="80" cy="30" r="120" fill="{b}" opacity=".15" stroke="{b}" stroke-width="3"/>');text(-175,340,'АЛГОРИТМЫ',36)
  else:
   n=r.randint(4,6)
   for i in range(n):
    x=-360+i*140;y=r.randint(-210,150);line(x,y,x+100,y,a,5);line(x+100,y,x+100,y+100,a,4)
    add(f'<rect x="{x-42}" y="{y-40}" width="84" height="80" rx="16" fill="url(#glass)" stroke="{a}" stroke-width="2"/>');text(x-25,y+14,r.choice(['0','1','&','∨','{}']),36)
   add('<rect x="-225" y="-40" width="450" height="260" rx="30" fill="#111b2b" stroke="url(#metal)" stroke-width="9" transform="rotate(-8)"/>')
   for i in range(5):
    width=r.randint(70,260);add(f'<rect x="-175" y="{i*36}" width="{width}" height="9" rx="4" fill="{a if i%2 else b}" opacity=".85"/>')
   text(240,210,'{ }',100)
 elif topic=='himiya':
  pts=[(r.randint(-300,300),r.randint(-210,200),r.randint(25,55)) for _ in range(12)]
  for i,(x,y,s) in enumerate(pts):
   if i:line(x,y,pts[i-1][0],pts[i-1][1],a,12)
  for x,y,s in pts:ball(x,y,s)
  text(-290,310,'e⁻ →',62);add(f'<path d="M230 -300V-150L330 60Q355 110 290 110H150Q100 110 125 60L220 -150V-300" fill="url(#glass)" stroke="{a}" stroke-width="4"/>')
 elif topic=='matematika':
  # A sculptural geometry proof, personalised by coordinates and formula.
  if any(w in words for w in ['дроб','уравнен','алгебр']):
   add('<path d="M-300 -170L50 -270L340 -90L-10 15Z" fill="url(#metal)"/><path d="M-300 -170V170L-10 350V15Z" fill="url(#glass)"/><path d="M-10 15L340 -90V180L-10 350Z" fill="#0e2630" stroke="url(#metal)" stroke-width="3"/>');text(-200,-40,'x + y',65);line(-220,0,-30,0,b,4);text(-165,85,'2',65)
  else:
   points=[(-330,210),(r.randint(-120,160),-270),(340,210)]
   add('<polygon points="'+' '.join(f'{x},{y}' for x,y in points)+'" fill="url(#glass)" stroke="url(#metal)" stroke-width="8"/>')
   for x,y in points:ball(x,y,25)
   add(f'<circle cx="0" cy="50" r="{r.randint(130,180)}" fill="none" stroke="{a}" stroke-width="3"/>');text(-210,310,'a² + b² = c²',44)
 elif topic in ['russkiy-yazyk','literatura','chtenie','angliyskiy-yazyk','ispanskiy']:
  # A dimensional book; letter constellation changes for every publication.
  add('<path d="M0 -170Q-170 -260 -360 -170V180Q-160 110 0 245Q160 110 360 180V-170Q170 -260 0 -170Z" fill="url(#metal)"/><path d="M0 -160V235M-340 -150Q-170 -230 -20 -150M20 -150Q170 -230 340 -150" stroke="#fff0cc" stroke-width="4" fill="none"/>')
  for side in [-1,1]:
   for y in range(-90,150,37):add(f'<path d="M{side*35} {y}Q{side*170} {y-65} {side*315} {y-30}" fill="none" stroke="{bg}" stroke-width="3" opacity=".5"/>')
  for i,t in enumerate(r.sample(list('АБВГДЕЖЗИКЛМНОПРСТУФ'),6)):text(-350+i*130,r.randint(-360,-220),t,r.randint(45,85),a,extra=f'transform="rotate({r.randint(-18,18)})"')
 elif topic in ['istoriya','geografiya','obshchestvoznanie']:
  if 'карт' in words or topic=='geografiya':
   add(f'<path d="M-390 -220L-130 -270L130 -180L390 -230V230L130 280L-130 190L-390 240Z" fill="url(#metal)"/>')
   for _ in range(14):
    x,y=r.randint(-350,300),r.randint(-180,180);add(f'<path d="M{x} {y}q{r.randint(20,90)} -70 90 0t100 20" stroke="{bg}" opacity=".45" stroke-width="3" fill="none"/>')
   add(f'<circle cx="70" cy="0" r="130" fill="{bg}" stroke="{a}" stroke-width="8"/><path d="M70 -110L100 0L70 110L40 0Z" fill="url(#metal)"/>');text(50,-140,'N',32)
  else:
   for x,h in [(-260,210),(-80,290),(100,245),(280,350)]:
    add(f'<rect x="{x-42}" y="{-h}" width="84" height="{h+200}" rx="10" fill="url(#metal)"/><rect x="{x-68}" y="{-h-25}" width="136" height="34" rx="7" fill="{b}"/>')
   add('<rect x="-390" y="210" width="820" height="35" rx="9" fill="url(#metal)"/>');text(-260,335,'ВРЕМЯ · ИДЕИ',38)
 elif topic=='shahmaty':
  add('<path d="M-210 240L-170 120L-115 60L-140 -100L-70 -250L100 -280L190 -180L80 -100L60 30L160 120L210 240Z" fill="url(#metal)"/>');ball(75,-205,9,b)
 else:
  # Semantic orbital composition for new known disciplines, no reused bitmap.
  for j in range(5):
   add(f'<ellipse cx="0" cy="0" rx="{220+j*24}" ry="{85+j*12}" transform="rotate({j*37+angle})" fill="none" stroke="{a if j%2 else b}" stroke-width="{4+j}"/>')
  ball(0,0,105)
  for j in range(7):
   t=r.random()*math.tau;ball(math.cos(t)*310,math.sin(t)*220,r.randint(18,37))
 add('</g>')
 # Small editorial labels stay outside the region covered by the webpage title.
 text(62,88,'ОТКРЫВАЙ НОВОЕ',22,a,extra='letter-spacing="5"')
 text(62,145,topic_name.upper(),36,b,extra='font-weight="700" letter-spacing="2"')
 grade=' · '.join(map(str,e.get('grades',[])))
 if grade:text(62,194,grade+' КЛАСС',19,a,extra='letter-spacing="3"')
 add('</svg>');return ''.join(out),seed

def create_cover(e,topic_name,assets,state):
 import cairosvg
 from PIL import Image,ImageStat
 folder=assets/'besplatnye-uroki/assets/covers';folder.mkdir(parents=True,exist_ok=True);archive=state/'artwork';archive.mkdir(parents=True,exist_ok=True)
 manifest=archive/(e['id']+'.json');path=folder/(e['id']+'-art-v1.webp')
 if manifest.exists() and path.exists():
  old=json.loads(manifest.read_text())
  if old['sha256']==hashlib.sha256(path.read_bytes()).hexdigest() and old['title']==e['title']:return '/besplatnye-uroki/assets/covers/'+path.name
  raise ValueError('Immutable cover conflict')
 if path.exists():raise ValueError('Untracked immutable cover')
 previous=[int(json.loads(p.read_text())['fingerprint'],16) for p in archive.glob('*.json')]
 for attempt in range(12):
  svg,seed=svg_scene(e,topic_name,attempt);png=cairosvg.svg2png(bytestring=svg.encode(),output_width=1440,output_height=960);im=Image.open(io.BytesIO(png)).convert('RGB');fp=fingerprint(im)
  if any(distance(fp,old)<10 for old in previous):continue
  if max(ImageStat.Stat(im).stddev)<20:continue
  buf=io.BytesIO();im.save(buf,'WEBP',quality=88,method=5);data=buf.getvalue();sha=hashlib.sha256(data).hexdigest()
  if any(hashlib.sha256(p.read_bytes()).hexdigest()==sha for p in folder.glob('*.webp')):continue
  # Store reviewable source/provenance before any catalogue import. Retry reuses it.
  (archive/(e['id']+'.svg')).write_text(svg);write(manifest,{'version':VERSION,'id':e['id'],'title':e['title'],'method':'original-server-vector-art','seed':seed,'sha256':sha,'fingerprint':f'{fp:016x}','size':[1440,960],'cover':path.name})
  with path.open('xb') as f:f.write(data)
  path.chmod(0o644);return '/besplatnye-uroki/assets/covers/'+path.name
 raise ValueError('Cover too similar to previous art; kept pending')
