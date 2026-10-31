"""Read large event arrays without keeping a second, expanded Unicode copy in RAM."""
import json,sys,gzip

def shared_values(row):
 for key,value in row.items():
  if isinstance(value,str)and key in ['date','time','iso','endIso','source','timezone','city','place','address']:row[key]=sys.intern(value)
  elif key=='slots'and isinstance(value,list):row[key]=[sys.intern(v)if isinstance(v,str)else v for v in value]
 return row

def events(path,chunk_size=65536):
 decoder=json.JSONDecoder(object_hook=shared_values)
 with (gzip.open(path,'rt',encoding='utf-8')if path.suffix=='.gz'else path.open(encoding='utf-8'))as source:
  buffer='';started=False;need_value=True;eof=False
  while True:
   buffer=buffer.lstrip()
   if not buffer and not eof:buffer=source.read(chunk_size);eof=not bool(buffer);continue
   if not started:
    if not buffer.startswith('['):raise ValueError('Event snapshot must be an array')
    buffer=buffer[1:];started=True;continue
   if buffer.startswith(']'):
    if buffer[1:].strip()or source.read().strip():raise ValueError('Unexpected data after event array')
    return
   if not need_value:
    if not buffer.startswith(','):raise ValueError('Missing event separator')
    buffer=buffer[1:];need_value=True;continue
   try:row,end=decoder.raw_decode(buffer)
   except json.JSONDecodeError:
    if eof:raise
    more=source.read(chunk_size);eof=not bool(more);buffer+=more;continue
   if not isinstance(row,dict):raise ValueError('Event row must be an object')
   yield row;buffer=buffer[end:];need_value=False
