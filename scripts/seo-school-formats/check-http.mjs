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
const checks = [], errors = []
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
    // Layout checks wait for DOM/fonts, independently of off-screen gallery requests.
    const response = await page.goto(base + '/shkoly/tipy/online/', { waitUntil: 'domcontentloaded' })
    assert.equal(response.status(), 200)
    const choice = page.locator('nav[aria-label="Онлайн-школы по классам"]')
    assert.equal(await choice.count(), 1, 'Class navigation must not be duplicated in filters')
    assert.ok(await choice.isVisible(), 'Primary program choice must be visible')
    assert.equal(await choice.evaluate(node => Boolean(node.closest('aside'))), false, 'Primary program choice must be outside the filter sidebar')
    const firstCard = page.locator('a[href^="/shkola/"]').first()
    const choiceBox = await choice.boundingBox(), cardBox = await firstCard.boundingBox()
    assert.ok(choiceBox && cardBox && cardBox.y < choiceBox.y, 'Catalog cards must precede the comparison and advice')
    await page.evaluate(() => document.fonts.ready)
    // Resizing and navigation can precede hydration/font layout. Require the
    // final document to fit; retain diagnostics for every width if it does not.
    await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth + 1, null, { timeout: 5000 }).catch(() => {})
    const dimensions = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }))
    if (dimensions.scrollWidth > width + 1) {
      const offenders = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(node => {
        const box = node.getBoundingClientRect()
        return box.width && box.right > innerWidth + 1 && getComputedStyle(node).position !== 'fixed'
      }).slice(0, 25).map(node => ({ tag: node.tagName, classes: node.className, text: node.textContent.slice(0, 80), right: node.getBoundingClientRect().right, overflow: getComputedStyle(node).overflowX })))
      errors.push({ ...dimensions, offenders })
      await page.screenshot({ path: `${output}/overflow-${width}.png` })
    }
    const later = page.getByRole('button', { name: 'Позже', exact: true })
    if (await later.isVisible().catch(() => false)) await later.click()
    if ([1440, 390].includes(width)) await page.screenshot({ path: `${output}/hub-${width}.png` })
    checks.push({ page: 'online hub', ...dimensions, primaryChoiceOutsideFilters: true, cardsFirst: true })
  }
  await page.setViewportSize({ width: 390, height: 1000 })
  const response = await page.goto(base + '/shkoly/tipy/online/1-klass/', { waitUntil: 'domcontentloaded' })
  assert.equal(response.status(), 200)
  assert.match(await page.locator('h1').innerText(), /1 класса/)
  await page.screenshot({ path: `${output}/class-1-390.png` })
  checks.push({ page: 'class 1', status: 200, width: 390 })
  await writeFile(`${output}/qa.json`, JSON.stringify({ result: errors.length ? 'failed' : 'passed', checks, errors }, null, 2))
  assert.equal(errors.length, 0, JSON.stringify(errors))
  console.log(JSON.stringify({ result: 'passed', checks: checks.length, primaryChoice: 'outside filters and after cards' }))
} finally {
  clearTimeout(timeout)
  if (browser) await browser.close()
  stop()
  await writeFile(`${output}/server.log`, logs)
}
