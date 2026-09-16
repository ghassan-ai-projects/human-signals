/* Advanced · Compare routes. In scenes with two pathways, both routes on one body: A solid, B hollow (a cue
   that survives grayscale), lettered route and organ labels, a words-only timeline per route and a
   side-by-side table. Scene data: pathway.compare = {first, carried, reaches, time, notice, off, effect, lane}. */
(function(HS){
const $=HS.$, E=HS.E;
const CMP=HS.CMP={active:false};
const ROWS=[['First signal','first'],['Carried by','carried'],['Reaches','reaches'],['Timescale','time'],['What you’d notice','notice'],['Switched off by','off'],['Overall','effect']];

HS.openCompare=function(){
  const S=E.scene; if(!S||!S.toggle||S.toggle.options.length<2||CMP.active) return;
  const [a,b]=S.toggle.options.map(o=>o[0]), A=S.pathways[a], B=S.pathways[b];
  if(!A.compare||!B.compare) return;
  const opener=HS.layers.opener(document.activeElement,$('#bAdv'));
  HS.layers.start('compare',opener,focus=>HS.closeCompare(focus),$('#bAdv'));
  HS.stopPlay(); HS.closeTry(false); HS.restoreWhatIf(false); HS.closeCell(false); HS.closeCards(); HS.closeRead(false); if(HS.RB.active) HS.closeRebuild(false); $('#tips').innerHTML='';
  Object.assign(CMP,{active:true,S,a,b,A,B,tok:0});
  Object.keys(HS.rstate).forEach(id=>{ HS.setRoute(id,'hide'); HS.setHollow(id,false); });
  const side=(p,key,hollow)=>{ p.draw.forEach(id=>{ HS.setRoute(id,'on'); HS.setHollow(id,hollow); }); if(p.gate&&HS.isRevealed(key)) p.gate.routes.forEach(id=>{ HS.setRoute(id,'on'); HS.setHollow(id,hollow); }); };
  side(A,a,false); side(B,b,true);
  HS.light.dim=new Set([...A.organs,...B.organs]); HS.light.lit=new Set([...A.organs,...B.organs]); HS.applyOrgs();
  HS.setTime(E.tIdx);   // signs step back while comparing
  const RA=HS.REG[A.region], RB=HS.REG[B.region], x=Math.min(RA.x,RB.x), y=Math.min(RA.y,RB.y);
  HS.REG['cmp-'+S.id]={x,y,w:Math.max(RA.x+RA.w,RB.x+RB.w)-x,h:Math.max(RA.y+RA.h,RB.y+RB.h)-y};
  const box=document.createElement('div'); box.className='try float cmp'; box.id='cmpCard'; box.setAttribute('role','dialog'); box.setAttribute('aria-label',`Compare ${A.name} and ${B.name}`);
  box.style.right='16px'; box.style.top='96px'; box.innerHTML=cardHTML(); $('#cards').appendChild(box); HS.layers.mount('compare',box);
  $('#cmpLegend').hidden=false; $('#cmpLegend').innerHTML=`<span class="lg a"><i></i>A · ${A.name}</span><span class="lg b"><i></i>B · ${B.name}</span>`;
  HS.camTo('cmp-'+S.id,650); HS.renderOverlay();
  box.querySelector('[data-cmp="play"]').focus();
  HS.say(`Comparing ${A.name}, route A, solid lines, with ${B.name}, route B, hollow lines. ${ROWS.map(([l,k])=>`${l}: A, ${A.compare[k]}; B, ${B.compare[k]}.`).join(' ')}`);
};

function lanes(){
  const {S,A,B}=CMP;
  if(!A.time&&!B.time){
    const T=S.time, cols=`grid-template-columns:22px repeat(${T.length},1fr)`;
    const row=(lbl,p,cls)=>`<div class="lane" style="${cols}"><b>${lbl}</b>${T.map((t,i)=>`<span class="${p.compare.lane.includes(i)?'on '+cls:''}" aria-hidden="true"></span>`).join('')}</div>`;
    return `<div class="lanes" role="img" aria-label="A is active at ${A.compare.lane.map(i=>T[i].w).join(' and ')}; B at ${B.compare.lane.map(i=>T[i].w).join(' and ')}."><div class="lane words" style="${cols}"><b></b>${T.map(t=>`<span>${t.w}</span>`).join('')}</div>${row('A',A,'a')}${row('B',B,'b')}</div>`;
  }
  const line=(lbl,p)=>`<div class="lane2"><b>${lbl}</b><span>${(p.time||S.time).map((t,i)=>p.compare.lane.includes(i)?`<em>${t.w}</em>`:t.w).join(' · ')}</span></div>`;
  return `<div class="lanes">${line('A',A)}${line('B',B)}</div>`;
}
function cardHTML(){
  const {A,B}=CMP;
  return `<div class="k">Advanced · Compare routes</div><h5>${A.name} and ${B.name}</h5>
   <p>Both routes on one body: <b>A</b> solid, <b>B</b> hollow. Time in words, not measured.</p>
   ${lanes()}
   <div class="cmptable-wrap"><table class="cmptable"><thead><tr><th scope="col"><span class="sr">Feature</span></th><th scope="col">A · ${A.name}</th><th scope="col">B · ${B.name}</th></tr></thead>
   <tbody>${ROWS.map(([l,k])=>`<tr><th scope="row">${l}</th><td>${A.compare[k]}</td><td>${B.compare[k]}</td></tr>`).join('')}</tbody></table></div>
   <p class="rec">Advanced · illustrative draft, not reviewed science.</p>
   <div class="acts"><button class="btn t" data-cmp="close">Close</button><button class="btn p" data-cmp="play">Play both</button></div>`;
}

HS.closeCompare=function(restore=true){
  if(!CMP.active){ HS.layers.end('compare',restore); return; }
  CMP.active=false; CMP.tok++; HS.cancelTravel();
  const c=$('#cmpCard'); if(c) c.remove(); $('#cmpLegend').hidden=true;
  Object.keys(HS.rstate).forEach(id=>HS.setHollow(id,false));
  HS.setTime(E.tIdx);
  HS.layers.end('compare',restore);
  if(restore&&E.route) HS.enterPathway(E.route,false);
};
async function playBoth(){
  const tok=++CMP.tok, {A,B}=CMP;
  for(const [lbl,p] of [['A',A],['B',B]]){
    HS.say(`Route ${lbl}: ${p.name}.`);
    for(const id of p.draw){ if(!CMP.active||tok!==CMP.tok) return; await HS.travel(id,p.segDur||900); await HS.sleep(HS.RM()?0:200); }
    await HS.sleep(HS.RM()?0:500);
  }
}
/* labels while comparing: each route named with its letter, organs tagged with the routes that reach them */
HS.compareLabels=function(){
  const {S,A,B,a,b}=CMP, out=[], seenOrg=new Map();
  [['A',A,a],['B',B,b]].forEach(([lbl,p,key])=>{
    const named=new Set();   // one label per signal per route (After a meal sends insulin two ways)
    p.draw.concat(p.gate&&HS.isRevealed(key)?p.gate.labelRoutes:[]).forEach(id=>{ const r=S.routes[id], t=HS.routeText(id); if(named.has(t)) return; named.add(t); if(r.label&&HS.rstate[id]==='on') out.push({key:'cmp-'+id,text:`${lbl} · ${HS.routeText(id)}`,cls:'sig cmp'+lbl.toLowerCase(),anchor:HS.ptOn(id,r.at),dx:r.dx,dy:r.dy,noLeader:true}); });
    p.hots.forEach(h=>{ const s=seenOrg.get(h.org); if(s) s.sides.push(lbl); else seenOrg.set(h.org,{h,sides:[lbl]}); });
  });
  seenOrg.forEach(({h,sides},org)=>out.unshift({key:'cmpo-'+org,org,text:`${HS.orgName(org)} · ${sides.join(' ')}`,anchor:HS.wc(org),dx:h.ldx,dy:h.ldy,info:org}));
  return out;
};

$('#cards').addEventListener('click',e=>{
  if(!CMP.active) return; const b=e.target.closest('#cmpCard [data-cmp]'); if(!b) return;
  if(b.dataset.cmp==='close') HS.closeCompare(true);
  else if(b.dataset.cmp==='play') playBoth();
});
})(window.HS);
