from common import *
import argparse,csv
parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');parser.add_argument('--date',default=dt.datetime.now(dt.timezone(dt.timedelta(hours=3))).date().isoformat());args=parser.parse_args()
config=json.loads((HERE/'config.json').read_text());pid=config['project_id'];gid=config['group_id'];indexes=config['region_indexes'];stamp=args.date
if args.check and (OUT/'topvisor'/stamp/'started.json').exists():
 print('A check was already attempted for this date; reading only, without another charge.',flush=True);args.check=False
params={'filters':[{'name':'id','operator':'EQUALS','values':[pid]}],'groups_ids':[gid],'regions_indexes':indexes,'do_snapshots':0}
if args.check:
 price=tv('get/positions_2/checker/price',params);save('topvisor/'+stamp+'/price.json',price);puser=next(iter(((price.get('data') or {}).get('result') or {}).get('pricesByUsers',{}).values()),{});cost=puser.get('price')
 bank=tv('get/bank_2/info',{'fields':['balance_all','balance_personal','balance_bonus','balance_tariff']});save('topvisor/'+stamp+'/balance-before.json',bank);balance=((bank.get('data') or {}).get('result') or {}).get('balance_all')
 if cost is None or balance is None or float(cost)>config['max_check_rub'] or float(balance)<float(cost):raise SystemExit('No check: unavailable estimate/balance or budget guard')
 started=tv('edit/positions_2/checker/go',params);save('topvisor/'+stamp+'/started.json',started);print('started',started.get('data') or started.get('error'),flush=True)
 # Bounded read-only polling; never launch a second paid check automatically.
 for attempt in range(12):
  time.sleep(8)
  progress=tv('get/projects_2/projects',{'filters':[{'name':'id','operator':'EQUALS','values':[pid]}],'fields':['id','status_positions','status_positions_percent']});save('topvisor/'+stamp+'/progress.json',progress)
  current=((progress.get('data') or {}).get('result') or [{}])[0]
  if str(current.get('status_positions'))=='0':break
 else:print('Rank check is still running; cells may be partial. Re-run positions.py without --check to read later.',flush=True)
kw=tv('get/keywords_2/keywords',{'project_id':pid,'fields':['id','name','group_id'],'filters':[{'name':'group_id','operator':'EQUALS','values':[gid]}],'limit':100});save('topvisor/'+stamp+'/keywords.json',kw)
allrows=[]
for searcher in config['searchers']:
 index=searcher['index'];r=tv('get/positions_2/history',{'project_id':pid,'regions_indexes':[index],'dates':[stamp],'show_headers':1,'show_exists_dates':1,'type_range':0,'filters':[{'name':'group_id','operator':'EQUALS','values':[gid]}],'limit':100});save('topvisor/'+stamp+'/history-'+searcher['name'].lower()+'.json',r)
 data=(r.get('data') or {}).get('result') or {};by={' '.join(str(k.get('name','')).lower().split()):k for k in data.get('keywords',[])}
 for item in config['queries']:
  k=by.get(' '.join(item['query'].lower().split()),{});pd=k.get('positionsData') or {};cells=[]
  for key,value in pd.items():
   if key.split(':')[-1]==str(index):cells.append({'qualified_key':key,**(value if isinstance(value,dict) else {'value':value})})
  position=None;status='not_reported'
  if cells:
   raw_position=cells[-1].get('position')
   if str(raw_position).isdigit() and 1<=int(raw_position)<=searcher['effective_top']:position=int(raw_position);status='found'
   elif raw_position=='--' or (str(raw_position).isdigit() and int(raw_position)>searcher['effective_top']):status='not_found_within_top'+str(searcher['effective_top'])
   else:status='unavailable'
  allrows.append({'query':item['query'],'engine':searcher['name'],'region_key':searcher['region_key'],'region_index':index,'effective_top':searcher['effective_top'],'check_date':stamp,'position':position,'cells':cells,'status':status,'retrieved_at':r['retrieved_at']})
save('topvisor/'+stamp+'/positions.json',allrows)
with (OUT/'topvisor'/stamp/'positions.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.DictWriter(f,fieldnames=allrows[0]);w.writeheader();w.writerows(allrows)
print('history',sum(x['status'] not in ('not_reported','unavailable') for x in allrows),'/',len(allrows),'rows',flush=True)
