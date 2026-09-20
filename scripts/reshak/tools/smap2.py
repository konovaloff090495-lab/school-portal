import sys,glob
from PIL import Image
d,pref=sys.argv[1],sys.argv[2]; nums=sys.argv[3:]
ims=[]
for n in nums:
    for f in sorted(glob.glob(f'{d}/{pref}_{n}_*.png')):
        im=Image.open(f); w,h=im.size
        if w>760: h=int(h*760/w)
        ims.append((n,h+22))
k=0;cur=[];h=0
for n,hh in ims:
    if h+hh>1900 and cur: print(f's{k}:',' '.join(cur)); k+=1; cur=[]; h=0
    if n not in cur: cur.append(n)
    h+=hh+8
print(f's{k}:',' '.join(cur))
