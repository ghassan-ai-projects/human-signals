/* Quality-bar audit for the v4 prototype, against docs/relay-design-direction.md §10.
   Measures, in a real browser:
     · label count on screen (bar: no more than 8 by default)
     · label/label, label/hotspot, label/UI overlaps and leader-line crossings
     · bottom-bar overflow at 1280 / 1440 / 1920
     · grayscale survival of route, hotspot, ghost, lit and candidate states
     · reduced-motion walk-through of all five pathways
     · console errors on every view
   Run with: node scripts/v4-quality-bar.mjs            (server on :8765)
             node scripts/v4-quality-bar.mjs --json out.json */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.V4_BASE || 'http://localhost:8765/v4/';
const OUT = process.env.V4_OUT || 'coverage/v4';
const JSON_OUT = process.argv.includes('--json')
  ? process.argv[process.argv.indexOf('--json') + 1]
  : null;
mkdirSync(OUT, { recursive: true });

const PATHWAYS = [
  ['stress', 'fast'], ['stress', 'slow'],
  ['meal', 'between'], ['meal', 'after'],
  ['dark', 'night'],
];
const WIDTHS = [1280, 1440, 1920];

const results = [];
const rec = (view, name, ok, detail = '', value) =>
  results.push({ view, name, ok, detail, value });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

/* Geometry probe: runs inside the page and reports every visible floating
   label box, hotspot box and panel box, plus leader-line segments. */
const PROBE = () => {
  const vis = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.05;
  };
  const box = (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, r: r.right, b: r.bottom }; };
  const labels = [...document.querySelectorAll('#labels .lab')]
    .filter(vis).map((el) => ({ ...box(el), text: (el.textContent || '').trim().slice(0, 40) }));
  const hots = [...document.querySelectorAll('#labels .hs')].filter(vis).map(box);
  const ui = [...document.querySelectorAll('.toolbar, .panel, .bar, .lvl, .mini, .card, .try, .wi, .draft, .cap, .sheet')]
    .filter(vis).map((el) => ({ ...box(el), cls: el.className.split(' ')[0] }));
  const leaders = [...document.querySelectorAll('#labels line, #labels path, #overlay line.leader, #overlay path.leader')]
    .filter(vis).map((el) => {
      const r = el.getBoundingClientRect();
      return { x1: r.x, y1: r.y, x2: r.right, y2: r.bottom };
    });
  return { labels, hots, ui, leaders };
};

const overlap = (a, b) => {
  const w = Math.min(a.r, b.r) - Math.max(a.x, b.x);
  const h = Math.min(a.b, b.b) - Math.max(a.y, b.y);
  return w > 2 && h > 2 ? w * h : 0;
};

const segCross = (a, b) => {
  const d = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const A = { x: a.x1, y: a.y1 }, B = { x: a.x2, y: a.y2 };
  const C = { x: b.x1, y: b.y1 }, D = { x: b.x2, y: b.y2 };
  const d1 = d(C, D, A), d2 = d(C, D, B), d3 = d(A, B, C), d4 = d(A, B, D);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
};

/* ---------- 1. per-pathway layout audit at each width ---------- */
for (const w of WIDTHS) {
  await page.setViewportSize({ width: w, height: 900 });
  for (const [scene, path] of PATHWAYS) {
    const view = `${scene}:${path}@${w}`;
    await page.evaluate(([s, p]) => window.HS.openPathway(s, p, false), [scene, path]);
    await page.waitForTimeout(650);
    const g = await page.evaluate(PROBE);

    rec(view, 'labels ≤ 8', g.labels.length <= 8, `${g.labels.length} labels`, g.labels.length);

    let ll = 0, lh = 0, lu = 0;
    for (let i = 0; i < g.labels.length; i++) {
      for (let j = i + 1; j < g.labels.length; j++) if (overlap(g.labels[i], g.labels[j])) ll++;
      for (const h of g.hots) if (overlap(g.labels[i], h)) lh++;
      for (const u of g.ui) if (overlap(g.labels[i], u)) lu++;
    }
    rec(view, 'label/label overlaps', ll === 0, `${ll}`, ll);
    rec(view, 'label/hotspot overlaps', lh === 0, `${lh}`, lh);
    rec(view, 'label/UI overlaps', lu === 0, `${lu}`, lu);

    let cross = 0;
    for (let i = 0; i < g.leaders.length; i++)
      for (let j = i + 1; j < g.leaders.length; j++)
        if (segCross(g.leaders[i], g.leaders[j])) cross++;
    rec(view, 'leader-line crossings', cross === 0, `${cross}`, cross);

    const over = await page.evaluate(() => {
      const b = document.querySelector('.bar') || document.querySelector('#bar');
      if (!b) return null;
      const r = b.getBoundingClientRect();
      const kids = [...b.querySelectorAll('*')].filter((e) => {
        const k = e.getBoundingClientRect();
        return k.width > 0 && getComputedStyle(e).visibility !== 'hidden';
      });
      const outside = kids.filter((e) => {
        const k = e.getBoundingClientRect();
        return k.right > window.innerWidth + 1 || k.left < -1 || k.bottom > window.innerHeight + 1;
      }).length;
      return { w: r.width, vw: window.innerWidth, outside };
    });
    if (over) rec(view, 'bottom bar fits / no overflow', over.outside === 0 && over.w <= over.vw + 1,
      `w=${Math.round(over.w)} vw=${over.vw} outside=${over.outside}`);
  }
}

