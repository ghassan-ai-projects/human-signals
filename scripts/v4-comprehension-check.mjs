/* Comprehension proxies for the v4 prototype, against the §10 prototype tasks
   that a layout audit cannot measure. Each check is deliberately a *proxy*: it
   verifies that the affordance a learner needs is present, reachable and
   unambiguous without a human in the loop. The task numbers are §10's.

   Run with: node scripts/v4-comprehension-check.mjs            (server on :8765)
             node scripts/v4-comprehension-check.mjs --json out.json */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.V4_BASE || 'http://localhost:8765/v4/';
const OUT = process.env.V4_OUT || 'coverage/v4';
const JSON_OUT = process.argv.includes('--json')
  ? process.argv[process.argv.indexOf('--json') + 1]
  : null;
mkdirSync(OUT, { recursive: true });

const results = [];
const rec = (task, name, ok, detail = '') => results.push({ task, name, ok, detail });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);

/* ---- Task 1, behavioural half: does the FIRST action available to a keyboard
   learner actually reach a scene? This is the check that fails on the pre-round-4
   build: the first Tab stop is #world and Enter there left the engine idle. ---- */
await page.evaluate(() => { try { localStorage.clear(); } catch { /* fresh */ } });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.keyboard.press('Tab');
const firstStop = await page.evaluate(() => document.activeElement.id || document.activeElement.tagName);
await page.keyboard.press('Enter');
await page.waitForTimeout(1200);
const afterEnter = await page.evaluate(() => ({
  state: window.HS.E.state,
  firstAccents: document.querySelectorAll('#triggers .trig.first').length,
  route: window.HS.E.route,
}));
rec('1', 'the first Tab stop exists and is reachable', !!firstStop, `first stop = ${firstStop}`);
rec('1', 'the first action a keyboard learner can take reaches a scene',
  afterEnter.state === 'triggered',
  `stop=${firstStop} → state=${afterEnter.state}`);
rec('1', 'the first-visit accent is gone once a trigger is chosen',
  afterEnter.firstAccents === 0, `${afterEnter.firstAccents} rows still accented`);
await page.evaluate(() => { try { localStorage.clear(); } catch { /* fresh */ } });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1000);

/* ---- Task 1: is there something to click, and does it say what it is, in the
   first screen with no instruction? Proxy: the three triggers are visible,
   each has an accessible name AND a one-line subtitle, and each is a real
   button reachable by keyboard. ---- */
const t1 = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('#triggers button')];
  return btns.map((b) => ({
    text: (b.textContent || '').replace(/\s+/g, ' ').trim(),
    tag: b.tagName,
    hasSub: !!b.querySelector('small'),
    eager: b.getAttribute('aria-label') || (b.textContent || '').trim().length > 0,
    h: b.getBoundingClientRect().height,
  }));
});
rec('1', 'three triggers visible on first screen', t1.length === 3, `${t1.length} triggers`);
rec('1', 'every trigger has a name and a one-line "what happens"', t1.every((t) => t.eager && t.hasSub),
  t1.filter((t) => !(t.eager && t.hasSub)).map((t) => t.text).join(' | '));
rec('1', 'triggers meet a 24px minimum target', t1.every((t) => t.h >= 24),
  t1.map((t) => Math.round(t.h)).join(','));
/* The subtitle must name something that HAPPENS to you, in the same vocabulary as the
   first-run tip, not the lesson's own name for itself. */
rec('1', 'each trigger names the everyday event, not the lesson',
  t1.every((t) => !/watch the|the body|how the/i.test(t.text)),
  t1.map((t) => t.text.slice(0, 60)).join(' | '));

/* ---- Task 5: does the unrevealed line read as "not yet", not "association"?
   Proxy: the ghost is (a) visually distinct from a revealed route by dash
   pattern AND opacity, and (b) carries words that say it is not revealed yet,
   and (c) is operable (opens Try it?) rather than being a dead mark. ---- */
