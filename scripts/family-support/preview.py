#!/usr/bin/env python3
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
class Handler(SimpleHTTPRequestHandler):
 def translate_path(self,path):
  path=path.split('?',1)[0].lstrip('/')
  if '..' in Path(path).parts:return '/nonexistent'
  local=ROOT/'public'/path
  if local.exists():return str(local)
  return str(Path('/Users/dmitriikonovalov/claude/school-portal/public')/path)
 def log_message(self,*a):pass
ThreadingHTTPServer(('127.0.0.1',3214),Handler).serve_forever()
