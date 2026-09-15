/* Scene engine: trigger → pathway → numbered hotspots, ▶ Play, time ribbon, whole-body signs,
   gated feedback with Try it?, one What if?, and the cell inset. Everything scene-specific comes from HS.scenes[id]. */
(function(HS){
const $=HS.$, app=HS.app;
const E=HS.E={scene:null,sceneId:null,state:'idle',route:null,cur:-1,playing:false,tIdx:0,tryMode:false,picks:new Set(),cellOpen:false,tryCtx:{exposed:false,why:false},whatIf:null};
const visited={}, revealed={};
const P=HS.pathway=()=>E.scene&&E.route?E.scene.pathways[E.route]:null;
const key=(r=E.route)=>E.sceneId+':'+r;
const vis=HS.visitedOf=(r=E.route)=>visited[key(r)]||(visited[key(r)]=new Set());
const isRevealed=HS.isRevealed=(r=E.route)=>!!revealed[key(r)];
const TL=()=>{ const p=P(); return (p&&p.time)||E.scene.time; };   // a pathway may carry its own ribbon
const lastT=()=>TL().length-1;
const signOn=sg=>sg.on.includes(E.tIdx)&&(!sg.paths||sg.paths.includes(E.route));

/* ---------- scenes & triggers ---------- */
function loadScene(id){
  if(E.sceneId===id) return;
  if(E.sceneId) leave(false);
  const S=HS.scenes[id]; E.scene=S; E.sceneId=id; $('#tips').innerHTML='';
  Object.assign(HS.REG,S.regions||{});
  HS.buildRoutes(S.routes); HS.buildSigns(S.signs); E.timeRef=null; renderToggle();
}
function trigger(id){
  loadScene(id); if(E.state==='triggered') return;
  const S=E.scene; E.state='triggered'; HS.syncTriggers(); HS.clearTip('start');
  const cap=$('#caption'); cap.innerHTML=`<b>${S.trigger.title}</b><span>${S.trigger.caption}</span>`; cap.classList.remove('fade'); void cap.offsetWidth; cap.classList.add('fade');
  HS.light.lit=new Set(S.trigger.lights); HS.applyOrgs(); HS.say(`${S.trigger.title}. ${S.trigger.caption}.`);
  HS.setAtmos(S.trigger.atmosphere);
  const at=HS.wc(S.trigger.lights[0]); HS.ripple(at,'#8FDCFF',{dur:1500,r0:18,r1:120,w:1.5}); setTimeout(()=>HS.ripple(at,'#8FDCFF',{dur:1500,r0:18,r1:120,w:1}),260);
}
HS.clickTrigger=async function(id){
  if(!HS.scenes[id]){ HS.toast('That trigger uses the same scene template. It is not built in this concept.'); return; }
  const first=!(E.sceneId===id&&E.state==='triggered'); trigger(id);
  if(first){ await HS.sleep(HS.RM()?0:900); if(E.sceneId!==id||E.route) return; setTime(0); enterPathway(E.scene.trigger.first,!!E.scene.trigger.autoplay); }
};
HS.openPathway=function(sceneId,r,playNow){ trigger(sceneId); enterPathway(r,playNow); };
function leave(cam){
  stopPlay(); closeTry(); closeCell(); restoreWhatIf(false);
  E.state='idle'; E.route=null; E.cur=-1; HS.syncTriggers();
  $('#bottom').classList.add('hidden'); $('#caption').innerHTML='';
  Object.keys(HS.rstate).forEach(id=>HS.setRoute(id,'hide'));
  HS.light.lit=new Set(); HS.light.dim=null; HS.applyOrgs();
  setTime(0); applySigns(); E.timeRef=null; HS.setLayer('nervous',false); HS.closeRead(false); HS.setAtmos(null);
  if(cam) HS.camTo('body',700);
}
HS.leave=()=>leave(true);

/* ---------- time ribbon ---------- */
function buildRibbon(){
  const T=TL(), n=T.length-1; E.timeRef=T;
  $('#rbWays').innerHTML=T.map((t,i)=>`<button class="rb-way" style="left:${i/n*100}%" aria-label="Go to ${t.w}" tabindex="-1" data-t="${i}"></button>`).join('');
  $('#rbWords').innerHTML=T.map((t,i)=>`<span style="left:${i/n*100}%">${t.w}</span>`).join('');
  $('#rbHandle').setAttribute('aria-valuemax',n);
}
function setTime(i,user){
  if(!E.scene||!TL()) return;
  const T=TL(), last=lastT(), p=P();
  if(i===last && E.whatIf){ i=last-1; if(user) HS.toast(p.whatIf.holdToast); }
  if(i===last && p && p.gate && !isRevealed()){ i=last-1; if(user) HS.toast(p.gate.calmBlocked); }
  E.tIdx=i;
  const pct=i/last*100; $('#rbFill').style.width=pct+'%'; $('#rbHandle').style.left=pct+'%';
  $('#rbHandle').setAttribute('aria-valuenow',i); $('#rbHandle').setAttribute('aria-valuetext',T[i].w+'. '+HS.strip(T[i].c));
  document.querySelectorAll('.rb-words span').forEach((s,k)=>s.classList.toggle('on',k===i));
  document.querySelectorAll('.rb-way').forEach((s,k)=>s.classList.toggle('on',k<=i));
  $('#rbCap').innerHTML=T[i].c;
  (T[i].show||[]).forEach(id=>HS.setRoute(id,'on'));
  applySigns(); HS.renderOverlay();
  if(user) HS.say(HS.strip(T[i].c));
}
HS.setTime=setTime;
(function bindRibbon(){
  const track=$('#rbTrack'), h=$('#rbHandle'); let dragging=false;
  const idxAt=x=>{ const r=track.getBoundingClientRect(); return Math.round(Math.max(0,Math.min(1,(x-r.left)/r.width))*lastT()); };
  h.addEventListener('pointerdown',e=>{ dragging=true; h.setPointerCapture(e.pointerId); stopPlay(); });
  h.addEventListener('pointermove',e=>{ if(dragging){ const i=idxAt(e.clientX); if(i!==E.tIdx) setTime(i,true); } });
  h.addEventListener('pointerup',()=>{ dragging=false; });
  $('#rbWays').addEventListener('click',e=>{ const b=e.target.closest('[data-t]'); if(b){ stopPlay(); setTime(+b.dataset.t,true); } });
  h.addEventListener('keydown',e=>{ if(e.key==='ArrowRight'||e.key==='ArrowUp'){ e.preventDefault(); stopPlay(); setTime(Math.min(lastT(),E.tIdx+1),true); } if(e.key==='ArrowLeft'||e.key==='ArrowDown'){ e.preventDefault(); stopPlay(); setTime(Math.max(0,E.tIdx-1),true); } });
})();
function applySigns(){ if(!E.scene) return; const active=E.state==='triggered'; E.scene.signs.forEach(sg=>HS.setSign(sg,active&&signOn(sg),E.tIdx)); }

/* ---------- what the overlay shows ---------- */
HS.getLabels=function(){
  const L=HS.level(), out=[];
  if(E.state!=='triggered'||!E.route){
    const n=HS.selectedNode&&HS.NODE[HS.selectedNode];
    if(n&&n.organs&&!n.children) n.organs.forEach((k,i)=>out.push({key:'sel-'+k,org:k,text:HS.orgName(k),anchor:HS.wc(k),dx:i%2?-36:36,dy:-18,info:k}));
    return out;
  }
  const S=E.scene, p=P(), T=E.tIdx;
  if(E.whatIf==='outcome') p.whatIf.badges.forEach((b,i)=>out.push({key:'wi-'+i,text:b.text,cls:'badge',anchor:HS.wc(b.org),dx:b.dx,dy:b.dy}));
  if(E.whatIf){ const b=p.whatIf.blockLabel; out.push({key:'wi-block',text:b.text,cls:'badge',anchor:HS.ptOn(b.route,b.t),dx:b.dx,dy:b.dy,noLeader:true}); }
  if(E.cur>=0){ const h=p.hots[E.cur]; out.push({key:'one',org:h.org,text:h.one,cls:'one',anchor:HS.wc(h.org),dx:h.ldx,dy:h.ldy,info:h.org,cell:L!=='body'&&h.cell}); }
  HS.lodLabels(L).forEach(l=>out.push(l));
  const pr=HS.pulse.on&&S.routes[HS.pulse.route];
  if(pr&&pr.label) out.push({key:'rl-'+HS.pulse.route,text:pr.label,cls:'sig',anchor:HS.ptOn(HS.pulse.route,pr.at),dx:pr.dx,dy:pr.dy,noLeader:true});
  else if(L!=='body'){ p.draw.concat(p.gate&&isRevealed()?p.gate.labelRoutes:[]).forEach(id=>{ const r=S.routes[id]; if(HS.rstate[id]==='on'&&r.label) out.push({key:'rl-'+id,text:r.label,cls:'sig',anchor:HS.ptOn(id,r.at),dx:r.dx,dy:r.dy,noLeader:true}); }); }
  if(L==='body'){
    const has=k=>out.some(o=>o.org===k);
    S.signs.forEach(sg=>{ const lab=sg.label; if(!lab||!signOn(sg)) return; if(lab.org&&!lab.always&&has(lab.org)) return;
      out.push({key:'s-'+sg.id,org:lab.org,text:typeof lab.text==='function'?lab.text(T):lab.text,anchor:lab.anchor||HS.wc(lab.org),dx:lab.dx,dy:lab.dy,info:lab.info}); });
  }
  p.hots.forEach((h,i)=>{ if(i===E.cur||out.some(o=>o.org===h.org)) return; out.push({key:'h-'+h.org,org:h.org,text:h.lab[L],cls:L==='organ'?'sig':'',anchor:HS.wc(h.org),dx:h.ldx,dy:h.ldy,info:h.org,cell:L==='structure'&&h.cell}); });
  return out.slice(0,8);
};
HS.getHotspots=function(){
  if(E.state!=='triggered'||!E.route) return [];
  const p=P(), v=vis();
  const hs=p.hots.map((h,i)=>({id:E.sceneId+E.route+i,num:h.num,anchor:HS.wc(h.org),dx:h.dx,dy:h.dy,cls:(v.has(i)?'v ':'')+(i===E.cur?'cur':''),
    aria:E.tryMode?`Select ${HS.orgName(h.org)} as an answer${E.picks.has(h.org)?', selected':''}`:`Step ${h.num} of ${p.hots.length}: ${h.one}${v.has(i)?', visited':''}`,
    onClick:()=>{ if(E.tryMode){ togglePick(h.org); HS.renderOverlay(); } else goHot(i,true); }}));
  if(p.gate&&!E.whatIf){ const g=p.gate; hs.push({id:'q',num:'?',anchor:HS.ptOn(g.at[0],g.at[1]),cls:'q'+(isRevealed()?' v':''),aria:isRevealed()?g.ariaRevealed:g.aria,onClick:openTry}); }
  return hs;
};
HS.getMarks=()=>{ const p=P(); return E.whatIf&&p?p.whatIf.blocks:[]; };
HS.info=k=>(E.scene&&E.scene.info[k])||HS.baseInfo(k);

/* ---------- pathway bar ---------- */
function renderToggle(){
  const opts=E.scene.toggle?E.scene.toggle.options:[];
  $('#seg').innerHTML=opts.map(([r,l])=>`<button data-route="${r}" aria-pressed="false">${l}</button>`).join('');
  $('#seg').setAttribute('aria-label',E.scene.toggle?E.scene.toggle.label:'Route'); $('#seg').hidden=opts.length<2;
}
$('#seg').addEventListener('click',e=>{ const b=e.target.closest('[data-route]'); if(!b) return; const p=P(); if(p&&p.afterPlay&&p.afterPlay.tip) HS.clearTip(p.afterPlay.tip.key); enterPathway(b.dataset.route,false); });
function renderDots(){
  const p=P(), v=vis();
  let h=p.hots.map((x,i)=>`<button class="hdot${v.has(i)?' v':''}" data-h="${i}" aria-label="Go to step ${x.num}: ${x.one}">${x.num}</button>`).join('');
  if(p.gate) h+=`<button class="hdot q${isRevealed()?' v':''}" data-q="1" aria-label="${p.gate.dotAria}">?</button>`;
  $('#dots').innerHTML=h;
  const done=v.size===p.hots.length&&(!p.gate||isRevealed());
  $('#timeChip').textContent=done?'Route explored':p.chip; $('#timeChip').classList.toggle('done',done);
  const w=$('#bWhat'); w.hidden=!(p.whatIf&&(!p.gate||isRevealed())); if(p.whatIf) w.setAttribute('aria-label',p.whatIf.q);
}
$('#dots').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; if(b.dataset.q) openTry(); else goHot(+b.dataset.h,true); });
function setPlayUI(){
  const p=P(); if(!p) return;
  $('#playTxt').textContent=E.playing?'Pause':(HS.RM()?'Next step':(E.cur>=p.hots.length-1&&vis().size?'Play again':'Play pathway'));
  $('#playIcon').innerHTML=E.playing?'<path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/>':'<path d="M7 5l12 7-12 7z" fill="currentColor"/>';
}
HS.setPlayUI=setPlayUI;

