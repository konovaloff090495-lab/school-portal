/** Test the compiled catalog's primary choice flow, without submitting forms. */
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { createJiti } from '../../node_modules/jiti/lib/jiti.mjs'
import { readFileSync } from 'node:fs'
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
const timeout = setTimeout(() => { stop(); process.exit(1) }, 240000)
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
  await context.addInitScript(() => { try {
    sessionStorage.setItem('ps_catalog_popup_done', '1')
    sessionStorage.setItem('ps_partner_popup_done', '1')
    localStorage.setItem('proschools-first-city-dismissed', '1')
  } catch {} })
  const page = await context.newPage()
  const pageErrors = [], leads = []
  page.on('pageerror', error => pageErrors.push(error.message))
  await page.route('**/api/leads/submit/**', async route => {
    leads.push(route.request().postDataJSON())
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true,"crm_id":"mock-only"}' })
  })
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
  const jiti = createJiti(import.meta.url, { interopDefault: true })
  const { getSchoolsByType } = await jiti.import('../../src/data/schools.ts')
  const { explicitSchoolGrades } = await jiti.import('../../src/lib/school-grades.ts')
  const gradePages = JSON.parse(readFileSync('src/data/online-grade-pages.json', 'utf8'))
  for (const [index, grade] of gradePages.entries()) {
    const width = index % 2 ? 1440 : 390
    await page.setViewportSize({ width, height: 1000 })
    const path = `/shkoly/tipy/online/${grade.slug}/`
    const response = await page.goto(base + path, { waitUntil: 'domcontentloaded' })
    assert.equal(response.status(), 200)
    assert.equal(await page.locator('h1').count(), 1)
    assert.equal(await page.locator('h1').innerText(), grade.h1)
    await page.waitForFunction(() => {
      const button = [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Ступень обучения')
      return button && Object.keys(button).some(key => key.startsWith('__reactProps$'))
    })
    const expected = getSchoolsByType('online').filter(s => grade.grades.every(g => explicitSchoolGrades(s.grades).includes(g)))
    assert.ok(expected.length >= 40, `${path}: expanded catalog`)
    const schema = await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.map(n => JSON.parse(n.textContent)).find(data => data['@type'] === 'ItemList'))
    assert.equal(schema.numberOfItems, expected.length)
    assert.deepEqual(schema.itemListElement.map(item => item.url).sort(), expected.map(s => `https://pro-schools.ru/shkola/${s.slug}/`).sort())
    const firstCard = page.locator('article a[href^="/shkola/"]').first()
    assert.ok((await firstCard.boundingBox()).y < (await page.locator('table').first().boundingBox()).y)
    assert.equal(await page.getByTitle('На карте', { exact: true }).count(), 0)
    while (await page.getByRole('button', { name: /Загрузить ещё/ }).count()) await page.getByRole('button', { name: /Загрузить ещё/ }).click()
    const hrefs = await page.locator('article a[href^="/shkola/"]').evaluateAll(nodes => [...new Set(nodes.map(n => n.getAttribute('href')))])
    assert.deepEqual(hrefs.sort(), expected.map(s => `/shkola/${s.slug}/`).sort(), `${path}: all and only eligible schools`)
    await page.evaluate(() => document.fonts.ready)
    const dimensions = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }))
    assert.ok(dimensions.scrollWidth <= width + 1, JSON.stringify({ path, ...dimensions }))
    checks.push({ path, width, schools: expected.length, cardsFirst: true, eligibleSchoolsOnly: true })
    if (grade.slug === '10-klass') await page.screenshot({ path: `${output}/class-10-1440.png` })
  }
  await page.setViewportSize({ width: 390, height: 1000 })
  await page.goto(base + '/shkoly/tipy/online/10-klass/', { waitUntil: 'domcontentloaded' })
  await page.screenshot({ path: `${output}/class-10-390.png` })
  const form = page.locator('#podbor form')
  await page.waitForFunction(() => { const input = document.querySelector('#podbor input[type="tel"]'); return input && Object.keys(input).some(key => key.startsWith('__reactProps$')) })
  await form.getByPlaceholder('Ваше имя', { exact: true }).fill('Проверка класса')
  await form.locator('input[type="tel"]').fill('+79162847319')
  await form.locator('input[type="email"]').fill('grade-check@example.invalid')
  const flags = form.locator('input[type="checkbox"]')
  await flags.nth(0).uncheck()
  await page.waitForFunction(() => document.querySelector('#podbor button[type="submit"]')?.disabled === true)
  await flags.nth(0).check()
  await flags.nth(1).uncheck()
  await form.locator('button[type="submit"]').click()
  await page.waitForURL('**/spasibo/**')
  assert.equal(leads.length, 1)
  assert.equal(leads[0].source, 'Онлайн-школы по классам: 10-klass')
  assert.equal(leads[0].crm, true)
  assert.equal(leads[0].pd_agreed, true)
  assert.equal(leads[0].marketing_agreed, false)
  assert.deepEqual(pageErrors, [])
  checks.push({ page: 'class 10', mockLead: true, attribution: true, consentRefusal: true })
  await writeFile(`${output}/qa.json`, JSON.stringify({ result: errors.length ? 'failed' : 'passed', checks, errors }, null, 2))
  assert.equal(errors.length, 0, JSON.stringify(errors))
  console.log(JSON.stringify({ result: 'passed', checks: checks.length, primaryChoice: 'outside filters and after cards' }))
} finally {
  clearTimeout(timeout)
  if (browser) await browser.close()
  stop()
  await writeFile(`${output}/server.log`, logs)
}
