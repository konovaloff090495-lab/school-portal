window.PSSubmissionMount = function(root, options) {
const controller = new AbortController();
const listen=(target,event,handler,capture=false)=>target.addEventListener(event,handler,{capture,signal:controller.signal});
/* School submission form: draft, photos, authenticated status and feedback. */
const $ = (s, p = root) => p.querySelector(s);
const $$ = (s, p = root) => [...p.querySelectorAll(s)];
const styledSelects = [];
const initialToken = location.hash.slice(1).split('?')[0];
const confirmKey = new URLSearchParams(location.hash.split('?')[1]||'').get('confirm')||'';
const subscribeKey = new URLSearchParams(location.hash.split('?')[1]||'').get('subscribe')||'';
const wantsSubscribe = !!subscribeKey;
const form = $('#school-form');
let step = 0, score = null, currentStatus = 'unconfirmed', adminComment = '';
let grades = new Set();
let photos = [];
let application = null, sending = false;
const requestId = crypto.randomUUID();
const escape = s => String(s ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const value = key => form.elements.namedItem(key)?.value || '';
const photoSrc = p => p.crop || p.src;
function toast(text) { $('#toast').textContent = text; $('#toast').classList.add('on'); clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => $('#toast').classList.remove('on'), 3500); }
function showView(view, scroll = true) {
 $$('.view').forEach(s => s.hidden = s.id !== view + '-view');

 if (view === 'status') renderStatus();
 if (view === 'admin') $('#admin-preview').innerHTML = preview();
 if (scroll) window.scrollTo({top:0, behavior:'instant'});
}

function gradeLabel() { const a = [...grades].sort((a,b)=>a-b); return a.length === 11 ? '1–11 классы' : a.length ? a.join(', ') + ' классы' : 'Классы не указаны'; }
function renderGrades() { $('.grade-chips').innerHTML = Array.from({length:11},(_,i)=> `<button type="button" data-grade="${i+1}" class="${grades.has(i+1)?'on':''}" aria-pressed="${grades.has(i+1)}">${i+1}</button>`).join(''); $$('[data-grade]').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.grade);grades.has(n)?grades.delete(n):grades.add(n);renderGrades();updateAside();}); }
function updateAside() {
 $('#aside-name').textContent = value('school') || 'Название вашей школы';
 $('#aside-address').textContent = [value('city'),value('address')].filter(Boolean).join(' · ');
 $('#aside-price').textContent = value('price') || 'Стоимость по запросу';
 $('.mini-type').textContent = value('type');
 $('.mini-tags').innerHTML = `<span>${escape(gradeLabel())}</span><span>${escape(value('format'))}</span>`;
 $('#aside-photo').src = photos.length ? photoSrc(photos[0]) : '/school-submissions/placeholder.svg';
}
function goStep(index, scroll = true) {
 step = Math.max(0,Math.min(3,index));
 $$('.form-step').forEach((p,i)=>p.hidden=i!==step);
 $$('[data-step]').forEach((b,i)=>{b.classList.toggle('active',i===step);b.classList.toggle('done',i<step);b.setAttribute('aria-selected',i===step);$('.stepnum',b).textContent=i<step?'✓':i+1;});
 $('#back').style.visibility = step ? 'visible' : 'hidden';
 const labels = ['Далее: фотографии','Далее: контакты','Посмотреть карточку','Отправить на модерацию'];
 $('#next').innerHTML=labels[step]+' <span>→</span>';
 $('#form-error').textContent='';
 if(step===3) $('#full-preview').innerHTML=preview();
 if(application)$('#next').innerHTML=step===3?'Отправить повторно <span>→</span>':$('#next').innerHTML;
 if(step===1) renderPhotos();
 if(scroll) $('.steps').scrollIntoView({behavior:'instant',block:'start'});
}
$$('[data-step]').forEach(b=>b.onclick=()=>goStep(Number(b.dataset.step)));
$('#back').onclick=()=>goStep(step-1);
$('#next').onclick=async()=>{
 if(sending)return;
 if(step===0 || step===2){const invalid=$$('input,select,textarea',$(`[data-panel="${step}"]`)).find(x=>!x.checkValidity());if(invalid){invalid.reportValidity();return;}}
 if(step===0&&!grades.size&&!value('age')){ $('#form-error').textContent='Выберите классы или укажите возраст учеников.';return;}
 if(step<3)return goStep(step+1);
 const invalid=$$('input,select,textarea',form).find(x=>!x.checkValidity());
 if(invalid){goStep(Number(invalid.closest('[data-panel]').dataset.panel));invalid.reportValidity();return;}
 sending=true;$('#next').disabled=true;$('#next').textContent='Сохраняем заявку…';$('#form-error').textContent='';
 try{
  const data=Object.fromEntries(new FormData(form));data.grades=[...grades];data.rights=$('#rights').checked;data.pd_agreed=$('#personal').checked;data.marketing_agreed=$('#marketing').checked;
  if(application)data.email=application.data.email;
  const specs=[],body=new FormData();
  for(let i=0;i<photos.length;i++){
   const photo=photos[i];specs.push({file:photo.file,caption:photo.caption||''});
   if(!photo.file||photo.crop){const image=new Image();image.src=photoSrc(photo);await image.decode();const resize=document.createElement('canvas');const ratio=Math.min(1,1800/image.width,1400/image.height);resize.width=Math.round(image.width*ratio);resize.height=Math.round(image.height*ratio);resize.getContext('2d').drawImage(image,0,0,resize.width,resize.height);const blob=await new Promise(resolve=>resize.toBlob(resolve,'image/jpeg',.88));if(!blob)throw Error('Не удалось подготовить фото');body.append('photo_'+i,blob,'photo.jpg');}
  }
  body.append('payload',JSON.stringify({id:application?.id,data,photos:specs,request_id:requestId,website_check:value('website_check')}));
  const receipt=await options.submit(body);localStorage.removeItem('proschools-school-draft-v1');
  location.assign('/dobavit-shkolu/zayavka/#'+receipt.id+'.'+receipt.token);
 }catch(error){$('#form-error').textContent=error.message||'Не удалось отправить заявку';}finally{sending=false;$('#next').disabled=false;$('#next').innerHTML='Отправить на модерацию <span>→</span>';}
};
form.addEventListener('submit',e=>e.preventDefault());
form.addEventListener('input',()=>{updateAside();$('#saved-hint').textContent='Есть несохранённые изменения';});
$('#save').onclick=()=>{
 try {const data=Object.fromEntries(new FormData(form));localStorage.setItem('proschools-school-draft-v1',JSON.stringify({data,grades:[...grades],step,marketing:$('#marketing').checked}));$('#saved-hint').textContent='Сохранено в этом браузере · '+new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});toast('Черновик сохранён. Фотографии нужно будет загрузить заново после закрытия страницы.');}catch{toast('Браузер не разрешил сохранить черновик.');}
};
try{const draft=JSON.parse(localStorage.getItem('proschools-school-draft-v1'));if(draft&&root.dataset.mode!=='status'){Object.entries(draft.data).forEach(([key,v])=>{const el=form.elements.namedItem(key);if(el)el.value=v;});grades=new Set(draft.grades);$('#marketing').checked=!!draft.marketing;$('#saved-hint').textContent='Черновик восстановлен из этого браузера';}}catch{}
function renderPhotos(){
 $('#photo-count').textContent=photos.length+' / 8 фото';
 $('#photo-grid').innerHTML=photos.map((p,i)=>`<div class="photo-tile ${i===0?'cover':''}">${i===0?'<span class="cover-tag">✦ Обложка</span>':''}<img src="${escape(photoSrc(p))}" alt="${escape(p.caption)}"><label>${escape(p.caption || 'Фото '+(i+1))}</label><div class="photo-controls"><button type="button" onclick="openCrop(${i})">Настроить кадр ↗</button><button type="button" aria-label="Удалить фото ${i+1}" onclick="removePhoto(${i})">×</button>${i?`<button type="button" class="cover-btn" onclick="makeCover(${i})">Сделать обложкой</button>`:''}</div></div>`).join('');updateAside();
}
function removePhoto(i){const p=photos.splice(i,1)[0];if(p.src.startsWith('blob:'))URL.revokeObjectURL(p.src);renderPhotos();}
function makeCover(i){photos.unshift(photos.splice(i,1)[0]);renderPhotos();toast('Обложка обновлена');}
async function addFiles(files){
 let errors=[];
 for(const file of files){
  if(photos.length>=8){errors.push('Можно добавить не больше 8 фотографий.');break;}
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)){errors.push('Для «'+file.name+'» нужен формат JPG, PNG или WebP.');continue;}
  if(file.size>10*1024*1024){errors.push('«'+file.name+'» больше 10 МБ.');continue;}
  const src=URL.createObjectURL(file);
  try{const img=new Image();img.src=src;await img.decode();if(img.width*img.height>40000000)throw Error();photos.push({src,caption:file.name.replace(/\.[^.]+$/,''),crop:null});}catch{URL.revokeObjectURL(src);errors.push('Не удалось открыть «'+file.name+'».');}
 }
 $('#photo-error').textContent=errors.join(' ');$('#files').value='';renderPhotos();
}
$('#files').onchange=e=>addFiles(e.target.files);
$('#dropzone').ondragover=e=>{e.preventDefault();$('#dropzone').classList.add('dragover');};
$('#dropzone').ondragleave=()=>$('#dropzone').classList.remove('dragover');
$('#dropzone').ondrop=e=>{e.preventDefault();$('#dropzone').classList.remove('dragover');addFiles(e.dataTransfer.files);};
const canvas=$('#crop-canvas'),ctx=canvas.getContext('2d');
let cropImage=new Image(),cropIndex=0,scale=1,minScale=1,x=0,y=0,drag=null;
function drawCrop(){x=Math.min(0,Math.max(canvas.width-cropImage.width*scale,x));y=Math.min(0,Math.max(canvas.height-cropImage.height*scale,y));ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(cropImage,x,y,cropImage.width*scale,cropImage.height*scale);ctx.save();ctx.strokeStyle='#ffffff66';ctx.lineWidth=2;for(let i=1;i<3;i++){ctx.beginPath();ctx.moveTo(canvas.width*i/3,0);ctx.lineTo(canvas.width*i/3,canvas.height);ctx.stroke();ctx.beginPath();ctx.moveTo(0,canvas.height*i/3);ctx.lineTo(canvas.width,canvas.height*i/3);ctx.stroke();}ctx.restore();}
function resetCrop(){minScale=Math.max(canvas.width/cropImage.width,canvas.height/cropImage.height);scale=minScale;x=(canvas.width-cropImage.width*scale)/2;y=(canvas.height-cropImage.height*scale)/2;$('#crop-zoom').value='1';drawCrop();}
async function openCrop(i){cropIndex=i;cropImage=new Image();cropImage.src=photos[i].src;await cropImage.decode();$('#crop-caption').value=photos[i].caption;resetCrop();$('#crop-dialog').showModal();}
function closeCrop(){$('#crop-dialog').close();}
$('#crop-zoom').oninput=e=>{const next=minScale*Number(e.target.value);x=canvas.width/2-(canvas.width/2-x)*next/scale;y=canvas.height/2-(canvas.height/2-y)*next/scale;scale=next;drawCrop();};
canvas.onpointerdown=e=>{drag={px:e.clientX,py:e.clientY,x,y};canvas.setPointerCapture(e.pointerId);};
canvas.onpointermove=e=>{if(!drag)return;const ratio=canvas.width/canvas.getBoundingClientRect().width;x=drag.x+(e.clientX-drag.px)*ratio;y=drag.y+(e.clientY-drag.py)*ratio;drawCrop();};
canvas.onpointerup=canvas.onpointercancel=()=>drag=null;
$('#crop-apply').onclick=()=>{const out=document.createElement('canvas');out.width=1200;out.height=750;out.getContext('2d').drawImage(cropImage,x,y,cropImage.width*scale,cropImage.height*scale);photos[cropIndex].crop=out.toDataURL('image/jpeg',.9);photos[cropIndex].caption=$('#crop-caption').value.slice(0,160);renderPhotos();closeCrop();toast('Кадр и подпись сохранены');};
function preview(){return `<img class="preview-hero" src="${escape(photos.length?photoSrc(photos[0]):'/school-submissions/placeholder.svg')}" alt="Обложка школы"><div class="preview-type">${escape(value('type'))} · ${escape(value('format'))}</div><h2 class="preview-title">${escape(value('school'))}</h2><p class="preview-sub">${escape(value('city'))} · ${escape(value('address'))}</p><div class="preview-detail"><div><small>Классы</small>${escape(gradeLabel())}</div><div><small>Стоимость</small>${escape(value('price')||'Уточняйте в школе')}</div><div><small>Сайт</small>${escape(value('website')||'Не указан')}</div><div><small>Почта для родителей</small>${escape(value('schoolEmail')||'Не указана')}</div>${value('schoolPhone')?`<div><small>Телефон для родителей</small>${escape(value('schoolPhone'))}</div>`:''}${value('license')?`<div><small>Лицензия · требует проверки</small>${escape(value('license'))}</div>`:''}</div><h3>О школе</h3><p class="preview-text">${escape(value('description'))}</p>${photos.length>1?`<div class="preview-gallery">${photos.slice(1,4).map(p=>`<img src="${escape(photoSrc(p))}" alt="${escape(p.caption)}">`).join('')}</div>`:''}<h3>Программы и особенности</h3><p class="preview-text">${escape(value('features'))}</p><h3>Как поступить</h3><p class="preview-text">${escape(value('admission'))}</p><p class="demo-note">Демонстрационная карточка с условными данными. Частные контакты представителя не публикуются.</p>`;}

