import { test, expect } from '@playwright/test'

test.describe('Tool edge cases & error handling', () => {

  // ─── JSON Formatter ───

  test('json formatter handles empty input', async ({ page }) => {
    await page.goto('/en/tools/json-formatter')
    // Empty input, try to format
    await page.locator('button:has-text("Format")').click()
    // Should show error (empty input is invalid JSON)
    await expect(page.locator('text=/invalid/i')).toBeVisible()
  })

  test('json formatter handles invalid JSON', async ({ page }) => {
    await page.goto('/en/tools/json-formatter')
    await page.locator('textarea').first().fill('not json')
    await page.locator('button:has-text("Format")').click()
    // Should show error message
    await expect(page.locator('text=/invalid/i')).toBeVisible()
  })

  test('json formatter validates invalid JSON', async ({ page }) => {
    await page.goto('/en/tools/json-formatter')
    await page.locator('textarea').first().fill('{broken')
    await page.locator('button:has-text("Validate")').click()
    await expect(page.locator('text=/invalid/i')).toBeVisible()
  })

  // ─── Base64 ───

  test('base64 handles empty input', async ({ page }) => {
    await page.goto('/en/tools/base64')
    await page.locator('button:has-text("Convert")').click()
    // Should not crash, no output
    const output = page.locator('textarea[readonly]')
    await expect(output).not.toBeVisible()
  })

  test('base64 decodes invalid input', async ({ page }) => {
    await page.goto('/en/tools/base64')
    await page.locator('textarea').first().fill('!!! not base64 !!!')
    // Switch to decode mode
    await page.locator('button:has-text("Decode")').click()
    await page.locator('button:has-text("Convert")').click()
    // Should show error
    await expect(page.locator('text=/invalid/i')).toBeVisible()
  })

  test('base64 handles Unicode text', async ({ page }) => {
    await page.goto('/en/tools/base64')
    await page.locator('textarea').first().fill('Hello 世界 🌍')
    await page.locator('button:has-text("Convert")').click()
    const output = page.locator('textarea[readonly]')
    await expect(output).toBeVisible()
    // Should produce non-empty output (Unicode-safe encoding)
    const value = await output.inputValue()
    expect(value.length).toBeGreaterThan(0)
  })

  // ─── URL Encoder ───

  test('url encoder handles empty input', async ({ page }) => {
    await page.goto('/en/tools/url-encode')
    await page.locator('button:has-text("Convert")').click()
    const output = page.locator('textarea[readonly]')
    await expect(output).not.toBeVisible()
  })

  test('url encoder handles Chinese characters', async ({ page }) => {
    await page.goto('/en/tools/url-encode')
    await page.locator('textarea').first().fill('你好世界')
    await page.locator('button:has-text("Convert")').click()
    const output = page.locator('textarea[readonly]')
    await expect(output).toContainText('%')
  })

  // ─── Calculator ───

  test('calculator handles division by zero gracefully', async ({ page }) => {
    await page.goto('/en/tools/calculator')
    await page.locator('button:has-text("1")').click()
    await page.locator('button:has-text("÷")').click()
    await page.locator('button:has-text("0")').click()
    await page.locator('button:has-text("=")').click()
    // Should show Infinity or error, not crash
    const display = page.locator('.font-mono.text-right').first()
    await expect(display).toBeVisible()
  })

  // ─── QR Code ───

  test('qr code handles empty input', async ({ page }) => {
    await page.goto('/en/tools/qrcode')
    await page.locator('button:has-text("Generate QR Code")').click()
    // Should show error message about empty text
    await expect(page.locator('text=/enter/i').or(page.locator('text=/empty/i'))).toBeVisible()
  })

  // ─── Password Generator ───

  test('password generator respects minimum length', async ({ page }) => {
    await page.goto('/en/tools/password-generator')
    // Set length to minimum (4)
    const lengthInput = page.locator('input[type="number"]').first()
    await lengthInput.fill('4')
    await page.locator('button:has-text("Generate")').click()
    const output = page.locator('textarea[readonly]')
    const value = await output.inputValue()
    expect(value.length).toBeGreaterThanOrEqual(4)
  })

  test('password generator respects maximum length', async ({ page }) => {
    await page.goto('/en/tools/password-generator')
    const lengthInput = page.locator('input[type="number"]').first()
    await lengthInput.fill('128')
    await page.locator('button:has-text("Generate")').click()
    const output = page.locator('textarea[readonly]')
    const value = await output.inputValue()
    expect(value.length).toBeLessThanOrEqual(128)
  })

  // ─── Text to Slug ───

  test('text to slug handles empty input', async ({ page }) => {
    await page.goto('/en/tools/text-to-slug')
    await page.locator('button:has-text("Convert")').click()
    const output = page.locator('textarea[readonly]')
    await expect(output).not.toBeVisible()
  })

  test('text to slug handles Chinese characters', async ({ page }) => {
    await page.goto('/en/tools/text-to-slug')
    await page.locator('textarea').first().fill('中文测试')
    await page.locator('button:has-text("Convert")').click()
    // Should not crash (Chinese chars may not produce a slug)
    await expect(page.locator('textarea').first()).toHaveValue('中文测试')
  })

  // ─── List Sorter ───

  test('list sorter handles empty input', async ({ page }) => {
    await page.goto('/en/tools/list-sorter')
    // Try to sort with empty input
    await page.locator('button:has-text("A→Z"), button:has-text("Sort A→Z")').click()
    const output = page.locator('textarea[readonly]')
    await expect(output).not.toBeVisible()
  })

  test('list sorter handles duplicate items', async ({ page }) => {
    await page.goto('/en/tools/list-sorter')
    await page.locator('textarea').first().fill('apple\nbanana\napple')
    await page.locator('button:has-text("A→Z"), button:has-text("Sort A→Z")').click()
    const output = page.locator('textarea[readonly]')
    await expect(output).toContainText('apple')
    await expect(output).toContainText('banana')
  })

  // ─── HTML Entities ───

  test('html entities handles empty input', async ({ page }) => {
    await page.goto('/en/tools/html-entities')
    await page.locator('button:has-text("Convert")').click()
    const output = page.locator('textarea[readonly]')
    await expect(output).not.toBeVisible()
  })

  // ─── YAML/JSON Converter ───

  test('yaml converter handles empty input', async ({ page }) => {
    await page.goto('/en/tools/yaml-json')
    await page.locator('button:has-text("Convert")').click()
    const output = page.locator('textarea[readonly]')
    await expect(output).not.toBeVisible()
  })

  test('yaml converter handles invalid YAML', async ({ page }) => {
    await page.goto('/en/tools/yaml-json')
    await page.locator('textarea').first().fill('[[[')
    await page.locator('button:has-text("Convert")').click()
    // Should handle gracefully
    const output = page.locator('textarea[readonly]')
    await expect(output).not.toBeVisible()
  })

  // ─── CSS Minifier ───

  test('css minifier handles empty input', async ({ page }) => {
    await page.goto('/en/tools/css-minifier')
    await page.locator('button:has-text("Minify")').last().click()
    const output = page.locator('textarea[readonly]')
    await expect(output).not.toBeVisible()
  })

  // ─── Number Base ───

  test('number base handles zero', async ({ page }) => {
    await page.goto('/en/tools/number-base')
    const input = page.locator('input').first()
    await expect(input).toBeVisible()
    await input.fill('0')
    // Should not crash
    await expect(input).toHaveValue('0')
  })

  // ─── Regex Tester ───

  test('regex tester handles empty pattern', async ({ page }) => {
    await page.goto('/en/tools/regex-tester')
    const textarea = page.locator('textarea').first()
    await textarea.fill('test text')
    // Empty pattern should not crash
    await expect(page.locator('text=test text').first()).toBeVisible()
  })

  test('regex tester handles empty test text', async ({ page }) => {
    await page.goto('/en/tools/regex-tester')
    const patternInput = page.locator('input').first()
    await patternInput.fill('\\d+')
    // Empty test text should not crash
    await expect(patternInput).toHaveValue('\\d+')
  })

  // ─── UUID Generator ───

  test('uuid generator handles count 1', async ({ page }) => {
    await page.goto('/en/tools/uuid-generator')
    // Default count is 1, generate one UUID
    await page.locator('button:has-text("Generate")').click()
    const output = page.locator('textarea[readonly]')
    await expect(output).toBeVisible()
    const value = await output.inputValue()
    // Should match UUID format
    expect(value).toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)
  })

  // ─── JWT Decoder ───

  test('jwt decoder handles empty input', async ({ page }) => {
    await page.goto('/en/tools/jwt-decoder')
    await page.locator('button:has-text("Decode")').click()
    // Should handle gracefully
    const output = page.locator('textarea[readonly]')
    const count = await output.count()
    expect(count).toBe(0)
  })

  test('jwt decoder handles invalid token', async ({ page }) => {
    await page.goto('/en/tools/jwt-decoder')
    await page.locator('textarea').first().fill('not.a.jwt')
    await page.locator('button:has-text("Decode")').click()
    // Should show error
    await expect(page.locator('text=/invalid/i').or(page.locator('text=/error/i'))).toBeVisible()
  })

  // ─── Word Counter ───

  test('word counter handles empty text', async ({ page }) => {
    await page.goto('/en/tools/word-counter')
    // Empty textarea should show zero counts
    await expect(page.locator('textarea').first()).toBeVisible()
  })

  test('word counter handles very long text', async ({ page }) => {
    await page.goto('/en/tools/word-counter')
    const longText = 'word '.repeat(1000)
    await page.locator('textarea').first().fill(longText)
    // Should not crash
    await expect(page.locator('textarea').first()).toHaveValue(longText)
  })

  // ─── Case Converter ───

  test('case converter handles empty input', async ({ page }) => {
    await page.goto('/en/tools/case-converter')
    await page.locator('button:has-text("UPPERCASE")').click()
    const output = page.locator('textarea[readonly]')
    await expect(output).not.toBeVisible()
  })

  test('case converter handles mixed case and numbers', async ({ page }) => {
    await page.goto('/en/tools/case-converter')
    await page.locator('textarea').first().fill('Hello World 123 !@#')
    await page.locator('button:has-text("UPPERCASE")').click()
    const output = page.locator('textarea[readonly]')
    await expect(output).toContainText('HELLO WORLD 123 !@#')
  })

  // ─── HTML Preview ───

  test('html preview handles empty input', async ({ page }) => {
    await page.goto('/en/tools/html-preview')
    await page.locator('textarea').first().fill('')
    const frame = page.frameLocator('iframe')
    await expect(frame.locator('body')).toBeAttached()
  })

  test('html preview CSS does not leak to main page', async ({ page }) => {
    await page.goto('/en/tools/html-preview')
    await page.locator('textarea').first().fill('<style>body { background: red !important; }</style><p>test</p>')
    const frame = page.frameLocator('iframe')
    await expect(frame.locator('p')).toContainText('test')
    // Main page body should not be red
    const bodyBg = await page.locator('body').evaluate(el => window.getComputedStyle(el).backgroundColor)
    expect(bodyBg).not.toBe('rgb(255, 0, 0)')
  })

  test('html preview renders Chinese characters', async ({ page }) => {
    await page.goto('/en/tools/html-preview')
    await page.locator('textarea').first().fill('<p>你好世界</p>')
    const frame = page.frameLocator('iframe')
    await expect(frame.locator('p')).toContainText('你好世界')
  })
})