import { test, expect } from '@playwright/test';

test('scene boots, runs 10s, score increases, FPS sane', async ({ page, context }) => {
  await context.grantPermissions([]); // deliberately no camera — exercise keyboard fallback
  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Start run' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Start run' }).click();

  await page.waitForTimeout(1500);

  for (let i = 0; i < 30; i++) {
    await page.keyboard.press(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'][i % 4]);
    await page.waitForTimeout(180);
  }

  const fps = await page.evaluate(() => (window as unknown as { __handflow_fps?: number }).__handflow_fps ?? 0);
  expect(fps).toBeGreaterThan(20);

  const scoreText = await page.locator('div').filter({ hasText: /^[\d,]+$/ }).first().innerText().catch(() => '0');
  const score = parseInt(scoreText.replace(/,/g, ''), 10);
  expect(score).toBeGreaterThan(0);
});
