import sys,tempfile,pathlib
sys.path.insert(0,str(pathlib.Path(__file__).parent))
from pii_fields import Fields
with tempfile.TemporaryDirectory(prefix='pii-synthetic-') as d:
    f=Fields.create(pathlib.Path(d)/'a.json','gerasimov','proschools');g=Fields.create(pathlib.Path(d)/'b.json','konovalov','delomba')
    value='Synthetic name · synthetic@example.invalid';cipher=f.seal(value,'subscriber.email')
    assert value not in cipher and f.open(cipher,'subscriber.email')==value and cipher!=f.seal(value,'subscriber.email')
    assert f.index(value)==f.index(value) and f.index(value)!=g.index(value)
    for codec,field,text in [(g,'subscriber.email',cipher),(f,'subscriber.name',cipher),(f,'subscriber.email',cipher[:-1]+('0' if cipher[-1]!='0' else '1'))]:
        try:codec.open(text,field);raise AssertionError('invalid field accepted')
        except ValueError:pass
    assert f.open('legacy_value','subscriber.email')=='legacy_value'
print('Legacy fields: authenticated encryption, random IVs, scoped keys, tamper rejection and stable private indexes passed; synthetic only.')
