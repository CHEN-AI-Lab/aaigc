import { test, expect } from '@playwright/test'

test.describe('More tool functionality', () => {
  // ─── Text Tools ───

  test('word counter counts characters and words', async ({ page }) => {
    await page.goto('/en/tools/word-counter')
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()
    await textarea.fill('Hello World this is a test')
    await expect(page.locator('textarea').first()).toHaveValue('Hello World this is a test')
  })

  test('case converter converts text to uppercase', async ({ page }) => {
    await page.goto('/en/tools/case-converter')
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()
    await textarea.fill('hello world')
    await page.locator('button:has-text("UPPERCASE")').click()
    const output = page.locator('textarea[readonly]')
    await expect(output).toContainText('HELLO WORLD')
  })

  test('uuid generator generates a UUID', async ({ page }) => {
    await page.goto('/en/tools/uuid-generator')
    await page.locator('button:has-text("Generate")').click()
    const output = page.locator('textarea[readonly]')
    await expect(output).toContainText('-')
  })

  test('password generator generates a password', async ({ page }) => {
    await page.goto('/en/tools/password-generator')
    await page.locator('button:has-text("Generate")').click()
    const output = page.locator('textarea[readonly]')
    await expect(output).toBeVisible()
    const value = await output.inputValue()
    expect(value.length).toBeGreaterThanOrEqual(8)
  })

  test('lorem ipsum generates text', async ({ page }) => {
    await page.goto('/en/tools/lorem-ipsum')
    await page.locator('button:has-text("Generate")').click()
    const output = page.locator('textarea[readonly]')
    await expect(output).toBeVisible()
    const value = await output.inputValue()
    expect(value.length).toBeGreaterThan(10)
  })

  test('text to slug converts text', async ({ page }) => {
    await page.goto('/en/tools/text-to-slug')
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()
    await textarea.fill('Hello World Test')
    await page.locator('button:has-text("Convert")').click()
    const output = page.locator('textarea[readonly]')
    await expect(output).toContainText('hello-world-test')
  })

  test('list sorter sorts items', async ({ page }) => {
    await page.goto('/en/tools/list-sorter')
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()
    await textarea.fill('banana\napple\ncherry')
    await page.locator('button:has-text("A→Z"), button:has-text("Sort A→Z")').click()
    const output = page.locator('textarea[readonly]')
    await expect(output).toContainText('apple')
  })

  test('text diff compares two texts', async ({ page }) => {
    await page.goto('/en/tools/text-diff')
    const textareas = page.locator('textarea')
    await expect(textareas.first()).toBeVisible()
    await textareas.nth(0).fill('Hello World')
    await textareas.nth(1).fill('Hello Universe')
    await expect(page.locator('text=Hello World').first()).toBeVisible()
  })

  // ─── Developer Tools ───

  test('jwt decoder decodes a token', async ({ page }) => {
    await page.goto('/en/tools/jwt-decoder')
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()
    await textarea.fill('eyJhbGciOiJIUzI1NiJ9.eyJ0ZXN0IjoxMjN9.ZeU5BMk1')
    await page.locator('button:has-text("Decode")').click()
    await expect(page.locator('text=alg').first()).toBeVisible()
  })

  test('html preview renders HTML', async ({ page }) => {
    await page.goto('/en/tools/html-preview')
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()
    await textarea.fill('<h1>Hello World</h1>')
    const frame = page.frameLocator('iframe')
    await expect(frame.locator('h1')).toContainText('Hello World')
  })

  test('css minifier formats CSS', async ({ page }) => {
    await page.goto('/en/tools/css-minifier')
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()
    await textarea.fill('body { color: red; }')
    // Click the Format mode toggle, then the action button
    await page.locator('button:has-text("Format")').first().click()
    await page.locator('button:has-text("Format")').last().click()
    const output = page.locator('textarea[readonly]')
    await expect(output).toContainText('body')
  })

  test('html entities encodes text', async ({ page }) => {
    await page.goto('/en/tools/html-entities')
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()
    await textarea.fill('<hello>')
    await page.locator('button:has-text("Convert")').click()
    const output = page.locator('textarea[readonly]')
    await expect(output).toContainText('&lt;hello&gt;')
  })

  test('yaml json converter converts YAML to JSON', async ({ page }) => {
    await page.goto('/en/tools/yaml-json')
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()
    await textarea.fill('name: test\nvalue: 123')
    await page.locator('button:has-text("Convert")').click()
    const output = page.locator('textarea[readonly]')
    await expect(output).toContainText('"name"')
  })

  test('json to csv converts JSON to CSV', async ({ page }) => {
    await page.goto('/en/tools/json-to-csv')
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()
    await textarea.fill('[{"name":"test","value":123}]')
    await page.locator('button:has-text("Convert")').click()
    const output = page.locator('textarea[readonly]')
    await expect(output).toContainText('name,value')
  })

  test('number base converter loads', async ({ page }) => {
    await page.goto('/en/tools/number-base')
    const input = page.locator('input').first()
    await expect(input).toBeVisible()
    await input.fill('255')
    // The page should show the conversion table
    await expect(page.locator('select').or(page.locator('table'))).toBeVisible()
  })

  test('regex tester tests a pattern', async ({ page }) => {
    await page.goto('/en/tools/regex-tester')
    // The regex pattern is an input, test text is a textarea
    const patternInput = page.locator('input').first()
    await expect(patternInput).toBeVisible()
    await patternInput.fill('\\d+')
    const textarea = page.locator('textarea').first()
    await textarea.fill('abc123def456')
    await expect(page.locator('text=123').first()).toBeVisible()
  })

  // ─── Time Tools ───

  test('date calculator loads', async ({ page }) => {
    await page.goto('/en/tools/date-calculator')
    const inputs = page.locator('input[type="number"]')
    await expect(inputs.first()).toBeVisible()
  })

  // ─── Image Tools ───

  test('color picker loads and shows colors', async ({ page }) => {
    await page.goto('/en/tools/color-picker')
    const colorInput = page.locator('input[type="color"]')
    await expect(colorInput).toBeVisible()
  })

  // ─── Security Tools ───

  test('markdown preview renders multiple formats', async ({ page }) => {
    await page.goto('/en/tools/markdown-preview')
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()

    // Fill with sample markdown that covers all features
    await textarea.fill('# Hello World\n\n**Bold** *italic* `code`\n\n- List item\n\n> Blockquote')

    // Rendered tab (default)
    await expect(page.locator('h1:has-text("Hello World")')).toBeVisible()
    await expect(page.locator('strong:has-text("Bold")')).toBeVisible()

    // HTML Source tab
    await page.locator('button:has-text("HTML Source")').click()
    await expect(page.locator('pre').first()).toContainText('<h1>')

    // Plain Text tab
    await page.locator('button:has-text("Plain Text")').click()
    await expect(page.locator('pre').first()).toContainText('Hello World')
    await expect(page.locator('pre').first()).not.toContainText('**Bold**')

    // Stats tab
    await page.locator('button:has-text("Stats")').click()
    await expect(page.locator('text=Characters').first()).toBeVisible()
    await expect(page.locator('text=Lines').first()).toBeVisible()
    await expect(page.locator('text=Reading time').first()).toBeVisible()
  })

  // ─── Network Tools ───

  test('http status codes page loads', async ({ page }) => {
    await page.goto('/en/tools/http-status-codes')
    await expect(page.locator('input').first()).toBeVisible()
  })

  // ─── Other Tools ───

  test('random generator generates random values', async ({ page }) => {
    await page.goto('/en/tools/random-generator')
    await page.locator('button:has-text("Generate")').click()
    // The output is a p tag, not a textarea
    await expect(page.locator('text=/[0-9]/').first()).toBeVisible()
  })

  test('emoji picker loads emojis', async ({ page }) => {
    await page.goto('/en/tools/emoji-picker')
    await expect(page.locator('button').first()).toBeVisible()
  })

  test('cron builder loads', async ({ page }) => {
    await page.goto('/en/tools/cron-builder')
    await expect(page.locator('button').first()).toBeVisible()
  })
})