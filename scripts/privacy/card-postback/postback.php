<?php
/* Same bank callback contract; protected durable receipt before acknowledging. */
header('Content-Type: text/plain; charset=utf-8');header('Cache-Control: no-store');umask(0077);
$base=getenv('PPM_PRIVATE_BASE')?getenv('PPM_PRIVATE_BASE'):dirname(__DIR__);
require_once $base.'/.privacy/postback-private.php';
if(!is_file($base.'/ppm_config.php')){http_response_code(503);echo 'temporarily unavailable';exit;}
require $base.'/ppm_config.php';
if(empty($KEY)||!isset($_GET['key'])||!hash_equals($KEY,(string)$_GET['key'])){http_response_code(403);echo 'forbidden';exit;}
function g($k,$max=120){$v=isset($_GET[$k])?trim((string)$_GET[$k]):'';$v=preg_replace('/[^\x20-\x7E\x{400}-\x{4FF}]/u','',$v);return mb_substr($v,0,$max);}
try{
 $lock=fopen($base.'/.privacy/postback.lock','c');if(!$lock||!flock($lock,LOCK_EX))throw new Exception('postback_busy');
 $rec=array('ts'=>date('c'),'status'=>strtolower(g('status',32)),'product'=>strtolower(g('product',32)),'order_id'=>g('order_id'),'click_id'=>g('click_id'),'source_code'=>g('source_code',200),'event_time'=>g('event_time',40),'pb_id'=>g('pb_id',40),'test'=>g('test',4)!==''?1:0,'ip'=>isset($_SERVER['REMOTE_ADDR'])?$_SERVER['REMOTE_ADDR']:'','dup'=>0,'raw_macro'=>0);
 foreach(array('order_id','click_id','source_code','product','event_time','pb_id') as $key)if(strpos($rec[$key],'{')!==false)$rec['raw_macro']=1;
 $dupKey=$rec['pb_id']!==''?'pb:'.$rec['pb_id']:'os:'.$rec['order_id'].':'.$rec['status'];$path=$base.'/ppm_postbacks.jsonl';
 if(is_file($path)){
  $old=fopen($path,'r');if(!$old)throw new Exception('postback_read_failed');
  while(($line=fgets($old))!==false){$row=ppm_decode_line($line);if(!$row)throw new Exception('postback_corrupt');$previous=isset($row['pb_id'])&&$row['pb_id']!==''?'pb:'.$row['pb_id']:'os:'.$row['order_id'].':'.$row['status'];if(($rec['order_id']!==''||$rec['pb_id']!=='')&&$previous===$dupKey){$rec['dup']=1;break;}}fclose($old);
 }
 require_once $base.'/.lead-vault/client.php';
 $payload=array('kind'=>'bank_postback','record'=>$rec,'_vault_notification'=>($rec['dup']||$rec['test'])?'silent':'normal');
 $rec['vault_id']=pv_capture($base.'/.lead-vault/config.json',$payload);
 $line=ppm_encode_line($rec);$file=fopen($path,'a');if(!$file)throw new Exception('postback_write_failed');chmod($path,0600);$ok=fwrite($file,$line)===strlen($line)&&fflush($file);fclose($file);if(!$ok)throw new Exception('postback_write_failed');
 flock($lock,LOCK_UN);fclose($lock);http_response_code(200);echo 'OK';
}catch(Exception $error){http_response_code(503);echo 'temporarily unavailable';}
