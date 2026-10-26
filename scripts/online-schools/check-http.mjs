/** Verify the shared online catalog, responsive filters and mock-only lead delivery. */
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {spawn} from 'node:child_process'
import {chromium} from 'playwright'
const base=process.env.ONLINE_QA_BASE||'http://127.0.0.1:3195',output='work/online-catalog-qa'
await fs.mkdir(output,{recursive:true})
const child=process.env.ONLINE_QA_BASE?null:spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','3195'],{detached:true,stdio:'ignore'})
let browser,page;const checks=[],leads=[]
try{
 for(let n=0;n<60;n++){try{if((await fetch(base,{signal:AbortSignal.timeout(2000)})).ok)break}catch{};await new Promise(r=>setTimeout(r,400))}
 browser=await chromium.launch({headless:true,...(process.env.ONLINE_QA_BROWSER?{executablePath:process.env.ONLINE_QA_BROWSER}:{})});const context=await browser.newContext()
 await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort())
 await context.addInitScript(()=>{window.sessionStorage.setItem('ps_catalog_popup_done','1');window.sessionStorage.setItem('ps_partner_popup_done','1')})
 page=await context.newPage();page.setDefaultTimeout(20000)
 const errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/api/leads/submit/**',async route=>{leads.push(route.request().postDataJSON());await route.fulfill({status:200,contentType:'application/json',body:'{"success":true,"crm_id":"mock-only"}'})})
 for(const path of ['/shkoly/moskva/online/','/shkoly/tomsk/online/','/shkoly/tipy/online/']){
  for(const width of [1440,1024,768,390,320]){
   await page.setViewportSize({width,height:1000});const response=await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:120000});assert.equal(response.status(),200)
   await page.locator('h1').waitFor();await page.evaluate(()=>document.fonts.ready)
   await page.waitForFunction(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent?.trim()==='Ступень обучения');return b&&Object.keys(b).some(k=>k.startsWith('__reactProps$'))})
   assert.equal(await page.locator('h1').count(),1)
   assert.equal(await page.getByTitle('На карте',{exact:true}).count(),0,'Online offices must not be presented as nearby campuses')
   const card=page.locator('a[href^="/shkola/"]').first(), table=page.locator('table').first()
   assert.ok(await card.isVisible());assert.ok((await card.boundingBox()).y<(await table.boundingBox()).y,'Cards before comparison')
   assert.match(await page.locator('body').innerText(),/51/)
   const dims=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(dims.scroll<=width+1,JSON.stringify({path,...dims}))
   if(width<768){await page.getByRole('button',{name:'Фильтры',exact:true}).click();await page.getByRole('button',{name:'Ступень обучения',exact:true}).last().click();await page.getByRole('checkbox',{name:/Начальная/}).last().check();await page.getByRole('button',{name:/Показать \d+ школ/}).click()}
   else{const sidebar=page.locator('aside').filter({hasText:'Ступень обучения'});await sidebar.getByRole('button',{name:'Ступень обучения',exact:true}).click();await sidebar.getByRole('checkbox',{name:/Начальная/}).check()}
   assert.equal(new URL(page.url()).pathname,path,'School-level filter remains on current online page')
   assert.ok(await page.getByText('Начальная (1–4 кл.)',{exact:true}).count())
   await page.locator('select').selectOption('price_asc')
   if([1440,390].includes(width))await page.screenshot({path:`${output}/${path.includes('/moskva/')?'moskva':path.includes('/tomsk/')?'tomsk':'hub'}-${width}.png`})
   checks.push({path,width,filters:true,cardsBeforeComparison:true,overflow:false})
  }
 }
 for(const [width,marketing]of [[1440,true],[390,false]]){
  await page.setViewportSize({width,height:1000});await page.goto(base+'/shkoly/moskva/online/',{waitUntil:'domcontentloaded'});await page.evaluate(()=>window.dispatchEvent(new Event('ps:catalog-drawer-open')))
  const form=page.locator('#podbor form');await form.scrollIntoViewIfNeeded();await form.getByPlaceholder('Ваше имя',{exact:true}).fill('Проверка каталога');await form.locator('input[type="tel"]').fill('+79162847319');await form.locator('input[type="email"]').fill('catalog-check@example.invalid')
  const flags=form.locator('input[type="checkbox"]');assert.equal(await flags.nth(0).isChecked(),true);await flags.nth(0).uncheck();assert.equal(await form.locator('button[type="submit"]').isDisabled(),true);await flags.nth(0).check();await flags.nth(1).setChecked(marketing);await form.locator('button[type="submit"]').click();await page.waitForURL('**/spasibo/**',{timeout:120000})
  const lead=leads.at(-1);assert.equal(lead.crm,true);assert.equal(lead.pd_agreed,true);assert.equal(lead.marketing_agreed,marketing);assert.equal(lead.source,'Онлайн-школы: город Москва');assert.equal(lead.city,'Москва');checks.push({mock:true,width,marketing,thanks:true})
 }
 assert.equal(leads.length,2);assert.deepEqual(errors,[])
 await fs.writeFile(`${output}/qa.json`,JSON.stringify({result:'passed',checks,leads},null,2));console.log(JSON.stringify({result:'passed',checks:checks.length,mockLeads:leads.length}))
}catch(error){await page?.screenshot({path:`${output}/failure.png`}).catch(()=>{});await fs.writeFile(`${output}/failure.json`,JSON.stringify({error:String(error),checks,leads},null,2));throw error
}finally{await browser?.close();if(child)try{process.kill(-child.pid,'SIGTERM')}catch{child.kill('SIGTERM')}}
