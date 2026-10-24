<?php
/* Private, PHP5.6-compatible bank event storage. No decryption key in public_html. */
function ppm_private_base(){return getenv('PPM_PRIVATE_BASE')?getenv('PPM_PRIVATE_BASE'):dirname(dirname(__FILE__));}
require_once ppm_private_base().'/.privacy/pii-fields.php';
function ppm_field_key(){static $key=null;if($key===null)$key=pf_load(ppm_private_base().'/.privacy/fields.key');return $key;}
function ppm_decode_line($line){$row=json_decode($line,true);if(is_array($row)&&isset($row['format'])&&$row['format']==='pf-jsonl-v1')$row=json_decode(pf_open(ppm_field_key(),$row['data'],'cardopen.postback'),true);return is_array($row)?$row:null;}
function ppm_encode_line($row){$json=json_encode($row,JSON_UNESCAPED_UNICODE);if($json===false)throw new Exception('postback_json_invalid');return json_encode(array('format'=>'pf-jsonl-v1','data'=>pf_seal(ppm_field_key(),$json,'cardopen.postback')),JSON_UNESCAPED_UNICODE)."\n";}
