#!/usr/bin/env python3
"""Exercise deployment activation and rollback without touching PM2 or the site."""
import os
import subprocess
import tempfile
from pathlib import Path

script = Path(__file__).with_name('activate-release.sh').resolve()
for mode in ('healthy', 'unhealthy', 'wrong-id'):
    with tempfile.TemporaryDirectory() as d:
        root = Path(d)
        for folder, build in (('.next', 'old'), ('.next-incoming', 'new')):
            (root / folder).mkdir()
            (root / folder / 'BUILD_ID').write_text(build)
        bin_dir = root / 'bin'
        bin_dir.mkdir()
        for name, code in {'pm2': 'exit 0', 'sleep': 'exit 0', 'curl': 'exit ' + ('0' if mode == 'healthy' else '1')}.items():
            p = bin_dir / name
            p.write_text('#!/bin/sh\n' + code + '\n')
            p.chmod(0o755)
        result = subprocess.run(['bash', str(script), 'wrong' if mode == 'wrong-id' else 'new'], cwd=root,
            env={**os.environ, 'PATH': str(bin_dir) + ':' + os.environ['PATH']}, capture_output=True)
        assert (result.returncode == 0) == (mode == 'healthy'), result.stderr
        assert (root / '.next/BUILD_ID').read_text() == ('new' if mode == 'healthy' else 'old')
        print(mode, 'OK')

import json
with tempfile.TemporaryDirectory() as d:
    root = Path(d)
    (root / 'server/app').mkdir(parents=True)
    (root / 'required-server-files.json').write_text(json.dumps({'appDir': '/build/project'}))
    manifest = root / 'server/app/page_client-reference-manifest.js'
    manifest.write_text('globalThis.__RSC_MANIFEST={"/page":{"clientModules":{"/build/project/src/Widget.tsx":{"id":12}}}};')
    prepare = Path(__file__).with_name('prepare-release.py').resolve()
    for _ in range(2):
        subprocess.run(['python3', str(prepare), str(root), '/runtime/project'], check=True, capture_output=True)
    subprocess.run(['node', '-e', 'require(' + json.dumps(str(manifest)) + '); const m=globalThis.__RSC_MANIFEST["/page"].clientModules; if(m["/runtime/project/src/Widget.tsx"].id!==12 || !m["/build/project/src/Widget.tsx"])process.exit(1);'], check=True)
    assert manifest.read_text().count('// runtime-path-aliases') == 1
    print('manifest relocation + idempotency OK')
