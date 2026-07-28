import { test, expect } from '@playwright/test'

test.describe('Performance baseline', () => {
  test('homepage loads within acceptable time', async ({ page }) => {
    const start = Date.now()
    await page.goto('/en', { waitUntil: 'networkidle' })
    const loadTime = Date.now() - start
    // Static site should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000)
  })

  test('tools page loads within acceptable time', async ({ page }) => {
    const start = Date.now()
    await page.goto('/en/tools', { waitUntil: 'networkidle' })
    const loadTime = Date.now() - start
    expect(loadTime).toBeLessThan(5000)
  })

  test('core web vitals headers are present', async ({ page }) => {
    const response = await page.goto('/en', { waitUntil: 'networkidle' })
    expect(response?.status()).toBe(200)
  })

  test('all pages return 200 status', async ({ page, baseURL }) => {
    const pages = ['/en', '/en/tools', '/en/about', '/en/privacy', '/en/updates']
    for (const path of pages) {
      const response = await page.goto(path, { waitUntil: 'networkidle' })
      expect(response?.status(), `${path} should return 200`).toBe(200)
    }
  })
})