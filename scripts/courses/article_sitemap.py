"""A root-level sitemap for reviewed course articles, independent of Next ISR."""
import json,re,os
from pathlib import Path
from datetime import date
from xml.sax.saxutils import escape

def build(root,out):
    data=root/'data/courses';today=date.today().isoformat();registry=data/'article-sitemap.json'
    briefs=[g for name in ['blog-guides','school-blog-guides','exam-blog-guides','brand-blog-guides'] for g in json.loads((data/(name+'.json')).read_text())]
    allowed={g['slug'] for g in briefs}|{'luchshie-kursy-dlya-detej','luchshie-kursy-po-predmetam-i-klassam','obzory-onlayn-shkol-dlya-detej'}
    if (root/'content/blog/index.json').exists():
        posts={p['slug']:p for p in json.loads((root/'content/blog/index.json').read_text())}
        assert allowed.issubset(posts),'A reviewed article is missing from the blog manifest'
        rows=[dict(slug=s,lastmod=min(today,max(posts[s]['publishedAt'][:10],max([g.get('reviewedAt','') for g in briefs if g['slug']==s] or [''])))) for s in sorted(allowed)]
        registry.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
    else:rows=json.loads(registry.read_text()) # Isolated price cron has no blog directory.
    assert {r['slug'] for r in rows}==allowed,'Sitemap registry and reviewed guides differ'
    for r in rows:
        assert re.fullmatch('[a-z0-9-]+',r['slug']) and re.fullmatch(r'\d{4}-\d{2}-\d{2}',r['lastmod'])
    xml='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>https://pro-schools.ru/blog/'+escape(r['slug'])+'/</loc><lastmod>'+r['lastmod']+'</lastmod></url>' for r in rows)+'</urlset>'
    out.mkdir(parents=True,exist_ok=True);target=out/'articles-sitemap.xml';temp=target.with_suffix('.tmp');temp.write_text(xml);os.replace(temp,target)
    return len(rows)

if __name__=='__main__':
    root=Path(__file__).resolve().parents[2]
    print('Reviewed article sitemap:',build(root,root/'public/kursy'))
