import { test, expect } from '@playwright/test';

test.describe('E2E-04: Session Persistence and Token Validity', () => {
  const testPhone = `+977981${Math.random().toString().slice(2, 10)}`;
  const testOTP = '123456';

  test('should persist session across page refresh', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.locator('[data-testid="login-button"]').click();
    const loginModal = page.locator('[data-testid="login-modal"]');
    await expect(loginModal).toBeVisible();

    await page.locator('[data-testid="phone-input"]').fill(testPhone);
    await page.locator('[data-testid="send-otp-button"]').click();

    await page.locator('[data-testid="otp-input"]').waitFor({ state: 'visible' });
    await page.locator('[data-testid="otp-input"]').fill(testOTP);
    await page.locator('[data-testid="verify-button"]').click();

    await expect(loginModal).not.toBeVisible();
    const userMenuButton = page.locator('[data-testid="user-menu-button"]');
    await expect(userMenuButton).toBeVisible();

    // Verify token is in localStorage
    const token = await page.evaluate(() => localStorage.getItem('nepal_elections_token'));
    expect(token).toBeTruthy();

    // Hard refresh
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify still logged in
    await expect(userMenuButton).toBeVisible();
    const tokenAfterRefresh = await page.evaluate(() => localStorage.getItem('nepal_elections_token'));
    expect(tokenAfterRefresh).toBe(token);
  });

  test('should clear session on logout', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.locator('[data-testid="login-button"]').click();
    const loginModal = page.locator('[data-testid="login-modal"]');
    await expect(loginModal).toBeVisible();

    await page.locator('[data-testid="phone-input"]').fill(testPhone);
    await page.locator('[data-testid="send-otp-button"]').click();

    await page.locator('[data-testid="otp-input"]').waitFor({ state: 'visible' });
    await page.locator('[data-testid="otp-input"]').fill(testOTP);
    await page.locator('[data-testid="verify-button"]').click();

    await expect(loginModal).not.toBeVisible();
    const userMenuButton = page.locator('[data-testid="user-menu-button"]');
    await expect(userMenuButton).toBeVisible();

    // Logout
    await userMenuButton.click();
    const logoutButton = page.locator('button:has-text("Logout")');
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    // Verify logged out
    const loginBtn = page.locator('[data-testid="login-button"]');
    await expect(loginBtn).toBeVisible();

    // Verify token cleared
    const token = await page.evaluate(() => localStorage.getItem('nepal_elections_token'));
    expect(token).toBeNull();

    // Refresh and verify still logged out
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(loginBtn).toBeVisible();
  });
});
