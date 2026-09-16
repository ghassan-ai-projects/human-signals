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

/* ---------- 5. text scales with the user's font size (WCAG 2.2 · 1.4.4) ----------
   The reading UI must respond to a larger base font size, not just to browser zoom. This
   caught a real gap: body used rem but the interface components were hardcoded px, so the
   primary navigation did not grow at all when the base size doubled. */
await page.setViewportSize({ width: 1440, height: 900 });
await page.evaluate(() => window.HS.openPathway('stress', 'slow', false));
await page.waitForTimeout(600);
const scale = await page.evaluate(() => {
  const px = (s) => { const e = document.querySelector(s); return e ? parseFloat(getComputedStyle(e).fontSize) : null; };
  const w = (s) => { const e = document.querySelector(s); return e ? parseFloat(getComputedStyle(e).width) : null; };
  return { trig: px('#triggers .trig'), sec: px('.sec'), row: px('.row'), panel: w('.panel') };
});
await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
await page.waitForTimeout(500);
const scale2 = await page.evaluate(() => {
  const px = (s) => { const e = document.querySelector(s); return e ? parseFloat(getComputedStyle(e).fontSize) : null; };
  const w = (s) => { const e = document.querySelector(s); return e ? parseFloat(getComputedStyle(e).width) : null; };
  return { trig: px('#triggers .trig'), sec: px('.sec'), row: px('.row'), panel: w('.panel') };
});
await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
rec('text-zoom', 'the reading UI doubles its text at 200% base font size',
  scale.trig != null && scale2.trig >= scale.trig * 1.9 && scale2.sec >= scale.sec * 1.9 && scale2.row >= scale.row * 1.9,
  `trig ${scale.trig}→${scale2.trig} · sec ${scale.sec}→${scale2.sec} · row ${scale.row}→${scale2.row}`);
rec('text-zoom', 'text containers grow with the text so it is not cramped',
  scale.panel != null && scale2.panel >= scale.panel * 1.9,
  `panel ${scale.panel}→${scale2.panel}`);
/* Text at 200% must not push a control off screen or hide content under a panel. */
const bigState = await page.evaluate(() => {
  const inView = (b) => b.left >= -1 && b.right <= window.innerWidth + 1 && b.top >= -1 && b.bottom <= window.innerHeight + 1;
  const clipped = [...document.querySelectorAll('#pbar button, #pbar .chip, .panel button, .zoomer button')]
    .filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && !inView(b); })
    .map((e) => e.id || e.className);
  const rib = document.querySelector('.ribbon').getBoundingClientRect();
  const words = [...document.querySelectorAll('.rb-words span')]
    .filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && (b.right > rib.right + 1 || b.left < rib.left - 1); })
    .map((e) => e.textContent);
  const cap = document.querySelector('.caption').getBoundingClientRect();
  const pn = document.querySelector('.panel').getBoundingClientRect();
  const overlap = Math.max(0, Math.min(cap.right, pn.right) - Math.max(cap.left, pn.left)) > 0
    && Math.max(0, Math.min(cap.bottom, pn.bottom) - Math.max(cap.top, pn.top)) > 0;
  return { clipped, words, overlap, capInView: inView(cap) };
});
rec('text-zoom', 'no control is pushed off screen at 200%', bigState.clipped.length === 0,
  bigState.clipped.slice(0, 4).join(', ') || 'none clipped');
rec('text-zoom', 'the time ribbon words stay inside their plate at 200%', bigState.words.length === 0,
  bigState.words.join(', ') || 'all inside');
rec('text-zoom', 'the scene caption is not hidden under the panel at 200%',
  !bigState.overlap && bigState.capInView,
  `overlap=${bigState.overlap} inView=${bigState.capInView}`);
/* The 200% checks above run at 1440; the draft banner and the ribbon words failed at the
   smallest supported width (V4-R2-RR-03), where the banner grew over the toolbar and
   mouse-blocked Layers/Hints/Settings and the 24px time words collided in the 18px strip.
   Both measured here at 1024x768, at 200%, not inferred from the wider run. The banner then
   relocated onto the orientation line (V4-R2-RR-04), so the whole top-right stack is
   asserted disjoint here: toolbar → draft → orient → caption. */