await page.evaluate(() => window.HS.openPathway('stress', 'slow', false));
await page.waitForTimeout(800);
const ghost = await page.evaluate(() => {
  const routes = [...document.querySelectorAll('#world path.route')];
  const isGhost = (p) => p.getAttribute('stroke-dasharray') === '6 7';
  const g = routes.find(isGhost);
  const revealed = routes.filter((p) => !isGhost(p));
  const cs = g ? getComputedStyle(g) : null;
  const labs = [...document.querySelectorAll('#labels .lab')];
  const ghostLabs = labs.filter((l) => /not revealed|not shown|hidden yet/i.test(l.textContent));
  /* is the wording attached to the dashed line? measure against the ? badge */
  const q = document.querySelector('#labels .hs.q');
  let anchorDist = null;
  if (q && ghostLabs.length) {
    const a = q.getBoundingClientRect(), b = ghostLabs[0].getBoundingClientRect();
    anchorDist = Math.round(Math.hypot((a.x + a.width / 2) - (b.x + b.width / 2), (a.y + a.height / 2) - (b.y + b.height / 2)));
  }
  const tip = document.querySelector('.tip span');
  return {
    found: !!g,
    opacity: cs ? +cs.opacity : null,
    dash: g ? g.getAttribute('stroke-dasharray') : null,
    revealedOpacity: revealed.length ? +getComputedStyle(revealed[0]).opacity : null,
    ghostWords: ghostLabs.map((l) => l.textContent.trim()),
    anchored: anchorDist != null && anchorDist < 240,
    anchorDist,
    hasInstruction: !!tip && /revealed|try it|\? dot/i.test(tip.textContent),
    instruction: tip ? tip.textContent.trim().slice(0, 90) : '',
    hasGate: !!(window.HS.pathway() && window.HS.pathway().gate),
  };
});
rec('5', 'the unrevealed (ghost) route is distinguished from a revealed route by dash pattern',
  ghost.found && ghost.dash === '6 7',
  `dash=${ghost.dash}`);
/* The ghost is deliberately brighter than a faint not-yet-current route (it is
   the thing inviting Try it?), so the check is that it is *visually distinct*
   from both a revealed route and a faint one, not that it is dimmer. */
rec('5', 'the unrevealed route is visually distinct from revealed and faint routes',
  ghost.opacity !== null && ghost.revealedOpacity !== null && ghost.opacity !== ghost.revealedOpacity
    && ghost.opacity > 0.5 && ghost.revealedOpacity < 0.5,
  `ghost op=${ghost.opacity} vs faint op=${ghost.revealedOpacity}`);
rec('5', 'the unrevealed state is described in words on the body, not only after opening Read',
  ghost.ghostWords.length > 0, ghost.ghostWords.join(' | ') || 'no wording found');
/* The words must be ATTACHED to the dashed line, not floating elsewhere on the stage. */
rec('5', 'the unrevealed wording sits on the unrevealed line, not somewhere else',
  ghost.anchored === true, `distance from the ? badge = ${ghost.anchorDist}px`);
/* And the instruction — what to DO about it — must be reachable through the tip channel. */
rec('5', 'the learner is told what to do about the unrevealed line',
  ghost.hasInstruction === true, ghost.instruction || 'no instruction found');
rec('5', 'the unrevealed line is operable (leads to the gated Try it?)', ghost.hasGate,
  ghost.hasGate ? 'scene has a gate' : 'no gate on this pathway');

/* ---- Task 6: does anything on screen say the route is NOT a vessel/nerve, and
   is it reachable WITHOUT knowing to open a text panel? The task is asked while
   looking at the body, so a disclaimer that lives only inside Read the route
   does not answer it. Measured both ways on purpose: first by clicking a route on
   the body (the one action a learner takes when asking this), then via Read. ---- */
