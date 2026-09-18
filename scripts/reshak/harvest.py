#!/usr/bin/env python3
"""
Сборщик reshak.ru: страница книги → все ссылки на ответы → condition + текст ответа.
Сохраняет raw/<name>.json = {url, title, items:[{key, h1, condition, answer:[...], images:[...]}]}.

  python3 harvest.py /reshebniki/ximiya/8/gabrielyan/index.html gabrielyan8
"""
import json, re, sys, time
from pathlib import Path
import requests
from bs4 import BeautifulSoup

HERE = Path(__file__).parent
RAW = HERE / 'raw'
BASE = 'https://reshak.ru'
H = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
     'Accept-Language': 'ru-RU,ru;q=0.9'}
S = requests.Session()
S.headers.update(H)


def get(url, tries=4):
    for i in range(tries):
        try:
            r = S.get(url, timeout=30)
            if r.status_code == 200:
                return r.text
        except Exception:
            pass
        time.sleep(2 + 3 * i)
    return None


def parse_answer(html_text):
    soup = BeautifulSoup(html_text, 'html.parser')
    art = soup.find('article', class_='lcol') or soup
    h1 = art.find('h1')
    title = re.sub(r'\s+', ' ', h1.get_text(' ', strip=True)) if h1 else ''
    imgs = [img.get('src') for img in art.select('.pic_otvet1 img, div[class^=pic_otvet] img') if img.get('src')]
    tz = art.find('div', class_='text_zad')
    cond, ans = '', []
    if tz:
        for nx in tz.find_all('noindex'):
            nx.decompose()
        divs = [d for d in tz.find_all('div', recursive=False)]
        texts = [re.sub(r'\s+', ' ', d.get_text(' ', strip=True)) for d in divs]
        texts = [t for t in texts if t]
        # первый — «Рассмотрим вариант решения…», второй — условие, дальше — ответ
        if texts and 'Рассмотрим вариант' in texts[0]:
            texts = texts[1:]
        if texts:
            cond = texts[0]
            ans = texts[1:]
    return title, cond, ans, imgs


def main():
    path, name = sys.argv[1], sys.argv[2]
    out = RAW / f'{name}.json'
    data = json.load(open(out, encoding='utf-8')) if out.exists() else {'url': path, 'items': []}
    done = {it['key'] for it in data['items']}
    idx = get(BASE + path)
    if not idx:
        print('index fail'); sys.exit(1)
    soup = BeautifulSoup(idx, 'html.parser')
    t = soup.find('title')
    data['title'] = t.get_text(strip=True) if t else ''
    links = []
    seen = set()
    for a in soup.find_all('a', href=True):
        h = a['href']
        if '/otvet/' in h and 'otvet1=' in h and h not in seen:
            seen.add(h); links.append(h)
    print(f'{name}: ссылок {len(links)}, уже есть {len(done)}')
    for i, h in enumerate(links):
        key = h.split('otvet1=')[1]
        if key in done:
            continue
        page = get(BASE + h)
        if not page:
            print('  fail', key); continue
        title, cond, ans, imgs = parse_answer(page)
        data['items'].append({'key': key, 'h1': title, 'condition': cond, 'answer': ans, 'images': imgs})
        done.add(key)
        if (i + 1) % 25 == 0:
            json.dump(data, open(out, 'w', encoding='utf-8'), ensure_ascii=False)
            print(f'  {i+1}/{len(links)}')
        time.sleep(0.6)
    json.dump(data, open(out, 'w', encoding='utf-8'), ensure_ascii=False)
    n_txt = sum(1 for it in data['items'] if it['answer'])
    print(f'{name}: готово {len(data["items"])}, с текстом ответа {n_txt}')


if __name__ == '__main__':
    main()
