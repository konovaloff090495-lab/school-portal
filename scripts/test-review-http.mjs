import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
const origin = 'http://127.0.0.1:3207'
const state = await mkdtemp(path.join(os.tmpdir(), 'reviews-http-'))
const password = randomBytes(32).toString('hex')
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3207'], {
  env: { ...process.env, NODE_ENV: 'production', REVIEWS_STATE_DIR: state, ADMIN_ORIGIN: origin, ADMIN_SECRET: password, TELEGRAM_BOT_TOKEN: '', TELEGRAM_CHAT_ID: '' }, stdio: ['ignore', 'pipe', 'pipe']
})
let output = ''
child.stdout.on('data', chunk => { output = (output + chunk).slice(-8000) })
child.stderr.on('data', chunk => { output = (output + chunk).slice(-8000) })
async function post(route, body, extra = {}) {
  return fetch(origin + route, { method: 'POST', redirect: 'manual', headers: { Origin: origin, 'Content-Type': 'application/json', ...extra }, body: JSON.stringify(body) })
}
try {
  let ready = false
  for (let i = 0; i < 90; i++) {
    try { if ((await fetch(origin + '/admin/otzyvy/')).ok) { ready = true; break } } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  assert.ok(ready, 'Review test server did not start')
  const review = { schoolSlug: 'security-review-school', schoolName: 'Test School', authorName: 'Queue Test Author', rating: 5, text: 'Security check with <script>literal text</script> and a quote: \\' }
  assert.equal((await post('/api/reviews/submit/', { ...review, authorName: {} })).status, 400)
  assert.equal((await post('/api/reviews/submit/', review)).status, 200)
  assert.equal((await (await fetch(origin + '/api/reviews/published/?school=' + review.schoolSlug)).json()).reviews.length, 0)
  const filename = (await readdir(path.join(state, 'pending')))[0]
  const anonymous = await (await fetch(origin + '/admin/otzyvy/')).text()
  assert.ok(anonymous.includes('Пароль администратора'))
  assert.ok(!anonymous.includes(password) && !anonymous.includes(review.authorName))
  // Next includes the request URL in its Flight payload: a caller-supplied query
  // is not a server secret leak. Check legacy URLs grant no access separately.
  const legacy = await (await fetch(origin + '/admin/otzyvy/?secret=' + password)).text()
  assert.ok(legacy.includes('Пароль администратора') && !legacy.includes(review.authorName))
  assert.equal((await post('/api/reviews/approve/', { filename }, { Authorization: password })).status, 401)
  assert.equal((await fetch(origin + '/api/reviews/login/', { method: 'POST', headers: { Origin: 'https://evil.example' }, body: new URLSearchParams({ password }) })).status, 403)
  const login = await fetch(origin + '/api/reviews/login/', { method: 'POST', redirect: 'manual', headers: { Origin: origin }, body: new URLSearchParams({ password }) })
  assert.equal(login.status, 303)
  const setCookie = login.headers.get('set-cookie') || ''
  assert.ok(/HttpOnly/i.test(setCookie) && /Secure/i.test(setCookie) && /SameSite=Strict/i.test(setCookie))
  const cookie = setCookie.split(';')[0]
  assert.ok(!cookie.includes(password))
  const admin = await (await fetch(origin + '/admin/otzyvy/', { headers: { Cookie: cookie } })).text()
  assert.ok(admin.includes(review.authorName))
  assert.ok(!admin.includes(password))
  assert.equal((await post('/api/reviews/approve/', { filename }, { Cookie: cookie, Origin: 'https://evil.example' })).status, 403)
  assert.equal((await post('/api/reviews/approve/', { filename: '../package.json' }, { Cookie: cookie })).status, 400)
  assert.equal((await post('/api/reviews/approve/', { filename }, { Cookie: cookie })).status, 200)
  assert.equal((await post('/api/reviews/approve/', { filename }, { Cookie: cookie })).status, 200)
  const published = await (await fetch(origin + '/api/reviews/published/?school=' + review.schoolSlug)).json()
  assert.equal(published.reviews.length, 1)
  assert.equal(published.reviews[0].text, review.text)
  assert.equal((await readdir(path.join(state, 'pending'))).length, 0)
  const logout = await fetch(origin + '/api/reviews/logout/', { method: 'POST', redirect: 'manual', headers: { Origin: origin, Cookie: cookie } })
  assert.equal(logout.status, 303)
  assert.ok((logout.headers.get('set-cookie') || '').includes('Max-Age=0'))
  console.log('Review HTTP checks passed: private queue, cookie login, CSRF, traversal, idempotent approval and public display')
} catch (error) {
  console.error(output)
  throw error
} finally {
  child.kill('SIGTERM')
  await new Promise(resolve => { child.once('exit', resolve); setTimeout(resolve, 5000).unref() })
  await rm(state, { recursive: true, force: true })
}