await page.evaluate(() => { try { window.HS.closeCards && window.HS.closeCards(); } catch { /* none */ } });
const t6Body = await page.evaluate(() => {
  const rt = [...document.querySelectorAll('#world .rhit')].find((x) => x.getAttribute('data-st') === 'on');
  if (!rt) return { clicked: false };
  rt.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  return { clicked: true };
});
await page.waitForTimeout(450);
const t6Before = await page.evaluate(() => {
  const txt = (document.querySelector('#cards') || document.body).innerText || '';
  const card = document.querySelector('.card');
  const sw = card && card.querySelector('.carr svg');
  const sr = sw ? sw.getBoundingClientRect() : null;
  return {
    denies: /not a drawing of a blood vessel or a nerve/i.test(txt),
    mentionsVessel: /blood vessel/i.test(txt),
    /* the visual evidence for the claim must be on screen with it, not scrolled away */
    swatchOnScreen: !!sr && sr.top >= 0 && sr.bottom <= window.innerHeight,
  };
});
rec('6', 'the not-a-vessel answer is one click from the body (route card)', t6Before.denies,
  t6Before.denies ? 'present in the route card' : 'not reachable from the body');
rec('6', 'the route card shows the texture swatch alongside the claim',
  t6Before.swatchOnScreen, t6Before.swatchOnScreen ? 'swatch on screen' : 'swatch off screen or missing');

await page.evaluate(() => { try { window.HS.closeCards && window.HS.closeCards(); } catch { /* none */ } });
await page.evaluate(() => window.HS.openRead && window.HS.openRead());
await page.waitForTimeout(600);
const t6After = await page.evaluate(() => {
  const s = document.querySelector('#sheet');
  const sc = s && s.querySelector('.schem');
  const r = sc ? sc.getBoundingClientRect() : null;
  return {
    denies: !!sc && /not a drawing of a blood vessel or a nerve/i.test(sc.textContent),
    onScreen: !!r && r.top >= 0 && r.bottom <= window.innerHeight,
  };
});
rec('6', 'the "not a vessel" disclaimer exists in the text alternative', t6After.denies,
  t6After.denies ? 'present' : 'missing');
rec('6', 'the disclaimer is visible on opening Read, not below the fold', t6After.onScreen,
  t6After.onScreen ? 'on screen' : 'below the fold');

/* ---- Task 7/8: can negative feedback and fast-vs-slow be explained from what
   the app says? Proxy: the text alternative contains an explicit feedback
   statement and an explicit fast/slow contrast, with no bare clock times or
   invented numbers (the "don't invent exact times" guard). ---- */
await page.evaluate(() => window.HS.openRead && window.HS.openRead());
await page.waitForTimeout(600);
const t78 = await page.evaluate(() => {
  const txt = (document.querySelector('#sheet') || document.body).innerText || '';
  return {
    hasFeedbackWords: /acts back|brakes|turns .* down|feedback/i.test(txt),
    hasContrast: /fast|slow/i.test(txt),
    numbers: (txt.match(/\b\d+\s*(seconds?|minutes?|hours?|mg|ml|%)\b/gi) || []),
  };
});
rec('7', 'the text alternative states the negative-feedback relation', t78.hasFeedbackWords,
  t78.hasFeedbackWords ? 'present' : 'missing');
rec('8', 'the text alternative contrasts fast and slow in words', t78.hasContrast,
  t78.hasContrast ? 'present' : 'missing');
rec('8', 'no invented measured times leak into the explanation', t78.numbers.length === 0,
  t78.numbers.join(', ') || 'none');

/* ---- Task 7/8, behavioural half: an ungraded explanation moment must be reachable
   ON DEMAND in every pathway, must not be scored or recorded, and must not stack
   dialogs. The text alternative already carries the mechanism (checked above); this
   checks the learner can ASK for the explanation moment rather than waiting for it. ---- */
