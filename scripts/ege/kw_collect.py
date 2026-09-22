#!/usr/bin/env python3
"""Сбор Вордстата под раздел ЕГЭ/ОГЭ: батчи по 8 фраз, инкрементальная запись raw/kw.json (как в olimp/kw_collect.py)."""
import json, os, sys, time
sys.path.insert(0, os.path.expanduser('~/claude/yandex-direct'))
os.chdir(os.path.expanduser('~/claude/yandex-direct'))
import wordstat as ws
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'raw', 'kw.json')
subj = ['математике','русскому языку','физике','химии','биологии','истории','обществознанию','информатике','географии','литературе','английскому языку']
seeds = ['демоверсия егэ 2027','демоверсия огэ 2027','демоверсии егэ','демоверсии огэ','фипи егэ','фипи огэ','фипи демоверсии','фипи открытый банк заданий',
         'кодификатор егэ 2027','спецификация егэ 2027','кодификатор огэ 2027','спецификация огэ 2027',
         'варианты егэ 2026','варианты огэ 2026','варианты егэ с ответами','реальные варианты егэ','досрочный егэ 2026','кимы егэ','ким егэ 2026','ким огэ 2026',
         'шкала перевода баллов егэ 2026','шкала перевода баллов огэ 2026','первичные баллы егэ','баллы огэ в оценку',
         'расписание егэ 2027','расписание огэ 2027','изменения егэ 2027','изменения огэ 2027','результаты егэ 2026','средний балл егэ 2026','статистика егэ',
         'навигатор подготовки фипи','самостоятельная подготовка к егэ','подготовка к егэ','подготовка к огэ','подготовка к егэ 2027','подготовка к огэ 2027',
         'задания егэ','задания огэ','тесты егэ онлайн','решать егэ онлайн','тренажер егэ','пробный егэ онлайн','пробный огэ онлайн','тесты огэ онлайн',
         'критерии оценивания егэ','критерии оценивания огэ','методические рекомендации фипи','итоговое сочинение 2027','итоговое собеседование 2027','темы итогового сочинения 2026 2027',
         'егэ 2027','огэ 2027','егэ','огэ','минимальные баллы егэ 2027','сколько баллов нужно для сдачи огэ']
for s in subj:
    seeds += [f'демоверсия егэ 2027 по {s}', f'демоверсия огэ 2027 по {s}', f'егэ по {s} 2027', f'огэ по {s} 2027',
              f'подготовка к егэ по {s}', f'подготовка к огэ по {s}', f'задания егэ по {s}', f'варианты егэ по {s}', f'кодификатор егэ по {s}']
res = json.load(open(OUT)) if os.path.exists(OUT) else {}
todo = [s for s in seeds if s not in res]
print('seeds', len(seeds), 'todo', len(todo), flush=True)
for i in range(0, len(todo), 8):
    batch = todo[i:i+8]
    for attempt in range(3):
        try:
            rid = ws.v4("CreateNewWordstatReport", {"Phrases": batch, "GeoID": [225]}).get("data")
            if not isinstance(rid, int): raise RuntimeError(rid)
            for _ in range(40):
                time.sleep(2)
                lst = ws.v4("GetWordstatReportList", None).get("data", [])
                if next((r["StatusReport"] for r in lst if r["ReportID"] == rid), None) == "Done": break
            data = ws.v4("GetWordstatReport", rid).get("data", [])
            ws.v4("DeleteWordstatReport", rid)
            for block in data:
                res[block.get('Phrase')] = [(w['Phrase'], w['Shows']) for w in (block.get('SearchedWith') or [])]
            json.dump(res, open(OUT, 'w'), ensure_ascii=False, indent=0)
            print('ok', i + len(batch), flush=True); break
        except Exception as e:
            print('retry', e, flush=True); time.sleep(10)
print('DONE')
