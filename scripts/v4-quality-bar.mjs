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

/* ---------- 1b. the label ceiling DURING playback ----------
   The paused audit above structurally cannot see the peak: pressing ▶ adds the travelling
   pulse's own route name (engine.js getLabels) on top of the hotspot labels, which is what
   takes stress:slow from 7 to 8. Any new always-on label has to fit under the cap in THIS
   state, so it is measured here rather than inferred. */
await page.setViewportSize({ width: 1440, height: 900 });
for (const [scene, path] of PATHWAYS) {
  const view = `play:${scene}:${path}`;
  await page.evaluate(([s, p]) => window.HS.openPathway(s, p, false), [scene, path]);
  await page.waitForTimeout(600);
  const paused = await page.evaluate(() => document.querySelectorAll('#labels .lab').length);
  await page.evaluate(() => {
    const b = document.querySelector('#bPlay') || document.querySelector('[data-play]');
    if (b) b.click();
  });
  let peak = paused, seen = 0;
  for (let i = 0; i < 24; i++) {
    await page.waitForTimeout(150);
    const n = await page.evaluate(() => document.querySelectorAll('#labels .lab').length);
    seen = Math.max(seen, n);
  }
  peak = Math.max(paused, seen);
  await page.evaluate(() => window.HS.stopPlay && window.HS.stopPlay());
  await page.waitForTimeout(120);
  rec(view, 'labels ≤ 8 during playback (the real peak)', peak <= 8,
    `paused=${paused} peak during play=${peak}`, peak);
}

/* ---------- 1c. an active route still has a visible name ----------
   A route name with nowhere free is dropped rather than overlapped (overlay.js), so a
   longer label can silently remove a route's name while every other check stays green:
   the label count goes DOWN and overlaps stay 0. This is the check that catches it. */
for (const [scene, path] of PATHWAYS) {
  const view = `names:${scene}:${path}`;
  await page.evaluate(([s, p]) => window.HS.openPathway(s, p, false), [scene, path]);
  await page.waitForTimeout(700);
  // walk one step in, which is when at least one route name is expected on the body
  await page.evaluate(() => { const n = document.querySelector('#bNext'); if (n) n.click(); });
  await page.waitForTimeout(450);
  const r = await page.evaluate(() => {
    const on = Object.entries(window.HS.rstate || {}).filter(([, v]) => v === 'on').map(([k]) => k);
    const texts = [...document.querySelectorAll('#labels .lab')].map((e) => e.textContent.trim().toLowerCase());
    const named = on.filter((id) => {
      const rt = (window.HS.routeText && window.HS.routeText(id)) || '';
      const first = rt.toLowerCase().split(/[·—-]/)[0].trim();
      return first && texts.some((t) => t.includes(first));
    });
    return { on, named, level: window.HS.level() };
  });
  // only meaningful where a route name is expected at all (not body level of a hotspot scene)
  const expectName = r.level !== 'body';
  rec(view, 'every active route still has a visible name', !expectName || r.named.length === r.on.length || r.on.length === 0,
    `level=${r.level} on=[${r.on}] named=[${r.named}]`);
}

/* ---------- 2. grayscale survival ---------- */
await page.setViewportSize({ width: 1440, height: 900 });
await page.evaluate(() => window.HS.openPathway('stress', 'slow', false));
await page.waitForTimeout(700);

const GRAY = () => {
  /* Whether the route STATES stay distinguishable without hue. Scoped to route paths and
     tagged with their rstate, because the §10 requirement is that a learner can tell an
     active route from a faint one from an unrevealed one in grayscale — a luminance spread
     over every decorative mark in the scene does not test that and passes trivially. */
  const lum = (c) => {
    const m = c.match(/\d+(\.\d+)?/g);
    if (!m) return null;
    const [r, g, b, a] = m.map(Number);
    if (a === 0) return null;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const states = { on: [], faint: [], ghost: [] };
  for (const el of document.querySelectorAll('#world path.route')) {
    const id = el.getAttribute('data-route') || (el.id || '').replace(/^r-/, '');
    const st = (window.HS.rstate || {})[id];
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1) continue;
    const entry = { lum: lum(s.stroke || ''), dash: s.strokeDasharray, op: +s.opacity, w: +s.strokeWidth.replace('px', '') || 0 };
    if (entry.lum != null && states[st]) states[st].push(entry);
  }
  return states;
};