await page.setViewportSize({ width: 1024, height: 768 });
await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
await page.waitForTimeout(600);
const big1024 = await page.evaluate(() => {
  const d = document.querySelector('.draft').getBoundingClientRect();
  const o = document.querySelector('.orient').getBoundingClientRect();
  const covered = ['bLayers', 'bHints', 'bSettings'].map((id) => {
    const b = document.querySelector(`#${id}`).getBoundingClientRect();
    const ox = Math.max(0, Math.min(d.right, b.right) - Math.max(d.left, b.left));
    const oy = Math.max(0, Math.min(d.bottom, b.bottom) - Math.max(d.top, b.top));
    const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
    const hitBtn = hit && hit.closest ? hit.closest('button') : null;
    return { id, overlap: Math.round(ox * oy), hit: hitBtn ? hitBtn.id : 'none' };
  });
  const words = [...document.querySelectorAll('.rb-words span')].map((e) => e.getBoundingClientRect());
  let pairs = 0;
  for (let i = 0; i < words.length - 1; i++)
    if (Math.min(words[i].right, words[i + 1].right) - Math.max(words[i].left, words[i + 1].left) > 0) pairs++;
  const cap = document.querySelector('.caption').getBoundingClientRect();
  const inter = (a, c) => Math.round(Math.max(0, Math.min(a.right, c.right) - Math.max(a.left, c.left)))
    * Math.round(Math.max(0, Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top)));
  return { covered, pairs, draftOrient: inter(d, o), orientCap: inter(o, cap), draftCap: inter(d, cap) };
});
rec('text-zoom@1024', 'the draft banner leaves Layers/Hints/Settings visible and clickable at 200%',
  big1024.covered.every((c) => c.overlap === 0 && c.hit === c.id),
  big1024.covered.map((c) => `${c.id}: ${c.overlap}px² hit=${c.hit}`).join(' · '));
rec('text-zoom@1024', 'the draft banner and the orientation line stack clear of each other and the caption at 200%',
  big1024.draftOrient === 0 && big1024.orientCap === 0 && big1024.draftCap === 0,
  `draft∩orient=${big1024.draftOrient} orient∩cap=${big1024.orientCap} draft∩cap=${big1024.draftCap}`);
rec('text-zoom@1024', 'the time ribbon words do not overlap each other at 200%',
  big1024.pairs === 0, `${big1024.pairs} overlapping pairs`);
/* The thought tag only exists while a What if? is open, and at 200% it used to sit on the
   caption and behind the docked card (V4-R2-RR-05). stress:slow has a whatIf behind its
   reveal, so open it here, measure the tag against its band neighbours, and close it again. */
await page.evaluate(() => { window.HS.markRevealed('stress', 'slow'); window.HS.openWhatIf(); });
await page.waitForTimeout(600);
const thought1024 = await page.evaluate(() => {
  const r = (s) => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
  const inter = (a, c) => a && c
    ? Math.round(Math.max(0, Math.min(a.right, c.right) - Math.max(a.left, c.left)))
      * Math.round(Math.max(0, Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top)))
    : -1;
  const th = r('#thought');
  if (!th || th.width < 1) return { visible: false };
  return {
    visible: true,
    panel: inter(th, r('#panel')), ribbon: inter(th, r('.ribbon')),
    caption: inter(th, r('#caption')), card: inter(th, r('#wiCard')),
  };
});
rec('text-zoom@1024', 'the thought tag sits clear of the panel, ribbon, caption and What-if card at 200%',
  thought1024.visible && thought1024.panel === 0 && thought1024.ribbon === 0
    && thought1024.caption === 0 && thought1024.card === 0,
  thought1024.visible
    ? `panel=${thought1024.panel} ribbon=${thought1024.ribbon} caption=${thought1024.caption} card=${thought1024.card}`
    : 'tag not visible');
await page.evaluate(() => { window.HS.restoreWhatIf(false); });
await page.evaluate(() => { document.documentElement.style.fontSize = ''; });

