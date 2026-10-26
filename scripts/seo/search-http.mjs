/** Regression: optional catalog labels must not crash internal search. */
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
const base = 'http://127.0.0.1:3196'
const output = 'work/search-qa'
await mkdir(output, { recursive: true })
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3196'], {
  detached: true, env: { ...process.env, NODE_ENV: 'production' }, stdio: ['ignore', 'pipe', 'pipe'],
})
let browser, logs = ''
child.stdout.on('data', data => { logs += data })
child.stderr.on('data', data => { logs += data })
const errors = []
try {
  let ready = false
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(base, { signal: AbortSignal.timeout(3000) })).ok) { ready = true; break } } catch {}
    await new Promise(resolve => setTimeout(resolve, 400))
  }
  assert.ok(ready, 'Compiled server did not become ready')
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  await context.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort())
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    const response = await page.goto(base + '/poisk/?q=' + encodeURIComponent('Летово'), { waitUntil: 'domcontentloaded' })
    assert.equal(response.status(), 200)
    await page.getByRole('heading', { name: 'Результаты поиска: «Летово»', exact: true }).waitFor()
    assert.ok(await page.locator('a[href^="/shkola/"]').count(), 'Known school must be found')
    assert.match(await page.locator('meta[name="robots"]').getAttribute('content'), /noindex/)
    await page.screenshot({ path: `${output}/search-${width}.png` })
    await page.getByPlaceholder('Название школы, адрес, тип...').fill('zzzxxyy-no-school-901234')
    await page.getByText('Ничего не найдено', { exact: true }).waitFor()
  }
  assert.deepEqual(errors, [], 'Search must not throw on incomplete records')
  await writeFile(`${output}/qa.json`, JSON.stringify({ result: 'passed', widths: [1440, 390], errors }, null, 2))
} finally {
  if (browser) await browser.close()
  try { process.kill(-child.pid, 'SIGTERM') } catch { child.kill('SIGTERM') }
  await writeFile(`${output}/server.log`, logs)
}
