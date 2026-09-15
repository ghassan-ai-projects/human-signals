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
  return {
    found: !!g,
    opacity: cs ? +cs.opacity : null,
    dash: g ? g.getAttribute('stroke-dasharray') : null,
    revealedOpacity: revealed.length ? +getComputedStyle(revealed[0]).opacity : null,
    ghostWords: [...document.querySelectorAll('#labels .lab')].map((l) => l.textContent.trim())
      .filter((t) => /not|yet|reveal|acts back|\?/i.test(t)),
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
rec('5', 'the unrevealed line is operable (leads to the gated Try it?)', ghost.hasGate,
  ghost.hasGate ? 'scene has a gate' : 'no gate on this pathway');

/* ---- Task 6: does anything on screen say the route is NOT a vessel/nerve, and
   is it reachable WITHOUT knowing to open a text panel? The task is asked while
   looking at the body, so a disclaimer that lives only inside Read the route
   does not answer it. Measured both ways on purpose. ---- */
const t6Before = await page.evaluate(() => {
  const body = document.body.innerText || '';
  return { mentionsVessel: /blood vessel/i.test(body), denies: /not drawings of blood vessels|not a vessel/i.test(body) };
});
await page.evaluate(() => window.HS.openRead && window.HS.openRead());
await page.waitForTimeout(600);
const t6After = await page.evaluate(() => {
  const body = document.body.innerText || '';
  return { mentionsVessel: /blood vessel/i.test(body), denies: /not drawings of blood vessels|not a vessel/i.test(body) };
});
rec('6', 'the "not a vessel" disclaimer exists somewhere reachable', t6After.denies && t6After.mentionsVessel,
  `vessel=${t6After.mentionsVessel} denies=${t6After.denies}`);
rec('6', 'the "not a vessel" answer is available while looking at the body (not only inside Read)',
  t6Before.denies && t6Before.mentionsVessel,
  `before opening Read: vessel=${t6Before.mentionsVessel} denies=${t6Before.denies}`);

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
