/* Camera: one continuous, bounded canvas. viewBox pan/zoom, framing presets, mini-map, zoom level. */
(function(HS){
const $=HS.$, app=HS.app, world=$('#world');
let vb={x:0,y:0,w:700,h:780}, camRaf=0, lastLevel='';
const cam=HS.cam={region:'body',suppressClick:false};

const panelOpen=()=>!$('#panel').classList.contains('closed');
const bottomOn=()=>!$('#bottom').classList.contains('hidden');
const sheetOn=()=>!$('#sheet').classList.contains('closed');
const cardOn=()=>!!document.querySelector('#tryCard,#wiCard,#rbCard,#cmpCard');
function avail(){ const W=app.clientWidth,H=app.clientHeight; const left=panelOpen()?334:30; const bottom=bottomOn()?200:40; const right=Math.max(sheetOn()?430:150,cardOn()?366:150); return {W,H,x:left,y:84,w:Math.max(200,W-left-right),h:Math.max(200,H-84-bottom)}; }
function targetVB(r,pad){ const a=avail(); const s=Math.min(a.w/(r.w*(1+pad)),a.h/(r.h*(1+pad))); return {x:(r.x+r.w/2)-(a.x+a.w/2)/s, y:(r.y+r.h/2)-(a.y+a.h/2)/s, w:a.W/s, h:a.H/s}; }
function bodyScale(){ const a=avail(); return Math.min(a.w/(HS.REG.body.w*1.06),a.h/(HS.REG.body.h*1.06)); }
const scale=()=>app.clientWidth/vb.w;
HS.scale=scale;

HS.zoomRatio=()=>scale()/bodyScale();
HS.level=()=>{ const z=HS.zoomRatio(); return z<2.2?'body':(z<6.5?'organ':'structure'); };
HS.project=(x,y)=>{ const s=scale(); return [(x-vb.x)*s,(y-vb.y)*s]; };
HS.viewCenter=()=>[vb.x+vb.w/2,vb.y+vb.h/2];
HS.unproject=(px,py)=>{ const s=scale(); return [vb.x+px/s,vb.y+py/s]; };
HS.resetLevel=()=>{ lastLevel=''; };

const CHIP={body:'Whole body · <b>plain story</b>',organ:'Organ · <b>pathway names</b>',structure:'Close-up · <b>precise location</b>',cell:'Cell · <b>mechanism</b>'};
const RUNG={body:0,organ:1,structure:1,cell:2};   // three rungs: body → organ (incl. close-up) → cell
const RUNGLBL={body:'whole body',organ:'organ',structure:'close-up',cell:'cell'};
HS.depthChip=function(state){
  const c=$('#lvlChip'); if(!c) return; const r=RUNG[state]!=null?RUNG[state]:0;
  c.setAttribute('aria-label','Depth: '+RUNGLBL[state]);
  c.innerHTML=`<span class="rungs" aria-hidden="true">${[0,1,2].map(i=>`<i class="${i===r?'on':''}"></i>`).join('')}</span><span class="dlab">${CHIP[state]}</span>`;
};
HS.updateView=function(){
  world.setAttribute('viewBox',`${vb.x.toFixed(2)} ${vb.y.toFixed(2)} ${vb.w.toFixed(2)} ${vb.h.toFixed(2)}`);
  HS.updateLod(HS.zoomRatio());
  const L=HS.level();
  if(L!==lastLevel){ lastLevel=L; if(!HS.E.cellOpen) HS.depthChip(L); HS.onLevel(L); }
  const mv=$('#mv'); if(mv){ mv.setAttribute('x',vb.x); mv.setAttribute('y',vb.y); mv.setAttribute('width',vb.w); mv.setAttribute('height',vb.h); }
  HS.renderOverlay();
  if(HS.syncHash) HS.syncHash();
};
/* frame a world point at a zoom ratio relative to the whole-body fit (used by links) */
HS.setView=function(cx,cy,z){ const W=app.clientWidth,H=app.clientHeight, s=bodyScale()*Math.max(.85,Math.min(18,z)); vb={x:cx-W/2/s,y:cy-H/2/s,w:W/s,h:H/s}; cam.region=null; HS.updateView(); };
HS.camTo=function(name,dur=650,pad=.12){ cam.region=name; return animateTo(targetVB(HS.REG[name],pad),dur); };
function animateTo(t,dur){
  cancelAnimationFrame(camRaf); app.classList.remove('busy');
  if(HS.RM()||dur===0){ vb=t; HS.updateView(); return Promise.resolve(); }
  const f={...vb}, t0=performance.now(); app.classList.add('busy');
  return new Promise(res=>{
    const step=now=>{
      const k=Math.min(1,(now-t0)/dur), e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
      const w=Math.exp(Math.log(f.w)+(Math.log(t.w)-Math.log(f.w))*e), h=w*(t.h/t.w);
      const cx=(f.x+f.w/2)+((t.x+t.w/2)-(f.x+f.w/2))*e, cy=(f.y+f.h/2)+((t.y+t.h/2)-(f.y+f.h/2))*e;
      vb={x:cx-w/2,y:cy-h/2,w,h}; HS.updateView();
      if(k<1) camRaf=requestAnimationFrame(step); else { app.classList.remove('busy'); res(); }
    };
    camRaf=requestAnimationFrame(step);
  });
};
HS.zoomBy=function(f,px,py){
  const W=app.clientWidth,H=app.clientHeight; if(px===undefined){px=W/2;py=H/2;}
  const s=scale(), wx=vb.x+px/s, wy=vb.y+py/s, s0=bodyScale();
  const ns=Math.max(s0*.85,Math.min(s0*18,s*f));
  vb={x:wx-px/ns,y:wy-py/ns,w:W/ns,h:H/ns}; cam.region=null; HS.updateView();
};

world.addEventListener('wheel',e=>{ e.preventDefault(); const r=app.getBoundingClientRect(); HS.zoomBy(Math.exp(-e.deltaY*.0018),e.clientX-r.left,e.clientY-r.top); },{passive:false});
let drag=null;
world.addEventListener('pointerdown',e=>{ if(e.button!==0) return; drag={x:e.clientX,y:e.clientY,moved:false}; });
window.addEventListener('pointermove',e=>{ if(!drag) return; const dx=e.clientX-drag.x, dy=e.clientY-drag.y; if(!drag.moved && Math.hypot(dx,dy)<5) return; drag.moved=true; world.classList.add('dragging'); const s=scale(); vb.x-=dx/s; vb.y-=dy/s; drag.x=e.clientX; drag.y=e.clientY; cam.region=null; HS.updateView(); });
window.addEventListener('pointerup',()=>{ if(drag&&drag.moved){ cam.suppressClick=true; setTimeout(()=>cam.suppressClick=false,60); } drag=null; world.classList.remove('dragging'); });
window.addEventListener('resize',()=>{ HS.camTo(cam.region||'body',0); });
$('#zIn').addEventListener('click',()=>HS.zoomBy(1.6));
$('#zOut').addEventListener('click',()=>HS.zoomBy(1/1.6));
$('#zReset').addEventListener('click',()=>HS.camTo('body'));

/* double-click empty canvas: zoom in one step around the pointer */
world.addEventListener('dblclick',e=>{
  if(e.target.closest('.org')) return;
  const r=app.getBoundingClientRect(), px=e.clientX-r.left, py=e.clientY-r.top, s=scale(), ns=Math.min(bodyScale()*18,s*2.2), W=app.clientWidth, H=app.clientHeight;
  const wx=vb.x+px/s, wy=vb.y+py/s; cam.region=null; animateTo({x:wx-px/ns,y:wy-py/ns,w:W/ns,h:H/ns},450);
});
/* arrow keys pan while the canvas has focus */
world.addEventListener('keydown',e=>{
  const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key]; if(!d) return;
  e.preventDefault(); const s=scale(); vb.x+=d[0]*80/s; vb.y+=d[1]*80/s; cam.region=null; HS.updateView();
});
/* mini-map: click (or Enter) returns to the whole body; dragging moves the view */
const mini=$('#mini'); let md=null;
mini.addEventListener('pointerdown',e=>{ md={x:e.clientX,y:e.clientY,moved:false}; mini.setPointerCapture(e.pointerId); });
mini.addEventListener('pointermove',e=>{
  if(!md) return; const dx=e.clientX-md.x, dy=e.clientY-md.y; if(!md.moved&&Math.hypot(dx,dy)<4) return;
  md.moved=true; const r=$('#miniSvg').getBoundingClientRect(), k=Math.min(r.width/700,r.height/780);
  vb.x+=dx/k; vb.y+=dy/k; md.x=e.clientX; md.y=e.clientY; cam.region=null; HS.updateView();
});
mini.addEventListener('pointerup',()=>{ const moved=md&&md.moved; md=null; if(!moved) HS.camTo('body'); });
mini.addEventListener('click',e=>{ if(e.detail===0) HS.camTo('body'); });
/* focus never hides under a floating panel: nudge the view so the focused control sits in the open area */
HS.ensureVisible=function(el){
  const a=avail(), r=el.getBoundingClientRect(), ar=app.getBoundingClientRect(), m=28;
  const cx=r.left-ar.left+r.width/2, cy=r.top-ar.top+r.height/2;
  const dx=cx<a.x+m?cx-(a.x+m):cx>a.x+a.w-m?cx-(a.x+a.w-m):0, dy=cy<a.y+m?cy-(a.y+m):cy>a.y+a.h-m?cy-(a.y+a.h-m):0;
  if(!dx&&!dy) return; const s=scale(); cam.region=null; animateTo({x:vb.x+dx/s,y:vb.y+dy/s,w:vb.w,h:vb.h},300);
};
})(window.HS);
