import { test, expect } from '@playwright/test'

test.describe('AAIGC Portal', () => {
  test('homepage loads and shows products', async ({ page }) => {
    await page.goto('/en')
    await expect(page.locator('h1')).toContainText('AAIGC')
    await expect(page.locator('text=CookMate').first()).toBeVisible()
    await expect(page.locator('text=AIHub').first()).toBeVisible()
  })

  test('language switcher is present', async ({ page }) => {
    await page.goto('/en')
    // The language switcher button (globe icon) should be visible
    await expect(page.locator('button[title]').first()).toBeVisible()
  })

  test('tools page lists all categories', async ({ page }) => {
    await page.goto('/en/tools')
    await expect(page.locator('text=Developer Tools')).toBeVisible()
    await expect(page.locator('text=Text Tools')).toBeVisible()
    await expect(page.locator('text=Time Tools')).toBeVisible()
  })

  test('can navigate to a tool page', async ({ page }) => {
    await page.goto('/en/tools/json-formatter')
    await expect(page.locator('h1')).toContainText('JSON Formatter')
  })

  test('calculator tool loads', async ({ page }) => {
    await page.goto('/en/tools/calculator')
    await expect(page.locator('h1')).toContainText('Calculator')
  })

  test('about page loads', async ({ page }) => {
    await page.goto('/en/about')
    await expect(page.locator('h1')).toContainText('About')
  })

  test('privacy page loads', async ({ page }) => {
    await page.goto('/en/privacy')
    await expect(page.locator('h1')).toContainText('Privacy')
  })

  test('updates page loads', async ({ page }) => {
    await page.goto('/en/updates')
    await expect(page.locator('h1')).toContainText('Updates')
  })

  test('404 page shows for unknown routes', async ({ page }) => {
    const response = await page.goto('/en/nonexistent-page')
    expect(response?.status()).toBe(404)
  })

  test('tool search works', async ({ page }) => {
    await page.goto('/en/tools')
    const searchInput = page.locator('input[placeholder*="Search"]')
    await searchInput.fill('json')
    await expect(page.locator('text=JSON Formatter').first()).toBeVisible()
  })

  test('navigating to product detail page works', async ({ page }) => {
    await page.goto('/en/products/cookmate')
    await expect(page.locator('h1')).toContainText('CookMate')
  })

  test('footer contains links', async ({ page }) => {
    await page.goto('/en')
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
    await expect(page.locator('footer')).toContainText('AAIGC')
  })

  test('header navigation works', async ({ page }) => {
    await page.goto('/en')
    await page.click('text=Products')
    await expect(page).toHaveURL(/\/products/)
    await page.click('text=Tools')
    await expect(page).toHaveURL(/\/tools/)
  })
})