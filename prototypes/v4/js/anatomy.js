/* Placeholder anatomy in the hybrid style (D): semi-realistic organ form without texture, one light
   direction (top-left), on a dark stage. Silhouette, skeleton hints, organs with detail lines, sagittal
   brain cutaway, level-of-detail sets and camera regions. World units; organ paths sit inside translate(90 0).
   Content binds to organ keys, never pixels. Requires anatomy review before release. */
(function(HS){
const $=HS.$;

/* colour helpers for the form ramp (highlight / base / shadow) */
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const mix=(h,t,a)=>{ const A=rgb(h),B=rgb(t); return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*a).toString(16).padStart(2,'0')).join(''); };
const lighten=(h,a)=>mix(h,'#FFFFFF',a), darken=(h,a)=>mix(h,'#000000',a);

/* silhouette: right half as cubic segments, mirrored about x=300 */
const RS=[[328,34,350,54,350,86],[350,114,342,136,328,150],[322,158,320,166,320,174],[320,188,322,200,326,208],[342,220,376,224,406,234],[434,244,448,266,452,298],[458,348,464,408,470,466],[476,518,484,570,490,618],[494,644,496,668,490,686],[482,702,466,702,462,686],[458,666,458,642,456,626],[448,576,440,526,432,480],[426,432,420,380,416,334],[414,322,410,316,404,320],[402,360,398,404,392,442],[386,474,388,504,396,534],[406,570,410,604,408,642],[406,692,402,740,398,780],['L',318,780],[316,748,310,724,300,714]];
function bodyPath(){
  let d='M300 34', cur=[300,34]; const segs=[];
  RS.forEach(s=>{ if(s[0]==='L'){ segs.push({t:'L',from:cur,to:[s[1],s[2]]}); cur=[s[1],s[2]]; } else { segs.push({t:'C',from:cur,c1:[s[0],s[1]],c2:[s[2],s[3]],to:[s[4],s[5]]}); cur=[s[4],s[5]]; } });
  segs.forEach(g=>{ d+= g.t==='L'?` L${g.to.join(' ')}`:` C${g.c1.join(' ')} ${g.c2.join(' ')} ${g.to.join(' ')}`; });
  const m=p=>[600-p[0],p[1]];
  for(let i=segs.length-1;i>=0;i--){ const g=segs[i]; const to=m(g.from); d+= g.t==='L'?` L${to.join(' ')}`:` C${m(g.c2).join(' ')} ${m(g.c1).join(' ')} ${to.join(' ')}`; }
  return d+' Z';
}

