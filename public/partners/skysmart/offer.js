/* Skysmart offer 1888: exact editorial allowlist, no contact collection. */
(()=>{'use strict';
if(window.PSSkysmart)return;
const BASE='/partners/skysmart/',KEY='ps_skysmart_1888_dismiss_until',SEEN='ps_skysmart_1888_seen';
let config,route='',started=0,timer,popup,auto=false,previousFocus;
const read=(storage,key)=>{try{return storage.getItem(key)}catch{return null}},write=(storage,key,value)=>{try{storage.setItem(key,value)}catch{}};
function track(action,placement){window.ym?.(108789843,'reachGoal',action==='shown'?'partner_popup_shown':action==='click'?'partner_popup_click':'skysmart_popup_close',{partner:'skysmart',offer_id:1888,placement,path:location.pathname});window.dispatchEvent(new CustomEvent('ps:skysmart',{detail:{action,placement,path:location.pathname}}))}
const valid=()=>config&&Date.now()<=Date.parse(config.expiresAt);
const eligible=()=>valid()&&config.paths.includes(location.pathname);
function busy(){return !!document.querySelector('dialog[open], [aria-modal="true"], input:focus, textarea:focus, select:focus, .ps-chrome .mega:not([hidden]), #first-city-prompt:not([hidden])')||document.visibilityState!=='visible'}
function close(remember=true){if(!popup)return;popup.hidden=true;if(remember){write(localStorage,KEY,String(Date.now()+config.dismissDays*86400000));track('close','popup')}if(popup.contains(document.activeElement)&&previousFocus?.isConnected)previousFocus.focus()}
function show(manual=false){if(!valid()||!eligible()||busy())return;if(!manual&&(auto||read(sessionStorage,SEEN)||Number(read(localStorage,KEY))>Date.now()))return;
 if(!popup){popup=document.createElement('aside');popup.className='ps-sky ps-sky-popup';popup.setAttribute('role','region');popup.setAttribute('aria-labelledby','ps-sky-title');popup.hidden=true;popup.innerHTML=`<button type="button" class="ps-sky-close" aria-label="Закрыть предложение Skysmart">×</button><div class="ps-sky-kicker"><span class="ps-sky-brand">skysmart</span><span class="ps-sky-age">7–17 лет</span></div><h2 id="ps-sky-title">Первая игра —<br>своими руками</h2><p>Бесплатная школа программирования: 18 материалов, чтобы попробовать ИТ вместе с ребёнком.</p><img class="ps-sky-visual" src="${BASE}first-game.png" width="720" height="520" alt="Игровое поле и команды: первый проект ребёнка"><div class="ps-sky-pills"><span>Scratch и Python</span><span>Нейросети</span><span>Безопасность</span><span>Профориентация</span></div><a class="ps-sky-cta" href="${config.url}" target="_blank" rel="sponsored nofollow noopener noreferrer">Получить 18 материалов бесплатно <span aria-hidden="true">↗</span></a><small>Видеоуроки и задания для самостоятельного старта. Получение материалов — на сайте Skysmart.</small>`;document.body.append(popup);popup.querySelector('button').onclick=()=>close();popup.querySelector('a').onclick=()=>{track('click','popup');write(localStorage,KEY,String(Date.now()+30*86400000));close(false)}}
 previousFocus=document.activeElement;popup.hidden=false;auto=true;write(sessionStorage,SEEN,'1');track('shown','popup');if(manual)popup.querySelector('button').focus();
}
function check(){if(!eligible()||Date.now()-started<config.autoDelayMs)return;const range=document.documentElement.scrollHeight-innerHeight;if(range>0&&scrollY/range>=config.scrollFraction)show()}
function sync(){if(!config||route===location.pathname)return;route=location.pathname;close(false);clearInterval(timer);started=Date.now();auto=false;
 document.body.toggleAttribute('data-ps-skysmart-eligible',eligible());
 if(eligible()){timer=setInterval(check,1500)}
}
window.PSSkysmart={show:()=>show(true)};
const css=document.createElement('link');css.rel='stylesheet';css.href=BASE+'offer.css?v=20261031';document.head.append(css);
fetch(BASE+'offer.json?v=20261031').then(r=>{if(!r.ok)throw Error('Offer unavailable');return r.json()}).then(c=>{config=c;sync()}).catch(()=>{});
window.addEventListener('ps:navigation-route',sync);window.addEventListener('scroll',check,{passive:true});window.addEventListener('popstate',sync);
// React route changes also remain observable when another layout owns navigation.
new MutationObserver(()=>{if(route!==location.pathname)sync()}).observe(document.body,{childList:true,subtree:true});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&popup&&!popup.hidden)close()});
document.addEventListener('focusin',e=>{if(popup&&!popup.hidden&&!popup.contains(e.target)&&e.target.matches('input,textarea,select'))close(false)});
document.addEventListener('click',e=>{const a=e.target.closest('a[data-skysmart-cta]');if(a)track('click',a.dataset.skysmartCta||'article');const button=e.target.closest('[data-skysmart-open]');if(button){e.preventDefault();show(true)}});
})();
