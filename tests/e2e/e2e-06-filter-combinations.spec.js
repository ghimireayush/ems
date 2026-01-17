import { test, expect } from '@playwright/test';

test.describe('E2E-06: Filter Combinations', () => {
  test('should filter events by party', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Get initial event count
    const eventItems = page.locator('[data-testid^="event-item-"]');
    const initialCount = await eventItems.count();
    expect(initialCount).toBeGreaterThan(0);

    // Apply party filter (assuming NC exists)
    const partyFilter = page.locator('[data-testid="filter-party"]');
    if (await partyFilter.isVisible()) {
      await partyFilter.selectOption('nc');
      await page.waitForTimeout(500);

      // Count filtered events
      const filteredItems = page.locator('[data-testid^="event-item-"]');
      const filteredCount = await filteredItems.count();

      // Filtered count should be <= initial count
      expect(filteredCount).toBeLessThanOrEqual(initialCount);

      // Clear filter
      await partyFilter.selectOption('');
      await page.waitForTimeout(500);

      // Should be back to initial count
      const resetItems = page.locator('[data-testid^="event-item-"]');
      const resetCount = await resetItems.count();
      expect(resetCount).toBe(initialCount);
    }
  });

  test('should filter events by constituency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const eventItems = page.locator('[data-testid^="event-item-"]');
    const initialCount = await eventItems.count();

    // Apply constituency filter
    const constituencyFilter = page.locator('[data-testid="filter-constituency"]');
    if (await constituencyFilter.isVisible()) {
      // Get first option (skip empty)
      const options = await constituencyFilter.locator('option').count();
      if (options > 1) {
        await constituencyFilter.selectOption({ index: 1 });
        await page.waitForTimeout(500);

        const filteredItems = page.locator('[data-testid^="event-item-"]');
        const filteredCount = await filteredItems.count();

        expect(filteredCount).toBeLessThanOrEqual(initialCount);

        // Clear filter
        await constituencyFilter.selectOption('');
        await page.waitForTimeout(500);

        const resetItems = page.locator('[data-testid^="event-item-"]');
        const resetCount = await resetItems.count();
        expect(resetCount).toBe(initialCount);
      }
    }
  });

  test('should combine multiple filters', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const eventItems = page.locator('[data-testid^="event-item-"]');
    const initialCount = await eventItems.count();

    // Apply party filter
    const partyFilter = page.locator('[data-testid="filter-party"]');
    const constituencyFilter = page.locator('[data-testid="filter-constituency"]');

    if (await partyFilter.isVisible() && await constituencyFilter.isVisible()) {
      await partyFilter.selectOption('nc');
      await page.waitForTimeout(300);

      const afterPartyFilter = await page.locator('[data-testid^="event-item-"]').count();

      // Apply constituency filter
      const options = await constituencyFilter.locator('option').count();
      if (options > 1) {
        await constituencyFilter.selectOption({ index: 1 });
        await page.waitForTimeout(300);

        const combinedCount = await page.locator('[data-testid^="event-item-"]').count();

        // Combined filters should be <= individual filters
        expect(combinedCount).toBeLessThanOrEqual(afterPartyFilter);
        expect(combinedCount).toBeLessThanOrEqual(initialCount);
      }
    }
  });
});
