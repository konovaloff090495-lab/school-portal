document.addEventListener('DOMContentLoaded',()=>{
 document.querySelector('#ps-city')?.addEventListener('change',e=>window.location.assign(e.target.value));
 const input=document.querySelector('#ps-search'),sort=document.querySelector('#ps-sort'),grid=document.querySelector('#ps-grid');
 if(!grid)return;
 const cards=[...grid.querySelectorAll('[data-card]')];
 function update(){
  const q=(input?.value||'').toLocaleLowerCase('ru');let count=0;
  for(const c of cards){c.hidden=!c.dataset.search.toLocaleLowerCase('ru').includes(q);if(!c.hidden)count++}
  const mode=sort?.value;
  [...cards].sort((a,b)=>mode==='rating'||mode==='reviews'?(Number(b.dataset[mode])||-1)-(Number(a.dataset[mode])||-1):a.dataset.search.localeCompare(b.dataset.search,'ru')).forEach(c=>grid.append(c));
  document.querySelector('#ps-count').textContent=count+' на этой странице';
  document.querySelector('#ps-empty-search').hidden=count>0;
 }
 input?.addEventListener('input',update);sort?.addEventListener('change',update);
});
