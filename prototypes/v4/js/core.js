/* Human Signals v4 prototype · shared helpers.
   Classic scripts, no build: every module hangs its API off window.HS and calls other modules at run time. */
window.HS = window.HS || {};
(function(HS){
const $=s=>document.querySelector(s);
const app=$('#app'), live=$('#live');
const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
HS.$=$; HS.app=app;

/* One visible layer at a time. The prototype has several independently-authored
   surfaces, but they share one interaction contract: a new dialog replaces the
   old one, background controls are unavailable, and closing returns focus to the
   opener (or its owning control). */
const FOCUSABLE='a[href],area[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
const layers=HS.layers={active:null,inertNodes:[],suppressRestore:false};
/* body/html are never restore targets: they have client rects, so without this exclusion
   layers.opener() can capture the stage as the "opener" and Escape would restore focus to
   nothing (the browser default) instead of a control. */
const available=el=>el&&el!==document.body&&el!==document.documentElement&&document.contains(el)&&!el.disabled&&!el.hidden&&el.getAttribute('aria-hidden')!=='true'&&el.getClientRects().length>0&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden';
const firstFocusable=el=>el&&[...el.querySelectorAll(FOCUSABLE)].find(available);
function restoreFocus(opener,fallback){
  const target=available(opener)?opener:(available(fallback)?fallback:null);
  if(target) target.focus({preventScroll:true});
}
function lockNode(el){
  if(!el||el===app||layers.inertNodes.some(x=>x.el===el)) return;
  const entry={el,inert:el.inert,tab:[]};
  el.inert=true; el.setAttribute('data-hs-inert','true');
  el.querySelectorAll(FOCUSABLE).forEach(node=>{ entry.tab.push({node,value:node.getAttribute('tabindex')}); node.setAttribute('tabindex','-1'); });
  layers.inertNodes.push(entry);
}
function lockBackground(el){
  unlockBackground();
  let child=el;
  while(child&&child.parentElement){
    const parent=child.parentElement;
    [...parent.children].forEach(sibling=>{ if(sibling!==child) lockNode(sibling); });
    if(parent===app) break;
    child=parent;
  }
}
function unlockBackground(){
  layers.inertNodes.forEach(({el,inert,tab})=>{
    el.inert=inert; el.removeAttribute('data-hs-inert');
    tab.forEach(({node,value})=>{ if(value===null) node.removeAttribute('tabindex'); else node.setAttribute('tabindex',value); });
  });
  layers.inertNodes=[];
}
layers.start=function(id,opener,close,fallback){
  const current=layers.active;
  if(HS.closePopovers) HS.closePopovers(false);
  if(document.querySelector('#advMenu')&&HS.toggleAdvMenu) HS.toggleAdvMenu(false);
  if(current&&current.id!==id){
    layers.suppressRestore=true;
    try{ current.close(false); } finally { layers.suppressRestore=false; }
    if(layers.active===current) layers.end(current.id,false);
  }
  if(layers.active&&layers.active.id===id){
    if(opener) layers.active.opener=opener;
    if(fallback) layers.active.fallback=fallback;
    return layers.active;
  }
  layers.active={id,opener:opener||null,fallback:fallback||null,close,el:null,modal:true};
  return layers.active;
};
layers.mount=function(id,el,modal=true){
  const active=layers.active; if(!active||active.id!==id) return;
  active.el=el; active.modal=modal;
  if(modal){ el.setAttribute('role',el.getAttribute('role')||'dialog'); el.setAttribute('aria-modal','true'); lockBackground(el); }
};
layers.end=function(id,restore=true){
  const active=layers.active; if(!active||active.id!==id) return;
  const {opener,fallback,el}=active; unlockBackground(); layers.active=null;
  if(el) el.removeAttribute('aria-modal');
  if(restore&&!layers.suppressRestore) restoreFocus(opener,fallback);
};
layers.opener=function(preferred,fallback){
  const active=layers.active;
  if(preferred&&active&&active.el&&active.el.contains(preferred)) return available(fallback)?fallback:null;
  return available(preferred)?preferred:(available(fallback)?fallback:null);
};
document.addEventListener('focusin',e=>{
  const active=layers.active; if(!active||!active.modal||!active.el||active.el.contains(e.target)) return;
  const target=firstFocusable(active.el); if(target&&e.target!==target) target.focus({preventScroll:true});
});
document.addEventListener('keydown',e=>{
  const active=layers.active; if(!active||!active.modal||!active.el||e.key!=='Tab'||!active.el.contains(document.activeElement)) return;
  const all=[...active.el.querySelectorAll(FOCUSABLE)].filter(available); if(!all.length) return;
  const i=all.indexOf(document.activeElement), next=e.shiftKey?(i<=0?all.length-1:i-1):(i<0||i===all.length-1?0:i+1);
  e.preventDefault(); all[next].focus({preventScroll:true});
});
HS.scenes={};
HS.userRM=false;
HS.RM=()=>HS.userRM||mq.matches||!!HS.instant;   // instant: restoring a link applies state without animation
HS.applyRM=()=>app.classList.toggle('rm',HS.RM());
HS.applyRM(); if(mq.addEventListener) mq.addEventListener('change',HS.applyRM);
HS.say=t=>{ if(t&&HS.conciseSay){ const s=String(t).replace(/\s+/g,' ').trim(), m=s.match(/^.*?[.!?](?=\s|$)/); t=m?m[0]:s; } live.textContent=''; setTimeout(()=>{ live.textContent=t; },40); };
HS.sleep=ms=>new Promise(r=>setTimeout(r,ms));
HS.strip=h=>h.replace(/<[^>]+>/g,'');
})(window.HS);
