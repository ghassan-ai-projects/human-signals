/* Floating UI: ⓘ cards, toast, tips, organ lighting, trigger list, systems tree, search palette,
   Read the route sheet, layers and settings. */
(function(HS){
const $=HS.$, app=HS.app, world=$('#world');

/* ---------- ⓘ cards ---------- */
const cards=$('#cards');
const LEVELNAME={body:'Whole body · plain story',organ:'Organ · pathway names',structure:'Close-up · precise location'};
HS.closeCards=()=>{ cards.querySelectorAll('.card').forEach(c=>c.remove()); };
HS.showInfoCard=function(key,anchorEl){
  const inf=HS.info(key); if(!inf) return; const L=HS.level();
  const r=anchorEl.getBoundingClientRect(), a=app.getBoundingClientRect();
  let x=r.right-a.left+10, y=r.top-a.top-8; if(x+300>app.clientWidth-10) x=r.left-a.left-310; y=Math.max(76,Math.min(app.clientHeight-200,y));
  HS.closeCards();
  cards.insertAdjacentHTML('beforeend',`<div class="card float" role="dialog" aria-label="${inf.t}" style="left:${x}px;top:${y}px"><button class="x" aria-label="Close">×</button><div class="lvl">${LEVELNAME[L]}</div><h5>${inf.t}</h5><p>${inf[L]}</p><div class="row2"><span class="ev">Illustrative · not reviewed</span><button class="more">More ›</button></div></div>`);
  const c=cards.querySelector('.card'); c.querySelector('.x').onclick=()=>{ HS.closeCards(); anchorEl.focus(); };
  c.querySelector('.more').onclick=()=>{ HS.closeCards(); HS.openMore(key,anchorEl); };
  c.querySelector('.more').focus();
};

const cap=s=>/^[A-Z]{2,}/.test(s)?s:s.charAt(0).toUpperCase()+s.slice(1);
const HOW={blood:'Carried in the blood.',portal:'Carried a short way in portal blood, straight to the next gland.','schematic route':'The line shows that a message travels and where it arrives, not the path it takes.',nerve:'Carried along nerves.',feedback:'Acts back on an earlier step.','acts on the clock':'Acts back on the body clock.'};
HS.showRouteCard=function(id,ev){
  const r=HS.routeDef(id), label=r.label||HS.gateLabel(id)||'signal · route', [sig,how]=label.split(' · ');
  const key=Object.keys(HS.GLOSSARY).find(k=>k.toLowerCase()===sig.toLowerCase()), def=key?HS.GLOSSARY[key]:'', pk=HS.passKeyForRoute(id);
  const carrier=HS.carrierOf(id), carrLbl={blood:'carried in the blood',nerve:'a nerve or light signal',portal:'a short portal hop',feedback:'acts back — feedback'}[carrier];
  const cc={blood:'#7CCBFF',nerve:'#C4A8FF',portal:'#7CCBFF',feedback:'#FFB547'}[carrier], dz=HS.routeTexture(id);
  const swatch=`<svg width="30" height="10" aria-hidden="true"><line x1="2" y1="5" x2="28" y2="5" stroke="${cc}" stroke-width="2.6" stroke-linecap="round"${dz?` stroke-dasharray="${dz}"`:''}/></svg>`;
  const a=app.getBoundingClientRect(); let x=ev.clientX-a.left+16, y=ev.clientY-a.top-12;
  if(x+300>app.clientWidth-10) x-=332; y=Math.max(76,Math.min(app.clientHeight-230,y));
  HS.closeCards();
  cards.insertAdjacentHTML('beforeend',`<div class="card float" role="dialog" aria-label="${cap(sig)}" style="left:${x}px;top:${y}px"><button class="x" aria-label="Close">×</button><div class="lvl">Signal · ${r.kind==='nerve'?'nerve route':r.kind==='fb'?'acts back':'message'}</div><h5>${cap(sig)}</h5><p>${def} ${HOW[how]||''}</p><div class="carr">${swatch}<span>${carrLbl}</span></div><div class="row2"><span class="ev">Illustrative · not reviewed</span>${HS.advOn&&pk?'<button class="more" data-passport="1">Passport ›</button>':''}</div></div>`);
  const c=cards.querySelector('.card'); c.querySelector('.x').onclick=()=>HS.closeCards(); c.querySelector('.x').focus();
  const pb=c.querySelector('[data-passport]'); if(pb){ pb.onclick=()=>{ HS.closeCards(); HS.openPassport(pk,null); }; pb.focus(); }
  HS.say(`${cap(sig)}. ${def} ${HOW[how]||''}`);
};

/* ---------- toast & tips ---------- */
let toastT=0; const toastEl=document.createElement('div'); toastEl.className='tip float'; toastEl.style.cssText='left:50%;top:84px;transform:translateX(-50%);display:none'; toastEl.setAttribute('role','status'); app.appendChild(toastEl);
HS.toast=m=>{ toastEl.textContent=m; toastEl.style.display='flex'; clearTimeout(toastT); toastT=setTimeout(()=>toastEl.style.display='none',2800); };
const tipsSeen=HS.tipsSeen=new Set(), tipsBox=$('#tips'); HS.tipsOn=true; HS._curTip=null;
function renderTip(key,text,pos){
  tipsBox.innerHTML='';   // one tip at a time: a newer tip replaces the older one
  const d=document.createElement('div'); d.className='tip float'; d.dataset.key=key;
  Object.entries(pos).forEach(([k,v])=>d.style[k]=v+'px');
  d.innerHTML=`<svg class="bulb" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>${text}</span><button aria-label="Dismiss tip">×</button>`;
  d.querySelector('button').onclick=()=>d.remove(); tipsBox.appendChild(d);
}
HS.tip=function(key,text,pos){
  HS._curTip={key,text,pos};   // remembered so the hints control can bring it back
  if(!HS.tipsOn||tipsSeen.has(key)) return; tipsSeen.add(key);
  renderTip(key,text,pos);
};
HS.clearTip=key=>{ const d=tipsBox.querySelector(`[data-key="${key}"]`); if(d) d.remove(); };
/* hints control: one switch for all the little bulb tips */
HS.setTips=function(on,announce){
  HS.tipsOn=!!on;
  const b=$('#bHints'), t=$('#tTips');
  if(b){ b.setAttribute('aria-pressed',HS.tipsOn); b.setAttribute('aria-label',HS.tipsOn?'Hints on':'Hints off'); }
  if(t) t.setAttribute('aria-checked',HS.tipsOn);
  if(!HS.tipsOn){ tipsBox.innerHTML=''; }
  else if(HS._curTip){ tipsSeen.delete(HS._curTip.key); renderTip(HS._curTip.key,HS._curTip.text,HS._curTip.pos); tipsSeen.add(HS._curTip.key); }
  if(announce) HS.toast(HS.tipsOn?'Hints on: a short tip appears once at each depth.':'Hints hidden. Turn them back on any time with the bulb, or H.');
};

/* ---------- organ lighting ---------- */
const light=HS.light={lit:new Set(),dim:null,preview:null};
HS.applyOrgs=function(){ document.querySelectorAll('#world .org').forEach(g=>{ const k=g.dataset.org; const pv=light.preview&&light.preview.has(k); g.classList.toggle('lit',light.lit.has(k)||pv); g.classList.toggle('hov',!!pv); g.classList.toggle('dim',!!light.dim&&!light.dim.has(k)&&!pv); }); };
world.addEventListener('pointerover',e=>{ const g=e.target.closest('.org'); const k=g?g.dataset.org:null; if(k!==HS.ov.hoverKey){ HS.ov.hoverKey=k; HS.renderOverlay(); } });
world.addEventListener('pointerleave',()=>{ HS.ov.hoverKey=null; HS.renderOverlay(); });
world.addEventListener('click',e=>{ if(HS.cam.suppressClick) return; const g=e.target.closest('.org'); if(g) HS.onOrgClick(g.dataset.org); });

/* ---------- triggers ---------- */
HS.TRIGGERS=[
 {id:'stress',title:'Something stressful happens',syn:['stress','threat','fight or flight'],icon:'<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill="currentColor"/>'},
 {id:'meal',title:'You skip a meal',syn:['fasting','hunger','glucose'],icon:'<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'},
 {id:'dark',title:'It gets dark',syn:['night','melatonin','sleep'],icon:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="currentColor"/>'}
];
HS.renderTriggers=function(){
  $('#triggers').innerHTML=HS.TRIGGERS.map(t=>{ const S=HS.scenes[t.id]; return `<button class="trig${S?'':' soon'}" data-trigger="${t.id}" aria-pressed="false"><span class="ti"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">${t.icon}</svg></span><span>${t.title}<small>${S?S.trigger.sub:'Not in this concept'}</small></span></button>`; }).join('');
};
/* Continue: the last pathway, with how much of it has been explored (quiet, no score) */
HS.renderContinue=function(){
  const box=$('#continue'), l=HS.store&&HS.store.last, S=l&&HS.scenes[l.scene], p=S&&S.pathways[l.path];
  const here=p&&HS.E.state==='triggered'&&HS.E.sceneId===l.scene&&HS.E.route===l.path;
  if(!p||here){ box.innerHTML=''; return; }
  const pr=HS.progressOf(l.scene,l.path), total=p.hots.length+(p.gate?1:0), done=pr.visited+(p.gate&&pr.revealed?1:0);
  if(!done){ box.innerHTML=''; return; }
  box.innerHTML=`<button class="trig continue" data-cont="1"><span class="ti"><svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5l12 7-12 7z" fill="currentColor"/></svg></span><span>Continue · ${p.name}<small>${S.trigger.title} · ${done} of ${total} explored</small></span></button><div class="divider"></div>`;
};
$('#continue').addEventListener('click',e=>{ if(e.target.closest('[data-cont]')){ const l=HS.store.last; HS.openPathway(l.scene,l.path,false); } });
HS.renderSummary=function(){
  const d=HS.exportProgress(), v=Object.values(d.visited).reduce((a,x)=>a+x.length,0), r=Object.values(d.revealed).filter(Boolean).length, a=(HS.store.attempts||[]).length;
  $('#psum').textContent=v||r||a?`${v} steps visited · ${r} feedback ${r===1?'loop':'loops'} revealed · ${a} ${a===1?'answer':'answers'} checked`:'Nothing explored yet';
};
HS.syncTriggers=()=>document.querySelectorAll('[data-trigger]').forEach(b=>b.setAttribute('aria-pressed',HS.E.sceneId===b.dataset.trigger&&HS.E.state==='triggered'));
$('#triggers').addEventListener('click',e=>{ const b=e.target.closest('[data-trigger]'); if(b) HS.clickTrigger(b.dataset.trigger); });
/* hovering a trigger previews the organs it will involve */
let tpT=0;
$('#triggers').addEventListener('mouseover',e=>{ const b=e.target.closest('[data-trigger]'), S=b&&HS.scenes[b.dataset.trigger]; clearTimeout(tpT); tpT=setTimeout(()=>{ light.preview=S?new Set([...S.trigger.lights,...S.pathways[S.trigger.first].organs]):null; HS.applyOrgs(); },150); });
$('#triggers').addEventListener('mouseleave',()=>{ clearTimeout(tpT); light.preview=null; HS.applyOrgs(); });

/* ---------- systems tree ---------- */
HS.TREE=[
 {id:'stress',label:'Stress response',dot:'#F08A66',children:[
  {id:'fastP',label:'Fast route',scene:'stress',path:'fast',sub:'nerves → adrenal medulla',organs:['brain','adr','heart','lungs','liver'],children:[{id:'adrenaline',ab:'ADR',label:'Adrenaline',organs:['adr','heart','lungs','liver']},{id:'noradrenaline',ab:'NA',label:'Noradrenaline',organs:['brain','adr','heart']}]},
  {id:'hpaP',label:'HPA axis',scene:'stress',path:'slow',sub:'hypothalamus → pituitary → adrenal',organs:['hyp','pit','adr','liver'],children:[{id:'crh',ab:'CRH',label:'CRH',organs:['hyp','pit']},{id:'acth',ab:'ACTH',label:'ACTH',organs:['pit','adr']},{id:'cortisol',ab:'CORT',label:'Cortisol',organs:['adr','liver']}]}]},
 {id:'thyroid',label:'Thyroid',dot:'#4FC3B2'},
 {id:'glucoseSys',label:'Blood glucose',dot:'#E0AE4A',children:[
  {id:'betweenP',label:'Between meals',scene:'meal',path:'between',sub:'pancreas → glucagon → liver',organs:['panc','liver','brain'],children:[{id:'glucagon',ab:'GCG',label:'Glucagon',organs:['panc','liver']},{id:'glucoseSig',ab:'GLU',label:'Glucose',organs:['int','liver','brain','muscle']}]},
  {id:'afterP',label:'After a meal',scene:'meal',path:'after',sub:'pancreas → insulin → liver, muscle',organs:['int','panc','liver','muscle'],children:[{id:'insulin',ab:'INS',label:'Insulin',organs:['panc','liver','muscle']}]}]},
 {id:'dopa',label:'Dopamine',dot:'#A58BF5'},
 {id:'rhythm',label:'Daily rhythms',dot:'#7C9BF0',children:[
  {id:'melP',label:'Melatonin at night',scene:'dark',path:'night',sub:'eyes → body clock → pineal',organs:['retina','scn','pineal','brain'],children:[{id:'melatonin',ab:'MEL',label:'Melatonin',organs:['pineal','scn','brain']}]}]}
];
const NODE=HS.NODE={}, PARENT={}; (function idx(list,parent){ list.forEach(n=>{ NODE[n.id]=n; if(parent) PARENT[n.id]=parent; if(n.children) idx(n.children,n.id); }); })(HS.TREE);
HS.selectedNode=null; const openNodes=new Set(['stress','fastP','hpaP']);
const CHEV='<svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
const treeEl=$('#tree');
HS.renderTree=function(){
  const rowHTML=(n,lvl)=>{
    const has=!!n.children, open=openNodes.has(n.id);
    let inner='';
    if(n.dot) inner=`<span class="chev">${has?CHEV:''}</span><span class="dot" style="background:${n.dot}"></span><span class="grow">${n.label}${has?'':' <small>· not in this concept</small>'}</span>`;
    else if(n.path) inner=`<span class="chev">${CHEV}</span><span class="grow">${n.label}<br><small>${n.sub}</small></span><span class="play-mini" data-play="1" aria-hidden="true"><svg width="10" height="10" viewBox="0 0 24 24"><path d="M7 5l12 7-12 7z" fill="currentColor"/></svg></span>`;
    else inner=`<span class="chev"></span><span class="ab">${n.ab}</span><span class="grow">${n.label}</span>`;
    return `<li role="none"><button class="row" role="treeitem" data-id="${n.id}" aria-level="${lvl}" ${has?`aria-expanded="${open}"`:''} aria-selected="${HS.selectedNode===n.id}">${inner}</button>${has&&open?`<ul role="group">${n.children.map(c=>rowHTML(c,lvl+1)).join('')}</ul>`:''}</li>`;
  };
  treeEl.innerHTML=HS.TREE.map(n=>rowHTML(n,1)).join('');
  const rows=treeEl.querySelectorAll('.row'), sel=HS.selectedNode&&treeEl.querySelector(`[data-id="${HS.selectedNode}"]`);
  rows.forEach(r=>{ r.tabIndex=-1; }); if(rows.length) (sel||rows[0]).tabIndex=0;   // one tab stop; arrows move within
};
HS.selectNode=id=>{
  HS.selectedNode=id; let top=id; for(let a=PARENT[id];a;a=PARENT[a]){ openNodes.add(a); top=a; }
  /* one system open at a time */
  HS.TREE.forEach(n=>{ if(n.id!==top) [n.id,...(n.children||[]).map(c=>c.id)].forEach(x=>openNodes.delete(x)); });
  if(NODE[id]&&NODE[id].path) openNodes.add(id);
  HS.renderTree(); HS.revealIn(treeEl.closest('.panel-scroll'),treeEl.querySelector(`[data-id="${id}"]`));
};
app.addEventListener('scroll',()=>{ app.scrollLeft=0; app.scrollTop=0; });
/* scroll a child into its own scroller only; scrollIntoView would also shift the fixed app frame */
HS.revealIn=function(sc,el){ if(!sc||!el) return; const r=el.getBoundingClientRect(), s=sc.getBoundingClientRect(); if(r.top<s.top) sc.scrollTop-=s.top-r.top+8; else if(r.bottom>s.bottom) sc.scrollTop+=r.bottom-s.bottom+8; app.scrollLeft=0; app.scrollTop=0; };
let pvT=0;   // hover preview waits 150 ms so sweeping the pointer across the tree doesn't flicker the body
treeEl.addEventListener('mouseover',e=>{ const r=e.target.closest('.row'); const n=r&&NODE[r.dataset.id]; const set=n&&n.organs?new Set(n.organs):null; clearTimeout(pvT); pvT=setTimeout(()=>{ if(String(set&&[...set])!==String(light.preview&&[...light.preview])){ light.preview=set; HS.applyOrgs(); } },150); });
treeEl.addEventListener('mouseleave',()=>{ clearTimeout(pvT); light.preview=null; HS.applyOrgs(); });
treeEl.addEventListener('focusin',e=>{ const r=e.target.closest('.row'); const n=r&&NODE[r.dataset.id]; light.preview=n&&n.organs?new Set(n.organs):null; HS.applyOrgs(); });
treeEl.addEventListener('focusout',()=>{ light.preview=null; HS.applyOrgs(); });
treeEl.addEventListener('click',e=>{
  const r=e.target.closest('.row'); if(!r) return; const n=NODE[r.dataset.id];
  if(n.dot && !n.children){ HS.toast(`${n.label} is not part of this concept. It uses the same scene template.`); return; }
  if(n.dot){ openNodes.has(n.id)?openNodes.delete(n.id):openNodes.add(n.id); HS.renderTree(); treeEl.querySelector(`[data-id="${n.id}"]`).focus(); return; }
  HS.selectNode(n.id); treeEl.querySelector(`[data-id="${n.id}"]`).focus();
  if(n.path) HS.openPathway(n.scene,n.path,!!e.target.closest('[data-play]')); else { HS.onSignalSelect(n); if(HS.advOn&&HS.NODE2PASS[n.id]) HS.openPassport(HS.NODE2PASS[n.id],r); }
});
/* WAI-ARIA tree keyboard model: Up/Down, Home/End, Right expands or enters, Left collapses or goes to parent, type-ahead */
const focusRow=id=>{ const r=treeEl.querySelector(`[data-id="${id}"]`); if(!r) return; treeEl.querySelectorAll('.row').forEach(x=>{ x.tabIndex=-1; }); r.tabIndex=0; r.focus({preventScroll:true}); HS.revealIn(treeEl.closest('.panel-scroll'),r); };
let typeBuf='', typeT=0;
treeEl.addEventListener('keydown',e=>{
  const rows=[...treeEl.querySelectorAll('.row')]; const i=rows.indexOf(document.activeElement); if(i<0) return;
  const n=NODE[rows[i].dataset.id], k=e.key, go=j=>{ e.preventDefault(); focusRow(rows[Math.max(0,Math.min(rows.length-1,j))].dataset.id); };
  if(k==='ArrowDown') go(i+1);
  else if(k==='ArrowUp') go(i-1);
  else if(k==='Home') go(0);
  else if(k==='End') go(rows.length-1);
  else if(k==='ArrowRight'){ e.preventDefault(); if(n.children&&!openNodes.has(n.id)){ openNodes.add(n.id); HS.renderTree(); focusRow(n.id); } else if(n.children) focusRow(n.children[0].id); }
  else if(k==='ArrowLeft'){ e.preventDefault(); if(n.children&&openNodes.has(n.id)){ openNodes.delete(n.id); HS.renderTree(); focusRow(n.id); } else if(PARENT[n.id]) focusRow(PARENT[n.id]); }
  else if(k.length===1&&/\S/.test(k)&&!e.metaKey&&!e.ctrlKey&&!e.altKey){
    e.preventDefault(); clearTimeout(typeT); typeBuf+=k.toLowerCase(); typeT=setTimeout(()=>{ typeBuf=''; },600);
    const order=typeBuf.length>1?rows.slice(i).concat(rows.slice(0,i)):rows.slice(i+1).concat(rows.slice(0,i+1));
    const hit=order.find(r=>NODE[r.dataset.id].label.toLowerCase().startsWith(typeBuf)); if(hit) focusRow(hit.dataset.id);
  }
});
HS.pickNode=function(id){ const p=$('#panel'); if(p.classList.contains('closed')) $('#bSystems').click(); HS.selectNode(id); HS.onSignalSelect(NODE[id]); const r=treeEl.querySelector(`[data-id="${id}"]`); if(r) r.focus({preventScroll:true}); if(HS.advOn&&HS.NODE2PASS[id]) HS.openPassport(HS.NODE2PASS[id],r); };

/* ---------- search palette ---------- */
HS.searchEntries=function(){
  const out=HS.TRIGGERS.map(t=>({t:t.title,k:'Trigger',syn:t.syn,go:{trigger:t.id}})), seen=new Set(out.map(x=>x.k+x.t));
  Object.values(HS.scenes).forEach(S=>(S.search||[]).forEach(x=>{ if(!seen.has(x.k+x.t)){ seen.add(x.k+x.t); out.push(x); } }));
  return out;
};
HS.runGo=function(go){
  if(go.trigger) HS.clickTrigger(go.trigger);
  else if(go.pathway) HS.openPathway(go.pathway[0],go.pathway[1],false);
  else if(go.node) HS.pickNode(go.node);
  else if(go.organ){ HS.onOrgClick(go.organ); light.lit=new Set([...light.lit,go.organ]); HS.applyOrgs(); }
};
HS.openSearch=function(){
  if($('#palette')) return; HS.closeCards();
  const d=document.createElement('div'); d.id='palette'; d.className='palette float'; d.setAttribute('role','dialog'); d.setAttribute('aria-label','Search');
  d.innerHTML=`<div class="pin"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><input id="q" placeholder="Search signals, organs, triggers" aria-label="Search signals, organs and triggers" role="combobox" aria-expanded="true" aria-controls="qList" aria-autocomplete="list" autocomplete="off" spellcheck="false"><kbd>esc</kbd></div><ul class="qlist" id="qList" role="listbox" aria-label="Results"></ul><div class="pfoot">↑ ↓ to move · Enter to open · synonyms like “epinephrine” work</div>`;
  app.appendChild(d);
  const input=d.querySelector('input'), list=d.querySelector('ul'), all=HS.searchEntries(); let sel=0, res=[];
  const draw=()=>{
    const q=input.value.trim().toLowerCase();
    res=all.filter(s=>!q||s.t.toLowerCase().includes(q)||s.k.toLowerCase().includes(q)||s.syn.some(x=>x.includes(q)));
    sel=Math.max(0,Math.min(sel,res.length-1));
    list.innerHTML=res.length?res.map((s,i)=>{ const via=q&&!s.t.toLowerCase().includes(q)?s.syn.find(x=>x.includes(q)):null; return `<li role="option" id="qo${i}" data-i="${i}" aria-selected="${i===sel}"><span>${s.t}${via?`<span class="via">· ${via}</span>`:''}</span><small>${s.k}</small></li>`; }).join(''):'<li class="none">No match. Try a signal like ACTH, an organ, or “stress”.</li>';
    if(res.length){ input.setAttribute('aria-activedescendant','qo'+sel); HS.revealIn(list,list.querySelector(`#qo${sel}`)); } else input.removeAttribute('aria-activedescendant');
    const g=res[sel]&&res[sel].go, S=g&&(HS.scenes[g.trigger]||(g.pathway&&HS.scenes[g.pathway[0]]));   // the highlighted result lights its organs
    light.preview=!g?null:g.organ?new Set([g.organ]):g.node?new Set(NODE[g.node].organs):g.pathway?new Set(S.pathways[g.pathway[1]].organs):S?new Set([...S.trigger.lights,...S.pathways[S.trigger.first].organs]):null;
    HS.applyOrgs();
  };
  const choose=i=>{ const s=res[i]; if(!s) return; HS.closeSearch(false); HS.runGo(s.go); };
  input.addEventListener('input',()=>{ sel=0; draw(); });
  input.addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'){ e.preventDefault(); sel=Math.min(res.length-1,sel+1); draw(); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); sel=Math.max(0,sel-1); draw(); }
    else if(e.key==='Enter'){ e.preventDefault(); choose(sel); }
    else if(e.key==='Escape'){ e.preventDefault(); HS.closeSearch(true); }
  });
  list.addEventListener('mousemove',e=>{ const li=e.target.closest('[data-i]'); if(li&&+li.dataset.i!==sel){ sel=+li.dataset.i; draw(); } });
  list.addEventListener('click',e=>{ const li=e.target.closest('[data-i]'); if(li) choose(+li.dataset.i); });
  draw(); input.focus();
};
HS.closeSearch=function(focus){ const d=$('#palette'); if(!d) return; d.remove(); light.preview=null; HS.applyOrgs(); if(focus) $('#bSearch').focus(); };
document.addEventListener('pointerdown',e=>{ if($('#palette')&&!e.target.closest('#palette,#bSearch')) HS.closeSearch(false); });

/* ---------- Read the route ---------- */
HS.openRead=function(){
  const S=HS.E.scene; if(!S) return; const s=$('#sheet');
  HS.sheetReturn=$('#bRead'); tipsBox.innerHTML='';
  s.setAttribute('aria-label','Read the route');
  s.innerHTML=`<button class="x" aria-label="Close">×</button><h3>Read the route</h3><p class="sub">${S.trigger.title} · illustrative draft, not reviewed science</p>
  ${HS.E.route?`<span class="eyebrow">${S.pathways[HS.E.route].name} at a glance</span><div class="diagram">${HS.causalSVG(S,HS.E.route,HS.isRevealed)}</div>`:''}${S.read({revealed:HS.isRevealed})}
  <h4>About routes</h4><p class="sub" style="margin:0 0 8px">Routes show that a message travels and where it arrives. They are not drawings of blood vessels or nerves. The line's texture shows how the message is carried; the arrow end shows what it does. Time words show order and rough timescale, not measured time.</p>${HS.grammarLegend()}`;
  s.classList.remove('closed'); s.querySelector('.x').onclick=()=>HS.closeRead(true); s.querySelector('.x').focus();
};
HS.closeRead=function(focus){
  const s=$('#sheet'); if(s.classList.contains('closed')) return; s.classList.add('closed');
  const ret=HS.sheetReturn; HS.sheetReturn=null;
  if(focus&&ret&&document.contains(ret)) ret.focus();
};

/* ---------- layers & settings ---------- */
function applyLayer(name,on,user){
  if(name==='nervous') $('#gNerv').setAttribute('opacity',on?1:.35);
  else if(name==='blood'){ $('#o-heart').classList.toggle('lit',on); if(on&&user) HS.toast('Blood layer: the heart and blood-borne routes are emphasised. No vessel tree is drawn, because routes are schematic.'); }
  else if(name==='endocrine'){ document.querySelectorAll('#o-adr,#o-thy,#o-panc,#o-hyp,#o-pit').forEach(g=>g.style.filter=on?'':'saturate(.2)'); }
}
HS.setLayer=(name,on)=>{ document.querySelector(`[data-layer="${name}"]`).setAttribute('aria-checked',on); applyLayer(name,on,false); };
function pop(btn,id){ const p=$(id), open=p.hidden; document.querySelectorAll('.pop').forEach(x=>x.hidden=true); document.querySelectorAll('#bLayers,#bSettings').forEach(b=>b.setAttribute('aria-expanded','false')); if(open){ p.hidden=false; btn.setAttribute('aria-expanded','true'); } }
$('#bLayers').addEventListener('click',e=>{ e.stopPropagation(); pop(e.currentTarget,'#popLayers'); });
$('#bHints').addEventListener('click',()=>HS.setTips(!HS.tipsOn,true));
$('#bSettings').addEventListener('click',e=>{ e.stopPropagation(); pop(e.currentTarget,'#popSettings'); });
document.addEventListener('click',e=>{ if(!e.target.closest('.pop')&&!e.target.closest('#bLayers,#bSettings')){ document.querySelectorAll('.pop').forEach(x=>x.hidden=true); document.querySelectorAll('#bLayers,#bSettings').forEach(b=>b.setAttribute('aria-expanded','false')); } });
document.querySelectorAll('.toggle[role="switch"]').forEach(t=>t.addEventListener('click',()=>{
  const on=t.getAttribute('aria-checked')!=='true'; t.setAttribute('aria-checked',on);
  if(t.id==='tMotion'){ HS.userRM=on; HS.applyRM(); HS.stopPlay(); HS.setPlayUI(); }
  else if(t.id==='tLabels'){ HS.ov.showAll=on; HS.renderOverlay(); }
  else if(t.id==='tTips'){ HS.setTips(on); }
  else if(t.id==='tConcise'){ HS.setConcise(on,true); }
  else if(t.dataset.layer) applyLayer(t.dataset.layer,on,true);
}));
})(window.HS);
