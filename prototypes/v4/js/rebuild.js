/* Advanced challenge · Rebuild the route. Routes and numbers hide; the learner puts the organs in causal
   order (some don't belong), then names the signal on each link. Specific corrections, then the true route
   plays. Recorded as practice. Scene data: pathway.rebuild = {chain, alt?, links, distractors, extra}. */
(function(HS){
const $=HS.$, E=HS.E;
const RB=HS.RB={active:false};
const nm=k=>HS.orgName(k);
const cap=s=>/^[A-Z]{2,}/.test(s)?s:s.charAt(0).toUpperCase()+s.slice(1);
const shuffle=(arr,seed)=>{ const a=arr.slice(); let s=seed; for(let i=a.length-1;i>0;i--){ s=(s*9301+49297)%233280; const j=Math.floor(s/233280*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };

HS.openRebuild=function(){
  const p=HS.pathway(); if(!p||!p.rebuild||RB.active) return;
  const opener=HS.layers.opener(document.activeElement,$('#bAdv'));
  HS.layers.start('rebuild',opener,()=>HS.closeRebuild(false),$('#bAdv'));
  HS.stopPlay(); HS.closeTry(false); HS.restoreWhatIf(false); HS.closeCell(false); HS.closeCards(); HS.closeRead(false); $('#tips').innerHTML='';
  const R=p.rebuild, seed=(E.sceneId+E.route).split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  Object.assign(RB,{active:true,p,R,picks:[],names:[],stage:'order',orderOk:null,namesOk:null,cands:shuffle([...new Set(R.chain.concat(Object.values(R.alt||{}).flat(),R.distractors))],seed) /* accepted alternatives must be pickable too */,pool:shuffle(R.links.concat(R.extra),seed+11)});
  Object.keys(HS.rstate).forEach(id=>HS.setRoute(id,'hide')); HS.setTime(E.tIdx);
  RB.cands.forEach(k=>$('#o-'+k).classList.add('cand'));
  HS.light.dim=new Set(RB.cands); HS.light.lit=new Set(); HS.applyOrgs();
  const box=document.createElement('div'); box.className='try float rb'; box.id='rbCard'; box.setAttribute('role','dialog'); box.setAttribute('aria-label','Rebuild the route');
  box.style.right='16px'; box.style.top='96px';
  $('#cards').appendChild(box); HS.layers.mount('rebuild',box); render(); box.querySelector('[data-rb]').focus();
  HS.camTo(R.region||p.region,600); HS.renderOverlay();
  HS.say(`Rebuild the route. Tap the organs in the order the signal travels. ${R.distractors.length} don't belong. Candidates: ${RB.cands.map(nm).join(', ')}.`);
};

HS.closeRebuild=function(restore=true){
  if(!RB.active){ HS.layers.end('rebuild',restore); return; }
  RB.active=false;
  const c=$('#rbCard'); if(c) c.remove();
  RB.cands.forEach(k=>$('#o-'+k).classList.remove('cand','pick','good','miss'));
  HS.setTime(E.tIdx);
  HS.layers.end('rebuild',restore);
  if(restore&&E.route) HS.enterPathway(E.route,false);
};

function render(){
  const box=$('#rbCard'); if(!box) return; const R=RB.R;
  let h=`<div class="k">Advanced · Rebuild the route</div>`;
  if(RB.stage==='order'){
    h+=`<h5>Tap the organs in the order the signal travels</h5><p>${R.distractors.length} of these don’t belong. Tap a numbered organ again to undo from there.</p>
     <div class="opts" role="group" aria-label="Candidates">${RB.cands.map(k=>{ const i=RB.picks.indexOf(k); return `<button class="opt" data-rb="${k}" aria-pressed="${i>=0}">${i>=0?`<span class="ord" aria-hidden="true">${i+1}</span>`:''}${nm(k)}</button>`; }).join('')}</div>
     <div class="acts"><button class="btn t" data-act="undo" ${RB.picks.length?'':'disabled'}>Undo</button><span><button class="btn t" data-act="close">Close</button> <button class="btn p" data-act="checkOrder" ${RB.picks.length===R.chain.length?'':'disabled'}>Check order</button></span></div>`;
  } else {
    const chain=RB.chain, result=RB.stage==='result';
    h+=`<h5>${result?'Your rebuilt route':'Now name the signal on each link'}</h5>${RB.orderMsg}<div class="rblinks">${chain.slice(0,-1).map((a,i)=>`<div class="rblink"><div class="rbpair">${nm(a)} <span aria-hidden="true">→</span> ${nm(chain[i+1])}</div><div class="opts" role="radiogroup" aria-label="Signal from ${nm(a)} to ${nm(chain[i+1])}">${RB.pool.map(s=>{ const on=RB.names[i]===s, mark=result?(s===R.links[i]?' right':on?' wrongpick':''):''; return `<button class="opt sm${on?' on':''}${mark}" role="radio" aria-checked="${on}" data-link="${i}" data-sig="${s}" ${result?'disabled':''}>${s}</button>`; }).join('')}</div></div>`).join('')}</div>`;
    if(!result) h+=`<div class="acts"><button class="btn t" data-act="close">Close</button><button class="btn p" data-act="checkNames" ${RB.names.filter(Boolean).length===chain.length-1?'':'disabled'}>Check names</button></div>`;
    else h+=`${RB.nameMsg}<div class="rec">Recorded as practice.</div><div class="acts"><button class="btn t" data-act="close">Close</button><button class="btn p" data-act="watch">Watch the true route</button></div>`;
  }
  box.innerHTML=h;
}
function sync(){
  RB.cands.forEach(k=>$('#o-'+k).classList.toggle('pick',RB.picks.includes(k)));
  render(); HS.renderOverlay();
  HS.say(RB.picks.length?`Order so far: ${RB.picks.map(nm).join(', ')}.`:'Nothing picked yet.');
}
HS.rebuildPick=function(k){
  if(!RB.active||RB.stage!=='order'||!RB.cands.includes(k)) return;
  const i=RB.picks.indexOf(k);
  if(i>=0) RB.picks.splice(i); else if(RB.picks.length<RB.R.chain.length) RB.picks.push(k);
  sync();
};
function checkOrder(){
  const R=RB.R, picks=RB.picks, exp=R.chain;
  const okAt=i=>picks[i]===exp[i]||!!(R.alt&&R.alt[i]&&R.alt[i].includes(picks[i]));
  const ok=picks.every((k,i)=>okAt(i));
  if(ok) RB.orderMsg=`<div class="res good"><b>That’s the order.</b>${picks.map(nm).join(' → ')}.</div>`;
  else {
    const i=picks.findIndex((k,j)=>!okAt(j)), got=picks[i];
    const why=R.distractors.includes(got)?`${nm(got)} isn’t part of this route.`:i===0?`The route starts at ${nm(exp[0])}, not ${nm(got)}.`:`After ${nm(exp[i-1])} comes ${nm(exp[i])}, not ${nm(got)}.`;
    RB.orderMsg=`<div class="res warm"><b>Not quite.</b>${why} The order is ${exp.map(nm).join(' → ')}.</div>`;
  }
  RB.orderOk=ok; RB.chain=ok?picks.slice():exp.slice(); RB.picks=RB.chain.slice(); RB.stage='names';
  RB.cands.forEach(k=>{ const g=$('#o-'+k); g.classList.remove('cand','pick'); if(RB.chain.includes(k)) g.classList.add('good'); else if(!ok&&picks.includes(k)) g.classList.add('miss'); });
  render(); HS.renderOverlay(); HS.say(HS.strip(RB.orderMsg)+' Now name the signal on each link.');
  const f=$('#rbCard [data-link]'); if(f) f.focus();
}
function checkNames(){
  const R=RB.R, chain=RB.chain, wrong=RB.names.map((s,i)=>s===R.links[i]?-1:i).filter(i=>i>=0);
  RB.namesOk=!wrong.length;
  RB.nameMsg=RB.namesOk?`<div class="res good"><b>All named.</b>Each link carries the right signal.</div>`
    :`<div class="res warm"><b>${wrong.length===chain.length-1?'Not quite.':'Nearly.'}</b>${wrong.map(i=>`${cap(R.links[i])}, not ${RB.names[i]}, carries the message from ${nm(chain[i])} to ${nm(chain[i+1])}.`).join(' ')}</div>`;
  RB.stage='result';
  HS.recordAttempt({scene:E.sceneId,path:E.route,type:'rebuild',correct:RB.orderOk&&RB.namesOk,orderOk:RB.orderOk,namesOk:RB.namesOk});
  render(); HS.say(HS.strip(RB.nameMsg)+' Recorded as practice.');
  const w=$('#rbCard [data-act="watch"]'); if(w) w.focus();
}
HS.rebuildMarkers=()=>RB.picks.map((k,i)=>({id:'rb'+i+k,num:i+1,anchor:HS.wc(k),dx:-26,dy:-20,cls:'rb'+(RB.stage!=='order'?' v':''),aria:`${i+1}: ${nm(k)}${RB.stage==='order'?', select to undo from here':''}`,onClick:()=>{ if(RB.stage==='order'){ RB.picks.splice(i); sync(); } }}));

$('#cards').addEventListener('click',e=>{
  if(!RB.active) return; const b=e.target.closest('#rbCard button'); if(!b||b.disabled) return;
  if(b.dataset.rb){ HS.rebuildPick(b.dataset.rb); const f=$(`#rbCard [data-rb="${b.dataset.rb}"]`); if(f) f.focus(); }
  else if(b.dataset.link!==undefined){ RB.names[+b.dataset.link]=b.dataset.sig; render(); const f=$(`#rbCard [data-link="${b.dataset.link}"][data-sig="${b.dataset.sig}"]`); if(f) f.focus(); }
  else if(b.dataset.act==='undo'){ RB.picks.pop(); sync(); const f=$('#rbCard [data-act="undo"]:not([disabled])')||$('#rbCard [data-rb]'); if(f) f.focus(); }
  else if(b.dataset.act==='close') HS.closeRebuild(true);
  else if(b.dataset.act==='checkOrder') checkOrder();
  else if(b.dataset.act==='checkNames') checkNames();
  else if(b.dataset.act==='watch'){ HS.closeRebuild(false); HS.enterPathway(E.route,true); }
});
})(window.HS);