/* ---------- 6. routes and hotspots are the most salient marks (squint proxy) ---------- */
await page.setViewportSize({ width: 1440, height: 900 });
await page.evaluate(() => window.HS.openPathway('stress', 'slow', false));
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/qb-grayscale-check.png` });

rec('console', 'no console errors during the whole audit', errs.length === 0, errs.slice(0, 5).join(' | '));

/* ---------- 7. narrow reader focus ----------
   At laptop-sized desktop widths, opening the text alternative should give the reader and
   model enough room to coexist without letting the lower timeline run underneath the sheet. */
await page.setViewportSize({ width: 1280, height: 800 });
await page.evaluate(() => window.HS.openPathway('stress', 'fast', false));
await page.waitForTimeout(500);
await page.evaluate(() => window.HS.openRead());
await page.waitForTimeout(500);
const readerFocus = await page.evaluate(() => {
  const el = (s) => document.querySelector(s);
  const r = (e) => e ? e.getBoundingClientRect() : null;
  const sheetEl = el('#sheet'), bottomEl = el('#bottom'), panelEl = el('#panel');
  const sheet = r(sheetEl), bottom = r(bottomEl), panel = r(panelEl);
  const visible = (e) => { const b = r(e); return !!e && !!b && b.width > 0 && b.height > 0 && +getComputedStyle(e).opacity > 0.05 && getComputedStyle(e).pointerEvents !== 'none'; };
  return {
    reader: visible(sheetEl) && !sheetEl.classList.contains('closed'),
    focusClass: document.querySelector('#app').classList.contains('reader-focus'),
    panelDeemphasized: !visible(panelEl),
    bottomBeforeReader: !!sheet && !!bottom && bottom.right <= sheet.left + 2,
    objective: !!document.querySelector('#caption b') && document.querySelector('#caption b').textContent.trim().length > 0,
    routeContext: !!document.querySelector('#pbar') && document.querySelector('#pbar').getBoundingClientRect().height > 0,
    noTipOverReader: !document.querySelector('#tips .tip'),
  };
});
rec('reader-focus@1280', 'reader focus state preserves objective and route context',
  readerFocus.reader && readerFocus.focusClass && readerFocus.objective && readerFocus.routeContext && readerFocus.noTipOverReader,
  JSON.stringify(readerFocus));
rec('reader-focus@1280', 'systems panel yields the narrow reader focus', readerFocus.panelDeemphasized,
  JSON.stringify(readerFocus));
rec('reader-focus@1280', 'bottom timeline stops before the reader sheet', readerFocus.bottomBeforeReader,
  JSON.stringify(readerFocus));

/* The laptop-width boundary is the failure case for a side reader: the panel disappears from
   the stage, so the camera and caption must use the newly available left-hand space too. Keep
   this as a real route/state probe rather than a CSS-only assertion. */
await page.setViewportSize({ width: 1024, height: 768 });
await page.evaluate(() => {
  window.HS.closeRead(false);
  window.HS.openPathway('meal', 'between', false);
  window.HS.markRevealed('meal', 'between');
});
await page.waitForTimeout(1100);
await page.evaluate(() => window.HS.openRead());
await page.waitForTimeout(500);
const readerFocus1024 = await page.evaluate(() => {
  const el = (s) => document.querySelector(s);
  const rect = (e) => e ? e.getBoundingClientRect() : null;
  const inView = (b) => !!b && b.left >= -1 && b.right <= innerWidth + 1 && b.top >= -1 && b.bottom <= innerHeight + 1;
  const sheet = rect(el('#sheet')), bottom = rect(el('#bottom')), caption = rect(el('#caption'));
  const active = ['panc', 'liver', 'brain'].map((k) => rect(el(`#o-${k}`)));
  const controlsInView = [...document.querySelectorAll('#pbar button')]
    .filter((e) => !e.hidden && rect(e)?.width > 0 && getComputedStyle(e).display !== 'none')
    .every((e) => inView(rect(e)));
  return {
    reader: !!sheet && !el('#sheet').classList.contains('closed'),
    focusClass: el('#app').classList.contains('reader-focus'),
    sheet,
    bottom,
    caption,
    captionClear: !!sheet && !!caption && caption.right <= sheet.left + 1,
    bottomBeforeReader: !!sheet && !!bottom && bottom.right <= sheet.left + 2,
    activeClear: !!bottom && active.every((b) => !!b && b.bottom <= bottom.top + 1),
    controlsInView,
    bodyScroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
  };
});
rec('reader-focus@1024', 'reader reflows objective and controls into the left workspace',
  readerFocus1024.reader && readerFocus1024.focusClass && readerFocus1024.captionClear
    && readerFocus1024.bottomBeforeReader && readerFocus1024.controlsInView
    && readerFocus1024.bodyScroll[0] <= 1025,
  JSON.stringify(readerFocus1024));
rec('reader-focus@1024', 'active pathway anatomy stays above the timeline', readerFocus1024.activeClear,
  JSON.stringify(readerFocus1024));

await page.evaluate(() => window.HS.closeRead(false));
await page.waitForTimeout(300);
const restored1024 = await page.evaluate(() => {
  const panel = document.querySelector('#panel');
  const r = panel.getBoundingClientRect();
  const s = getComputedStyle(panel);
  return {
    readerFocus: document.querySelector('#app').classList.contains('reader-focus'),
    panelRestored: !panel.classList.contains('closed') && r.left >= 0 && +s.opacity > 0.05 && s.pointerEvents !== 'none',
  };
});
rec('reader-focus@1024', 'closing the reader restores the systems workspace',
  !restored1024.readerFocus && restored1024.panelRestored,
  JSON.stringify(restored1024));

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
