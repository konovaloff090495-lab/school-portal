# -*- coding: utf-8 -*-
"""Сборка статей блога pro-schools.ru с нативной интеграцией продуктов
school-university.com. Пишет content/blog/<slug>.json.

Ссылки на продукты строятся ТОЛЬКО через L() — так метка gerasimov_lav
и utm_content=<slug статьи> не теряются и разрез по статьям в Метрике
school-university.com остаётся честным.
"""
import io, json, os, re, datetime

ROOT = os.path.expanduser('~/claude/school-portal')
BLOG = os.path.join(ROOT, 'content/blog')

SU = 'https://school-university.com'
UTM = 'utm_source=gerasimov_lav&utm_medium=lkpartners&utm_campaign=proschools_blog'

_current_slug = {'v': ''}

def su_link(path, place='text'):
    """Партнёрский URL на посадочную school-university.com."""
    sep = '&'
    term = re.sub(r'[^a-z0-9]+', '-', path.strip('/').lower()) or 'home'
    q = f'{UTM}&utm_term={term}-{place}'
    if _current_slug['v']:
        q += f"&utm_content={_current_slug['v']}"
    return f'{SU}{path}?{q}'

def L(path, anchor, place='text'):
    """Инлайновая ссылка в тексте статьи."""
    return (f'<a href="{su_link(path, place)}" target="_blank" '
            f'rel="noopener sponsored">{anchor}</a>')

def wordcount(html):
    txt = re.sub(r'<[^>]+>', ' ', html)
    return len([w for w in txt.split() if w.strip()])

def write(post):
    """post: dict со слагом, заголовком и полем body (HTML)."""
    _current_slug['v'] = post['slug']
    body = post.pop('body')
    if callable(body):
        body = body()
    html = re.sub(r'\n\s*\n', '\n\n', body.strip())
    wc = wordcount(html)
    assert wc >= 900, f"{post['slug']}: всего {wc} слов — порог 900"
    assert len(post['title']) <= 78, f"{post['slug']}: title {len(post['title'])} симв."
    assert len(post['excerpt']) <= 220, f"{post['slug']}: excerpt {len(post['excerpt'])} симв."
    assert re.match(r'^[a-z0-9-]+$', post['slug']), post['slug']
    out = {
        'slug': post['slug'],
        'title': post['title'],
        'excerpt': post['excerpt'],
        'category': post['category'],
        'tags': post['tags'],
        'author': post.get('author', 'Редакция pro-schools.ru'),
        'authorRole': post.get('authorRole', 'Аналитический отдел'),
        'publishedAt': post.get('publishedAt', datetime.date.today().isoformat()),
        'readTime': max(5, round(wc / 170)),
        'imageAlt': post['imageAlt'],
        'content': '\n' + html + '\n',
    }
    if post.get('suProduct'):
        out['suProduct'] = post['suProduct']
    if post.get('suPath'):
        out['suPath'] = post['suPath']
    path = os.path.join(BLOG, out['slug'] + '.json')
    exists = os.path.exists(path)
    io.open(path, 'w', encoding='utf-8').write(json.dumps(out, ensure_ascii=False, indent=2) + '\n')
    print(f"{'обновлена' if exists else 'создана  '} {out['slug']:55} {wc:5} слов")
    _current_slug['v'] = ''
    return out['slug']

FAQ_OPEN = '<h2>Частые вопросы</h2>'
