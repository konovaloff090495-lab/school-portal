"""Public programme excerpts and explicit facts; never infer suitability from a censor."""
import re,datetime,html
from html.parser import HTMLParser
class Text(HTMLParser):
 def __init__(self):super().__init__();self.parts=[]
 def handle_data(self,data):self.parts.append(data)
def plain(value):
 p=Text();p.feed(str(value or''));return re.sub(r'\s+',' ',html.unescape(' '.join(p.parts)).replace('[HTML]','').replace('[/HTML]','')).strip()
def excerpt(text,limit=900):
 text=plain(text);text=re.sub(r'https?://\S+','',text)
 # Keep a bounded, attributed excerpt, not the full source article.
 if len(text)>limit:
  cut=text[:limit];n=max(cut.rfind('. '),cut.rfind('! '),cut.rfind('? '));text=cut[:n+1]if n>limit//2 else cut.rsplit(' ',1)[0]+'…'
 return text

def extract(text):
 text=plain(text);facts={};sentences=re.split(r'(?<=[.!?])\s+',text)
 patterns={'priceNote':r'билет.*(?:реб[её]н|взросл|семь|групп)|стоимост.*(?:материал|взросл|реб[её]н)|материалы.*(?:включ|оплачив)', 'attendanceNote':r'(?:сопровожд|вместе с родител|без родител|самостоятельно.*посещ|предварительн.*запис|регистраци)', 'result':r'(?:заберут|забрать|унесут|создадут|изготовят|сделают своими руками)', 'preparation':r'(?:необходим.*(?:навык|подготовк|взять)|не требуется.*опыт|с собой.*(?:взять|принести))'}
 for key,pattern in patterns.items():
  ss=[s for s in sentences if re.search(pattern,s,re.I)];
  if ss:facts[key]=excerpt(' '.join(ss[:2]),350)
 age=re.search(r'(?:для детей|возраст(?: участников)?|участники|дет(?:ям|и))\s*(?:от|:)?\s*(\d{1,2})\s*(?:до|[–—-])\s*(\d{1,2})\s*(?:лет|год)',text,re.I)
 if age and 0<=int(age[1])<=int(age[2])<=17:facts['recommendedAge']=[int(age[1]),int(age[2])];facts['recommendedAgeLabel']=age[1]+'–'+age[2]+' лет'
 else:
  age=re.search(r'(?:для детей|возраст(?: участников)?|детям)\s*(?:от|:)?\s*(\d{1,2})\s*(?:\+|лет)',text,re.I)
  if age and 0<=int(age[1])<=17:minimum='от 'in age[0].lower()or'+'in age[0];facts['recommendedAge']=[int(age[1]),17 if minimum else int(age[1])];facts['recommendedAgeLabel']=('от 'if minimum else'')+age[1]+' лет'
 declared=re.search(r'возраст(?: участников)?\s*[:—-]?\s*(\d{1,2})\s*\+',text,re.I)
 if declared:facts['declaredAdmissionAge']=int(declared[1])
 m=re.search(r'(?:продолжительность|длительность)\s*(?:занятия|программы|спектакля|экскурсии|мероприятия)?\s*[:—-]?\s*(\d{1,3})\s*(минут|мин\b|час)',text,re.I)
 if m:
  minutes=int(m[1])*(60 if m[2].startswith('час')else 1)
  extra=re.match(r'\s*(\d+)\s*мин',text[m.end():],re.I)if m[2].startswith('час')else None
  if extra:minutes+=int(extra[1])
  if 10<=minutes<=480:facts['durationMinutes']=minutes;facts['duration']=str(minutes)+' мин'
 if re.search(r'(?:все )?материалы\s+(?:включены\s+в\s+стоимость|входят\s+в\s+стоимость)|стоимость\s+включает\s+(?:все )?материалы',text,re.I):facts['materialsIncluded']=True
 if re.search(r'заб(?:рать|ерут|ерете)\s+(?:работу\s+)?(?:с\s+собой|домой)',text,re.I):facts['takeHome']=True
 if re.search(r'сопровождение\s+взрослого\s+обязательно|участие\s+только\s+с\s+родител',text,re.I):facts['adultRequired']=True
 if re.search(r'можно\s+(?:прийти|посетить)\s+без\s+(?:родител|сопровождения)',text,re.I):facts['independentAllowed']=True
 if re.search(r'онлайн[- ](?:мероприятие|выставка|трансляция|встреча)|виртуальная (?:книжная )?выставка|в онлайн[- ]формате',text,re.I):facts['setting']='online'
 elif re.search(r'на свежем воздухе|под открытым небом|на открытом воздухе|прогулка по улицам',text,re.I):facts['setting']='outdoor'
 # Indoor is not inferred merely from the institution's street address.
 elif re.search(r'в помещении|в закрытом помещении',text,re.I):facts['setting']='indoor'
 return facts

def culture(j,venue_id,source,checked):
 text=plain(j.get('text')or j.get('shortText'));facts=extract(text);place=next((p for p in j.get('places',[])if str(p.get('_id'))==str(venue_id)),None)
 facts.update({'about':excerpt(text),'contentSource':source,'contentChecked':checked,'sourceAgeRestriction':j.get('ageRestriction'),'priceMin':j.get('priceMin'),'priceMax':j.get('priceMax'),'bookingUrl':(place or{}).get('saleLink')or j.get('saleLink'),'seances':[]})
 for s in j.get('seances',[]):
  if str(s.get('placeId'))==str(venue_id)and(s.get('endDate')or s.get('startDate')or'')>=checked[:10]and(s.get('startDate')or'')<str(datetime.date.fromisoformat(checked[:10])+datetime.timedelta(days=370)):
   facts['seances'].append({k:s.get(k)for k in ['startDate','endDate']})
 facts['seances']=facts['seances'][:1500]
 if place and place.get('schedule'):facts['venueSchedule']=place['schedule']
 return facts
