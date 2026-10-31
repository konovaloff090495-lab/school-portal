"""Permanent search entry points backed by the same filters as the catalogue."""
import re,datetime,hashlib
from zoneinfo import ZoneInfo
TOPICS={'risovanie':{'title':'Рисование','pattern':r'рисован|рисунк|акварел|живопис'},'keramika':{'title':'Керамика и лепка','pattern':r'керамик|гончар|лепк|из глины'},'kulinariya':{'title':'Кулинария','pattern':r'кулинар|приготов.*(?:блюд|пицц|десерт)|выпечк'},'nauka':{'title':'Научные опыты','pattern':r'научн.*(?:опыт|эксперимент)|физическ.*опыт|химическ.*опыт'},'robototekhnika':{'title':'Робототехника','pattern':r'робототех|сборк.*робот|программирован'},'animatsiya':{'title':'Анимация и мультфильмы','pattern':r'создан.*мультфильм|анимац|мультипликац'}}
AGES=[str(n)+'-'+str(n)for n in range(18)]+['3-6','7-9','10-12','13-17']
def age_slug(age):
 lo,hi=age.split('-');return lo if lo==hi else age
def age_label(age):return age_slug(age).replace('-','–')
def prepare(events):
 for e in events:
  e['topics']=[k for k,v in TOPICS.items()if e['type']=='Мастер-классы'and re.search(v['pattern'],e['title']+' '+e.get('about',''),re.I)]
  e['venueSlug']='ploshchadka-'+hashlib.sha256((e['city']+'|'+e['place']+'|'+e['address']).encode()).hexdigest()[:14]
 return events

def bounds(mode,c):
 today=datetime.datetime.now(ZoneInfo(c.get('timezone')or'Europe/Moscow')).date()
 if mode=='novyy-god':
  year=today.year-1 if today.month==1 and today.day<=10 else today.year;return str(datetime.date(year,12,1)),str(datetime.date(year+1,1,10))
 if mode=='segodnya':return str(today),str(today)
 if mode=='zavtra':return str(today+datetime.timedelta(days=1)),str(today+datetime.timedelta(days=1))
 if mode=='vykhodnye':
  start=today+datetime.timedelta(days=-1 if today.weekday()==6 else(5-today.weekday())%7);return str(start),str(start+datetime.timedelta(days=1))
 return None,None

def select(items,c,cat=None,mode=None,age=None,topic=None,venue=None):
 rows=[e for e in items if not cat or cat in e.get('categories',[e['type']])]
 if mode in ['besplatno','free_weekend']:rows=[e for e in rows if e['priceData']['free_confirmed']]
 fr,to=bounds('vykhodnye'if mode=='free_weekend'else mode,c)
 if fr:
  def event_bounds(e):return bounds(mode,{'timezone':e.get('timezone')})if c.get('scope')=='country'and mode in ['segodnya','zavtra','vykhodnye']else(fr,to)
  def has(e):
   f,t=event_bounds(e);return any(f<=d['date']<=t for d in e['dates'])
  def period(e):
   f,t=event_bounds(e);return any(p['from']<=t and p['to']>=f for p in e.get('availablePeriods',[]))or(e['type']=='Выставки и музеи'and e.get('schedule',{}).get('mode')=='until'and(e['schedule'].get('primaryDate')or'')[:10]>=f)
  rows=[e for e in rows if has(e)or period(e)];rows.sort(key=lambda e:not has(e))
 if not fr:rows.sort(key=lambda e:(e.get('date')or'9999',e.get('time')or''))
 if fr:rows.sort(key=lambda e:next((d['date']+'T'+d['time']for d in e['dates']if fr<=d['date']<=to),'9999'))
 if mode=='novyy-god':rows=[e for e in rows if re.search(r'новогод|новый год|дед[а]? мороз|снегуроч|[её]лк|щелкунчик',e['title'],re.I)]
 if age:
  lo,hi=map(int,age.split('-'));rows=[e for e in rows if e.get('recommendedAge')and not e.get('ageConflict')and e['recommendedAge'][0]<=hi and e['recommendedAge'][1]>=lo and(e.get('ageRestriction')is None or e['ageRestriction']<=hi)]
 if topic:rows=[e for e in rows if topic in e.get('topics',[])]
 if venue:rows=[e for e in rows if e['venueSlug']==venue]
 return rows

