/** Test the compiled catalog's primary choice flow, without submitting forms. */
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const base = 'http://127.0.0.1:3196'
const output = 'work/seo-school-formats-qa'
await mkdir(output, { recursive: true })
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3196'], {
  detached: true, env: { ...process.env, NODE_ENV: 'production' }, stdio: ['ignore', 'pipe', 'pipe'],
})
let logs = '', browser
child.stdout.on('data', data => { logs += data })
child.stderr.on('data', data => { logs += data })
function stop() { try { process.kill(-child.pid, 'SIGTERM') } catch { child.kill('SIGTERM') } }
const timeout = setTimeout(() => { stop(); process.exit(1) }, 150000)
const checks = []
try {
  let ready = false
  for (let attempt = 0; attempt < 50; attempt++) {
    try { const response = await fetch(base, { signal: AbortSignal.timeout(3000) }); if (response.ok) { ready = true; break } } catch {}
    await new Promise(resolve => setTimeout(resolve, 400))
  }
  assert.ok(ready, 'Compiled server did not become ready')
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  await context.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort())
  const page = await context.newPage()
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    const response = await page.goto(base + '/shkoly/tipy/online/')
    assert.equal(response.status(), 200)
    const choice = page.locator('nav[aria-label="Онлайн-школы по классам"]')
    assert.equal(await choice.count(), 1, 'Class navigation must not be duplicated in filters')
    assert.ok(await choice.isVisible(), 'Primary program choice must be visible')
    assert.equal(await choice.evaluate(node => Boolean(node.closest('aside'))), false, 'Primary program choice must be outside the filter sidebar')
    const firstCard = page.locator('a[href^="/shkola/"]').first()
    const choiceBox = await choice.boundingBox(), cardBox = await firstCard.boundingBox()
    assert.ok(choiceBox && cardBox && choiceBox.y + choiceBox.height < cardBox.y, 'Program choice must precede school cards')
    const dimensions = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }))
    assert.ok(dimensions.scrollWidth <= width + 1, 'Horizontal page overflow')
    const later = page.getByRole('button', { name: 'Позже', exact: true })
    if (await later.isVisible().catch(() => false)) await later.click()
    if ([1440, 390].includes(width)) await page.screenshot({ path: `${output}/hub-${width}.png` })
    checks.push({ page: 'online hub', ...dimensions, primaryChoiceOutsideFilters: true, beforeCards: true })
  }
  await page.setViewportSize({ width: 390, height: 1000 })
  const response = await page.goto(base + '/shkoly/tipy/online/1-klass/')
  assert.equal(response.status(), 200)
  assert.match(await page.locator('h1').innerText(), /1 класса/)
  await page.screenshot({ path: `${output}/class-1-390.png` })
  checks.push({ page: 'class 1', status: 200, width: 390 })
  await writeFile(`${output}/qa.json`, JSON.stringify({ result: 'passed', checks }, null, 2))
  console.log(JSON.stringify({ result: 'passed', checks: checks.length, primaryChoice: 'outside filters and before cards' }))
} finally {
  clearTimeout(timeout)
  if (browser) await browser.close()
  stop()
  await writeFile(`${output}/server.log`, logs)
}