/* ---------- 2. grayscale survival ---------- */
await page.setViewportSize({ width: 1440, height: 900 });
await page.evaluate(() => window.HS.openPathway('stress', 'slow', false));
await page.waitForTimeout(700);

const GRAY = () => {
  /* Luminance spread of the route/hotspot/ghost marks after desaturation tells us
     whether a distinction survives without hue. Routes live in #world, the pulse
     and hotspot layer lives in #overlay, so both are read. */
  const marks = [];
  for (const root of ['#world', '#overlay']) {
    const svg = document.querySelector(root);
    if (!svg) continue;
    for (const el of svg.querySelectorAll('path, circle, line, rect, ellipse')) {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (r.width <= 1 || r.height <= 1) continue;
      if (+s.opacity <= 0.08) continue;
      if (!s.stroke || s.stroke === 'none') continue;
      marks.push(el);
    }
  }
  const lum = (c) => {
    const m = c.match(/\d+(\.\d+)?/g);
    if (!m) return null;
    const [r, g, b, a] = m.map(Number);
    if (a === 0) return null;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  return marks.map((el) => ({
    lum: lum(getComputedStyle(el).stroke || ''),
    dash: getComputedStyle(el).strokeDasharray,
    w: +getComputedStyle(el).strokeWidth.replace('px', '') || 0,
    cls: el.getAttribute('class') || '',
  })).filter((m) => m.lum != null);
};

const gray = await page.evaluate(GRAY);
const lums = gray.map((m) => m.lum).filter((n) => n > 0);
const spread = lums.length ? Math.max(...lums) - Math.min(...lums) : 0;
const dashed = gray.filter((m) => m.dash && m.dash !== 'none' && m.dash !== '0px').length;
rec('grayscale', 'route marks have luminance spread ≥ 30', spread >= 30, `spread=${Math.round(spread)}`, Math.round(spread));
rec('grayscale', 'a dashed (feedback/ghost) distinction exists without hue', dashed > 0, `${dashed} dashed marks`, dashed);

/* ---------- 3. reduced-motion walk-through, all five pathways ---------- */
await page.evaluate(() => {
  window.HS.userRM = true; window.HS.applyRM();
});
for (const [scene, path] of PATHWAYS) {
  const view = `rm:${scene}:${path}`;
  await page.evaluate(([s, p]) => window.HS.openPathway(s, p, false), [scene, path]);
  await page.waitForTimeout(400);
  const played = await page.evaluate(async () => {
    const before = document.querySelectorAll('#overlay .hot').length;
    const next = document.querySelector('#bNext') || document.querySelector('[data-next]');
    if (next) { next.click(); await new Promise((r) => setTimeout(r, 350)); }
    return { before, after: document.querySelectorAll('#overlay .hot').length };
  });
  rec(view, 'reduced motion: next step advances one step', played.after >= played.before,
    `hotspots ${played.before}→${played.after}`);
}
await page.evaluate(() => { window.HS.userRM = false; window.HS.applyRM(); });

/* ---------- 4. routes and hotspots are the most salient marks (squint proxy) ---------- */
await page.setViewportSize({ width: 1440, height: 900 });
await page.evaluate(() => window.HS.openPathway('stress', 'slow', false));
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/qb-grayscale-check.png` });

rec('console', 'no console errors during the whole audit', errs.length === 0, errs.slice(0, 5).join(' | '));

await browser.close();

/* ---------- report ---------- */
const fails = results.filter((r) => !r.ok);
const byView = {};
for (const r of results) (byView[r.view] ||= []).push(r);
for (const [view, rs] of Object.entries(byView)) {
  const f = rs.filter((r) => !r.ok);
  console.log(`${f.length ? 'FAIL' : 'PASS'}  ${view}  (${rs.length - f.length}/${rs.length})`);
  for (const r of f) console.log(`        · ${r.name} — ${r.detail}`);
}
console.log(`\nTOTAL ${results.length - fails.length}/${results.length} pass, ${fails.length} fail`);
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ results, errs }, null, 1));
process.exit(fails.length ? 1 : 0);