async function enterPathway(r,autoplay){
  const S=E.scene; stopPlay(); closeTry(); closeCell(); restoreWhatIf(false);
  E.route=r; E.cur=-1; const p=S.pathways[r];
  if(E.timeRef!==TL()){ buildRibbon(); setTime(0); }
  if(p.minTime&&E.tIdx<p.minTime) setTime(p.minTime);
  $('#pName').textContent=p.name; $('#timeChip').textContent=p.chip;
  document.querySelectorAll('#seg [data-route]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.route===r));
  $('#bottom').classList.remove('hidden');
  HS.setLayer('nervous',p.layer==='nervous');
  const was={...HS.rstate};
  Object.keys(S.routes).forEach(id=>HS.setRoute(id,'hide'));
  Object.entries(S.pathways).forEach(([k,q])=>q.draw.forEach(id=>{ if(k===r){ HS.rstate[id]=was[id]; HS.setRoute(id,'on',{draw:true}); } else HS.setRoute(id,'faint'); }));
  if(p.gate) p.gate.routes.forEach(id=>HS.setRoute(id,isRevealed()?'on':'ghost'));
  HS.light.dim=new Set(p.organs); HS.light.lit=new Set(p.organs); HS.applyOrgs();
  HS.selectNode(p.node); renderDots(); setPlayUI(); HS.renderOverlay();
  await HS.camTo(p.region,700);
  if(p.enterTip) HS.tip(p.enterTip.key,p.enterTip.text,p.enterTip.pos);
  if(autoplay) play();
}
HS.enterPathway=enterPathway;
function stopPlay(){ if(E.playing){ E.playing=false; HS.cancelTravel(); setPlayUI(); } }
HS.stopPlay=stopPlay;
async function goHot(i,user){
  const p=P(), h=p.hots[i]; if(user){ stopPlay(); closeTry(); }
  E.cur=i; vis().add(i); renderDots();
  if(E.tIdx<h.t) setTime(h.t);
  HS.say(`Step ${h.num}: ${h.one}`);
  if(user){ await HS.camTo(h.region,650); if(h.seg) await HS.travel(h.seg,900); }
  HS.renderOverlay(); setPlayUI();
}
HS.goHot=goHot;
async function play(){
  const p=P(); if(!p) return;
  if(E.playing){ stopPlay(); return; }
  closeTry(); closeCell(); if(p.enterTip) HS.clearTip(p.enterTip.key);
  if(HS.RM()){ const next=E.cur+1<p.hots.length?E.cur+1:0; if(next===0&&E.cur>=0) vis().clear(); await HS.camTo(p.region,0); goHot(next,false); if(next===p.hots.length-1) afterPlay(); return; }
  E.playing=true; setPlayUI();
  const start=(E.cur>=p.hots.length-1||E.cur<0)?0:E.cur+1;
  await HS.camTo(p.region,600);
  for(let i=start;i<p.hots.length;i++){
    if(!E.playing) return;
    const h=p.hots[i];
    if(h.seg){ const ok=await HS.travel(h.seg,p.segDur||1000); if(!ok||!E.playing) return; }
    goHot(i,false);
    await HS.sleep(900); if(!E.playing) return;
  }
  E.playing=false; setPlayUI(); afterPlay();
}
HS.play=play;
function afterPlay(){
  const a=P().afterPlay; if(!a) return;
  if(a.whenHidden&&isRevealed()) return;
  if(a.time!=null) setTime(a.time);
  if(a.tip) HS.tip(a.tip.key,a.tip.text,a.tip.pos);
}

/* ---------- Try it? ---------- */
function openTry(){
  const p=P(); if(!p||!p.gate||E.tryMode||E.whatIf) return; const g=p.gate, tr=g.try;
  stopPlay(); HS.closeCards(); HS.clearTip(g.tipKey); E.tryMode=true; E.picks.clear(); E.tryCtx={exposed:isRevealed(),why:false};
  HS.camTo(tr.region||p.region,600);
  tr.candidates.forEach(k=>$('#o-'+k).classList.add('cand'));
  HS.light.dim=new Set(tr.candidates); HS.applyOrgs();
  const box=document.createElement('div'); box.className='try float'; box.id='tryCard'; box.setAttribute('role','dialog'); box.setAttribute('aria-label','Try it');
  box.style.left=Math.min(app.clientWidth-500,Math.max(340,app.clientWidth*.56))+'px'; box.style.top='110px';
  box.innerHTML=`<div class="k">Try it? <button class="why" id="tryWhy">ⓘ Why?</button></div><h5>${tr.q}</h5><p>${tr.hint}</p><div id="tryWhyTxt"></div><div class="picks" id="tryPicks">Nothing selected yet</div><div id="tryRes"></div><div class="acts"><button class="btn t" id="tryShow">Show me</button><span><button class="btn t" id="tryClose">Close</button> <button class="btn p" id="tryCheck" disabled>Check</button></span></div>`;
  $('#cards').appendChild(box);
  $('#tryWhy').onclick=()=>{ if($('#tryCheck')) E.tryCtx.why=true; $('#tryWhyTxt').innerHTML=`<div class="whytxt">${tr.why}</div>`; $('#tryWhy').remove(); };
  $('#tryShow').onclick=()=>checkTry(true); $('#tryClose').onclick=closeTry; $('#tryCheck').onclick=()=>checkTry(false);
  $('#tryCheck').focus();
  HS.say(`Try it. ${tr.q} Candidates: ${tr.candidates.map(HS.orgName).join(', ')}. Use the hotspot numbers or click organs.`);
}
HS.openTry=openTry;
function togglePick(k){
  const tr=P().gate.try;
  if(!tr.candidates.includes(k)||!$('#tryCheck')||$('#tryCheck').dataset.done) return;
  E.picks.has(k)?E.picks.delete(k):E.picks.add(k); $('#o-'+k).classList.toggle('pick',E.picks.has(k));
  $('#tryPicks').innerHTML=E.picks.size?'Selected: <b>'+[...E.picks].map(HS.orgName).join(', ')+'</b>':'Nothing selected yet';
  $('#tryCheck').disabled=!E.picks.size;
}
async function checkTry(show){
  const p=P(), g=p.gate, tr=g.try, right=new Set(tr.answer), picks=[...E.picks];
  const all=picks.length===right.size&&picks.every(x=>right.has(x)), wrong=picks.some(x=>!right.has(x));
  const fb=show?{tone:'good',head:'Here’s what happens.',txt:tr.correct}:tr.feedback({all,wrong,picks:E.picks,right});
  tr.candidates.forEach(k=>{ const el=$('#o-'+k); el.classList.remove('cand','pick'); if(right.has(k)) el.classList.add('good'); else if(E.picks.has(k)&&!show) el.classList.add('miss'); });
  const rec=show?'Not recorded as an attempt: you chose Show me.':E.tryCtx.exposed?'Recorded as practice, because the answer had already been shown.':E.tryCtx.why?'Recorded as an assisted attempt, because Why? was opened first.':'Recorded as your first unassisted attempt.';
  $('#tryRes').innerHTML=`<div class="res ${fb.tone}"><b>${fb.head}</b>${fb.txt}</div><div class="rec">${rec}</div>`;
  if($('#tryCheck')) $('#tryCheck').dataset.done=1;
  $('#tryCard .acts').innerHTML=`<span></span><button class="btn p" id="tryCalm">${g.calmButton}</button>`;
  $('#tryCalm').onclick=()=>{ closeTry(); setTime(lastT(),true); HS.camTo('body',700); if(g.afterTip) setTimeout(()=>HS.tip(g.afterTip.key,g.afterTip.text,g.afterTip.pos),900); }; $('#tryCalm').focus();
  HS.say(fb.head+' '+fb.txt);
  revealed[key()]=true; g.routes.forEach(id=>HS.setRoute(id,'on',{draw:true})); renderDots(); HS.renderOverlay();
  await HS.sleep(HS.RM()?0:650);
  for(const id of g.routes){ if(!isRevealed()||E.whatIf) break; await HS.travel(id,1100); }
}
function closeTry(){
  if(!E.tryMode) return; E.tryMode=false; const c=$('#tryCard'); if(c) c.remove();
  const p=P(); p.gate.try.candidates.forEach(k=>$('#o-'+k).classList.remove('cand','pick','good','miss'));
  HS.light.dim=new Set(p.organs); HS.applyOrgs();
}
HS.closeTry=closeTry;

/* ---------- cell inset ---------- */
function openCell(key){
  const C=E.scene&&E.scene.cells&&E.scene.cells[key]; if(E.cellOpen||!C) return; E.cellOpen=true; HS.closeCards();
  const d=document.createElement('div'); d.className='inset float'; d.id='cellInset'; d.setAttribute('role','dialog'); d.setAttribute('aria-label',C.aria);
  d.style.right='150px'; d.style.top='96px';
  d.innerHTML=`<header><div><b>${C.title}</b><small>${C.sub}</small></div><button class="btn t" id="cellX" aria-label="Close cell view">×</button></header><svg viewBox="0 0 376 214" aria-hidden="true">${C.svg}</svg><ol>${C.steps.map(s=>`<li>${s}</li>`).join('')}</ol>`;
  app.appendChild(d); $('#cellX').onclick=closeCell; $('#cellX').focus();
  $('#lvlChip').innerHTML='Cell · <b>mechanism</b>';
  HS.say(C.say);
  const mol=d.querySelector('#cellMol'), path=d.querySelector('#cellPath');
  const put=(x,y)=>{ mol.setAttribute('cx',x); mol.setAttribute('cy',y); mol.nextElementSibling.setAttribute('x',x); mol.nextElementSibling.setAttribute('y',y+3.5); };
  if(!mol||!path) return;
  if(HS.RM()){ put(C.end[0],C.end[1]); return; }
  const L=path.getTotalLength(), t0=performance.now();
  const f=now=>{ if(!E.cellOpen) return; const k=Math.min(1,(now-t0)/2600), pt=path.getPointAtLength(L*(k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2)); put(pt.x,pt.y); if(k<1) requestAnimationFrame(f); };
  requestAnimationFrame(f);
}
function closeCell(){ if(!E.cellOpen) return; E.cellOpen=false; const d=$('#cellInset'); if(d) d.remove(); HS.resetLevel(); HS.updateView(); }
HS.openCell=openCell; HS.closeCell=closeCell;

/* ---------- What if? ---------- */
function openWhatIf(){
  const p=P(); if(!p||!p.whatIf||E.whatIf||(p.gate&&!isRevealed())) return; const w=p.whatIf;
  stopPlay(); closeTry(); closeCell(); HS.closeCards(); E.whatIf='predict';
  $('#thought').hidden=false; (w.fade||[]).forEach(id=>HS.setRoute(id,'faint'));
  HS.camTo(w.region||p.region,600);
  const box=document.createElement('div'); box.className='try float'; box.id='wiCard'; box.setAttribute('role','dialog'); box.setAttribute('aria-label','What if?');
  box.style.left=Math.min(app.clientWidth-500,Math.max(340,app.clientWidth*.56))+'px'; box.style.top='120px';
  box.innerHTML=`<div class="k">What if?</div><h5>${w.q}</h5><p>${w.p}</p><div class="opts" role="radiogroup" aria-label="Your prediction">${w.options.map(o=>`<button class="opt" role="radio" aria-checked="false" data-o="${o[0]}">${o[1]}</button>`).join('')}</div><div id="wiRes"></div><div class="acts"><button class="btn t" id="wiRestore">Restore</button><button class="btn p" id="wiGo" disabled>See what happens</button></div>`;
  $('#cards').appendChild(box);
  box.querySelector('.opts').addEventListener('click',e=>{ const b=e.target.closest('.opt'); if(!b||b.disabled) return; box.querySelectorAll('.opt').forEach(o=>o.setAttribute('aria-checked',o===b)); $('#wiGo').disabled=false; });
  $('#wiGo').onclick=()=>runWhatIf(box.querySelector('.opt[aria-checked="true"]').dataset.o);
  $('#wiRestore').onclick=()=>restoreWhatIf(true);
  box.querySelector('.opt').focus();
  HS.renderOverlay(); HS.say(`Thought experiment, simplified. ${w.q} ${w.p}`);
}
async function runWhatIf(o){
  const w=P().whatIf; E.whatIf='outcome';
  const good=o===w.correct, extra=(w.extra||{})[o]||'';
  $('#wiRes').innerHTML=`<div class="res ${good?'good':'warm'}"><b>${good?'That’s it.':'Not quite.'}</b>${w.outcome}${extra}</div><div class="rec">A thought experiment, not a real patient, a disease or a treatment.</div>`;
  $('#wiCard').querySelectorAll('.opt').forEach(b=>b.disabled=true);
  $('#wiCard .acts').innerHTML='<span></span><button class="btn p" id="wiRestore">Restore</button>';
  $('#wiRestore').onclick=()=>restoreWhatIf(true); $('#wiRestore').focus();
  if(w.holdTime!=null) setTime(w.holdTime);
  HS.renderOverlay(); HS.say((good?'That’s it. ':'Not quite. ')+w.outcome+extra);
  if(!HS.RM()) for(const id of w.replay||[]){ if(!E.whatIf) break; await HS.travel(id,900); }
}
function restoreWhatIf(focus){
  if(!E.whatIf) return; const p=P(); E.whatIf=null; $('#thought').hidden=true;
  const c=$('#wiCard'); if(c) c.remove();
  if(p) (p.whatIf.fade||[]).forEach(id=>{ if(p.draw.includes(id)) HS.setRoute(id,'on'); });
  if(p&&p.gate&&isRevealed()) p.gate.routes.forEach(id=>HS.setRoute(id,'on',{draw:true}));
  HS.renderOverlay(); if(focus){ $('#bWhat').focus(); HS.say('Restored the normal pathway.'); }
}
HS.openWhatIf=openWhatIf; HS.restoreWhatIf=restoreWhatIf;

/* ---------- body & tree ---------- */
HS.onOrgClick=function(k){
  if(E.tryMode){ togglePick(k); return; }
  const p=P();
  if(p){ const i=p.hots.findIndex(h=>h.org===k); if(i>=0){ goHot(i,true); return; } }
  const reg=(p&&p.orgRegions&&p.orgRegions[k])||(HS.ORGS[k]||HS.INSET[k]||{}).region;
  if(reg) HS.camTo(reg,650);
  if(E.state!=='triggered'){ HS.light.lit=new Set([k]); HS.applyOrgs(); }
};
HS.onSignalSelect=function(n){ HS.light.lit=new Set(n.organs); HS.applyOrgs(); HS.renderOverlay(); };
})(window.HS);
