import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('E2E-07: Data Survives Backend Restart', () => {
  test.setTimeout(120000); // Increase timeout for backend restart
  
  test('should persist user and RSVP data across backend restart (auth tokens expire)', async ({ page }) => {
    const testPhone = `+977981${Math.random().toString().slice(2, 10)}`;
    const testOTP = '123456';

    // SETUP: Login and RSVP
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Get first event ID
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

    // RSVP to event
    await eventItems.first().click();
    const eventDetail = page.locator('[data-testid="event-detail"]');
    await expect(eventDetail).toBeVisible();

    const detailsTab = page.locator('button:has-text("Details")');
    await detailsTab.click();
    await expect(eventDetail).toBeVisible();

    const rsvpButton = page.locator('[data-testid="rsvp-button"]');
    await rsvpButton.click();
    await expect(rsvpButton).toContainText("You're Going", { timeout: 10000 });

    // Get initial RSVP count
    const initialCountResponse = await page.request.get(`http://localhost:8000/v1/events/${eventId}`);
    const initialEvent = await initialCountResponse.json();
    const countBeforeRestart = initialEvent.rsvp_count;

    // Get user ID from API
    const userResponse = await page.request.get('http://localhost:8000/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('nepal_elections_token'))}`
      }
    });
    const userData = await userResponse.json();
    const userId = userData.id;

    // RESTART BACKEND
    console.log('Restarting backend...');
    execSync('docker-compose restart backend', { stdio: 'inherit' });
    
    // Wait for backend to be healthy (up to 60 seconds)
    let healthy = false;
    for (let i = 0; i < 60; i++) {
      try {
        const healthResponse = await page.request.get('http://localhost:8000/health', {
          timeout: 5000
        });
        if (healthResponse.ok()) {
          healthy = true;
          console.log('Backend is healthy');
          break;
        }
      } catch (e) {
        // Still waiting
        if (i % 10 === 0) console.log(`Waiting for backend... (${i}s)`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    expect(healthy).toBeTruthy();

    // Reload page to get fresh frontend
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give more time for frontend to stabilize

    // VERIFY DATA PERSISTED
    // Note: Auth tokens are in-memory and expire after restart (correct security behavior)
    // But user data and RSVPs should persist in database
    
    console.log('Logging out and re-logging in after backend restart...');
    
    // Wait for events to load first
    const eventItems2 = page.locator('[data-testid^="event-item-"]');
    await expect(eventItems2.first()).toBeVisible({ timeout: 15000 });
    
    // Logout first (click on user dropdown to open menu)
    const userButton = page.locator('button:has-text("+977981")');
    await userButton.click();
    
    // Click logout button
    const logoutButton = page.locator('[data-testid="logout-button"]');
    await logoutButton.click();
    
    // Now login button should be visible
    await page.locator('[data-testid="login-button"]').click();
    const loginModal2 = page.locator('[data-testid="login-modal"]');
    await expect(loginModal2).toBeVisible();

    await page.locator('[data-testid="phone-input"]').fill(testPhone);
    await page.locator('[data-testid="send-otp-button"]').click();

    await page.locator('[data-testid="otp-input"]').waitFor({ state: 'visible' });
    await page.locator('[data-testid="otp-input"]').fill(testOTP);
    await page.locator('[data-testid="verify-button"]').click();

    await expect(loginModal2).not.toBeVisible();

    // Get new token
    const newToken = await page.evaluate(() => localStorage.getItem('nepal_elections_token'));
    expect(newToken).toBeTruthy();

    // Force a hard refresh to ensure frontend picks up auth changes
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Verify it's the same user
    const reloginUserResponse = await page.request.get('http://localhost:8000/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${newToken}`
      }
    });
    const reloginUserData = await reloginUserResponse.json();
    expect(reloginUserData.id).toBe(userId);

    // Verify RSVP still exists
    const rsvpsResponse = await page.request.get('http://localhost:8000/v1/users/me/rsvps', {
      headers: {
        'Authorization': `Bearer ${newToken}`
      }
    });
    const rsvpsData = await rsvpsResponse.json();
    const hasRsvp = rsvpsData.data.some(r => r.id === eventId);
    expect(hasRsvp).toBeTruthy();

    // Verify RSVP count unchanged
    const finalCountResponse = await page.request.get(`http://localhost:8000/v1/events/${eventId}`);
    const finalEvent = await finalCountResponse.json();
    expect(finalEvent.rsvp_count).toBe(countBeforeRestart);

    // Verify button shows RSVP status
    const eventItemsFinal = page.locator('[data-testid^="event-item-"]');
    await eventItemsFinal.first().click();
    const eventDetail2 = page.locator('[data-testid="event-detail"]');
    await expect(eventDetail2).toBeVisible();

    const detailsTab2 = page.locator('button:has-text("Details")');
    await detailsTab2.click();

    const rsvpButton2 = page.locator('[data-testid="rsvp-button"]');
    await expect(rsvpButton2).toContainText("You're Going");
  });
});
