/* Placeholder anatomy: silhouette, organs, brain cutaway, level-of-detail sets and camera regions.
   World units; organ paths are drawn inside translate(90 0). Content binds to organ keys, never pixels. */
(function(HS){
const $=HS.$;

const RS=[[342,28,366,60,366,104],[366,146,350,176,330,190],[326,200,326,214,328,226],[350,238,400,240,432,256],[462,270,474,300,476,340],[480,400,484,460,490,520],[494,580,500,640,506,700],['L',510,780],['L',452,780],[450,700,446,640,440,590],[434,540,428,480,426,430],[424,400,422,380,420,364],[416,420,404,480,400,520],[398,560,412,600,420,640],[426,690,424,740,422,780],['L',300,780]];
function bodyPath(){
  let d='M300 28', cur=[300,28]; const segs=[];
  RS.forEach(s=>{ if(s[0]==='L'){ segs.push({t:'L',from:cur,to:[s[1],s[2]]}); cur=[s[1],s[2]]; } else { segs.push({t:'C',from:cur,c1:[s[0],s[1]],c2:[s[2],s[3]],to:[s[4],s[5]]}); cur=[s[4],s[5]]; } });
  segs.forEach(g=>{ d+= g.t==='L'?` L${g.to.join(' ')}`:` C${g.c1.join(' ')} ${g.c2.join(' ')} ${g.to.join(' ')}`; });
  const m=p=>[600-p[0],p[1]];
  for(let i=segs.length-1;i>=0;i--){ const g=segs[i]; const to=m(g.from); d+= g.t==='L'?` L${to.join(' ')}`:` C${m(g.c2).join(' ')} ${m(g.c1).join(' ')} ${to.join(' ')}`; }
  return d+' Z';
}

const ORGS={
 int:{name:'Intestines',fill:'#3A302D',parts:[{d:'M 190 600 C 190 570 330 570 330 600 L 336 690 C 336 722 184 722 184 690 Z',c:[260,645],r:[76,76]}]},
 lungs:{name:'Lungs',fill:'#2B4755',region:'heart',parts:[{d:'M 244 268 C 210 272 190 320 188 380 C 186 420 196 440 214 444 C 236 446 248 430 250 410 L 252 300 C 252 280 250 270 244 268 Z',c:[220,356],r:[38,92]},{d:'M 276 268 C 310 272 330 320 332 380 C 334 420 324 440 306 444 C 290 446 280 436 276 424 L 272 300 C 270 280 270 270 276 268 Z',c:[303,356],r:[38,92]}]},
 heart:{name:'Heart',fill:'#7C3A42',region:'heart',parts:[{d:'M 262 350 C 290 336 318 350 314 384 C 312 410 290 428 270 440 C 254 424 238 404 240 380 C 242 362 250 354 262 350 Z',c:[277,391],r:[46,56]}]},
 liver:{name:'Liver',fill:'#7B4A3E',region:'liver',parts:[{d:'M 172 440 C 200 424 262 426 300 440 C 316 446 312 462 296 472 C 262 494 210 506 184 498 C 168 490 162 456 172 440 Z',c:[240,466],r:[84,46]}]},
 stom:{name:'Stomach',fill:'#664A43',parts:[{d:'M 300 452 C 324 440 348 450 350 476 C 352 506 334 530 306 534 C 290 536 284 524 294 514 C 312 500 316 480 300 468 Z',c:[322,490],r:[36,52]}]},
 panc:{name:'Pancreas',fill:'#86703A',parts:[{d:'M 232 520 C 252 508 290 508 330 496 C 346 492 356 496 354 504 C 350 514 320 520 290 528 C 266 534 240 538 232 530 Z',c:[293,516],r:[68,24]}]},
 kid:{name:'Kidneys',fill:'#5C3E47',parts:[{d:'M 208 524 C 228 524 232 550 230 566 C 228 586 222 598 208 598 C 192 598 186 580 188 560 C 190 540 194 524 208 524 Z',c:[209,561],r:[30,46]},{d:'M 312 530 C 292 530 288 556 290 572 C 292 592 298 604 312 604 C 328 604 334 586 332 566 C 330 546 326 530 312 530 Z',c:[311,567],r:[30,46]}]},
 adr:{name:'Adrenal glands',fill:'#A5763A',region:'adr',parts:[{d:'M 196 530 C 196 514 206 506 214 504 C 222 510 226 522 222 532 C 214 528 204 528 196 530 Z',c:[210,519],r:[20,17]},{d:'M 324 536 C 324 520 314 512 306 510 C 298 516 294 528 298 538 C 306 534 316 534 324 536 Z',c:[310,525],r:[20,17]}]},
 thy:{name:'Thyroid',fill:'#74503F',parts:[{d:'M 246 222 C 254 220 258 232 256 244 C 254 250 244 252 240 244 C 236 234 238 224 246 222 Z',c:[248,236],r:[14,18]},{d:'M 274 222 C 266 220 262 232 264 244 C 266 250 276 252 280 244 C 284 234 282 224 274 222 Z',c:[272,236],r:[14,18]}]},
 brain:{name:'Brain',fill:'#4B4662',region:'head',parts:[{d:'M 214 84 C 214 50 238 36 260 36 C 282 36 306 50 306 84 C 306 100 296 110 282 112 L 238 112 C 224 110 214 100 214 84 Z',c:[260,74],r:[50,42]}]}
};
const ORDER=['int','lungs','heart','liver','stom','panc','kid','adr','thy','brain'];
const INSET={hyp:{name:'Hypothalamus',c:[101.8,173.8],r:6.8,region:'brain'},pit:{name:'Pituitary',c:[95,197.6],r:6,region:'brain'}};
const REG={body:{x:0,y:30,w:640,h:750},head:{x:292,y:30,w:120,h:110},brain:{x:14,y:52,w:196,h:196},adr:{x:262,y:492,w:74,h:54},adrClose:{x:281,y:503,w:38,h:32},liver:{x:244,y:418,w:180,h:100},heart:{x:320,y:334,w:94,h:106},hpa:{x:0,y:50,w:460,h:520},fast:{x:150,y:40,w:460,h:560}};

HS.ORGS=ORGS; HS.INSET=INSET; HS.REG=REG; HS.bodyPath=bodyPath;
HS.wc=(key,i=0)=> INSET[key]?INSET[key].c : [ORGS[key].parts[i].c[0]+90, ORGS[key].parts[i].c[1]];
HS.orgName=k=>(ORGS[k]||INSET[k]).name;
HS.orgKeys=()=>Object.keys(ORGS).concat(Object.keys(INSET));
HS.baseInfo=k=>{ const n=HS.orgName(k); return {t:n,body:'Not traced in this scene.',organ:'Not traced in this scene.',structure:'Not traced in this scene.'}; };

HS.buildWorld=function(){
  let s=`<defs>
  <radialGradient id="sil" cx=".5" cy=".38" r=".78"><stop offset="0" stop-color="#13313B"/><stop offset="1" stop-color="#0A1A20"/></radialGradient>
  <radialGradient id="sheen" cx=".32" cy=".26" r=".9"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".34"/><stop offset=".45" stop-color="#FFFFFF" stop-opacity=".05"/><stop offset="1" stop-color="#000000" stop-opacity=".32"/></radialGradient>
  <filter id="glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <clipPath id="insetClip"><circle cx="112" cy="150" r="96"/></clipPath>
  </defs>`;
  s+=`<g transform="translate(50 0)"><path d="${bodyPath()}" fill="url(#sil)" stroke="#2A5663" stroke-width="1.2" class="org-shape" style="stroke-opacity:.8"/></g>`;
  let ribs=''; for(let i=0;i<7;i++){ const y=280+i*24, w=64+i*7; ribs+=`<path d="M 260 ${y} C ${260-w*.4} ${y-8} ${260-w} ${y+2} ${260-w-6} ${y+22}"/><path d="M 260 ${y} C ${260+w*.4} ${y-8} ${260+w} ${y+2} ${260+w+6} ${y+22}"/>`; }
  s+=`<g transform="translate(90 0)" fill="none" stroke="#18333C" stroke-width="2" stroke-linecap="round" opacity=".8">${ribs}<path d="M 176 700 C 200 670 236 664 260 690 C 284 664 320 670 344 700"/></g>`;
  s+=`<g id="gNerv" transform="translate(90 0)" style="transition:opacity .4s" opacity=".35"><path class="cord" d="M 260 112 L 260 700" stroke="#8C74D6" stroke-width="2.5" stroke-linecap="round" fill="none"/>${[160,220,280,340,400,460,520,580].map(y=>`<path class="cord" d="M 260 ${y} l -14 10 M 260 ${y} l 14 10" stroke="#8C74D6" stroke-width="1.2" fill="none"/>`).join('')}</g>`;
  s+=`<g id="gOrg" transform="translate(90 0)">`;
  ORDER.forEach(k=>{
    const o=ORGS[k];
    s+=`<g class="org" data-org="${k}" id="o-${k}"><g class="org-body">`;
    o.parts.forEach(p=>{ s+=`<path class="org-shape" d="${p.d}" fill="${o.fill}"/><path d="${p.d}" fill="url(#sheen)" pointer-events="none"/>`; });
    s+=`</g>`;
    if(k==='adr'){
      s+=`<g id="adrLod" class="lod" opacity="0" pointer-events="none">`;
      o.parts.forEach(p=>{ s+=`<path d="${p.d}" fill="#C08C45"/><path d="${p.d}" fill="#6E3C2C" transform="translate(${p.c[0]} ${p.c[1]+2}) scale(.52) translate(${-p.c[0]} ${-p.c[1]})"/><path d="${p.d}" fill="url(#sheen)"/>`; });
      s+=`</g>`;
    }
    o.parts.forEach(p=>{ s+=`<ellipse class="ring" cx="${p.c[0]}" cy="${p.c[1]}" rx="${p.r[0]+5}" ry="${p.r[1]+5}"/>`; });
    s+=`</g>`;
  });
  s+=`<circle cx="240" cy="122" r="6" fill="#2A4650"/><circle cx="280" cy="122" r="6" fill="#2A4650"/><circle class="pupil" id="pupR" cx="240" cy="122" r="2.2" fill="#040B0E"/><circle class="pupil" id="pupL" cx="280" cy="122" r="2.2" fill="#040B0E"/>`;
  s+=`</g>`;
  s+=`<g id="gInset"><path d="M 304 90 L 206 128" stroke="#3E6D79" stroke-dasharray="3 4" fill="none" class="cord"/>
   <circle cx="112" cy="150" r="96" fill="#08141A" stroke="#23505C" stroke-width="1.2" class="org-shape"/>
   <g clip-path="url(#insetClip)"><g transform="translate(112 150) scale(1.7) translate(-196 -70)">
     <path d="M150 76 C148 44 176 26 204 27 C232 28 248 50 244 76 C242 92 230 98 216 97 C208 102 196 104 186 100 C172 100 156 92 150 76Z" fill="#2A3346" stroke="#3E4C66" stroke-width=".8"/>
     <g fill="none" stroke="#46557A" stroke-width=".7" stroke-linecap="round" opacity=".8"><path d="M160 60 C168 50 178 56 186 46"/><path d="M190 40 C200 48 210 38 222 44"/><path d="M226 52 C234 60 238 70 236 80"/><path d="M168 78 C178 70 190 78 200 72 C210 78 220 72 228 80"/></g>
     <ellipse cx="226" cy="101" rx="13" ry="8" fill="#2A3346" stroke="#3E4C66" stroke-width=".8"/>
     <path d="M207 97 Q210 112 214 128" stroke="#3E4C66" stroke-width="7" fill="none" stroke-linecap="round"/>
     <path d="M189 88 L187 95" stroke="#5E6C8E" stroke-width="1.2"/>
     <circle cx="156" cy="86" r="5" fill="#2A4650"/>
   </g></g>
   ${Object.entries(INSET).map(([k,o])=>`<g class="org" data-org="${k}" id="o-${k}"><circle class="org-shape" cx="${o.c[0]}" cy="${o.c[1]}" r="${o.r}" fill="#6B5E93"/><circle class="ring" cx="${o.c[0]}" cy="${o.c[1]}" r="${o.r+6}"/></g>`).join('')}
   <text x="112" y="238" text-anchor="middle" font-family="Roboto Mono,monospace" font-size="8" letter-spacing="1" fill="#4F7680">BRAIN · CUTAWAY VIEW</text></g>`;
  s+=`<g id="gSigns"></g><g id="gRoutes"></g>`;
  $('#world').innerHTML=s;
  $('#miniSvg').innerHTML=`<g transform="translate(50 0)"><path d="${bodyPath()}" fill="#12303A" stroke="#2A5663" stroke-width="3"/></g><circle cx="112" cy="150" r="96" fill="none" stroke="#23505C" stroke-width="4"/><rect id="mv" fill="rgba(141,176,255,.12)" stroke="#8DB0FF" stroke-width="6" rx="10"/>`;
};

/* level of detail: cross-fade detail sets with zoom, and name structures when framed */
HS.updateLod=function(z){ const a=$('#adrLod'); if(a) a.setAttribute('opacity',Math.max(0,Math.min(1,(z-2.8)/1.8)).toFixed(2)); };
HS.lodLabels=function(L){
  if(L!=='structure') return [];
  const c=HS.viewCenter();
  if(Math.abs(c[0]-300)<60 && Math.abs(c[1]-518)<60) return [
    {key:'cortex',org:'adr',text:'Cortex · makes cortisol',anchor:[290,510],dx:-30,dy:-26,info:'adr'},
    {key:'medulla',text:'Medulla · makes adrenaline',anchor:[300,521],dx:34,dy:26,info:'adr'}];
  return [];
};
})(window.HS);
