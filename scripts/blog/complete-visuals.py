#!/usr/bin/env python3
"""Fill missing blog visuals from the reviewed editorial library; keep text/photos.

Run from repository root. Reuses thematic scenes, never labels an invented campus
as a real institution. Idempotent; existing covers and inline images are preserved.
"""
import collections
import hashlib
import html
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
BLOG = ROOT / 'content/blog'
DATA = ROOT / 'data/blog-visuals'


def read(path):
    return json.loads(path.read_text())


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


def classify(post):
    t = post['title'].lower().replace('ё', 'е')
    slug = post['slug']
    cat = post.get('category', '').lower()
    def has(pattern):
        return re.search(pattern, t)
    if cat == 'взрослым' and 'летово' not in t:
        return 'adult'
    if has('за рубеж|за границ|обмену|иностранн.*школ'):
        return 'abroad'
    if has('финансов|бюджет.*семь|карманны.*деньг'):
        return 'finance'
    if has('вечерн|сменн.*школ|после 18|в 30 лет'):
        return 'adult'
    if has('кадет|суворов|нахимов'):
        return 'cadet'
    if has('онлайн.школ|дистанционн.*школ|электронн.*дневник'):
        return 'online'
    if has('лицей|лицеи|гимнази|школа [«„]|школ[ыа] №|школ.*пансион|интернат'):
        return 'school'
    if has('материнск|налогов|вычет|возврат денег|договор|документ|отказали|права родител|прописк|закон|фгос|аттестат.*потер|дубликат'):
        return 'documents'
    if has('вечерн|сменн.*школ|после 18|в 30 лет'):
        return 'adult'
    if has('медицинск.*вуз|медицинск.*университет|первый мед|сеченов|пирогов'):
        return 'university'
    if has('вуз|университет|институт|бакалавр|магистр|общежити|стипенди|бауман|мгу|мфти|рудн|маи|мэи|вшэ|ранхигс|гнесин|мгимо|мгту|мпгу|спбгу|политех|целевое место|приемн.*комисс|колледж|куда поступ|после 11 класса') or re.search(r'postuplenie-v-(?!shkol|licey|gimnaz|kadet|suvorov|nahimov)', slug):
        return 'university'
    if has('кадет|суворов|нахимов'):
        return 'cadet'
    if has('летово|лицей|лицеи|гимнази|лучшие школы|рейтинг.*школ|частн.*школ|государственн.*школ|школа [«„]|школ[ыа] №|школ.*пансион|интернат|коррекционн.*школ') or slug.endswith('-postuplenie'):
        return 'school'
    if has('онлайн.школ|дистанционн.*школ|электронн.*дневник'):
        return 'online'
    if has('робот|инженер|электроник|конструир'):
        return 'robotics'
    if has('шахмат'):
        return 'chess'
    if has('фортепиано|гитар|скрипк|музык|сольфеджио|вокал|ударны|духовы'):
        return 'music'
    if has('танц|хореограф'):
        return 'dance'
    if has('актер|театр|сценическ'):
        return 'theatre'
    if has('монтаж|блогинг|видео|фотограф|мультипликац|анимаци'):
        return 'video'
    if has('дизайн|3d|3д|цифров.*рисован'):
        return 'digital-art'
    if has('рисован| изо |изобразитель|живопис|творчеств|лепк|бумаж|оригами|рукодел|керамик'):
        return 'drawing'
    if has('хими'):
        return 'chemistry'
    if has('физик|электрич'):
        return 'physics'
    if has('биолог|микроскоп|растен|гербар|естествознан|окружающ.*мир|эколог'):
        return 'biology'
    if has('географ|контурн.*карт|астроном'):
        return 'geography'
    if has('истори|археолог'):
        return 'history'
    if has('математ|алгебр|геометр|арифмет|умножени|процент|дроб|кубик|спидкуб|логик|площадь|периметр|треугольник|прямоугольник|вершин.*куба'):
        return 'math'
    if has('английск|немецк|китайск|японск|корейск|испанск|французск|иностранн.*язык|лингвист'):
        return 'languages'
    if has('логопед|речев|артикуляц|дисграф|дислекс'):
        return 'speech'
    if cat == 'русский язык' or has('русск.*язык|по русскому|орфограф|пиш[еь]|запят|ударени|склонени|причасти|тире|дефис|частиц|[«„].*[»“].*или|букв|суффикс|приставк|жи.ши|калл[и]?граф'):
        return 'russian'
    if has('литератур|книг|читать|чтени|стих|сочинени|изложени'):
        return 'reading'
    if has('интернет|кибербуллинг|гаджет|смартфон|телефон|кибербезопас'):
        return 'internet'
    if has('программир|информатик|python|scratch|minecraft|roblox|unity|it.проф|компьютер|сайт|киберспорт|нейросет|искусственн.*интеллект|мобильн.*приложени'):
        return 'coding'
    if has('дорожн|пдд|юид|дорог.*школ'):
        return 'road'
    if has('буллинг|травл|трево[гж]|стресс|психолог|ревност|агресси|переходный возраст|подростк.*возраст|не хочет|слез|скандал|самооцен|отличник|прокрастин|выгоран|депрес|конфликт|похвал|мотивир|страх|влюблен'):
        return 'psychology'
    if has('спорт|физкультур|здоров|осанк|зрен|сон |питани|гимнаст|плавани|сшор|сдюшор'):
        return 'sports'
    if has('перв.*класс|1 класс|дошкол|5 лет|6 лет|7 лет|начальн.*школ|готовност.*школ|готов.*к школе'):
        return 'primary'
    if has('дру[зж]|адапт[аи]|нов.*коллектив|общени|знаком.*люд'):
        return 'friends'
    if has('профориентац|професси|карьер|профиль|направлени.*вуз'):
        return 'career'
    if has('каникул|летом|летний|лагер'):
        return 'summer'
    if has('школьн.*форм'):
        return 'uniform'
    if has('егэ|огэ|экзамен|аттестац|олимпиад|контрольн|впр|экстернат|тестовы.*задани|шпаргал|предметы сдавать'):
        return 'exam'
    if has('семейн|домашн.*обучен|на дому|домашн.*школ'):
        return 'family'
    if has('врем[ея]|режим|план |конспект|памят|вниман|самодисцип|расписани|рабоч.*мест|учебн.*мест'):
        return 'planning'
    if has('наук|кванториум'):
        return 'biology'
    if cat == 'курсы для детей' or slug.startswith('obzor-shkoly-'):
        return 'online'
    if has('школ|образован'):
        return 'school'
    return 'family'


