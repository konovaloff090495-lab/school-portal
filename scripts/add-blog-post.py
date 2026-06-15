#!/usr/bin/env python3
"""Добавляет статью в blogPosts (src/data/blog.ts) перед закрывающей ] массива.
Вызов: add_post(dict с полями BlogPost). content — HTML-строка."""
import re
from pathlib import Path

BLOG = Path(__file__).parent.parent / 'src/data/blog.ts'


def _esc(s):
    return s.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')


def add_post(p):
    src = BLOG.read_text(encoding='utf-8')
    # закрывающая ] массива blogPosts перед "export function getPostBySlug"
    anchor = '\nexport function getPostBySlug'
    idx = src.index(anchor)
    close = src.rfind(']', 0, idx)
    tags = ', '.join("'" + t.replace("'", "\\'") + "'" for t in p['tags'])
    img = p.get('imageUrl')
    img_line = f"    imageUrl: '{img}',\n" if img else ''
    block = (
        "  {\n"
        f"    slug: '{p['slug']}',\n"
        f"    title: `{_esc(p['title'])}`,\n"
        f"    excerpt: `{_esc(p['excerpt'])}`,\n"
        f"    category: '{p['category']}',\n"
        f"    tags: [{tags}],\n"
        f"    author: '{p.get('author','Редакция pro-schools.ru')}',\n"
        f"    authorRole: '{p.get('authorRole','Аналитический отдел')}',\n"
        f"    publishedAt: '{p['publishedAt']}',\n"
        f"    readTime: {p.get('readTime',9)},\n"
        f"    imageAlt: `{_esc(p.get('imageAlt',''))}`,\n"
        f"{img_line}"
        f"    content: `{_esc(p['content'])}`,\n"
        "  },\n"
    )
    new = src[:close] + block + src[close:]
    BLOG.write_text(new, encoding='utf-8')
    print(f"добавлена статья: {p['slug']}")
