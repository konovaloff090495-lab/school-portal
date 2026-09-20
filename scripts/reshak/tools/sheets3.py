# sheets3.py <urlprefix> <outdir> <prefix> N N ... -> fetches N.png, N-.png, N--.png ... ; stitches sheets <prefix>_sK.png
import sys, os, subprocess
from PIL import Image, ImageDraw
url, outdir, pref = sys.argv[1], sys.argv[2], sys.argv[3]
nums = sys.argv[4:]
os.makedirs(outdir, exist_ok=True)
ims=[]
for n in nums:
    for j in range(4):
        suf='-'*j
        f=os.path.join(outdir, f'{pref}_{n}_{j}.png')
        if not os.path.exists(f) or os.path.getsize(f)<500:
            subprocess.run(['curl','-s','-A','Mozilla/5.0','-o',f,f'{url}/{n}{suf}.png'])
        try: im=Image.open(f).convert('RGB')
        except Exception:
            if j==0: print('MISSING',n)
            try: os.remove(f)
            except: pass
            break
        if im.width>760: im=im.resize((760,int(im.height*760/im.width)))
        lab=Image.new('RGB',(im.width,22),'white'); ImageDraw.Draw(lab).text((4,4),f'#{n}'+(f' ({j})' if j else ''),fill='red')
        full=Image.new('RGB',(im.width,im.height+22),'white'); full.paste(lab,(0,0)); full.paste(im,(0,22))
        ims.append(full)
sheets=[]; cur=[]; h=0
for im in ims:
    if h+im.height>1900 and cur:
        sheets.append(cur); cur=[]; h=0
    cur.append(im); h+=im.height+8
if cur: sheets.append(cur)
for k,sh in enumerate(sheets):
    W=max(i.width for i in sh); H=sum(i.height+8 for i in sh)
    out=Image.new('RGB',(W,H),'white'); y=0
    for i in sh: out.paste(i,(0,y)); y+=i.height+8
    p=os.path.join(outdir,f'{pref}_s{k}.png'); out.save(p); print(p,len(sh))
