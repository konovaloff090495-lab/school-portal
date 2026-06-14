#!/usr/bin/env python3
"""
Хелпер для добавления контента в Учебник.
Импортируется и вызывается: add_subject_klass(subject, klass, topics, articles)
  topics:   [(slug, title, excerpt), ...]
  articles: {slug: html_content, ...}
Вставляет темы в src/data/textbook.ts (RAW_TOPICS) и статьи в
src/data/textbook-articles.ts (перед закрывающей ] массива).
"""
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
TB = ROOT / 'src/data/textbook.ts'
ART = ROOT / 'src/data/textbook-articles.ts'
DATE = '2026-06-14'


def add_topics(subject, klass, topics):
    src = TB.read_text(encoding='utf-8').split('\n')
    # находим блок предмета в RAW_TOPICS
    subj_i = None
    for i, l in enumerate(src):
        if re.match(rf'\s+{re.escape(subject)}:\s*\{{', l):
            subj_i = i
            break
    if subj_i is None:
        raise SystemExit(f'предмет {subject} не найден в RAW_TOPICS')
    # ищем конец блока предмета ("  }," на том же отступе)
    indent = len(src[subj_i]) - len(src[subj_i].lstrip())
    end_i = None
    for j in range(subj_i + 1, len(src)):
        if re.match(rf'^\s{{{indent}}}\}},?\s*$', src[j]):
            end_i = j
            break
    # формируем блок класса
    lines = [f'    {klass}: [']
    for slug, title, excerpt in topics:
        t = title.replace("'", "\\'")
        e = excerpt.replace("'", "\\'")
        lines.append(f"      {{ slug: '{slug}', title: '{t}', excerpt: '{e}' }},")
    lines.append('    ],')
    # вставляем перед концом блока предмета
    src = src[:end_i] + lines + src[end_i:]
    TB.write_text('\n'.join(src), encoding='utf-8')


def add_articles(subject, klass, articles):
    content = ART.read_text(encoding='utf-8').split('\n')
    close = next(i for i, l in enumerate(content) if l.strip() == ']')
    blocks = []
    for slug, html in articles.items():
        h = html.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
        blocks.append(
            "  {\n"
            f"    subject: '{subject}',\n"
            f"    klass: {klass},\n"
            f"    topicSlug: '{slug}',\n"
            f"    publishedAt: '{DATE}',\n"
            f"    content: `{h}`,\n"
            "  },"
        )
    inject = '\n'.join(blocks).split('\n')
    content = content[:close] + inject + content[close:]
    ART.write_text('\n'.join(content), encoding='utf-8')


def add_subject_klass(subject, klass, topics, articles):
    add_topics(subject, klass, topics)
    add_articles(subject, klass, articles)
    print(f'{subject} {klass}кл: +{len(topics)} тем, +{len(articles)} статей')
