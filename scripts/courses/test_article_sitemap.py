import json,tempfile,unittest
from pathlib import Path
from article_sitemap import build

class ArticleSitemapTests(unittest.TestCase):
    def test_runtime_can_rebuild_verified_registry_without_blog(self):
        with tempfile.TemporaryDirectory() as d:
            r=Path(d);p=r/'data/courses';p.mkdir(parents=True)
            for n in ['blog-guides','school-blog-guides','exam-blog-guides','brand-blog-guides']:(p/(n+'.json')).write_text('[]')
            slugs=['luchshie-kursy-dlya-detej','luchshie-kursy-po-predmetam-i-klassam','obzory-onlayn-shkol-dlya-detej']
            (p/'article-sitemap.json').write_text(json.dumps([dict(slug=s,lastmod='2026-10-19') for s in slugs]))
            self.assertEqual(build(r,r/'out'),3)
            self.assertIn('/blog/obzory-onlayn-shkol-dlya-detej/',(r/'out/articles-sitemap.xml').read_text())
            (p/'blog-guides.json').write_text(json.dumps([{'slug':'new-review'}]))
            with self.assertRaises(AssertionError):build(r,r/'out')
    def test_missing_manifest_article_cannot_silently_disappear(self):
        with tempfile.TemporaryDirectory() as d:
            r=Path(d);p=r/'data/courses';p.mkdir(parents=True)
            for n in ['blog-guides','school-blog-guides','exam-blog-guides','brand-blog-guides']:(p/(n+'.json')).write_text('[]')
            b=r/'content/blog';b.mkdir(parents=True);(b/'index.json').write_text('[]')
            with self.assertRaises(AssertionError):build(r,r/'out')