const gray = await page.evaluate(GRAY);
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const onL = avg(gray.on.map((m) => m.lum).filter((n) => n != null));
const faintL = avg(gray.faint.map((m) => m.lum).filter((n) => n != null));
const ghostL = avg(gray.ghost.map((m) => m.lum).filter((n) => n != null));
/* In grayscale, "active vs faint" must be told apart by opacity/weight, and "unrevealed"
   by its dash pattern. Assert the separations that the states actually rely on. */
const faintOp = avg(gray.faint.map((m) => m.op));
const onOp = avg(gray.on.map((m) => m.op));
const ghostDash = gray.ghost.some((m) => m.dash && m.dash !== 'none');
rec('grayscale', 'active vs faint routes separate by opacity without hue',
  onOp != null && faintOp != null && onOp - faintOp >= 0.3,
  `on op=${onOp && onOp.toFixed(2)} faint op=${faintOp && faintOp.toFixed(2)}`,
  onOp != null && faintOp != null ? +(onOp - faintOp).toFixed(2) : null);
rec('grayscale', 'the unrevealed route carries a dash distinction without hue', ghostDash,
  `ghost marks=${gray.ghost.length} dashed=${gray.ghost.filter((m) => m.dash && m.dash !== 'none').length}`);
rec('grayscale', 'the three route states are present and were actually sampled',
  gray.on.length > 0 && gray.faint.length > 0 && gray.ghost.length > 0,
  `on=${gray.on.length} faint=${gray.faint.length} ghost=${gray.ghost.length}`);

/* ---------- 3. reduced-motion walk-through, all five pathways ---------- */
await page.evaluate(() => {
  window.HS.userRM = true; window.HS.applyRM();
});
for (const [scene, path] of PATHWAYS) {
  const view = `rm:${scene}:${path}`;
  await page.evaluate(([s, p]) => window.HS.openPathway(s, p, false), [scene, path]);
  await page.waitForTimeout(400);
  /* Assert a REAL advance: the current step must move forward and the visited count must
     grow. The previous version asserted `after >= before` on an empty selector, so it
     could not fail and was not evidence of anything. */
  const played = await page.evaluate(async () => {
    const cur = () => (window.HS.E ? window.HS.E.cur : -1);
    const visited = () => document.querySelectorAll('#labels .hs.visited, #labels .hs.done').length;
    const before = { cur: cur(), visited: visited() };
    const next = document.querySelector('#bNext') || document.querySelector('[data-next]')
      || document.querySelector('#bPlay');   // under RM #bPlay's label is "Next step"
    if (next) { next.click(); await new Promise((r) => setTimeout(r, 400)); }
    return { before, after: { cur: cur(), visited: visited() } };
  });
  rec(view, 'reduced motion: Next step really advances one step',
    played.after.cur > played.before.cur,
    `cur ${played.before.cur}→${played.after.cur} (visited ${played.before.visited}→${played.after.visited})`);
}

/* Under reduced motion, nothing on stage may animate. Two-pronged on purpose: checking
   animationName alone passes on #sheet, whose motion is a transition, so a
   transition-only omission would slip through. */
const rmAnim = await page.evaluate(() => {
  const sel = ['#world', '#overlay', '#sheet', '.card', '.try', '.tip', '.lab', '.hs',
    '.route', '.route.ghostin', '.toolbar', '.panel', '.pbar', '#bottom', '#night', '.atmos'];
  const bad = [];
  for (const s of sel) {
    for (const el of document.querySelectorAll(s)) {
      const cs = getComputedStyle(el);
      const dur = Math.max(...cs.transitionDuration.split(',').map((d) => parseFloat(d) || 0));
      if (cs.animationName !== 'none') bad.push(`${s}: animation ${cs.animationName}`);
      if (dur > 0.13) bad.push(`${s}: transition ${dur}s`);
    }
  }
  return bad;
});
rec('rm:stage', 'nothing on stage animates or transitions under reduced motion',
  rmAnim.length === 0, rmAnim.slice(0, 6).join(' | ') || 'clean');
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
