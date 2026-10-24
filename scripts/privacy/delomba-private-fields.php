<?php
/* Operational contact encryption; field key stays above public_html. PHP 5.6. */
function dlm_private_base() { return getenv('DELO_PRIVATE_DIR') ? getenv('DELO_PRIVATE_DIR') : dirname(dirname(__FILE__)) . '/.privacy'; }
function dlm_private_enabled() { return is_file(dlm_private_base() . '/enabled'); }
function dlm_fields() {
    static $key=null; if($key!==null)return $key;
    require_once dlm_private_base() . '/pii-fields.php';
    $key=pf_load(dlm_private_base() . '/fields.key');return $key;
}
function dlm_seal($value,$field) { if(!dlm_private_enabled())return $value;$key=dlm_fields();return pf_seal($key,$value,'deLomBa.'.$field); }
function dlm_open($value,$field) { if(strpos((string)$value,'pf1:')!==0)return $value;$key=dlm_fields();return pf_open($key,$value,'deLomBa.'.$field); }
function dlm_email_index($email) { $key=dlm_fields();return pf_index($key,strtolower(trim($email))); }
function dlm_private_fields($row) {
    if(!is_array($row))return $row;
    foreach(array('email','ip','ua','src','note','data','error') as $name)if(array_key_exists($name,$row))$row[$name]=dlm_open($row[$name],$name);
    return $row;
}
function dlm_private_rows($rows) { return array_map('dlm_private_fields',$rows); }
function dlm_encoded_record($row) {
    $json=json_encode($row,JSON_UNESCAPED_UNICODE);if($json===false)throw new Exception('private_json_invalid');
    return dlm_private_enabled() ? json_encode(array('format'=>'pf-json-v1','data'=>dlm_seal($json,'record')),JSON_UNESCAPED_UNICODE) : $json;
}
function dlm_read_record($file) {
    $raw=@file_get_contents($file);if($raw===false)return null;$row=json_decode($raw,true);
    if(is_array($row)&&isset($row['format'])&&$row['format']==='pf-json-v1')$row=json_decode(dlm_open($row['data'],'record'),true);
    return is_array($row)?$row:null;
}
function dlm_write_record($file,$row) {
    $data=dlm_encoded_record($row);$tmp=$file.'.incoming-'.bin2hex(openssl_random_pseudo_bytes(12));
    $f=@fopen($tmp,'x');if(!$f)return false;chmod($tmp,0400);
    $ok=fwrite($f,$data)===strlen($data)&&fflush($f);fclose($f);
    if(!$ok){@unlink($tmp);return false;}if(!@rename($tmp,$file)){@unlink($tmp);return false;}return true;
}
// New requests share this lock for their whole lifetime; migration takes exclusive access.
if(is_dir(dlm_private_base())){
 $GLOBALS['_dlm_private_lock']=fopen(dlm_private_base().'/handoff.lock','c');
 if(!$GLOBALS['_dlm_private_lock']||!flock($GLOBALS['_dlm_private_lock'],LOCK_SH))throw new Exception('private_store_busy');
}
