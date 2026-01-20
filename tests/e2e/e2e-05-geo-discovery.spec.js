import { test, expect } from '@playwright/test';

test.describe('E2E-05: Geo-Based Event Discovery', () => {
  test('should find nearby events via API', async ({ page }) => {
    // Test the nearby endpoint with known coordinates
    // Basantapur (evt-001 location): [27.7041, 85.3143]
    const response = await page.request.get(
      'http://localhost:5012/v1/events/nearby?lat=27.7041&lng=85.3143&radius=5000'
    );
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // Should have events
    expect(data.data).toBeDefined();
    expect(data.data.length).toBeGreaterThan(0);
    
    // Should have distance info
    const firstEvent = data.data[0];
    expect(firstEvent.distance_meters).toBeDefined();
    expect(firstEvent.distance_meters).toBeGreaterThanOrEqual(0);
    
    // Should be sorted by distance
    for (let i = 1; i < data.data.length; i++) {
      expect(data.data[i].distance_meters).toBeGreaterThanOrEqual(
        data.data[i - 1].distance_meters
      );
    }
  });

  test('should detect constituency from coordinates', async ({ page }) => {
    // Test with Kathmandu coordinates (should be in ktm-1 or ktm-2)
    const response = await page.request.get(
      'http://localhost:5012/v1/constituencies/detect?lat=27.7172&lng=85.3240'
    );
    
    expect(response.ok()).toBeTruthy();
    const constituency = await response.json();
    
    expect(constituency.id).toBeDefined();
    expect(constituency.name).toBeDefined();
    expect(constituency.province).toBeDefined();
    expect(constituency.district).toBeDefined();
  });

  test('should return 404 for coordinates outside all constituencies', async ({ page }) => {
    // Test with coordinates far outside Nepal
    const response = await page.request.get(
      'http://localhost:5012/v1/constituencies/detect?lat=26.0&lng=84.0'
    );
    
    expect(response.status()).toBe(404);
  });

  test('should respect radius parameter in nearby search', async ({ page }) => {
    // Search with small radius (100m)
    const smallRadiusResponse = await page.request.get(
      'http://localhost:5012/v1/events/nearby?lat=27.7041&lng=85.3143&radius=100'
    );
    
    expect(smallRadiusResponse.ok()).toBeTruthy();
    const smallRadiusData = await smallRadiusResponse.json();
    
    // Search with large radius (50km)
    const largeRadiusResponse = await page.request.get(
      'http://localhost:5012/v1/events/nearby?lat=27.7041&lng=85.3143&radius=50000'
    );
    
    expect(largeRadiusResponse.ok()).toBeTruthy();
    const largeRadiusData = await largeRadiusResponse.json();
    
    // Large radius should have more or equal events
    expect(largeRadiusData.data.length).toBeGreaterThanOrEqual(smallRadiusData.data.length);
  });
});
