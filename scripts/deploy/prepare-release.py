#!/usr/bin/env python3
"""Relocate client-reference manifests from the build host to the runtime host.

Next's runtime creates absolute client module names using cwd. Keep the original
names too: both build-time and runtime references must resolve after rsync.
"""
import json
import sys
from pathlib import Path

release = Path(sys.argv[1]).resolve()
runtime = str(Path(sys.argv[2]).resolve())
meta = json.loads((release / 'required-server-files.json').read_text())
build_root = meta['appDir']
count = 0
for manifest in (release / 'server' / 'app').rglob('*client-reference-manifest.js'):
    text = manifest.read_text()
    marker = '\n// runtime-path-aliases\n'
    text = text.split(marker)[0]
    if build_root != runtime:
        text += marker + '''for (const manifest of Object.values(globalThis.__RSC_MANIFEST)) {
  for (const [key, value] of Object.entries(manifest.clientModules || {})) {
    if (key.startsWith(BUILD_ROOT + '/')) {
      manifest.clientModules[RUNTIME_ROOT + key.slice(BUILD_ROOT.length)] = value;
    }
  }
}
'''.replace('BUILD_ROOT', json.dumps(build_root)).replace('RUNTIME_ROOT', json.dumps(runtime))
        manifest.write_text(text)
        count += 1
print(f'Prepared {count} client manifests for runtime paths')
