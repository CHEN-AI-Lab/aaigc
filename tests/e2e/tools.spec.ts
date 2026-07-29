import { test, expect } from '@playwright/test'

test.describe('Tool functionality', () => {
  test('calculator computes 2 + 2 = 4', async ({ page }) => {
    await page.goto('/en/tools/calculator')
    // Calculator is tab-based, click the "Calculator" tab or use the basic calc
    // Click buttons: 2, +, 2, =
    await page.locator('button', { hasText: '2' }).first().click()
    await page.locator('button', { hasText: '+' }).click()
    await page.locator('button', { hasText: '2' }).first().click()
    await page.locator('button', { hasText: '=' }).click()
    // Check result display contains 4
    const display = page.locator('.font-mono.text-right').first()
    await expect(display).toContainText('4')
  })

  test('timestamp converter loads and shows input', async ({ page }) => {
    await page.goto('/en/tools/timestamp')
    // The page should load with timestamp inputs
    const inputs = page.locator('input[type="number"]')
    await expect(inputs.first()).toBeVisible()
  })

  test('json formatter formats valid JSON', async ({ page }) => {
    await page.goto('/en/tools/json-formatter')
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()
    await textarea.fill('{"name":"test","value":123}')
    // Click format button
    await page.locator('button', { hasText: 'Format' }).click()
    // Check output contains formatted JSON
    const output = page.locator('[class*="font-mono"]').last()
    await expect(output).toContainText('"name"')
    await expect(output).toContainText('"test"')
  })

  test('base64 encoder encodes text', async ({ page }) => {
    await page.goto('/en/tools/base64')
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()
    await textarea.fill('Hello World')
    // Click convert button
    await page.locator('button', { hasText: 'Convert' }).click()
    // Check output textarea contains encoded text
    const output = page.locator('textarea[readonly]')
    await expect(output).toContainText('SGVsbG8g')
  })

  test('qr code generates from text', async ({ page }) => {
    await page.goto('/en/tools/qrcode')
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()
    await textarea.fill('https://aaigc.online')
    // Click generate button
    await page.locator('button', { hasText: 'Generate QR Code' }).click()
    // Check that an image is rendered
    const img = page.locator('img[alt="QR Code"]')
    await expect(img).toBeVisible()
  })

  test('url encoder encodes URL', async ({ page }) => {
    await page.goto('/en/tools/url-encode')
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()
    await textarea.fill('hello world')
    // Click convert button
    await page.locator('button', { hasText: 'Convert' }).click()
    // Check output textarea contains encoded text
    const output = page.locator('textarea[readonly]')
    await expect(output).toContainText('hello%20world')
  })
})