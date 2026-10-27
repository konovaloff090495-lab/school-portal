import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import{spawn}from'node:child_process'
import{chromium}from'playwright'
import{createHash}from'node:crypto'
const base=process.env.EXTERNAT_QA_BASE||'http://127.0.0.1:3194',output='work/externat-qa'
await fs.mkdir(output,{recursive:true})
const child=process.env.EXTERNAT_QA_BASE?null:spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','3194'],{detached:true,stdio:'ignore'})
let browser,page;const checks=[],leads=[],errors=[]
try{
 for(let n=0;n<60;n++){try{if((await fetch(base+'/robots.txt',{signal:AbortSignal.timeout(2000)})).ok)break}catch{};await new Promise(r=>setTimeout(r,500))}
 browser=await chromium.launch({headless:true,...(process.env.EXTERNAT_QA_BROWSER?{executablePath:process.env.EXTERNAT_QA_BROWSER}:{})});const context=await browser.newContext()
 await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort())
 await context.addInitScript(()=>{sessionStorage.setItem('ps_catalog_popup_done','1');sessionStorage.setItem('ps_partner_popup_done','1');localStorage.setItem('proschools-first-city-dismissed','1')})
 page=await context.newPage();page.setDefaultTimeout(25000);page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/api/leads/submit/**',async r=>{leads.push(r.request().postDataJSON());await r.fulfill({status:200,contentType:'application/json',body:'{"success":true,"crm_id":"mock-only"}'})})
 for(const path of ['/shkoly/tipy/eksternal/','/shkoly/tomsk/eksternal/','/shkoly/kazan/eksternal/']){
  for(const width of [1440,1024,768,390,320]){
   await page.setViewportSize({width,height:1000});const response=await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:120000});assert.equal(response.status(),200)
   await page.waitForFunction(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent?.trim()==='Формат обучения');return b&&Object.keys(b).some(k=>k.startsWith('__reactProps$'))});await page.evaluate(()=>document.fonts.ready)
   assert.equal(await page.locator('h1').count(),1)
   const card=page.locator('article a[href^="/shkola/"]').first();assert.ok(await card.isVisible());assert.ok((await card.boundingBox()).y<800,'Catalog must be on the first screen')
   const advice=page.getByRole('heading',{name:'Экстернат: аттестация и учебная программа отдельно'});if(await advice.count())assert.ok((await advice.boundingBox()).y>(await card.boundingBox()).y)
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow')
   let panel
   if(width<768){await page.getByRole('button',{name:/^Фильтры/}).click();panel=page.locator('[role="dialog"]').filter({hasText:'Формат обучения'});if(!await panel.count())panel=page.locator('div.fixed').filter({has:page.getByRole('button',{name:/Показать \d+ школ/})}).last()}
   else panel=page.locator('aside').filter({hasText:'Формат обучения'})
   // There are desktop/mobile copies of the panel; use the visible controls.
   const localRadio=page.getByRole('radio',{name:/Школы и площадки в городе/}).filter({visible:true});await localRadio.check()
   if(width<768)await page.getByRole('button',{name:/Показать \d+ школ/}).click()
   await page.waitForTimeout(150);assert.ok(!await page.locator('article').filter({hasText:'Дистанционно, вся Россия'}).count(),'Local filter excludes national providers')
   if(width<768)await page.getByRole('button',{name:/^Фильтры/}).click()
   const onlineRadio=page.getByRole('radio',{name:/Дистанционно по России/}).filter({visible:true});await onlineRadio.check()
   if(width<768)await page.getByRole('button',{name:/Показать \d+ школ/}).click()
   await page.waitForTimeout(150);assert.equal(await page.locator('article').count(),24,'Online page first batch');assert.match(await page.locator('body').innerText(),/Дистанционные программы: 34/)
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
   if(width<768)await page.getByRole('button',{name:/^Фильтры/}).click()
   await page.getByRole('radio',{name:/Все варианты/}).filter({visible:true}).check()
   const details=page.locator('details').filter({has:page.locator('nav[aria-label="Программы экстерната"]')}).filter({visible:true});await details.locator('summary').click();assert.ok(await details.getByRole('link',{name:'9 класс / ОГЭ',exact:true}).isVisible())
   if(width<768)await page.getByRole('button',{name:/Показать \d+ школ/}).click()
   if([1440,390].includes(width))await page.screenshot({path:`${output}/${path.includes('/tomsk/')?'tomsk':path.includes('/kazan/')?'kazan':'hub'}-${width}.png`})
   checks.push({path,width,localFilter:true,nationalFilter:true,sidebarLinks:true,overflow:false})
  }
 }
 const detail=await fetch(base+'/shkola/spb-eksternat-449/');assert.equal(detail.status,200);assert.ok(!(await detail.text()).includes('href="/shkola/ekstern-tsentr-dopolnitelnogo-profession-sankt-peterburg-7/"'),'Do not recommend a DPO center as another externat school');checks.push({excludedNotRecommended:true})
 const covers=JSON.parse(await fs.readFile('src/data/externat-school-covers.json','utf8'));for(const c of Object.values(covers)){const r=await fetch(base+c.src);assert.equal(r.status,200,c.src);const hash=createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex');assert.equal(hash,c.sha256,c.src);const fallback=await fetch(base+c.fallbackSrc);assert.equal(fallback.status,200,c.fallbackSrc);await fallback.arrayBuffer()}checks.push({coverFiles:Object.keys(covers).length,allLoaded:true,sha256:true})
 // Mock the existing conversion path on this page, never send a real lead.
 for(const[width,marketing]of[[1440,true],[390,false]]){
  await page.setViewportSize({width,height:1000});await page.goto(base+'/shkoly/tomsk/eksternal/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>{const input=document.querySelector('form input[type="tel"]');return input&&Object.keys(input).some(k=>k.startsWith('__reactProps$'))})
  const form=page.locator('form').filter({has:page.locator('input[type="tel"]')}).first();await form.scrollIntoViewIfNeeded();await form.locator('input[type="text"]').first().fill('Проверка экстерната');await form.locator('input[type="tel"]').fill('+79162847319');await form.locator('input[type="email"]').fill('externat-check@example.invalid')
  const flags=form.locator('input[type="checkbox"]');assert.ok(await flags.nth(0).isChecked());await flags.nth(0).uncheck();assert.ok(await form.locator('button[type="submit"]').isDisabled());await flags.nth(0).check();await flags.nth(1).setChecked(marketing);await form.locator('button[type="submit"]').click();await page.waitForURL('**/spasibo/**',{timeout:120000});const lead=leads.at(-1);assert.equal(lead.pd_agreed,true);assert.equal(lead.marketing_agreed,marketing);assert.equal(lead.city,'Томск');assert.match(lead.source,/Экстернат/);checks.push({mock:true,width,marketing})
 }
 assert.equal(leads.length,2);assert.deepEqual(errors,[]);await fs.writeFile(output+'/qa.json',JSON.stringify({result:'passed',checks,mockLeads:leads.length},null,2));console.log(JSON.stringify({result:'passed',checks:checks.length,mockLeads:leads.length}))
}catch(e){await page?.screenshot({path:output+'/failure.png'}).catch(()=>{});await fs.writeFile(output+'/failure.json',JSON.stringify({error:String(e),checks,mockLeads:leads.length},null,2));throw e}finally{await browser?.close();if(child)try{process.kill(-child.pid,'SIGTERM')}catch{child.kill('SIGTERM')}}
