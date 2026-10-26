document.addEventListener('error',e=>{
 const img=e.target;if(!(img instanceof HTMLImageElement)||!img.matches('[data-school-cover]')||img.dataset.failed)return;
 img.dataset.failed='1';img.src=img.dataset.fallback;img.alt='Тематическая иллюстрация об обучении';
 const cover=img.closest('.ps-card-cover');cover.classList.remove('ps-card-cover-official');cover.querySelector('span').textContent='Иллюстрация';
},true);
document.addEventListener('DOMContentLoaded',()=>{
 document.querySelector('#ps-city')?.addEventListener('change',e=>window.location.assign(e.target.value));
 const input=document.querySelector('#ps-search'),sort=document.querySelector('#ps-sort'),grid=document.querySelector('#ps-grid');
 if(!grid)return;
 const cards=[...grid.querySelectorAll('[data-card]')];
 const ratingInputs=[...document.querySelectorAll('[name=ps-rating]')],free=document.querySelector('#ps-free');
 const details=document.querySelector('.ps-filters details');
 if(details && window.matchMedia('(max-width:767px)').matches)details.open=false;
 function update(){
  const q=(input?.value||'').trim().toLocaleLowerCase('ru'),min=Number(document.querySelector('[name=ps-rating]:checked')?.value||0);let count=0;
  for(const c of cards){c.hidden=!c.dataset.search.toLocaleLowerCase('ru').includes(q)||(Number(c.dataset.rating)||0)<min||(free?.checked&&c.dataset.free!=='1');if(!c.hidden)count++}
  const mode=sort?.value;
  [...cards].sort((a,b)=>mode==='rating'||mode==='reviews'?(Number(b.dataset[mode])||-1)-(Number(a.dataset[mode])||-1):a.dataset.search.localeCompare(b.dataset.search,'ru')).forEach(c=>grid.append(c));
  document.querySelector('#ps-count').textContent='Показано: '+count+' на этой странице';
  document.querySelector('#ps-empty-search').hidden=count>0;
 }
 input?.addEventListener('input',update);sort?.addEventListener('change',update);
 ratingInputs.forEach(x=>x.addEventListener('change',update));free?.addEventListener('change',update);
 document.querySelector('#ps-reset')?.addEventListener('click',()=>{input.value='';ratingInputs[0].checked=true;free.checked=false;update()});
 document.querySelectorAll('a[href^="tel:"]').forEach(x=>x.addEventListener('click',()=>window.ym?.(108789843,'reachGoal','phone_click')));
});
