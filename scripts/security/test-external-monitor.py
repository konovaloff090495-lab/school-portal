import importlib.util,pathlib,datetime as dt
spec=importlib.util.spec_from_file_location('monitor',pathlib.Path(__file__).with_name('external-monitor.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
now=dt.datetime.now(dt.timezone.utc)
def fetch(label):return {'checked_at':now.isoformat(),'issues':[]} if label=='health' else True
assert m.inspect(fetch,now)==[]
f,send=m.transition({},[]);assert not send
previous={'fingerprint':f,'issues':[]};f,send=m.transition(previous,['heartbeat_unavailable']);assert send
assert not m.transition({'fingerprint':f,'issues':['heartbeat_unavailable']},['heartbeat_unavailable'])[1]
assert m.transition({'fingerprint':f,'issues':['heartbeat_unavailable']},[])[1]
def dead(label):raise OSError('synthetic outage; no network')
assert 'heartbeat_unavailable' in m.inspect(dead,now)
print('Independent monitor: outage detection, silent success, deduplication and recovery passed; no real messages sent')
