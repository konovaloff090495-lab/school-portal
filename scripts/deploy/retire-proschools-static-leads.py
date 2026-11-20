"""Remove archived capture UI from the live ProSchools static exam and lesson pages."""
from pathlib import Path
from shutil import copy2
from tempfile import NamedTemporaryFile
import os
import re

BASE = Path('/srv/portfolio/proschools/static')
BACKUP = Path('/var/backups/portfolio/proschools-information-20261120/static')

def replace_file(path, updated):
    old = path.read_text()
    if old == updated:
        return False
    backup = BACKUP / path.relative_to(BASE)
    backup.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    if not backup.exists():
        copy2(path, backup)
    with NamedTemporaryFile(mode='w', encoding='utf-8', dir=path.parent, delete=False) as staged:
        staged.write(updated)
        temp = Path(staged.name)
    metadata = path.stat()
    os.chown(temp, metadata.st_uid, metadata.st_gid)
    temp.chmod(metadata.st_mode & 0o777)
    temp.replace(path)
    return True

def exam_pages():
    root = BASE / 'exam-prep/current'
    count = 0
    for path, pdf, kind in (
        ('itogovoe-sochinenie-2026', 'itogovoe-sochinenie-2026.pdf', 'essay'),
        ('itogovoe-sobesedovanie', 'itogovoe-sobesedovanie-2026-2027.pdf', 'oral'),
    ):
        url = '/exam-prep/downloads/' + pdf
        assert (root / url.lstrip('/')).is_file()
        landing = root / 'metodichki' / path / 'index.html'
        html = landing.read_text()
        if 'data-methodic-form' in html:
            panel = (
                '<aside class="form-panel course-form" id="form"><h2>Мини-курс в PDF</h2>'
                '<p>Скачайте пособие и занимайтесь в своём темпе.</p>'
                f'<a class="button course-cta" href="{url}" data-pdf-download="{kind}" download>Скачать PDF</a></aside>'
            )
            html, n = re.subn(r'<aside\b[^>]*\bid="form"[^>]*>.*?</aside>', panel, html, flags=re.S)
            assert n == 1 and 'data-methodic-form' not in html
            html = html.replace('href="#form"', f'href="{url}" download')
            html = re.sub(r'Получить мини-курс(?: бесплатно| · 0 ₽)?', 'Скачать мини-курс', html)
            count += replace_file(landing, html)
        result = landing.parent / 'spasibo/index.html'
        html = result.read_text()
        if 'data-trial-form' in html:
            html, n = re.subn(r'<section\b[^>]*\bid="next-step"[^>]*>.*?</section>', '', html, flags=re.S)
            assert n == 1 and 'data-trial-form' not in html
            html = re.sub(r'<a\b[^>]*href="#next-step"[^>]*>.*?</a>', '', html, flags=re.S)
            count += replace_file(result, html)
    return count

def lesson_pages():
    root = BASE / 'free-lessons-current/besplatnye-uroki'
    count = 0
    for path in root.rglob('index.html'):
        html = path.read_text()
        html = re.sub(r'<button\b[^>]*\bdata-lektoriy(?:="[^"]*")?[^>]*>.*?</button>', '', html, flags=re.S)
        html = re.sub(r'<script\b[^>]*\bsrc="/besplatnye-uroki/assets/lead-form\.js[^"]*"[^>]*>\s*</script>', '', html)
        count += replace_file(path, html)
    return count

if __name__ == '__main__':
    print(f'Updated exam pages: {exam_pages()}, free lesson pages: {lesson_pages()}')