await page.evaluate(() => window.HS.openPathway('stress', 'slow', false));
await page.waitForTimeout(700);
const sayA11y = await page.evaluate(() => {
  const b = document.querySelector('#bSay');
  return b ? { exists: true, hidden: b.hidden, label: (b.getAttribute('title') || '') + ' ' + b.textContent.trim() } : { exists: false };
});
rec('7', 'an on-demand explanation moment exists in the pathway bar',
  sayA11y.exists && !sayA11y.hidden, JSON.stringify(sayA11y));
rec('7', 'the explanation moment is framed as ungraded',
  /nothing is scored|ungraded|no score/i.test(sayA11y.label), sayA11y.label);

const sayFlow = await page.evaluate(async () => {
  let attempts = 0;
  const orig = window.HS.recordAttempt;
  window.HS.recordAttempt = function () { attempts++; return orig && orig.apply(this, arguments); };
  window.HS.openReflectNow();
  await new Promise((r) => setTimeout(r, 300));
  const card = document.querySelector('#reflCard');
  const first = { open: !!card, q: card && card.querySelector('h5').textContent.trim(), modelHidden: card && document.querySelector('#reflModel').hidden };
  const show = document.querySelector('#reflShow');
  if (show) { show.click(); await new Promise((r) => setTimeout(r, 250)); }
  const model = (document.querySelector('#reflModel') || {}).innerText || '';
  window.HS.closeReflect(false);
  window.HS.recordAttempt = orig;
  return { first, model: model.trim().slice(0, 80), attempts };
});
rec('7', 'the explanation moment opens on demand, ungraded, with the pathway question',
  sayFlow.first.open && sayFlow.first.q.length > 10, JSON.stringify(sayFlow.first));
rec('7', 'a model answer is offered for self-comparison, never as a mark',
  sayFlow.model.length > 10, sayFlow.model);
rec('7', 'opening the explanation moment NEVER records an attempt or a score',
  sayFlow.attempts === 0, `${sayFlow.attempts} recordAttempt calls`);

/* Dialog stacking: the reflect card, Try it? and What if? all dock at the same spot. */
const stack = await page.evaluate(async () => {
  window.HS.openTry();
  await new Promise((r) => setTimeout(r, 250));
  window.HS.openReflectNow();
  await new Promise((r) => setTimeout(r, 300));
  const n = ['#reflCard', '#tryCard', '#wiCard'].filter((s) => document.querySelector(s)).length;
  window.HS.closeReflect(false); window.HS.closeTry && window.HS.closeTry();
  return n;
});
rec('7', 'the explanation moment does not stack over Try it? / What if?', stack <= 1, `${stack} dialogs open`);

/* ---- Keyboard proxy for task 10: the guided path is traversable without a
   mouse. Tab from the top and confirm focus lands on a trigger, the body, and
   the pathway controls without getting trapped. ---- */
await page.evaluate(() => window.HS.openPathway('stress', 'fast', false));
await page.waitForTimeout(500);
const tabbed = [];
for (let i = 0; i < 14; i++) {
  await page.keyboard.press('Tab');
  tabbed.push(await page.evaluate(() => {
    const a = document.activeElement;
    return a ? (a.id || a.className || a.tagName) + ':' + (a.getAttribute('aria-label') || a.textContent || '').trim().slice(0, 24) : 'none';
  }));
}
const uniq = new Set(tabbed.filter((t) => !t.startsWith('none')));
rec('10', 'keyboard reaches triggers, body and controls (no dead tab path)', uniq.size >= 5,
  `${uniq.size} distinct stops`);

rec('console', 'no console errors during the comprehension check', errs.length === 0, errs.slice(0, 4).join(' | '));

await browser.close();

const fails = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  task ${r.task.padEnd(7)} ${r.name}${r.ok ? '' : ' — ' + r.detail}`);
console.log(`\nTOTAL ${results.length - fails.length}/${results.length} pass, ${fails.length} fail`);
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ results, errs }, null, 1));
process.exit(fails.length ? 1 : 0);
