import {randomBytes,randomUUID,publicEncrypt,privateDecrypt,createCipheriv,createDecipheriv,createHmac,timingSafeEqual,createHash,constants} from 'node:crypto';
const b64=x=>Buffer.from(x).toString('base64');
export const keyId=publicKey=>createHash('sha256').update(publicKey.trim()).digest('hex').slice(0,24);
function authenticated(e){return ['portfolio-lead-v1',e.id,e.operator,e.site,e.created_at,e.key_id,e.key,e.iv,e.data].join('\n')}
export function seal(payload,{publicKey,operator,site,id=randomUUID(),created_at=new Date().toISOString()}){
 const raw=Buffer.from(JSON.stringify(payload));if(raw.length>65536)throw Error('payload_too_large');
 const secret=randomBytes(64),iv=randomBytes(16),cipher=createCipheriv('aes-256-cbc',secret.subarray(0,32),iv);
 const e={v:1,id,operator,site,created_at,key_id:keyId(publicKey),key:b64(publicEncrypt({key:publicKey,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha1'},secret)),iv:b64(iv),data:b64(Buffer.concat([cipher.update(raw),cipher.final()]))};
 e.mac=createHmac('sha256',secret.subarray(32)).update(authenticated(e)).digest('hex');return e;
}
export function open(e,{privateKey,publicKey,operator,sites}){
 if(!e||e.v!==1||e.operator!==operator||!sites.includes(e.site)||!/^[a-f0-9-]{36}$/i.test(e.id||'')||!Number.isFinite(Date.parse(e.created_at))||e.key_id!==keyId(publicKey))throw Error('invalid_envelope');
 for(const k of ['key','iv','data'])if(typeof e[k]!=='string'||!(/^[A-Za-z0-9+/]*={0,2}$/).test(e[k])||e[k].length>100000)throw Error('invalid_envelope');
 const secret=privateDecrypt({key:privateKey,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha1'},Buffer.from(e.key,'base64'));
 if(secret.length!==64||!/^[a-f0-9]{64}$/.test(e.mac||''))throw Error('invalid_envelope');
 const expected=createHmac('sha256',secret.subarray(32)).update(authenticated(e)).digest();
 if(!timingSafeEqual(expected,Buffer.from(e.mac,'hex')))throw Error('invalid_envelope');
 const iv=Buffer.from(e.iv,'base64');if(iv.length!==16)throw Error('invalid_envelope');
 const cipher=createDecipheriv('aes-256-cbc',secret.subarray(0,32),iv),raw=Buffer.concat([cipher.update(Buffer.from(e.data,'base64')),cipher.final()]);
 if(raw.length>65536)throw Error('payload_too_large');const data=JSON.parse(raw.toString('utf8'));
 if(!data||Array.isArray(data)||typeof data!=='object')throw Error('invalid_payload');return data;
}
// AES-CBC is authenticated BEFORE decryption using an independent HMAC key.
// OAEP-SHA1 is solely for compatibility with existing PHP 5.6 OpenSSL wrappers.
