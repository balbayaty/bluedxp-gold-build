import { test, expect } from '@playwright/test';

test('Dashboard loads successfully', async ({ page }) => {
    // 1. Navigate to the dashboard (login might be bypassed or mocked if needed, assuming direct access for now or redirect to login)
    await page.goto('/');

    // 2. Check for key elements that verify the app is "alive"
    // Adjust these selectors based on your actual UI
    await expect(page).toHaveTitle(/Hazalyze|Dashboard/i);

    // 3. Take a screenshot for evidence
    await page.screenshot({ path: 'test-results/dashboard-load.png' });
});
