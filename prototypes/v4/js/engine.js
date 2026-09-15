/* Scene engine: trigger → pathway → numbered hotspots, ▶ Play, time ribbon, whole-body signs,
   gated feedback with Try it?, one What if?, and the cell inset. Everything scene-specific comes from HS.scenes[id]. */
(function(HS){
const $=HS.$, app=HS.app;
const E=HS.E={scene:null,sceneId:null,state:'idle',route:null,cur:-1,playing:false,tIdx:0,tryMode:false,picks:new Set(),cellOpen:false,tryCtx:{exposed:false,why:false},whatIf:null,landed:new Set(),gate:true,playingAll:false,reflectOpen:false};
const visited={}, revealed={};
const P=HS.pathway=()=>E.scene&&E.route?E.scene.pathways[E.route]:null;
const key=(r=E.route)=>E.sceneId+':'+r;
const vis=HS.visitedOf=(r=E.route)=>visited[key(r)]||(visited[key(r)]=new Set());
const isRevealed=HS.isRevealed=(r=E.route)=>!!revealed[key(r)];
HS.progressOf=(sc,pa)=>({visited:(visited[sc+':'+pa]||new Set()).size,revealed:!!revealed[sc+':'+pa]});
HS.exportProgress=()=>({visited:Object.fromEntries(Object.entries(visited).map(([k,v])=>[k,[...v]])),revealed:{...revealed}});
HS.importProgress=d=>{ Object.keys(visited).forEach(k=>delete visited[k]); Object.keys(revealed).forEach(k=>delete revealed[k]); Object.entries(d.visited||{}).forEach(([k,v])=>{ visited[k]=new Set(v); }); Object.assign(revealed,d.revealed||{}); };
HS.markRevealed=(sc,pa)=>{ revealed[sc+':'+pa]=true; };
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
  const blue=()=>{ if(HS.RM()||E.sceneId!==S.id) return; const at=HS.wc(S.trigger.lights[0]); HS.ripple(at,'#8FDCFF',{dur:1500,r0:18,r1:120,w:1.5}); setTimeout(()=>{ if(!HS.RM()&&E.sceneId===S.id) HS.ripple(at,'#8FDCFF',{dur:1500,r0:18,r1:120,w:1}); },260); };
  const inc=S.trigger.incite;   // the inciting event enters at the body's edge and is noticed where it lands
  if(inc&&!HS.RM()){ const o=HS.wc(S.trigger.lights[0]), start=[o[0]+inc.from[0],o[1]+inc.from[1]];
    [0,.5,1].forEach((t,i)=>setTimeout(()=>{ if(E.sceneId!==S.id) return; const p=[start[0]+(o[0]-start[0])*t,start[1]+(o[1]-start[1])*t]; HS.ripple(p,inc.color,{dur:850,r0:8,r1:i===2?52:24,w:1.7}); }, i*160));
    setTimeout(blue,430);
  } else blue();
}
HS.clickTrigger=async function(id){
  if(!HS.scenes[id]){ HS.toast('That trigger uses the same scene template. It is not built in this concept.'); return; }
  const first=!(E.sceneId===id&&E.state==='triggered'); trigger(id);
  if(first){ await HS.sleep(HS.RM()?0:900); if(E.sceneId!==id||E.route) return; setTime(0); enterPathway(E.scene.trigger.first,!!E.scene.trigger.autoplay); }
};
HS.openPathway=function(sceneId,r,playNow){ trigger(sceneId); enterPathway(r,playNow); };
function leave(cam){
  if(HS.RB&&HS.RB.active) HS.closeRebuild(false);
  if(HS.CMP&&HS.CMP.active) HS.closeCompare(false);
  stopPlay(); closeTry(); closeCell(); restoreWhatIf(false);
  E.state='idle'; E.route=null; E.cur=-1; HS.syncTriggers();
  $('#bottom').classList.add('hidden'); $('#caption').innerHTML='';
  Object.keys(HS.rstate).forEach(id=>HS.setRoute(id,'hide'));
  HS.light.lit=new Set(); HS.light.dim=null; HS.applyOrgs();
  setTime(0); applySigns(); E.timeRef=null; HS.setLayer('nervous',false); HS.closeRead(false); HS.setAtmos(null); HS.setNight(0);
  if(cam) HS.camTo('body',700);
  HS.renderContinue(); HS.syncHash();
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
  if(i===last && p && p.gate && p.gate.blocksEnd!==false && !isRevealed()){ i=last-1; if(user) HS.toast(p.gate.calmBlocked); }
  E.tIdx=i;
  if(user) E.gate=false;   // a manual ribbon scrub reveals the full felt picture for that time
  const pct=i/last*100; $('#rbFill').style.width=pct+'%'; $('#rbHandle').style.left=pct+'%';
  $('#rbHandle').setAttribute('aria-valuenow',i); $('#rbHandle').setAttribute('aria-valuetext',T[i].w+'. '+HS.strip(T[i].c));
  document.querySelectorAll('.rb-words span').forEach((s,k)=>s.classList.toggle('on',k===i));
  document.querySelectorAll('.rb-way').forEach((s,k)=>s.classList.toggle('on',k<=i));
  $('#rbCap').innerHTML=T[i].c;
  if(E.state==='triggered'&&!E.whatIf){ if(T[i].atmos) HS.setAtmos(T[i].atmos); if(T[i].vignette!=null) HS.setNight(T[i].vignette); }
  (T[i].show||[]).forEach(id=>HS.setRoute(id,'on'));
  applySigns(); HS.renderOverlay();
  if(user) HS.say(HS.strip(T[i].c));
  HS.syncHash();
}
HS.setTime=setTime;
(function bindRibbon(){
  const track=$('#rbTrack'), h=$('#rbHandle'); let dragging=false;
  const idxAt=x=>{ const r=track.getBoundingClientRect(); return Math.round(Math.max(0,Math.min(1,(x-r.left)/r.width))*lastT()); };
  h.addEventListener('pointerdown',e=>{ dragging=true; track.classList.add('drag'); h.setPointerCapture(e.pointerId); stopPlay(); });
  h.addEventListener('pointermove',e=>{ if(dragging){ const i=idxAt(e.clientX); if(i!==E.tIdx) setTime(i,true); } });
  h.addEventListener('pointerup',()=>{ dragging=false; track.classList.remove('drag'); });
  track.addEventListener('click',e=>{ if(e.target.closest('.rb-handle,[data-t]')) return; stopPlay(); setTime(idxAt(e.clientX),true); });   // click anywhere on the ribbon
  $('#rbWays').addEventListener('click',e=>{ const b=e.target.closest('[data-t]'); if(b){ stopPlay(); setTime(+b.dataset.t,true); } });
  h.addEventListener('keydown',e=>{ if(e.key==='ArrowRight'||e.key==='ArrowUp'){ e.preventDefault(); stopPlay(); setTime(Math.min(lastT(),E.tIdx+1),true); } if(e.key==='ArrowLeft'||e.key==='ArrowDown'){ e.preventDefault(); stopPlay(); setTime(Math.max(0,E.tIdx-1),true); } });
})();
function applySigns(){ if(!E.scene) return; const active=E.state==='triggered'&&!(HS.RB&&HS.RB.active)&&!(HS.CMP&&HS.CMP.active);   /* no sign gives away a Rebuild answer */ const p=P();
  E.scene.signs.forEach(sg=>{ const inRoute=sg.org&&p&&p.hots.some(h=>h.org===sg.org); const landed=!(E.gate&&inRoute)||E.landed.has(sg.org); HS.setSign(sg,active&&signOn(sg)&&landed,E.tIdx); }); }

/* ---------- what the overlay shows ---------- */
HS.getLabels=function(){
  const L=HS.level(), out=[];
  if(E.state!=='triggered'||!E.route){
    const n=HS.selectedNode&&HS.NODE[HS.selectedNode];
    if(n&&n.organs&&!n.children) n.organs.forEach((k,i)=>out.push({key:'sel-'+k,org:k,text:HS.orgName(k),anchor:HS.wc(k),dx:i%2?-36:36,dy:-18,info:k}));
    return out;
  }
  if(HS.RB&&HS.RB.active) return out;   // Rebuild the route: no hints on the body
  if(HS.CMP&&HS.CMP.active) return HS.compareLabels();
  const S=E.scene, p=P(), T=E.tIdx;
  if(E.whatIf==='outcome') p.whatIf.badges.forEach((b,i)=>out.push({key:'wi-'+i,text:b.text,cls:'badge',anchor:HS.wc(b.org),dx:b.dx,dy:b.dy}));
  if(E.whatIf){ const b=p.whatIf.blockLabel; out.push({key:'wi-block',text:b.text,cls:'badge',anchor:HS.ptOn(b.route,b.t),dx:b.dx,dy:b.dy,noLeader:true}); }
  if(E.cur>=0){ const h=p.hots[E.cur]; out.push({key:'one',org:h.org,text:HS.advLine(h)||h.one,cls:'one'+(HS.advLine(h)?' adv':''),anchor:HS.wc(h.org),dx:h.ldx,dy:h.ldy,info:h.org,cell:L!=='body'&&h.cell,lead:!E.tryMode&&!E.whatIf&&!E.playing&&h.leads}); }
  HS.lodLabels(L).forEach(l=>out.push(l));
  const pr=HS.pulse.on&&S.routes[HS.pulse.route];
  /* While a pulse is travelling, its route name is worth naming — but only if the current
     step's own label does not already name the same thing. During playback both used to show
     ("Hypothalamus releases CRH" AND "CRH · portal"), which is duplicate information paying
     twice for one label slot; that duplication is what pushed stress:slow to 9 labels, over
     the §10 ceiling of 8. Suppressing the redundant one removes repetition, not content. */
  const stepNames=(E.cur>=0&&p.hots[E.cur])?((HS.advLine(p.hots[E.cur])||p.hots[E.cur].one)||''):'';
  const routeFirst=t=>String(t||'').toLowerCase().split(/[·—-]/)[0].replace(/\s+/g,' ').trim();
  if(pr&&pr.label&&!(E.cur>=0&&stepNames.toLowerCase().includes(routeFirst(HS.routeText(HS.pulse.route)))))
    out.push({key:'rl-'+HS.pulse.route,text:HS.routeText(HS.pulse.route),cls:'sig',anchor:HS.ptOn(HS.pulse.route,pr.at),dx:pr.dx,dy:pr.dy,noLeader:true});
  else if(L!=='body'){ p.draw.concat(p.gate&&isRevealed()?p.gate.labelRoutes:[]).forEach(id=>{ const r=S.routes[id]; if(HS.rstate[id]==='on'&&r.label) out.push({key:'rl-'+id,text:HS.routeText(id),cls:'sig',anchor:HS.ptOn(id,r.at),dx:r.dx,dy:r.dy,noLeader:true}); }); }
  if(L==='body'){
    const has=k=>out.some(o=>o.org===k);
    S.signs.forEach(sg=>{ const lab=sg.label; if(!lab||!signOn(sg)) return; if(lab.org&&!lab.always&&has(lab.org)) return;
      out.push({key:'s-'+sg.id,org:lab.org,text:typeof lab.text==='function'?lab.text(T):lab.text,anchor:lab.anchor||HS.wc(lab.org),dx:lab.dx,dy:lab.dy,info:lab.info}); });
  }
  p.hots.forEach((h,i)=>{ if(i===E.cur||out.some(o=>o.org===h.org)) return; out.push({key:'h-'+h.org,org:h.org,text:h.lab[L],cls:L==='organ'?'sig':'',anchor:HS.wc(h.org),dx:h.ldx,dy:h.ldy,info:h.org,cell:L==='structure'&&h.cell}); });
  return out.slice(0,8);
};
HS.getHotspots=function(){
  if(HS.RB&&HS.RB.active) return HS.rebuildMarkers();
  if(HS.CMP&&HS.CMP.active) return [];
  if(E.state!=='triggered'||!E.route) return [];
  const p=P(), v=vis();
  const hs=p.hots.map((h,i)=>({id:E.sceneId+E.route+i,num:h.num,anchor:HS.wc(h.org),dx:h.dx,dy:h.dy,cls:(v.has(i)?'v ':'')+(i===E.cur?'cur':''),
    aria:E.tryMode?`Select ${HS.orgName(h.org)} as an answer${E.picks.has(h.org)?', selected':''}`:`Step ${h.num} of ${p.hots.length}: ${h.one}${v.has(i)?', visited':''}`,
    tip:E.tryMode?null:HS.advLine(h)||h.one, seg:h.seg, org:h.org,
    onClick:()=>{ if(E.tryMode){ togglePick(h.org); HS.renderOverlay(); } else goHot(i,true); }}));
  if(p.gate&&!E.whatIf){ const g=p.gate; hs.push({id:'q',num:'?',anchor:HS.ptOn(g.at[0],g.at[1]),cls:'q'+(isRevealed()?' v':''),aria:isRevealed()?g.ariaRevealed:g.aria,tip:E.tryMode?null:isRevealed()?'Feedback, revealed':'Something acts back here · Try it?',seg:g.routes[0],onClick:openTry}); }
  return hs;
};
HS.getMarks=()=>{ const p=P(); return E.whatIf&&p?p.whatIf.blocks:[]; };
HS.info=k=>(E.scene&&E.scene.info[k])||HS.baseInfo(k);

/* ---------- pathway bar ---------- */
function renderToggle(){
  const opts=E.scene.toggle?E.scene.toggle.options:[];
  $('#seg').innerHTML=opts.map(([r,l,s])=>`<button data-route="${r}" aria-pressed="false" aria-label="${l}"><span class="lg">${l}</span><span class="sm" aria-hidden="true">${s||l}</span></button>`).join('');
  $('#seg').setAttribute('aria-label',E.scene.toggle?E.scene.toggle.label:'Route'); $('#seg').hidden=opts.length<2;
}
$('#seg').addEventListener('click',e=>{ const b=e.target.closest('[data-route]'); if(!b) return; stopAll(); const p=P(); if(p&&p.afterPlay&&p.afterPlay.tip) HS.clearTip(p.afterPlay.tip.key); enterPathway(b.dataset.route,false); });
function renderDots(){
  const p=P(), v=vis();
  let h=p.hots.map((x,i)=>`<button class="hdot${v.has(i)?' v':''}${i===E.cur?' cur':''}" data-h="${i}" aria-label="Go to step ${x.num}: ${x.one}">${x.num}</button>`).join('');
  if(p.gate) h+=`<button class="hdot q${isRevealed()?' v':''}" data-q="1" aria-label="${p.gate.dotAria}">?</button>`;
  $('#dots').innerHTML=h;
  const done=v.size===p.hots.length&&(!p.gate||isRevealed());
  $('#timeChip').textContent=done?'Route explored':p.chip; $('#timeChip').classList.toggle('done',done);
  /* "Say it back" becomes reachable on demand. A SIBLING button, not a child of #timeChip:
     renderDots rewrites #timeChip's textContent on every step, which destroys any element
     inside it, and a focused child would lose focus to <body> on the next step.
     Gated on state (a reflect prompt exists, nothing else is open) rather than on the
     reflectSeen latch, so the affordance does not appear and vanish depending on whether a
     900 ms timer already fired. Ungraded: it opens a prompt, it never records an attempt. */
  const say=$('#bSay');
  if(say) say.hidden=!(p.reflect&&!E.playing&&!E.tryMode&&!E.whatIf&&!E.cellOpen&&!(HS.RB&&HS.RB.active)&&!(HS.CMP&&HS.CMP.active));
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
  if(HS.RB&&HS.RB.active) HS.closeRebuild(false);
  if(HS.CMP&&HS.CMP.active) HS.closeCompare(false);
  const S=E.scene; stopPlay(); closeTry(); closeCell(); closeReflect(); restoreWhatIf(false);
  E.route=r; E.cur=-1; E.landed=new Set(); E.gate=true; const p=S.pathways[r];   /* signs couple to arrival on the first forward pass */
  HS.setLast(E.sceneId,r); HS.renderContinue();
  if(E.timeRef!==TL()){ buildRibbon(); setTime(0); }
  if(p.minTime&&E.tIdx<p.minTime) setTime(p.minTime);
  $('#pName').textContent=p.name; $('#timeChip').textContent=p.chip;
  $('#bAll').hidden=!(S.toggle&&S.toggle.options.length>=2);
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
  HS.syncHash();
  if(p.enterTip) HS.tip(p.enterTip.key,p.enterTip.text,p.enterTip.pos);
  /* The unrevealed line's one-time instruction. The always-on label on the body stays short
     ("Not revealed yet"); this is where the learner is told what to DO about it, through the
     existing one-shot, dismissible, Settings-switchable tip channel rather than a second
     permanent label. Shown only while the gate is still unrevealed.
     Takes priority over the grammar tip below: it is specific to what is on screen now. */
  const ghostTip=p.gate&&p.gate.unrevealed&&!isRevealed(r);
  if(ghostTip) HS.tip('ghosthow_'+E.sceneId+'_'+r,p.gate.unrevealed,{right:16,bottom:214});
  /* Teach the line grammar ONCE, on the first pathway the learner opens, using the existing
     one-shot tip channel (dismissible, remembered, Settings-switchable) rather than a new
     per-session latch. The textures are on the body at all times and were explained only at
     the bottom of Read the route; §10 task 6 asks the learner to tell a nerve from a blood
     route, so the key to that distinction has to arrive on the body at least once.
     It teaches by SHOWING: the same legend (line samples + end glyphs) used in Read.
     Tips replace one another, so it defers to the unrevealed-line tip: that one names what is
     on screen right now, and this one still lands on the next pathway that has no gate tip. */
  if(HS.tipRich&&!HS._grammarShown&&!ghostTip){ HS._grammarShown=true;
    HS.tipRich('linegrammar','The line styles tell you how a message travels.',HS.grammarLegend());
  }
  if(autoplay&&E.route===r&&!(HS.RB&&HS.RB.active)) play();   // a stale autoplay never fires into another pathway or a challenge
}
HS.enterPathway=enterPathway;
function stopPlay(){ if(E.playing){ E.playing=false; HS.cancelTravel(); setPlayUI(); } }
HS.stopPlay=stopPlay;
async function goHot(i,user){
  const p=P(), h=p.hots[i]; if(user){ stopAll(); stopPlay(); closeTry(); }
  E.cur=i; vis().add(i); if(h.org) E.landed.add(h.org); renderDots(); HS.saveSoon(); HS.syncHash();
  const og=$('#o-'+h.org); if(og&&!HS.RM()){ og.classList.remove('arrive'); void og.getBoundingClientRect(); og.classList.add('arrive'); clearTimeout(og._arr); og._arr=setTimeout(()=>og.classList.remove('arrive'),950); }   // the organ answers once as the signal lands
  if(E.tIdx<h.t) setTime(h.t); else applySigns();   // re-couple this organ's sign even when the time index doesn't advance
  HS.say(`Step ${h.num}: ${h.one}`);
  if(user){ await HS.camTo(h.region,650); if(h.seg) await HS.travel(h.seg,900); }
  HS.renderOverlay(); setPlayUI();
}
HS.goHot=goHot;
async function play(){
  const p=P(); if(!p||(HS.RB&&HS.RB.active)||(HS.CMP&&HS.CMP.active)) return;
  if(E.playing){ stopPlay(); return; }
  closeTry(); closeCell(); if(p.enterTip) HS.clearTip(p.enterTip.key);
  if(HS.RM()){ const next=E.cur+1<p.hots.length?E.cur+1:0; if(next===0&&E.cur>=0) vis().clear(); await HS.camTo(p.region,0); goHot(next,false); if(next===p.hots.length-1) afterPlay(); return; }
  E.playing=true; setPlayUI();
  const start=(E.cur>=p.hots.length-1||E.cur<0)?0:E.cur+1;
  if(start===0){ E.landed=new Set(); E.gate=true; }   // a fresh pass re-couples signs to arrival
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
  if(a.tip&&!E.playingAll) HS.tip(a.tip.key,a.tip.text,a.tip.pos);   // no hand-off tip mid "Watch it all"
  const p=P(); if(p&&p.reflect&&!reflectSeen.has(key())&&!E.playingAll&&(!p.gate||isRevealed())){ reflectSeen.add(key()); setTimeout(openReflect,900); }
}
/* Say it back: an optional, ungraded self-explanation after a pathway is understood (no score, no streak) */
const reflectSeen=new Set();
/* Which pathways have had their explanation prompt opened this session. Used ONLY to decide
   whether the model answer starts hidden: the first visit is where the retrieval effort
   matters, so the model stays behind the button then; a later visit in the same session opens
   it for comparison. This is not a progress record and is never persisted or counted. */
const reflectVisits=new Set();
function openReflect(){
  const p=P(); if(!p||!p.reflect||E.reflectOpen||E.tryMode||E.whatIf||E.cellOpen||(HS.RB&&HS.RB.active)||(HS.CMP&&HS.CMP.active)) return;
  E.reflectOpen=true; const r=p.reflect; HS.closeCards&&HS.closeCards();
  /* Remember what opened this, so Escape returns focus where the learner was — pressing Y
     from a focused hotspot should not throw focus across the screen to the toolbar. */
  HS._reflFrom=(document.activeElement&&document.activeElement!==document.body)?document.activeElement:$('#bRead');
  const box=document.createElement('div'); box.className='try float'; box.id='reflCard'; box.setAttribute('role','dialog'); box.setAttribute('aria-label','Say it back');
  box.style.right='16px'; box.style.top='96px';
  const revisit=reflectVisits.has(key()); reflectVisits.add(key());
  box.innerHTML=`<div class="k">Say it back</div><h5>${r.q}</h5><p>${revisit?'Reading it again — here is how we\u2019d put it, so you can compare with your own version.':'Put it in your own words — just for you, nothing is scored.'}</p>
   <textarea id="reflText" rows="3" aria-label="Your explanation" placeholder="Type your answer, or just think it through…"></textarea>
   <div id="reflModel" hidden></div>
   <div class="acts"><button class="btn t" id="reflClose">Close</button><button class="btn p" id="reflShow">Show how we’d put it</button></div>`;
  app.appendChild(box);
  const reveal=()=>{ const m=$('#reflModel'); m.className='res good'; m.innerHTML='<b>How we’d put it</b>'+r.model; m.hidden=false; $('#reflShow').disabled=true; HS.say('How we’d put it. '+r.model); };
  $('#reflShow').onclick=reveal;
  /* A later visit in the same session opens with the model already there: the effortful
     first attempt has happened, so the second read is a comparison rather than a test. */
  if(revisit){ reveal(); $('#reflShow').hidden=true; }
  $('#reflClose').onclick=()=>closeReflect(true);
  box.addEventListener('keydown',e=>{ if(e.key==='Escape'){ e.preventDefault(); closeReflect(true); } });
  $('#reflText').focus(); HS.say('Say it back. '+r.q+' Type an answer if you like, then show how we’d put it.');
}
function closeReflect(focus){ if(!E.reflectOpen) return; E.reflectOpen=false; const d=$('#reflCard'); if(d) d.remove(); if(focus&&HS._reflFrom&&document.contains(HS._reflFrom)) HS._reflFrom.focus(); else if(focus&&$('#bRead')) $('#bRead').focus(); }
HS.openReflect=openReflect; HS.closeReflect=closeReflect;
/* The on-demand entry point. openReflect already has no reflectSeen check of its own — that
   latch lives in afterPlay as a send-once guard — so this is an alias plus a close-first
   guard, NOT a `force` flag. #reflCard, #tryCard and #wiCard all sit at right:16/top:96, so
   opening it over another card would stack three dialogs at identical coordinates. */
HS.openReflectNow=function(){
  const p=P(); if(!p||!p.reflect) return;
  if(E.reflectOpen){ closeReflect(true); return; }
  if(E.tryMode) closeTry(); if(E.whatIf) restoreWhatIf(false); if(E.cellOpen) closeCell();
  HS.closeCards&&HS.closeCards();
  openReflect();
};
/* Watch the whole response: play each route in turn across the shared time ribbon (guided, no table) */
function setAllUI(on){ const b=$('#bAll'); if(!b) return; b.setAttribute('aria-pressed',on); const l=b.querySelector('.lbl'); if(l) l.textContent=on?'Stop':'Watch it all'; }
function stopAll(){ if(E.playingAll){ E.playingAll=false; setAllUI(false); } }   // a deliberate user action ends the auto sequence
HS.stopAll=stopAll;
async function playAll(){
  const S=E.scene; if(!S||!S.toggle||S.toggle.options.length<2||(HS.RB&&HS.RB.active)||(HS.CMP&&HS.CMP.active)) return;
  if(E.playingAll){ E.playingAll=false; stopPlay(); setAllUI(false); return; }
  E.playingAll=true; setAllUI(true); HS.say('Watching the whole response, one route after another.');
  for(const opt of S.toggle.options){
    if(!E.playingAll) break;
    await enterPathway(opt[0],false); if(!E.playingAll) break;
    const p=P();
    if(HS.RM()){ for(let i=0;i<p.hots.length;i++){ if(!E.playingAll) break; await HS.camTo(p.region,0); goHot(i,false); await HS.sleep(520); } }
    else { E.cur=-1; await play(); }
    if(!E.playingAll) break;
    await HS.sleep(750);
  }
  E.playingAll=false; setAllUI(false);
}
HS.playAll=playAll;

/* ---------- Try it? ---------- */
function openTry(){
  const p=P(); if(!p||!p.gate||E.tryMode||E.whatIf) return; const g=p.gate, tr=g.try;
  const q=typeof tr.q==='string'?tr.q:(tr.q[HS.level()]||tr.q.organ);   // wording follows the zoom level it was opened at
  stopPlay(); HS.closeCards(); HS.clearTip(g.tipKey); E.tryMode=true; E.picks.clear(); E.tryCtx={exposed:isRevealed(),why:false};
  tr.candidates.forEach(k=>$('#o-'+k).classList.add('cand'));
  HS.light.dim=new Set(tr.candidates); HS.applyOrgs();
  const box=document.createElement('div'); box.className='try float'; box.id='tryCard'; box.setAttribute('role','dialog'); box.setAttribute('aria-label','Try it');
  box.style.right='16px'; box.style.top='96px';   // docked right; the camera frames the scene in the space beside it
  box.innerHTML=`<div class="k">Try it? <button class="why" id="tryWhy">ⓘ Why?</button></div><h5>${q}</h5><p>${tr.hint} Or choose here:</p><div class="opts" role="group" aria-label="Candidates, head to pelvis">${tr.candidates.map(k=>`<button class="opt" aria-pressed="false" data-pick="${k}">${HS.orgName(k)}</button>`).join('')}</div><div id="tryWhyTxt"></div><div class="sr" id="tryPicks" aria-live="polite">Nothing selected yet</div><div id="tryRes"></div><div class="acts"><button class="btn t" id="tryShow">Show me</button><span><button class="btn t" id="tryClose">Close</button> <button class="btn p" id="tryCheck" disabled>Check</button></span></div>`;
  $('#cards').appendChild(box);
  HS.camTo(tr.region||p.region,600);
  $('#tryWhy').onclick=()=>{ if($('#tryCheck')) E.tryCtx.why=true; $('#tryWhyTxt').innerHTML=`<div class="whytxt">${tr.why}</div>`; $('#tryWhy').remove(); };
  $('#tryShow').onclick=()=>checkTry(true); $('#tryClose').onclick=closeTry; $('#tryCheck').onclick=()=>checkTry(false);
  box.querySelector('.opts').addEventListener('click',e=>{ const b=e.target.closest('[data-pick]'); if(b&&!b.disabled){ togglePick(b.dataset.pick); HS.renderOverlay(); } });
  box.querySelector('[data-pick]').focus();
  HS.say(`Try it. ${q} Candidates: ${tr.candidates.map(HS.orgName).join(', ')}. Use the hotspot numbers or click organs.`);
}
HS.openTry=openTry;
function togglePick(k){
  const tr=P().gate.try;
  if(!tr.candidates.includes(k)||!$('#tryCheck')||$('#tryCheck').dataset.done) return;
  E.picks.has(k)?E.picks.delete(k):E.picks.add(k); $('#o-'+k).classList.toggle('pick',E.picks.has(k));
  const chip=$(`#tryCard [data-pick="${k}"]`); if(chip) chip.setAttribute('aria-pressed',E.picks.has(k));
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
  $('#tryCard').querySelectorAll('[data-pick]').forEach(b=>{ b.disabled=true; const k=b.dataset.pick; b.classList.toggle('right',right.has(k)); b.classList.toggle('wrongpick',E.picks.has(k)&&!right.has(k)&&!show); });
  $('#tryCard .acts').innerHTML=`<span></span><button class="btn p" id="tryCalm">${g.calmButton}</button>`;
  $('#tryCalm').onclick=()=>{ closeTry(); setTime(lastT(),true); HS.camTo('body',700); if(g.afterTip) setTimeout(()=>HS.tip(g.afterTip.key,g.afterTip.text,g.afterTip.pos),900); }; $('#tryCalm').focus();
  HS.say(fb.head+' '+fb.txt);
  if(!show) HS.recordAttempt({scene:E.sceneId,path:E.route,type:E.tryCtx.exposed?'practice':E.tryCtx.why?'assisted':'unassisted',correct:all&&!wrong});
  revealed[key()]=true; g.routes.forEach(id=>HS.setRoute(id,'on',{draw:true})); renderDots(); HS.renderOverlay(); HS.saveSoon(); HS.syncHash();
  await HS.sleep(HS.RM()?0:650);
  if(g.loopFrom&&E.scene.routes[g.loopFrom]&&isRevealed()&&!E.whatIf) await HS.travel(g.loopFrom,850);   // the output runs downstream, then continues back up the feedback line as one closed circuit
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
  const n=C.steps.length, F=C.focus||[], adv=HS.advOn&&C.adv;
  const d=document.createElement('div'); d.className='inset float'; d.id='cellInset'; d.setAttribute('role','dialog'); d.setAttribute('aria-label',C.aria);
  d.style.right='150px'; d.style.top='96px';
  d.innerHTML=`<header><div><b>${C.title}</b><small>${C.sub}${adv?' · Advanced':''}</small></div><button class="btn t" id="cellX" aria-label="Close cell view">×</button></header>
   <svg viewBox="0 0 376 214" aria-hidden="true">${C.svg}${F.length?`<defs><mask id="cellSpot"><rect width="376" height="214" fill="#fff"/><circle id="spotHole" cx="${F[0][0]}" cy="${F[0][1]}" r="${F[0][2]}" fill="#000"/></mask></defs><rect width="376" height="214" fill="#040A0D" opacity=".58" mask="url(#cellSpot)" pointer-events="none"/>`:''}</svg>
   <ol class="csteps">${C.steps.map((s,i)=>`<li><button class="cstep" data-cs="${i}"><span class="n" aria-hidden="true">${i+1}</span><span class="tx">${s}${adv?`<small class="advtx">${C.adv[i]}</small>`:''}</span></button></li>`).join('')}</ol>
   <div class="cnav"><span id="cellPos" aria-live="polite"></span><span><button class="btn t" data-cn="-1">Previous</button> <button class="btn p" data-cn="1">Next</button></span></div>`;
  app.appendChild(d);
  const mol=d.querySelector('#cellMol'), path=d.querySelector('#cellPath'), hole=d.querySelector('#spotHole');
  const put=(x,y)=>{ if(!mol) return; mol.setAttribute('cx',x); mol.setAttribute('cy',y); mol.nextElementSibling.setAttribute('x',x); mol.nextElementSibling.setAttribute('y',y+3.5); };
  const runMol=()=>{   /* the signal molecule travels on step 1 and rests bound afterwards */
    if(!mol||!path) return; if(HS.RM()){ put(C.end[0],C.end[1]); return; }
    const L=path.getTotalLength(), t0=performance.now();
    const f=now=>{ if(!E.cellOpen||cur!==0) return; const k=Math.min(1,(now-t0)/2200), pt=path.getPointAtLength(L*(k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2)); put(pt.x,pt.y); if(k<1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  };
  let cur=-1, spotTok=0;
  const spot=to=>{   /* the spotlight glides to the part the step is about */
    if(!hole||!to) return; const from=['cx','cy','r'].map(a=>+hole.getAttribute(a));
    if(HS.RM()){ ['cx','cy','r'].forEach((a,j)=>hole.setAttribute(a,to[j])); return; }
    const t0=performance.now(), tok=++spotTok;
    const f=now=>{ if(tok!==spotTok||!E.cellOpen) return; const k=Math.min(1,(now-t0)/450), e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2; ['cx','cy','r'].forEach((a,j)=>hole.setAttribute(a,(from[j]+(to[j]-from[j])*e).toFixed(1))); if(k<1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  };
  const go=(i,quiet)=>{
    i=Math.max(0,Math.min(n-1,i)); if(i===cur) return; cur=i;
    d.querySelectorAll('.cstep').forEach((b,j)=>{ b.classList.toggle('on',j===i); if(j===i) b.setAttribute('aria-current','step'); else b.removeAttribute('aria-current'); });
    $('#cellPos').textContent=`Step ${i+1} of ${n}`;
    d.querySelector('[data-cn="-1"]').disabled=i===0; d.querySelector('[data-cn="1"]').disabled=i===n-1;
    spot(F[i]); if(i===0) runMol(); else if(C.end) put(C.end[0],C.end[1]);
    if(!quiet) HS.say(`Step ${i+1} of ${n}. ${C.steps[i]}${adv?' '+C.adv[i]:''}`);
  };
  d.addEventListener('click',e=>{
    const s=e.target.closest('[data-cs]'); if(s){ go(+s.dataset.cs); return; }
    const nv=e.target.closest('[data-cn]'); if(nv&&!nv.disabled){ go(cur+(+nv.dataset.cn)); if(nv.disabled) d.querySelector(`[data-cn="${-nv.dataset.cn}"]`).focus(); }
  });
  d.addEventListener('keydown',e=>{ if(e.key==='ArrowRight'){ e.preventDefault(); go(cur+1); } else if(e.key==='ArrowLeft'){ e.preventDefault(); go(cur-1); } });
  $('#cellX').onclick=closeCell;
  HS.depthChip('cell');
  go(0,true); HS.say(`${C.say} Step 1 of ${n}. Use Next, or the arrow keys, to step through.`);
  d.querySelector('[data-cn="1"]').focus();
}
function closeCell(){ if(!E.cellOpen) return; E.cellOpen=false; const d=$('#cellInset'); if(d) d.remove(); HS.resetLevel(); HS.depthChip(HS.level()); HS.updateView(); }
HS.openCell=openCell; HS.closeCell=closeCell;

/* ---------- What if? ---------- */
function openWhatIf(){
  const p=P(); if(!p||!p.whatIf||E.whatIf||(p.gate&&!isRevealed())) return; const w=p.whatIf;
  stopPlay(); closeTry(); closeCell(); HS.closeCards(); E.whatIf='predict';
  $('#thought').hidden=false; (w.fade||[]).forEach(id=>HS.setRoute(id,'faint'));
  if(w.atmos){ HS.setAtmos(w.atmos); HS.setNight(0); }
  const box=document.createElement('div'); box.className='try float'; box.id='wiCard'; box.setAttribute('role','dialog'); box.setAttribute('aria-label','What if?');
  box.style.right='16px'; box.style.top='96px';
  box.innerHTML=`<div class="k">What if?</div><h5>${w.q}</h5><p>${w.p}</p><div class="opts" role="radiogroup" aria-label="Your prediction">${w.options.map(o=>`<button class="opt" role="radio" aria-checked="false" data-o="${o[0]}">${o[1]}</button>`).join('')}</div><div id="wiRes"></div><div class="acts"><button class="btn t" id="wiRestore">Restore</button><button class="btn p" id="wiGo" disabled>See what happens</button></div>`;
  $('#cards').appendChild(box);
  HS.camTo(w.region||p.region,600);
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
  if(p&&p.whatIf.atmos) setTime(E.tIdx);
  if(p&&p.gate&&isRevealed()) p.gate.routes.forEach(id=>HS.setRoute(id,'on',{draw:true}));
  HS.renderOverlay(); if(focus){ $('#bWhat').focus(); HS.say('Restored the normal pathway.'); }
}
HS.openWhatIf=openWhatIf; HS.restoreWhatIf=restoreWhatIf;

/* ---------- body & tree ---------- */
HS.onOrgClick=function(k){
  if(HS.RB&&HS.RB.active){ HS.rebuildPick(k); return; }
  if(HS.CMP&&HS.CMP.active) return;
  if(E.tryMode){ togglePick(k); return; }
  const p=P();
  if(p){ const i=p.hots.findIndex(h=>h.org===k); if(i>=0){ goHot(i,true); return; } }
  const reg=(p&&p.orgRegions&&p.orgRegions[k])||(HS.ORGS[k]||HS.INSET[k]||{}).region;
  if(reg) HS.camTo(reg,650);
  if(E.state!=='triggered'){ HS.light.lit=new Set([k]); HS.applyOrgs(); }
};
/* routes are pointable: the ghost offers Try it?, others open a signal card */
HS.gateLabel=id=>{ const p=P(); return p&&p.gate&&p.gate.routes.includes(id)?E.scene.routes[p.gate.labelRoutes[0]].label:null; };
HS.onRouteClick=function(id,ev){
  const p=P(), st=HS.rstate[id]; if(!p||st==='hide'||E.tryMode) return;
  if(st==='ghost'&&p.gate&&p.gate.routes.includes(id)){ openTry(); return; }
  HS.showRouteCard(id,ev);
};
HS.followLead=function(l){ if(!l) return; HS.toast(l.why); HS.openPathway(l.scene,l.path,false); };
HS.onSignalSelect=function(n){ HS.light.lit=new Set(n.organs); HS.applyOrgs(); HS.renderOverlay(); };
})(window.HS);
