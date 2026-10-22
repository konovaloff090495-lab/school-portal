#!/usr/bin/env python3
"""Check all published article covers, body images and manifest consistency."""
import json
from html.parser import HTMLParser
from pathlib import Path
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[2]


class Images(HTMLParser):
    def __init__(self):
        super().__init__()
        self.images = []
        self.stack = []
        self.invalid = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'figure' and any(t in self.stack for t in ('p', 'table', 'ul', 'ol', 'h2', 'h3')):
            self.invalid.append('figure nested inside text/list/table')
        if tag == 'img':
            self.images.append(attrs)
        if tag not in ('img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'wbr', 'col', 'embed', 'area'):
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag in self.stack:
            pos = len(self.stack) - 1 - self.stack[::-1].index(tag)
            del self.stack[pos:]


def main():
    posts = json.loads((ROOT / 'content/blog/index.json').read_text())
    problems = []
    files = set()
    inline_count = 0
    for meta in posts:
        slug = meta['slug']
        post = json.loads((ROOT / f'content/blog/{slug}.json').read_text())
        if not post.get('imageUrl') or not post.get('imageAlt', '').strip():
            problems.append(f'{slug}: missing cover/alt')
        for key in ('imageUrl', 'imageAlt'):
            if meta.get(key) != post.get(key):
                problems.append(f'{slug}: manifest {key} mismatch')
        parser = Images()
        parser.feed(post['content'])
        if not parser.images:
            problems.append(f'{slug}: no inline images')
        inline_count += len(parser.images)
        problems += [f'{slug}: {error}' for error in parser.invalid]
        refs = [post.get('imageUrl', '')] + [im.get('src', '') for im in parser.images]
        for im in parser.images:
            if not im.get('alt', '').strip():
                problems.append(f'{slug}: missing inline alt')
        for ref in refs:
            if not ref:
                problems.append(f'{slug}: empty image src')
                continue
            if ref.startswith('/'):
                file = ROOT / 'public' / unquote(urlsplit(ref).path).lstrip('/')
                if not file.is_file() or file.stat().st_size == 0:
                    problems.append(f'{slug}: missing image {ref}')
                files.add(ref)
    print(json.dumps(dict(posts=len(posts), inlineImages=inline_count, localFiles=len(files),
                          errors=problems), ensure_ascii=False, indent=2))
    return bool(problems)


if __name__ == '__main__':
    sys.exit(main())
