/* Remembered and shareable: progress kept only on this device (visited steps, revealed feedback,
   checked answers, dismissed tips, last pathway), erasable; and links that reopen a moment, paused. */
(function(HS){
const KEY='hs-v4-progress';
const blank=()=>({visited:{},revealed:{},attempts:[],tips:[],last:null});
let data=blank();
try{ const raw=localStorage.getItem(KEY); if(raw) data=Object.assign(blank(),JSON.parse(raw)); }catch(e){}
HS.store=data;

let saveT=0;
HS.saveSoon=()=>{ clearTimeout(saveT); saveT=setTimeout(HS.saveNow,200); };
HS.saveNow=function(){
  const p=HS.exportProgress(); data.visited=p.visited; data.revealed=p.revealed; data.tips=[...HS.tipsSeen];
  try{ localStorage.setItem(KEY,JSON.stringify(data)); }catch(e){}
  HS.renderSummary();
};
HS.recordAttempt=a=>{ data.attempts.push({...a,at:Date.now()}); data.attempts=data.attempts.slice(-200); HS.saveSoon(); };
HS.setLast=(scene,path)=>{ data.last={scene,path}; HS.saveSoon(); };
HS.loadProgress=()=>{ HS.importProgress(data); (data.tips||[]).forEach(k=>HS.tipsSeen.add(k)); };
HS.eraseProgress=function(){
  data=blank(); HS.store=data;
  try{ localStorage.removeItem(KEY); }catch(e){}
  HS.importProgress(data); HS.tipsSeen.clear();
};

/* links: #s=scene&p=pathway&t=time&h=step&c=x,y,zoom&r=1 (revealed) */
let hashT=0;
HS.syncHash=()=>{ if(HS.restoring) return; clearTimeout(hashT); hashT=setTimeout(HS.syncHashNow,300); };
HS.syncHashNow=function(){
  const E=HS.E; let h='';
  if(E.state==='triggered'&&E.route){
    const c=HS.viewCenter();
    h='#'+[`s=${E.sceneId}`,`p=${E.route}`,`t=${E.tIdx}`,`h=${E.cur}`,`c=${c[0].toFixed(0)},${c[1].toFixed(0)},${HS.zoomRatio().toFixed(2)}`].concat(HS.isRevealed()?['r=1']:[]).join('&');
  }
  try{ if(location.hash!==h) history.replaceState(null,'',location.pathname+location.search+h); }catch(e){}
};
HS.restoreFromHash=async function(){
  const q=new URLSearchParams(location.hash.slice(1)), s=q.get('s'), p=q.get('p'), S=HS.scenes[s];
  if(!S||!S.pathways[p]) return false;
  HS.restoring=true; HS.instant=true; HS.applyRM();
  try{
    if(q.get('r')==='1') HS.markRevealed(s,p);
    HS.openPathway(s,p,false); await HS.sleep(0);
    const h=parseInt(q.get('h'),10); if(h>=0&&h<S.pathways[p].hots.length) await HS.goHot(h,false);
    const t=parseInt(q.get('t'),10), T=S.pathways[p].time||S.time; if(t>=0&&t<T.length) HS.setTime(t);
    const c=(q.get('c')||'').split(',').map(Number); if(c.length===3&&c.every(Number.isFinite)) HS.setView(c[0],c[1],c[2]);
  } finally { HS.instant=false; HS.restoring=false; HS.applyRM(); }
  HS.setPlayUI(); HS.toast('Opened a shared moment, paused.'); HS.saveSoon();
  return true;
};
})(window.HS);
