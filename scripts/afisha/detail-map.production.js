function drawVenueMap(){
 const container=$('#ps-location-map');if(state.page!=='detail')return;const e=current();
 if(container.dataset.event===e.id&&container.childElementCount)return;container.dataset.event=e.id;
 if(!e.coordinates){container.classList.add('ps-map-unresolved');container.innerHTML=`<div class="ps-map-unavailable"><strong>${e.sourceProvider==='Tripster'?'Точное место встречи сообщает организатор':'Точка площадки уточняется'}</strong><p>${esc(e.address)}</p><a href="${esc(e.sources[0]?.url||'#')}" target="_blank" rel="noopener nofollow">Уточнить место у организатора ↗</a></div>`;return}
 container.classList.remove('ps-map-unresolved');const point=e.coordinates,src='https://yandex.ru/map-widget/v1/?ll='+encodeURIComponent(point.join(','))+'&z=16&pt='+encodeURIComponent(point.join(','))+'&lang=ru_RU';
 container.innerHTML=`<iframe title="Яндекс Карты: ${esc(e.place)}" src="${esc(src)}" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>`;
}
