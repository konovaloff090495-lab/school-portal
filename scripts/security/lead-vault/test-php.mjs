import {generateKeyPairSync} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {open} from './crypto.mjs';
if (!process.env.LEAD_PHP_SSH_HOST || !process.env.LEAD_PHP_SSH_KEY) throw new Error('Set explicit synthetic PHP test SSH host/key');
const {publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
const payload={name:'Synthetic interoperability check',email:'synthetic@example.invalid',pd_agreed:true};
const data=Buffer.from(JSON.stringify({client:readFileSync(new URL('./php-client.php',import.meta.url),'utf8'),publicKey,payload})).toString('base64');
const php=`<?php
umask(0077);$d=json_decode(base64_decode('${data}'),true);$dir=sys_get_temp_dir().'/portfolio-synthetic-'.uniqid('',true);mkdir($dir,0700);file_put_contents($dir.'/client.php',$d['client']);require $dir.'/client.php';file_put_contents($dir.'/public.pem',$d['publicKey']);$cfg=array('operator'=>'konovalov','site'=>'cardopen','public_key'=>$dir.'/public.pem','endpoint'=>'http://127.0.0.1:1/ingest','ingest_token'=>'synthetic');file_put_contents($dir.'/config.json',json_encode($cfg));$id=pv_capture($dir.'/config.json',$d['payload']);$db=new PDO('sqlite:'.$dir.'/spool.sqlite3');$r=$db->query('SELECT envelope,relayed_at FROM spool')->fetch(PDO::FETCH_ASSOC);echo json_encode($r);$db=null;foreach(glob($dir.'/*') as $f)unlink($f);rmdir($dir);
`;
const result=spawnSync('ssh',['-i',process.env.LEAD_PHP_SSH_KEY,'-o','IdentitiesOnly=yes','-o','BatchMode=yes','-o','ConnectTimeout=30',process.env.LEAD_PHP_SSH_HOST,'php'],{input:php,encoding:'utf8',timeout:60000});
assert.equal(result.status,0,result.stderr);const row=JSON.parse(result.stdout);assert.equal(row.relayed_at,null);assert.deepEqual(open(JSON.parse(row.envelope),{privateKey,publicKey,operator:'konovalov',sites:['cardopen']}),payload);
console.log('PHP 5.6 encrypted spool interoperates with Node; relay outage preserves committed ciphertext; synthetic only.');
