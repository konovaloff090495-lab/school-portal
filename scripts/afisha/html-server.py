"""Read-only HTML delivery: expand shared navigation before sending complete HTML."""
import http.server,pathlib,gzip,os,urllib.parse,functools,mimetypes,hashlib,threading
ROOT=pathlib.Path(os.environ.get('AFISHA_HTML_ROOT','/srv/portfolio/proschools/static/afisha/current'));NAV=os.environ.get('AFISHA_PREVIEW_NAV');PORT=int(os.environ.get('AFISHA_HTML_PORT','3199'))
@functools.lru_cache(maxsize=8)
def navigation(release,name):
 p=pathlib.Path(release)/'afisha/assets'/name;return gzip.decompress(p.with_name(p.name+'.gz').read_bytes())if p.with_name(p.name+'.gz').exists()else p.read_bytes()
@functools.lru_cache(maxsize=128)
def page_bytes(path,mtime,size,release):
 p=pathlib.Path(path);body=gzip.decompress(p.read_bytes())if p.suffix=='.gz'else p.read_bytes()
 if b'<!--ps-header-->'in body:body=body.replace(b'<!--ps-header-->',navigation(release,'header.html')).replace(b'<!--ps-footer-->',navigation(release,'footer.html'))
 return body,gzip.compress(body,compresslevel=4,mtime=0)
class Handler(http.server.BaseHTTPRequestHandler):
 protocol_version='HTTP/1.1'
 def do_HEAD(self):self.respond(head=True)
 def do_GET(self):self.respond()
 def respond(self,head=False):
  raw=urllib.parse.urlsplit(self.path)
  if raw.path=='/healthz':self.send_response(200);self.send_header('Content-Length','2');self.end_headers();self.wfile.write(b'ok')if not head else None;return
  root=ROOT.resolve();base=pathlib.Path(NAV).resolve()if NAV and raw.path.startswith('/site-navigation/')else root;p=(base/urllib.parse.unquote(raw.path).lstrip('/')).resolve()
  if not p.is_relative_to(base):self.send_error(404);return
  if p.is_dir():
   if not raw.path.endswith('/'):
    self.send_response(301);self.send_header('Location',raw.path+'/'+('?' +raw.query if raw.query else''));self.send_header('Content-Length','0');self.end_headers();return
   p=p/'index.html'
  target=p.with_name(p.name+'.gz')if p.with_name(p.name+'.gz').exists()else p
  if not target.is_file():self.send_error(404);return
  try:
   st=target.stat();body,zipped=page_bytes(str(target),st.st_mtime_ns,st.st_size,str(root));etag='"'+hashlib.sha256(body).hexdigest()[:24]+'"'
   if self.headers.get('If-None-Match')==etag:self.send_response(304);self.send_header('ETag',etag);self.send_header('Content-Length','0');self.end_headers();return
   encoded='gzip'in self.headers.get('Accept-Encoding','');output=zipped if encoded else body;self.send_response(200);self.send_header('Content-Type',(mimetypes.guess_type(str(p))[0]or'application/octet-stream')+('; charset=utf-8'if p.suffix in ['.html','.js','.css','.json']else''));self.send_header('Content-Length',str(len(output)));self.send_header('ETag',etag);self.send_header('Vary','Accept-Encoding');self.send_header('Cache-Control','public, max-age=120, must-revalidate');self.send_header('X-Content-Type-Options','nosniff');self.send_header('X-Afisha-HTML','shared')
   if encoded:self.send_header('Content-Encoding','gzip')
   self.end_headers()
   if not head:self.wfile.write(output)
  except (BrokenPipeError,ConnectionResetError):pass
  except Exception:self.send_error(503,'Page temporarily unavailable')
 def log_message(self,fmt,*args):pass
class BoundedServer(http.server.ThreadingHTTPServer):
 request_queue_size=128
 slots=threading.BoundedSemaphore(16)
 def process_request(self,request,client_address):
  if not self.slots.acquire(timeout=2):request.close();return
  try:super().process_request(request,client_address)
  except Exception:self.slots.release();raise
 def process_request_thread(self,request,client_address):
  try:super().process_request_thread(request,client_address)
  finally:self.slots.release()
 def get_request(self):
  request,address=super().get_request();request.settimeout(15);return request,address
BoundedServer(('127.0.0.1',PORT),Handler).serve_forever()
