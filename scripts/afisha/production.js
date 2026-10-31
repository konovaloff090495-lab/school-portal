// Shared production behaviour; the city data remains separate from the approved UI.
function productionMeta(){const event=state.page==='detail'?current():null;const title=event?event.title+' — '+event.city:(state.page==='home'?'Афиша для детей '+cityConfig.inCity:$('#ps-catalog-heading').textContent);document.title=title+' | ProSchools';let canonical=document.querySelector('link[rel=canonical]');if(canonical)canonical.href='https://pro-schools.ru'+(event?cityConfig.base+'sobytie/'+event.id+'/':state.page==='home'?cityConfig.base:cityConfig.base+(state.types.length===1?categorySlugs[state.types[0]]+'/':''));if(state.page==='detail'){const meta=document.querySelector('meta[name=description]');if(meta)meta.content=event.title+'. '+event.place+'. '+event.address;}}
function initSiteNavigation(){if(!document.querySelector('script[data-afisha-navigation]')){const script=document.createElement('script');script.src='/site-navigation/navigation.js?v=20261031';script.dataset.afishaNavigation='';document.body.appendChild(script)}}
const originalGoProduction=go;go=function(page,event){if(event){const selected=items.find(e=>e.id===event)||payload.alternatives.find(e=>e.id===event);if(selected&&selected.city!==cityConfig.name){const c=payload.cities.find(c=>c.name===selected.city);if(c){location.assign(c.base+'sobytie/'+event+'/');return}}}if(page==='detail'&&event)history.pushState(null,'',cityConfig.base+'sobytie/'+event+'/');if(page==='home')history.pushState(null,'',cityConfig.base);originalGoProduction(page,event);productionMeta()};
const originalReadRouteProduction=readRoute;readRoute=function(){originalReadRouteProduction();const parts=location.pathname.split('/');const index=parts.indexOf('sobytie');if(index>=0&&items.some(e=>e.id===parts[index+1])){state.page='detail';state.event=parts[index+1]}};
const originalUpdateChromeProduction=updateChrome;updateChrome=function(){originalUpdateChromeProduction();$('#ps-city-options').innerHTML=payload.cities.map(c=>`<a class="ps-city-chip" href="${esc(c.base)}">${esc(c.name)}${c.isMO&&c.name!=='Московская область'?'<small>Московская область</small>':''}</a>`).join('');};
const originalHomeProduction=renderHome;renderHome=function(){originalHomeProduction();enhanceSelects();syncDateButtons();const nearbyTitle=$('#ps-home .ps-group-title h2');if(nearbyTitle)nearbyTitle.textContent='Ближайшие события '+cityConfig.inCity;const summary=$('#ps-home .ps-group-title p');if(summary)summary.textContent=cityConfig.name+' · '+(state.rangeFrom||state.date!=='all'?dateButtonText():'Все даты');$('#ps-cities').innerHTML=payload.cities.filter(c=>c.name!==cityConfig.name&&(cityConfig.isMO?c.isMO:true)).map(c=>`<a class="ps-city-chip" href="${esc(c.base)}">${esc(c.name)}</a>`).join('');const home=$('#ps-home');let title=$('#ps-production-title');if(!title){title=document.createElement('h1');title.id='ps-production-title';title.className='ps-production-title';$('#ps-poster').before(title)}title.textContent='Афиша для детей '+cityConfig.inCity;if(!items.length){$('#ps-home-events').innerHTML='<p>Точное расписание этого города уточняется. Ниже — реальные программы других городов с указанием места проведения.</p>'+payload.alternatives.slice(0,6).map(card).join('')}$('#ps-poster-title').tagName==='H1'&&($('#ps-poster-title').outerHTML=$('#ps-poster-title').outerHTML.replaceAll('h1','h2'));};
const originalSyncLocationsProduction=syncLocations;syncLocations=function(){originalSyncLocationsProduction();for(const [id,list]of [['ps-okrug',geography.okrugs],['ps-district',geography.districts],['ps-metro',geography.stations]]){const field=$('#'+id);field.disabled=!list.length;const label=root.querySelector('label[for="'+id+'"]');if(label)label.hidden=!list.length;field.hidden=!list.length;if(field.nextElementSibling?.classList.contains('ps-select-button'))field.nextElementSibling.hidden=!list.length;}if(!geography.stations.length){const radius=$('#ps-metro-radius');radius.hidden=true;root.querySelector('label[for="ps-metro-radius"]')?.setAttribute('hidden','');}};
const originalRenderCatalogProduction=renderCatalog;renderCatalog=function(){originalRenderCatalogProduction();if(!items.length&&!$('#ps-alternatives')?.querySelector('article')){$('#ps-results-count').textContent='Расписание города уточняется';}productionMeta();};
// Clicking city links loads that city's real data, not a relabelled Moscow list.
root.addEventListener('click',event=>{const target=event.target.closest('[data-city],[data-city-catalog]');if(!target)return;event.preventDefault();event.stopImmediatePropagation();const name=target.dataset.city||target.dataset.cityCatalog;const city=payload.cities.find(c=>c.name===name);location.assign(city?city.base:'/afisha/');},true);
try{const saved=JSON.parse(localStorage.getItem('proschools-afisha-saved')||'[]');if(Array.isArray(saved))state.saved=saved.filter(v=>typeof v==='string')}catch{}
const originalSaveProduction=save;save=function(){try{localStorage.setItem('proschools-afisha-saved',JSON.stringify(state.saved))}catch{}originalSaveProduction()};
// The city picker belongs beside the control, rather than above the page header.
for(const id of ['ps-age','ps-hero-age'])$('#'+id).querySelector('option[value="all"]').textContent='Любой';
for(const button of root.querySelectorAll('[data-action="city"]')){
  button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
  if(button.closest('.ps-search-field')){
    button.classList.add('ps-city-trigger');
    button.innerHTML='<span data-city-label="">'+esc(cityConfig.name)+'</span>';
  }
}
root.addEventListener('click',event=>{
  const button=event.target.closest('[data-action="city"]');if(!button)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(openPopup&&popupAnchor===button){closePopup();return}
  const panel=document.createElement('div');panel.className='ps-select-panel ps-city-panel';
  panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Выберите город');
  panel.innerHTML='<div class="ps-city-panel-head"><strong>Выберите город</strong><button type="button" aria-label="Закрыть выбор города">×</button></div><input type="search" placeholder="Город или область" aria-label="Поиск города" autocomplete="off"><nav class="ps-city-results" aria-label="Города афиши"></nav><p class="ps-city-empty" hidden>Город не найден. Проверьте название.</p>';
  const list=panel.querySelector('.ps-city-results');
  const cities=[...payload.cities].sort((a,b)=>Number(b.name===cityConfig.name)-Number(a.name===cityConfig.name)||Number(b.isMO&&cityConfig.isMO)-Number(a.isMO&&cityConfig.isMO));
  list.innerHTML=cities.map(c=>'<a href="'+esc(c.base)+'"'+(c.name===cityConfig.name?' aria-current="page"':'')+'>'+esc(c.name)+(c.isMO&&c.name!=='Московская область'?'<small>Московская область</small>':'')+'</a>').join('');
  panel.querySelector('button').onclick=()=>{closePopup();button.focus()};
  const input=panel.querySelector('input');
  input.oninput=()=>{const query=input.value.toLowerCase().replace(/ё/g,'е').trim();let found=0;for(const link of list.children){link.hidden=!link.textContent.toLowerCase().replace(/ё/g,'е').includes(query);if(!link.hidden)found++}panel.querySelector('.ps-city-empty').hidden=!!found};
  if(button.getBoundingClientRect().bottom>innerHeight-240)button.scrollIntoView({block:'center',behavior:'instant'});
  placePopup(panel,button);
  const bounds=button.getBoundingClientRect();panel.style.top=(bounds.bottom+8)+'px';panel.style.maxHeight=Math.max(160,innerHeight-bounds.bottom-20)+'px';
  input.focus({preventScroll:true});
},true);

readRoute();

$$('[data-date=weekend]').forEach(b=>b.textContent='Ближайшие выходные');$$('[data-date=tomorrow]').forEach(b=>b.textContent='Завтра');
// Use the site's existing counter; catalogue search text is excluded from page-view URLs.
function afishaAnalyticsUrl(){const url=new URL(location.href);url.searchParams.delete('q');return url.href}
if(!window.ym){window.ym=function(){(window.ym.a=window.ym.a||[]).push(arguments)};window.ym.l=Date.now();const tag=document.createElement('script');tag.async=true;tag.src='https://mc.yandex.ru/metrika/tag.js?id=108789843';document.head.appendChild(tag);window.ym(108789843,'init',{ssr:true,webvisor:true,clickmap:true,ecommerce:'dataLayer',referrer:document.referrer,url:afishaAnalyticsUrl(),accurateTrackBounce:true,trackLinks:true})}
