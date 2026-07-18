import { test, expect } from '@playwright/test'

test.describe('AAIGC Portal', () => {
  test('homepage loads and shows products', async ({ page }) => {
    await page.goto('/en')
    await expect(page.locator('h1')).toContainText('AAIGC')
    await expect(page.locator('text=CookMate')).toBeVisible()
    await expect(page.locator('text=AIHub')).toBeVisible()
  })

  test('language switcher works', async ({ page }) => {
    await page.goto('/en')
    await page.click('[title*="English"]')
    await page.click('text=中文')
    await expect(page).toHaveURL(/\/zh-CN/)
  })

  test('tools page lists all categories', async ({ page }) => {
    await page.goto('/en/tools')
    await expect(page.locator('text=Developer Tools')).toBeVisible()
    await expect(page.locator('text=Text Tools')).toBeVisible()
    await expect(page.locator('text=Time Tools')).toBeVisible()
  })

  test('about page loads', async ({ page }) => {
    await page.goto('/en/about')
    await expect(page.locator('h1')).toContainText('About AAIGC')
  })
})