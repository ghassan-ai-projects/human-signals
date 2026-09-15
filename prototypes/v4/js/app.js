/* App wiring: toolbar and pathway-bar buttons, keyboard model, zoom-level tips, first paint. */
(function(HS){
const $=HS.$, E=HS.E;

HS.onLevel=L=>{
  ['organ','structure'].forEach(k=>{ if(k!==L) HS.clearTip(k); });   // a zoom tip leaves once you leave its level
  if(L==='organ') HS.tip('organ','You’re at organ level: labels now show signal names. Click inside to look closer, or click the mini-map to zoom out.',{right:16,bottom:210});
  if(L==='structure') HS.tip('structure','Close-up. Tap i on a label for a short explanation, or Cell › where it appears.',{right:16,bottom:210});
  HS.renderOverlay();
};

$('#bPlay').addEventListener('click',()=>HS.play());
$('#bRead').addEventListener('click',()=>HS.openRead());
$('#bExit').addEventListener('click',()=>HS.leave());
$('#bWhat').addEventListener('click',()=>HS.openWhatIf());
$('#bSearch').addEventListener('click',()=>HS.openSearch());
$('#bSystems').addEventListener('click',()=>{ const p=$('#panel'); p.classList.toggle('closed'); $('#bSystems').setAttribute('aria-pressed',!p.classList.contains('closed')); HS.camTo(HS.cam.region||'body',450); });

document.addEventListener('keydown',e=>{
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); HS.openSearch(); return; }
  const tgt=e.target instanceof Element?e.target:document.body;
  if(tgt.closest('input,textarea')) return;
  const k=e.key, p=HS.pathway();
  if(k==='?'){ e.preventDefault(); HS.toggleKeys(); return; }
  if(k==='Escape'){
    if($('#keys')){ HS.toggleKeys(); return; }
    if($('#cards .card')){ HS.closeCards(); return; }
    if(E.tryMode){ HS.closeTry(); return; }
    if(E.whatIf){ HS.restoreWhatIf(true); return; }
    if(E.cellOpen){ HS.closeCell(); return; }
    if(!$('#sheet').classList.contains('closed')){ HS.closeRead(true); return; }
    if(HS.level()!=='body'){ HS.camTo(p?p.region:'body',600); return; }
    if(E.route) HS.leave();
    return;
  }
  if(tgt.closest('.row,.rb-handle')) return;
  if(k==='s'||k==='S') $('#bSystems').click();
  else if(k==='l'||k==='L') $('#tLabels').click();
  else if(k==='+'||k==='=') HS.zoomBy(1.6);
  else if(k==='-') HS.zoomBy(1/1.6);
  else if(k==='0') HS.camTo('body');
  else if(k==='/'){ e.preventDefault(); $('#bSearch').click(); }
  else if(k==='a'||k==='A') HS.setAdvanced(!HS.advOn,true);
  else if(p){
    if(k===' '&&!tgt.closest('button')){ e.preventDefault(); HS.play(); }
    else if(k===']'||k==='['){ const n=p.hots.length, i=k===']'?Math.min(n-1,E.cur+1):Math.max(0,E.cur-1); HS.goHot(i,true); setTimeout(()=>HS.focusHotspot(E.sceneId+E.route+i),50); }
    else if(k==='r'||k==='R') HS.openRead();
    else if(k==='t'||k==='T') HS.openTry();
    else if(k==='w'||k==='W') HS.openWhatIf();
    else if(k==='f'||k==='F'||k==='g'||k==='G'){ const b=document.querySelectorAll('#seg [data-route]')[/[fF]/.test(k)?0:1]; if(b) b.click(); }
  }
});

$('#bShare').addEventListener('click',async()=>{
  HS.syncHashNow();
  try{ await navigator.clipboard.writeText(location.href); HS.toast('Link copied. It opens this moment, paused.'); }
  catch(e){ HS.toast('Copy this page’s address to share this moment. It opens paused.'); }
});
const be=$('#bErase'); let eraseT=0;
be.addEventListener('click',()=>{
  if(!be.classList.contains('confirm')){ be.classList.add('confirm'); be.textContent='Tap again to erase'; clearTimeout(eraseT); eraseT=setTimeout(()=>{ be.classList.remove('confirm'); be.textContent='Erase progress'; },3000); return; }
  clearTimeout(eraseT); be.classList.remove('confirm'); be.textContent='Erase progress';
  if(E.route) HS.leave();
  HS.eraseProgress(); HS.renderContinue(); HS.renderSummary(); HS.toast('Progress erased from this device.');
});
window.addEventListener('hashchange',()=>{ if(!HS.restoring) HS.restoreFromHash(); });
$('#labels').addEventListener('focusin',e=>{ if(e.target.matches('.hs,.lab button')) HS.ensureVisible(e.target); });

/* keyboard shortcuts (?) */
const KEYS=[['Anywhere',[['⌘K or /','Search'],['S','Systems panel'],['L','Show all labels'],['+ and −','Zoom'],['0','Whole body'],['Arrows','Pan, when the body has focus'],['A','Advanced mode'],['?','This list'],['Esc','Close, then zoom out, then leave']]],
 ['In a pathway',[['Space','Play or pause'],['] and [','Next or previous step'],['T','Try it?'],['W','What if?'],['F and G','First or second route'],['R','Read the route']]]];
HS.toggleKeys=function(){
  let d=$('#keys'); if(d){ const ret=d._ret; d.remove(); if(ret&&document.contains(ret)) ret.focus(); return; }
  d=document.createElement('div'); d.id='keys'; d.className='keys float'; d.setAttribute('role','dialog'); d.setAttribute('aria-label','Keyboard shortcuts'); d._ret=document.activeElement;
  d.innerHTML=`<header><b>Keyboard</b><button class="x" aria-label="Close">×</button></header><div class="kcols">${KEYS.map(([h,rows])=>`<section><h4>${h}</h4><dl>${rows.map(([k,v])=>`<dt><kbd>${k}</kbd></dt><dd>${v}</dd>`).join('')}</dl></section>`).join('')}</div>`;
  HS.app.appendChild(d); d.querySelector('.x').onclick=HS.toggleKeys; d.querySelector('.x').focus();
};
$('#bKeys').addEventListener('click',()=>{ document.querySelectorAll('.pop').forEach(x=>x.hidden=true); $('#bSettings').setAttribute('aria-expanded','false'); HS.toggleKeys(); });

/* first paint */
HS.buildWorld(); HS.renderTriggers(); HS.renderTree();
if(!HS.RM()&&!location.hash){ HS.app.classList.add('intro'); setTimeout(()=>HS.app.classList.remove('intro'),1700); }   // the body settles in once
HS.loadProgress(); HS.renderContinue(); HS.renderSummary();
HS.camTo('body',0);
HS.restoreFromHash().then(opened=>{ if(!opened) HS.tip('start','Start here: pick something that happens to you.',{left:326,top:92}); });
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>HS.renderOverlay());
})(window.HS);
