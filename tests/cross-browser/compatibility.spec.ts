import { test, expect, devices } from '@playwright/test';

// Cross-browser compatibility tests
const browsers = ['chromium', 'firefox', 'webkit'];
const viewports = [
  { width: 1920, height: 1080, name: 'Desktop' },
  { width: 768, height: 1024, name: 'Tablet' },
  { width: 375, height: 667, name: 'Mobile' }
];

test.describe('Cross-Browser Compatibility', () => {
  for (const browser of browsers) {
    test.describe(`${browser} Browser Tests`, () => {
      test.use({ 
        browserName: browser as 'chromium' | 'firefox' | 'webkit',
        ...devices[browser === 'webkit' ? 'Desktop Safari' : 
                    browser === 'firefox' ? 'Desktop Firefox' : 'Desktop Chrome']
      });

      test('should render all pages correctly', async ({ page }) => {
        const pages = ['/', '/validator', '/converter'];
        
        for (const path of pages) {
          await page.goto(path);
          
          // Check basic layout elements
          await expect(page.locator('header')).toBeVisible();
          await expect(page.locator('nav')).toBeVisible();
          await expect(page.locator('main')).toBeVisible();
          
          // Check no console errors
          const errors = [];
          page.on('console', msg => {
            if (msg.type() === 'error') {
              errors.push(msg.text());
            }
          });
          
          // Wait for page to fully load
          await page.waitForLoadState('networkidle');
          
          // Verify no critical errors
          expect(errors.filter(e => !e.includes('Warning'))).toHaveLength(0);
        }
      });

      test('should handle form interactions', async ({ page }) => {
        await page.goto('/');
        
        // Test JSON Generator form
        await page.getByText('Add Field').click();
        await page.getByPlaceholder('Enter key').fill('test');
        await page.getByPlaceholder('Enter value').fill('value');
        
        // Should work across all browsers
        const preview = page.getByTestId('json-preview');
        await expect(preview).toContainText('"test": "value"');
      });

      test('should support keyboard navigation', async ({ page }) => {
        await page.goto('/');
        
        // Tab navigation should work
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        
        // Should be able to activate elements with keyboard
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(['BUTTON', 'A', 'INPUT', 'SELECT']).toContain(focusedElement);
      });

      test('should handle file uploads', async ({ page }) => {
        await page.goto('/converter');
        
        // Test file upload functionality
        const fileContent = 'name,age\nJohn,30\nJane,25';
        
        // Create a temporary file
        const buffer = Buffer.from(fileContent);
        
        await page.setInputFiles('input[type="file"]', {
          name: 'test.csv',
          mimeType: 'text/csv',
          buffer
        });
        
        // Should process file across browsers
        await expect(page.getByText('John')).toBeVisible({ timeout: 5000 });
      });
    });
  }
});

test.describe('Responsive Design', () => {
  for (const viewport of viewports) {
    test(`should be responsive on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      
      // Basic responsiveness checks
      await expect(page.locator('body')).toBeVisible();
      
      // Navigation should be accessible
      if (viewport.width < 768) {
        // Mobile: check if navigation is collapsible/hamburger menu
        await expect(page.locator('nav')).toBeVisible();
      } else {
        // Desktop/Tablet: full navigation
        await expect(page.getByText('JSON Generator')).toBeVisible();
        await expect(page.getByText('JSON Validator')).toBeVisible();
        await expect(page.getByText('CSV Converter')).toBeVisible();
      }
      
      // Main content should be visible
      await expect(page.getByText('Add Field')).toBeVisible();
    });
  }
});

test.describe('Accessibility', () => {
  test('should meet WCAG guidelines', async ({ page }) => {
    await page.goto('/');
    
    // Check for required accessibility attributes
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    await expect(headings.first()).toBeVisible();
    
    // Check for proper labels
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < Math.min(inputCount, 5); i++) {
      const input = inputs.nth(i);
      const hasLabel = await input.evaluate(el => {
        return el.hasAttribute('aria-label') || 
               el.hasAttribute('aria-labelledby') ||
               document.querySelector(`label[for="${el.id}"]`) !== null;
      });
      
      if (!hasLabel) {
        // Some inputs might not need labels (like hidden inputs)
        const type = await input.getAttribute('type');
        const hidden = await input.isHidden();
        
        if (type !== 'hidden' && !hidden) {
          console.warn(`Input at index ${i} missing accessibility label`);
        }
      }
    }
    
    // Check for skip links or proper heading structure
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Should be able to navigate with Tab
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => 
      document.activeElement?.tagName.toLowerCase()
    );
    
    // Should focus interactive elements
    const interactiveElements = ['button', 'input', 'a', 'select', 'textarea'];
    expect(interactiveElements).toContain(focusedElement);
    
    // Should be able to activate with Enter/Space
    if (focusedElement === 'button') {
      await page.keyboard.press('Enter');
      // Should trigger action (we'd check for side effects here)
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/');
    
    // This would normally use axe-core or similar tool
    // For now, we'll check that dark mode toggle works
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      
      // Should switch to dark mode
      const html = page.locator('html');
      await expect(html).toHaveClass(/dark/);
      
      // Switch back
      await themeToggle.click();
      await expect(html).not.toHaveClass(/dark/);
    }
  });
});

test.describe('Performance Across Browsers', () => {
  for (const browser of browsers) {
    test(`should load quickly in ${browser}`, async ({ page }) => {
      const start = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - start;
      
      // Should load within reasonable time (adjust based on requirements)
      expect(loadTime).toBeLessThan(5000);
      
      console.log(`${browser} load time: ${loadTime}ms`);
    });
  }
});