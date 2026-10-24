import pathlib,tempfile,subprocess,os,sys,json,fcntl,time,threading,http.server
with tempfile.TemporaryDirectory(prefix='mailer-bridge-synthetic-') as raw:
    folder=pathlib.Path(raw);config=folder/'config.json';lock=folder/'handoff.lock';lock.touch();legacy=folder/'legacy.py';ready=folder/'ready'
    legacy.write_text("import json,sys,time,pathlib\nd=json.load(sys.stdin)\nif d.get('hold'):\n pathlib.Path(d['ready']).write_text('ready');time.sleep(0.4)\nprint(json.dumps({'status':'legacy','received':d.get('value')}))\n")
    settings={'mode':'legacy','lock':str(lock),'legacy_script':str(legacy),'legacy_db':str(folder/'old.sqlite3')};config.write_text(json.dumps(settings))
    client=pathlib.Path(__file__).parent/'mailer-client.py';env={**os.environ,'MAILER_BRIDGE_CONFIG':str(config)}
    result=subprocess.run([sys.executable,str(client),'enroll'],input=json.dumps({'value':'synthetic'}),capture_output=True,text=True,env=env,check=True)
    assert json.loads(result.stdout)=={'status':'legacy','received':'synthetic'}
    old=subprocess.Popen([sys.executable,str(client),'confirm'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=env,text=True)
    old.stdin.write(json.dumps({'hold':True,'ready':str(ready)}));old.stdin.close()
    for _ in range(100):
        if ready.exists():break
        time.sleep(0.01)
    assert ready.exists()
    with lock.open('r+') as fd:
        try:fcntl.flock(fd,fcntl.LOCK_EX|fcntl.LOCK_NB);raise AssertionError('Legacy action lost its inherited lock')
        except BlockingIOError:pass
    assert old.wait(timeout=3)==0
    observed=[]
    class Handler(http.server.BaseHTTPRequestHandler):
        def log_message(self,*args):pass
        def do_POST(self):
            assert self.headers['Authorization']=='Bearer synthetic-only'
            observed.append((self.path,json.loads(self.rfile.read(int(self.headers['Content-Length'])))))
            self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(b'{"status":"pending","token":"synthetic-only-token"}')
    server=http.server.HTTPServer(('127.0.0.1',0),Handler);thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    writer=folder/'writer.json';writer.write_text(json.dumps({'endpoint':'http://127.0.0.1:'+str(server.server_port),'ingest_token':'synthetic-only'}))
    with lock.open('r+') as fd:
        fcntl.flock(fd,fcntl.LOCK_EX)
        pending=subprocess.Popen([sys.executable,str(client),'enroll'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=env,text=True)
        pending.stdin.write(json.dumps({'email':'synthetic@example.invalid'}));pending.stdin.close();time.sleep(0.1);assert pending.poll() is None
        settings.update({'mode':'private','writer_config':str(writer)});config.write_text(json.dumps(settings));fcntl.flock(fd,fcntl.LOCK_UN)
    assert pending.wait(timeout=3)==0;assert json.loads(pending.stdout.read())['status']=='pending';assert len(observed)==1 and observed[0][0]=='/mail/enroll'
    rejected=subprocess.run([sys.executable,str(client),'status'],env=env,capture_output=True);assert rejected.returncode!=0 and len(observed)==1
    server.shutdown();thread.join()
print('Mailer bridge: old actions retain locks; handoff reloads mode atomically; private callbacks preserved; no subscriber-list access; local fake transport only.')
