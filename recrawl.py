#!/usr/bin/env python3
"""
Ежедневный переобход страниц ГДЗ/учебника через Яндекс Вебмастер.

Квота ~150 URL/сутки (Вебмастер сам её отдаёт). Скрипт берёт остаток квоты и
шлёт на переобход столько непереобойдённых URL, сколько влезает.

Приоритет очереди:
  1) recrawl_priority.txt — near-miss страницы (2-я страница выдачи), их надо
     освежить в первую очередь, особенно после правок title/description;
  2) все темы учебника  (/uchebnik/{предмет}/{класс}/{тема}/);
  3) все номера ГДЗ      (/gdz/{класс}/{предмет}/{книга}/{номер}/).

Состояние — recrawl_state.json: какие URL уже отправлены (чтобы не слать дважды).
Когда всё отправлено — цикл завершён; чтобы прогнать заново, удалить state-файл.

Токен вшит, переопределяется переменной окружения YWM_TOKEN.
"""
import json
import os
import re
import sys
import time
import urllib.request
from urllib.error import HTTPError, URLError

TOKEN = os.environ.get("YWM_TOKEN", "y0__wgBEJHt6LABGNnGRCCDvcOLGFDZMa8ZuWa2fgotAE8dNc-rjJ9Y")
USER_ID = "370816657"
HOST_ID = "https:pro-schools.ru:443"
BASE = f"https://api.webmaster.yandex.net/v4/user/{USER_ID}/hosts/{HOST_ID}"
SITEMAP = "https://pro-schools.ru/sitemap.xml"
HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "recrawl_state.json")
PRIORITY_SEED = os.path.join(HERE, "recrawl_priority.txt")


def api(method, path, body=None, retries=4):
    data = json.dumps(body).encode() if body is not None else None
    last = None
    for attempt in range(retries):
        req = urllib.request.Request(
            BASE + path, data=data, method=method,
            headers={"Authorization": f"OAuth {TOKEN}", "Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except HTTPError as e:
            # 429 / 4xx-по-квоте пробрасываем наверх — их обрабатывает вызывающий
            if e.code in (429,) or 400 <= e.code < 500:
                raise
            last = e
        except URLError as e:
            last = e
        time.sleep(2 * (attempt + 1))
    raise last


def seg(u):
    return [x for x in u.replace("https://pro-schools.ru/", "").split("/") if x]


def fetch_sitemap_urls():
    for attempt in range(4):
        try:
            with urllib.request.urlopen(SITEMAP, timeout=60) as r:
                xml = r.read().decode("utf-8", "ignore")
            locs = re.findall(r"<loc>([^<]+)</loc>", xml)
            uch = [u for u in locs if "/uchebnik/" in u and len(seg(u)) == 4]
            gdz = [u for u in locs if "/gdz/" in u and len(seg(u)) == 5]
            return uch, gdz
        except (HTTPError, URLError):
            time.sleep(2 * (attempt + 1))
    raise SystemExit("Не удалось скачать sitemap.xml")


def build_queue():
    uch, gdz = fetch_sitemap_urls()
    seed = []
    if os.path.exists(PRIORITY_SEED):
        seed = [l.strip() for l in open(PRIORITY_SEED, encoding="utf-8") if l.strip()]
    seen, queue = set(), []
    for u in seed + uch + gdz:          # приоритет: near-miss -> учебник -> ГДЗ
        if u not in seen:
            seen.add(u)
            queue.append(u)
    return queue, len(uch), len(gdz)


def main():
    state = {"submitted": []}
    if os.path.exists(STATE):
        state = json.load(open(STATE, encoding="utf-8"))
    submitted = set(state.get("submitted", []))

    try:
        quota = api("GET", "/recrawl/quota")
    except Exception as e:
        print(f"Не удалось получить квоту: {e}", file=sys.stderr)
        sys.exit(1)
    remain = int(quota.get("quota_remainder", 0))
    daily = int(quota.get("daily_quota", 0))
    print(f"Квота переобхода: осталось {remain} из {daily}/сутки")

    queue, n_uch, n_gdz = build_queue()
    pending = [u for u in queue if u not in submitted]
    print(f"Всего в очереди ГДЗ/учебник: учебник {n_uch} + ГДЗ {n_gdz}. "
          f"Уже отправлено ранее: {len(submitted)}. Осталось непереобойдённых: {len(pending)}")

    if not pending:
        print("✓ Все страницы ГДЗ/учебника отправлены на переобход. Цикл завершён.")
        return
    if remain <= 0:
        print("Квота на сегодня исчерпана — ждём завтра.")
        return

    n_ok = 0
    for u in pending[:remain]:
        try:
            api("POST", "/recrawl/queue", {"url": u})
            submitted.add(u)
            n_ok += 1
            time.sleep(0.35)
        except HTTPError as e:
            if e.code == 429:
                print("Досрочно упёрлись в квоту (429) — стоп.")
                break
            print(f"Ошибка {e.code} на {u} — пропуск.", file=sys.stderr)
        except Exception as e:
            print(f"Сбой на {u}: {e} — пропуск.", file=sys.stderr)

    state["submitted"] = sorted(submitted)
    json.dump(state, open(STATE, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    left = len([u for u in queue if u not in submitted])
    print(f"Отправлено на переобход сегодня: {n_ok}. "
          f"Всего за всё время: {len(submitted)}. Осталось: {left} "
          f"(≈{(left + daily - 1)//max(daily,1)} дн. при {daily}/сутки).")


if __name__ == "__main__":
    main()
