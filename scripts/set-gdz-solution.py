#!/usr/bin/env python3
"""Обновляет решения задач книги по (slug, klass, subjectSlug, number).
Тонкая обёртка над gdz_lib.set_solutions — хранилище теперь per-book
(src/data/gdz-books/*.json + index.json).

  from set_gdz_solution import apply_solutions
  apply_solutions('vilenkin', 6, {'1.5': {'steps': [...], 'answer': '...'}}, subject='matematika')
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from gdz_lib import set_solutions, gdz_index_lookup  # noqa: E402


def apply_solutions(slug, klass, sols, subject=None):
    if subject is None:
        subject = gdz_index_lookup(klass, slug)
    return set_solutions(klass, subject, slug, sols)