def landing_specs(c,items,slugs,heads):
 yield '',None,None,None,None,None,'Афиша для детей '+c['inCity']
 for cat,slug in slugs.items():yield slug+'/',cat,None,None,None,None,heads[cat].replace('в Москве',c['inCity'])
 for cat in [None]+list(slugs):
  for mode,suffix in [('besplatno','бесплатно'),('vykhodnye','в выходные'),('segodnya','сегодня'),('zavtra','завтра')]:
   if cat and mode in ['segodnya','zavtra']:continue
   prefix=slugs[cat]+'/'if cat else'';title=(cat+' для детей'if cat else'Мероприятия для детей')+' '+suffix+' '+c['inCity'];yield prefix+mode+'/',cat,mode,None,None,None,title
 for cat in [None]+list(slugs):
  prefix=slugs[cat]+'/'if cat else'';yield prefix+'besplatno/vykhodnye/',cat,'free_weekend',None,None,None,(cat+' для детей'if cat else'Мероприятия для детей')+' бесплатно в выходные '+c['inCity']
 yield'novyy-god/',None,'novyy-god',None,None,None,'Новогодние мероприятия для детей '+c['inCity']
 for age in AGES:yield'dlya-detey-'+age_slug(age)+'-let/',None,None,age,None,None,'Мероприятия для детей '+age_label(age)+' лет '+c['inCity']
 for topic,v in TOPICS.items():yield'master-klassy/'+topic+'/', 'Мастер-классы',None,None,topic,None,v['title']+' для детей '+c['inCity']
 # National/region venue links lead to the venue's actual city, avoiding duplicate place pages.
 if c.get('scope')not in ['country','region']:
  for key,e in {e['venueSlug']:e for e in items if e.get('coordinates')}.items():yield'mesta/'+key+'/',None,None,None,None,key,'Детская афиша: '+e['place']+' · '+c['name']

def selection_copy(c,rows,mode=None,age=None,topic=None,venue=None):
 if mode in ['besplatno','free_weekend']:intro='В подборке только программы с подтверждённой бесплатностью. Запись, билет взрослому и дополнительные услуги проверяйте отдельно.'
 elif mode in ['vykhodnye','segodnya','zavtra','novyy-god']:
  fr,to=bounds('vykhodnye'if mode=='free_weekend'else mode,c);intro='Актуальные даты: '+fr+' — '+to+'. Сначала показаны события с опубликованными сеансами. Для выставок с периодом работы проверьте часы и допустимые дни посещения.'
 elif age:intro='Программы с указанной организатором возрастной аудиторией, пересекающейся с диапазоном '+age_label(age)+' лет. Ценз и рекомендация приведены отдельно; противоречивые сведения в точную выборку не включены.'
 elif topic:intro='Тема подборки: '+TOPICS[topic]['title']+'. Сравните действия участника, опубликованную длительность и результат занятия в карточке.'
 elif venue:intro='События одной площадки: '+(rows[0]['place']+'; '+rows[0]['address']if rows else'расписание уточняется')+'. Точка на карте показывает площадку; вход и доступность уточните перед поездкой.'
 else:intro='Выбирайте событие по интересам ребёнка, дате и месту. Подробности программы, возрастная аудитория, состав билета и способ записи приведены в карточках по опубликованным условиям.'
 places=list(dict.fromkeys(e['place']for e in rows));return intro+' В подборке '+str(len(rows))+' событий на '+str(len(places))+' площадках.'