const ORGS={
 muscle:{name:'Muscles',fill:'#6E3E4A',region:'muscle',
  parts:[{d:'M 386 330 C 400 328 412 352 414 390 C 416 424 408 450 400 456 C 390 450 382 420 382 390 C 382 356 380 334 386 330 Z',c:[398,392],r:[16,62]},{d:'M 134 330 C 120 328 108 352 106 390 C 104 424 112 450 120 456 C 130 450 138 420 138 390 C 138 356 140 334 134 330 Z',c:[122,392],r:[16,62]},{d:'M 282 722 C 300 712 348 714 358 732 C 364 752 362 772 358 780 L 286 780 C 280 764 278 740 282 722 Z',c:[320,752],r:[38,30]},{d:'M 238 722 C 220 712 172 714 162 732 C 156 752 158 772 162 780 L 234 780 C 240 764 242 740 238 722 Z',c:[200,752],r:[38,30]}],
  detail:'<path d="M 392 344 C 398 380 400 420 398 450"/><path d="M 128 344 C 122 380 120 420 122 450"/><path d="M 300 728 C 314 746 322 764 326 780"/><path d="M 220 728 C 206 746 198 764 194 780"/>'},
 int:{name:'Intestines',fill:'#4C3C36',
  parts:[{d:'M 194 582 C 192 558 222 552 260 554 C 298 552 328 558 326 582 C 334 614 336 650 326 680 C 318 700 290 706 260 706 C 230 706 202 700 194 680 C 184 650 186 614 194 582 Z',c:[260,630],r:[68,72]}],
  detail:'<path d="M 206 680 C 198 640 198 600 208 580 C 226 566 294 566 312 580 C 322 600 322 640 314 680" stroke-width="4" stroke-opacity=".28"/><path d="M 226 602 C 222 590 240 584 248 594 C 254 604 270 604 274 594 C 280 584 298 590 294 604 C 290 616 272 614 266 624 C 260 634 244 632 238 622 C 232 612 230 610 226 602 Z"/><path d="M 222 654 C 218 640 236 634 246 644 C 254 652 268 652 274 644 C 284 634 302 640 298 654 C 294 668 276 668 268 676 C 260 684 244 682 236 674 C 228 666 226 664 222 654 Z"/>'},
 lungs:{name:'Lungs',fill:'#35596A',region:'heart',
  parts:[{d:'M 236 262 C 214 266 192 300 186 352 C 180 400 184 432 196 444 C 212 452 236 446 250 436 C 254 400 254 330 250 290 C 248 272 244 262 236 262 Z',c:[220,356],r:[36,92]},{d:'M 284 262 C 306 266 328 300 334 352 C 340 400 336 432 324 444 C 312 452 298 448 290 440 C 296 424 296 414 286 404 C 276 396 272 380 272 360 L 270 290 C 270 272 276 262 284 262 Z',c:[304,356],r:[36,92]}],
  detail:'<path d="M 190 384 C 212 372 232 342 248 316"/><path d="M 196 342 L 242 348"/><path d="M 334 380 C 312 368 292 342 276 318"/><g stroke="#86AEBE" stroke-opacity=".42" stroke-width="1.2"><path d="M 238 304 C 228 322 216 338 206 360"/><path d="M 226 324 C 230 344 232 362 234 384"/><path d="M 214 342 C 206 352 198 360 194 372"/><path d="M 282 304 C 292 322 304 338 314 360"/><path d="M 294 324 C 290 344 288 362 286 384"/><path d="M 306 342 C 314 352 322 360 326 372"/></g>'},
 heart:{name:'Heart',fill:'#7E3C46',region:'heart',
  parts:[{d:'M 258 344 C 282 330 314 340 318 368 C 322 396 304 422 280 440 C 274 444 268 444 262 438 C 248 422 236 400 238 378 C 240 360 246 350 258 344 Z',c:[278,390],r:[44,52]}],
  detail:'<path class="sc" d="M 250 354 L 249 316" stroke="#4A5A86" stroke-width="7" stroke-linecap="round" stroke-opacity=".95"/><path class="sc" d="M 283 350 C 285 334 296 326 308 330" stroke="#55679A" stroke-width="7" stroke-linecap="round" stroke-opacity=".95"/><path class="sc" d="M 266 348 C 258 320 274 300 294 306 C 304 309 308 318 306 330" stroke="#9C4C58" stroke-width="7.5" stroke-linecap="round" stroke-opacity=".98"/><path class="sc" d="M 266 345 C 260 322 274 307 292 311" stroke="#C98A94" stroke-width="1.6" stroke-linecap="round" stroke-opacity=".6"/><path d="M 244 372 C 266 382 296 378 316 364"/><path d="M 288 362 C 284 392 278 414 270 436"/>'},
 liver:{name:'Liver',fill:'#7E4A3B',region:'liver',
  parts:[{d:'M 168 432 C 196 414 270 414 318 428 C 336 434 338 446 326 454 C 300 470 250 494 206 504 C 186 508 170 496 166 478 C 162 460 162 442 168 432 Z',c:[240,460],r:[84,44]}],
  detail:'<path d="M 264 420 C 262 446 256 470 244 496"/><ellipse cx="236" cy="494" rx="8" ry="5" fill="#4E6644" fill-opacity=".8" stroke-opacity=".5"/>'},
 stom:{name:'Stomach',fill:'#6C4D46',
  parts:[{d:'M 300 450 C 318 438 350 442 356 472 C 362 504 348 532 318 540 C 300 544 280 540 272 530 C 268 522 276 516 286 518 C 304 522 322 510 326 492 C 330 474 318 462 302 464 Z',c:[326,490],r:[32,48]}],
  detail:'<path d="M 310 456 C 334 454 346 472 344 496 C 342 516 330 528 310 534"/>'},
 panc:{name:'Pancreas',fill:'#86724A',
  parts:[{d:'M 228 526 C 232 514 250 512 270 514 C 296 514 320 504 342 496 C 356 492 364 498 358 508 C 350 518 322 524 296 530 C 272 536 244 542 232 536 C 226 533 226 530 228 526 Z',c:[293,518],r:[68,22]}],
  detail:'<path d="M 236 528 C 270 526 310 516 350 502"/>'},
 kid:{name:'Kidneys',fill:'#6A4652',
  parts:[{d:'M 210 526 C 230 526 236 548 232 562 C 228 570 224 574 226 584 C 228 596 220 604 208 604 C 190 604 184 584 186 562 C 188 540 194 526 210 526 Z',c:[209,565],r:[28,42]},{d:'M 310 532 C 290 532 284 554 288 568 C 292 576 296 580 294 590 C 292 602 300 610 312 610 C 330 610 336 590 334 568 C 332 546 326 532 310 532 Z',c:[311,571],r:[28,42]}],
  detail:'<path d="M 226 578 C 214 574 204 566 200 552"/><path d="M 294 584 C 306 580 316 572 320 558"/>'},
 adr:{name:'Adrenal glands',fill:'#B07E3E',region:'adr',
  parts:[{d:'M 196 530 C 196 514 206 504 216 502 C 226 508 230 522 224 532 C 214 526 204 526 196 530 Z',c:[212,518],r:[20,16]},{d:'M 326 536 C 326 520 316 508 304 506 C 294 512 290 526 296 538 C 306 532 318 532 326 536 Z',c:[310,522],r:[20,16]}]},
 thy:{name:'Thyroid',fill:'#7E5846',
  parts:[{d:'M 248 196 C 256 194 258 204 256 216 C 254 222 246 224 242 216 C 238 206 240 198 248 196 Z',c:[249,209],r:[12,16]},{d:'M 272 196 C 264 194 262 204 264 216 C 266 222 274 224 278 216 C 282 206 280 198 272 196 Z',c:[271,209],r:[12,16]}],
  detail:'<path d="M 255 212 L 265 212" stroke-width="4" stroke-opacity=".6"/>'},
 brain:{name:'Brain',fill:'#565078',region:'head',
  parts:[{d:'M 218 72 C 218 48 236 40 260 40 C 284 40 302 48 302 72 C 302 88 294 96 282 98 L 238 98 C 226 96 218 88 218 72 Z',c:[260,69],r:[42,29]}],
  detail:'<path d="M 260 42 L 260 96"/><path d="M 228 62 C 236 54 244 62 250 54"/><path d="M 292 62 C 284 54 276 62 270 54"/><path d="M 226 82 C 236 76 244 84 252 78"/><path d="M 294 82 C 284 76 276 84 268 78"/>'}
};
const ORDER=['muscle','int','lungs','heart','kid','stom','panc','liver','adr','thy','brain'];
const INSET={
 hyp:{name:'Hypothalamus',c:[102,174],r:6.5,region:'brain'},
 pit:{name:'Pituitary',c:[95,199],r:6.2,region:'brain'},
 scn:{name:'Body clock (SCN)',c:[86,171],r:4.2,region:'brain'},
 pineal:{name:'Pineal gland',c:[141,165],r:4.6,region:'brain'},
 retina:{name:'Eyes',c:[30,180],r:6.5,region:'brain',fill:'#3B6573'}
};
const REG={body:{x:0,y:30,w:640,h:750},head:{x:292,y:30,w:120,h:110},brain:{x:14,y:52,w:196,h:208},pit:{x:62,y:170,w:70,h:56},adr:{x:262,y:492,w:74,h:54},adrClose:{x:281,y:503,w:38,h:32},liver:{x:244,y:418,w:180,h:100},heart:{x:320,y:334,w:94,h:106},hpa:{x:0,y:50,w:460,h:520},fast:{x:150,y:40,w:460,h:560},
 panc:{x:318,y:480,w:136,h:72},pancClose:{x:356,y:504,w:44,h:34},muscle:{x:430,y:316,w:120,h:160},int:{x:262,y:540,w:176,h:180},meal:{x:190,y:30,w:390,h:560},fed:{x:200,y:300,w:380,h:430},
 night:{x:10,y:40,w:400,h:230},clock:{x:14,y:120,w:150,h:96}};