def pick(assets, slug, excluded):
    choices = [a for a in assets if a['imageUrl'] not in excluded]
    if not choices:
        raise ValueError(f'No distinct visual for {slug}')
    n = int(hashlib.sha256(slug.encode()).hexdigest()[:8], 16)
    return choices[n % len(choices)]


def main():
    manifest = read(BLOG / 'index.json')
    library = read(DATA / 'editorial-library.json')['images']
    groups = collections.defaultdict(list)
    for asset in library:
        for group in asset['groups']:
            groups[group].append(asset)
    assignments = []
    for meta in manifest:
        path = BLOG / f"{meta['slug']}.json"
        post = read(path)
        group = classify(post)
        cover_added = False
        if not post.get('imageUrl'):
            # An authenticated photograph already in this article is the most
            # accurate cover for a named institution. Keep its original credit.
            real = re.search(r'<img\b[^>]*\bsrc=[\"\']([^\"\']+)[\"\'][^>]*>', post['content'], re.I)
            if real and real[1].startswith('/blog/') and 'editorial-' not in real[1]:
                alt = re.search(r'\balt=[\"\']([^\"\']*)[\"\']', real[0])
                post['imageUrl'] = real[1]
                post['imageAlt'] = html.unescape(alt[1]) if alt else post['title']
            else:
                cover = pick(groups[group], post['slug'], set())
                post['imageUrl'] = cover['imageUrl']
                post['imageAlt'] = cover['imageAlt']
            cover_added = True
        inline_added = False
        inline_url = None
        if not re.search(r'<img\b', post['content'], re.I):
            complementary = {
                'university': 'university', 'school': 'school', 'adult': 'adult',
                'documents': 'documents', 'abroad': 'online', 'adult': 'documents',
            }.get(group, 'study')
            choices = groups[group]
            distinct = [a for a in choices if a['imageUrl'] != post['imageUrl']]
            # Subject-specific cover + a different scene of studying that subject
            # where available; otherwise use the learning context of the article.
            if not distinct:
                choices = groups[complementary]
            asset = pick(choices, post['slug'] + '-body', {post['imageUrl']})
            inline_url = asset['imageUrl']
            figure = (
                '\n<figure class="post-photo" data-editorial-visual="20261022">'
                f'<img src="{html.escape(inline_url, quote=True)}" '
                f'alt="{html.escape(asset["imageAlt"], quote=True)}" '
                'width="1536" height="1024" loading="lazy" decoding="async" />'
                '<figcaption>Тематическая иллюстрация, созданная с помощью ИИ.</figcaption>'
                '</figure>\n'
            )
            headings = list(re.finditer(r'<h2\b', post['content'], re.I))
            candidates = [h.start() for h in headings[1:] if h.start() >= 1400]
            if candidates:
                at = candidates[0]
            else:
                paragraphs = list(re.finditer(r'</p>', post['content'], re.I))
                at = paragraphs[max(0, len(paragraphs) // 3)].end() if paragraphs else len(post['content'])
            post['content'] = post['content'][:at] + figure + post['content'][at:]
            inline_added = True
        for field in ('imageUrl', 'imageAlt'):
            meta[field] = post[field]
        if cover_added or inline_added:
            write(path, post)
        assignments.append(dict(slug=post['slug'], group=group, imageUrl=post['imageUrl'],
                                coverAdded=cover_added, inlineAdded=inline_added, inlineUrl=inline_url))
    write(BLOG / 'index.json', manifest)
    report = dict(date='2026-10-22', total=len(manifest),
                  coversAdded=sum(a['coverAdded'] for a in assignments),
                  inlineAdded=sum(a['inlineAdded'] for a in assignments),
                  groups=dict(collections.Counter(a['group'] for a in assignments)),
                  assignments=assignments)
    write(DATA / '2026-10-22-coverage.json', report)
    print(json.dumps({k: v for k, v in report.items() if k != 'assignments'}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
