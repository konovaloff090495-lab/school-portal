import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TARGET = path.join(__dirname, '../src/data/textbook-articles.ts')

const NEW_ARTICLES = [
  // Литература 11 класс
  {
    subject: 'literatura', klass: 11, topicSlug: 'bulgakov-master', publishedAt: '2026-05-27',
    content: `<h2>М.А. Булгаков «Мастер и Маргарита»</h2>
<p>«Мастер и Маргарита» (1966, посмертно) — вершина творчества Булгакова, один из главных романов XX века.</p>
<h2>Структура романа</h2>
<p>Два сюжетных плана:<br>
<strong>Московский</strong> — Воланд (дьявол) с свитой посещает советскую Москву 1930-х годов.<br>
<strong>Иерусалимский (роман в романе)</strong> — суд Понтия Пилата над Иешуа Га-Ноцри.</p>
<h2>Главные герои</h2>
<p><strong>Мастер</strong> — талантливый писатель, сломленный советской системой и написавший роман о Пилате.<br>
<strong>Маргарита</strong> — воплощение преданной любви, заключает сделку с дьяволом ради Мастера.<br>
<strong>Воланд</strong> — дьявол, несущий справедливость. «Я — часть той силы, что вечно хочет зла и вечно совершает благо.»</p>
<h2>Тема добра и зла</h2>
<p>«Трусость — величайший грех». Пилат трусит, боясь осудить Иешуа, и несёт за это вечное наказание.</p>
<h2>Задания</h2>
<p>1. Почему Воланд наказывает московских чиновников?<br>2. Что символизирует образ Мастера?<br>3. Какова судьба Пилата в финале?</p>
<p><em>Ответы: обличает стяжательство и лицемерие; гонимый художник; прощён, освобождён Иешуа.</em></p>`
  },
  {
    subject: 'literatura', klass: 11, topicSlug: 'sholokhov-tihiy-don', publishedAt: '2026-05-27',
    content: `<h2>М.А. Шолохов «Тихий Дон»</h2>
<p>«Тихий Дон» (1925–1940) — эпический роман-эпопея о судьбе донского казачества в годы революции и Гражданской войны.</p>
<h2>Главный герой — Григорий Мелехов</h2>
<p>Казак, который мечется между белыми и красными, не находя правды ни в одном лагере. Трагедия человека, разрываемого историей.</p>
<h2>Исторический фон</h2>
<p>Первая мировая война → Революция 1917 → Гражданская война. Казачество пытается сохранить уклад жизни, но оказывается между двух огней.</p>
<h2>Тема трагедии народа</h2>
<p>Шолохов показывает: ни одна из сторон конфликта не правее другой. Страдают простые люди.</p>
<h2>Любовная линия</h2>
<p>Григорий разрывается между женой Натальей и возлюбленной Аксиньей — обе трагически гибнут.</p>
<h2>Задания</h2>
<p>1. Чем заканчивается роман для Григория?<br>2. Почему Шолохов не делает Григория однозначным героем?<br>3. Какова главная идея эпопеи?</p>
<p><em>Ответы: остаётся совсем один, на пороге дома; чтобы показать трагедию человека в истории; народ — жертва войны.</em></p>`
  },
  {
    subject: 'literatura', klass: 11, topicSlug: 'akhmatova-requiem', publishedAt: '2026-05-27',
    content: `<h2>А.А. Ахматова «Реквием»</h2>
<p>«Реквием» (1935–1940, опубл. 1987) — поэма о репрессиях сталинской эпохи.</p>
<h2>История создания</h2>
<p>Ахматова написала поэму в годы, когда её сын Лев Гумилёв был арестован. Стихи нельзя было записывать — их заучивали наизусть близкие поэтессы.</p>
<h2>Образ матери</h2>
<p>Личная трагедия становится голосом всех матерей, потерявших детей. «Перед этим горем гнутся горы».</p>
<h2>Структура поэмы</h2>
<p>Вступление → 10 стихотворений → Эпилог. Путь от ареста к приговору и отчаянию.</p>
<h2>Главная идея</h2>
<p>Память — противостояние смерти и забвению. В «Эпилоге» поэтесса просит поставить ей памятник у тюремной стены.</p>
<h2>Задания</h2>
<p>1. Почему поэма долго не публиковалась?<br>2. Что объединяет личную трагедию Ахматовой с народной?<br>3. Каков главный образ «Эпилога»?</p>
<p><em>Ответы: была под запретом как антисоветская; трагедия матери — символ судьбы всего народа; памятник у тюрьмы.</em></p>`
  },
  {
    subject: 'literatura', klass: 11, topicSlug: 'pasternak-doktor-zhivago', publishedAt: '2026-05-27',
    content: `<h2>Б.Л. Пастернак «Доктор Живаго»</h2>
<p>«Доктор Живаго» (1957) — роман о судьбе русской интеллигенции в революционную эпоху. В 1958 году Пастернак был удостоен Нобелевской премии, от которой вынужден был отказаться под давлением властей.</p>
<h2>Главный герой — Юрий Живаго</h2>
<p>Врач и поэт, стремящийся сохранить человечность и творческую свободу в хаосе революции и Гражданской войны. Не принимает ни одну из сторон.</p>
<h2>Лара</h2>
<p>Возлюбленная Живаго — воплощение красоты жизни, России. Их разлука символизирует утрату гармонии мира.</p>
<h2>Стихи Юрия Живаго</h2>
<p>В конце романа помещены стихотворения Живаго — по сути, стихи самого Пастернака. «Зимняя ночь», «Гамлет» — лирический итог романа.</p>
<h2>Задания</h2>
<p>1. Почему Пастернак не мог опубликовать роман в СССР?<br>2. Что олицетворяет Лара?<br>3. Чем завершается жизнь Живаго?</p>
<p><em>Ответы: антисоветское содержание; жизнь, любовь, Россия; умирает в трамвае от сердечного приступа.</em></p>`
  },
  {
    subject: 'literatura', klass: 11, topicSlug: 'ege-literatura', publishedAt: '2026-05-27',
    content: `<h2>Подготовка к ЕГЭ по литературе</h2>
<p>ЕГЭ по литературе — один из сложнейших экзаменов, требующий глубокого знания текстов и умения анализировать.</p>
<h2>Структура ЕГЭ</h2>
<table border="1" cellpadding="8">
<tr><th>Задания</th><th>Описание</th><th>Баллы</th></tr>
<tr><td>1–7</td><td>Анализ фрагмента эпоса/драмы</td><td>14</td></tr>
<tr><td>8</td><td>Развёрнутый ответ на фрагмент прозы</td><td>6</td></tr>
<tr><td>9</td><td>Сопоставление с другими произведениями</td><td>8</td></tr>
<tr><td>10–14</td><td>Анализ лирики</td><td>13</td></tr>
<tr><td>11</td><td>Развёрнутый ответ на стихотворение</td><td>6</td></tr>
<tr><td>12</td><td>Сопоставление стихотворений</td><td>8</td></tr>
<tr><td>17</td><td>Сочинение (большое, на выбор)</td><td>18</td></tr>
</table>
<h2>Как анализировать лирику</h2>
<p>Тема → идея → образы → тропы (метафора, эпитет, олицетворение) → ритм и рифма → место в творчестве поэта.</p>
<h2>Обязательный список произведений</h2>
<p>Включает произведения от «Слова о полку Игореве» до литературы XX века: Толстой, Достоевский, Чехов, Блок, Булгаков, Шолохов, Пастернак и др.</p>
<h2>Советы</h2>
<p>Читай произведения, а не краткие пересказы. Учи наизусть ключевые цитаты. Практикуй написание сочинений по критериям.</p>`
  },
  // Английский 5 класс
  {
    subject: 'angliiskiy-yazyk', klass: 5, topicSlug: 'present-simple', publishedAt: '2026-05-28',
    content: `<h2>Present Simple — Настоящее простое время</h2>
<p>Present Simple используется для описания регулярных действий, привычек, фактов и расписания.</p>
<h2>Образование</h2>
<p>Утвердительное: I/You/We/They + V₁; He/She/It + V₁+(e)s<br>
Отрицательное: I/You... don't + V; He/She/It doesn't + V<br>
Вопросительное: Do I/you...? Does he/she/it?</p>
<h2>Окончание -s/-es в 3-м лице</h2>
<table border="1" cellpadding="8">
<tr><th>Правило</th><th>Пример</th></tr>
<tr><td>Большинство глаголов: +s</td><td>work → works</td></tr>
<tr><td>ch, sh, x, s, o: +es</td><td>watch → watches</td></tr>
<tr><td>согл.+y → -ies</td><td>study → studies</td></tr>
<tr><td>have → has; be → is</td><td>he has, she is</td></tr>
</table>
<h2>Маркеры времени</h2>
<p>Always, usually, often, sometimes, rarely, never, every day/week/morning.</p>
<h2>Примеры</h2>
<p>She always drinks coffee in the morning.<br>
We don't go to school on Sundays.<br>
Does he play football?</p>
<h2>Задания</h2>
<p>1. Поставь глагол в нужную форму: He (work) every day.<br>2. Составь отрицание: She speaks French.<br>3. Задай вопрос: They live in Moscow.</p>
<p><em>Ответы: works; She doesn't speak French; Do they live in Moscow?</em></p>`
  },
  {
    subject: 'angliiskiy-yazyk', klass: 5, topicSlug: 'past-simple', publishedAt: '2026-05-28',
    content: `<h2>Past Simple — Прошедшее простое время</h2>
<p>Past Simple описывает завершённые действия в прошлом с конкретным временем.</p>
<h2>Образование</h2>
<p><strong>Правильные глаголы:</strong> V + ed (play → played, work → worked)<br>
<strong>Неправильные глаголы:</strong> 2-я форма (go → went, see → saw, have → had)</p>
<h2>Правила написания -ed</h2>
<table border="1" cellpadding="8">
<tr><th>Глагол</th><th>Правило</th><th>Пример</th></tr>
<tr><td>Оканчивается на -e</td><td>+d</td><td>like → liked</td></tr>
<tr><td>Краткий слог + согл.</td><td>удвоить + ed</td><td>stop → stopped</td></tr>
<tr><td>Согл. + y</td><td>-ied</td><td>study → studied</td></tr>
</table>
<h2>Отрицание и вопрос</h2>
<p>didn't + V₁ (infinitive without to)<br>
Did + subject + V₁?</p>
<p>I didn't go. Did you see it?</p>
<h2>Маркеры времени</h2>
<p>Yesterday, last week/year/month, ago, in 2020, at 5 o'clock.</p>
<h2>Задания</h2>
<p>1. Образуй Past Simple: visit, run, buy, study.<br>2. Составь вопрос: She called him yesterday.<br>3. Отрицание: They played tennis.</p>
<p><em>Ответы: visited, ran, bought, studied; Did she call him yesterday? They didn't play tennis.</em></p>`
  },
  {
    subject: 'angliiskiy-yazyk', klass: 5, topicSlug: 'future-simple', publishedAt: '2026-05-28',
    content: `<h2>Future Simple (will) — Будущее простое время</h2>
<p>Future Simple с will используется для предсказаний, спонтанных решений и обещаний.</p>
<h2>Образование</h2>
<p>Утвердительное: Subject + will + V₁<br>
Отрицательное: Subject + won't (will not) + V₁<br>
Вопросительное: Will + Subject + V₁?</p>
<h2>Сокращение</h2>
<p>I'll, you'll, he'll, she'll, we'll, they'll.<br>
won't = will not</p>
<h2>Когда используем will</h2>
<table border="1" cellpadding="8">
<tr><th>Использование</th><th>Пример</th></tr>
<tr><td>Предсказание</td><td>It will rain tomorrow.</td></tr>
<tr><td>Спонтанное решение</td><td>I'll open the window.</td></tr>
<tr><td>Обещание</td><td>I won't be late.</td></tr>
<tr><td>Просьба/предложение</td><td>Will you help me?</td></tr>
</table>
<h2>will vs going to</h2>
<p>will — спонтанное; going to — заранее запланированное: I'm going to visit Paris next summer (уже запланировано).</p>
<h2>Задания</h2>
<p>1. Составь предложение: (she/call/tomorrow).<br>2. Отрицание: They will come.<br>3. Will или going to: «Смотри, тучи! Думаю, ___ дождь.»</p>
<p><em>Ответы: She will call tomorrow; They won't come; it's going to rain.</em></p>`
  },
  {
    subject: 'angliiskiy-yazyk', klass: 5, topicSlug: 'present-continuous', publishedAt: '2026-05-28',
    content: `<h2>Present Continuous — Настоящее длительное время</h2>
<p>Present Continuous описывает действие, происходящее в момент речи или в этот период времени.</p>
<h2>Образование</h2>
<p>am/is/are + Ving (Present Participle)</p>
<p>I am → I'm; he/she/it is → he's; we/you/they are → we're</p>
<h2>Правила написания -ing</h2>
<table border="1" cellpadding="8">
<tr><th>Глагол</th><th>Правило</th><th>Пример</th></tr>
<tr><td>Обычно</td><td>+ing</td><td>play → playing</td></tr>
<tr><td>Оканчивается на -e</td><td>убрать e, +ing</td><td>make → making</td></tr>
<tr><td>Краткий слог + согл.</td><td>удвоить</td><td>run → running</td></tr>
<tr><td>Оканчивается на -ie</td><td>ie→y+ing</td><td>lie → lying</td></tr>
</table>
<h2>Маркеры</h2>
<p>Now, at the moment, at present, right now, look!, listen!</p>
<h2>Глаголы-исключения (stative verbs)</h2>
<p>Не употребляются в Continuous: know, love, hate, want, need, see, hear, believe, understand.</p>
<h2>Задания</h2>
<p>1. Поставь в Present Continuous: (she/read/a book).<br>2. Задай вопрос к: He is watching TV.<br>3. Почему нельзя: «I am knowing the answer»?</p>
<p><em>Ответы: She is reading a book; Is he watching TV?; know — stative verb.</em></p>`
  },
  {
    subject: 'angliiskiy-yazyk', klass: 5, topicSlug: 'modal-verbs-5', publishedAt: '2026-05-28',
    content: `<h2>Модальные глаголы: can, must, should, may</h2>
<p><strong>Модальные глаголы</strong> выражают возможность, необходимость, разрешение или рекомендацию. Они не изменяются по лицам и числам, после них стоит глагол без to (кроме ought to).</p>
<h2>Значения и употребление</h2>
<table border="1" cellpadding="8">
<tr><th>Глагол</th><th>Значение</th><th>Пример</th></tr>
<tr><td>can</td><td>умение, возможность</td><td>I can swim.</td></tr>
<tr><td>could</td><td>прошедшее умение, вежл. просьба</td><td>She could dance. Could you help?</td></tr>
<tr><td>must</td><td>обязанность (строгая)</td><td>You must be quiet.</td></tr>
<tr><td>should</td><td>совет, рекомендация</td><td>You should eat vegetables.</td></tr>
<tr><td>may</td><td>разрешение, возможность</td><td>May I come in?</td></tr>
</table>
<h2>Отрицание</h2>
<p>can't (cannot) — нельзя, не умею.<br>
mustn't — запрет (нельзя!).<br>
don't have to — не обязан (но можно).</p>
<h2>Задания</h2>
<p>1. Заполни: ___ I open the window? (вежливая просьба)<br>2. Переведи: Тебе не следует курить.<br>3. can или may: «Я умею плавать» / «Ты можешь войти».</p>
<p><em>Ответы: Could/May; You shouldn't smoke; can / may.</em></p>`
  },
  {
    subject: 'angliiskiy-yazyk', klass: 5, topicSlug: 'articles', publishedAt: '2026-05-28',
    content: `<h2>Артикли: a/an, the, нулевой</h2>
<p>Артикли — маленькие слова перед существительными, которые показывают, конкретный это предмет или любой из многих.</p>
<h2>Неопределённый артикль a/an</h2>
<p>Используется с исчисляемыми существительными в единственном числе, когда речь идёт о любом предмете.</p>
<p>a — перед согласным звуком: a cat, a university [j...]<br>
an — перед гласным звуком: an apple, an hour [aʊ...]</p>
<h2>Определённый артикль the</h2>
<p>Используется, когда предмет уже известен или единственный в своём роде:</p>
<p>I saw a dog. The dog was barking. (второй раз — уже известно)<br>
The Sun, the Moon, the Earth. The Thames.</p>
<h2>Нулевой артикль</h2>
<p>Не ставится перед: именами (Tom), городами (Moscow), странами (Russia — кроме The USA, The UK), языками (English), абстрактными понятиями (love, peace).</p>
<h2>Задания</h2>
<p>1. Вставь a, an или the: ___ moon, ___ egg, ___ book I gave you.<br>2. Нужен ли артикль: «I live in ___ France».<br>3. Составь два предложения с a и the для одного слова.</p>
<p><em>Ответы: the moon, an egg, the book; нет (France без артикля).</em></p>`
  },
  // Английский 9 класс
  {
    subject: 'angliiskiy-yazyk', klass: 9, topicSlug: 'perfect-tenses', publishedAt: '2026-05-29',
    content: `<h2>Perfect Tenses — Времена группы Perfect</h2>
<p>Времена Perfect выражают связь прошлого с настоящим или показывают завершённость действия к определённому моменту.</p>
<h2>Present Perfect</h2>
<p>have/has + V₃ (Past Participle)</p>
<p>Когда: опыт жизни, результат важен сейчас, только что случилось.</p>
<p>Маркеры: just, already, yet, ever, never, recently, for, since.</p>
<p>I have just finished the test. Have you ever been to Paris?</p>
<h2>Past Perfect</h2>
<p>had + V₃ — действие завершилось ДО другого прошедшего момента.</p>
<p>When I arrived, she had already left.</p>
<h2>Future Perfect</h2>
<p>will have + V₃ — завершится к будущему моменту.</p>
<p>By 5 pm I will have finished the work.</p>
<h2>Present Perfect vs Past Simple</h2>
<table border="1" cellpadding="8">
<tr><th>Present Perfect</th><th>Past Simple</th></tr>
<tr><td>Время не указано</td><td>Конкретное время: yesterday, in 2010</td></tr>
<tr><td>I've seen the film.</td><td>I saw the film last night.</td></tr>
</table>
<h2>Задания</h2>
<p>1. Present Perfect или Past Simple: She (live) in London for 5 years / She (live) in Paris in 2015.<br>2. Past Perfect: When I came home, they (eat) dinner.</p>
<p><em>Ответы: has lived; lived; had eaten.</em></p>`
  },
  {
    subject: 'angliiskiy-yazyk', klass: 9, topicSlug: 'passive-voice', publishedAt: '2026-05-29',
    content: `<h2>Passive Voice — Страдательный залог</h2>
<p>Passive Voice используется, когда важно само действие, а не тот, кто его совершает.</p>
<h2>Образование: be + V₃</h2>
<table border="1" cellpadding="8">
<tr><th>Время</th><th>Active</th><th>Passive</th></tr>
<tr><td>Present Simple</td><td>They build houses.</td><td>Houses are built.</td></tr>
<tr><td>Past Simple</td><td>They built a bridge.</td><td>A bridge was built.</td></tr>
<tr><td>Future Simple</td><td>They will finish it.</td><td>It will be finished.</td></tr>
<tr><td>Present Perfect</td><td>They have done it.</td><td>It has been done.</td></tr>
<tr><td>Present Continuous</td><td>They are making it.</td><td>It is being made.</td></tr>
</table>
<h2>By + агент</h2>
<p>Кто совершил действие, указывается с by: The book was written by Tolstoy.</p>
<h2>Задания</h2>
<p>1. Переведи в пассивный залог: People speak English all over the world.<br>2. The letter (write) yesterday. Поставь в нужную форму.<br>3. Составь предложение: (The Eiffel Tower / build / 1889).</p>
<p><em>Ответы: English is spoken all over the world; was written; The Eiffel Tower was built in 1889.</em></p>`
  },
  {
    subject: 'angliiskiy-yazyk', klass: 9, topicSlug: 'conditionals', publishedAt: '2026-05-29',
    content: `<h2>Условные предложения (Conditionals)</h2>
<p>Условные предложения выражают гипотетические ситуации и их последствия.</p>
<h2>Zero Conditional — реальные факты</h2>
<p>If + Present Simple, Present Simple<br>
If water reaches 100°C, it boils.</p>
<h2>First Conditional — реальное условие в будущем</h2>
<p>If + Present Simple, will + V<br>
If it rains tomorrow, I will stay home.</p>
<h2>Second Conditional — нереальное в настоящем</h2>
<p>If + Past Simple, would + V<br>
If I had a million dollars, I would travel the world. (у меня нет)</p>
<h2>Third Conditional — нереальное в прошлом</h2>
<p>If + Past Perfect, would have + V₃<br>
If she had studied, she would have passed the exam. (она не учила)</p>
<h2>Mixed Conditionals</h2>
<p>Смешение 2-го и 3-го: If I had been born in London (3rd), I would speak English perfectly (2nd).</p>
<h2>Задания</h2>
<p>1. Заполни: If I ___ (be) taller, I ___ (play) basketball.<br>2. 1st conditional: If you study hard, ___.<br>3. Определи тип: «If they had come earlier, we would have met them.»</p>
<p><em>Ответы: were, would play; you will pass; Third Conditional.</em></p>`
  },
  {
    subject: 'angliiskiy-yazyk', klass: 9, topicSlug: 'reported-speech', publishedAt: '2026-05-29',
    content: `<h2>Косвенная речь (Reported Speech)</h2>
<p>Косвенная речь передаёт слова другого человека без дословного цитирования.</p>
<h2>Сдвиг времён (Backshift)</h2>
<table border="1" cellpadding="8">
<tr><th>Прямая речь</th><th>Косвенная речь</th></tr>
<tr><td>Present Simple</td><td>Past Simple</td></tr>
<tr><td>Past Simple</td><td>Past Perfect</td></tr>
<tr><td>Present Perfect</td><td>Past Perfect</td></tr>
<tr><td>will</td><td>would</td></tr>
<tr><td>can</td><td>could</td></tr>
</table>
<h2>Сдвиг местоимений и обстоятельств</h2>
<p>I → he/she; my → his/her; today → that day; tomorrow → the next day; here → there.</p>
<h2>Примеры</h2>
<p>«I am tired.» → She said she was tired.<br>
«Come here!» → He told me to come there.<br>
«Are you ready?» → She asked if I was ready.</p>
<h2>Задания</h2>
<p>1. Переведи в косвенную: «I will help you tomorrow», he said.<br>2. «Don't be late!», the teacher said. → The teacher told us ___.<br>3. «Where do you live?» she asked → She asked ___.</p>
<p><em>Ответы: He said he would help me the next day; not to be late; where I lived.</em></p>`
  },
  {
    subject: 'angliiskiy-yazyk', klass: 9, topicSlug: 'gerund-infinitive', publishedAt: '2026-05-29',
    content: `<h2>Герундий и инфинитив</h2>
<p>Многие глаголы требуют после себя либо герундий (V+ing), либо инфинитив (to+V), а некоторые — оба варианта с разным значением.</p>
<h2>Глаголы только с герундием</h2>
<p>enjoy, finish, avoid, suggest, mind, consider, practise, keep, deny:<br>
I enjoy swimming. She finished reading.</p>
<h2>Глаголы только с инфинитивом</h2>
<p>want, hope, decide, agree, promise, offer, refuse, learn:<br>
He wants to travel. They decided to stay.</p>
<h2>Глаголы с обоими (без изменения смысла)</h2>
<p>start, begin, continue, like, love, hate:<br>
She started singing / to sing.</p>
<h2>Глаголы с изменением смысла</h2>
<p>remember/forget/stop/try:<br>
I remember meeting her (помню, что встречал) vs I must remember to call (должен не забыть позвонить).</p>
<h2>Задания</h2>
<p>1. Выбери форму: I enjoy (swim/to swim).<br>2. She decided (go/going) to Paris.<br>3. Переведи: «Он перестал курить.» и «Он остановился, чтобы купить газету.»</p>
<p><em>Ответы: swimming; to go; He stopped smoking; He stopped to buy a newspaper.</em></p>`
  },
  {
    subject: 'angliiskiy-yazyk', klass: 9, topicSlug: 'oge-english', publishedAt: '2026-05-29',
    content: `<h2>Подготовка к ОГЭ по английскому языку</h2>
<p>ОГЭ по английскому состоит из 4 разделов: аудирование, чтение, грамматика/лексика и письмо + устная часть (по желанию).</p>
<h2>Структура экзамена</h2>
<table border="1" cellpadding="8">
<tr><th>Раздел</th><th>Задания</th><th>Баллы</th></tr>
<tr><td>Аудирование</td><td>11 заданий</td><td>20</td></tr>
<tr><td>Чтение</td><td>9 заданий</td><td>18</td></tr>
<tr><td>Грамматика</td><td>15 заданий</td><td>20</td></tr>
<tr><td>Письмо</td><td>2 задания (письмо+эссе)</td><td>18</td></tr>
</table>
<h2>Советы по аудированию</h2>
<p>Читай задания до прослушивания. Слушай общий смысл, а не отдельные слова. Обращай внимание на ключевые слова в вопросах.</p>
<h2>Письменные задания</h2>
<p><strong>Личное письмо:</strong> ответь на все вопросы друга, задай 2–3 своих вопроса. Используй неформальный стиль.<br>
<strong>Эссе:</strong> выражай своё мнение с аргументами, контраргументами и выводом.</p>
<h2>Часто проверяемая грамматика</h2>
<p>Времена, пассивный залог, условные предложения, косвенная речь, модальные глаголы, артикли.</p>`
  },
  // Английский 11 класс
  {
    subject: 'angliiskiy-yazyk', klass: 11, topicSlug: 'complex-grammar', publishedAt: '2026-05-29',
    content: `<h2>Сложные грамматические конструкции</h2>
<p>Для высшего балла на ЕГЭ нужно владеть сложными конструкциями, которые делают речь богаче и точнее.</p>
<h2>Сослагательное наклонение (Subjunctive Mood)</h2>
<p>Используется в официальных требованиях: I suggest that he <strong>be</strong> present. It is necessary that she <strong>come</strong> early.</p>
<h2>Инверсия</h2>
<p>Изменение порядка слов для усиления:<br>
Never have I seen such a film. (отрицательное наречие — инверсия)<br>
Hardly had she left when he called.<br>
Not only did he win, but he also set a record.</p>
<h2>Эмфатические конструкции</h2>
<p>It was John who broke the window. (именно Джон)<br>
What I need is a good rest.</p>
<h2>Participle Clauses</h2>
<p>Having finished the work, she went home. (= After she had finished)<br>
Built in 1889, the tower attracts millions. (= Because it was built)</p>
<h2>Задания</h2>
<p>1. Перефразируй с инверсией: I have never heard such a story.<br>2. Составь предложение с инверсией: Hardly/no sooner.<br>3. Перефразируй: After she had called him, she felt better.</p>
<p><em>Ответы: Never have I heard such a story; Hardly had he arrived when it started; Having called him, she felt better.</em></p>`
  },
  {
    subject: 'angliiskiy-yazyk', klass: 11, topicSlug: 'ege-english-writing', publishedAt: '2026-05-29',
    content: `<h2>Письмо на ЕГЭ по английскому языку</h2>
<p>ЕГЭ включает два письменных задания: личное письмо (Task 1) и развёрнутое письменное высказывание — эссе (Task 2).</p>
<h2>Task 1: Личное письмо</h2>
<p>Объём: 100–140 слов. Неформальный стиль. Нужно ответить на все вопросы и задать 2–3 своих.</p>
<p>Структура: приветствие → благодарность за письмо → ответы на вопросы → свои вопросы → прощание.</p>
<h2>Task 2: Эссе</h2>
<p>Объём: 200–250 слов. Структура:<br>
1. Введение (тема + своя позиция)<br>
2. Аргументы «за» (2–3)<br>3. Аргументы «против» (1–2) + опровержение<br>4. Вывод</p>
<h2>Клише для эссе</h2>
<p>«In my opinion…», «To begin with…», «Furthermore/Moreover…», «On the other hand…», «However…», «To sum up…», «All in all…»</p>
<h2>Критерии оценивания</h2>
<p>Коммуникативная задача, организация текста, лексика, грамматика.</p>
<h2>Частые ошибки</h2>
<p>Выход за рамки объёма, неформальные сокращения в эссе (don't→do not), слабая связь между абзацами.</p>`
  },
  {
    subject: 'angliiskiy-yazyk', klass: 11, topicSlug: 'ege-english-speaking', publishedAt: '2026-05-29',
    content: `<h2>Устная часть ЕГЭ по английскому</h2>
<p>Устная часть ЕГЭ состоит из 4 заданий и длится около 15 минут.</p>
<h2>Задание 1: Чтение вслух</h2>
<p>Читаем небольшой текст. Оценивается произношение, интонация, беглость. Готовьтесь читать незнакомые слова по правилам чтения.</p>
<h2>Задание 2: Вопросы по объявлению</h2>
<p>Задаём 5 вопросов по объявлению/плакату. Формулируем полные вопросы с вспомогательным глаголом.</p>
<h2>Задание 3: Описание фотографии</h2>
<p>Описываем одну из двух фотографий по плану:<br>
— Where/when: Where the photo was taken...<br>
— What/who: There are..., In the foreground...<br>
— Action: They seem to be...<br>
— Atmosphere: The atmosphere is.../ It looks...<br>
— Why you chose it.</p>
<h2>Задание 4: Сравнение двух фотографий</h2>
<p>Сравниваем, находим сходства и различия, выражаем предпочтение. Используем: both, while, whereas, unlike, in contrast.</p>
<h2>Полезные фразы</h2>
<p>«The photo shows...», «In the background/foreground I can see...», «It seems like they are...», «I prefer this photo because...»</p>`
  },
  // Физика 7 класс missing
  {
    subject: 'fizika', klass: 7, topicSlug: 'fizicheskie-velichiny', publishedAt: '2026-05-30',
    content: `<h2>Физические величины и измерения</h2>
<p>Физика — наука о природе. Всё в ней описывается через <strong>физические величины</strong> — количественные характеристики свойств тел и явлений.</p>
<h2>Система СИ</h2>
<p>Международная система единиц (СИ) — стандарт для измерений в науке. Основные единицы:</p>
<table border="1" cellpadding="8">
<tr><th>Величина</th><th>Единица</th><th>Обозначение</th></tr>
<tr><td>Длина</td><td>метр</td><td>м</td></tr>
<tr><td>Масса</td><td>килограмм</td><td>кг</td></tr>
<tr><td>Время</td><td>секунда</td><td>с</td></tr>
<tr><td>Температура</td><td>кельвин</td><td>К</td></tr>
<tr><td>Сила тока</td><td>ампер</td><td>А</td></tr>
</table>
<h2>Измерительные приборы</h2>
<p>Каждый прибор имеет цену деления. Для линейки: 1 мм; для весов: зависит от типа; для термометра: 1°С или 0,5°С.</p>
<h2>Погрешность измерения</h2>
<p>Ни одно измерение не является абсолютно точным. Погрешность ≈ половина цены деления прибора.</p>
<h2>Задания</h2>
<p>1. Какова цена деления линейки с делениями через 1 мм?<br>2. Переведи в СИ: 5 км, 30 мин, 200 г.<br>3. Термометр показывает 37,4°С. Цена деления 0,2°С. Погрешность?</p>
<p><em>Ответы: 1 мм; 5000 м, 1800 с, 0,2 кг; 0,1°С.</em></p>`
  },
  {
    subject: 'fizika', klass: 7, topicSlug: 'mekhanika-dvizheniya', publishedAt: '2026-05-30',
    content: `<h2>Механическое движение</h2>
<p><strong>Механическое движение</strong> — изменение положения тела в пространстве относительно других тел с течением времени.</p>
<h2>Основные понятия</h2>
<p><strong>Траектория</strong> — линия, описываемая телом при движении.<br>
<strong>Путь (s)</strong> — длина траектории, скалярная величина. СИ: метр.<br>
<strong>Перемещение</strong> — вектор из начального положения в конечное.</p>
<h2>Равномерное движение</h2>
<p>Тело проходит равные пути за равные промежутки времени.</p>
<p>v = s/t — скорость, единица СИ: м/с.</p>
<h2>Графики равномерного движения</h2>
<p>График s(t) — прямая линия через начало координат.<br>
График v(t) — горизонтальная прямая (v = const).</p>
<h2>Перевод единиц скорости</h2>
<p>1 км/ч = 1000/3600 м/с = 1/3,6 м/с.<br>
36 км/ч = 10 м/с; 72 км/ч = 20 м/с.</p>
<h2>Задачи</h2>
<p>1. Велосипедист едет со скоростью 15 км/ч. Путь за 2 ч?<br>2. Поезд проехал 600 км за 5 ч. Средняя скорость?<br>3. Перевести: 108 км/ч = ? м/с.</p>
<p><em>Ответы: 30 км; 120 км/ч; 30 м/с.</em></p>`
  },
  {
    subject: 'fizika', klass: 7, topicSlug: 'sila', publishedAt: '2026-05-30',
    content: `<h2>Силы в природе</h2>
<p><strong>Сила</strong> — векторная физическая величина, характеризующая действие одного тела на другое. Единица: ньютон (Н).</p>
<h2>Сила тяжести</h2>
<p>Притяжение к Земле: F_g = mg, где m — масса тела (кг), g ≈ 9,8 м/с² ≈ 10 м/с².</p>
<p>Например, тело m = 2 кг: F_g = 2·10 = 20 Н.</p>
<h2>Сила упругости</h2>
<p>Возникает при деформации: пружина, сжатый газ. Закон Гука: F_упр = k·x, где k — жёсткость (Н/м), x — деформация (м).</p>
<h2>Сила трения</h2>
<p>Возникает при движении или попытке движения. Приложена в направлении, противоположном движению.</p>
<p>F_тр = μ·N, где μ — коэффициент трения, N — сила нормальной реакции.</p>
<h2>Векторное сложение сил</h2>
<p>Если силы сонаправлены: F_рез = F₁ + F₂.<br>
Если силы противоположны: F_рез = |F₁ − F₂|, в сторону большей.</p>
<h2>Задачи</h2>
<p>1. Масса мяча 200 г. Сила тяжести?<br>2. Жёсткость пружины 500 Н/м. Деформация 4 см. Сила упругости?<br>3. Две силы 8 Н и 12 Н направлены в одну сторону. Равнодействующая?</p>
<p><em>Ответы: 2 Н; 20 Н; 20 Н.</em></p>`
  },
  {
    subject: 'fizika', klass: 7, topicSlug: 'arkhimed', publishedAt: '2026-05-30',
    content: `<h2>Архимедова сила</h2>
<p>Тело, погружённое в жидкость или газ, испытывает выталкивающую силу, называемую <strong>архимедовой (силой Архимеда)</strong>.</p>
<h2>Формула</h2>
<p>F_A = ρ_ж · g · V_погр</p>
<p>где ρ_ж — плотность жидкости (кг/м³), g ≈ 10 м/с², V_погр — объём погружённой части тела (м³).</p>
<h2>Условия плавания тел</h2>
<table border="1" cellpadding="8">
<tr><th>Условие</th><th>Поведение тела</th></tr>
<tr><td>F_A &lt; mg (ρ_т &gt; ρ_ж)</td><td>Тонет</td></tr>
<tr><td>F_A = mg (ρ_т = ρ_ж)</td><td>Плавает в толще</td></tr>
<tr><td>F_A &gt; mg (ρ_т &lt; ρ_ж)</td><td>Всплывает</td></tr>
</table>
<h2>Пример</h2>
<p>Кубик стали объёмом 100 см³ = 10⁻⁴ м³ в воде (ρ_воды = 1000 кг/м³):<br>
F_A = 1000 · 10 · 10⁻⁴ = 1 Н.<br>
Масса стали (ρ = 7800 кг/м³): m = 7800 · 10⁻⁴ = 0,78 кг, mg = 7,8 Н. 1 &lt; 7,8 → тонет.</p>
<h2>Задачи</h2>
<p>1. V тела = 200 см³ в воде. F_A = ?<br>2. Плотность тела 600 кг/м³. В воде — тонет или всплывает?<br>3. Деревянный брус на плаву. Объём 0,05 м³. Масса бруса?</p>
<p><em>Ответы: 2 Н; всплывает (600&lt;1000); m=ρV=500·0,05=25 кг.</em></p>`
  },
  {
    subject: 'fizika', klass: 7, topicSlug: 'rabota-moshhnost', publishedAt: '2026-05-30',
    content: `<h2>Механическая работа и мощность</h2>
<p>Механическая работа совершается, когда сила вызывает перемещение тела.</p>
<h2>Работа</h2>
<p>A = F · s · cos α, где F — сила (Н), s — путь (м), α — угол между силой и перемещением.</p>
<p>При α = 0° (сила вдоль движения): A = F · s. Единица: 1 Дж = 1 Н·м.</p>
<h2>КПД</h2>
<p>η = A_полезн / A_полн · 100%. КПД всегда меньше 100%.</p>
<h2>Мощность</h2>
<p>P = A/t — работа в единицу времени. Единица: Вт (ватт). 1 Вт = 1 Дж/с.</p>
<p>P = F · v (мощность через скорость и силу).</p>
<h2>Простые механизмы</h2>
<p>Рычаг, блок, наклонная плоскость — дают выигрыш в силе, но не в работе (золотое правило механики).</p>
<h2>Задачи</h2>
<p>1. Сила 50 Н, путь 10 м. A = ?<br>2. Работа 3000 Дж за 2 мин. P = ?<br>3. Подняли груз 200 Н на 5 м. Затрачено 1500 Дж. КПД = ?</p>
<p><em>Ответы: 500 Дж; 25 Вт; η = 1000/1500 = 67%.</em></p>`
  },
]

const content = fs.readFileSync(TARGET, 'utf8')
const insertPoint = content.lastIndexOf('  // Статьи генерируются автоматически')
const newCode = NEW_ARTICLES.map(a => `  {
    subject: '${a.subject}',
    klass: ${a.klass},
    topicSlug: '${a.topicSlug}',
    publishedAt: '${a.publishedAt}',
    content: \`${a.content.replace(/`/g, '\\`')}\`,
  },`).join('\n')
const updated = content.slice(0, insertPoint) + newCode + '\n  ' + content.slice(insertPoint)
fs.writeFileSync(TARGET, updated, 'utf8')
console.log(`✅ Добавлено ${NEW_ARTICLES.length} статей`)
