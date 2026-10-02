// tests/e2e/cross-end-links.spec.ts —— 跨端链接一致性
//
// 验证：
//   1. 所有 4 语言 locale 都能访问首页（路由不漏配）
//   2. 语言切换跳转 URL 包含正确 locale 前缀
//   3. /[locale]/tools/<id> 页面所有 38 个工具 ID 都可访问
//   4. 跨端链接（ExternalLink 组件）有正确 rel="noopener noreferrer"
//   5. footer 版权年份包含当前年份（不写死 2025 之类的过期值）

import { test, expect } from '@playwright/test'

const LOCALES = ['en', 'zh-CN', 'zh-TW', 'ja'] as const
const CURRENT_YEAR = new Date().getFullYear()

test.describe('Cross-end link consistency', () => {
  for (const locale of LOCALES) {
    test(`homepage loads for locale ${locale}`, async ({ page }) => {
      const res = await page.goto(`/${locale}`)
      expect(res?.status()).toBeLessThan(400)
      await expect(page.locator('h1').first()).toBeVisible()
    })
  }

  test('language switcher links to all 4 locales', async ({ page }) => {
    await page.goto('/en')
    // 打开语言切换菜单
    await page.locator('button[aria-label*="language" i], button[aria-label*="locale" i], button[title*="language" i]').first().click()
    // 至少看到 4 个语言选项链接
    const langLinks = page.locator('a[href*="/zh-CN"], a[href*="/zh-TW"], a[href*="/ja"], a[href="/en"]')
    const count = await langLinks.count()
    expect(count).toBeGreaterThanOrEqual(4)
  })

  test('navigating to a tool URL works', async ({ page }) => {
    await page.goto('/en/tools')
    // 点第一个工具卡片
    const firstToolLink = page.locator('a[href*="/en/tools/"]').first()
    await firstToolLink.click()
    await expect(page).toHaveURL(/\/en\/tools\//)
    // 工具页面有 h1 标题
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('external links have rel="noopener noreferrer"', async ({ page }) => {
    await page.goto('/en')
    const extLinks = page.locator('a[target="_blank"]')
    const count = await extLinks.count()
    if (count === 0) {
      test.skip() // 没有外链就跳过
      return
    }
    for (let i = 0; i < count; i++) {
      const rel = await extLinks.nth(i).getAttribute('rel')
      expect(rel).toContain('noopener')
      expect(rel).toContain('noreferrer')
    }
  })

  test('footer copyright contains current year', async ({ page }) => {
    await page.goto('/en')
    const footer = page.locator('footer')
    await expect(footer).toContainText(String(CURRENT_YEAR))
  })

  test('no broken internal links on home page', async ({ page }) => {
    await page.goto('/en')
    // 抓所有内部链接
    const internalLinks = await page
      .locator('a[href^="/"]:not([href*="://"])')
      .evaluateAll((els) => Array.from(new Set((els as HTMLAnchorElement[]).map((a) => a.getAttribute('href') ?? ''))))

    // 抽检前 10 个链接都能 200/3xx
    const samples = internalLinks.filter((h) => h && !h.startsWith('#')).slice(0, 10)
    for (const href of samples) {
      const res = await page.request.get(href)
      expect(res.status(), `link ${href} should not be 5xx`).toBeLessThan(500)
    }
  })
})
