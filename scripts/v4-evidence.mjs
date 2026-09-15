/* Regenerates the round-4 evidence screenshots. Run with:
     node scripts/v4-evidence.mjs        (server on :8765)
   Kept as a script so the evidence is reproducible rather than hand-captured. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const BASE = process.env.V4_BASE || 'http://localhost:8765/v4/';
const OUT = process.env.V4_OUT || 'docs/design-review-evidence/v4';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));

const fresh = async () => { await page.goto(BASE, { waitUntil: 'networkidle' }); await page.waitForTimeout(1300); };
const quiet = async () => page.evaluate(() => { document.querySelectorAll('.tip').forEach((t) => t.remove()); });
const shot = async (n) => { const f = n.endsWith('.png') ? n : `${n}.png`; await page.screenshot({ path: `${OUT}/${f}` }); console.log('  captured', f); };

/* 27 first run: aliases + the way in */
await fresh(); await shot('27-first-run.png');

/* 28 the route grammar, taught once on the body */
await page.evaluate(() => window.HS.openPathway('stress', 'fast', false));
await page.waitForTimeout(1100); await shot('28-route-grammar-tip.png');

/* 29 the unrevealed line says so, in shape and words */
await fresh();
await page.evaluate(() => window.HS.openPathway('stress', 'slow', false));
await page.waitForTimeout(1000); await quiet(); await shot('29-unrevealed-line.png');

/* 30 the not-a-vessel answer on a route card */
await page.evaluate(() => {
  const rt = [...document.querySelectorAll('#world .rhit')].find((x) => x.getAttribute('data-st') === 'on');
  if (rt) rt.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await page.waitForTimeout(500); await shot('30-route-card-schematic.png');

/* 31 the same answer at the top of Read the route */
await page.evaluate(() => { window.HS.closeCards(); window.HS.openRead(); });
await page.waitForTimeout(600); await shot('31-read-disclaimer-top.png');

/* 32 say it back, on demand and ungraded */
await fresh();
await page.evaluate(() => window.HS.openPathway('stress', 'slow', false));
await page.waitForTimeout(900);
await page.evaluate(() => { window.HS.tipsOn = false; document.querySelectorAll('.tip').forEach((t) => t.remove()); });
await page.click('#bSay'); await page.waitForTimeout(600);
await shot('32-say-it-back.png');

/* 33 a dead-end system row, explaining itself */
await page.evaluate(() => { window.HS.closeReflect(false); });
await fresh();
await page.evaluate(() => document.querySelector('#tree [data-id="thyroid"]').click());
await page.waitForTimeout(500); await shot('33-not-built-row.png');

/* 34 the reading UI at 200% text zoom (E1 follow-up check) */
await fresh();
await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
await page.waitForTimeout(700); await shot('34-text-zoom-200.png');

/* 35 grayscale: route states must still separate */
await fresh();
await page.evaluate(() => window.HS.openPathway('stress', 'slow', false));
await page.waitForTimeout(900); await quiet();
await page.addStyleTag({ content: 'html{filter:grayscale(1)}' });
await page.waitForTimeout(300); await shot('35-grayscale-routes.png');

await browser.close();
console.log(errs.length ? `CONSOLE ERRORS: ${JSON.stringify(errs.slice(0, 5))}` : 'no console errors across all evidence captures');
process.exit(errs.length ? 1 : 0);
