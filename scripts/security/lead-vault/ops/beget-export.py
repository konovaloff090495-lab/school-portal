#!/usr/bin/python3
"""Read-only, forced SSH command. Never executes commands supplied by SSH client."""
import io
import json
import os
import pathlib
import sqlite3
import tarfile
import tempfile
import time
import sys

HOME = pathlib.Path('/home/k/kvantb7q')
SITES = {'card-open': 'card-open.ru', 'delomba': 'delo.mba', 'delomba-private': 'delo.mba', 'delomba-records': 'delo.mba', 'cardopen-records': 'card-open.ru'}
selection = os.environ.get('SSH_ORIGINAL_COMMAND', '')
if selection not in SITES:
    sys.exit('Only fixed site exports are allowed')
root = HOME / SITES[selection]
if not root.is_dir() or root.is_symlink():
    sys.exit('Site directory unavailable')
manifest = {'site': SITES[selection], 'started': time.time(), 'files': 0,
            'bytes': 0, 'sqlite': [], 'excluded': ['.git', 'node_modules', '__pycache__']}
with tempfile.TemporaryDirectory(prefix='portfolio-db-') as temp, tarfile.open(fileobj=sys.stdout.buffer, mode='w|') as archive:
    for folder, dirs, files in os.walk(str(root), followlinks=False):
        dirs[:] = sorted(d for d in dirs if d not in manifest['excluded'])
        base = pathlib.Path(folder)
        if selection=='cardopen-records' and base==root:dirs[:]=[];files=[name for name in files if name=='ppm_postbacks.jsonl']
        if selection in ('delomba-private','delomba-records') and base==root:dirs[:]=[d for d in dirs if d in ['.crm','.submissions','.franchise_submissions','.consent-evidence','.privacy']];files=[]
        archive.add(str(base), arcname=str(base.relative_to(HOME)), recursive=False)
        if selection=='delomba-records':
            if base==root/'.crm':dirs[:]=[];files=[n for n in files if n=='crm.sqlite']
            elif base==root/'.privacy':dirs[:]=[];files=[n for n in files if n=='enabled']
            else:dirs[:]=[n for n in dirs if n not in ['photos','code-before']]
        for name in sorted(dirs):
            p = base / name
            if p.is_symlink():
                archive.add(str(p), arcname=str(p.relative_to(HOME)), recursive=False)
        for name in sorted(files):
            path = base / name
            relative = str(path.relative_to(HOME))
            # WAL and SHM are represented by the transaction-consistent main snapshot.
            if name.endswith(('-wal', '-shm', '-journal')) and pathlib.Path(str(path).rsplit('-', 1)[0]).exists():
                continue
            source = path
            if path.is_file() and not path.is_symlink() and name.endswith(('.sqlite', '.sqlite3', '.db')):
                with path.open('rb') as stream:
                    is_sqlite = stream.read(16) == b'SQLite format 3\x00'
                if is_sqlite:
                    source = pathlib.Path(temp) / ('db-%d.sqlite' % len(manifest['sqlite']))
                    with sqlite3.connect(path.as_uri() + '?mode=ro', uri=True, timeout=30) as incoming, sqlite3.connect(str(source)) as outgoing:
                        incoming.backup(outgoing, pages=256, sleep=0.1)
                        if outgoing.execute('PRAGMA quick_check').fetchone()[0] != 'ok':
                            raise RuntimeError('SQLite consistency check failed')
                    manifest['sqlite'].append(relative)
            archive.add(str(source), arcname=relative, recursive=False)
            manifest['files'] += 1
            manifest['bytes'] += source.lstat().st_size
    manifest['finished'] = time.time()
    payload = json.dumps(manifest, ensure_ascii=False, indent=2).encode()
    info = tarfile.TarInfo('PORTFOLIO-BACKUP-MANIFEST.json')
    info.size, info.mode, info.mtime = len(payload), 0o600, int(time.time())
    archive.addfile(info, io.BytesIO(payload))
print(json.dumps(manifest, ensure_ascii=False), file=sys.stderr)
