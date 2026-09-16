#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Замер результатов правок раздела онлайн-школ (16.09.2026): страницы брендов
/shkoly/tipy/online/<brand>/, городские /shkoly/<город>/online/, хабы online и domashnie,
лид-блок в статьях онлайн-кластера.

Что считает:
  1. Метрика (счётчик из popup_report.py) по странице входа за окно --days:
     визиты, заявки (цель 556308287), звонки (560865950) по группам страниц раздела
     + средний CR по сайту; рядом — база до правок (01.07–15.09.2026, 77 дней), приведённая к тому же окну.
  2. Вебмастер (query-analytics, последние 14 дней): показы/клики/позиции страниц /online и
     брендовых запросов (фоксфорд, интернетурок, синергия, гимназия, skysmart, бит). Нужен YWM_TOKEN в env.

Запуск: python3 scripts/online_section_report.py [--days 14] [--tg]
"""
import argparse, collections, datetime as dt, json, os, re, sys, urllib.parse, urllib.request
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from popup_report import METRIKA_TOKEN, CID, GOAL_CONTACT, GOAL_PHONE, TG_TOKEN, TG_CHAT  # noqa: E402

BASE_DAYS = 77  # 01.07–15.09.2026
try:
    src = open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src/data/schools.ts'), encoding='utf8').read()
except Exception:
    src = ''
BASE = {  # визиты, заявки, звонки за базу
    'бренды /shkoly/tipy/online/<brand>/': (0, 0, 0),
    'хаб /shkoly/tipy/online/':            (7, 0, 0),
    'города /shkoly/<город>/online/':      (339, 6, 0),
    'карточки онлайн-школ /shkola/':       (14, 1, 0),
    'хаб /shkoly/tipy/domashnie/':         (1, 0, 0),
    'блог: онлайн-кластер':                (258, 0, 1),   # статьи по слагу BLOG_RE (страница входа)
    # ── вечерние и семейные (правки 16.09.2026: лид-блок, индексация 1–2 школ, гайд семейных) ──
    'вечерние: города /shkoly/<город>/vechernie/': (6505, 240, 590),
    'вечерние: карточки /shkola/':         (2008, 115, 128),
    'семейные: города + хаб':              (241, 7, 3),
    'блог: взрослым/вечерние':             (0, 0, 0),   # базу по слагам ADULT_RE не считали — CTA появился 16.09
    'ВЕСЬ САЙТ':                           (52378, 649, 985),
}
VECH_CARDS = set()
try:
    VECH_CARDS = set(re.findall(r"slug:\s*'([^']+)'[^{}]*?type:\s*'vechernie'", src, re.S))
except Exception:
    pass
ADULT_RE = re.compile(r'vechern|vzrosl|zaochn|ochno-zaochn|attestat-za-|srednee-obrazovanie-dlya')
ONLINE_CARDS = set()
try:
    ONLINE_CARDS = set(re.findall(r"slug:\s*'([^']+)'[^{}]*?type:\s*'online'", src, re.S))
except Exception:
    pass
BLOG_RE = re.compile(r'onlajn|onlayn|online|domashn|distanc|semejn|nadomn|eksternat')


def metrika(p):
    url = "https://api-metrika.yandex.net/stat/v1/data?" + urllib.parse.urlencode(p)
    req = urllib.request.Request(url, headers={"Authorization": "OAuth " + METRIKA_TOKEN})
    return json.load(urllib.request.urlopen(req, timeout=180))


def section(path):
    path = path.split('?')[0]
    if re.match(r'^/shkoly/tipy/online/[a-z0-9-]+/?$', path): return 'бренды /shkoly/tipy/online/<brand>/'
    if re.match(r'^/shkoly/tipy/online/?$', path): return 'хаб /shkoly/tipy/online/'
    if re.match(r'^/shkoly/tipy/domashnie/?$', path): return 'хаб /shkoly/tipy/domashnie/'
    if re.match(r'^/shkoly/[a-z0-9-]+/online/?$', path): return 'города /shkoly/<город>/online/'
    m = re.match(r'^/shkola/([^/]+)/?', path)
    if m and m.group(1) in ONLINE_CARDS: return 'карточки онлайн-школ /shkola/'
    if re.match(r'^/shkoly/[a-z0-9-]+/vechernie/?$', path): return 'вечерние: города /shkoly/<город>/vechernie/'
    if m and m.group(1) in VECH_CARDS: return 'вечерние: карточки /shkola/'
    if re.match(r'^/shkoly/([a-z0-9-]+|tipy)/semejnye/?$', path): return 'семейные: города + хаб'
    m = re.match(r'^/blog/([^/]+)/?', path)
    if m and ADULT_RE.search(m.group(1)): return 'блог: взрослым/вечерние'
    if m and BLOG_RE.search(m.group(1)): return 'блог: онлайн-кластер'
    return None


def metrika_report(days):
    d2 = dt.date.today() - dt.timedelta(days=1)
    d1 = d2 - dt.timedelta(days=days - 1)
    G1, G2 = f"ym:s:goal{GOAL_CONTACT}reaches", f"ym:s:goal{GOAL_PHONE}reaches"
    agg = collections.defaultdict(lambda: [0, 0, 0]); top = collections.defaultdict(lambda: [0, 0])
    tot = [0, 0, 0]; off = 1
    while True:
        r = metrika({"id": CID, "date1": str(d1), "date2": str(d2), "metrics": f"ym:s:visits,{G1},{G2}",
                     "dimensions": "ym:s:startURL", "limit": 100000, "offset": off})
        rows = r["data"]
        for row in rows:
            path = re.sub(r'^https?://[^/]+', '', row["dimensions"][0]["name"]); m = row["metrics"]
            for i in range(3): tot[i] += m[i]
            s = section(path)
            if s:
                for i in range(3): agg[s][i] += m[i]
                top[path][0] += m[0]; top[path][1] += m[1]
        if len(rows) < 100000: break
        off += 100000
    agg['ВЕСЬ САЙТ'] = tot
    k = days / BASE_DAYS
    out = [f"<b>Метрика, страница входа, {d1:%d.%m}–{d2:%d.%m.%Y} ({days} дн.)</b>",
           "раздел | визиты (база*) | заявки (база*) | звонки | CR заявки"]
    for s in BASE:
        v, c, ph = agg.get(s, [0, 0, 0]); bv, bc, bph = BASE[s]
        cr = c / v * 100 if v else 0
        out.append(f"{s} | {v:.0f} ({bv*k:.0f}) | {c:.0f} ({bc*k:.1f}) | {ph:.0f} | {cr:.2f}%")
    out.append("* база = 01.07–15.09.2026, приведена к окну замера")
    out.append("\n<b>Топ страниц раздела по визитам</b>")
    for p, (v, c) in sorted(top.items(), key=lambda x: -x[1][0])[:15]:
        out.append(f"{v:5.0f} визитов, {c:2.0f} заявок  {p}")
    return "\n".join(out)


def webmaster_report():
    tok = os.environ.get("YWM_TOKEN")
    if not tok: return "<b>Вебмастер</b>: YWM_TOKEN не задан — позиции пропущены"
    base = "https://api.webmaster.yandex.net/v4/user/370816657/hosts/https:pro-schools.ru:443/"
    def qa(ind, filt_ind, value, cap=500):
        rows = []; off = 0
        while True:
            body = {"offset": off, "limit": 100, "device_type_indicator": "ALL", "text_indicator": ind,
                    "filters": {"text_filters": [{"text_indicator": filt_ind, "operation": "TEXT_CONTAINS", "value": value}]}}
            req = urllib.request.Request(base + "query-analytics/list", data=json.dumps(body).encode(),
                                         headers={"Authorization": "OAuth " + tok, "Content-Type": "application/json"}, method="POST")
            part = json.load(urllib.request.urlopen(req, timeout=90)).get("text_indicator_to_statistics", [])
            rows += part
            if len(part) < 100 or off + 100 >= cap: break
            off += 100
        out = {}
        for x in rows:
            k = x["text_indicator"]["value"]; s = collections.Counter(); pos = []
            for st in x["statistics"]:
                if st["field"] in ("IMPRESSIONS", "CLICKS"): s[st["field"]] += st["value"]
                if st["field"] == "POSITION": pos.append(st["value"])
            out[k] = (s["IMPRESSIONS"], s["CLICKS"], sum(pos) / len(pos) if pos else 0)
        return out
    def tot(d): return sum(v[0] for v in d.values()), sum(v[1] for v in d.values())
    lines = ["<b>Вебмастер, последние 14 дней (база 16.09: страницы /online — 128 показов / 4 клика; запросы «онлайн» — 1 084 / 31; /vechernie — 8 204 / 1 310; /semejnye — 281 / 23)</b>"]
    for seg in ['/vechernie', '/semejnye']:
        d = qa("URL", "URL", seg, cap=300); i, c = tot(d)
        lines.append(f"страницы {seg}: {len(d)} URL, {i:.0f} показов, {c:.0f} кликов")
    u = qa("URL", "URL", "/online"); i, c = tot(u)
    lines.append(f"страницы /online: {len(u)} URL, {i:.0f} показов, {c:.0f} кликов")
    for k, v in sorted(u.items(), key=lambda x: -x[1][0])[:10]:
        lines.append(f"  {v[0]:5.0f} / {v[1]:3.0f} / поз. {v[2]:.1f}  {k}")
    q = qa("QUERY", "QUERY", "онлайн"); i, c = tot(q)
    lines.append(f"запросы со словом «онлайн»: {len(q)} шт., {i:.0f} показов, {c:.0f} кликов")
    for brand in ["фоксфорд", "интернетурок", "синергия", "гимназия", "skysmart", "бит "]:
        d = qa("QUERY", "QUERY", brand); i, c = tot(d)
        best = sorted(d.items(), key=lambda x: -x[1][0])[:2]
        lines.append(f"«{brand.strip()}»: {i:.0f} показов / {c:.0f} кликов" + (f"; топ: " + "; ".join(f"{k} (поз. {v[2]:.0f})" for k, v in best) if best else ""))
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--days", type=int, default=14); ap.add_argument("--tg", action="store_true")
    a = ap.parse_args()
    text = "📊 <b>pro-schools.ru — замер раздела онлайн-школ</b>\n\n" + metrika_report(a.days)
    try: text += "\n\n" + webmaster_report()
    except Exception as e: text += f"\n\nВебмастер: ошибка {e}"
    print(text)
    if a.tg:
        for chunk in [text[i:i + 3900] for i in range(0, len(text), 3900)]:
            body = urllib.parse.urlencode({"chat_id": TG_CHAT, "text": chunk, "parse_mode": "HTML", "disable_web_page_preview": "1"}).encode()
            urllib.request.urlopen(urllib.request.Request(f"https://api.telegram.org/bot{TG_TOKEN}/sendMessage", data=body), timeout=30)


if __name__ == "__main__":
    main()
