/* Advanced flow (optional, off by default): named receptors and molecules at organ zoom, molecule
   classes on route labels, and a signal passport for every signal. The guided story never depends on it.
   Undergraduate-physiology level, illustrative draft; requires scientific review before release. */
(function(HS){
const $=HS.$, app=HS.app;
const PREF='hs-v4-prefs';   // a preference, kept apart from progress so Erase progress leaves it alone
let prefs={advanced:false,concise:false};
try{ const raw=localStorage.getItem(PREF); if(raw) prefs=Object.assign(prefs,JSON.parse(raw)); }catch(e){}
HS.advOn=!!prefs.advanced; HS.conciseSay=!!prefs.concise;
HS.setConcise=function(on,announce){ HS.conciseSay=!!on; prefs.concise=HS.conciseSay; try{ localStorage.setItem(PREF,JSON.stringify(prefs)); }catch(e){} const t=$('#tConcise'); if(t) t.setAttribute('aria-checked',HS.conciseSay); if(announce) HS.say(HS.conciseSay?'Concise narration on. Announcements are trimmed to the essentials.':'Full narration on.'); };

const CLS=HS.CLS={peptide:{name:'Peptide',col:'#7CCBFF'},steroid:{name:'Steroid',col:'#F0C27E'},amine:{name:'Amine',col:'#9BEFC9'},fuel:{name:'Fuel',col:'#F7D88A'},nerve:{name:'Nerve signal',col:'#C4A8FF'}};
const RK={surface:'On the surface',inside:'Inside the cell',transporter:'Transporter',synapse:'At a synapse'};

HS.PASSPORTS={
 sympStress:{name:'Sympathetic nerve signals',cls:'nerve',clsName:'Electrical signals, passed on by chemical messengers',rk:'synapse',ss:'seconds',
  from:'Hypothalamus and brainstem',made:'Relayed down the spinal cord to sympathetic nerves',travels:'Along nerves; fibres reach the adrenal medulla directly, without a relay',
  receptor:'At the adrenal medulla: acetylcholine on nicotinic receptors of chromaffin cells',speed:'Within seconds',off:'Acetylcholine is broken down at once by acetylcholinesterase'},
 adrenaline:{name:'Adrenaline',aka:'epinephrine',cls:'amine',clsName:'Catecholamine (an amine)',rk:'surface',ss:'seconds',
  from:'The amino acid tyrosine',made:'Chromaffin cells of the adrenal medulla',travels:'Dissolved in the blood',
  receptor:'On the cell surface: alpha and beta adrenergic receptors (β1 in heart muscle, β2 in airway muscle)',speed:'Within seconds',off:'Taken up by cells and broken down by enzymes within minutes'},
 crh:{name:'CRH',aka:'corticotropin-releasing hormone',cls:'peptide',clsName:'Peptide',rk:'surface',ss:'minutes',
  from:'Amino acids, cut from a larger precursor protein',made:'Neurons of the paraventricular nucleus of the hypothalamus',travels:'In portal blood, straight to the anterior pituitary',
  receptor:'On the cell surface: CRH receptor 1 on corticotroph cells',speed:'Within minutes',off:'Broken down by enzymes'},
 acth:{name:'ACTH',aka:'adrenocorticotropic hormone',cls:'peptide',clsName:'Peptide',rk:'surface',ss:'minutes',
  from:'Cut from the precursor protein POMC',made:'Corticotroph cells of the anterior pituitary',travels:'Dissolved in the blood',
  receptor:'On the cell surface: the MC2 receptor on adrenal cortex cells, which raises cAMP',speed:'Within minutes',off:'Broken down by enzymes in the blood'},
 cortisol:{name:'Cortisol',aka:'a glucocorticoid',cls:'steroid',clsName:'Steroid',rk:'inside',ss:'hours',
  from:'Cholesterol',made:'Zona fasciculata of the adrenal cortex',travels:'Mostly bound to carrier proteins in the blood; the small free share is what acts',
  receptor:'Inside the cell: the glucocorticoid receptor, which moves to the nucleus and changes gene activity',speed:'Gene effects build over hours; some faster effects also exist',off:'Inactivated mainly by the liver'},
 glucagon:{name:'Glucagon',cls:'peptide',clsName:'Peptide',rk:'surface',ss:'minutes',
  from:'Cut from the precursor proglucagon',made:'Alpha cells of the pancreatic islets',travels:'Dissolved in the blood; it reaches the liver first through the portal vein',
  receptor:'On the cell surface: the glucagon receptor, which raises cAMP',speed:'Within minutes',off:'Cleared mainly by the liver and kidneys'},
 insulin:{name:'Insulin',cls:'peptide',clsName:'Peptide',rk:'surface',ss:'minutes',
  from:'Cut from proinsulin, with C-peptide released alongside',made:'Beta cells of the pancreatic islets',travels:'Dissolved in the blood; it reaches the liver first through the portal vein',
  receptor:'On the cell surface: the insulin receptor, a tyrosine kinase',speed:'Within minutes',off:'Cleared mainly by the liver'},
 glucose:{name:'Glucose',aka:'blood sugar',cls:'fuel',clsName:'Fuel, not a hormone',rk:'transporter',ss:'continuous',
  from:'Digested carbohydrate, or made by the liver',made:'Absorbed by the intestine; released by the liver',travels:'Dissolved in the blood',
  receptor:'No receptor: it enters cells through GLUT and SGLT transporters, and cells sense it through their own metabolism',speed:'All the time',off:'Used by cells, or stored as glycogen and fat'},
 light:{name:'Light signals',cls:'nerve',clsName:'Electrical signals, passed on by chemical messengers',rk:'synapse',ss:'seconds',
  from:'Light absorbed by melanopsin',made:'Melanopsin-containing retinal ganglion cells',travels:'Along the retinohypothalamic tract to the SCN',
  receptor:'At the SCN: glutamate and PACAP receptors',speed:'Within seconds to minutes',off:'Signalling eases as light fades'},
 sympPineal:{name:'Nerve signals to the pineal gland',cls:'nerve',clsName:'Electrical signals, passed on by chemical messengers',rk:'synapse',ss:'minutes',
  from:'The body clock (SCN)',made:'SCN → paraventricular nucleus → spinal cord → superior cervical ganglion',travels:'Along sympathetic nerves that return up the neck to the pineal gland',
  receptor:'At pineal cells: noradrenaline on β1 (helped by α1) adrenergic receptors',speed:'Over minutes, all night while it stays dark',off:'Light stops the SCN signal; noradrenaline is taken back up'},
 melatonin:{name:'Melatonin',cls:'amine',clsName:'Indoleamine (an amine)',rk:'surface',ss:'all night',
  from:'Serotonin, made from the amino acid tryptophan',made:'Pinealocytes of the pineal gland, mainly at night',travels:'In the blood, partly bound to albumin',
  receptor:'On the cell surface: MT1 and MT2 receptors, including in the SCN',speed:'Over the evening and night',off:'Broken down mainly by the liver'},
 noradrenaline:{name:'Noradrenaline',aka:'norepinephrine',cls:'amine',clsName:'Catecholamine (an amine)',rk:'synapse',ss:'seconds',
  from:'The amino acid tyrosine',made:'Sympathetic nerve endings, and some adrenal medulla cells',travels:'Released onto target cells from nerve endings; some spills into the blood',
  receptor:'On the cell surface: alpha and beta adrenergic receptors',speed:'Within seconds',off:'Taken back up into nerve endings and broken down by enzymes'}
};
HS.NODE2PASS={adrenaline:'adrenaline',noradrenaline:'noradrenaline',crh:'crh',acth:'acth',cortisol:'cortisol',glucagon:'glucagon',glucoseSig:'glucose',insulin:'insulin',melatonin:'melatonin'};
const SIG2PASS={adrenaline:'adrenaline',crh:'crh',acth:'acth',cortisol:'cortisol',glucagon:'glucagon',insulin:'insulin',glucose:'glucose',melatonin:'melatonin'};

HS.passKeyForRoute=function(id){
  const r=HS.routeDef(id); if(!r) return null; if(r.pass) return r.pass;
  const lab=r.label||HS.gateLabel(id)||''; return SIG2PASS[lab.split(' · ')[0].toLowerCase()]||null;
};
/* route label text: guided as authored; Advanced names the molecule class */
HS.routeText=function(id){
  const r=HS.routeDef(id), lab=r.label||HS.gateLabel(id)||'';
  if(!HS.advOn) return lab;
  const k=HS.passKeyForRoute(id), pp=k&&HS.PASSPORTS[k]; if(!pp||pp.cls==='nerve') return lab;
  const [sig,...rest]=lab.split(' · '); return [sig,CLS[pp.cls].name.toLowerCase(),...rest].join(' · ');
};
HS.advLine=h=>HS.advOn&&HS.level()!=='body'&&h.adv?h.adv:null;

HS.setAdvanced=function(on,announce){
  HS.advOn=!!on; prefs.advanced=HS.advOn;
  try{ localStorage.setItem(PREF,JSON.stringify(prefs)); }catch(e){}
  app.classList.toggle('adv',HS.advOn);
  $('#bAdv').setAttribute('aria-pressed',HS.advOn); $('#tAdv').setAttribute('aria-checked',HS.advOn);
  HS.renderOverlay(); if(HS.renderAdvTools) HS.renderAdvTools();
  if(announce){ const m=HS.advOn?'Advanced on: named receptors and molecules at organ zoom. Click a route for its passport.':'Advanced off: back to the guided story.'; HS.toast(m); HS.say(m); }
};

/* receptor-location figure for a passport */
function figure(pp){
  const c=CLS[pp.cls].col, T=(x,y,t,a='start')=>`<text x="${x}" y="${y}" text-anchor="${a}" font-family="Google Sans Flex,Roboto Flex,sans-serif" font-size="11" fill="#A2B6BA">${t}</text>`, mol=(x,y)=>`<circle cx="${x}" cy="${y}" r="7.5" fill="${c}"/>`;
  let s=`<svg viewBox="0 0 364 124" role="img" aria-label="${RK[pp.rk]}"><rect width="364" height="124" rx="10" fill="#07131A"/>
   <text x="12" y="18" font-family="Roboto Mono,monospace" font-size="9" fill="#5F8A96">OUTSIDE THE CELL</text><text x="12" y="116" font-family="Roboto Mono,monospace" font-size="9" fill="#5F8A96">INSIDE</text>
   <rect y="56" width="364" height="10" fill="#15303A"/><path d="M0 56H364M0 66H364" stroke="#3F6674"/>`;
  if(pp.rk==='surface') s+=`${mol(150,36)}<path d="M150 74v-18M150 56l-9-10M150 56l9-10" stroke="#43D99A" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M150 80v10" stroke="#43D99A" stroke-width="1.5" stroke-dasharray="2 3"/><circle cx="168" cy="96" r="4" fill="#43D99A" opacity=".85"/><circle cx="184" cy="90" r="3" fill="#43D99A" opacity=".6"/><circle cx="196" cy="100" r="2.5" fill="#43D99A" opacity=".45"/>${T(170,40,'binds a receptor on the surface')}${T(206,98,'relay molecules pass it inside')}`;
  if(pp.rk==='inside') s+=`${mol(96,32)}<path d="M104 36C150 44 166 70 196 86" stroke="${c}" stroke-dasharray="3 4" fill="none"/><rect x="190" y="78" width="30" height="16" rx="8" fill="none" stroke="#43D99A" stroke-width="2.5"/>${mol(205,86)}<path d="M236 108C270 94 318 94 352 106" stroke="#8C9CC0" stroke-width="2" fill="none"/>${T(118,26,'crosses the membrane')}${T(230,84,'receptor inside → genes')}`;
  if(pp.rk==='transporter') s+=`<rect x="140" y="48" width="8" height="26" rx="2" fill="#8FD3AE"/><rect x="156" y="48" width="8" height="26" rx="2" fill="#8FD3AE"/>${mol(152,30)}${mol(152,94)}<path d="M152 40v44" stroke="${c}" stroke-dasharray="3 4"/>${T(176,34,'no receptor: enters through a transporter')}${T(176,98,'used or stored')}`;
  if(pp.rk==='synapse') s+=`<path d="M118 0C118 20 126 30 150 34C174 30 182 20 182 0" fill="#1A1630" stroke="${c}" stroke-width="2"/>${[136,150,164].map(x=>`<circle cx="${x}" cy="46" r="2.6" fill="${c}"/>`).join('')}<path d="M138 66v12M162 66v12" stroke="#43D99A" stroke-width="3" stroke-linecap="round"/>${T(196,30,'nerve ending')}${T(196,50,'messenger crosses a narrow gap')}${T(196,92,'receptors on the next cell')}`;
  return s+'</svg>';
}

HS.openPassport=function(key,ret){
  const pp=HS.PASSPORTS[key]; if(!pp) return; const c=CLS[pp.cls], S=HS.E.scene;
  const opener=HS.layers.opener(ret!==undefined?ret:document.activeElement,$('#bAdv'));
  HS.layers.start('read',opener,focus=>HS.closeRead(focus),$('#bRead'));
  const rows=[['Made from',pp.from],['Made in',pp.made],['Travels',pp.travels],['Receptor',pp.receptor],['Acts',pp.speed],['Switched off',pp.off]];
  const keys=S?[...new Set(Object.keys(S.routes).map(HS.passKeyForRoute).filter(Boolean))]:[];
  if(!keys.includes(key)) keys.unshift(key);
  let html=`<button class="x" aria-label="Close">×</button><span class="eyebrow">Advanced · signal passport</span><h3>${pp.name}</h3>${pp.aka?`<p class="sub" style="margin:0">Also called ${pp.aka}</p>`:''}
   <span class="clspill" style="--c:${c.col}">${pp.clsName}</span><div class="ppfig">${figure(pp)}</div>
   <dl class="pp">${rows.map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
  if(keys.length>1) html+=`<h4>Signals in this scene</h4><div class="pptable-wrap"><table class="pptable"><thead><tr><th scope="col">Signal</th><th scope="col">Class</th><th scope="col">Receptor</th><th scope="col">Acts</th></tr></thead><tbody>${keys.map(k=>{ const q=HS.PASSPORTS[k]; return `<tr${k===key?' class="here" aria-current="true"':''}><td>${k===key?q.name:`<button class="linkbtn" data-pass="${k}">${q.name}</button>`}</td><td><span class="dotc" style="--c:${CLS[q.cls].col}"></span>${CLS[q.cls].name}</td><td>${RK[q.rk]}</td><td>${q.ss}</td></tr>`; }).join('')}</tbody></table></div>`;
  html+=`<h4>Why the class matters</h4><ul class="why"><li>Peptides and catecholamines dissolve in the blood but can’t cross the cell membrane, so they bind surface receptors and act within seconds to minutes.</li><li>Steroids such as cortisol ride on carrier proteins, cross the membrane and bind receptors inside the cell, changing gene activity over hours.</li><li>Melatonin is an amine that can cross membranes, yet its main effects come through surface MT1 and MT2 receptors.</li></ul><p class="sub">Advanced · illustrative draft, not reviewed science.</p>`;
  $('#tips').innerHTML='';
  const s=$('#sheet'); s.innerHTML=html; s.setAttribute('aria-label',`${pp.name} passport`); s.classList.remove('closed'); s.scrollTop=0;
  HS.layers.mount('read',s);
  if(ret!==undefined) HS.sheetReturn=ret;
  s.querySelector('.x').onclick=()=>HS.closeRead(true); s.querySelector('.x').focus();
  HS.say(`${pp.name} passport. ${pp.clsName}. Receptor: ${pp.receptor}. Acts: ${pp.speed}.`);
};
$('#sheet').addEventListener('click',e=>{ const b=e.target.closest('[data-pass]'); if(b) HS.openPassport(b.dataset.pass); });

/* Advanced menu: the mode switch and the Advanced tools for this pathway (keeps the pathway bar narrow) */
HS.toggleAdvMenu=function(force){
  let m=$('#advMenu'); const open=force!==undefined?force:!m;
  if(m) m.remove(); $('#bAdv').setAttribute('aria-expanded','false');
  if(HS.layers&&HS.layers.active&&HS.layers.active.id==='adv') HS.layers.end('adv',false);
  if(!open) return;
  const p=HS.pathway(), S=HS.E.scene, two=S&&S.toggle&&S.toggle.options.length>1;
  const opener=HS.layers.opener(document.activeElement,$('#bAdv'));
  HS.layers.start('adv',opener,focus=>{ const d=$('#advMenu'); if(d) d.remove(); $('#bAdv').setAttribute('aria-expanded','false'); HS.layers.end('adv',focus); },$('#bAdv'));
  m=document.createElement('div'); m.id='advMenu'; m.className='advmenu float'; m.setAttribute('role','dialog'); m.setAttribute('aria-label','Advanced');
  m.innerHTML=`<button class="toggle" role="switch" aria-checked="${HS.advOn}" data-am="mode"><span>Advanced mode<small>Named receptors, molecule classes, passports · A</small></span><span class="sw"></span></button>
   ${HS.advOn?`<div class="divider"></div>
    ${p&&p.rebuild?`<button class="menuitem" data-am="rebuild"><b>Rebuild this route</b><small>Put the organs in order, then name each signal</small></button>`:''}
    ${two&&HS.openCompare?`<button class="menuitem" data-am="compare"><b>Compare ${S.toggle.options.map(o=>o[1]).join(' and ')}</b><small>Both routes on one body, side by side</small></button>`:''}
    <button class="menuitem" data-am="pass"><b>Signal passports</b><small>What each signal is and where it acts</small></button>`
   :`<p class="menunote">Turn it on for named receptors, signal passports and the Rebuild challenge. The guided story stays the same.</p>`}`;
  const r=$('#bAdv').getBoundingClientRect(); m.style.left=Math.max(12,Math.min(r.left-20,app.clientWidth-312))+'px'; m.style.bottom=(app.clientHeight-r.top+10)+'px';
  app.appendChild(m); HS.layers.mount('adv',m);
  $('#bAdv').setAttribute('aria-expanded','true'); m.querySelector('[data-am]').focus();
};
document.addEventListener('click',e=>{
  const m=$('#advMenu'); if(!m) return;
  const b=e.target.closest('#advMenu [data-am]');
  if(b){ const a=b.dataset.am;
    if(a==='mode'){ HS.setAdvanced(!HS.advOn,true); HS.toggleAdvMenu(true); return; }
    HS.toggleAdvMenu(false);
    if(a==='rebuild') HS.openRebuild();
    else if(a==='compare') HS.openCompare();
    else if(a==='pass'){ const p=HS.pathway(), k=p&&p.draw.map(HS.passKeyForRoute).find(Boolean); if(k) HS.openPassport(k,$('#bAdv')); }
    return; }
  if(!e.target.closest('#advMenu,#bAdv')) HS.toggleAdvMenu(false);
});
$('#bAdv').addEventListener('click',()=>HS.toggleAdvMenu());
$('#tAdv').addEventListener('click',()=>HS.setAdvanced($('#tAdv').getAttribute('aria-checked')==='true',true));
app.classList.toggle('adv',HS.advOn); $('#bAdv').setAttribute('aria-pressed',HS.advOn); $('#tAdv').setAttribute('aria-checked',HS.advOn);
if($('#tConcise')) $('#tConcise').setAttribute('aria-checked',HS.conciseSay);
})(window.HS);
