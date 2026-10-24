"""Authenticated field encryption for legacy operational data, distinct from vault keys."""
import base64,hashlib,hmac,json,os,secrets
from pathlib import Path
from cryptography.hazmat.primitives.ciphers import Cipher,algorithms,modes
from cryptography.hazmat.primitives import padding

class Fields:
    def __init__(self,path):
        self.path=Path(path);cfg=json.loads(self.path.read_text());self.context=cfg['operator']+':'+cfg['site']
        secret=base64.b64decode(cfg['material'],validate=True)
        if len(secret)!=64:raise ValueError('invalid_field_key')
        self.key_id=hashlib.sha256(secret).hexdigest()[:16];self.aes=secret[:32]
        self.mac=hmac.new(secret[32:],b'portfolio-field-mac-v1',hashlib.sha256).digest()
        self.lookup=hmac.new(secret[32:],b'portfolio-field-lookup-v1',hashlib.sha256).digest()
    @staticmethod
    def create(path,operator,site):
        path=Path(path);path.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
        with os.fdopen(os.open(path,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600),'w') as f:
            json.dump({'v':1,'operator':operator,'site':site,'material':base64.b64encode(secrets.token_bytes(64)).decode()},f)
            f.flush();os.fsync(f.fileno())
        return Fields(path)
    def seal(self,value,field):
        if value is None:return None
        value=str(value)
        if value=='':return ''
        raw=value.encode();iv=secrets.token_bytes(16);pad=padding.PKCS7(128).padder();data=pad.update(raw)+pad.finalize()
        cipher=Cipher(algorithms.AES(self.aes),modes.CBC(iv)).encryptor();encrypted=cipher.update(data)+cipher.finalize()
        iv64=base64.b64encode(iv).decode();data64=base64.b64encode(encrypted).decode()
        aad='\n'.join(['portfolio-field-v1',self.context,field,self.key_id,iv64,data64])
        tag=hmac.new(self.mac,aad.encode(),hashlib.sha256).hexdigest()
        return ':'.join(['pf1',self.key_id,iv64,data64,tag])
    def open(self,value,field):
        if value is None or value=='':return value
        if not str(value).startswith('pf1:'):return value # read-only compatibility during migration
        parts=value.split(':')
        if len(parts)!=5 or parts[1]!=self.key_id:raise ValueError('invalid_encrypted_field')
        _,key_id,iv64,data64,tag=parts;aad='\n'.join(['portfolio-field-v1',self.context,field,key_id,iv64,data64])
        if not hmac.compare_digest(hmac.new(self.mac,aad.encode(),hashlib.sha256).hexdigest(),tag):raise ValueError('field_integrity_failed')
        iv=base64.b64decode(iv64,validate=True);data=base64.b64decode(data64,validate=True)
        cipher=Cipher(algorithms.AES(self.aes),modes.CBC(iv)).decryptor();raw=cipher.update(data)+cipher.finalize()
        pad=padding.PKCS7(128).unpadder();return (pad.update(raw)+pad.finalize()).decode()
    def index(self,value,purpose='email'):
        return 'h1:'+hmac.new(self.lookup,(purpose+'\n'+str(value)).encode(),hashlib.sha256).hexdigest()
