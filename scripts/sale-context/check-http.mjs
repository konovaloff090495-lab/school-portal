/** Actual compiled route -> contextual UI -> attributed sale offer. No leads or external calls. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const base=process.env.SALE_QA_BASE||'http://127.0.0.1:3194';
const output='work/sale-context-qa';await fs.mkdir(output,{recursive:true});
const child=process.env.SALE_QA_BASE?null:spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','3194'],{detached:true,stdio:'ignore'});
let browser;const errors=[],checks=[];
try{
 for(let n=0;n<60;n++){try{if((await fetch(base+'/robots.txt')).ok)break;}catch{}await new Promise(r=>setTimeout(r,500));}
 browser=await chromium.launch({headless:true});const ctx=await browser.newContext();
 await ctx.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
 await ctx.addInitScript(()=>{localStorage.setItem('proschools-first-city-dismissed','1');sessionStorage.setItem('ps_sale_clicked',String(Date.now()));window.ym=()=>{};});
 const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
 const scenarios=[['/blog/python-dlya-detej/','world-teen'],['/blog/vechernyaya-shkola-dlya-vzroslyh/','externat'],['/oge/','oge-pair']];
 for(const width of [1440,768,390,320]){
  await page.setViewportSize({width,height:900});
  for(const [path,id]of scenarios){
   await page.goto(base+path,{waitUntil:'domcontentloaded'});
   const banner=page.locator('[data-ps-sale="banner"]');await banner.waitFor({state:'visible'});
   assert.equal(await banner.getAttribute('data-offer'),id);
   const href=await banner.locator('a').getAttribute('href');const url=new URL(href);
   assert.equal(url.origin,'https://school-university.com');assert.equal(url.pathname,'/sale/');assert.equal(url.hash,'#offer='+id);assert.equal(url.searchParams.get('utm_source'),'gerasimov_lav');
   assert.equal(await page.locator('img[src="/diplom-popup.jpg"]').count(),0,'No old generic popup');
   await banner.getByRole('button',{name:'Предложения по теме'}).click();
   const dialog=page.locator('dialog[data-ps-sale="popup"]');await dialog.waitFor({state:'visible'});
   assert.equal(new URL(await dialog.locator('.ps-sale-cta').getAttribute('href')).hash,'#offer='+id);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   if(path.includes('python'))await page.screenshot({path:`${output}/popup-${width}.png`});
   await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
   assert.equal(await page.locator('body').evaluate(el=>el.style.overflow),'');
   checks.push({width,path,id,utm:true,escape:true});
  }
 }
 assert.deepEqual(errors,[]);await fs.writeFile(output+'/results.json',JSON.stringify({checks,errors},null,2));console.log('Contextual sale: '+checks.length+' compiled-page checks passed');
}finally{await browser?.close();if(child)try{process.kill(-child.pid,'SIGTERM');}catch{}}
