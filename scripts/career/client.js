import {calculate} from './scoring-core.js';
import {rememberUtm} from './leadContext.js';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='ps-career-progress-v1',TEST='/proforientaciya/karta-interesov/',RESULT='/proforientaciya/rezultat/';
const isTest=!!$('#test-content'),isResult=!!$('#result-content');
if(!isResult)rememberUtm();
let questions,state,currentResult,currentResultId,recoveryLink='';
const RESULT_KEY='ps-career-tab-result-v1';
const uuid=()=>crypto.randomUUID();
const short={build:'Собирать',research:'Исследовать',create:'Придумывать',help:'Помогать',lead:'Увлекать людей',organize:'Упорядочивать'};
const probes={build:['Собрать бумажный мост','Проверьте, сколько одинаковых монет выдержит конструкция. Что захотелось улучшить?'],research:['Проверить свою гипотезу','Придумайте вопрос о знакомой вещи, способ проверки и запишите наблюдение.'],create:['Придумать короткую историю','Сделайте комикс на четыре кадра или минутное видео. Какая часть увлекла больше?'],help:['Объяснить тему другому','Подготовьте короткую понятную инструкцию. Спросите, что помогло разобраться.'],lead:['Придумать совместный проект','Предложите маленькую полезную идею, распределите роли и договоритесь о результате.'],organize:['Сравнить три варианта','Выберите знакомую задачу, составьте таблицу условий и сравните варианты по одним критериям.']};
function eventLanding(){
 if(!isResult&&!isTest)return location.pathname;
 if(state?.landing)return state.landing;
 try{const origin=JSON.parse(sessionStorage.getItem('ps-career-origin')||'null');if(origin?.landing&&(!isResult||origin.result_id===currentResultId))return origin.landing;}catch{}
 return isResult||isTest?'/proforientaciya/':location.pathname;
}
const JOURNEY_KEY='ps-career-journey-v2';
let journeyMemory;
function trackingContext(){
 if(journeyMemory)return journeyMemory;
 try{const old=JSON.parse(sessionStorage.getItem(JOURNEY_KEY)||'null');if(old&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(old.journey_id)&&Date.now()>=old.created_at&&Date.now()-old.created_at<30*86400000){journeyMemory=old;return old;}}catch{}
 let referrer_host='';try{referrer_host=document.referrer?new URL(document.referrer).hostname.toLowerCase():'';}catch{}
 let existing={};try{existing=JSON.parse(sessionStorage.getItem('ps_utm')||'{}');}catch{}
 const query=new URLSearchParams(location.search),utm={...existing};for(const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','yclid','gclid'])if(query.get(key))utm[key]=query.get(key);
 const visit_utm={};for(const key of ['utm_source','utm_medium'])if(typeof utm[key]==='string'&&/^[a-zA-Z0-9_.-]{1,100}$/.test(utm[key]))visit_utm[key]=utm[key];
 if(utm.yclid)visit_utm.yclid='present';if(utm.gclid)visit_utm.gclid='present';if(Object.values(utm).some(v=>typeof v==='string'&&/^qa[_-]/i.test(v)))visit_utm.utm_campaign='qa_client';
 journeyMemory={journey_id:uuid(),referrer_host,visit_utm,created_at:Date.now()};try{sessionStorage.setItem(JOURNEY_KEY,JSON.stringify(journeyMemory));}catch{}return journeyMemory;
}
function elapsedBucket(){const start=Number(state?.startedAt);if(!start||Date.now()<start)return 'unknown';const seconds=(Date.now()-start)/1000;return seconds<60?'under_1m':seconds<180?'1_3m':seconds<420?'3_7m':seconds<900?'7_15m':seconds<1800?'15_30m':'30m_plus';}
function measurement(){const {journey_id,referrer_host,visit_utm}=trackingContext();return {journey_id,referrer_host,visit_utm,elapsed_bucket:elapsedBucket()};}
function emit(event,extra={},eventId=uuid()){
 const landing=eventLanding();
 if(!/^\/[a-zA-Z0-9/_-]*$/.test(landing)||landing.includes('//'))return;
 const payload={event,event_id:eventId,landing,measurement:measurement(),...extra};
 return fetch('/api/career/events/',{method:'POST',credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true}).then(r=>r.ok).catch(()=>false);
}
function once(event,extra={}){const key=event+(extra.step?':'+extra.step:'');state.eventIds??={};state.eventIds[key]??=uuid();save();emit(event,extra,state.eventIds[key]);}
function save(){try{sessionStorage.setItem(KEY,JSON.stringify(state));}catch{}}
function clearProgress(){try{sessionStorage.removeItem(KEY);}catch{}}
function focusHost(){const h=$('#test-content');h?.focus({preventScroll:true});}
function toast(t){const el=$('.toast');if(el){el.textContent=t;el.hidden=false;setTimeout(()=>el.hidden=true,6500);}}
async function api(url,options={}){const r=await fetch(url,{credentials:'same-origin',cache:'no-store',...options});const b=await r.json().catch(()=>({}));if(!r.ok||b.ok===false){const e=Error(b.error||'request_failed');e.status=r.status;throw e;}return b;}
function intro(){
 const host=$('#test-content');host.innerHTML=`<p class="eyebrow">ПЕРЕД НАЧАЛОМ / 24 ВОПРОСА</p><h1>Начнём с интересов.</h1><p>Это авторский опрос ProSchools, а не диагностика способностей. Отвечает школьник. Примерно 5–7 минут, правильных ответов нет.</p><p>Полный результат и план проб откроются после email и подтверждения совершеннолетнего родителя или участника 18 лет в конце. Партнёрские занятия выбираются отдельно.</p><form id="intro-form"><div class="field-pair"><label class="field">Класс<select name="grade" required>${Array.from({length:7},(_,i)=>i+5).map(n=>`<option value="${n}" ${state.grade===n?'selected':''}>${n} класс</option>`).join('')}</select></label><label class="field">Сколько лет школьнику<input name="age" type="number" min="10" max="18" step="1" value="${Number.isInteger(state.age)?state.age:''}" placeholder="От 10 до 18" required inputmode="numeric"></label></div><p class="micro">Класс и возраст нужны для подходящих следующих шагов и возрастных ограничений занятий. Опрос не имеет подтверждённых возрастных норм.</p><button class="btn primary" type="submit">${state.answers.length?'Продолжить опрос':'Начать опрос'} ↗</button></form>`;
 $('#intro-form').addEventListener('submit',e=>{e.preventDefault();const f=e.target,age=Number(f.age.value),grade=Number(f.grade.value);if(!Number.isInteger(age)||age<10||age>18||!Number.isInteger(grade)||grade<5||grade>11)return;state.age=age;state.grade=grade;state.started=true;state.startedAt??=Date.now();save();once('career_test_start',{grade:state.grade});renderQuestion();focusHost();});
}
function renderQuestion(){
 const host=$('#test-content'),total=questions.questions.length;
 if(state.position>=total){renderGate();return;}
 const i=state.position,q=questions.questions[i],band=state.grade<=7?'5-7':state.grade<=9?'8-9':'10-11';
 once('career_question_view',{grade:state.grade,step:i+1,elapsed_bucket:elapsedBucket()});
 host.innerHTML=`<div class="test-progress-label"><span>Вопрос ${i+1} из ${total}</span><span>${Math.round(i/total*100)}% пути</span></div><progress value="${i}" max="${total}" aria-label="Прогресс опроса"></progress><p class="eyebrow">ПРЕДСТАВЬ, ЧТО МОЖНО ПОПРОБОВАТЬ</p><h1>${esc(q.variants?.[band]||q.text)}</h1><p class="micro">Насколько тебе интересно это занятие?</p><div class="answer-list" role="group" aria-label="Варианты ответа">${questions.options.map((o,j)=>`<button type="button" class="answer ${i<state.answers.length&&state.answers[i]===o.value?'selected':''}" data-answer="${j}"><span class="choice-letter" aria-hidden="true">${j+1}</span>${esc(o.label)}</button>`).join('')}</div><div class="question-bottom"><button type="button" class="text-button" data-back>← ${i===0?'Возраст и класс':'Назад'}</button><p class="micro" role="status">Ответы сохраняются в этой вкладке</p></div>`;
 $$('[data-answer]',host).forEach(btn=>btn.addEventListener('click',()=>{state.answers[i]=questions.options[Number(btn.dataset.answer)].value;once('career_question_answered',{grade:state.grade,step:i+1,elapsed_bucket:elapsedBucket()});state.position=i+1;save();if(state.position===total)once('career_test_complete',{grade:state.grade,elapsed_bucket:elapsedBucket()});renderQuestion();focusHost();}));
 $('[data-back]',host).addEventListener('click',()=>{if(i===0){intro();return;}state.position--;save();renderQuestion();focusHost();});
}
function renderGate(){
 const host=$('#test-content');
 host.innerHTML='<h1>Карта интересов готова</h1><p>Результат доступен в этой вкладке. Его можно сохранить в PDF.</p><button type="button" class="btn primary" data-show-result>Посмотреть результат</button> <button type="button" class="btn secondary" data-last>Вернуться к ответам</button>';
 $('[data-show-result]',host).addEventListener('click',()=>{
  currentResult=calculate(questions,state.answers,state.grade);
  try{sessionStorage.setItem(RESULT_KEY,JSON.stringify(currentResult));}catch{}
  host.id='result-content';
  renderResult(true);
 });
 $('[data-last]',host).addEventListener('click',()=>{state.position=questions.questions.length-1;save();renderQuestion();focusHost();});
}
function emptyResult(message){$('#result-content').innerHTML=`<section class="empty-result"><p class="eyebrow">ЛИЧНЫЙ РЕЗУЛЬТАТ</p><h1>${esc(message)}</h1><p>Откройте сохранённую личную ссылку. Она доступна только тому, у кого есть ссылка. Если её нет, можно пройти опрос заново.</p><a class="btn primary" href="${TEST}">Пройти карту интересов ↗</a><p><a href="/proforientaciya/">К материалам раздела</a></p></section>`;}
function renderResult(local=false){
 const result=currentResult,host=$('#result-content');let mailStatus='Если сервисное письмо пришло, сохраните его для повторного доступа. Личную ссылку также можно скопировать при первом открытии результата.';try{const mail=JSON.parse(sessionStorage.getItem('ps-career-mail-receipt')||'null');if(mail?.result_id===currentResultId)mailStatus=mail.duplicate&&!mail.mail_sent?'Повторная попытка сохранения распознана. Новое письмо не отправлялось. Используйте прежнее письмо или скопируйте личную ссылку.':mail.mail_sent?'Сервисное письмо с личной ссылкой отправлено. Если его нет во входящих, проверьте папку «Спам».':'Сервисное письмо не отправлено. Скопируйте личную ссылку, чтобы вернуться к результату с другого устройства.';}catch{}if(!result?.domains){emptyResult('Результат пока недоступен');return;}
 const status=result.profile_status,top=result.top_domains||[],title=status==='insufficient'?'Пока не хватает ответов для сравнения.':status==='low'?'Сейчас интересы ещё не определились.':status==='broad'?'Интересы охватывают разные занятия.':'Вот что интересно исследовать дальше.';
 const ids=top.length?top.slice(0,3):['build','research','help'];const plan=ids.map(id=>({id,probe:probes[id]})).filter(x=>x.probe);
 const description=status==='insufficient'?'«Не знаю» помогает увидеть, что ещё не пробовали. Там, где меньше трёх известных ответов, направление не сравнивается с остальными.':status==='low'?'Низкий интерес в этом опросе не означает отсутствия способностей. Можно начать с других коротких занятий без оценки и обсудить, что обычно увлекает.':status==='broad'?'Похожие оценки не требуют выбрать единственный тип. Посмотрите несколько направлений на практике и сравните свои впечатления.':'Это профиль текущих интересов по ответам, а не измерение способностей, психологический диагноз или обещание успеха в профессии.';
 host.innerHTML=`<section class="result-hero"><div><p class="eyebrow">ВАША КАРТА ИНТЕРЕСОВ / ${Number(result.grade)} КЛАСС</p><h1>${title}</h1><p class="lead">${description}</p></div><aside class="result-stamp"><span class="eyebrow">СНАЧАЛА ОПЫТ — ПОТОМ РЕШЕНИЯ</span><p>Опрос ProSchools · 24 вопроса<br>Версия ${esc(result.version)}<br>Интересы могут меняться.</p></aside></section><section class="result-layout"><div class="result-chart"><h2>Как распределились ответы</h2>${result.domains.map(d=>`<div class="result-bar"><span>${esc(short[d.id]||d.label)}</span><i style="--bar:${d.status==='ready'?Math.max(0,Math.min(100,Number(d.mean)*50)):0}%;--color:#748765"></i><b>${d.status==='ready'?`${Number(d.sum)}/${Number(d.known)*2}`:'—'}</b></div><p class="score-total">${esc(d.label)}: ${Number(d.known)} из 4 известных ответов${d.status!=='ready'?' · данных недостаточно':''}.</p>`).join('')}<p>Баллы показывают ответы на занятия, а не проценты таланта, вероятность успеха или профессиональную пригодность. «Не знаю» исключается из расчёта.</p></div><div class="result-explanation"><p class="eyebrow">КАК ЧИТАТЬ КАРТУ</p><h2>Не ярлык.<br>Повод попробовать.</h2><p>${esc(result.disclaimer||description)}</p><ul><li>Вспомните, когда похожее занятие уже увлекало.</li><li>Выберите небольшую задачу, которую можно закончить.</li><li>После пробы обсудите процесс, а не только оценку результата.</li></ul><p class="score-note">${status==='insufficient'?'Для общего сравнения нужны хотя бы четыре направления с тремя известными ответами в каждом.':'Близкие оценки могут быть одинаково важны.'}</p></div></section><section class="result-plan"><p class="eyebrow">ПЛАН ПЕРВЫХ ПРОБ / ОДНА НЕДЕЛЯ</p><h2>Три небольших шага</h2><div class="cards three">${plan.map((x,i)=>`<article class="white-card"><span class="number">0${i+1}</span><h3>${esc(x.probe[0])}</h3><p>${esc(x.probe[1])}</p><p class="micro">${i===0?'Дни 1–2: попробовать':i===1?'Дни 3–4: сравнить с другим занятием':'Дни 5–7: обсудить и выбрать следующий шаг'}</p></article>`).join('')}</div><p>${Number(result.grade)<=7?'Для 5–7 классов задача — познакомиться с занятиями, кружками и проектами. Выбирать профессию сейчас не требуется.':Number(result.grade)<=9?'Для 8–9 классов после проб сравните реальные учебные планы колледжа и профильной школы. Условия поступления и выбор экзаменов проверяются отдельно.':'Для 10–11 классов сопоставьте опыт с реальными учебными планами направлений. Требования поступления и экзамены проверяются отдельно на сайтах учебных заведений.'}</p></section><section class="result-access"><h2>Сохранить результат</h2>${local?'<p>Результат хранится в этой вкладке. Сохраните PDF, чтобы вернуться к нему позже.</p>':`<p>Результат доступен в этом браузере по закрытой сессии.</p><p class="micro">${esc(mailStatus)}</p>${recoveryLink?'<button class="btn secondary" type="button" data-copy-link>Скопировать личную ссылку</button>':''}`}<div class="result-actions"><button class="btn secondary" data-print type="button">Сохранить как PDF / напечатать</button><a class="btn secondary" href="${TEST}">Пройти опрос заново</a></div></section><section class="result-feedback"><h2>Удобно ли было пройти тест и получить результат?</h2><p>Необязательная оценка поможет улучшить сервис. Она не влияет на результат.</p><div class="result-actions"><button class="btn secondary" type="button" data-ux-feedback="easy">Да, удобно</button><button class="btn secondary" type="button" data-ux-feedback="difficult">Были трудности</button></div><p class="micro" role="status" data-feedback-status></p></section>${local?'':'<section class="result-delete"><h2>Управление данными</h2><p>Можно удалить сохранённый результат и контакт сервиса. Контакты, уже переданные по вашей заявке партнёру, удаляются по обращению к этому партнёру.</p><button class="text-button danger" data-delete type="button">Удалить мой результат и контакт</button><div data-delete-confirm hidden><p>Удалить результат без возможности восстановления?</p><button class="btn secondary" type="button" data-delete-cancel>Отмена</button><button class="btn dark" type="button" data-delete-final>Да, удалить</button><p class="form-error" role="alert" hidden></p></div></section>'}`;
 $('[data-print]')?.addEventListener('click',()=>window.print());$('[data-copy-link]')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(recoveryLink);toast('Личная ссылка скопирована. Не публикуйте её.');}catch{toast('Браузер не разрешил копирование. Разрешите доступ к буферу и повторите.');}});
 $('[data-delete]')?.addEventListener('click',()=>{$('[data-delete-confirm]').hidden=false;});$('[data-delete-cancel]')?.addEventListener('click',()=>{$('[data-delete-confirm]').hidden=true;});$('[data-delete-final]')?.addEventListener('click',async e=>{const b=e.target;b.disabled=true;try{await api('/api/career/results/current/',{method:'DELETE'});clearProgress();recoveryLink='';emptyResult('Результат и контакт удалены');}catch{b.disabled=false;const err=$('[data-delete-confirm] .form-error');err.textContent='Не удалось удалить данные. Повторите попытку.';err.hidden=false;}});
 emit('career_result_view',{grade:Number(result.grade)});
 const feedbackKey='ps-career-feedback-'+trackingContext().journey_id;let alreadyVoted=false;try{alreadyVoted=!!sessionStorage.getItem(feedbackKey);}catch{}
 const feedbackButtons=$$('[data-ux-feedback]');if(alreadyVoted){feedbackButtons.forEach(b=>b.disabled=true);$('[data-feedback-status]').textContent='Спасибо, ваша оценка уже сохранена.';}
 feedbackButtons.forEach(button=>button.addEventListener('click',async()=>{feedbackButtons.forEach(b=>b.disabled=true);const ok=await emit('career_feedback_'+button.dataset.uxFeedback,{grade:Number(result.grade)});if(ok){try{sessionStorage.setItem(feedbackKey,'saved');}catch{}$('[data-feedback-status]').textContent='Спасибо, оценка сохранена.';}else{feedbackButtons.forEach(b=>b.disabled=false);$('[data-feedback-status]').textContent='Не удалось сохранить оценку. Можно повторить позже.';}}));
}
if(isTest){
 try{questions=await api('/career-assets/questions.json');}catch{$('#test-content').innerHTML='<h1>Не удалось загрузить вопросы</h1><p>Обновите страницу. Сохранённые ответы останутся в этой вкладке.</p>';}
 if(questions){
  try{state=JSON.parse(sessionStorage.getItem(KEY)||'null');}catch{}
  const valid=state&&state.version===questions.version&&Array.isArray(state.answers)&&state.answers.length<=24&&state.answers.every(x=>[0,1,2,null].includes(x));
  const query=new URLSearchParams(location.search),fromPath=query.get('from')||'',fromGrade=/(?:^|[/_-])(1[01]|[5-9])-(?:1[01]|[5-9])-(?:klass|klassa|klasse)(?:[/_-]|$)/.exec(fromPath)||/(?:^|[/_-])(1[01]|[5-9])-(?:klass|klassa|klasse)(?:[/_-]|$)/.exec(fromPath);
  if(!valid)state={version:questions.version,answers:[],position:0,grade:Math.min(11,Math.max(5,Number(query.get('grade'))||Number(fromGrade?.[1])||5)),age:null,requestId:uuid(),started:false,landing:new URLSearchParams(location.search).get('from')||TEST,visit_utm:{}};
  if(!state.landing.startsWith('/')||state.landing.startsWith('//'))state.landing=TEST;
  try{state.visit_utm=JSON.parse(sessionStorage.getItem('ps_utm')||'{}');}catch{}
  state.position=Math.min(Math.max(0,Number(state.position)||0),state.answers.length,24);state.requestId??=uuid();
  if(state.started&&Number.isInteger(state.age)&&state.age>=10&&state.age<=18&&Number.isInteger(state.grade)&&state.grade>=5&&state.grade<=11)renderQuestion();else intro();
  $('[data-clear]').addEventListener('click',()=>{const resultHost=$('#result-content');if(resultHost)resultHost.id='test-content';try{sessionStorage.removeItem(RESULT_KEY);}catch{}state={version:questions.version,answers:[],position:0,grade:state.grade,age:state.age,requestId:uuid(),started:false,landing:state.landing,visit_utm:state.visit_utm};save();intro();focusHost();});
 }
}
if(isResult){
 const hash=new URLSearchParams(location.hash.replace(/^#/,'')),token=hash.get('token');
 if(!token){try{currentResult=JSON.parse(sessionStorage.getItem(RESULT_KEY)||'null');}catch{}}
 if(token){recoveryLink=location.origin+RESULT+'#token='+encodeURIComponent(token);history.replaceState(null,'',RESULT);}
 if(currentResult)renderResult(true);else try{if(token)await api('/api/career/access/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})});const data=await api('/api/career/results/current/');if(!recoveryLink&&typeof data.recovery_url==='string'&&data.recovery_url.startsWith(RESULT+'#token='))recoveryLink=location.origin+data.recovery_url;currentResult=data.result;currentResultId=data.result_id;renderResult();}
 catch(e){emptyResult(e.status===401||e.status===403?'Для результата нужна личная ссылка':'Не удалось открыть результат');}
}

if(!isTest&&!isResult&&(document.body.dataset.careerPage==='public'||window.PSCareerLegacyEntry===true)){trackingContext();emit('career_landing_view');}
document.addEventListener('click',e=>{const a=e.target.closest?.('a[href]');if(!a)return;try{const target=new URL(a.href,location.href);if(target.origin===location.origin&&target.pathname===TEST)emit('career_cta_click');}catch{}});
