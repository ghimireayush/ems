import { test, expect } from '@playwright/test';

test.describe('E2E-02: RSVP Count Integrity Under Multiple Users', () => {
  const testOTP = '123456';

  test('should maintain accurate RSVP counts with multiple users', async ({ page }) => {
    // Get first event ID
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    const eventItems = page.locator('[data-testid^="event-item-"]');
    await expect(eventItems.first()).toBeVisible();
    
    const firstEventId = await eventItems.first().getAttribute('data-testid');
    const eventId = firstEventId.replace('event-item-', '');

    // Get initial RSVP count
    const initialResponse = await page.request.get(`http://localhost:5012/v1/events/${eventId}`);
    const initialEvent = await initialResponse.json();
    const initialCount = initialEvent.rsvp_count;

    // User 1: Login and RSVP
    const phone1 = `+977981${Math.random().toString().slice(2, 10)}`;
    await page.locator('[data-testid="login-button"]').click();
    let loginModal = page.locator('[data-testid="login-modal"]');
    await expect(loginModal).toBeVisible();

    await page.locator('[data-testid="phone-input"]').fill(phone1);
    await page.locator('[data-testid="send-otp-button"]').click();
    await page.locator('[data-testid="otp-input"]').waitFor({ state: 'visible' });
    await page.locator('[data-testid="otp-input"]').fill(testOTP);
    await page.locator('[data-testid="verify-button"]').click();
    await expect(loginModal).not.toBeVisible();

    // RSVP
    const eventItems1 = page.locator('[data-testid^="event-item-"]');
    await eventItems1.first().click();
    
    // Wait for event detail to load and make sure we're on Details tab
    const eventDetail = page.locator('[data-testid="event-detail"]');
    await expect(eventDetail).toBeVisible();
    
    const detailsTab = page.locator('button:has-text("Details")');
    await detailsTab.click();
    await expect(eventDetail).toBeVisible();
    
    let rsvpButton = page.locator('[data-testid="rsvp-button"]');
    await expect(rsvpButton).toBeEnabled();
    await rsvpButton.click();
    
    // Verify button shows "You're Going" - wait for state change
    await expect(rsvpButton).toContainText("You're Going", { timeout: 10000 });

    // Verify count incremented
    let response = await page.request.get(`http://localhost:5012/v1/events/${eventId}`);
    let event = await response.json();
    expect(event.rsvp_count).toBe(initialCount + 1);

    // User 2: RSVP via API (simulates different user)
    const phone2 = `+977981${Math.random().toString().slice(2, 10)}`;
    await page.request.post(`http://localhost:5012/v1/auth/request-otp`, {
      data: { phone: phone2 }
    });
    
    const verifyResponse2 = await page.request.post(`http://localhost:5012/v1/auth/verify-otp`, {
      data: { phone: phone2, otp: '123456' }
    });
    expect(verifyResponse2.ok()).toBeTruthy();
    const verifyData2 = await verifyResponse2.json();
    const token2 = verifyData2.access_token;

    // User 2 RSVPs via API
    const rsvpResponse2 = await page.request.post(`http://localhost:5012/v1/events/${eventId}/rsvp`, {
      headers: { Authorization: `Bearer ${token2}` },
      data: { status: 'going' }
    });
    expect(rsvpResponse2.ok()).toBeTruthy();

    // Wait a moment for backend to process
    await page.waitForTimeout(500);

    // Verify count incremented
    response = await page.request.get(`http://localhost:5012/v1/events/${eventId}`);
    event = await response.json();
    expect(event.rsvp_count).toBe(initialCount + 2);

    // User 3: RSVP via API
    const phone3 = `+977981${Math.random().toString().slice(2, 10)}`;
    await page.request.post(`http://localhost:5012/v1/auth/request-otp`, {
      data: { phone: phone3 }
    });
    
    const verify3Response = await page.request.post(`http://localhost:5012/v1/auth/verify-otp`, {
      data: { phone: phone3, otp: '123456' }
    });
    expect(verify3Response.ok()).toBeTruthy();
    const verify3Data = await verify3Response.json();
    const token3 = verify3Data.access_token;

    // User 3 RSVPs via API
    const rsvpResponse3 = await page.request.post(`http://localhost:5012/v1/events/${eventId}/rsvp`, {
      headers: { Authorization: `Bearer ${token3}` },
      data: { status: 'going' }
    });
    expect(rsvpResponse3.ok()).toBeTruthy();

    // Wait a moment for backend to process
    await page.waitForTimeout(500);

    // Final verification
    response = await page.request.get(`http://localhost:5012/v1/events/${eventId}`);
    event = await response.json();
    expect(event.rsvp_count).toBe(initialCount + 3);
  });
});
