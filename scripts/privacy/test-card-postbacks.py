"""Synthetic bank callback, encrypted log, deduplication and outage checks."""
import pathlib,json,base64,secrets,sys,io
folder=pathlib.Path(__file__).resolve().parent
files={p.name:base64.b64encode(p.read_bytes()).decode() for p in (folder/'card-postback').glob('*.php')}
files['pii-fields.php']=base64.b64encode((folder/'pii-fields.php').read_bytes()).decode()
key={'v':1,'operator':'konovalov','site':'cardopen','material':base64.b64encode(secrets.token_bytes(64)).decode()}
sys.stdin=io.StringIO(json.dumps({'files':files,'key':key}))

import pathlib,tempfile,subprocess,json,sys,base64,os
os.umask(0o077);x=json.load(sys.stdin)
with tempfile.TemporaryDirectory(prefix='card-postback-synthetic-') as temp:
 root=pathlib.Path(temp);(root/'public_html').mkdir();(root/'.privacy').mkdir();(root/'.lead-vault').mkdir()
 for name,value in x['files'].items():
  p=root/'public_html/postback.php' if name=='postback.php' else root/'.privacy'/name;p.write_bytes(base64.b64decode(value))
  r=subprocess.run([os.environ.get('PHP_BINARY','php'),'-l',str(p)],capture_output=True);assert r.returncode==0,'PHP syntax: '+name
 (root/'.privacy/fields.key').write_text(json.dumps(x['key']));(root/'ppm_config.php').write_text("<?php $KEY='synthetic-key';")
 (root/'.lead-vault/client.php').write_text("<?php function pv_capture($path,$payload){if(is_file(dirname(dirname($path)).'/.fail-capture'))throw new Exception('synthetic');file_put_contents(dirname(dirname($path)).'/captured.jsonl',json_encode($payload).\"\\n\",FILE_APPEND);return 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';}")
 runner=root/'runner.php';runner.write_text("<?php putenv('PPM_PRIVATE_BASE='.$argv[1]);$_GET=json_decode($argv[2],true);$_SERVER['REMOTE_ADDR']='192.0.2.1';register_shutdown_function(function(){fwrite(STDERR,json_encode(array('status'=>http_response_code())));});require $argv[1].'/public_html/postback.php';")
 def call(query):
  r=subprocess.run([os.environ.get('PHP_BINARY','php'),'-d','display_errors=stderr',str(runner),str(root),json.dumps(query)],capture_output=True,text=True);assert r.returncode==0,r.stderr;return r.stdout,json.loads(r.stderr)['status']
 query={'key':'synthetic-key','order_id':'synthetic-order','status':'approved','click_id':'synthetic-click'}
 assert call(dict(query,key='wrong'))[1]==403;assert call(query)==('OK',200);assert call(query)==('OK',200)
 captured=[json.loads(x) for x in (root/'captured.jsonl').read_text().splitlines()];assert captured[0]['_vault_notification']=='normal' and captured[1]['_vault_notification']=='silent'
 log=(root/'ppm_postbacks.jsonl').read_text();assert 'synthetic-order' not in log and '192.0.2.1' not in log
 r=subprocess.run([os.environ.get('PHP_BINARY','php'),str(root/'.privacy/postback-export.php')],capture_output=True,text=True,env={**os.environ,'PPM_PRIVATE_BASE':str(root)});rows=[json.loads(x) for x in r.stdout.splitlines()];assert len(rows)==2 and rows[1]['dup']==1 and rows[0]['order_id']=='synthetic-order'
 (root/'.fail-capture').touch();assert call(dict(query,order_id='synthetic-new-order'))[1]==503;assert len((root/'ppm_postbacks.jsonl').read_text().splitlines())==2
 print(json.dumps({'php_binary':os.environ.get('PHP_BINARY','php'),'callback_contract':True,'deduplication':True,'encrypted_log':True,'authorized_export':True,'capture_failure_not_acknowledged':True,'actual_messages_sent':0}))
