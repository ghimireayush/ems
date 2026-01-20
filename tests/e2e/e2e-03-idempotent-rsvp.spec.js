import { test, expect } from '@playwright/test';

test.describe('E2E-03: Idempotent RSVP (No Double-Count)', () => {
  const testOTP = '123456';

  test('should not inflate RSVP count on duplicate attempts', async ({ page }) => {
    // Use unique phone per test run to avoid conflicts
    const testPhone = `+977981${Math.random().toString().slice(2, 10)}`;
    
    // Setup: Login
    await page.goto('/');
    
    const eventItems = page.locator('[data-testid^="event-item-"]');
    await expect(eventItems.first()).toBeVisible();
    
    const firstEventId = await eventItems.first().getAttribute('data-testid');
    const eventId = firstEventId.replace('event-item-', '');

    // Login
    await page.locator('[data-testid="login-button"]').click();
    const loginModal = page.locator('[data-testid="login-modal"]');
    await expect(loginModal).toBeVisible();

    await page.locator('[data-testid="phone-input"]').fill(testPhone);
    await page.locator('[data-testid="send-otp-button"]').click();

    await page.locator('[data-testid="otp-input"]').waitFor({ state: 'visible' });
    await page.locator('[data-testid="otp-input"]').fill(testOTP);
    await page.locator('[data-testid="verify-button"]').click();

    await expect(loginModal).not.toBeVisible();

    // Get initial count
    const initialResponse = await page.request.get(`http://localhost:5012/v1/events/${eventId}`);
    const initialEvent = await initialResponse.json();
    const initialCount = initialEvent.rsvp_count;

    // FIRST RSVP
    const eventItems2 = page.locator('[data-testid^="event-item-"]');
    await eventItems2.first().click();

    // Wait for event detail to load and make sure we're on Details tab
    const eventDetail = page.locator('[data-testid="event-detail"]');
    await expect(eventDetail).toBeVisible();
    
    const detailsTab = page.locator('button:has-text("Details")');
    await detailsTab.click();
    await expect(eventDetail).toBeVisible();

    const rsvpButton = page.locator('[data-testid="rsvp-button"]');
    await expect(rsvpButton).toBeEnabled();
    await rsvpButton.click();

    // Verify button shows "You're Going" - wait for state change
    await expect(rsvpButton).toContainText("You're Going", { timeout: 10000 });

    // Wait for network to settle after RSVP
    await page.waitForLoadState('networkidle');

    // Get count after first RSVP
    const afterFirstResponse = await page.request.get(`http://localhost:5012/v1/events/${eventId}`);
    const afterFirstEvent = await afterFirstResponse.json();
    const countAfterFirst = afterFirstEvent.rsvp_count;

    expect(countAfterFirst).toBe(initialCount + 1);

    // ATTEMPT DUPLICATE (via API)
    const token = await page.evaluate(() => localStorage.getItem('nepal_elections_token'));
    const duplicateResponse = await page.request.post(
      `http://localhost:5012/v1/events/${eventId}/rsvp`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: { status: 'going' },
      }
    );

    expect(duplicateResponse.ok()).toBeTruthy();

    // Verify count didn't increase
    const afterDuplicateResponse = await page.request.get(`http://localhost:5012/v1/events/${eventId}`);
    const afterDuplicateEvent = await afterDuplicateResponse.json();
    
    expect(afterDuplicateEvent.rsvp_count).toBe(countAfterFirst);
  });
});