async function api(action, body, method='POST') {
 const response=await fetch('/api/school-submissions/'+action+'/',{method,headers:method==='GET'?{}:{'Content-Type':'application/json'},...(method==='GET'?{}:{body:JSON.stringify(body||{})}),signal:controller.signal});
 const result=await response.json();if(!response.ok)throw Error(result.error||'Не удалось выполнить действие');return result;
}
async function refreshApplication(){application=await api('get',null,'GET');renderStatus();}
function statusActionError(error){$('#status-error').textContent=error.message||'Не удалось выполнить действие';}
async function confirmApplication(){try{await api('confirm',{confirmation:confirmKey});await refreshApplication();toast('Почта подтверждена. Заявка передана редакции.');}catch(error){statusActionError(error);}}
async function resendConfirmation(){try{await api('resend');toast('Письмо поставлено в очередь. Проверьте почту немного позже.');}catch(error){statusActionError(error);}}
async function confirmSubscription(){try{await api('subscribe',{subscription:subscribeKey});await refreshApplication();toast('Подписка для представителей школ подтверждена.');}catch(error){statusActionError(error);}}
function renderStatus(){
 if(!application){$('#status-card').innerHTML='<p class="hint">Загружаем вашу заявку…</p>';return;}
 const a=application;
 $('#application-label').textContent=a.data.school+' · № '+a.id.slice(0,8);
 const statuses={
  unconfirmed:{icon:'✉',title:'Заявка сохранена.<br>Подтвердите вашу почту.',copy:'Чтобы передать школу на проверку, подтвердите почту. Ссылка на эту страницу придёт отдельным письмом. До подтверждения новая карточка не публикуется.',stage:0},
  pending:{icon:'◷',title:'Школа на проверке.<br>Мы напишем о результате.',copy:'Почта подтверждена. Редакция проверит сведения, контакты и фотографии. Заявка уже у нас — повторно отправлять её не нужно.',stage:1},
  changes:{icon:'↻',title:'Осталось немного уточнить.',copy:'Редакция посмотрела заявку. Доработайте отмеченные пункты и отправьте её на повторную проверку. Данные и фотографии сохранены.',stage:1},
  published:{icon:'✓',title:'Ваша школа<br>теперь в каталоге!',copy:'Редакция проверила и опубликовала школу. Ссылка на страницу есть ниже и в письме. Предложенные в будущем изменения также пройдут модерацию.',stage:2},
  rejected:{icon:'−',title:'Пока не можем<br>опубликовать заявку.',copy:'Посмотрите причину решения редакции. Если у вас появились уточнения, можно исправить заявку и отправить её на повторное рассмотрение.',stage:1}
 };
 const s=statuses[a.status];let buttons='';
 if(a.status==='unconfirmed')buttons='<button class="primary" onclick="confirmApplication()">Подтвердить почту →</button><button class="textbutton" onclick="resendConfirmation()">Отправить письмо ещё раз</button>';
 // Confirmation is permitted only after the visitor follows the token link from email.
 if(a.status==='unconfirmed'&&!/^[a-f0-9]{64}$/.test(confirmKey))buttons='<button class="secondary" onclick="resendConfirmation()">Отправить письмо ещё раз</button>';
 if(a.status==='changes'||a.status==='rejected')buttons='<button class="primary" onclick="editApplication()">Доработать заявку →</button>';
 if(a.status==='published')buttons='<a class="primary" href="'+escape(a.url)+'">Открыть страницу школы ↗</a><button class="textbutton" onclick="editApplication()">Предложить изменения</button>';
 const mail=a.emails.find(m=>m.kind==='confirm');
 const mailHint=a.status==='unconfirmed'?(mail?.state==='sent'?'Письмо принято почтовым сервером. Проверьте входящие и папку «Спам».':mail?.state==='failed'?'Не удалось отправить письмо. Можно повторить отправку или написать в редакцию.':'Письмо с подтверждением находится в очереди на отправку.'):'О каждом решении редакции придёт письмо на '+a.data.email+'.';
 $('#status-card').innerHTML='<div class="status-symbol '+(a.status==='published'?'green':'')+'">'+s.icon+'</div><h2 class="status-title">'+s.title+'</h2><p class="status-copy">'+s.copy+'</p>'+(a.status==='unconfirmed'?'<div class="status-email">'+escape(a.data.email)+'</div>':'')+'<div class="status-actions">'+buttons+'</div>'+(a.comment?'<div class="notice peach"><p><b>Комментарий редакции</b><br>'+escape(a.comment)+'</p></div>':'')+'<div class="notice"><p>'+escape(mailHint)+'</p></div><p class="status-note">Обновлено: '+new Date(a.updated*1000).toLocaleString('ru-RU',{timeZone:'Europe/Moscow'})+' МСК. <button class="textbutton" onclick="refreshApplication().catch(statusActionError)">Обновить статус</button></p><p class="status-note">Вопросы или ошибка в адресе: <a href="mailto:hello@pro-schools.ru">hello@pro-schools.ru</a>. Укажите номер заявки.</p><p class="error" id="status-error" role="alert"></p>';
 if(a.marketing&&a.confirmed&&!a.subscribed&&!a.unsubscribed&&/^[a-f0-9]{64}$/.test(subscribeKey))$('#status-card').insertAdjacentHTML('beforeend','<div class="notice peach"><p><b>Письма для представителей школ</b><br>Вы согласились получать советы и новости размещения. Подтвердите подписку отдельно.<br><button class="primary" style="margin-top:12px" onclick="confirmSubscription()">Подтвердить подписку →</button></p></div>');
 if(a.subscribed&&!a.unsubscribed)$('#status-card').insertAdjacentHTML('beforeend','<p class="status-note">✓ Подписка на письма для представителей школ подтверждена. Отписка — в каждом рекламном письме.</p>');
 if(a.url&&a.status!=='published')$('#status-card').insertAdjacentHTML('beforeend','<p class="status-note">Предыдущая одобренная версия остаётся в каталоге: <a href="'+escape(a.url)+'">страница школы</a>.</p>');
 const stages=['Подтверждение почты','Проверка редакцией','Публикация в каталоге'];
 $('#status-timeline').innerHTML=stages.map((title,i)=>'<li class="'+(i<s.stage?'complete':i===s.stage?'current':'')+'"><b>'+title+'</b><span>'+(i<s.stage?'Готово':i===s.stage?(a.status==='published'?'Готово':a.status==='changes'?'Ожидаем уточнения':a.status==='rejected'?'Решение редакции':'Текущий шаг'):i===1?'После подтверждения почты':'После одобрения')+'</span></li>').join('');
 if(a.score){score=a.score;$$('[data-score]').forEach(b=>b.classList.toggle('active',Number(b.dataset.score)===score));$('#feedback-text').value=a.feedback||'';}
}
function editApplication(){
 Object.entries(application.data).forEach(([key,v])=>{const input=form.elements.namedItem(key);if(input&&typeof v==='string')input.value=v;});
 grades=new Set(application.data.grades);photos=application.photos.map(p=>({...p,src:'/api/school-submissions/images/'+application.id+'/'+p.file+'/',crop:null}));
 $('#rights').checked=true;$('#personal').checked=true;$('#marketing').checked=!!application.marketing&&!application.unsubscribed;
 form.elements.namedItem('email').readOnly=true;renderGrades();renderPhotos();updateAside();syncStyledSelects();showView('form');goStep(0);
}
function preview(){return '<img class="preview-hero" src="'+escape(photos.length?photoSrc(photos[0]):'/school-submissions/placeholder.svg')+'" alt="Обложка школы"><div class="preview-type">'+escape(value('type'))+' · '+escape(value('format'))+'</div><h2 class="preview-title">'+escape(value('school'))+'</h2><p class="preview-sub">'+escape(value('city'))+' · '+escape(value('address'))+'</p><div class="preview-detail"><div><small>Классы или возраст</small>'+escape(grades.size?gradeLabel():value('age'))+'</div><div><small>Стоимость</small>'+escape(value('price')||'Уточняйте в школе')+'</div><div><small>Сайт</small>'+escape(value('website')||'Не указан')+'</div><div><small>Почта для родителей</small>'+escape(value('schoolEmail')||'Не указана')+'</div><div><small>Телефон для родителей</small>'+escape(value('schoolPhone')||'Не указан')+'</div></div><h3>О школе</h3><p class="preview-text">'+escape(value('description'))+'</p>'+(photos.length>1?'<div class="preview-gallery">'+photos.slice(1,4).map(p=>'<img src="'+escape(photoSrc(p))+'" alt="'+escape(p.caption)+'">').join('')+'</div>':'')+'<h3>Программы и особенности</h3><p class="preview-text">'+escape(value('features'))+'</p><h3>Как поступить</h3><p class="preview-text">'+escape(value('admission'))+'</p>';}
$$('[data-score]').forEach(b=>b.onclick=()=>{score=Number(b.dataset.score);$$('[data-score]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b);});});
$('#feedback-send').onclick=async()=>{
 if(!score){$('#feedback-result').textContent='Сначала выберите оценку от 1 до 5.';return;}
 try{await api('feedback',{score,text:$('#feedback-text').value});$('#feedback-result').textContent='Спасибо! Ваша оценка и комментарий переданы редакции.';}catch(error){$('#feedback-result').textContent=error.message;}
};

// Consistent, keyboard-accessible menus instead of system select popups.
let openedSelect = null;
function closeStyledSelect(restoreFocus = false) {
 if (!openedSelect) return;
 const item = openedSelect;
 item.menu.hidden = true;
 item.trigger.setAttribute('aria-expanded', 'false');
 openedSelect = null;
 if (restoreFocus) item.trigger.focus();
}
function syncStyledSelects() {
 styledSelects.forEach(item => {
  item.text.textContent = item.select.selectedOptions[0]?.textContent || '';
  [...item.menu.children].forEach((option, i) => {
   const selected = item.select.selectedIndex === i;
   option.setAttribute('aria-selected', String(selected));
   option.classList.toggle('chosen', selected);
  });
 });
}
window.syncStyledSelects = syncStyledSelects;
function positionStyledMenu(item) {
 const r = item.trigger.getBoundingClientRect();
 const gap = 7, edge = 12;
 const below = innerHeight - r.bottom - edge - gap;
 const above = r.top - edge - gap;
 const placeAbove = below < 210 && above > below;
 item.menu.style.width = Math.min(r.width, innerWidth - edge * 2) + 'px';
 item.menu.style.left = Math.max(edge, Math.min(r.left, innerWidth - r.width - edge)) + 'px';
 item.menu.style.maxHeight = Math.max(100, Math.min(330, placeAbove ? above : below)) + 'px';
 item.menu.style.top = (placeAbove ? Math.max(edge, r.top - gap - item.menu.offsetHeight) : r.bottom + gap) + 'px';
}
function openStyledSelect(item, index) {
 closeStyledSelect();
 openedSelect = item;
 item.menu.hidden = false;
 item.trigger.setAttribute('aria-expanded', 'true');
 syncStyledSelects();
 positionStyledMenu(item);
 const option = item.menu.children[index ?? item.select.selectedIndex] || item.menu.firstElementChild;
 option?.focus({preventScroll:true});
 option?.scrollIntoView({block:'nearest'});
}
$$('select').forEach((select, number) => {
 const field = select.closest('label');
 const title = [...field.childNodes].filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent).join('').trim();
 const wrapper = document.createElement('div');
 wrapper.className = 'styled-select';
 const trigger = document.createElement('button');
 trigger.type = 'button';
 trigger.className = 'select-trigger';
 trigger.setAttribute('role','combobox');
 trigger.setAttribute('aria-haspopup','listbox');
 trigger.setAttribute('aria-expanded','false');
 trigger.setAttribute('aria-label',title);
 trigger.setAttribute('aria-controls','styled-options-'+number);
 trigger.innerHTML = '<span class="select-value"></span><svg aria-hidden="true" viewBox="0 0 20 20"><path d="m5 7.5 5 5 5-5"/></svg>';
 const menu = document.createElement('div');
 menu.className = 'select-menu';
 menu.id = 'styled-options-'+number;
 menu.setAttribute('role','listbox');
 menu.setAttribute('aria-label',title);
 menu.hidden = true;
 const item = {select,trigger,menu,text:$('.select-value',trigger)};
 [...select.options].forEach((option,i) => {
  const button = document.createElement('button');
  button.type='button';button.className='select-option';button.tabIndex=-1;
  button.setAttribute('role','option');
  button.innerHTML='<span>'+escape(option.textContent)+'</span><svg aria-hidden="true" viewBox="0 0 20 20"><path d="m4 10 4 4 8-8"/></svg>';
  button.onclick = () => {select.selectedIndex=i;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));syncStyledSelects();closeStyledSelect(true);};
  menu.append(button);
 });
 select.hidden=true;
 select.after(wrapper);wrapper.append(trigger);root.append(menu);
 styledSelects.push(item);
 trigger.onclick = () => openedSelect === item ? closeStyledSelect(true) : openStyledSelect(item);
 trigger.onkeydown = e => {if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();openStyledSelect(item,e.key==='Home'?0:e.key==='End'?menu.children.length-1:undefined);}};
 let typed='',typedAt=0;
 menu.onkeydown = e => {
  const options=[...menu.children],current=options.indexOf(document.activeElement);
  let next;
  if(e.key==='ArrowDown')next=(current+1)%options.length;
  if(e.key==='ArrowUp')next=(current-1+options.length)%options.length;
  if(e.key==='Home')next=0;
  if(e.key==='End')next=options.length-1;
  if(next!==undefined){e.preventDefault();options[next].focus();}
  if(e.key==='Escape'){e.preventDefault();closeStyledSelect(true);}
  if(e.key==='Tab')closeStyledSelect(true);
  if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&e.key!==' '){const now=Date.now();typed=now-typedAt>700?e.key:typed+e.key;typedAt=now;const match=options.find(x=>x.textContent.toLowerCase().startsWith(typed.toLowerCase()));if(match){e.preventDefault();match.focus();}}
 };
 select.addEventListener('change',syncStyledSelects);
});
syncStyledSelects();
listen(document,'pointerdown',e=>{if(openedSelect&&!openedSelect.menu.contains(e.target)&&!openedSelect.trigger.contains(e.target))closeStyledSelect();});
listen(window,'resize',()=>{if(openedSelect)positionStyledMenu(openedSelect);});
listen(window,'scroll',e=>{if(openedSelect&&!openedSelect.menu.contains(e.target))closeStyledSelect();},true);

