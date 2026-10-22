/** Validate the actual compiled pages and browser submission payload; send no real leads. */
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const base = 'http://127.0.0.1:3195'
const output = 'work/leads-growth-qa'
await mkdir(output, { recursive: true })
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3195'], {
  detached: true, env: { ...process.env, NODE_ENV: 'production' }, stdio: ['ignore', 'pipe', 'pipe'],
})
let logs = '', browser
server.stdout.on('data', d => { logs += d })
server.stderr.on('data', d => { logs += d })
const results = [], errors = []
function stop() { try { process.kill(-server.pid, 'SIGTERM') } catch { server.kill() } }
const timeout = setTimeout(() => { stop(); process.exit(1) }, 170000)
try {
  let ready = false
  for (let i = 0; i < 70; i++) {
    try { if ((await fetch(base, { signal: AbortSignal.timeout(2500) })).ok) { ready = true; break } } catch {}
    await new Promise(r => setTimeout(r, 400))
  }
  assert.ok(ready, 'Compiled server must start')
  browser = await chromium.launch({ headless: true, ...(process.env.QA_CHROME_PATH ? { executablePath: process.env.QA_CHROME_PATH } : {}) })
  const context = await browser.newContext()
  await context.addInitScript(() => {
    // Init scripts also run in sandboxed map/ad frames, where storage is unavailable.
    if (window.top !== window) return
    window.__growthEvents = []
    window.ym = (...args) => window.__growthEvents.push(args)
    try {
      sessionStorage.setItem('ps_catalog_popup_done', '1')
      sessionStorage.setItem('ps_partner_popup_done', '1')
      localStorage.setItem('proschools-first-city-dismissed', '1')
      localStorage.setItem('ps_partner_banner_closed', String(Date.now()))
    } catch { /* Opaque pre-navigation documents are not the application under test. */ }
  })
  let payload
  await context.route('**/*', route => {
    const request = route.request()
    if (request.url().startsWith(base + '/api/leads/submit')) {
      payload = request.postDataJSON()
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, crm_id: 'browser-test-only' }) })
    }
    return request.url().startsWith(base) ? route.continue() : route.abort()
  })
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  const paths = ['/attestat-vzroslomu/', '/shkoly/tipy/online/', '/shkoly/sankt-peterburg/vechernie/', '/shkoly/tipy/vechernie/besplatnye/', '/blog/eksternat-ili-vechernyaya-shkola/', '/blog/attestat-vzroslomu-11-klass/', '/blog/kak-poluchit-attestat-esli-ne-zakonchil-shkolu/', '/shkola/vechernyaya-shkola-185-ekaterinburg-1/', '/shkola/centr-obrazovaniya-195-sankt-peterburg/', '/shkoly/tipy/vechernie/9-klass/', '/shkoly/tipy/vechernie/posle-9-klassa/', '/shkoly/tipy/vechernie/starshie-klassy/', '/shkoly/ekaterinburg/vechernie/', '/shkoly/moskva/vechernie/', '/shkoly/tyumen/vechernie/', '/shkoly/omsk/vechernie/', '/blog/attestat-vzroslomu-9-klass/', '/shkola/vechernyaya-shkola-kalininskogo-rayona-chelyabinsk/']
  for (const path of paths) {
    const response = await page.goto(base + path)
    assert.equal(response.status(), 200, path)
    assert.equal(await page.locator('h1').count(), 1, path)
    assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), 'https://pro-schools.ru' + path)
    assert.ok(!(await page.locator('meta[name=robots]').getAttribute('content') || '').includes('noindex'), path)
    if (path.includes('/shkoly/') && path.includes('vechernie')) {
      const chooser = page.locator('[data-evening-route]')
      assert.equal(await chooser.count(), 1, 'One route chooser: ' + path)
      assert.equal(await chooser.evaluate(n => Boolean(n.closest('aside'))), false)
      const card = page.locator('a[href^="/shkola/"]').first()
      if (await card.count()) {
        const choiceBox = await chooser.boundingBox(), cardBox = await card.boundingBox()
        assert.ok(choiceBox && cardBox && choiceBox.y < cardBox.y, 'Route must precede cards')
      }
    }
    if (['/shkoly/ekaterinburg/vechernie/', '/shkoly/sankt-peterburg/vechernie/'].includes(path)) {
      assert.equal(await page.locator('#proverennyj-priem[data-verified-admissions]').count(), 1)
      assert.equal(await page.locator('[data-growth-choice=local-school]').getAttribute('href'), '#proverennyj-priem')
    }
    if (path === '/shkoly/tipy/online/') assert.equal(await page.locator('[data-growth-block=online-intent]').count(), 1)
    if (path.includes('/shkola/')) assert.equal(await page.locator('#kontakty').count(), 1)
    results.push({ path, status: 200, canonical: 'valid' })
  }
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width <= 390 ? 844 : 1000 })
    for (const path of ['/attestat-vzroslomu/', '/shkoly/ekaterinburg/vechernie/', '/shkoly/tipy/vechernie/9-klass/', '/shkoly/tipy/online/', '/shkoly/sankt-peterburg/vechernie/', '/blog/eksternat-ili-vechernyaya-shkola/']) {
      await page.goto(base + path)
      await page.evaluate(() => document.fonts.ready)
      await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth + 1, null, { timeout: 5000 })
      if (path === '/attestat-vzroslomu/' && width <= 390) {
        const cta = await page.locator('a[href="#programma-9"]').first().boundingBox()
        assert.ok(cta && cta.y + cta.height <= 844, 'Adult programme choice must fit the first mobile screen')
      }
      results.push({ path, width, overflow: false })
      if ([1440, 390, 320].includes(width)) await page.screenshot({ path: `${output}/${path.includes('attestat') ? 'adult' : path.includes('9-klass') ? 'grade9' : path.includes('/online/') ? 'online' : path.includes('/blog/') ? 'comparison' : path.includes('sankt-peterburg') ? 'spb' : 'city'}-${width}.png` })
    }
  }
  // This is a real internal navigation: retain the first entry, submit on a different URL.
  await page.evaluate(() => { sessionStorage.removeItem('ps_utm'); sessionStorage.removeItem('ps_visit_entry_v1') })
  await page.goto(base + '/shkoly/ekaterinburg/vechernie/?utm_source=yandex&utm_campaign=qa-first-entry')
  await page.locator('[data-evening-route] a[href="/attestat-vzroslomu/#programma-9"]').click()
  await page.waitForURL('**/attestat-vzroslomu/#programma-9')
  const form = page.locator('#konsultaciya form')
  await page.waitForFunction(() => document.querySelector('#konsultaciya select')?.value === 'Аттестат за 9 класс', null, { timeout: 5000 })
  assert.equal(await form.getByLabel('Что хотите закончить?').inputValue(), 'Аттестат за 9 класс', 'Route preselects the programme without requiring another answer')
  await form.getByRole('button', { name: 'Узнать условия онлайн-обучения' }).click()
  assert.equal(payload, undefined, 'Invalid form cannot submit')
  await form.getByPlaceholder('Ваше имя').fill('Browser test')
  await form.locator('input[type=tel]').fill('+79001234568')
  await form.locator('input[type=email]').fill('browser-test@example.invalid')
  await form.getByLabel('Что хотите закончить?').selectOption('Аттестат за 9 класс')
  await form.getByLabel('Для кого обучение?').selectOption('Для себя, 18 лет и старше')
  await form.getByLabel('Когда удобно позвонить?', { exact: false }).selectOption('16:00–20:00 МСК')
  await form.getByRole('button', { name: 'Узнать условия онлайн-обучения' }).click()
  const growthEvents = await page.evaluate(() => window.__growthEvents.filter(e => String(e[2]).startsWith('growth_')))
  for (const name of ['growth_route_view', 'growth_route_click', 'growth_form_start', 'growth_form_error']) assert.ok(growthEvents.some(e => e[2] === name), name)
  assert.ok(!JSON.stringify(growthEvents).includes('browser-test@example.invalid'), 'No contacts in analytics')
  await page.waitForURL('**/spasibo/')
  assert.ok(payload)
  assert.equal(new URL(payload.landing_url).pathname, '/shkoly/ekaterinburg/vechernie/')
  assert.equal(new URL(payload.page_url).pathname, '/attestat-vzroslomu/')
  assert.equal(payload.utm.utm_source, 'yandex')
  assert.equal(payload.utm.utm_campaign, 'qa-first-entry')
  assert.equal(payload.qualification.goal, 'Аттестат за 9 класс')
  assert.equal(payload.qualification.callback_time, '16:00–20:00 МСК')
  assert.equal(payload.marketing_agreed, false)
  assert.equal(payload.product, 'attestat-online')
  assert.equal(payload.selected_route, 'attestat-9')
  assert.equal(payload.growth_release, 'leads-growth-20261022-r2')
  assert.ok(payload.form_id)
  // An existing school form also forwards callback preference; no extra required field.
  payload = undefined
  await page.goto(base + '/shkola/gbou-shkola-179-moskva/')
  const schoolForm = page.locator('form[data-growth-form]').first()
  await schoolForm.getByPlaceholder('Ваше имя').fill('Browser test')
  await schoolForm.locator('input[type=tel]').fill('+79001234568')
  await schoolForm.locator('input[type=email]').fill('browser-test@example.invalid')
  await schoolForm.getByLabel('Когда удобно позвонить?', { exact: false }).selectOption('12:00–16:00 МСК')
  await schoolForm.getByRole('button', { name: 'Отправить заявку', exact: true }).click()
  await page.waitForURL('**/spasibo/')
  assert.equal(payload.qualification.callback_time, '12:00–16:00 МСК')
  assert.equal(payload.marketing_agreed, false)
  results.push({ flow: 'existing form callback preference', passed: true, realLeadsSent: 0 })
  assert.deepEqual(errors, [], 'No browser exceptions')
  results.push({ flow: 'two-page attribution and mock submission', passed: true, realLeadsSent: 0 })
  await writeFile(`${output}/results.json`, JSON.stringify({ passed: true, results }, null, 2))
  console.log('Passed compiled SEO pages, 5 viewport widths and mocked lead attribution')
} catch (error) {
  await writeFile(`${output}/results.json`, JSON.stringify({ passed: false, error: error.stack, results, errors }, null, 2))
  throw error
} finally {
  clearTimeout(timeout)
  if (browser) await browser.close()
  stop()
  await writeFile(`${output}/server.log`, logs)
}
