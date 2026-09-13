import { expect, test } from '@playwright/test';

test('the model lesson keeps structure selection usable at desktop and phone widths', async ({ page }) => {
  await page.goto('/#/state/state-fictional-alarm');
  await expect(page.getByRole('heading', { name: 'The invented alarm state' })).toBeVisible();

  const structure = page.getByRole('button', { name: 'Source structure (invented)', exact: true });
  await expect(structure).toHaveAttribute('aria-pressed', 'false');
  await structure.click();
  await expect(structure).toHaveAttribute('aria-pressed', 'true');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'The invented alarm state' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Source structure (invented)', exact: true })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect((await page.locator('canvas').count()) + (await page.getByTestId('diagram-2d').count())).toBeGreaterThan(0);
});
