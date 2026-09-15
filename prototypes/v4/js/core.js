/* Human Signals v4 prototype · shared helpers.
   Classic scripts, no build: every module hangs its API off window.HS and calls other modules at run time. */
window.HS = window.HS || {};
(function(HS){
const $=s=>document.querySelector(s);
const app=$('#app'), live=$('#live');
const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
HS.$=$; HS.app=app;
HS.scenes={};
HS.userRM=false;
HS.RM=()=>HS.userRM||mq.matches||!!HS.instant;   // instant: restoring a link applies state without animation
HS.applyRM=()=>app.classList.toggle('rm',HS.RM());
HS.applyRM(); if(mq.addEventListener) mq.addEventListener('change',HS.applyRM);
HS.say=t=>{ live.textContent=''; setTimeout(()=>{ live.textContent=t; },40); };
HS.sleep=ms=>new Promise(r=>setTimeout(r,ms));
HS.strip=h=>h.replace(/<[^>]+>/g,'');
})(window.HS);
