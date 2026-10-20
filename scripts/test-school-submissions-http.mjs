/** Real Next routes + SQLite + image pipeline, isolated temporary state. No external mail. */
import {spawn} from 'node:child_process';import {mkdtemp,readFile,rm,mkdir} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {createHmac,randomUUID} from 'node:crypto';import sharp from 'sharp';import assert from 'node:assert/strict';
const dir=await mkdtemp(path.join(os.tmpdir(),'school-submission-test-')),port=3198,base='http://127.0.0.1:'+port;
const dev=process.env.SCHOOL_SUBMISSIONS_SMOKE_DEV==='1';
const site=dev?base:'https://pro-schools.ru';
const child=spawn(process.execPath,['node_modules/next/dist/bin/next',...(dev?['dev','--webpack']:['start']),'-p',String(port)],{detached:true,env:{...process.env,NODE_ENV:dev?'development':'production',ADMIN_SECRET:'school-qa-admin',SCHOOL_SUBMISSIONS_DIR:dir,TELEGRAM_BOT_TOKEN:'',TELEGRAM_CHAT_ID:'',PROSCHOOLS_SMTP_PASSWORD:''},stdio:['ignore','pipe','pipe']});let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
const killServer=(signal='SIGTERM')=>{try{process.kill(-child.pid,signal)}catch{child.kill(signal)}};
let browserRef;
const globalTimeout=setTimeout(()=>{console.error('Integration timeout',output.slice(-3000));killServer('SIGKILL');void browserRef?.close();process.exit(1)},240000);
const origin={Origin:site};
async function request(action,body,auth='',cookie=''){const response=await fetch(base+'/api/school-submissions/'+action+'/',{signal:AbortSignal.timeout(45000),method:body===undefined?'GET':'POST',headers:{...origin,...(body instanceof FormData?{}:{'Content-Type':'application/json'}),...(auth?{Authorization:'Bearer '+auth}:{}),...(cookie?{Cookie:cookie}:{})},...(body===undefined?{}:{body:body instanceof FormData?body:JSON.stringify(body)})});let data;try{data=await response.clone().json()}catch{data=await response.text()}return {response,data}}
try{
 for(let i=0;i<120;i++){try{const r=await fetch(base+'/dobavit-shkolu/');if(r.ok)break}catch{}if(i===119)throw Error('Server unavailable: '+output.slice(-2000));await new Promise(r=>setTimeout(r,500))}
 const fields={school:'Тестовая школа CI </script><script>globalThis.__schoolInjected=true</script>',type:'Частная школа',format:'Очно',city:'Москва',address:'Тестовый адрес, 1',description:'Описание школы для автоматической проверки. '.repeat(5),grades:[1,2,3,4],age:'',price:'от 10 000 ₽ в месяц',license:'',features:'Проекты · языки',admission:'Собеседование',website:'https://school.example',schoolPhone:'',schoolEmail:'school@example.test',name:'Тест',role:'Представитель',email:'private-owner@example.test',pd_agreed:true,marketing_agreed:true,rights:true};
 const jpeg=await sharp({create:{width:400,height:250,channels:3,background:'#fa754b'}}).jpeg().toBuffer();
 const requestId=randomUUID();function form(data=fields,metadata={},withPhotos=true){const body=new FormData();body.append('payload',JSON.stringify({request_id:requestId,data,photos:withPhotos?[0,1,2].map(i=>({caption:'Фото '+(i+1)})):[],...metadata}));if(withPhotos)for(let i=0;i<3;i++)body.append('photo_'+i,new Blob([jpeg],{type:'image/jpeg'}),'photo.jpg');return body}
 console.log('Testing real API routes');
 assert.equal((await request('admin')).response.status,401);
 assert.equal((await request('submit',form({...fields,pd_agreed:false}))).response.status,400);
 const badOrigin=await fetch(base+'/api/school-submissions/submit/',{method:'POST',headers:{Origin:'https://attacker.example'},body:form()});assert.equal(badOrigin.status,403);
 const created=await request('submit',form());assert.equal(created.response.status,200,JSON.stringify(created.data));const id=created.data.id,auth=id+'.'+created.data.token;
 const again=await request('submit',form());assert.equal(again.data.id,id);
 const app=(await request('get',undefined,auth)).data;assert.equal(app.photos.length,3);assert.equal(app.status,'unconfirmed');
 assert.equal((await request('confirm',{},auth)).response.status,403);
 const key=(await readFile(path.join(dir,'secret'),'utf8')).trim();const proof=purpose=>createHmac('sha256',key).update(purpose+':'+id).digest('hex');
 const image=base+'/api/school-submissions/images/'+id+'/'+app.photos[0].file+'/';assert.equal((await fetch(image)).status,404);
 assert.equal((await fetch(image,{headers:{Authorization:'Bearer '+auth}})).status,200);
 const login=await request('admin-login',{secret:'school-qa-admin'});assert.equal(login.response.status,200);const cookie=login.response.headers.get('set-cookie').split(';')[0];
 assert.equal((await request('moderate',{id,status:'published'},'',cookie)).response.status,400);
 assert.equal((await request('confirm',{confirmation:proof('confirm')},auth)).response.status,200);
 assert.equal((await request('feedback',{score:5,text:'Удобно'},auth)).response.status,200);
 assert.equal((await request('moderate',{id,status:'changes',comment:'Уточните сведения'},'',cookie)).response.status,200);
 const edited=form(fields,{id,request_id:randomUUID(),photos:app.photos},false);assert.equal((await request('submit',edited,auth)).response.status,200);
 assert.equal((await request('moderate',{id,status:'published',comment:''},'',cookie)).response.status,200);
 assert.equal((await fetch(image)).status,200);
 const catalog=(await request('catalog')).data;assert.ok(catalog.some(s=>s.slug==='s-'+id));assert.ok(!JSON.stringify(catalog).includes('private-owner'));
 const page=await fetch(base+'/shkola/s-'+id+'/');assert.equal(page.status,200);const publicHtml=await page.text();assert.ok(publicHtml.includes('Тестовая школа CI'));assert.ok(!publicHtml.includes('<script>globalThis.__schoolInjected=true</script>')); 
 const after=(await request('get',undefined,auth)).data;assert.equal(after.score,5);
 assert.equal((await request('subscribe',{},auth)).response.status,403);assert.equal((await request('subscribe',{subscription:proof('subscribe')},auth)).response.status,200);
 const unsub=await fetch(base+'/api/school-submissions/unsubscribe/?id='+id+'&token='+proof('unsubscribe'),{method:'POST',body:'List-Unsubscribe=One-Click'});assert.equal(unsub.status,200);
 assert.equal((await request('get',undefined,auth)).data.marketing,0);
 const privatePage=await fetch(base+'/dobavit-shkolu/zayavka/');const privateHtml=await privatePage.text();assert.ok(!privateHtml.includes('src="https://mc.yandex.ru'));assert.ok(!privateHtml.includes('src="https://ssynergy.logos'));
 const footer=await (await fetch(base+'/dobavit-shkolu/')).text();assert.ok(footer.includes('footer-submit-button'));assert.ok(footer.includes('Для представителей школ'));
 console.log('API, photo privacy, moderation, public page, feedback and opt-in passed');
 if(process.env.RUN_BROWSER_TESTS==='1'){
  const {chromium}=await import('playwright');const browser=await chromium.launch({headless:true});browserRef=browser;const context=await browser.newContext({viewport:{width:1440,height:1000}});
  if(!dev)await context.route('https://pro-schools.ru/**',async route=>{const url=new URL(route.request().url());const response=await route.fetch({url:base+url.pathname+url.search});await route.fulfill({response})});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(site+'/dobavit-shkolu/');await page.locator('.select-trigger[aria-label="Тип школы *"]').waitFor();
  await page.locator('[name="school"]').fill('Школа браузерной проверки');await page.locator('[name="city"]').fill('Москва');await page.locator('#submission-city-options').getByRole('option',{name:'Москва',exact:true}).click();
  await page.locator('[name="address"]').fill('Тестовая улица, 10');await page.locator('[name="description"]').fill(fields.description);await page.locator('[data-grade="1"]').click();
  await page.getByRole('combobox',{name:'Формат обучения *',exact:true}).click();await page.getByRole('option',{name:'Очно',exact:true}).click();
  await page.locator('#next').click();await page.locator('#files').setInputFiles([0,1,2].map(i=>({name:'photo'+i+'.jpg',mimeType:'image/jpeg',buffer:jpeg})));
  await page.waitForFunction(()=>document.querySelector('#photo-count').textContent.startsWith('3'));
  await page.getByRole('button',{name:'Настроить кадр ↗',exact:true}).first().click();await page.locator('#crop-caption').fill('Светлый класс');await page.locator('#crop-apply').click();
  await page.getByRole('button',{name:'Сделать обложкой',exact:true}).first().click();
  await mkdir('work/school-submission-qa',{recursive:true});await page.screenshot({path:'work/school-submission-qa/photos-desktop.png',fullPage:true});
  await page.locator('#next').click();await page.locator('[name="name"]').fill('Анна');await page.locator('[name="role"]').fill('Руководитель');await page.locator('[name="email"]').fill('browser-owner@example.test');await page.locator('#rights').check();await page.locator('#personal').check();await page.locator('#next').click();
  assert.ok((await page.locator('#full-preview').textContent()).includes('Школа браузерной проверки'));await page.locator('#next').click();await page.waitForURL('**/dobavit-shkolu/zayavka/**');await page.getByRole('heading',{name:'Заявка сохранена. Подтвердите вашу почту.',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Подтвердить почту →',exact:true}).count(),0);
  await page.locator('[data-score="4"]').click();await page.locator('#feedback-text').fill('Понятная подача');await page.locator('#feedback-send').click();await page.getByText('Спасибо! Ваша оценка и комментарий переданы редакции.',{exact:true}).waitFor();
  await page.setViewportSize({width:390,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:'work/school-submission-qa/status-mobile.png',fullPage:true});
  await page.goto(site+'/dobavit-shkolu/');await page.locator('.select-trigger[aria-label="Тип школы *"]').waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:'work/school-submission-qa/form-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);await browser.close();console.log('Browser flow passed: four steps, custom dropdowns, 3 photos/crop/cover, submission, email confirmation gate, feedback and mobile layout.');
 }
 console.log('HTTP integration passed: 3 photos, owner/admin access, separate email proof, moderation, revisions, published gallery/catalogue, feedback, opt-in and unsubscribe.');
}catch(error){console.error(error);console.error(output.slice(-3000));process.exitCode=1}finally{clearTimeout(globalTimeout);await browserRef?.close().catch(()=>{});killServer('SIGTERM');if(child.exitCode===null)await Promise.race([new Promise(r=>child.once('exit',r)),new Promise(r=>setTimeout(()=>{killServer('SIGKILL');r()},5000))]);await rm(dir,{recursive:true,force:true})}
