// rf-subjects.mjs — карта «код субъекта РФ → наши города каталога».
// Общая для скриптов добора из реестра Рособрнадзора (rlic-all-cities,
// rlic-vechernie-eksternat): реестр ищет по субъекту, а каталог живёт по городам.
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// код субъекта РФ → наши города в нём. wholeSubject=true → субъект целиком = один
// наш «город» (федеральные + Московская область), привязку по адресу не делаем.
export const SUBJECTS = [
  { code: '50', whole: 'moskovskaya-oblast', name: 'Московская область' },
  { code: '54', cities: [['novosibirsk', 'Новосибирск']] },
  { code: '66', cities: [['ekaterinburg', 'Екатеринбург'], ['nizhniy-tagil', 'Нижний Тагил'], ['pervouralsk', 'Первоуральск'], ['kamensk-uralsky', 'Каменск-Уральский']] },
  { code: '16', cities: [['kazan', 'Казань'], ['naberezhnye-chelny', 'Набережные Челны'], ['nizhnekamsk', 'Нижнекамск'], ['almetyevsk', 'Альметьевск'], ['elabuga', 'Елабуга'], ['zelenodolsk', 'Зеленодольск']] },
  { code: '52', cities: [['nizhniy-novgorod', 'Нижний Новгород'], ['dzerzhinsk', 'Дзержинск']] },
  { code: '74', cities: [['chelyabinsk', 'Челябинск'], ['magnitogorsk', 'Магнитогорск'], ['zlatoust', 'Златоуст'], ['kopeysk', 'Копейск'], ['miass', 'Миасс']] },
  { code: '55', cities: [['omsk', 'Омск']] },
  { code: '63', cities: [['samara', 'Самара'], ['tolyatti', 'Тольятти']] },
  { code: '61', cities: [['rostov-na-donu', 'Ростов-на-Дону'], ['shakhty', 'Шахты'], ['taganrog', 'Таганрог'], ['novocherkassk', 'Новочеркасск']] },
  { code: '02', cities: [['ufa', 'Уфа'], ['sterlitamak', 'Стерлитамак'], ['neftekamsk', 'Нефтекамск'], ['salavat', 'Салават'], ['oktyabrsky', 'Октябрьский']] },
  { code: '23', cities: [['krasnodar', 'Краснодар'], ['sochi', 'Сочи'], ['novorossiysk', 'Новороссийск'], ['armavir', 'Армавир']] },
  { code: '59', cities: [['perm', 'Пермь']] },
  { code: '36', cities: [['voronezh', 'Воронеж']] },
  { code: '34', cities: [['volgograd', 'Волгоград'], ['volzhsky', 'Волжский']] },
  { code: '24', cities: [['krasnoyarsk', 'Красноярск'], ['norilsk', 'Норильск'], ['achinsk', 'Ачинск']] },
  { code: '64', cities: [['saratov', 'Саратов'], ['engels', 'Энгельс'], ['balakovo', 'Балаково']] },
  { code: '70', cities: [['tomsk', 'Томск']] },
  { code: '18', cities: [['izhevsk', 'Ижевск']] },
  { code: '22', cities: [['barnaul', 'Барнаул'], ['biysk', 'Бийск']] },
  { code: '73', cities: [['ulyanovsk', 'Ульяновск']] },
  { code: '38', cities: [['irkutsk', 'Иркутск'], ['bratsk', 'Братск'], ['angarsk', 'Ангарск']] },
  { code: '27', cities: [['khabarovsk', 'Хабаровск']] },
  { code: '25', cities: [['vladivostok', 'Владивосток'], ['nakhodka', 'Находка'], ['ussuriysk', 'Уссурийск']] },
  { code: '76', cities: [['yaroslavl', 'Ярославль'], ['rybinsk', 'Рыбинск']] },
  { code: '56', cities: [['orenburg', 'Оренбург']] },
  { code: '42', cities: [['kemerovo', 'Кемерово'], ['novokuznetsk', 'Новокузнецк'], ['prokopyevsk', 'Прокопьевск']] },
  { code: '62', cities: [['ryazan', 'Рязань']] },
  { code: '30', cities: [['astrakhan', 'Астрахань']] },
  { code: '48', cities: [['lipetsk', 'Липецк']] },
  { code: '71', cities: [['tula', 'Тула']] },
  { code: '43', cities: [['kirov', 'Киров']] },
  { code: '21', cities: [['cheboksary', 'Чебоксары']] },
  { code: '39', cities: [['kaliningrad', 'Калининград']] },
  { code: '32', cities: [['bryansk', 'Брянск']] },
  { code: '46', cities: [['kursk', 'Курск']] },
  { code: '26', cities: [['stavropol', 'Ставрополь'], ['pyatigorsk', 'Пятигорск']] },
  { code: '31', cities: [['belgorod', 'Белгород'], ['stary-oskol', 'Старый Оскол']] },
  { code: '29', cities: [['arkhangelsk', 'Архангельск'], ['severodvinsk', 'Северодвинск']] },
  { code: '33', cities: [['vladimir', 'Владимир'], ['kovrov', 'Ковров'], ['murom', 'Муром']] },
  { code: '67', cities: [['smolensk', 'Смоленск']] },
  { code: '03', cities: [['ulan-ude', 'Улан-Удэ']] },
  { code: '44', cities: [['kostroma', 'Кострома']] },
  { code: '35', cities: [['vologda', 'Вологда'], ['cherepovets', 'Череповец']] },
  { code: '45', cities: [['kurgan', 'Курган']] },
  { code: '72', cities: [['tyumen', 'Тюмень']] },
  { code: '86', cities: [['nizhnevartovsk', 'Нижневартовск'], ['surgut', 'Сургут'], ['nefteyugansk', 'Нефтеюганск'], ['khanty-mansiysk', 'Ханты-Мансийск']] },
  { code: '15', cities: [['vladikavkaz', 'Владикавказ']] },
  { code: '11', cities: [['syktyvkar', 'Сыктывкар'], ['ukhta', 'Ухта'], ['vorkuta', 'Воркута']] },
  { code: '10', cities: [['petrozavodsk', 'Петрозаводск']] },
  { code: '05', cities: [['makhachkala', 'Махачкала'], ['derbent', 'Дербент']] },
  { code: '58', cities: [['penza', 'Пенза']] },
  { code: '37', cities: [['ivanovo', 'Иваново']] },
  { code: '69', cities: [['tver', 'Тверь']] },
  { code: '51', cities: [['murmansk', 'Мурманск']] },
  { code: '40', cities: [['kaluga', 'Калуга'], ['obninsk', 'Обнинск']] },
  { code: '20', cities: [['grozny', 'Грозный']] },
  { code: '75', cities: [['chita', 'Чита']] },
  { code: '57', cities: [['orel', 'Орёл']] },
  { code: '91', cities: [['simferopol', 'Симферополь'], ['kerch', 'Керчь'], ['yalta', 'Ялта']] },
  { code: '53', cities: [['veliky-novgorod', 'Великий Новгород']] },
  { code: '68', cities: [['tambov', 'Тамбов']] },
  { code: '60', cities: [['pskov', 'Псков']] },
  { code: '19', cities: [['abakan', 'Абакан']] },
  { code: '41', cities: [['petropavlovsk-kamchatsky', 'Петропавловск-Камчатский']] },
  { code: '65', cities: [['yuzhno-sakhalinsk', 'Южно-Сахалинск']] },
  { code: '07', cities: [['nalchik', 'Нальчик']] },
  { code: '28', cities: [['blagoveshchensk', 'Благовещенск']] },
  { code: '08', cities: [['elista', 'Элиста']] },
  { code: '12', cities: [['yoshkar-ola', 'Йошкар-Ола']] },
  { code: '13', cities: [['saransk', 'Саранск']] },
  { code: '14', cities: [['yakutsk', 'Якутск']] },
  { code: '09', cities: [['cherkessk', 'Черкесск']] },
  { code: '01', cities: [['maykop', 'Майкоп']] },
  { code: '49', cities: [['magadan', 'Магадан']] },
  { code: '89', cities: [['novy-urengoy', 'Новый Уренгой']] },
]

// подмешиваем новые города 100k+ (add-cities-100k.mjs) в их субъекты
try {
  const extra = JSON.parse(readFileSync(path.join(__dirname, '..', 'new-cities-100k.json'), 'utf8'))
  for (const { slug, name, code } of extra) {
    let subj = SUBJECTS.find(s => s.code === code)
    if (!subj) { subj = { code, cities: [] }; SUBJECTS.push(subj) }
    if (!subj.cities) subj.cities = []           // whole-subject не бывает у новых
    if (!subj.cities.some(c => c[0] === slug)) subj.cities.push([slug, name])
  }
} catch { /* файла нет — работаем без новых */ }


