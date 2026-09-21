#!/usr/bin/env python3
"""Массовый сбор Вордстата под раздел «Олимпиады»: батчи по 8 фраз, инкрементальная запись raw/kw.json."""
import json, os, sys, time
sys.path.insert(0, os.path.expanduser('~/claude/yandex-direct'))
os.chdir(os.path.expanduser('~/claude/yandex-direct'))
import wordstat as ws
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'raw', 'kw.json')
subjects = ['математике','русскому языку','английскому языку','физике','химии','биологии','истории','обществознанию',
            'географии','литературе','информатике','экономике','праву','астрономии','экологии','немецкому языку',
            'французскому языку','испанскому','итальянскому','китайскому языку','мхк','обж','физкультуре','технологии',
            'робототехнике','информационной безопасности','искусственному интеллекту']
seeds = []
for s in subjects:
    seeds += [f'олимпиада по {s} задания', f'олимпиада по {s} класс', f'всош по {s}', f'олимпиада по {s} ответы']
seeds += ['всош', 'всош 2026', 'всероссийская олимпиада школьников', 'школьный этап всош', 'муниципальный этап всош',
          'региональный этап всош', 'заключительный этап всош', 'олимпиады прошлых лет задания', 'олимпиады для школьников',
          'перечень олимпиад', 'олимпиада сириус', 'подготовка к олимпиаде', 'олимпиадные задания', 'олимпиада 4 класс',
          'олимпиада 5 класс', 'олимпиада 6 класс', 'олимпиада 7 класс', 'олимпиада 8 класс', 'олимпиада 9 класс',
          'олимпиада 10 класс', 'олимпиада 11 класс', 'олимпиада задания с ответами', 'пригласительный этап всош',
          'олимпиада ломоносов', 'олимпиада высшая проба', 'олимпиада физтех', 'олимпиада росатом', 'олимпиада курчатов',
          'олимпиада покори воробьевы горы', 'олимпиада газпром', 'олимпиада звезда', 'олимпиада кенгуру', 'олимпиада русский медвежонок',
          'льготы за олимпиады', 'олимпиады дающие льготы при поступлении', 'олимпиады 1 уровня', 'олимпиады для 1 класса', 'олимпиады для 2 класса', 'олимпиады для 3 класса']
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
