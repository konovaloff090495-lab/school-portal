<?php
/* PHP 5.6 compatible. The public website holds encryption PUBLIC keys only. */
function pv_uuid() {
    $b = openssl_random_pseudo_bytes(16, $strong);
    if (!$b || !$strong) throw new Exception('secure_random_unavailable');
    $b[6] = chr((ord($b[6]) & 15) | 64); $b[8] = chr((ord($b[8]) & 63) | 128);
    $h = bin2hex($b); return substr($h,0,8).'-'.substr($h,8,4).'-'.substr($h,12,4).'-'.substr($h,16,4).'-'.substr($h,20,12);
}
function pv_capture($configPath, $payload) {
    umask(0077);
    $cfg = json_decode(file_get_contents($configPath), true);
    if (!is_array($cfg) || empty($cfg['public_key'])) throw new Exception('capture_not_configured');
    $raw = json_encode($payload, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    if ($raw === false || strlen($raw) > 65536) throw new Exception('payload_too_large');
    $public = file_get_contents($cfg['public_key']);
    $secret = openssl_random_pseudo_bytes(64, $strong); if (!$strong) throw new Exception('secure_random_unavailable');
    $iv = openssl_random_pseudo_bytes(16, $strong); if (!$strong) throw new Exception('secure_random_unavailable');
    if (!openssl_public_encrypt($secret, $wrapped, $public, OPENSSL_PKCS1_OAEP_PADDING)) throw new Exception('encryption_failed');
    $encrypted = openssl_encrypt($raw, 'aes-256-cbc', substr($secret,0,32), OPENSSL_RAW_DATA, $iv);
    if ($encrypted === false) throw new Exception('encryption_failed');
    $e = array('v'=>1,'id'=>pv_uuid(),'operator'=>$cfg['operator'],'site'=>$cfg['site'],'created_at'=>gmdate('Y-m-d\TH:i:s\Z'),'key_id'=>substr(hash('sha256',trim($public)),0,24),'key'=>base64_encode($wrapped),'iv'=>base64_encode($iv),'data'=>base64_encode($encrypted));
    $aad = implode("\n",array('portfolio-lead-v1',$e['id'],$e['operator'],$e['site'],$e['created_at'],$e['key_id'],$e['key'],$e['iv'],$e['data']));
    $e['mac'] = hash_hmac('sha256',$aad,substr($secret,32));
    $dir = dirname($configPath); if (!is_dir($dir)) throw new Exception('private_directory_missing');
    $db = new PDO('sqlite:'.$dir.'/spool.sqlite3');$db->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
    $db->exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS spool(id TEXT PRIMARY KEY,envelope TEXT NOT NULL,created_at TEXT NOT NULL,relayed_at TEXT)');
    chmod($dir.'/spool.sqlite3',0600);
    $json=json_encode($e,JSON_UNESCAPED_SLASHES);$db->beginTransaction();
    $query=$db->prepare('INSERT INTO spool(id,envelope,created_at) VALUES(?,?,?)');$query->execute(array($e['id'],$json,$e['created_at']));$db->commit();
    // A failed relay never removes the committed encrypted local copy.
    pv_relay($cfg, $db, $e['id']);
    return $e['id'];
}
function pv_relay($cfg, $db, $id = null) {
    if (!function_exists('curl_init') || !defined('CURLOPT_RESOLVE')) return;
    $query=$db->prepare('SELECT id,envelope FROM spool WHERE relayed_at IS NULL' . ($id !== null ? ' AND id=?' : '') . ' ORDER BY created_at LIMIT 10');$query->execute($id !== null ? array($id) : array());
    foreach ($query->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $ch=curl_init($cfg['endpoint']);curl_setopt_array($ch,array(CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>$row['envelope'],CURLOPT_HTTPHEADER=>array('Content-Type: application/json','Authorization: Bearer '.$cfg['ingest_token']),CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>3,CURLOPT_CONNECTTIMEOUT=>2,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,CURLOPT_RESOLVE=>array('pro-schools.ru:443:155.212.140.76')));
        $response=curl_exec($ch);$status=curl_getinfo($ch,CURLINFO_HTTP_CODE);curl_close($ch);$receipt=json_decode($response,true);
        if (($status===200||$status===201) && !empty($receipt['stored']) && $receipt['id']===$row['id']) {
            $update=$db->prepare('UPDATE spool SET relayed_at=? WHERE id=?');$update->execute(array(gmdate('c'),$row['id']));
        }
    }
}
