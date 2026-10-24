<?php
/* Legacy operational fields: PHP 5.6/OpenSSL compatible, separate site-scoped keys. */
function pf_load($path) {
    $cfg=json_decode(file_get_contents($path),true);if(!is_array($cfg))throw new Exception('field_key_missing');
    $secret=base64_decode($cfg['material'],true);if(strlen($secret)!==64)throw new Exception('invalid_field_key');
    return array('context'=>$cfg['operator'].':'.$cfg['site'],'id'=>substr(hash('sha256',$secret),0,16),'aes'=>substr($secret,0,32),'mac'=>hash_hmac('sha256','portfolio-field-mac-v1',substr($secret,32),true),'lookup'=>hash_hmac('sha256','portfolio-field-lookup-v1',substr($secret,32),true));
}
function pf_seal($key,$value,$field) {
    if($value===null||$value==='')return $value;$value=(string)$value;
    $iv=openssl_random_pseudo_bytes(16,$strong);if(!$strong)throw new Exception('secure_random_missing');
    $cipher=openssl_encrypt($value,'aes-256-cbc',$key['aes'],OPENSSL_RAW_DATA,$iv);if($cipher===false)throw new Exception('field_encryption_failed');
    $iv64=base64_encode($iv);$data64=base64_encode($cipher);$aad=implode("\n",array('portfolio-field-v1',$key['context'],$field,$key['id'],$iv64,$data64));
    return implode(':',array('pf1',$key['id'],$iv64,$data64,hash_hmac('sha256',$aad,$key['mac'])));
}
function pf_open($key,$value,$field) {
    if($value===null||$value===''||strpos((string)$value,'pf1:')!==0)return $value;
    $parts=explode(':',$value);if(count($parts)!==5||$parts[1]!==$key['id'])throw new Exception('invalid_encrypted_field');
    $aad=implode("\n",array('portfolio-field-v1',$key['context'],$field,$parts[1],$parts[2],$parts[3]));
    if(!hash_equals(hash_hmac('sha256',$aad,$key['mac']),$parts[4]))throw new Exception('field_integrity_failed');
    $iv=base64_decode($parts[2],true);$data=base64_decode($parts[3],true);if(strlen($iv)!==16||$data===false)throw new Exception('invalid_encrypted_field');
    $plain=openssl_decrypt($data,'aes-256-cbc',$key['aes'],OPENSSL_RAW_DATA,$iv);if($plain===false)throw new Exception('field_decryption_failed');return $plain;
}
function pf_index($key,$value,$purpose='email') {return 'h1:'.hash_hmac('sha256',$purpose."\n".(string)$value,$key['lookup']);}
