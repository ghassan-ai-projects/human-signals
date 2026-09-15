/* Overlay: schematic routes and pulses (world SVG), end glyphs, labels with collision avoidance,
   hotspot buttons (HTML), and whole-body signs. Scene content arrives through HS.getLabels/getHotspots/getMarks. */
(function(HS){
const $=HS.$, app=HS.app, overlay=$('#overlay'), labelsEl=$('#labels');
const COL=HS.COL={msg:'#7CCBFF',nerve:'#C4A8FF',fb:'#FFB547',mod:'#FFB547'};
HS.ov={hoverKey:null,showAll:false};

/* routes */
let ROUTES={};
const rstate=HS.rstate={}, pathEl={};
HS.buildRoutes=function(routes){
  travelTok++; pulse.on=false; fx.length=0; Object.keys(drawing).forEach(k=>delete drawing[k]);   // nothing from the previous scene keeps animating
  ROUTES=routes; Object.keys(rstate).forEach(k=>delete rstate[k]); Object.keys(pathEl).forEach(k=>delete pathEl[k]);
  let s=''; Object.entries(routes).forEach(([id,r])=>{ s+=`<path class="casing" id="c-${id}" d="${r.d}" stroke="#061015" stroke-width="8" fill="none" opacity="0"/><path class="route" id="r-${id}" d="${r.d}" stroke="${COL[r.kind]}" stroke-width="2.6" opacity="0"/>`; });
  $('#gRoutes').innerHTML=s;
  Object.keys(routes).forEach(id=>{ pathEl[id]=document.getElementById('r-'+id); rstate[id]='hide'; });
};
HS.routeDef=id=>ROUTES[id];
HS.setRoute=function(id,st,opt){
  const was=rstate[id]; rstate[id]=st; const p=pathEl[id], c=document.getElementById('c-'+id);
  endDraw(id);
  p.setAttribute('opacity',{hide:0,faint:.24,ghost:.62,on:1}[st]);
  c.setAttribute('opacity',{hide:0,faint:.2,ghost:.45,on:.95}[st]);
  if(st==='ghost') p.setAttribute('stroke-dasharray','6 7'); else p.removeAttribute('stroke-dasharray');
  if(opt&&opt.draw&&st==='on'&&was!=='on') drawOn(id);
};
/* draw-on: the route grows from source to target once (600 ms). Strokes are non-scaling, so while
   drawing we switch to user units and keep the on-screen width constant frame by frame. */
const drawing={};
function endDraw(id){
  if(!drawing[id]) return; delete drawing[id];
  [pathEl[id],document.getElementById('c-'+id)].forEach(el=>{ el.style.vectorEffect=''; el.style.strokeDasharray=''; el.style.strokeDashoffset=''; el.style.strokeWidth=''; });
}
function drawOn(id,dur=650){
  if(HS.RM()) return;
  const p=pathEl[id], c=document.getElementById('c-'+id), L=p.getTotalLength(), t0=performance.now(), tok={};
  drawing[id]=tok;
  const step=now=>{
    if(drawing[id]!==tok) return;
    const k=Math.min(1,(now-t0)/dur), e=1-Math.pow(1-k,3), s=HS.scale();
    [p,c].forEach(el=>{ el.style.vectorEffect='none'; el.style.strokeDasharray=`${L} ${L}`; el.style.strokeDashoffset=(L*(1-e)).toFixed(2); });
    p.style.strokeWidth=(2.6/s).toFixed(3); c.style.strokeWidth=(8/s).toFixed(3);
    if(k<1) requestAnimationFrame(step); else { endDraw(id); HS.renderOverlay(); }
  };
  requestAnimationFrame(step);
}

/* one-shot effects: arrival ripples, the "brain registers it" moment */
const fx=[]; let fxRaf=0;
function fxLoop(){ fxRaf=0; HS.renderOverlay(); if(fx.length) fxRaf=requestAnimationFrame(fxLoop); }
HS.ripple=function(p,color,o={}){ if(HS.RM()) return; fx.push({p,c:color,t0:performance.now(),dur:o.dur||850,r0:o.r0||8,r1:o.r1||36,w:o.w||2}); if(!fxRaf) fxRaf=requestAnimationFrame(fxLoop); };

/* stage atmosphere: a quiet tint behind the body per trigger; never encodes amount */
HS.setAtmos=function(color){ const a=$('#atmos'); if(color) a.style.setProperty('--atm',color); a.classList.toggle('on',!!color); };
HS.setNight=v=>{ $('#night').style.opacity=v||0; };
HS.ptOn=function(id,t){ const el=pathEl[id]; const L=el.getTotalLength(); const p=el.getPointAtLength(L*t); return [p.x,p.y]; };
const pulse=HS.pulse={on:false,route:null,t:0}; let travelTok=0;
HS.cancelTravel=()=>{ travelTok++; };
HS.travel=function(id,dur=1100){
  return new Promise(res=>{
    if(HS.RM()||!ROUTES[id]){ res(true); return; }
    const tok=++travelTok; pulse.on=true; pulse.route=id; const t0=performance.now();
    const f=now=>{
      if(tok!==travelTok){ pulse.on=false; HS.renderOverlay(); res(false); return; }
      const k=Math.min(1,(now-t0)/dur); pulse.t=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2; HS.renderOverlay();
      if(k<1) requestAnimationFrame(f); else { pulse.on=false; HS.ripple(HS.ptOn(id,1),COL[ROUTES[id].kind]); HS.renderOverlay(); res(true); }
    };
    requestAnimationFrame(f);
  });
};

/* whole-body signs: fixed, illustrative, never scaled by amount */
HS.buildSigns=function(signs){
  let s='';
  signs.forEach(sg=>{
    if(sg.type==='ripple'){ const c=HS.wc(sg.org); s+=`<g id="sg-${sg.id}" class="sign off">${[0,.31].map((d,i)=>`<circle class="beat" style="animation-delay:${d}s" cx="${c[0]}" cy="${c[1]}" r="${sg.r||34}" fill="none" stroke="${sg.color}" stroke-width="${i?1.5:2}"/>`).join('')}</g>`; }
    else if(sg.type==='glyphs'){ const c=HS.wc(sg.org), o=sg.offset||[0,0], dr=sg.drift||[-46,26]; s+=`<g id="sg-${sg.id}" class="sign off">${[[0,0],[14,10],[-10,14],[8,-8],[-16,-2]].map((q,i)=>`<g transform="translate(${c[0]+o[0]+q[0]} ${c[1]+o[1]+q[1]})"><path class="glyph" style="animation-delay:${i*.6}s;--dx:${dr[0]}px;--dy:${dr[1]}px" d="M0 -5 L4.3 -2.5 L4.3 2.5 L0 5 L-4.3 2.5 L-4.3 -2.5Z" fill="rgba(247,216,138,.25)" stroke="#F7D88A" stroke-width="1.2"/></g>`).join('')}</g>`; }
    else if(sg.type==='wash'){ s+=`<ellipse id="sg-${sg.id}" class="sign off" cx="${sg.anchor[0]}" cy="${sg.anchor[1]}" rx="${sg.r[0]}" ry="${sg.r[1]}" fill="url(#coolWash)" pointer-events="none"/>`; }
  });
  $('#gSigns').innerHTML=s;
  ['pupR','pupL'].forEach(p=>$('#'+p).classList.remove('wide')); $('#eyes').classList.remove('sleepy');
  document.querySelectorAll('#world .org-body').forEach(g=>g.classList.remove('breathe'));
};
HS.setSign=function(sg,on,t){
  if(sg.type==='wash') $('#sg-'+sg.id).classList.toggle('off',!on);
  else if(sg.type==='lids') $('#eyes').classList.toggle('sleepy',on);
  else if(sg.type==='ripple'||sg.type==='glyphs'){ const g=$('#sg-'+sg.id); g.classList.toggle('off',!on); if(sg.type==='ripple') g.querySelectorAll('.beat').forEach(b=>b.classList.toggle('calm',(sg.calmAt||[]).includes(t))); }
  else if(sg.type==='pupils'){ ['pupR','pupL'].forEach(p=>$('#'+p).classList.toggle('wide',on)); }
  else if(sg.type==='breathe'){ $(`#o-${sg.org} .org-body`).classList.toggle('breathe',on); }
};

/* end glyphs: stimulates → arrow, inhibits → bar, modulates → diamond */
function endGlyph(kind,x,y,a,op,c){
  const head=`<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)})" opacity="${op}">`;
  if(kind==='bar') return head+`<rect x="-2" y="-9" width="4" height="18" rx="1.5" fill="${c}"/></g>`;
  if(kind==='diamond') return head+`<path d="M-13 0 L-6 -6.5 L1 0 L-6 6.5Z" fill="#0B171C" stroke="${c}" stroke-width="2"/></g>`;
  return head+`<path d="M-10 -6 L2 0 L-10 6Z" fill="${c}"/></g>`;
}

const labEls=new Map(), hsEls=new Map();
HS.renderOverlay=function(){
  const W=app.clientWidth,H=app.clientHeight, project=HS.project;
  overlay.setAttribute('viewBox',`0 0 ${W} ${H}`);
  let svg='';
  Object.entries(ROUTES).forEach(([id,r])=>{
    const st=rstate[id]; if(st==='hide'||st==='ghost'||drawing[id]) return;
    const el=pathEl[id], L=el.getTotalLength(), p=el.getPointAtLength(L), q=el.getPointAtLength(Math.max(0,L-5));
    const [x1,y1]=project(q.x,q.y), [x2,y2]=project(p.x,p.y), a=Math.atan2(y2-y1,x2-x1)*180/Math.PI;
    svg+=endGlyph(r.end||(r.kind==='fb'?'bar':'arrow'),x2,y2,a,st==='faint'?.3:1,COL[r.kind]);
  });
  HS.getMarks().forEach(([id,t])=>{ const [wx,wy]=HS.ptOn(id,t); const [x,y]=project(wx,wy); svg+=`<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle r="10" fill="#0B171C" stroke="#FFB547" stroke-width="1.5"/><path d="M-4.5 -4.5 L4.5 4.5 M4.5 -4.5 L-4.5 4.5" stroke="#FFB547" stroke-width="2" stroke-linecap="round"/></g>`; });
  if(pulse.on){
    const c=COL[ROUTES[pulse.route].kind], len=pathEl[pulse.route].getTotalLength(), gap=Math.min(.03,9/len);
    for(let j=6;j>=1;j--){ const t=pulse.t-j*gap; if(t<=0) continue; const [tx,ty]=project(...HS.ptOn(pulse.route,t)); svg+=`<circle cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="${(3.4*(1-j/8)+.8).toFixed(2)}" fill="${c}" opacity="${(.55*(1-j/7)).toFixed(2)}"/>`; }
    const [x,y]=project(...HS.ptOn(pulse.route,pulse.t)); svg+=`<circle cx="${x}" cy="${y}" r="17" fill="${c}" opacity=".16"/><circle cx="${x}" cy="${y}" r="8" fill="${c}" opacity=".5"/><circle cx="${x}" cy="${y}" r="3.6" fill="#fff"/>`;
  }
  const now=performance.now();
  for(let i=fx.length-1;i>=0;i--){ const f=fx[i], k=(now-f.t0)/f.dur; if(k>=1){ fx.splice(i,1); continue; } const e=1-Math.pow(1-k,2), [x,y]=project(f.p[0],f.p[1]); svg+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(f.r0+(f.r1-f.r0)*e).toFixed(1)}" fill="none" stroke="${f.c}" stroke-width="${f.w}" opacity="${((1-k)*.75).toFixed(2)}"/>`; }

  const items=HS.getLabels().slice();
  if(HS.ov.showAll){ HS.orgKeys().forEach(k=>{ if(!items.some(i=>i.org===k)) items.push({key:'all-'+k,org:k,text:HS.orgName(k),anchor:HS.wc(k),dx:34,dy:-20,info:k}); }); }
  const hk=HS.ov.hoverKey;
  if(hk && !items.some(i=>i.org===hk)) items.push({key:'hover',org:hk,text:HS.orgName(hk),anchor:HS.wc(hk),dx:24,dy:-24,cls:'hover'});
  const seen=new Set(), placed=[], hots=HS.getHotspots();
  hots.forEach(h=>{ const [x,y]=project(h.anchor[0],h.anchor[1]); placed.push({x:x+(h.dx||0)-17,y:y+(h.dy||0)-17,w:34,h:34}); });
  items.forEach(it=>{
    const [px,py]=project(it.anchor[0],it.anchor[1]); if(px<-20||py<40||px>W+20||py>H+20) return;
    seen.add(it.key); let el=labEls.get(it.key);
    if(!el){ el=document.createElement('div'); labelsEl.appendChild(el); labEls.set(it.key,el); }
    const html=`<span>${it.text}</span>${it.lead?`<button class="leadchip" title="${it.lead.why}">↗ ${HS.scenes[it.lead.scene].pathways[it.lead.path].name}</button>`:''}${it.cell?'<button class="cell" data-cell="1">Cell ›</button>':''}${it.info?`<button class="i" aria-label="About ${it.text}">i</button>`:''}`;
    if(el._html!==html){ el.innerHTML=html; el._html=html; }
    el.className='lab'+(it.cls?' '+it.cls:''); el._it=it;
    const [ax,ay]=project(it.anchor[0],it.anchor[1]); const w=el.offsetWidth, h=el.offsetHeight;
    let lx=it.dx<0?ax+it.dx-w:ax+it.dx, ly=ay+it.dy-h/2;
    lx=Math.max(8,Math.min(W-w-8,lx)); ly=Math.max(74,Math.min(H-h-8,ly));
    for(let n=0;n<14;n++){ const hit=placed.find(p=>lx<p.x+p.w+6&&lx+w+6>p.x&&ly<p.y+p.h+5&&ly+h+5>p.y); if(!hit) break; ly=it.dy<0?hit.y-h-5:hit.y+hit.h+5; if(ly<74||ly>H-h-8){ ly=Math.max(74,Math.min(H-h-8,ly)); lx=it.dx<0?hit.x-w-8:hit.x+hit.w+8; } }
    placed.push({x:lx,y:ly,w,h});
    el.style.transform=`translate(${lx.toFixed(1)}px,${ly.toFixed(1)}px)`;
    if(!it.noLeader){ const ex=it.dx<0?lx+w:lx, ey=ly+h/2; svg+=`<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="#3E6D79" stroke-width="1"/><circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="2.2" fill="#6FA0AC"/>`; }
  });
  labEls.forEach((el,k)=>{ if(!seen.has(k)){ el.remove(); labEls.delete(k); } });
  const hseen=new Set();
  hots.forEach(h=>{
    hseen.add(h.id); let b=hsEls.get(h.id);
    if(!b){ b=document.createElement('button'); b.addEventListener('click',()=>b._h.onClick()); labelsEl.appendChild(b); hsEls.set(h.id,b); }
    b._h=h; const cls='hs '+(h.cls||''); if(b.className!==cls) b.className=cls; if(b.textContent!==String(h.num)) b.textContent=h.num;
    if(b.getAttribute('aria-label')!==h.aria) b.setAttribute('aria-label',h.aria);
    const [x,y]=project(h.anchor[0],h.anchor[1]); b.style.transform=`translate(${(x+(h.dx||0)).toFixed(1)}px,${(y+(h.dy||0)).toFixed(1)}px)`;
  });
  hsEls.forEach((b,k)=>{ if(!hseen.has(k)){ b.remove(); hsEls.delete(k); } });
  overlay.innerHTML=svg;
};
HS.focusHotspot=id=>{ const b=hsEls.get(id); if(b) b.focus(); };

labelsEl.addEventListener('click',e=>{
  const lab=e.target.closest('.lab'); if(!lab) return;
  if(e.target.closest('.i')) HS.showInfoCard(lab._it.info,e.target.closest('.i'));
  if(e.target.closest('.cell')) HS.openCell(lab._it.cell);
  if(e.target.closest('.leadchip')) HS.followLead(lab._it.lead);
});
})(window.HS);
