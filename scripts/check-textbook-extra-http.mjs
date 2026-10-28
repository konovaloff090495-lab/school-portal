import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const topics = JSON.parse(readFileSync('src/data/textbook-topics-extra.json', 'utf8'));
const articles = JSON.parse(readFileSync('src/data/textbook-articles.json', 'utf8'));
const keys = new Set(articles.map(a => `${a.subject}/${a.klass}/${a.topicSlug}`));
assert.ok(topics.length > 0, 'Additional lessons must not be empty');
assert.equal(new Set(topics.map(t => `${t.subject}/${t.klass}/${t.slug}`)).size, topics.length);
for (const t of topics) assert.ok(keys.has(`${t.subject}/${t.klass}/${t.slug}`), `Missing article: ${t.slug}`);

const port = 3198;
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(port)], {
  env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=1536' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let log = '';
child.stdout.on('data', b => { log += b; });
child.stderr.on('data', b => { log += b; });
const get = path => fetch(`http://127.0.0.1:${port}${path}`, { signal: AbortSignal.timeout(60000) });
try {
  for (let i = 0; i < 60 && !log.includes('Ready in'); i++) {
    assert.equal(child.exitCode, null, log.slice(-2000));
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.ok(log.includes('Ready in'), log.slice(-2000));
  for (const t of topics) {
    const path = `/uchebnik/${t.subject}/${t.klass}-klass/${t.slug}/`;
    const res = await get(path);
    const body = await res.text();
    assert.equal(res.status, 200, path);
    assert.equal((body.match(/<h1\b/g) || []).length, 1, path);
    assert.ok(body.includes(`href="https://pro-schools.ru${path}"`), `Canonical: ${path}`);
    assert.ok(body.includes('Источники и материалы'), `Full article: ${path}`);
  }
  const missing = await get('/uchebnik/frantsuzskiy-yazyk/5-klass/not-a-real-topic-coverage-check/');
  assert.equal(missing.status, 404, 'Unknown topic must remain 404');
  console.log(`Additional textbook HTTP checks passed: ${topics.length}`);
} finally {
  child.kill('SIGTERM');
}
