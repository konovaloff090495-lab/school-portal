"""Local-only preview with the same programming/course precedence as Nginx."""
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse,unquote
ROOT=Path(__file__).resolve().parents[2]
class Handler(SimpleHTTPRequestHandler):
 def translate_path(self,path):
  clean=unquote(urlparse(path).path).lstrip('/')
  if '..' in Path(clean).parts:return str(ROOT/'work/programming/release/404.html')
  primary=ROOT/'work/programming/release'/clean
  if primary.exists():return str(primary)
  if clean.startswith('kursy/'):
   course=ROOT/'work/programming/course-release'/clean
   if course.exists():return str(course)
  return str(ROOT/'public'/clean)
 def log_message(self,*args):pass
if __name__=='__main__':ThreadingHTTPServer(('127.0.0.1',8769),Handler).serve_forever()
