/** Full gift selection and mock CRM path; never creates real leads or live goals. */
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import {spawn} from 'node:child_process'
import {chromium} from 'playwright'
import {createJiti} from '../node_modules/jiti/lib/jiti.mjs'
const jiti=createJiti(import.meta.url,{alias:{'@':path.resolve('src')}})
const {CATALOG_GIFTS}=await jiti.import('../src/lib/catalog-gifts.ts')
const base=process.env.GIFTS_QA_BASE||'http://127.0.0.1:3194',out='work/catalog-gifts-qa'
await fs.mkdir(out,{recursive:true})
const child=process.env.GIFTS_QA_BASE?null:spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','3194'],{detached:true,stdio:'ignore'})
let browser,page;const checks=[],leads=[],goals=[]
try{
 for(let n=0;n<60;n++){try{if((await fetch(base,{signal:AbortSignal.timeout(2000)})).ok)break}catch{};await new Promise(r=>setTimeout(r,400))}
 browser=await chromium.launch({headless:true,...(process.env.GIFTS_QA_BROWSER?{executablePath:process.env.GIFTS_QA_BROWSER}:{})})
 const context=await browser.newContext()
 await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort())
 await context.exposeFunction('__captureGiftGoal',(name,params)=>{if(name.startsWith('catalog_gifts_'))goals.push({name,params})})
 await context.addInitScript(()=>{
  try{sessionStorage.setItem('ps_catalog_popup_done','1');sessionStorage.setItem('ps_partner_popup_done','1');localStorage.setItem('proschools-first-city-dismissed','1')}catch{}
  window.__giftGoals=[]
  window.ym=(_counter,action,name,params)=>{if(action==='getClientID'&&typeof name==='function')name('mock-gift-client');if(action==='reachGoal')(window.__giftGoals.push({name,params}),window.__captureGiftGoal(name,params))}
 })
 page=await context.newPage();page.setDefaultTimeout(20000)
 const errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.clock.install({time:new Date('2026-10-26T19:00:00Z')})
 let fail=false
 await page.route('**/api/leads/submit/**',async route=>{leads.push(route.request().postDataJSON());await route.fulfill({status:fail?503:200,contentType:'application/json',body:fail?'{}':'{"success":true,"crm_id":"mock-only"}'})})
 async function visit(width=390){
  await page.setViewportSize({width,height:1000})
  const response=await page.goto(base+'/shkoly/tipy/online/',{waitUntil:'domcontentloaded'});assert.equal(response.status(),200)
  await page.waitForFunction(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent?.trim()==='Ступень обучения');return b&&Object.keys(b).some(k=>k.startsWith('__reactProps$'))})
  await page.evaluate(()=>window.scrollTo(0,700))
  await page.locator('[data-catalog-gifts-banner]').waitFor({state:'visible'})
 }
 async function open(){await page.getByRole('button',{name:'Забрать подарок',exact:true}).click();await page.locator('[data-catalog-gifts-panel][open]').waitFor({state:'visible'})}
 for(const width of [1440,1024,768,390,320]){
  await visit(width);const banner=page.locator('[data-catalog-gifts-banner]')
  assert.match(await banner.innerText(),/10 спецпредложений/);assert.match(await banner.innerText(),/26\.10/)
  const box=await banner.boundingBox();assert.ok(box.height<=120,`${width}: keep compact`)
  await page.evaluate(()=>document.fonts.ready)
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
  if([1440,390].includes(width))await page.screenshot({path:`${out}/banner-${width}.png`})
  await open();assert.equal(await page.locator('[data-gift-offer]').count(),10)
  assert.ok(await page.locator('dialog[open]').evaluate(el=>el.scrollWidth<=el.clientWidth+1))
  await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>Boolean(document.activeElement?.closest('dialog'))))
  if([1440,390].includes(width))await page.screenshot({path:`${out}/panel-${width}.png`})
  await page.keyboard.press('Escape');await page.locator('dialog[open]').waitFor({state:'detached'})
  checks.push({width,compact:true,overflow:false,offers:10,escape:true})
 }
 for(const [index,offer]of CATALOG_GIFTS.entries()){
  await visit(index%2?1440:390);await open();await page.locator(`[data-gift-offer="${offer.id}"]`).click()
  const panel=page.locator('[data-catalog-gifts-panel]');assert.equal(await panel.locator('h2').innerText(),offer.badge)
  const form=panel.locator('form');await form.scrollIntoViewIfNeeded()
  await form.getByPlaceholder('Ваше имя',{exact:true}).fill('Проверка подарка')
  await form.locator('input[type="tel"]').fill('+79162847319');await form.locator('input[type="email"]').fill('gift-check@example.invalid')
  const flags=form.locator('input[type="checkbox"]');assert.equal(await flags.nth(0).isChecked(),true)
  await flags.nth(0).uncheck();await page.waitForFunction(()=>document.querySelector('[data-catalog-gifts-panel] button[type="submit"]')?.disabled===true)
  await flags.nth(0).check();await flags.nth(1).setChecked(index%2===0)
  if(index===0){await page.screenshot({path:`${out}/detail-mobile.png`});await page.setViewportSize({width:1440,height:1000});assert.equal(await page.locator('dialog[open]').count(),1)}
  const before=leads.length;await form.locator('button[type="submit"]').click();await page.waitForURL('**/spasibo/**')
  assert.equal(leads.length,before+1);const lead=leads.at(-1)
  assert.equal(lead.crm,true);assert.equal(lead.product,offer.id);assert.equal(lead.source,`Растяжка подарков: ${offer.productName}`)
  assert.equal(lead.qualification.goal,`${offer.productName}: ${offer.badge}`);assert.equal(lead.pd_agreed,true);assert.equal(lead.marketing_agreed,index%2===0)
  checks.push({offer:offer.id,mockLead:true,source:true,product:true,consents:true})
 }
 await visit();await open();await page.locator('[data-gift-offer="online-school"]').click();const form=page.locator('[data-catalog-gifts-panel] form')
 await form.getByPlaceholder('Ваше имя',{exact:true}).fill('Проверка ошибки');await form.locator('input[type="tel"]').fill('+79162847319');await form.locator('input[type="email"]').fill('gift-error@example.invalid')
 fail=true;await form.locator('button[type="submit"]').click();await form.getByRole('alert').waitFor()
 assert.equal(await page.evaluate(()=>window.__giftGoals.filter(g=>g.name==='catalog_gifts_lead_success').length),0)
 fail=false;await form.locator('button[type="submit"]').click();await page.waitForURL('**/spasibo/**')
 checks.push({failureVisible:true,retry:true,noFalseSuccess:true})
 await visit();await open();await page.clock.fastForward(2*3600*1000+2000)
 assert.match(await page.locator('[data-catalog-gifts-panel]').innerText(),/27\.10/)
 await page.keyboard.press('Escape');await page.getByRole('button',{name:'Закрыть предложения на сегодня'}).click()
 assert.equal(await page.evaluate(()=>localStorage.getItem('ps_catalog_gifts_closed_day')),'2026-10-27')
 await page.reload({waitUntil:'domcontentloaded'});await page.evaluate(()=>window.scrollTo(0,700));assert.equal(await page.locator('[data-catalog-gifts-banner]').count(),0)
 await page.clock.fastForward(24*3600*1000);await page.locator('[data-catalog-gifts-banner]').waitFor({state:'visible'})
 assert.match(await page.locator('[data-catalog-gifts-banner]').innerText(),/28\.10/)
 checks.push({midnightRefresh:true,dismissalPersists:true,nextDayReturns:true})
 await page.evaluate(()=>window.__captureGiftGoal('qa_flush',{}))
 const actions=['view','click','close','panel_view','offer_open','form_view','form_start','form_submit','lead_success','lead_error']
 for(const action of actions)assert.ok(goals.some(g=>g.name==='catalog_gifts_'+action),action)
 assert.equal(goals.filter(g=>g.name==='catalog_gifts_lead_success').length,11)
 assert.equal(leads.length,12)
 for(const g of goals)assert.ok(Object.keys(g.params).every(k=>['experiment','page_path','day','offer'].includes(k)))
 assert.deepEqual(errors,[])
 await fs.writeFile(`${out}/qa.json`,JSON.stringify({result:'passed',checks,mockLeads:leads.length,goals},null,2))
 console.log(JSON.stringify({result:'passed',checks:checks.length,mockLeads:leads.length}))
}catch(error){await page?.screenshot({path:`${out}/failure.png`}).catch(()=>{});await fs.writeFile(`${out}/failure.json`,JSON.stringify({error:String(error),checks,mockLeads:leads.length,goals},null,2));throw error
}finally{await browser?.close();if(child)try{process.kill(-child.pid,'SIGTERM')}catch{child.kill('SIGTERM')}}
