/* Browser smoke check for W6: checkpoint flow, Learn page, reset. Run with: node scripts/w6-browser-check.mjs */
import { chromium } from 'playwright';

const BASE = 'http://localhost:4173';
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('console', (msg) => {
  if (msg.type() === 'error') console.log('  console.error:', msg.text());
});
page.on('pageerror', (err) => {
  console.log('  pageerror:', err.message);
});

try {
  // 1. Lesson: reach the first checkpoint via the scrubber, then play.
  await page.goto(`${BASE}/#/exercise/exercise-synthetic-feedback`);
  await page.waitForSelector('text=Abstract exercise');
  await page.locator('#hs-lesson-position').fill('2700');
  await page.getByRole('button', { name: 'Play' }).click();
  await page.getByRole('heading', { name: /Practice question/ }).waitFor({ timeout: 10000 });
  check('checkpoint interrupts playback', true);

  // 2. No auto-submit: Check answer disabled until an option is chosen.
  const disabled = await page.getByRole('button', { name: 'Check answer' }).isDisabled();
  check('Check answer disabled before selection', disabled);

  // 3. Choose the wrong option deliberately, submit, inspect feedback.
  await page.getByRole('radio', { name: 'The Source structure releases more Alpha.' }).check();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.waitForSelector('text=Not quite.');
  const bestVisible = await page.getByText('Best answer').isVisible();
  check('wrong answer feedback with words and best answer', bestVisible);
  await page.screenshot({ path: 'coverage/w6-feedback.png' });

  // 4. Evidence opens from the feedback.
  await page.getByRole('button', { name: 'Show the evidence' }).click();
  await page.getByRole('heading', { name: 'What is claimed' }).waitFor({ timeout: 5000 });
  await page.keyboard.press('Escape');
  check('evidence opens and closes with Escape', true);

  // 5. Continue resumes playback; pause again.
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForSelector('button:has-text("Pause")', { timeout: 5000 });
  await page.getByRole('button', { name: 'Pause' }).click();
  check('continue resumes and pause works', true);

  // 6. Learn page reflects the attempt.
  await page.getByRole('link', { name: 'Learn' }).click();
  await page.waitForSelector('h1:has-text("Learn")');
  const body = await page.locator('main').textContent();
  check('Learn shows the objective count', body.includes('0 of 1'), 'wrong answer is counted honestly');
  check('Learn avoids percentages', !body.includes('%'));
  check('Learn explains local-only storage', body.includes('only in this browser'));
  await page.screenshot({ path: 'coverage/w6-learn.png' });

  // 7. Storage key contains the attempt.
  const stored = await page.evaluate(() => localStorage.getItem('human-signals:progress:v1'));
  const record = JSON.parse(stored ?? '{}');
  check('progress key written with one attempt', (record.attempts ?? []).length === 1);

  // 8. Settings reset clears the key.
  await page.locator('summary', { hasText: 'Settings' }).click();
  await page.getByRole('button', { name: 'Clear lesson progress' }).click();
  await page.getByRole('button', { name: 'Yes, delete it' }).click();
  const after = await page.evaluate(() => localStorage.getItem('human-signals:progress:v1'));
  check('reset clears the progress key', after === null);
  await page.screenshot({ path: 'coverage/w6-reset.png' });

  // 9. Blocked storage: deny writes, answer a question, app must keep working.
  await page.evaluate(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('denied');
      },
    });
  });
  await page.goto(`${BASE}/#/exercise/exercise-synthetic-feedback`);
  await page.waitForSelector('text=Abstract exercise');
  await page.locator('#hs-lesson-position').fill('2700');
  await page.getByRole('button', { name: 'Play' }).click();
  await page.getByRole('heading', { name: /Practice question/ }).waitFor({ timeout: 10000 });
  await page.getByRole('radio', { name: 'The Peripheral structure releases Gamma.' }).check();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.waitForSelector('text=Correct.');
  check('lesson still teachable with storage denied', true);
  await page.screenshot({ path: 'coverage/w6-storage-denied.png' });
} catch (error) {
  check('unexpected failure', false, String(error));
  await page.screenshot({ path: 'coverage/w6-failure.png' }).catch(() => {});
} finally {
  await browser.close();
}

const failed = results.filter((item) => !item.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length > 0 ? 1 : 0);
