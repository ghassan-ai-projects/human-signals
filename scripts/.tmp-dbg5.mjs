import { chromium } from 'playwright';
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:8765/v4/', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
// what would routeWord produce for dark:night's clockPineal BEFORE the scene-file normalisation?
const r = await page.evaluate(() => {
  const HS = window.HS;
  HS.routeWord = id => 'schematic ' + HS.routeText(id);
  HS.openPathway('dark','night',false);
  const S = HS.E.scene;
  return Object.keys(S.routes).map(id => ({ id, raw: S.routes[id].label || HS.gateLabel(id), worded: HS.routeWord(id) }));
});
console.log(JSON.stringify(r,null,1));
// plate width of the un-normalised double
await page.waitForTimeout(600);
const w = await page.evaluate(() => {
  const host = document.querySelector('#labels');
  const mk = t => { const d=document.createElement('div'); d.className='lab sig'; d.style.position='absolute'; d.style.left='-9999px'; d.innerHTML=`<span>${t}</span>`; host.appendChild(d); const r={t,w:d.offsetWidth,sw:d.scrollWidth}; d.remove(); return r; };
  return [mk('schematic nerve signals · schematic route'), mk('schematic nerve signals'), mk('nerve signals · schematic route')];
});
console.log(JSON.stringify(w,null,1));
await b.close();
