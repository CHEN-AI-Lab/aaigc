import { test, expect } from '@playwright/test'

test.describe('Tool functionality', () => {
  test('calculator computes 2 + 2 = 4', async ({ page }) => {
    await page.goto('/en/tools/calculator')
    // Click digits and operator
    await page.click('text=2')
    await page.click('text=+')
    await page.click('text=2')
    await page.click('text==')
    // Check result contains 4
    const result = page.locator('[class*="result"], [class*="display"], [class*="output"]')
    await expect(result).toContainText('4')
  })

  test('timestamp converter shows current timestamp', async ({ page }) => {
    await page.goto('/en/tools/timestamp')
    // The page should load with a current timestamp value
    const now = Math.floor(Date.now() / 1000)
    const input = page.locator('input[type="text"], input[type="number"]').first()
    await expect(input).toBeVisible()
    // Input should be within 10 seconds of current time
    const value = await input.inputValue()
    const numVal = parseInt(value, 10)
    expect(Math.abs(numVal - now)).toBeLessThan(10)
  })

  test('json formatter formats valid JSON', async ({ page }) => {
    await page.goto('/en/tools/json-formatter')
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()
    await textarea.fill('{"name":"test","value":123}')
    // Click format button
    const formatBtn = page.locator('button:has-text("Format"), button:has-text("格式化")')
    await formatBtn.click()
    // Check formatted output
    const output = page.locator('pre, code, [class*="output"]').first()
    await expect(output).toContainText('"name"')
  })

  test('base64 encoder encodes text', async ({ page }) => {
    await page.goto('/en/tools/base64')
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()
    await textarea.fill('Hello World')
    // Click encode button
    const encodeBtn = page.locator('button:has-text("Encode"), button:has-text("编码")')
    await encodeBtn.click()
    // Check encoded output
    const output = page.locator('textarea, pre, [class*="output"]').last()
    await expect(output).toContainText('SGVsbG8g')
  })

  test('qr code generates from text', async ({ page }) => {
    await page.goto('/en/tools/qrcode')
    const input = page.locator('input[type="text"], textarea').first()
    await expect(input).toBeVisible()
    await input.fill('https://aaigc.online')
    // Click generate button
    const genBtn = page.locator('button:has-text("Generate"), button:has-text("生成")')
    await genBtn.click()
    // Check that an image/canvas is rendered
    const img = page.locator('img, canvas').first()
    await expect(img).toBeVisible()
  })

  test('url encoder encodes URL', async ({ page }) => {
    await page.goto('/en/tools/url-encode')
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()
    await textarea.fill('hello world')
    const encodeBtn = page.locator('button:has-text("Encode"), button:has-text("编码")')
    await encodeBtn.click()
    const output = page.locator('textarea, pre, [class*="output"]').last()
    await expect(output).toContainText('hello%20world')
  })
})