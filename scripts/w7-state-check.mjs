/* Browser smoke check for W7: the parallel state at desktop and phone widths.
   Run with: node scripts/w7-state-check.mjs (preview server on :4173 required). */
import { chromium } from 'playwright';

const BASE = 'http://localhost:4173';
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch();

async function noHorizontalScroll(page, label) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check(`${label}: no horizontal page scroll`, overflow <= 1, `overflow ${overflow}px`);
}

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', (err) => console.log('  pageerror:', err.message));

  // States catalog lists the invented state.
  await page.goto(`${BASE}/#/states`);
  await page.waitForSelector('h1:has-text("Human states")');
  await page.getByRole('link', { name: /The invented alarm state/ }).click();
  await page.waitForSelector('h1:has-text("The invented alarm state")');
  check('states catalog opens the state lesson', true);

  // Three tracks render in authored order.
  const trackNames = await page.locator('[aria-label$="track"] h3').allTextContents();
  check(
    'three tracks in authored order',
    trackNames.length === 3 &&
      trackNames[0].includes('Fast route') &&
      trackNames[1].includes('Slower carried route') &&
      trackNames[2].includes('Slowest regulation'),
    trackNames.join(' | '),
  );

  // Seek to the fast-route action; panel shows its caption and the trend.
  await page.locator('#hs-lesson-position').fill('5000');
  await page.waitForSelector('text=The fast route reaches the intermediary structure first');
  check('fast-track caption at the simultaneous instant', true);
  check('trend from the carried track is visible', (await page.getByText('increasing in this scenario').count()) > 0);
  await page.screenshot({ path: 'coverage/w7-state-panel.png', clip: { x: 0, y: 300, width: 1280, height: 600 } });

  // Focused view collapses the other tracks.
  const fastTrack = page.locator('[aria-label="Fast route (invented) track"]');
  await fastTrack.getByRole('button', { name: 'Focus this track' }).click();
  await page.waitForSelector('text=Focused view: the other tracks are summarised');
  check('focused view note appears', true);
  await page.screenshot({ path: 'coverage/w7-state-focused.png', clip: { x: 0, y: 300, width: 1280, height: 600 } });
  await fastTrack.getByRole('button', { name: 'Show all tracks' }).click();

  // The state's own checkpoint question.
  await page.locator('#hs-lesson-position').fill('19900');
  await page.getByRole('button', { name: 'Play' }).click();
  await page.getByRole('heading', { name: /Practice question/ }).waitFor({ timeout: 10000 });
  await page.getByRole('radio', { name: /The fast route, before the carried route arrives/ }).check();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.waitForSelector('text=Correct.');
  check('state checkpoint asks and grades', true);
  await page.screenshot({ path: 'coverage/w7-state-question.png', clip: { x: 0, y: 200, width: 1280, height: 700 } });
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForSelector('button:has-text("Pause")', { timeout: 5000 });
  await page.getByRole('button', { name: 'Pause' }).click();

  // Authored trend changes at 60 s: carried trend sustained, alpha turned down.
  await page.locator('#hs-lesson-position').fill('60000');
  await page.waitForSelector('text=staying raised in this scenario');
  check('authored trend change at the regulation step', true);
  await noHorizontalScroll(page, 'desktop');
  await page.close();

  // Phone width: the three-track panel stays readable.
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
  phone.on('pageerror', (err) => console.log('  pageerror:', err.message));
  await phone.goto(`${BASE}/#/state/state-fictional-alarm`);
  await phone.waitForSelector('h1:has-text("The invented alarm state")');
  await phone.locator('#hs-lesson-position').fill('5000');
  await phone.waitForSelector('text=The fast route reaches the intermediary structure first');
  await noHorizontalScroll(phone, 'phone');
  await phone.screenshot({ path: 'coverage/w7-state-phone.png' });
  await phone.close();
} catch (error) {
  check('unexpected failure', false, String(error));
} finally {
  await browser.close();
}

const failed = results.filter((item) => !item.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length > 0 ? 1 : 0);
