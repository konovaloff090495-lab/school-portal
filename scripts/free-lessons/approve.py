#!/usr/bin/env python3
"""Add up to five source-verified records with unique local covers per review run."""
import argparse,json,hashlib,re
from pathlib import Path
from urllib.parse import urlsplit
from datetime import datetime
from update import ROOT,read,write,MSK

def approve(records,events,hosts,assets):
 assert 0<len(records)<=5,'At most five new records per review run';by={e['id']:e for e in events};hashes={hashlib.sha256((assets/e['cover'].lstrip('/')).read_bytes()).hexdigest() for e in events}
 for e in records:
  assert e['id'] not in by and re.fullmatch('[a-z0-9-]+',e['id'])
  assert e['kind'] in ['recording','appointment','scheduled'] and e['price']==0
  if e['id'].startswith('su-'):assert e['organizer']=='Лекторий Синергии' and urlsplit(e['sourceUrl']).hostname=='school-university.com' and e.get('slots')
  else:assert e['organizer']!='Лекторий Синергии'
  assert e.get('verification',{}).get('freeConfirmed') is True and e['verification'].get('childAudienceConfirmed') is True
  assert e.get('description') and len(e['description'])>=60 and e.get('topics') and e.get('freeScope')
  for field in ['sourceUrl','outboundUrl']:
   u=urlsplit(e[field]);assert u.scheme=='https' and u.hostname in hosts and not u.username and not u.password and u.port in [None,443]
  assert re.fullmatch('/besplatnye-uroki/zanyatiya/[a-z0-9-]+/',e['url']) and all(e['url']!=old['url'] for old in events)
  assert re.fullmatch('/besplatnye-uroki/assets/covers/[a-z0-9-]+[.]webp',e['cover'])
  p=assets/e['cover'].lstrip('/');assert p.is_file();h=hashlib.sha256(p.read_bytes()).hexdigest();assert h not in hashes;hashes.add(h)
  if e['kind']=='scheduled':
   from update import iso
   assert e.get('start') or e.get('slots');assert e.get('slots') or iso(e['start']).tzinfo
  e.setdefault('grades',[]);e.setdefault('ages',None);e.setdefault('duration',None);e.setdefault('start',None);e.setdefault('eventType','lesson');e.setdefault('format','online');e.setdefault('currency','RUB');e.setdefault('shortTitle',e['title']);e.setdefault('publicOrganizer','Бесплатные уроки' if e['id'].startswith('su-') else e['organizer']);e['checkedAt']=datetime.now(MSK).date().isoformat();e['status']='active';events.append(e);by[e['id']]=e
 return events
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('file',type=Path);a.add_argument('--state-dir',type=Path,required=True);a.add_argument('--assets-root',type=Path,required=True);args=a.parse_args();args.state_dir.mkdir(parents=True,exist_ok=True);import fcntl;lock=(args.state_dir/'pipeline.lock').open('w');fcntl.flock(lock,fcntl.LOCK_EX);events=read(args.state_dir/'catalog.json',[]);config=read(ROOT/'scripts/free-lessons/sources.json',{});records=read(args.file,[]);events=approve(records,events,config['allowedHosts'],args.assets_root);write(args.state_dir/'catalog.json',events);state=read(args.state_dir/'state.json',{});
 for e in records:state.get('pending',{}).pop(e['id'],None)
 write(args.state_dir/'state.json',state);print('Approved new records:',len(records))
