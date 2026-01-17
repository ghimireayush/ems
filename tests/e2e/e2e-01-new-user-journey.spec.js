import { test, expect } from '@playwright/test';

test.describe('E2E-01: Complete New User Journey', () => {
  test('should allow new user to discover, register, and RSVP', async ({ page }) => {
    // Use unique phone per test run to avoid conflicts
    const testPhone = `+977981${Math.random().toString().slice(2, 10)}`;
    const testOTP = '123456';
    // 1. DISCOVER (Anonymous)
    await page.goto('/');
    
    // Wait for app to load and render
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Verify events load
    const eventList = page.locator('[data-testid="event-list"]');
    await expect(eventList).toBeVisible({ timeout: 10000 });
    
    const eventItems = page.locator('[data-testid^="event-item-"]');
    const eventCount = await eventItems.count();
    expect(eventCount).toBeGreaterThan(0);

    // Get first event ID for later verification
    const firstEventId = await eventItems.first().getAttribute('data-testid');
    const eventId = firstEventId.replace('event-item-', '');

    // Click first event
    await eventItems.first().click();
    
    // Verify event detail shows
    const eventDetail = page.locator('[data-testid="event-detail"]');
    await expect(eventDetail).toBeVisible();
    
    // Verify RSVP button says "Login to RSVP"
    const rsvpButton = page.locator('[data-testid="rsvp-button"]');
    await expect(rsvpButton).toContainText('Login to RSVP');

    // 2. REGISTER
    await page.locator('[data-testid="login-button"]').click();
    
    // Verify login modal appears
    const loginModal = page.locator('[data-testid="login-modal"]');
    await expect(loginModal).toBeVisible();

    // Enter phone number
    await page.locator('[data-testid="phone-input"]').fill(testPhone);
    await page.locator('[data-testid="send-otp-button"]').click();

    // Verify OTP screen appears (dev OTP shown)
    await page.locator('[data-testid="otp-input"]').waitFor({ state: 'visible' });

    // Enter OTP
    await page.locator('[data-testid="otp-input"]').fill(testOTP);
    await page.locator('[data-testid="verify-button"]').click();

    // Verify modal closes and user is logged in
    await expect(loginModal).not.toBeVisible();
    const userMenuButton = page.locator('[data-testid="user-menu-button"]');
    await expect(userMenuButton).toBeVisible();

    // 3. RSVP
    // Navigate to event detail if not already there
    const eventDetailVisible = await eventDetail.isVisible();
    if (!eventDetailVisible) {
      await eventItems.first().click();
      await expect(eventDetail).toBeVisible();
    }

    // Make sure we're on the Details tab
    const detailsTab = page.locator('button:has-text("Details")');
    await detailsTab.click();
    await expect(eventDetail).toBeVisible();

    // Get initial RSVP count
    const rsvpCountElement = page.locator('[data-testid="rsvp-count"]');
    await rsvpCountElement.waitFor({ state: 'visible' });
    const countBefore = parseInt((await rsvpCountElement.textContent()).trim());

    // Verify RSVP button now says "RSVP to this Event"
    await expect(rsvpButton).toContainText('RSVP to this Event');

    // Click RSVP
    await rsvpButton.click();

    // Verify button changes to "✓ You're Going!" - wait for state change
    await expect(rsvpButton).toContainText("You're Going", { timeout: 10000 });

    // Refetch event to get updated RSVP count from backend
    await page.waitForTimeout(500);
    const refreshResponse = await page.request.get(`http://localhost:8000/v1/events/${eventId}`);
    const refreshedEvent = await refreshResponse.json();
    const countAfter = refreshedEvent.rsvp_count;
    
    expect(countAfter).toBe(countBefore + 1);

    // 4. VERIFY DATABASE (via API)
    const response = await page.request.get(`http://localhost:8000/v1/events/${eventId}`);
    expect(response.ok()).toBeTruthy();
    
    const eventData = await response.json();
    expect(eventData.rsvp_count).toBe(countAfter);
  });
});
