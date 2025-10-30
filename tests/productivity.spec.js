const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const dashboardUrl = 'file://' + path.resolve(__dirname, '..', 'web-productivity-dashboard.html');
const dataPath = path.resolve(__dirname, '..', 'data', 'productivity-data.json');
const dataPayload = fs.readFileSync(dataPath, 'utf-8');
const cachedPayload = JSON.stringify({ data: JSON.parse(dataPayload), timestamp: Date.now() });

const ensureScreenshotsDir = () => {
  const screenDir = path.resolve(__dirname, 'screenshots');
  if (!fs.existsSync(screenDir)) {
    fs.mkdirSync(screenDir, { recursive: true });
  }
  return screenDir;
};

test.describe('Productivity dashboard', () => {
  test('schedules tasks, logs mood, and captures documentation screenshot', async ({ page }) => {
    await page.route('**/data/productivity-data.json', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: dataPayload,
      });
    });

    await page.goto(dashboardUrl);

    await expect(page.locator('h1')).toContainText('Productivity Mission Control');
    await expect(page.locator('#taskList .task-card')).toHaveCount(4);

    await page.dragAndDrop('[data-task-id="t1"]', '[data-time="09:00"]');
    await expect(page.locator('#plannerSummary')).toContainText('09:00');
    await expect(page.locator('#plannerSummary')).toContainText('Draft product vision doc');

    await page.fill('#moodNote', 'Feeling focused after mapping the day.');
    await page.click('button.mood-submit');
    await expect(page.locator('#moodStatus')).toContainText('Logged');

    const screenshotDir = ensureScreenshotsDir();
    await page.screenshot({ path: path.join(screenshotDir, 'dashboard.png'), fullPage: true });
    await expect(page.locator('#habitChart')).toBeVisible();
  });

  test('falls back to cached data when offline', async ({ browser }) => {
    const context = await browser.newContext();
    await context.addInitScript((key, payload) => {
      window.localStorage.setItem(key, payload);
    }, 'productivity-dashboard-v1', cachedPayload);

    const page = await context.newPage();
    await page.route('**/data/productivity-data.json', route => route.abort());
    await page.goto(dashboardUrl);

    await expect(page.locator('#offlineBadge')).toBeVisible();
    await expect(page.locator('#suggestionList .suggestion-card').first()).toBeVisible();
    await context.close();
  });
});
