import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const base = process.env.INFORMATION_QA_BASE || 'http://127.0.0.1:3194'
const paths = [
  '/', '/shkoly/', '/shkoly/tomsk/eksternal/', '/shkoly/tipy/online/',
  '/shkola/onlain-shkola-sinergiya-moskva/', '/shkoly/tipy/online/sinergiya/',
  '/attestat-vzroslomu/', '/soglasie-marketing/', '/dobavit-shkolu/',
]
const child = process.env.INFORMATION_QA_BASE ? null : spawn(
  process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3194'],
  { stdio: 'inherit' },
)
let browser
try {
  for (let attempt = 0; attempt < 40; attempt++) {
    try { if ((await fetch(base + '/robots.txt', { signal: AbortSignal.timeout(1200) })).ok) break } catch {}
    await new Promise(resolve => setTimeout(resolve, 300))
  }
  const closed = await fetch(base + '/api/leads/submit/', { method: 'POST' })
  assert.equal(closed.status, 410)
  browser = await chromium.launch({ headless: true, channel: process.env.INFORMATION_QA_BROWSER || undefined })
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await context.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort())
  await context.addInitScript(() => {
    localStorage.setItem('proschools-first-city-dismissed', '1')
    const calls = []
    window.__informationAdCalls = calls
    window.yaContextCb = []
    window.yaContextCb.push = callback => { callback(); return 0 }
    window.Ya = { Context: { AdvManager: { render: params => calls.push(params.blockId) } } }
  })
  const page = await context.newPage()
  for (const path of paths) {
    const response = await page.goto(base + path, { waitUntil: 'domcontentloaded' })
    assert.equal(response.status(), 200, path)
    assert.equal(await page.locator('#main h1').count(), 1, path)
    assert.equal(await page.locator('form:has([type="tel"]), [data-ps-sale], [data-ps-sale-slot]').count(), 0, path)
    const hosts = await page.locator('a[href]').evaluateAll(nodes => nodes.map(node => new URL(node.href).hostname))
    assert.ok(!hosts.some(host => /(^|\.)(?:synergy(?:-academy)?\.ru|syndev\.ru|school-?university\.(?:com|ru))$/.test(host)), path)
    const catalogCards = page.locator('#spisok-shkol .grid > article')
    const inlineAd = page.locator('[data-catalog-inline-ad]')
    const expectedBlocks = ['R-A-19425636-2', 'R-A-19425636-3']
    if (await catalogCards.count() > 6) {
      expectedBlocks.unshift('R-A-19425636-1')
      assert.equal(await inlineAd.count(), 1, path)
      assert.equal(await inlineAd.locator('xpath=preceding-sibling::article').count(), 6, path)
    } else {
      assert.equal(await inlineAd.count(), 0, path)
    }
    await page.waitForFunction(count => window.__informationAdCalls.length >= count, expectedBlocks.length)
    assert.deepEqual((await page.evaluate(() => window.__informationAdCalls)).sort(), expectedBlocks, path)
    assert.doesNotMatch(await page.locator('#main').innerText(), /Синерги[яиуюе]|\bSynergy\b/i, path)
    if (path === '/soglasie-marketing/') {
      const consent = await page.locator('#main').innerText()
      assert.match(consent, /ИП Герасимова/)
      assert.doesNotMatch(consent, /Синерг|АНО ВО|9702078886/)
    }
  }
  console.log('Verified informational pages, lead closure, Synergy card and unique RTB calls')
} finally {
  await browser?.close()
  child?.kill()
}
