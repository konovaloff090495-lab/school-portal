(() => {
'use strict';
const controls=[];let opened=null;
const chevron='<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 6 5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function close(returnFocus=false){if(!opened)return;const c=opened;c.menu.hidden=true;c.trigger.setAttribute('aria-expanded','false');c.trigger.removeAttribute('aria-activedescendant');opened=null;if(returnFocus)c.trigger.focus()}
function position(c){const r=c.trigger.getBoundingClientRect(),margin=10;const width=Math.min(Math.max(r.width,c.native.id==='sort'?228:0),innerWidth-margin*2);const below=innerHeight-r.bottom-margin,above=r.top-margin;const useAbove=below<160&&above>below;const height=Math.min(304,Math.max(92,(useAbove?above:below)-5));c.menu.style.width=width+'px';c.menu.style.maxHeight=height+'px';c.menu.style.left=Math.max(margin,Math.min(r.left,innerWidth-width-margin))+'px';c.menu.style.top=useAbove?'auto':Math.min(innerHeight-margin,r.bottom+5)+'px';c.menu.style.bottom=useAbove?Math.max(margin,innerHeight-r.top+5)+'px':'auto'}
function activate(c,index,scroll=true){if(!c.options.length)return;let next=Math.max(0,Math.min(index,c.options.length-1));if(c.native.options[next].disabled)return;c.active=next;c.options.forEach((e,i)=>e.classList.toggle('is-active',i===next));c.trigger.setAttribute('aria-activedescendant',c.options[next].id);if(scroll)c.options[next].scrollIntoView({block:'nearest'})}
function sync(c){const o=c.native.selectedOptions[0];c.value.textContent=o?.textContent||'';c.trigger.disabled=c.native.disabled;c.options.forEach((e,i)=>e.setAttribute('aria-selected',String(i===c.native.selectedIndex)))}
function show(c,initial){if(opened===c)return;close();opened=c;sync(c);c.menu.hidden=false;c.trigger.setAttribute('aria-expanded','true');position(c);activate(c,initial??Math.max(0,c.native.selectedIndex));}
function choose(c,index){if(c.native.options[index]?.disabled)return;const changed=c.native.selectedIndex!==index;c.native.selectedIndex=index;sync(c);close(true);if(changed){c.native.dispatchEvent(new Event('input',{bubbles:true}));c.native.dispatchEvent(new Event('change',{bubbles:true}))}}
document.querySelectorAll('select').forEach((native,order)=>{
 if(native.multiple||native.size>1)return;
 const originalLabel=document.querySelector('label[for="'+native.id+'"]');let name=native.getAttribute('aria-label')||originalLabel?.textContent?.trim()||'Выбрать значение';
 const wrapper=document.createElement('div');wrapper.className='select-control';native.before(wrapper);wrapper.append(native);native.classList.add('select-native');native.tabIndex=-1;native.setAttribute('aria-hidden','true');
 const trigger=document.createElement('button');trigger.type='button';trigger.className='select-trigger';trigger.id=(native.id||'select-'+order)+'-trigger';trigger.setAttribute('role','combobox');trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-autocomplete','none');trigger.setAttribute('aria-label',name);trigger.innerHTML='<span></span>'+chevron;wrapper.append(trigger);
 const menu=document.createElement('div');menu.className='custom-select-menu';menu.id=(native.id||'select-'+order)+'-options';menu.setAttribute('role','listbox');menu.setAttribute('aria-label',name);menu.hidden=true;document.body.append(menu);trigger.setAttribute('aria-controls',menu.id);
 trigger.querySelector('span').id=trigger.id+'-value';trigger.setAttribute('aria-describedby',trigger.id+'-value');
 const c={native,wrapper,trigger,menu,value:trigger.querySelector('span'),options:[],active:Math.max(0,native.selectedIndex),buffer:'',bufferTimer:null};
 [...native.options].forEach((o,i)=>{const item=document.createElement('div');item.className='select-option';item.id=menu.id+'-'+i;item.setAttribute('role','option');item.setAttribute('aria-selected',String(i===native.selectedIndex));if(o.disabled)item.setAttribute('aria-disabled','true');item.textContent=o.textContent;item.addEventListener('pointermove',()=>activate(c,i,false));item.addEventListener('pointerdown',e=>e.preventDefault());item.addEventListener('click',()=>choose(c,i));menu.append(item);c.options.push(item)});
 trigger.addEventListener('click',()=>opened===c?close():show(c));trigger.addEventListener('keydown',e=>{
 if(e.key==='Tab'){close();return}
 if(e.key==='Escape'){if(opened===c){e.preventDefault();e.stopPropagation();close(true)}return}
 if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();if(opened!==c){show(c,e.key==='Home'?0:e.key==='End'?c.options.length-1:undefined)}else activate(c,e.key==='Home'?0:e.key==='End'?c.options.length-1:c.active+(e.key==='ArrowDown'?1:-1));return}
 if(e.key==='Enter'||e.key===' '){e.preventDefault();if(opened===c)choose(c,c.active);else show(c);return}
 if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();c.buffer+=e.key.toLocaleLowerCase('ru');clearTimeout(c.bufferTimer);c.bufferTimer=setTimeout(()=>c.buffer='',650);if(opened!==c)show(c);let i=[...native.options].findIndex(o=>o.textContent.toLocaleLowerCase('ru').startsWith(c.buffer));if(i<0&&c.buffer.length>1){c.buffer=e.key.toLocaleLowerCase('ru');i=[...native.options].findIndex(o=>o.textContent.toLocaleLowerCase('ru').startsWith(c.buffer))}if(i>=0)activate(c,i)}
 });
 native.addEventListener('change',()=>sync(c));originalLabel?.addEventListener('click',e=>{e.preventDefault();trigger.focus()});sync(c);controls.push(c);
});
window.refreshSelectControls=()=>controls.forEach(sync);
document.addEventListener('pointerdown',e=>{if(opened&&!opened.menu.contains(e.target)&&!opened.wrapper.contains(e.target))close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&opened){e.stopPropagation();close(true)}},true);
window.addEventListener('resize',()=>{if(opened)position(opened)});
window.addEventListener('scroll',e=>{if(opened&&!opened.menu.contains(e.target))position(opened)},true);
document.querySelectorAll('.mobile-filter-close,.mobile-apply').forEach(b=>b.addEventListener('click',()=>close()));
})();
