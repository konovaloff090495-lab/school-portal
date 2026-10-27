import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const base = process.env.SCHOOL_CARD_QA_BASE || 'http://127.0.0.1:3196'
const baselineMode = process.env.SCHOOL_CARD_BASELINE === '1'
const output = baselineMode ? 'work/school-cards-before' : 'work/school-cards-qa'
await fs.mkdir(output, { recursive: true })
const guides = JSON.parse(await fs.readFile('src/data/school-card-guides.json', 'utf8'))
const seoBaseline = JSON.parse(await fs.readFile('docs/school-cards/seo-baseline-2026-10-27.json', 'utf8'))
const seoCorrections = JSON.parse(await fs.readFile('docs/school-cards/intentional-seo-corrections.json', 'utf8'))
const child = process.env.SCHOOL_CARD_QA_BASE ? null : spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3196'], { detached: true, stdio: 'ignore' })
const checks = [], errors = [], leads = [], failedAssets = []
let browser, page
try {
  for (let n = 0; n < 90; n++) {
    try { if ((await fetch(base + '/robots.txt', { signal: AbortSignal.timeout(2000) })).ok) break } catch {}
    await new Promise(r => setTimeout(r, 500))
  }
  browser = await chromium.launch({ headless: true, ...(process.env.SCHOOL_CARD_QA_BROWSER ? { executablePath: process.env.SCHOOL_CARD_QA_BROWSER } : {}) })
  const context = await browser.newContext()
  await context.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort())
  await context.addInitScript(() => {
    if (window.top !== window) return
    sessionStorage.setItem('ps_catalog_popup_done', '1')
    sessionStorage.setItem('ps_partner_popup_done', '1')
    localStorage.setItem('proschools-first-city-dismissed', '1')
  })
  page = await context.newPage()
  page.setDefaultTimeout(20000)
  page.on('pageerror', e => errors.push(e.message))
  page.on('response', r => { if (r.url().startsWith(base) && r.status() >= 400 && /\.(?:js|css|woff2?|webp|png|jpg)(?:\?|$)|\/_next\/image/.test(r.url())) failedAssets.push({ url: r.url(), status: r.status() }) })
  await page.route('**/api/leads/submit/**', async r => {
    assert.equal(baselineMode, false, 'Baseline must never submit')
    leads.push(r.request().postDataJSON())
    await r.fulfill({ status: leads.length === 1 ? 503 : 200, contentType: 'application/json', body: leads.length === 1 ? '{"error":"mock-only"}' : '{"success":true,"crm_id":"mock-only"}' })
  })
  const paths = [
    '/shkola/vechernyaya-shkola-1-vasileostrovsky-sankt-peterburg/',
    '/shkola/centr-obrazovaniya-18-nevsky-sankt-peterburg/',
    '/shkola/eksternal-shkola-185-moskva/',
    '/shkola/mbou-vechernyaya-shkola-1-novosibirsk/',
    '/shkola/centr-obrazovaniya-195-sankt-peterburg/',
    '/shkola/onlain-shkola-skysmart-moskva/',
    '/shkola/gbou-shkola-179-moskva/',
  ]
  for (const path of paths) {
    for (const width of baselineMode ? [360, 1366] : [320, 360, 390, 768, 1366, 1920]) {
      await page.setViewportSize({ width, height: width < 768 ? 800 : 1000 })
      const response = await page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 120000 })
      assert.equal(response.status(), 200, path)
      await page.evaluate(() => document.fonts.ready)
      await page.waitForFunction(() => { const input = document.querySelector('form[data-growth-form="school-card"] input[type="tel"]'); return input && Object.keys(input).some(k => k.startsWith('__reactProps$')) })
      assert.equal(await page.locator('h1').count(), 1)
      assert.equal(await page.locator('form[data-growth-form="school-card"]').count(), 1, 'One form, one state')
      const geometry = await page.evaluate(() => {
        const form = document.querySelector('form[data-growth-form="school-card"]')
        const faq = [...document.querySelectorAll('h2')].find(x => x.textContent === 'Часто задаваемые вопросы')
        const tel = form.querySelector('input[type="tel"]')
        return { overflow: document.documentElement.scrollWidth > innerWidth + 1, formY: Math.round(form.getBoundingClientRect().top + scrollY), faqY: faq ? Math.round(faq.getBoundingClientRect().top + scrollY) : null, inputFont: parseFloat(getComputedStyle(tel).fontSize), inputHeight: tel.getBoundingClientRect().height, submitHeight: form.querySelector('button[type="submit"]').getBoundingClientRect().height }
      })
      assert.equal(geometry.overflow, false, path + ' @' + width)
      if (!baselineMode) {
        assert.ok(geometry.formY < geometry.faqY, 'The mobile form must precede FAQ')
        assert.ok(geometry.inputFont >= 16, 'No iOS focus zoom')
        assert.ok(geometry.inputHeight >= 44 && geometry.submitHeight >= 44, 'Usable touch targets')
        const titleGeometry = await page.evaluate(() => {
          const h = document.querySelector('h1').getBoundingClientRect(), g = document.querySelector('[data-school-gallery]').getBoundingClientRect()
          return { inside: h.top >= g.top && h.bottom <= g.bottom, controlsClear: innerWidth >= 768 || h.top >= g.top + 64 }
        })
        assert.ok(titleGeometry.inside && titleGeometry.controlsClear, 'Long school name must fit below the mobile photo controls')
        if (width < 768) {
          const breadcrumbLinks = page.getByRole('navigation', { name: 'Хлебные крошки' }).locator('a')
          if (await breadcrumbLinks.count() > 1) {
            const first = await breadcrumbLinks.nth(0).boundingBox(), second = await breadcrumbLinks.nth(1).boundingBox()
            assert.ok(Math.abs(first.y - second.y) < 2, 'Quick action CSS must not put the first breadcrumb on its own row')
          }
        }
        const cta = page.getByRole('navigation', { name: 'Быстро перейти в карточке' }).locator('a[href="#school-card-form"]')
        if (width < 768) assert.ok((await cta.boundingBox()).y < 800, 'Consultation shortcut on first mobile screen')
        await cta.click()
        await page.waitForFunction(() => location.hash === '#school-card-form')
        const clickCheck = await page.locator('#school-card-form input[type="text"]').first().evaluate(el => {
          const r = el.getBoundingClientRect(), top = document.elementFromPoint(r.x + r.width / 2, r.y + Math.min(r.height / 2, 20))
          return { top: r.top, visible: el === top || el.contains(top) }
        })
        assert.ok(clickCheck.visible, 'Form input must not be covered after anchor navigation: ' + JSON.stringify(clickCheck))
        const titleVisible = await page.locator('#school-card-form h3').first().evaluate(el => { const r = el.getBoundingClientRect(); const top = document.elementFromPoint(r.x + Math.min(r.width / 2, 50), r.y + 8); return el === top || el.contains(top) })
        assert.ok(titleVisible, 'The sticky header must not cover the form heading after anchor navigation')
        await page.goto(base + path, { waitUntil: 'domcontentloaded' })
        await page.evaluate(() => document.fonts.ready)
      }
      if ([360, 1366].includes(width) && [paths[0], paths[3], paths[5]].includes(path)) {
        const name = path.split('/').at(-2)
        await page.screenshot({ path: `${output}/${name}-${width}.png` })
        if (!baselineMode && width === 360) {
          await page.getByRole('navigation', { name: 'Быстро перейти в карточке' }).locator('a[href="#school-card-form"]').click()
          await page.screenshot({ path: `${output}/${name}-${width}-form.png` })
          if (await page.locator('[data-school-card-guide]').count()) {
            await page.locator('[data-school-card-guide]').scrollIntoViewIfNeeded()
            await page.screenshot({ path: `${output}/${name}-${width}-content.png` })
          }
        }
      }
      checks.push({ path, width, ...geometry })
    }
  }
  if (!baselineMode) {
    for (const row of seoBaseline) {
      // This catalog is served by the isolated static publisher in Nginx, not Next.
      // Keep its public baseline for post-deploy verification; a loopback Next response is a different page.
      if (row.path === '/shkoly/tomsk/programmirovanie/' && !base.startsWith('https://pro-schools.ru')) {
        checks.push({ staticDeploymentSurface: row.path, publicCheckRequired: true }); continue
      }
      await page.goto(base + row.path, { waitUntil: 'domcontentloaded', timeout: 120000 })
      const actual = await page.evaluate(() => ({ title: document.title, description: document.querySelector('meta[name="description"]')?.content || '', canonical: document.querySelector('link[rel="canonical"]')?.href || '', h1: document.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim() || '', robots: document.querySelector('meta[name="robots"]')?.content || '' }))
      for (const key of ['title', 'description', 'canonical', 'h1', 'robots']) assert.equal(actual[key], seoCorrections[row.path]?.[key] ?? row[key], row.path + ' ' + key)
      checks.push({ seo: row.path, unchanged: true })
    }
    for (const slug of Object.keys(guides)) {
      await page.goto(base + '/shkola/' + slug + '/', { waitUntil: 'domcontentloaded', timeout: 120000 })
      assert.equal(await page.locator('[data-school-card-guide]').count(), 1)
      for (const source of guides[slug].sources) assert.ok(await page.locator('[data-school-card-guide]').getByRole('link', { name: source.label + ' ↗', exact: true }).count())
      const schema = await page.locator('script[type="application/ld+json"]').allTextContents()
      const faq = schema.map(s => JSON.parse(s)).find(s => s['@type'] === 'FAQPage')
      assert.deepEqual(faq.mainEntity.map(q => q.name), guides[slug].faq.map(q => q.q))
      const detail = page.locator('.faq-item').first()
      await detail.locator('summary').click()
      assert.equal(await detail.getAttribute('open'), '')
      checks.push({ content: slug, officialSources: true, faqSchemaMatches: true })
    }
    for (const [path, width, marketing] of [[paths[0], 360, false], [paths[3], 390, true], [paths[5], 320, false], [paths[6], 1366, true]]) {
      await page.setViewportSize({ width, height: 800 })
      await page.goto(base + path, { waitUntil: 'domcontentloaded' })
      await page.waitForFunction(() => { const input = document.querySelector('form[data-growth-form="school-card"] input[type="tel"]'); return input && Object.keys(input).some(k => k.startsWith('__reactProps$')) })
      const form = page.locator('form[data-growth-form="school-card"]')
      const flags = form.locator('input[type="checkbox"]')
      assert.ok(await flags.nth(0).isChecked()); assert.ok(await flags.nth(1).isChecked())
      await flags.nth(0).uncheck(); assert.ok(await form.locator('button[type="submit"]').isDisabled()); await flags.nth(0).check()
      await form.getByLabel('Ваше имя', { exact: true }).fill('Проверка карточки')
      await form.getByLabel('Номер телефона', { exact: true }).fill('123')
      await form.getByLabel('Номер телефона', { exact: true }).blur()
      assert.ok(await form.locator('p.text-red-500').count(), 'Invalid phone feedback')
      await form.getByLabel('Номер телефона', { exact: true }).fill('+79162847319')
      await form.getByLabel('Электронная почта', { exact: true }).fill('school-card-check@example.invalid')
      await flags.nth(1).setChecked(marketing)
      await form.locator('button[type="submit"]').click()
      if (leads.length === 1) {
        await form.getByRole('alert').waitFor(); assert.ok(await form.getByLabel('Ваше имя', { exact: true }).inputValue())
        await form.locator('button[type="submit"]').click()
      }
      await page.waitForURL('**/spasibo/**', { timeout: 120000 })
      const lead = leads.at(-1)
      assert.equal(lead.marketing_agreed, marketing); assert.equal(lead.pd_agreed, true); assert.equal(lead.crm, true)
      assert.ok(lead.school && lead.city); assert.match(lead.source, /^Карточка школы:/)
      assert.ok(JSON.stringify(lead).includes(path), 'Submission page retained')
      checks.push({ mock: path, width, marketing, success: true })
    }
    assert.equal(leads.length, 5, 'One error + four successful mock sends')
  }
  assert.deepEqual(errors, [])
  if (!baselineMode) assert.deepEqual(failedAssets, [])
  await fs.writeFile(output + '/qa.json', JSON.stringify({ result: 'passed', mode: baselineMode ? 'before' : 'after', checks, mockRequests: leads.length, errors, failedAssets }, null, 2))
  console.log(JSON.stringify({ result: 'passed', checks: checks.length, mockRequests: leads.length, baselineMode }))
} catch (error) {
  await page?.screenshot({ path: output + '/failure.png' }).catch(() => {})
  await fs.writeFile(output + '/failure.json', JSON.stringify({ error: String(error), checks, mockRequests: leads.length, errors, failedAssets }, null, 2))
  throw error
} finally {
  await browser?.close()
  if (child) try { process.kill(-child.pid, 'SIGTERM') } catch { child.kill('SIGTERM') }
}
