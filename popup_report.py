#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Отчёт по влиянию поп-апов/растяжки на конверсию pro-schools.ru.
Сравнивает период ДО и ПОСЛЕ запуска поп-апа и отдельно следит за
"перетягиванием" заявок с форм карточек школ (/shkola/*).
Отправляет отчёт в Telegram (тот же чат, куда падают заявки).

Запуск: python3 popup_report.py            # печать + отправка в ТГ
        python3 popup_report.py --no-send  # только печать
"""
import urllib.request, urllib.parse, json, sys, datetime

# ── Конфиг ────────────────────────────────────────────────────────────────
METRIKA_TOKEN = "y0__wgBEJHt6LABGNXGRCC0j8KLGDZMZiaUsYBdcNIV5qh69rrayyHC"
CID = "108789843"
LAUNCH = datetime.date(2026, 8, 24)          # дата внедрения поп-апа/растяжки
WINDOW_BEFORE = 28                            # сколько дней до запуска тянуть для подбора базы
OUTAGE_RATIO  = 0.4                           # день с визитами <40% медианы = провал счётчика, выкидываем

# Telegram (тот же бот и чат, что и лид-формы)
TG_TOKEN = "8732632088:AAETkPlyVWzkeKPXdfCnHXOYesoSDp51UyM"
TG_CHAT  = "134614433"

GOAL_CONTACT = "556308287"   # автоцель "отправил контактные данные" = заявка формой
GOAL_PHONE   = "560865950"   # автоцель "клик по телефону"

# JS-цели поп-апов/баннеров (созданы 2026-08-24). Точный сплит источников.
CUSTOM_GOALS = [
    ("601419042", "Заявка из поп-апа (каталог)"),
    ("601419050", "Заявка с карточки школы"),
    ("601419070", "Клик по растяжке (онлайн-школа)"),
    ("601419122", "Клик в поп-апе блог/ГДЗ"),
    ("601419163", "Клик по баннеру экстерната"),
]

def metrika(params):
    url = "https://api-metrika.yandex.net/stat/v1/data?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"Authorization": "OAuth " + METRIKA_TOKEN})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.load(r)

def daily(d1, d2, metrics, filt=None):
    """{дата: [метрики]} — считаем по дням, чтобы уметь выкидывать битые сутки."""
    p = {"id": CID, "date1": d1, "date2": d2, "metrics": ",".join(metrics),
         "dimensions": "ym:s:date", "sort": "ym:s:date", "limit": 500}
    if filt:
        p["filters"] = filt
    return {r["dimensions"][0]["name"]: [float(x) for x in r["metrics"]]
            for r in metrika(p)["data"]}

def summarize(dmap, dates):
    """Сумма метрик по выбранным датам → {visits, contact, phone}."""
    v = c = ph = 0.0
    for d in dates:
        row = dmap.get(d)
        if row:
            v += row[0]; c += row[1]; ph += row[2]
    return {"visits": int(v), "contact": int(round(c)), "phone": int(round(ph))}

def cr(x, base):
    return (x / base * 1000.0) if base else 0.0   # на 1000 визитов

def pick_days(dmap, launch, today):
    """Отбираем корректные сутки: без провалов счётчика и без текущего дня.
    ДО подбираем по тем же дням недели, что остались ПОСЛЕ, — иначе выходные
    перекашивают конверсию."""
    vals = sorted(v[0] for v in dmap.values() if v[0] > 0)
    med = vals[len(vals) // 2] if vals else 0
    floor = med * OUTAGE_RATIO

    def ok(d):
        row = dmap.get(d)
        return bool(row) and row[0] >= floor

    all_days = sorted(dmap)
    after_all = [d for d in all_days
                 if launch.isoformat() <= d < today.isoformat()]   # текущий день неполный
    after = [d for d in after_all if ok(d)]
    dropped = [d for d in after_all if d not in after]
    if not after:
        return [], [], dropped
    wd = {datetime.date.fromisoformat(d).weekday() for d in after}
    before_pool = [d for d in all_days
                   if d < launch.isoformat() and ok(d)
                   and datetime.date.fromisoformat(d).weekday() in wd]
    before = before_pool[-len(after):]
    return before, after, dropped

def fmt_block(title, dates, whole, cards, filt):
    a = summarize(whole, dates); c = summarize(cards, dates); f = summarize(filt, dates)
    lines = ["<b>%s</b> (%d дн.: %s)" % (title, len(dates), ", ".join(d[5:] for d in dates)),
             "  Визиты: %d" % a["visits"],
             "  Заявки-форма: %d  (%.1f/1000 виз.)" % (a["contact"], cr(a["contact"], a["visits"])),
             "  Клик по тел. школы: %d  (%.1f/1000 виз.)" % (a["phone"], cr(a["phone"], a["visits"])),
             "  • Карточки /shkola/*: вх.виз %d, заявки %d, тел %d" % (c["visits"], c["contact"], c["phone"]),
             "  • Каталог /shkoly/*: вх.виз %d, заявки %d, тел %d" % (f["visits"], f["contact"], f["phone"])]
    return lines, {"all": a, "cards": c, "filt": f}

def main():
    today = datetime.date.today()
    window_d1 = (LAUNCH - datetime.timedelta(days=WINDOW_BEFORE)).isoformat()
    window_d2 = today.isoformat()
    M = ["ym:s:visits", "ym:s:goal%sreaches" % GOAL_CONTACT, "ym:s:goal%sreaches" % GOAL_PHONE]

    whole = daily(window_d1, window_d2, M)
    cards = daily(window_d1, window_d2, M, "ym:s:startURL=~'pro-schools.ru/shkola/'")
    filt  = daily(window_d1, window_d2, M, "ym:s:startURL=~'pro-schools.ru/shkoly/'")

    before, after, dropped = pick_days(whole, LAUNCH, today)
    if not after:
        print("[err] нет корректных суток после запуска"); return

    msg = ["📊 <b>Отчёт: поп-апы pro-schools.ru</b>",
           "Запуск поп-апа/растяжки: <b>%s</b>" % LAUNCH.isoformat()]
    if dropped:
        msg.append("<i>⚠️ Выкинуты сутки с провалом счётчика: %s</i>" % ", ".join(dropped))
    msg.append("<i>Дни недели в ДО и ПОСЛЕ выровнены.</i>\n")

    before_lines, B = fmt_block("ДО запуска", before, whole, cards, filt)
    after_lines,  A = fmt_block("ПОСЛЕ запуска", after, whole, cards, filt)
    msg += before_lines + [""] + after_lines + [""]

    def per1000(blk, key, seg="all"):
        return cr(blk[seg][key], blk[seg]["visits"])

    msg.append("<b>Динамика (на 1000 визитов):</b>")
    for label, key in [("Заявки-форма", "contact"), ("Клик по тел. школы", "phone")]:
        b, a = per1000(B, key), per1000(A, key)
        delta = ((a - b) / b * 100) if b else 0
        arrow = "🟢▲" if a >= b else "🔴▼"
        msg.append("  %s: %.1f → %.1f  %s %+.0f%%" % (label, b, a, arrow, delta))
    msg.append("<i>Клик по телефону — это номер САМОЙ ШКОЛЫ: звонок мимо нас, не наша конверсия.</i>")

    # ── КОНТРОЛЬ КАННИБАЛИЗАЦИИ карточек школ (только по заявкам) ──
    bc = cr(B["cards"]["contact"], B["cards"]["visits"])
    ac = cr(A["cards"]["contact"], A["cards"]["visits"])
    msg.append("")
    msg.append("<b>⚠️ Контроль карточек школ (перетягивание):</b>")
    msg.append("  Заявки/1000: %.1f → %.1f" % (bc, ac))
    if ac < bc * 0.85:
        msg.append("  🔴 <b>Похоже на перетягивание</b>: заявки с карточек упали >15%. Проверить.")
    else:
        msg.append("  🟢 Карточки не просели — перетягивания нет.")

    # ── Точный сплит по JS-целям (данные копятся с 2026-08-24) ──
    msg.append("")
    msg.append("<b>Точный сплит по целям (ПОСЛЕ, те же %d сут.):</b>" % len(after))
    for gid, label in CUSTOM_GOALS:
        try:
            g = daily(after[0], after[-1], ["ym:s:goal%sreaches" % gid])
            val = int(round(sum(g[d][0] for d in after if d in g)))
        except Exception:
            val = -1
        msg.append("  %s: %s" % (label, val if val >= 0 else "н/д"))
    msg.append("")
    msg.append("<i>Заявки из поп-апа также помечены в ТГ «📍 Источник».</i>")

    text = "\n".join(msg)
    print(text.replace("<b>", "").replace("</b>", "").replace("<i>", "").replace("</i>", ""))

    if "--no-send" not in sys.argv:
        body = urllib.parse.urlencode({"chat_id": TG_CHAT, "text": text, "parse_mode": "HTML",
                                       "disable_web_page_preview": "true"}).encode()
        try:
            urllib.request.urlopen(urllib.request.Request(
                "https://api.telegram.org/bot%s/sendMessage" % TG_TOKEN, data=body), timeout=30)
            print("\n[ok] отправлено в Telegram")
        except Exception as e:
            print("\n[err] Telegram:", e)

if __name__ == "__main__":
    main()
