// Cold-render checks: the home page alone cannot detect missing RSC modules.
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const port = 3197;
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(port)], {
  env: { ...process.env, NEXT_DIST_DIR: '.next-incoming', NODE_OPTIONS: '--max-old-space-size=1536' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let log = '';
child.stdout.on('data', b => { log += b; });
child.stderr.on('data', b => { log += b; });
const routes = [
  ['/gdz/9-klass/geografiya/alekseev/nomer-p15-10/', 200],
  ['/gdz/9-klass/fizika/peryshkin/nomer-p65-2/', 200],
  ['/gdz/5-klass/angliiskiy-yazyk/afanaseva-uchebnik-chast-1/nomer-9-s29/', 200],
  ['/olimpiady/matematika/', 200],
  ['/gdz/7-klass/fizika/peryshkin/nomer-63/', 404],
];
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    assert.equal(child.exitCode, null, `Preview exited: ${log.slice(-2000)}`);
    if (log.includes('Ready in')) { ready = true; break; }
    await new Promise(r => setTimeout(r, 500));
  }
  assert.ok(ready, 'Preview did not start');
  for (const [path, status] of routes) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, { signal: AbortSignal.timeout(60000) });
    const body = await response.text();
    assert.equal(response.status, status, path);
    assert.ok(body.includes('<html'), `No HTML: ${path}`);
    console.log(`${status} ${path}`);
  }
  assert.ok(!/Could not find the module|Server Components render|MODULE_NOT_FOUND/.test(log), log.slice(-3000));
} finally {
  child.kill('SIGTERM');
  const timer = setTimeout(() => child.kill('SIGKILL'), 5000);
  if (child.exitCode === null && child.signalCode === null) await new Promise(r => child.once('exit', r));
  clearTimeout(timer);
}
