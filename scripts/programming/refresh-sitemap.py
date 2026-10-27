"""Merge the current native sitemap with the reviewed programming release.

Called by publication hooks, so newer blog/exam content is never replaced by a
historical sitemap snapshot. Reads Next directly on the VPS to avoid recursion.
"""
from pathlib import Path
import argparse,json,urllib.request,xml.etree.ElementTree as ET
from datetime import date
NS='http://www.sitemaps.org/schemas/sitemap/0.9';BASE='https://pro-schools.ru'
ET.register_namespace('',NS)
def merge(source,manifest):
 root=ET.fromstring(source);seen=set();result=ET.Element('{'+NS+'}urlset')
 for item in root:
  loc=item.find('{'+NS+'}loc')
  if loc is None or not loc.text:continue
  url=loc.text;path=url.removeprefix(BASE)
  if '/programmirovanie/' in path:continue
  if url in seen:continue
  seen.add(url);result.append(item)
 for path in manifest['indexable']:
  url=BASE+path
  if url in seen:continue
  node=ET.SubElement(result,'{'+NS+'}url');ET.SubElement(node,'{'+NS+'}loc').text=url
  seen.add(url)
 return ET.tostring(result,encoding='utf-8',xml_declaration=True),len(seen)
def overlay_blog(source, posts):
 # A native metadata route can still serve its previous ISR response immediately
 # after content publication. Overlay only known blog URLs from runtime metadata.
 root=ET.fromstring(source)
 by_url={item.findtext('{'+NS+'}loc'):item for item in root}
 today=date.today().isoformat()
 for post in posts:
  url=BASE+'/blog/'+post['slug']+'/'
  node=by_url.get(url)
  if node is None:
   node=ET.SubElement(root,'{'+NS+'}url')
   ET.SubElement(node,'{'+NS+'}loc').text=url
   by_url[url]=node
  stamp=post.get('updatedAt') or post.get('publishedAt')
  if stamp:
   last=node.find('{'+NS+'}lastmod')
   if last is None:last=ET.SubElement(node,'{'+NS+'}lastmod')
   last.text=min(stamp[:10],today)
 return ET.tostring(root,encoding='utf-8',xml_declaration=True)
def main():
 p=argparse.ArgumentParser();p.add_argument('--release',default='/var/www/school-portal/programming-current');p.add_argument('--source');p.add_argument('--blog-manifest');args=p.parse_args()
 release=Path(args.release)
 if not (release/'_programming/manifest.json').exists():return
 if args.source:source=Path(args.source).read_bytes()
 else:
  with urllib.request.urlopen('http://127.0.0.1:3001/sitemap.xml',timeout=90) as r:source=r.read()
 blog=Path(args.blog_manifest) if args.blog_manifest else Path(__file__).resolve().parents[2]/'content/blog/index.json'
 if blog.exists():source=overlay_blog(source,json.loads(blog.read_text()))
 manifest=json.loads((release/'_programming/manifest.json').read_text())
 content=release/'_programming/content-paths.json'
 if content.exists():manifest['indexable']+=json.loads(content.read_text())
 content,n=merge(source,manifest)
 # Keep a non-trivial sitemap. An unexpected upstream error must not erase it.
 if n<1000:raise RuntimeError('Unexpectedly small upstream sitemap')
 tmp=release/'sitemap.xml.tmp';tmp.write_bytes(content);tmp.replace(release/'sitemap.xml')
 print('Programming sitemap merged:',n,'URLs')
if __name__=='__main__':main()
