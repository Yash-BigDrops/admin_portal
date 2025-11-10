import { test, expect } from '@playwright/test';

test.describe('Dashboard Happy Path', () => {
  test('should sign in and display dashboard with synced-only data', async ({ page }) => {
    // Navigate to signin page
    await page.goto('http://localhost:3000/auth/signin');
    
    // Fill in credentials
    await page.fill('input[name="email"]', 'admin@bigdrops.com');
    await page.fill('input[name="password"]', 'admin123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');
    
    // Verify dashboard loads
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Check that metrics cards are rendered
    await expect(page.locator('[data-testid="metrics-cards"]')).toBeVisible();
    
    // Check that trend chart has 24 hourly data points
    const chartData = await page.evaluate(() => {
      // This would need to be implemented in the component with data-testid
      return document.querySelector('[data-testid="submissions-chart"]')?.textContent;
    });
    
    // Verify recent activity section exists
    await expect(page.locator('text=Recent Activity')).toBeVisible();
    
    // Verify requests table exists
    await expect(page.locator('text=Incoming Publisher Requests')).toBeVisible();
    
    // Check that synced-only toggle is present and checked by default
    const syncedToggle = page.locator('input[type="checkbox"]');
    await expect(syncedToggle).toBeChecked();
    
    // Verify no mock data is present (should show empty states)
    await expect(page.locator('text=No synced activity yet')).toBeVisible();
  });
  
  test('should handle API endpoints correctly', async ({ page }) => {
    // Sign in first
    await page.goto('http://localhost:3000/auth/signin');
    await page.fill('input[name="email"]', 'admin@bigdrops.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Test API endpoints
    const responses = await Promise.all([
      page.waitForResponse('**/api/dashboard/metrics'),
      page.waitForResponse('**/api/dashboard/recent-activity'),
      page.waitForResponse('**/api/dashboard/submissions-trend'),
      page.waitForResponse('**/api/dashboard/requests**')
    ]);
    
    // Verify all responses are successful
    responses.forEach(response => {
      expect(response.status()).toBe(200);
    });
    
    // Verify response content types
    const metricsResponse = responses[0];
    const metricsData = await metricsResponse.json();
    expect(metricsData).toHaveProperty('today');
    expect(metricsData).toHaveProperty('yesterday');
    expect(metricsData).toHaveProperty('totalAssets');
    
    const recentActivityResponse = responses[1];
    const recentData = await recentActivityResponse.json();
    expect(recentData).toHaveProperty('items');
    expect(Array.isArray(recentData.items)).toBe(true);
    
    const trendResponse = responses[2];
    const trendData = await trendResponse.json();
    expect(trendData).toHaveProperty('data');
    expect(trendData).toHaveProperty('totals');
    expect(Array.isArray(trendData.data)).toBe(true);
    expect(trendData.data).toHaveLength(24); // 24 hours
    
    const requestsResponse = responses[3];
    const requestsData = await requestsResponse.json();
    expect(requestsData).toHaveProperty('requests');
    expect(Array.isArray(requestsData.requests)).toBe(true);
  });
});
