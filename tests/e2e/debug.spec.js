import { test } from '@playwright/test';

test('debug page load', async ({ page }) => {
  const messages = [];
  page.on('console', msg => messages.push(`[${msg.type()}] ${msg.text()}`));
  
  const errors = [];
  page.on('pageerror', err => {
    console.error('PAGE ERROR:', err);
    errors.push(err.toString());
  });
  
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  console.log('=== Console Messages ===');
  messages.forEach(m => console.log(m));
  
  console.log('=== Page Errors ===');
  errors.forEach(e => console.log(e));
  
  console.log('=== Page Title ===');
  console.log(await page.title());
  
  console.log('=== Root HTML ===');
  const root = await page.locator('#root').innerHTML();
  console.log(root.substring(0, 1000));
  
  console.log('=== Network Requests ===');
  const requests = await page.context().storageState();
  console.log('Storage:', requests);
});
