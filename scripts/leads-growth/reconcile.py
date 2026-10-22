#!/usr/bin/env python3
"""Join a private site journal to a CRM CSV by lead ID; export no contacts or comments."""
import argparse
import csv
import json
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlsplit

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--journal', required=True, type=Path)
parser.add_argument('--crm-csv', required=True, type=Path)
parser.add_argument('--output', required=True, type=Path)
args = parser.parse_args()
with args.crm_csv.open(encoding='utf-8-sig', newline='') as f:
    sample = f.read(4096)
    f.seek(0)
    dialect = csv.Sniffer().sniff(sample, delimiters=',;\t')
    rows = list(csv.DictReader(f, dialect=dialect))
if not rows:
    raise SystemExit('CRM CSV is empty; no report was written')
id_key = next((key for key in ['id_lead', 'Распределение', 'ID лида'] if key in rows[0]), None)
status_key = next((key for key in ['Статус лида', 'Статус', 'status'] if key in rows[0]), None)
if not id_key or not status_key:
    raise SystemExit('Expected a lead ID and status column; no report was written')
crm = {}
for row in rows:
    key = str(row[id_key]).strip()
    if key in crm and crm[key] != row[status_key]:
        raise SystemExit('Conflicting CRM statuses for one ID; resolve duplicates first')
    crm[key] = row[status_key]
seen, groups = set(), defaultdict(lambda: {'accepted': 0, 'matched': 0, 'deals': 0})
for number, line in enumerate(args.journal.read_text().splitlines(), 1):
    try:
        entry = json.loads(line)
    except ValueError:
        raise SystemExit(f'Invalid journal JSON at line {number}; no report was written')
    receipt = entry.get('crm') or {}
    lead_id = str(receipt.get('id') or '')
    if receipt.get('status') != 'accepted' or not lead_id or lead_id in seen:
        continue
    seen.add(lead_id)
    parsed = urlsplit(entry.get('page_url') or '')
    path = parsed.path if parsed.hostname in ['pro-schools.ru', 'www.pro-schools.ru'] else '(URL missing)'
    group = groups[path]
    group['accepted'] += 1
    group['matched'] += lead_id in crm
    group['deals'] += crm.get(lead_id) == 'Сделка создана'
args.output.parent.mkdir(parents=True, exist_ok=True)
with args.output.open('w', encoding='utf-8-sig', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['Страница отправки', 'Принято CRM', 'Найдено в CSV CRM', 'Сделки', 'CR среди сопоставленных'])
    for path, group in sorted(groups.items(), key=lambda item: -item[1]['deals']):
        writer.writerow([path, group['accepted'], group['matched'], group['deals'], group['deals'] / group['matched'] if group['matched'] else ''])
print(f'Report written: {len(seen)} distinct accepted CRM IDs; {sum(g["matched"] for g in groups.values())} matched. Missing statuses are not treated as refusals.')
