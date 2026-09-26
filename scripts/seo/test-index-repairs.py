"""Regression checks for FIPI subject inference and byte-identical PDF canonicals."""
import sys,json,hashlib,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'scripts/ege'))
from fetch_fipi import parse
class IndexRepairs(unittest.TestCase):
    def test_archive_label_overrides_previous_language(self):
        html='<h2>Испанский язык</h2><a href="https://doc.fipi.ru/oge/demoversii-specifikacii-kodifikatory/2017/eng_oge_2017.zip">Английский язык (вкл. устную часть)</a>'
        item=parse('oge','demo',html)[0]
        self.assertEqual(item['subject'],'angliiskiy-yazyk')
    def test_pdf_canonical_targets_are_exact_copies(self):
        mappings=json.loads((ROOT/'scripts/seo/pdf-canonicals.json').read_text())
        for source,target in mappings.items():
            with self.subTest(source=source):
                self.assertNotIn(target,mappings,'No canonical chains')
                self.assertEqual(hashlib.sha256((ROOT/'public'/source.lstrip('/')).read_bytes()).digest(),hashlib.sha256((ROOT/'public'/target.lstrip('/')).read_bytes()).digest())
    def test_language_documents_do_not_mix(self):
        docs=json.loads((ROOT/'src/data/exam/index.json').read_text())['docs']
        for language,filename in [('angliiskiy','yaa'),('nemetskiy','yan'),('frantsuzskiy','yaf'),('ispanskiy','yai')]:
            d=next(x for x in docs if x['id']==f'oge-demo-{language}-yazyk-2017')
            pdfs=[x['url'] for x in d['files'] if x['ext']=='pdf']
            self.assertEqual(len(pdfs),2)
            self.assertTrue(all(f'/{filename}-9-demo-2017-' in p for p in pdfs),pdfs)
            self.assertGreater(d['chars'],30000)
if __name__=='__main__':unittest.main()
