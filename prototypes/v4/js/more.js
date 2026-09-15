/* More sheet (ⓘ → More ›): the explanation at this depth and the next, the Why trail, claim-level
   evidence, glossary, where else the structure appears and related pathways. Also the compact causal
   diagram used at the top of Read the route, generated from scene data. */
(function(HS){
const $=HS.$;
const LEVELS=['body','organ','structure'];
const LNAME={body:'Whole body · plain story',organ:'Organ · pathway names',structure:'Close-up · precise location'};

HS.GLOSSARY={
 'hormone':'A chemical messenger released into the blood that acts on distant cells.',
 'receptor':'A protein that a signal binds to. Binding changes what the cell does.',
 'negative feedback':'When the result of a process turns that process down, which keeps things steady.',
 'hypothalamus':'A small brain region that links the nervous system to hormones.',
 'pituitary':'A pea-sized gland under the brain that releases hormones controlling other glands.',
 'CRH':'Corticotropin-releasing hormone. Made by the hypothalamus; tells the pituitary to release ACTH.',
 'ACTH':'Adrenocorticotropic hormone. Made by the anterior pituitary; tells the adrenal cortex to release cortisol.',
 'cortisol':'A hormone from the adrenal cortex that helps keep energy available during stress.',
 'adrenaline':'A hormone from the adrenal medulla that prepares the body for quick action. Also called epinephrine.',
 'noradrenaline':'A signal released by many sympathetic nerves and by the adrenal medulla. Also called norepinephrine.',
 'cortex':'The outer layer of an organ, such as the adrenal cortex.',
 'medulla':'The inner core of an organ, such as the adrenal medulla.',
 'portal':'A short blood route that carries a signal directly from one place to the next.',
 'glucagon':'A hormone from pancreatic alpha cells that tells the liver to release glucose.',
 'insulin':'A hormone from pancreatic beta cells that helps cells take up and store glucose.',
 'glucose':'A sugar carried in the blood, and the main fuel for many cells, including brain cells.',
 'glycogen':'The form in which liver and muscle cells store glucose.',
 'islets':'Small clusters of hormone-making cells in the pancreas.',
 'ghrelin':'A hormone from the stomach that signals hunger to the brain.',
 'melatonin':'A hormone from the pineal gland, released mainly at night.',
 'SCN':'The suprachiasmatic nucleus: the body’s main clock, inside the hypothalamus.',
 'pineal gland':'A small gland deep in the brain that releases melatonin.',
 'melanopsin':'A light-sensitive pigment in special eye cells that report light levels to the body clock.',
 'serotonin':'A signalling molecule. In the pineal gland it is the starting material for melatonin.',
 'enzyme':'A protein that speeds up a chemical reaction.',
 'nerve signals':'Electrical signals carried along nerve cells and passed on by chemical messengers where they end.',
 'light signals':'Nerve signals from light-sensing cells in the eye, reporting how bright it is.'
};

const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function appearances(k){
  const out=[];
  Object.values(HS.scenes).forEach(S=>Object.entries(S.pathways).forEach(([pk,p])=>{ const h=p.hots.find(x=>x.org===k); if(h) out.push({scene:S.id,path:pk,name:p.name,trigger:S.trigger.title,num:h.num,one:h.one}); }));
  return out;
}
const goBtn=(sc,pa,title,sub)=>`<button class="gobtn" data-go="${sc}:${pa}"><span>${title}</span><small>${sub}</small></button>`;

HS.openMore=function(key,anchorEl){
  const E=HS.E, S=E.scene, inf=HS.info(key), L=HS.level(), next=LEVELS[LEVELS.indexOf(L)+1];
  const p=HS.pathway(), hi=p?p.hots.findIndex(h=>h.org===key):-1, h=hi>=0?p.hots[hi]:null;
  let html=`<button class="x" aria-label="Close">×</button><span class="eyebrow">${LNAME[L]}</span><h3>${inf.t}</h3><p class="lead-p">${inf[L]}</p>`;
  if(next&&inf[next]&&inf[next]!==inf[L]) html+=`<button class="linkbtn" id="mDeeper" aria-expanded="false">Read the deeper version ›</button><p class="deeper" id="mDeeperTxt" hidden><span class="eyebrow">${LNAME[next]}</span>${inf[next]}</p>`;
  if(h){
    html+=`<h4>Why? The trail so far</h4><ol class="trail"><li>${S.trigger.title}</li>${p.hots.slice(0,hi+1).map((x,i)=>`<li${i===hi?' class="here" aria-current="step"':''}>${x.one}</li>`).join('')}</ol>`;
    const prev=hi>0?HS.orgName(p.hots[hi-1].org):S.trigger.title, r=h.seg&&S.routes[h.seg], sig=r?r.label.split(' · ')[0]:null;
    html+=`<h4>Evidence</h4><div class="claim"><div class="claim-row"><span>${prev}</span><span class="arr" aria-hidden="true">→</span>${sig?`<span class="${r.kind==='nerve'?'n':'m'}">${sig}</span><span class="arr" aria-hidden="true">→</span>`:''}<span>${inf.t}</span></div><div class="claim-eff">${h.one}</div><div class="claim-meta"><span class="ev">Illustrative · not reviewed</span><span>Source attached at scientific review</span></div></div>`;
  } else html+=`<h4>Evidence</h4><p class="sub">Claims for this structure show here when one of its pathways is open.</p>`;
  const text=[inf.body,inf.organ,inf.structure,h?h.one:''].join(' ');
  const terms=Object.keys(HS.GLOSSARY).filter(t=>new RegExp('\\b'+esc(t)+'\\b','i').test(text));
  if(terms.length) html+=`<h4>Glossary</h4><dl class="gloss">${terms.map(t=>`<dt>${t}</dt><dd>${HS.GLOSSARY[t]}</dd>`).join('')}</dl>`;
  const also=appearances(key).filter(a=>!(a.scene===E.sceneId&&a.path===E.route));
  if(also.length) html+=`<h4>Also appears in</h4>${also.map(a=>goBtn(a.scene,a.path,`${a.name} · step ${a.num}`,a.trigger)).join('')}`;
  const rel=[]; if(h&&h.leads) rel.push(goBtn(h.leads.scene,h.leads.path,HS.scenes[h.leads.scene].pathways[h.leads.path].name,h.leads.why));
  if(S) Object.entries(S.pathways).forEach(([pk,q])=>{ if(pk!==E.route) rel.push(goBtn(S.id,pk,q.name,q.chip)); });
  if(rel.length) html+=`<h4>Related pathways</h4>${rel.join('')}`;
  $('#tips').innerHTML='';
  const s=$('#sheet'); s.innerHTML=html; s.setAttribute('aria-label',`More about ${inf.t}`); s.classList.remove('closed'); s.scrollTop=0;
  HS.sheetReturn=anchorEl||null;
  s.querySelector('.x').onclick=()=>HS.closeRead(true);
  const d=s.querySelector('#mDeeper'); if(d) d.onclick=()=>{ const t=$('#mDeeperTxt'); t.hidden=!t.hidden; d.setAttribute('aria-expanded',!t.hidden); d.textContent=t.hidden?'Read the deeper version ›':'Hide the deeper version'; };
  s.querySelector('.x').focus();
  HS.say(`More about ${inf.t}. ${inf[L]}`);
};
$('#sheet').addEventListener('click',e=>{ const b=e.target.closest('[data-go]'); if(!b) return; const [sc,pa]=b.dataset.go.split(':'); HS.closeRead(false); HS.openPathway(sc,pa,false); });

/* compact causal diagram: role-shaped nodes (source pill · relay box · target double box),
   signal on each connector, feedback arcs on the right (dashed with ? until revealed) */
HS.causalSVG=function(S,pk,revealed){
  const p=S.pathways[pk], n=p.hots.length, W=364, bx=14, bw=188, bh=34, gap=62, top=10;
  const H=top*2+(n-1)*gap+bh, y=i=>top+i*gap;
  let s=`<svg class="causal" viewBox="0 0 ${W} ${H}" role="img" aria-label="${p.name}: ${p.hots.map(h=>h.one).join(', then ')}">`;
  p.hots.forEach((h,i)=>{
    if(!i) return; const y1=y(i-1)+bh, y2=y(i), x=bx+bw/2, r=h.seg&&S.routes[h.seg], col=r?HS.COL[r.kind]:'#6C858B';
    s+=`<path d="M ${x} ${y1+3} L ${x} ${y2-4}" stroke="${col}" stroke-width="2" ${r?'':'stroke-dasharray="3 4"'}/><path d="M ${x-5} ${y2-10} L ${x} ${y2-3} L ${x+5} ${y2-10}" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round"/>`;
    s+=`<text x="${x+10}" y="${(y1+y2)/2+4}" font-family="Roboto Mono,monospace" font-size="10.5" fill="${col}">${r?r.label.split(' · ')[0]:'also'}</text>`;
  });
  p.hots.forEach((h,i)=>{
    const role=i===0?'source':i===n-1?'target':'relay', c={source:'#A98BFF',relay:'#6FA8FF',target:'#43D99A'}[role];
    s+=`<rect x="${bx}" y="${y(i)}" width="${bw}" height="${bh}" rx="${role==='source'?17:6}" fill="#0B171C" stroke="${c}" stroke-width="1.5"/>`;
    if(role==='target') s+=`<rect x="${bx+3}" y="${y(i)+3}" width="${bw-6}" height="${bh-6}" rx="4" fill="none" stroke="${c}" stroke-width=".8" opacity=".6"/>`;
    s+=`<text x="${bx+14}" y="${y(i)+21.5}" font-family="Google Sans Flex,Roboto Flex,sans-serif" font-size="12.5" font-weight="600" fill="#E6EFEF">${h.num} · ${HS.orgName(h.org)}</text>`;
  });
  const g=p.gate;
  if(g&&g.from){
    const fi=p.hots.findIndex(h=>h.org===g.from), rev=revealed(pk), end=S.routes[g.routes[0]].end||'bar', x0=bx+bw;
    g.try.answer.forEach((t,j)=>{
      const ti=p.hots.findIndex(h=>h.org===t); if(ti<0||fi<0) return;
      const ya=y(fi)+bh/2, yb=y(ti)+bh/2, cx=x0+58+j*28;
      s+=`<path d="M ${x0+2} ${ya} C ${cx} ${ya}, ${cx} ${yb}, ${x0+10} ${yb}" fill="none" stroke="#FFB547" stroke-width="1.8" ${rev?'':'stroke-dasharray="5 5" opacity=".65"'}/>`;
      if(rev) s+=end==='diamond'?`<path d="M ${x0+3} ${yb} l 6 -5.5 6 5.5 -6 5.5z" fill="#0B171C" stroke="#FFB547" stroke-width="1.6"/>`:`<rect x="${x0+5}" y="${yb-8}" width="3.5" height="16" rx="1" fill="#FFB547"/>`;
    });
    const t0=p.hots.findIndex(h=>h.org===g.try.answer[0]), my=(y(fi)+y(t0))/2+bh/2;
    s+=`<text x="${x0+60+g.try.answer.length*28}" y="${my+4}" font-family="Roboto Mono,monospace" font-size="10.5" fill="#FFB547">${rev?(end==='diamond'?'modulates':'brakes'):'? try it'}</text>`;
  }
  return s+'</svg>';
};
})(window.HS);