HS.ORGS=ORGS; HS.INSET=INSET; HS.REG=REG; HS.bodyPath=bodyPath; HS.darken=darken; HS.lighten=lighten;
HS.wc=(key,i=0)=> INSET[key]?INSET[key].c : [ORGS[key].parts[i].c[0]+90, ORGS[key].parts[i].c[1]];
HS.orgName=k=>(ORGS[k]||INSET[k]).name;
HS.orgKeys=()=>Object.keys(ORGS).concat(Object.keys(INSET));
HS.baseInfo=k=>{ const n=HS.orgName(k); return {t:n,body:'Not traced in this scene.',organ:'Not traced in this scene.',structure:'Not traced in this scene.'}; };

HS.buildWorld=function(){
  let s=`<defs>
  <radialGradient id="sil" cx=".5" cy=".34" r=".8"><stop offset="0" stop-color="#16394A"/><stop offset=".6" stop-color="#0E232B"/><stop offset="1" stop-color="#09161B"/></radialGradient>
  <linearGradient id="rim" x1="0" y1="0" x2=".7" y2="1"><stop offset="0" stop-color="#5A9AAA"/><stop offset=".45" stop-color="#2A5663"/><stop offset="1" stop-color="#14303A"/></linearGradient>
  <radialGradient id="ambient"><stop offset="0" stop-color="#2F7F93" stop-opacity=".2"/><stop offset="1" stop-color="#2F7F93" stop-opacity="0"/></radialGradient>
  <radialGradient id="sheen" cx=".32" cy=".24" r=".9"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".22"/><stop offset=".42" stop-color="#FFFFFF" stop-opacity=".04"/><stop offset="1" stop-color="#000000" stop-opacity=".22"/></radialGradient>
  <linearGradient id="frontGlass" x1=".28" y1="0" x2=".78" y2="1"><stop offset="0" stop-color="#CFEEFF" stop-opacity=".09"/><stop offset=".5" stop-color="#2F7F93" stop-opacity=".03"/><stop offset="1" stop-color="#040E14" stop-opacity=".13"/></linearGradient>
  <radialGradient id="halo"><stop offset="0" stop-color="#8FDCFF" stop-opacity=".5"/><stop offset=".5" stop-color="#8FDCFF" stop-opacity=".14"/><stop offset="1" stop-color="#8FDCFF" stop-opacity="0"/></radialGradient>
  <radialGradient id="coolWash"><stop offset="0" stop-color="#7FB2FF" stop-opacity=".2"/><stop offset=".6" stop-color="#7FB2FF" stop-opacity=".08"/><stop offset="1" stop-color="#7FB2FF" stop-opacity="0"/></radialGradient>
  <clipPath id="insetClip"><circle cx="112" cy="150" r="96"/></clipPath>`;
  ORDER.forEach(k=>{ const f=ORGS[k].fill; s+=`<linearGradient id="gr-${k}" x1=".2" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="${lighten(f,.22)}"/><stop offset=".5" stop-color="${f}"/><stop offset="1" stop-color="${darken(f,.45)}"/></linearGradient>`; ORGS[k].parts.forEach((p,i)=>{ s+=`<clipPath id="cl-${k}${i}"><path d="${p.d}"/></clipPath>`; }); });
  s+=`</defs>`;
  s+=`<ellipse cx="350" cy="400" rx="330" ry="420" fill="url(#ambient)"/>`;
  const bp=bodyPath();   // silhouette with a soft inner rim light from the top-left
  s+=`<g transform="translate(50 0)"><clipPath id="bodyClip"><path d="${bp}"/></clipPath><path d="${bp}" fill="url(#sil)" stroke="url(#rim)" stroke-width="1.4" class="org-shape"/><path d="${bp}" fill="none" stroke="url(#rim)" stroke-width="16" opacity=".16" clip-path="url(#bodyClip)" pointer-events="none"/></g>`;

  /* skeleton hints: orientation only */
  let ribs=''; for(let i=0;i<7;i++){ const y=276+i*22, w=56+i*6; ribs+=`<path d="M 260 ${y} C ${260-w*.4} ${y-8} ${260-w} ${y+2} ${260-w-4} ${y+20}"/><path d="M 260 ${y} C ${260+w*.4} ${y-8} ${260+w} ${y+2} ${260+w+4} ${y+20}"/>`; }
  s+=`<g class="bones" transform="translate(90 0)" fill="none" stroke="#1B3942" stroke-width="2" stroke-linecap="round" opacity=".85">${ribs}
   <path d="M 258 222 C 236 218 206 222 180 234"/><path d="M 262 222 C 284 218 314 222 340 234"/>
   <path d="M 260 262 L 260 398" stroke-width="3"/><path d="M 260 190 L 260 660" stroke-dasharray="3 6" stroke-width="3" opacity=".7"/>
   <path d="M 180 628 C 176 604 196 588 216 600 C 232 612 244 640 260 648 C 276 640 288 612 304 600 C 324 588 344 604 340 628"/><path d="M 222 676 C 240 660 280 660 298 676"/></g>`;

  /* nervous layer */
  s+=`<g id="gNerv" transform="translate(90 0)" style="transition:opacity .4s" opacity=".35"><path class="cord" d="M 260 100 L 260 660" stroke="#8C74D6" stroke-width="2.5" stroke-linecap="round" fill="none"/>${[180,236,292,348,404,460,516,572].map(y=>`<path class="cord" d="M 260 ${y} C 252 ${y+2} 246 ${y+6} 240 ${y+12} M 260 ${y} C 268 ${y+2} 274 ${y+6} 280 ${y+12}" stroke="#8C74D6" stroke-width="1.2" fill="none"/><circle cx="246" cy="${y+8}" r="2" fill="#8C74D6"/><circle cx="274" cy="${y+8}" r="2" fill="#8C74D6"/>`).join('')}</g>`;

  s+=`<g id="gOrg" transform="translate(90 0)">`;
  s+=`<path d="M 260 176 L 260 282 M 260 282 C 252 290 244 294 236 304 M 260 282 C 268 290 276 294 284 304" fill="none" stroke="#2C4B57" stroke-width="6" stroke-linecap="round"/><path d="M 260 176 L 260 282" fill="none" stroke="#3F6674" stroke-width="1.5" stroke-dasharray="2 3" class="cord"/>`;
  ORDER.forEach((k,oi)=>{
    const o=ORGS[k];
    s+=`<g class="org" data-org="${k}" id="o-${k}" style="--i:${oi}">`;
    o.parts.forEach(p=>{ s+=`<ellipse class="halo" cx="${p.c[0]}" cy="${p.c[1]}" rx="${p.r[0]*1.5+14}" ry="${p.r[1]*1.35+14}" fill="url(#halo)"/>`; });
    s+=`<g class="org-body">`;
    o.parts.forEach((p,i)=>{ s+=`<path class="org-shape" d="${p.d}" fill="url(#gr-${k})"/><path d="${p.d}" fill="url(#sheen)" pointer-events="none"/><path d="${p.d}" fill="none" stroke="${darken(o.fill,.6)}" stroke-width="3" stroke-opacity=".4" clip-path="url(#cl-${k}${i})" pointer-events="none"/>`; });
    if(o.detail) s+=`<g class="detail" fill="none" stroke="${darken(o.fill,.55)}" stroke-width="1" stroke-linecap="round" stroke-opacity=".75" pointer-events="none">${o.detail}</g>`;
    s+=`</g>`;
    if(k==='panc'){
      s+=`<g id="pancLod" class="lod" opacity="0" pointer-events="none">${[[250,527],[286,522],[318,512],[344,502]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3.8" fill="#D98E6C" stroke="#F2B894" stroke-width=".5"/><circle cx="${x}" cy="${y}" r="2.1" fill="#8FD3AE"/>`).join('')}</g>`;
    }
    if(k==='adr'){
      s+=`<g id="adrLod" class="lod" opacity="0" pointer-events="none">`;
      o.parts.forEach(p=>{ s+=`<path d="${p.d}" fill="#C8944C"/><path d="${p.d}" fill="none" stroke="#E8B872" stroke-opacity=".4" stroke-dasharray="1.5 3" transform="translate(${p.c[0]} ${p.c[1]+1}) scale(.8) translate(${-p.c[0]} ${-p.c[1]})" class="cord"/><path d="${p.d}" fill="#6E3C2C" transform="translate(${p.c[0]} ${p.c[1]+2}) scale(.52) translate(${-p.c[0]} ${-p.c[1]})"/><path d="${p.d}" fill="url(#sheen)"/>`; });
      s+=`</g>`;
    }
    o.parts.forEach(p=>{ s+=`<ellipse class="ring" cx="${p.c[0]}" cy="${p.c[1]}" rx="${p.r[0]+5}" ry="${p.r[1]+5}"/>`; });
    s+=`</g>`;
  });
  s+=`<g id="eyes">${[240,280].map((x,i)=>`<ellipse cx="${x}" cy="108" rx="7.5" ry="4.6" fill="#1C3038" stroke="#3A5E6A" stroke-width=".8"/><circle cx="${x}" cy="108" r="3.4" fill="#3B6573"/><circle class="pupil" id="${i?'pupL':'pupR'}" cx="${x}" cy="108" r="1.9" fill="#030809"/><path class="lid" d="M ${x-8.5} 108 C ${x-6} 101.5 ${x+6} 101.5 ${x+8.5} 108 C ${x+6} 109.5 ${x-6} 109.5 ${x-8.5} 108 Z" fill="#12303A" stroke="#3A5E6A" stroke-width=".8"/>`).join('')}</g>`;
  s+=`</g>`;
  s+=`<g id="gGlass" transform="translate(50 0)" pointer-events="none"><path d="${bp}" fill="url(#frontGlass)" clip-path="url(#bodyClip)"/><path d="${bp}" fill="none" stroke="#BfeaFF" stroke-opacity=".10" stroke-width="1" clip-path="url(#bodyClip)"/></g>`;   // a translucent front-of-body wall: organs read as inside a body, not painted on it

  /* brain · sagittal cutaway inset (front of the head faces left) */
  s+=`<g id="gInset"><path d="M 308 72 L 206 124" stroke="#3E6D79" stroke-dasharray="3 4" fill="none" class="cord"/>
   <circle cx="112" cy="150" r="96" fill="#07121A" stroke="#23505C" stroke-width="1.2" class="org-shape"/>
   <g clip-path="url(#insetClip)">
     <path d="M 30 152 C 26 104 60 68 112 66 C 162 64 198 96 200 138 C 201 158 194 172 182 178 C 172 182 160 180 150 176 L 134 172 C 126 174 118 180 110 184 C 98 188 82 188 68 184 C 48 178 32 168 30 152 Z" fill="#2B3450" stroke="#46557A" stroke-width=".9" class="cord"/>
     <g fill="none" stroke="#46557A" stroke-width=".8" stroke-linecap="round" opacity=".85"><path d="M 50 120 C 60 104 76 110 84 96"/><path d="M 92 84 C 104 92 116 80 128 86"/><path d="M 140 82 C 152 92 166 88 174 100"/><path d="M 180 112 C 188 124 190 136 186 148"/><path d="M 44 146 C 56 136 70 146 80 136"/><path d="M 150 110 C 160 118 170 116 176 126"/></g>
     <path d="M 66 146 C 76 118 146 110 170 140 C 162 138 150 128 120 128 C 96 128 80 134 74 150 Z" fill="#45527A"/>
     <ellipse cx="118" cy="158" rx="15" ry="10" fill="#38445F"/>
     <path d="M 146 184 C 162 172 196 176 198 198 C 200 216 182 224 164 220 C 150 216 142 200 146 184 Z" fill="#2F3A52" stroke="#46557A" stroke-width=".8"/>
     <g fill="none" stroke="#46557A" stroke-width=".7" opacity=".8"><path d="M 154 196 C 170 190 186 194 194 204"/><path d="M 152 207 C 168 203 182 207 190 215"/></g>
     <path d="M 132 176 C 140 194 146 216 148 250 L 128 250 C 128 222 124 200 118 184 Z" fill="#333E57"/>
     <ellipse cx="30" cy="180" rx="11" ry="9" fill="#1C3038" stroke="#3A5E6A" stroke-width=".8"/>
     <path d="M 39 180 L 84 182" stroke="#4E6A8C" stroke-width="2.4" stroke-linecap="round" fill="none"/><ellipse cx="84" cy="182" rx="4" ry="2.2" fill="#5A7394"/>
     <path d="M 100 180 C 98 186 96 190 95 193" stroke="#6D7BA0" stroke-width="1.8" fill="none" stroke-linecap="round"/>
   </g>
   ${Object.entries(INSET).map(([k,o])=>`<g class="org" data-org="${k}" id="o-${k}"><circle class="halo" cx="${o.c[0]}" cy="${o.c[1]}" r="${o.r*2.8}" fill="url(#halo)"/><circle class="org-shape" cx="${o.c[0]}" cy="${o.c[1]}" r="${o.r}" fill="${o.fill||(k==='pineal'||k==='scn'?'#5E5A8A':'#7263A0')}"/><circle cx="${o.c[0]-o.r*.3}" cy="${o.c[1]-o.r*.35}" r="${o.r*.45}" fill="#FFFFFF" opacity=".16" pointer-events="none"/><circle class="ring" cx="${o.c[0]}" cy="${o.c[1]}" r="${o.r+5}"/></g>`).join('')}
   <g id="pitLod" class="lod" opacity="0" pointer-events="none"><ellipse cx="92.6" cy="199.6" rx="4.4" ry="5" fill="#9A8BC8"/><ellipse cx="99.7" cy="198.4" rx="3" ry="4.1" fill="#4E4675"/><path d="M 96.8 194.6 L 96.6 204" stroke="#0B171C" stroke-width=".6"/></g>
   <text x="112" y="262" text-anchor="middle" font-family="Roboto Mono,monospace" font-size="8" letter-spacing="1" fill="#4F7680">BRAIN · CUTAWAY VIEW</text></g>`;
  s+=`<g id="gSigns"></g><g id="gRoutes"></g>`;
  $('#world').innerHTML=s;
  $('#miniSvg').innerHTML=`<g transform="translate(50 0)"><path d="${bodyPath()}" fill="#12303A" stroke="#2A5663" stroke-width="3"/></g><circle cx="112" cy="150" r="96" fill="none" stroke="#23505C" stroke-width="4"/><rect id="mv" fill="rgba(141,176,255,.12)" stroke="#8DB0FF" stroke-width="6" rx="10"/>`;
};

/* level of detail: cross-fade detail sets with zoom, and name structures when framed */
const fade=(z,a,b)=>Math.max(0,Math.min(1,(z-a)/(b-a))).toFixed(2);
HS.updateLod=function(z){ const a=$('#adrLod'), p=$('#pitLod'), n=$('#pancLod'); if(a) a.setAttribute('opacity',fade(z,2.8,4.6)); if(p) p.setAttribute('opacity',fade(z,4.4,6.8)); if(n) n.setAttribute('opacity',fade(z,2.6,4.4)); };
const near=(c,x,y,d)=>Math.abs(c[0]-x)<d&&Math.abs(c[1]-y)<d;
HS.lodLabels=function(L){
  if(L!=='structure') return [];
  const c=HS.viewCenter();
  if(near(c,300,518,60)) return [
    {key:'cortex',org:'adr',text:'Cortex · makes cortisol',anchor:[290,510],dx:-30,dy:-26,info:'adr'},
    {key:'medulla',text:'Medulla · makes adrenaline',anchor:[300,521],dx:34,dy:26,info:'adr'}];
  if(near(c,96,199,26)) return [
    {key:'antlobe',org:'pit',text:'Anterior lobe · ACTH',anchor:[91.5,202],dx:-26,dy:22,info:'pit'},
    {key:'postlobe',text:'Posterior lobe',anchor:[100.5,196],dx:24,dy:-20,info:'pit'}];
  if(near(c,378,520,34)) return [
    {key:'alpha',org:'panc',text:'Islet · alpha cells make glucagon',anchor:[373,519],dx:-30,dy:-26,info:'panc'},
    {key:'beta',text:'Beta cells make insulin',anchor:[376,522],dx:34,dy:28,info:'panc'}];
  return [];
};
})(window.HS);
