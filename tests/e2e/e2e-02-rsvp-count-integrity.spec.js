import { test, expect } from '@playwright/test';

test.describe('E2E-02: RSVP Count Integrity Under Multiple Users', () => {
  const users = [
    { phone: '+9779800000001', name: 'User A' },
    { phone: '+9779800000002', name: 'User B' },
    { phone: '+9779800000003', name: 'User C' },
  ];
  const testOTP = '123456';

  test('should maintain accurate RSVP counts with multiple users', async ({ page, context }) => {
    // Get first event ID
    await page.goto('/');
    const eventItems = page.locator('[data-testid^="event-item-"]');
    await expect(eventItems.first()).toBeVisible();
    
    const firstEventId = await eventItems.first().getAttribute('data-testid');
    const eventId = firstEventId.replace('event-item-', '');

    // Get initial RSVP count
    const initialResponse = await page.request.get(`http://localhost:8000/v1/events/${eventId}`);
    const initialEvent = await initialResponse.json();
    const initialCount = initialEvent.rsvp_count;

    // Each user RSVPs
    for (const user of users) {
      // Create new page for each user (simulates different browser/session)
      const userPage = await context.newPage();
      
      try {
        await userPage.goto('/');
        
        // Click login
        await userPage.locator('[data-testid="login-button"]').click();
        const loginModal = userPage.locator('[data-testid="login-modal"]');
        await expect(loginModal).toBeVisible();

        // Enter phone
        await userPage.locator('[data-testid="phone-input"]').fill(user.phone);
        await userPage.locator('[data-testid="send-otp-button"]').click();

        // Enter OTP
        await userPage.locator('[data-testid="otp-input"]').waitFor({ state: 'visible' });
        await userPage.locator('[data-testid="otp-input"]').fill(testOTP);
        await userPage.locator('[data-testid="verify-button"]').click();

        // Wait for login to complete
        await expect(loginModal).not.toBeVisible();

        // Navigate to event and RSVP
        const eventItems = userPage.locator('[data-testid^="event-item-"]');
        await eventItems.first().click();

        const rsvpButton = userPage.locator('[data-testid="rsvp-button"]');
        await rsvpButton.click();

        // Verify RSVP succeeded
        await expect(rsvpButton).toContainText("You're Going");
      } finally {
        await userPage.close();
      }
    }

    // Verify database state
    const finalResponse = await page.request.get(`http://localhost:8000/v1/events/${eventId}`);
    const finalEvent = await finalResponse.json();
    
    expect(finalEvent.rsvp_count).toBe(initialCount + users.length);
  });
});
