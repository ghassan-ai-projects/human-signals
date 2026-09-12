/* Browser smoke check for W5: the two-signal comparison at desktop and phone widths.
   Run with: node scripts/w5-compare-check.mjs (preview server on :4173 required). */
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
  // Desktop: curated starting pair, then the full table.
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', (err) => console.log('  pageerror:', err.message));
  await page.goto(`${BASE}/#/compare`);
  await page.waitForSelector('h1:has-text("Compare two signals")');
  await page.getByRole('button', { name: 'Alpha and Beta in the invented loop' }).click();
  await page.waitForSelector('table');
  check('curated pair opens the aligned table', true);
  check('URL carries the pair and depth', /a=sig-alpha&b=sig-beta/.test(page.url()));
  const rowCount = await page.locator('tbody tr').count();
  check('eight dimension rows plus lessons', rowCount === 9, `${rowCount} rows`);
  const notComparable = await page.getByText('Not comparable here.').count();
  check('not-comparable rows labelled', notComparable === 0, 'alpha/beta pair has none authored');
  await page.screenshot({ path: 'coverage/w5-compare-desktop.png' });

  // Per-cell evidence opens and closes.
  await page.locator('tbody button', { hasText: 'Evidence' }).first().click();
  await page.waitForSelector('text=What is claimed');
  await page.keyboard.press('Escape');
  check('cell evidence opens and closes', true);

  // Changing one selection updates that column and the URL.
  await page.getByLabel('Second signal').selectOption('sig-gamma');
  check('URL follows the second choice', /b=sig-gamma/.test(page.url()));
  // 'The loop turns itself down.' is authored only on Gamma; Beta's sources text only on Beta.
  await page.getByText('The loop turns itself down.').first().waitFor();
  check('beta cell gone after the switch', (await page.getByText('The middle structure.').count()) === 0);
  check('gamma not-comparable row labelled', (await page.getByText('Not comparable here.').count()) >= 1);

  // Same-signal rejection.
  await page.getByLabel('Second signal').selectOption('sig-alpha');
  await page.waitForSelector('text=Comparison needs two different signals');
  check('identical pair rejected politely', true);
  await page.close();

  // Phone width: shared URL reloads aligned, with no horizontal scrolling.
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
  phone.on('pageerror', (err) => console.log('  pageerror:', err.message));
  await phone.goto(`${BASE}/#/compare?a=sig-alpha&b=sig-gamma&depth=intro`);
  await phone.waitForSelector('table');
  await phone.reload();
  await phone.waitForSelector('table');
  check('phone: shared URL reloads the comparison', true);
  await noHorizontalScroll(phone, 'phone');
  // Both values stay together per row: the first row has both signals' cells.
  const firstRowCells = await phone.locator('tbody tr').first().locator('td').count();
  check('phone: values stay on one row', firstRowCells === 2, `${firstRowCells} cells`);
  await phone.screenshot({ path: 'coverage/w5-compare-phone.png' });
  await phone.close();
} catch (error) {
  check('unexpected failure', false, String(error));
} finally {
  await browser.close();
}

const failed = results.filter((item) => !item.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length > 0 ? 1 : 0);
