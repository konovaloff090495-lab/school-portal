// Cold-render checks: the home page alone cannot detect missing RSC modules.
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const port = 3197;
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(port)], {
  env: { ...process.env, NEXT_DIST_DIR: process.env.RELEASE_DIST_DIR || '.next-incoming', NODE_OPTIONS: '--max-old-space-size=1536' },
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
  ['/shkoly/gbou-shkola-179-moskva/', 308, '/shkola/gbou-shkola-179-moskva/'],
  ['/shkoly/gbou-shkola-57-moskva/', 308, '/shkola/gbou-shkola-57-moskva/'],
  // Recheck a cached redirect: duplicate Location headers must still fail.
  ['/shkoly/gbou-shkola-179-moskva/', 308, '/shkola/gbou-shkola-179-moskva/'],
  ['/shkoly/moskva/', 200],
  ['/shkoly/nonexistent-school-index-check-2026/', 404],
  ['/uchebnik/russkiy-yazyk/6/', 308, '/uchebnik/russkiy-yazyk/6-klass/'],
  ['/uchebnik/geometriya/11/uravnenie-ploskosti/', 308, '/uchebnik/geometriya/11-klass/uravnenie-ploskosti/'],
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
  for (const [path, status, expectedLocation] of routes) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, { signal: AbortSignal.timeout(60000), redirect: 'manual' });
    const body = await response.text();
    assert.equal(response.status, status, path);
    if (status === 308) {
      const target = response.headers.get('location');
      assert.ok(target && new URL(target, `http://127.0.0.1:${port}`).pathname.replace(/\/$/, '') === expectedLocation.replace(/\/$/, ''), `Wrong redirect: ${target}`);
    } else {
      assert.ok(body.includes('<html'), `No HTML: ${path}`);
    }
    console.log(`${status} ${path}`);
  }
  const get = path => fetch(`http://127.0.0.1:${port}${path}`, { signal: AbortSignal.timeout(60000) });
  const robots = await (await get('/robots.txt')).text();
  assert.ok(!robots.includes('Disallow: /_next/'), 'Rendering assets blocked');
  assert.ok(robots.includes('Disallow: /api/'), 'Private API restriction lost');
  for (const [path, canonical] of [
    ['/fipi/ege/demo/2017/slovnik-orfoepicheskiy.pdf', '/fipi/ege/demo/2016/slovnik-orfoepicheskiy.pdf'],
    ['/fipi/oge/demo/2017/yaa-9-demo-2017-pch.pdf', '/fipi/oge/demo/2017/yaa-9-demo-2017-pch.pdf'],
  ]) {
    const pdf = await get(path);
    assert.equal(pdf.status, 200, path);
    assert.equal(pdf.headers.get('link'), `<https://pro-schools.ru${canonical}>; rel="canonical"`);
    await pdf.arrayBuffer();
  }
  const english = await (await get('/oge/angliiskiy-yazyk/demoversiya-2017/')).text();
  assert.ok(english.includes('/fipi/oge/demo/2017/yaa-9-demo-2017-pch.pdf'), 'English demo missing');
  const spanish = await (await get('/oge/ispanskiy-yazyk/demoversiya-2017/')).text();
  assert.ok(!spanish.includes('/fipi/oge/demo/2017/yaa-9-demo-2017-pch.pdf'), 'English PDF in Spanish demo');
  const sitemap = await (await get('/sitemap.xml')).text();
  assert.ok(!sitemap.includes('<loc>https://pro-schools.ru/ege/matematika-bazovaya/metodicheskie-rekomendacii-2025/</loc>'), 'Noncanonical URL in sitemap');
  assert.ok(sitemap.includes('<loc>https://pro-schools.ru/ege/matematika-profilnaya/metodicheskie-rekomendacii-2025/</loc>'), 'Canonical URL missing from sitemap');
  console.log('robots, PDF canonicals, language materials and sitemap OK');
  assert.ok(!/Could not find the module|Server Components render|MODULE_NOT_FOUND/.test(log), log.slice(-3000));
} finally {
  child.kill('SIGTERM');
  const timer = setTimeout(() => child.kill('SIGKILL'), 5000);
  if (child.exitCode === null && child.signalCode === null) await new Promise(r => child.once('exit', r));
  clearTimeout(timer);
}
