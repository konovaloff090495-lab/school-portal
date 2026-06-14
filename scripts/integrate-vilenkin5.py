import json, re

def esc(s):
    s = s.replace('\\', '\\\\').replace("'", "\\'")
    s = re.sub(r'[\n\r]+', ' ', s)
    s = re.sub(r'\s{2,}', ' ', s).strip()
    return s

conditions = {str(p['number']): p['condition'] for p in json.load(open('scripts/gdz-conditions/vilenkin-5-full.json'))}
solutions = json.load(open('scripts/gdz-conditions/vilenkin-5-solutions.json'))

src = open('src/data/gdz.ts').read().split('\n')
# Динамически находим границы массива vilenkin5Solutions
start = None
for i, line in enumerate(src):
    if re.match(r'\s*const vilenkin5Solutions\s*:', line):
        start = i
        break
if start is None:
    raise SystemExit('vilenkin5Solutions не найден')
end = None
for j in range(start, len(src)):
    if re.match(r'^\]', src[j]):
        end = j
        break
assert end, 'закрывающая ] не найдена'

# page-номера из текущего массива
old_pages = {}
for line in src[start:end]:
    m = re.search(r"number: '([^']+)', page: (\d+)", line)
    if m:
        old_pages[m.group(1)] = int(m.group(2))

entries = []
solved = 0
for n in range(1, 549):
    num = str(n)
    cond = conditions.get(num, '')
    page = old_pages.get(num, max(1, n // 5))
    if num in solutions:
        sol = solutions[num]
        steps_ts = ', '.join(f"'{esc(s)}'" for s in sol['steps'])
        entries.append(f"  {{ number: '{num}', page: {page}, condition: '{esc(cond)}', steps: [{steps_ts}], answer: '{esc(sol['answer'])}' }},")
        solved += 1
    else:
        entries.append(f"  {{ number: '{num}', page: {page}, condition: '{esc(cond)}' }},")

new_src = src[:start+1] + entries + src[end:]
open('src/data/gdz.ts','w').write('\n'.join(new_src))
print(f'Записано {len(entries)} задач, с решением: {solved}. Границы массива: {start+1}-{end+1}')
