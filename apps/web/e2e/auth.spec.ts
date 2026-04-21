import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('should display login page and handle invalid login', async ({ page }) => {
    // Navigate to local website
    await page.goto('/');

    // Go to login page directly or click a login button if it existed on the landing page
    await page.goto('/login');

    // Wait for form to be visible
    await expect(page.locator('text=Masuk ke LocalCompliance')).toBeVisible();

    // Fill form
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for the error message
    const errorMsg = page.locator('.text-destructive');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText('Email atau password salah');
  });

  test('should navigate to register page from login', async ({ page }) => {
    await page.goto('/login');
    
    // Click register link
    await page.click('text=Daftar gratis');
    
    // Check URL changed
    await expect(page).toHaveURL(/.*\/register/);
    await expect(page.locator('text=Daftar ke LocalCompliance')).toBeVisible();
  });
});
