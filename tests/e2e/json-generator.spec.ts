import { test, expect } from '@playwright/test';

test.describe('JSON Generator E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should create and export JSON successfully', async ({ page }) => {
    // Should be on JSON Generator page
    await expect(page.getByText('JSON Generator')).toBeVisible();

    // Add first field
    await page.getByText('Add Field').click();
    await page.getByPlaceholder('Enter key').first().fill('name');
    await page.getByPlaceholder('Enter value').first().fill('John Doe');

    // Add second field with number type
    await page.getByText('Add Field').click();
    const keyInputs = page.getByPlaceholder('Enter key');
    const valueInputs = page.getByPlaceholder('Enter value');
    
    await keyInputs.nth(1).fill('age');
    await page.locator('select').nth(1).selectOption('number');
    await valueInputs.nth(1).fill('30');

    // Verify JSON preview updates
    const preview = page.getByTestId('json-preview');
    await expect(preview).toContainText('"name": "John Doe"');
    await expect(preview).toContainText('"age": 30');

    // Test copy functionality
    await page.getByText('Copy JSON').click();
    
    // Should show success message or toast
    await expect(page.getByText(/copied/i)).toBeVisible({ timeout: 2000 });
  });

  test('should handle validation errors appropriately', async ({ page }) => {
    // Add two fields with same key
    await page.getByText('Add Field').click();
    await page.getByPlaceholder('Enter key').first().fill('duplicate');
    
    await page.getByText('Add Field').click();
    await page.getByPlaceholder('Enter key').nth(1).fill('duplicate');

    // Should show duplicate key error
    await expect(page.getByText(/duplicate key/i)).toBeVisible();
  });

  test('should support nested objects', async ({ page }) => {
    // Add field for nested object
    await page.getByText('Add Field').click();
    await page.getByPlaceholder('Enter key').fill('user');
    await page.locator('select').first().selectOption('object');

    // Verify object structure in preview
    const preview = page.getByTestId('json-preview');
    await expect(preview).toContainText('"user": {}');
  });

  test('should persist data across page reloads', async ({ page }) => {
    // Add a field
    await page.getByText('Add Field').click();
    await page.getByPlaceholder('Enter key').fill('persistent');
    await page.getByPlaceholder('Enter value').fill('data');

    // Reload page
    await page.reload();

    // Data should persist
    await expect(page.getByDisplayValue('persistent')).toBeVisible();
    await expect(page.getByDisplayValue('data')).toBeVisible();
  });

  test('should support keyboard shortcuts', async ({ page }) => {
    // Focus on the page
    await page.getByText('JSON Generator').click();

    // Use Ctrl+Enter to add field
    await page.keyboard.press('Control+Enter');
    
    // Should add a new field
    await expect(page.getByPlaceholder('Enter key')).toBeVisible();
  });
});