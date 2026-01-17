import { test, expect } from '@playwright/test';

test.describe('E2E-04: Session Persistence and Token Validity', () => {
  const testPhone = '+9779800000088';
  const testOTP = '123456';

  test('should persist session across page refresh', async ({ page }) => {
    // Login
    await page.goto('/');
    
    await page.locator('[data-testid="login-button"]').click();
    const loginModal = page.locator('[data-testid="login-modal"]');
    await expect(loginModal).toBeVisible();

    await page.locator('[data-testid="phone-input"]').fill(testPhone);
    await page.locator('[data-testid="send-otp-button"]').click();

    await page.locator('[data-testid="otp-input"]').waitFor({ state: 'visible' });
    await page.locator('[data-testid="otp-input"]').fill(testOTP);
    await page.locator('[data-testid="verify-button"]').click();

    // Verify logged in
    await expect(loginModal).not.toBeVisible();
    const userMenuButton = page.locator('[data-testid="user-menu-button"]');
    await expect(userMenuButton).toBeVisible();

    // Refresh page
    await page.reload();

    // Verify still logged in (no login prompt)
    await expect(userMenuButton).toBeVisible();
    await expect(loginModal).not.toBeVisible();
  });

  test('should clear session on logout', async ({ page }) => {
    // Login
    await page.goto('/');
    
    await page.locator('[data-testid="login-button"]').click();
    const loginModal = page.locator('[data-testid="login-modal"]');
    await expect(loginModal).toBeVisible();

    await page.locator('[data-testid="phone-input"]').fill(testPhone);
    await page.locator('[data-testid="send-otp-button"]').click();

    await page.locator('[data-testid="otp-input"]').waitFor({ state: 'visible' });
    await page.locator('[data-testid="otp-input"]').fill(testOTP);
    await page.locator('[data-testid="verify-button"]').click();

    await expect(loginModal).not.toBeVisible();

    // Logout
    const userMenuButton = page.locator('[data-testid="user-menu-button"]');
    await userMenuButton.click();
    
    const logoutButton = page.locator('[data-testid="logout-button"]');
    await logoutButton.click();

    // Verify logged out
    const loginButton = page.locator('[data-testid="login-button"]');
    await expect(loginButton).toBeVisible();

    // Refresh and verify still logged out
    await page.reload();
    await expect(loginButton).toBeVisible();
  });
});