const cameFromEmail=/^[a-f0-9]{32}\.[a-f0-9]{64}$/.test(initialToken);
// City suggestions use the same supported regions as the school catalogue.
const cityInput=form.elements.namedItem('city'),cities=JSON.parse(root.dataset.regions||'[]');
const cityMenu=document.createElement('div');cityMenu.className='select-menu';cityMenu.id='submission-city-options';cityMenu.setAttribute('role','listbox');cityMenu.hidden=true;root.append(cityMenu);
function closeCity(){cityMenu.hidden=true;cityInput.setAttribute('aria-expanded','false');}
function positionCityMenu(){
 const r=cityInput.getBoundingClientRect(),viewport=window.visualViewport,edge=viewport?.offsetTop||0,bottom=edge+(viewport?.height||innerHeight),below=bottom-r.bottom-10,above=r.top-edge-10,up=below<160&&above>below;
 cityMenu.style.width=Math.min(r.width,innerWidth-24)+'px';cityMenu.style.left=Math.max(12,Math.min(r.left,innerWidth-r.width-12))+'px';cityMenu.style.maxHeight=Math.max(44,Math.min(290,up?above:below))+'px';
 cityMenu.style.top=(up?Math.max(edge+8,r.top-7-cityMenu.offsetHeight):r.bottom+7)+'px';
}
function renderCities(){
 const q=cityInput.value.toLocaleLowerCase('ru').replaceAll('ё','е').trim();
 const list=cities.filter(c=>c.label.toLocaleLowerCase('ru').replaceAll('ё','е').includes(q)).slice(0,12);
 cityMenu.innerHTML=list.length?list.map(c=>'<button type="button" class="select-option" role="option">'+escape(c.label)+'</button>').join(''):'<div class="hint" style="padding:8px">Город не найден. Для онлайн-школы можно указать город команды.</div>';
 cityMenu.hidden=false;positionCityMenu();cityInput.setAttribute('aria-expanded','true');
 [...cityMenu.querySelectorAll('button')].forEach(button=>button.onclick=()=>{cityInput.value=button.textContent;closeCity();updateAside();cityInput.focus();});
}
cityInput.addEventListener('input',renderCities);cityInput.addEventListener('focus',renderCities);
cityInput.addEventListener('keydown',event=>{if(event.key==='ArrowDown'){event.preventDefault();if(cityMenu.hidden)renderCities();cityMenu.querySelector('button')?.focus();}if(event.key==='Escape')closeCity();});
cityMenu.addEventListener('keydown',event=>{const list=[...cityMenu.querySelectorAll('button')],i=list.indexOf(document.activeElement);if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();list[(i+(event.key==='ArrowDown'?1:-1)+list.length)%list.length]?.focus();}if(event.key==='Escape'){closeCity();cityInput.focus();}});
listen(window,'resize',()=>{if(!cityMenu.hidden)positionCityMenu();});if(window.visualViewport)listen(window.visualViewport,'resize',()=>{if(!cityMenu.hidden)positionCityMenu();});
listen(document,'pointerdown',event=>{if(!cityMenu.contains(event.target)&&event.target!==cityInput)closeCity();});listen(window,'scroll',event=>{if(!cityMenu.contains(event.target))closeCity();},true);
const schoolPhone=form.elements.namedItem('schoolPhone');
schoolPhone.addEventListener('input',()=>{schoolPhone.value=options.formatPhone(schoolPhone.value);schoolPhone.setCustomValidity('');});schoolPhone.addEventListener('blur',()=>schoolPhone.setCustomValidity(schoolPhone.value?options.validatePhone(schoolPhone.value)||'':''));
Object.assign(window,{goStep,openCrop,closeCrop,resetCrop,removePhoto,makeCover,confirmApplication,resendConfirmation,confirmSubscription,editApplication,refreshApplication,statusActionError});
renderGrades();renderPhotos();updateAside();goStep(0,false);
if(root.dataset.mode==='status'){
 showView('status',false);
 (async()=>{
  try{
   if(cameFromEmail){const response=await fetch('/api/school-submissions/access/',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+initialToken},body:'{}',signal:controller.signal});const data=await response.json();if(!response.ok)throw Error(data.error||'Ссылка недействительна');application=data;history.replaceState(null,'',location.pathname);}
   else await refreshApplication();
   renderStatus();
   if(wantsSubscribe&&application.confirmed&&application.marketing&&!application.subscribed)toast('Для подписки нажмите «Подтвердить подписку» на странице.');
  }catch(error){if(error.name==='AbortError')return;$('#status-card').innerHTML='<h2>Не удалось открыть заявку</h2><p class="status-copy">'+escape(error.message)+'</p><p class="hint">Откройте личную ссылку из письма. Если нужна помощь: <a href="mailto:hello@pro-schools.ru">hello@pro-schools.ru</a>.</p>';$('.feedback').hidden=true;}
 })();
}else showView('form',false);
return ()=>{controller.abort();photos.forEach(p=>{if(p.src.startsWith('blob:'))URL.revokeObjectURL(p.src);});};

};
