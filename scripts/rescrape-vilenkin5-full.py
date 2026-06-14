#!/usr/bin/env python3
"""
Перепарсер ПОЛНЫХ условий Виленкин 5 из блока text_zad reshak.ru.
Даёт чистый полный текст условия (одно издание, со своим номером).
Сохраняет в scripts/gdz-conditions/vilenkin-5-full.json
"""
import requests, json, time, re, warnings
from pathlib import Path
from bs4 import BeautifulSoup

warnings.filterwarnings('ignore')

HEADERS = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'}
OUT = Path(__file__).parent / 'gdz-conditions' / 'vilenkin-5-full.json'
URL = lambda n: f'https://reshak.ru/otvet/reshebniki.php?otvet=part1/{n}&predmet=vilenkin5n'

PREFIX_RE = re.compile(r'^.*?(?:Просвещение|Мнемозина|Дрофа|Вентана-Граф|Бином)\s*:\s*', re.DOTALL)
SUFFIX_RE = re.compile(r'\*Цитир.*$|Совет дня.*$', re.DOTALL)

def fetch(n, session):
    for _ in range(2):
        try:
            r = session.get(URL(n), timeout=12, verify=False)
            if r.status_code != 200:
                return None
            html = r.content.decode('utf-8', errors='replace')
            soup = BeautifulSoup(html, 'html.parser')
            d = soup.find('div', class_='text_zad')
            if not d:
                return None
            txt = d.get_text(' ', strip=True)
            txt = PREFIX_RE.sub('', txt)
            txt = SUFFIX_RE.sub('', txt)
            txt = re.sub(r'\s+', ' ', txt).strip()
            # обрезаем хвост-метаданные (одиночные числа/слаги в конце)
            txt = re.sub(r'\s+vilenkin\w*\s*\d*\s*\d*\s*$', '', txt, flags=re.I)
            return txt if len(txt) > 5 else None
        except Exception:
            time.sleep(1)
    return None

def main():
    existing = {}
    if OUT.exists():
        existing = {str(p['number']): p for p in json.loads(OUT.read_text(encoding='utf-8'))}
    session = requests.Session(); session.headers.update(HEADERS)
    results = dict(existing)
    todo = [n for n in range(1, 549) if str(n) not in existing]
    print(f'[vilenkin-5-full] парсим {len(todo)} задач...')
    ok = 0
    for i, n in enumerate(todo):
        cond = fetch(n, session)
        if cond:
            results[str(n)] = {'number': str(n), 'condition': cond}
            ok += 1
        if (i+1) % 50 == 0:
            OUT.write_text(json.dumps(sorted(results.values(), key=lambda p:int(p['number'])), ensure_ascii=False, indent=2), encoding='utf-8')
            print(f'  {i+1}/{len(todo)}: {ok} ок')
        time.sleep(0.4)
    OUT.write_text(json.dumps(sorted(results.values(), key=lambda p:int(p['number'])), ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'[vilenkin-5-full] ГОТОВО: {len(results)} условий')

if __name__ == '__main__':
    main()
