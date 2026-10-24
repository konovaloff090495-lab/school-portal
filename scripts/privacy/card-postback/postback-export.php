<?php
/* Existing authorized SSH analytics only; never install under public_html. */
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require dirname(__FILE__).'/postback-private.php';
$path=ppm_private_base().'/ppm_postbacks.jsonl';if(!is_file($path))exit;
$file=fopen($path,'r');while(($line=fgets($file))!==false){$row=ppm_decode_line($line);if(!$row)throw new Exception('invalid_postback_record');echo json_encode($row,JSON_UNESCAPED_UNICODE)."\n";}fclose($file);
