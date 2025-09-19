import { test, expect } from '@playwright/test';

test.describe('App Navigation E2E', () => {
  test('should navigate between all tools', async ({ page }) => {
    await page.goto('/');

    // Should start on JSON Generator
    await expect(page.getByText('JSON Generator')).toBeVisible();
    await expect(page.getByText('Add Field')).toBeVisible();

    // Navigate to JSON Validator
    await page.getByText('JSON Validator').click();
    await expect(page.getByText('Paste or upload your JSON')).toBeVisible();

    // Navigate to CSV Converter
    await page.getByText('CSV Converter').click();
    await expect(page.getByText('Upload CSV File')).toBeVisible();

    // Back to JSON Generator
    await page.getByText('JSON Generator').click();
    await expect(page.getByText('Add Field')).toBeVisible();
  });

  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/');

    // Check initial theme (should be light)
    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);

    // Toggle to dark mode
    await page.locator('[data-testid="theme-toggle"]').click();
    await expect(html).toHaveClass(/dark/);

    // Toggle back to light mode  
    await page.locator('[data-testid="theme-toggle"]').click();
    await expect(html).not.toHaveClass(/dark/);
  });

  test('should maintain theme across page navigation', async ({ page }) => {
    await page.goto('/');

    // Toggle to dark mode
    await page.locator('[data-testid="theme-toggle"]').click();
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    // Navigate to different pages
    await page.getByText('JSON Validator').click();
    await expect(html).toHaveClass(/dark/);

    await page.getByText('CSV Converter').click();  
    await expect(html).toHaveClass(/dark/);

    await page.getByText('JSON Generator').click();
    await expect(html).toHaveClass(/dark/);
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    await page.goto('/');

    // Navigate to validator
    await page.getByText('JSON Validator').click();
    await expect(page.getByText('Paste or upload your JSON')).toBeVisible();

    // Use browser back
    await page.goBack();
    await expect(page.getByText('Add Field')).toBeVisible();

    // Use browser forward
    await page.goForward();
    await expect(page.getByText('Paste or upload your JSON')).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Navigation should be accessible on mobile
    await expect(page.getByText('JSON Generator')).toBeVisible();
    
    // Should be able to navigate
    await page.getByText('JSON Validator').click();
    await expect(page.getByText('Paste or upload your JSON')).toBeVisible();
  });
});