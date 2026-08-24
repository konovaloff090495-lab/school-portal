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

# Telegram (тот же бот и чат, что и лид-формы)
TG_TOKEN = "8732632088:AAETkPlyVWzkeKPXdfCnHXOYesoSDp51UyM"
TG_CHAT  = "134614433"

GOAL_CONTACT = "556308287"   # автоцель "отправил контактные данные" = заявка формой
GOAL_PHONE   = "560865950"   # автоцель "клик по телефону"

def metrika(params):
    url = "https://api-metrika.yandex.net/stat/v1/data?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"Authorization": "OAuth " + METRIKA_TOKEN})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.load(r)

def totals(d1, d2, extra=None):
    p = {"id": CID, "date1": d1, "date2": d2,
         "metrics": "ym:s:visits,ym:s:goal%sreaches,ym:s:goal%sreaches" % (GOAL_CONTACT, GOAL_PHONE)}
    if extra:
        p.update(extra)
    r = metrika(p)
    t = r["totals"]
    return {"visits": int(t[0]), "contact": int(round(t[1])), "phone": int(round(t[2]))}

def section_stats(d1, d2, path_pattern):
    """Заявки/визиты по странице входа, matching path_pattern (regexp для API)."""
    return totals(d1, d2, {"filters": "ym:s:startURL=~'%s'" % path_pattern})

def cr(x, base):
    return (x / base * 1000.0) if base else 0.0   # на 1000 визитов

def fmt_block(title, d1, d2):
    days = (datetime.date.fromisoformat(d2) - datetime.date.fromisoformat(d1)).days + 1
    all_ = totals(d1, d2)
    cards = section_stats(d1, d2, "pro-schools.ru/shkola/")      # карточки школ
    filt  = section_stats(d1, d2, "pro-schools.ru/shkoly/")      # каталог/фильтры
    lines = []
    lines.append("<b>%s</b> (%s…%s, %d дн.)" % (title, d1, d2, days))
    lines.append("  Визиты: %d" % all_["visits"])
    lines.append("  Заявки-форма: %d  (%.1f/1000 виз.)" % (all_["contact"], cr(all_["contact"], all_["visits"])))
    lines.append("  Клик-телефон: %d  (%.1f/1000 виз.)" % (all_["phone"], cr(all_["phone"], all_["visits"])))
    lines.append("  • Карточки /shkola/*: вх.виз %d, заявки %d, тел %d" % (cards["visits"], cards["contact"], cards["phone"]))
    lines.append("  • Каталог /shkoly/*: вх.виз %d, заявки %d, тел %d" % (filt["visits"], filt["contact"], filt["phone"]))
    return lines, {"all": all_, "cards": cards, "filt": filt, "days": days}

def main():
    today = datetime.date.today()
    after_d1 = LAUNCH
    after_d2 = today
    after_days = (after_d2 - after_d1).days + 1
    # ДО — равный по длине отрезок прямо перед запуском
    before_d2 = LAUNCH - datetime.timedelta(days=1)
    before_d1 = before_d2 - datetime.timedelta(days=after_days - 1)

    msg = ["📊 <b>Отчёт: поп-апы pro-schools.ru</b>",
           "Запуск поп-апа/растяжки: <b>%s</b>\n" % LAUNCH.isoformat()]

    before_lines, B = fmt_block("ДО запуска", before_d1.isoformat(), before_d2.isoformat())
    after_lines,  A = fmt_block("ПОСЛЕ запуска", after_d1.isoformat(), after_d2.isoformat())
    msg += before_lines + [""] + after_lines + [""]

    # ── Сводка изменений (на 1000 визитов, чтобы длины периодов не мешали) ──
    def per1000(blk, key, seg="all"):
        return cr(blk[seg][key], blk[seg]["visits"])

    msg.append("<b>Динамика (на 1000 визитов):</b>")
    for label, key in [("Заявки-форма", "contact"), ("Клик-телефон", "phone")]:
        b, a = per1000(B, key), per1000(A, key)
        delta = ((a - b) / b * 100) if b else 0
        arrow = "🟢▲" if a >= b else "🔴▼"
        msg.append("  %s: %.1f → %.1f  %s %+.0f%%" % (label, b, a, arrow, delta))

    # ── КОНТРОЛЬ КАННИБАЛИЗАЦИИ карточек школ ──
    bc = cr(B["cards"]["contact"], B["cards"]["visits"])
    ac = cr(A["cards"]["contact"], A["cards"]["visits"])
    bp = cr(B["cards"]["phone"], B["cards"]["visits"])
    ap = cr(A["cards"]["phone"], A["cards"]["visits"])
    msg.append("")
    msg.append("<b>⚠️ Контроль карточек школ (перетягивание):</b>")
    msg.append("  Заявки/1000: %.1f → %.1f" % (bc, ac))
    msg.append("  Тел/1000:    %.1f → %.1f" % (bp, ap))
    drop = (ac < bc * 0.85) or (ap < bp * 0.85)
    if drop:
        msg.append("  🔴 <b>Похоже на перетягивание</b>: конверсия карточек упала >15%. Проверить.")
    else:
        msg.append("  🟢 Карточки не просели — перетягивания нет.")

    msg.append("")
    msg.append("<i>Точный сплит поп-ап/карточка/растяжка — по целям popup_lead, card_lead, "
               "partner_banner_click, partner_popup_click (после их создания в Метрике). "
               "Заявки из поп-апа помечены в ТГ «📍 Источник».</i>")

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
