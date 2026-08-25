import { test, expect } from '@playwright/test'

// 认证链路冒烟测试：注册 → 邮箱验证码 → 创建账号
// 前置条件：
//   1) 本地/预览环境设置 ALLOW_DEV_CODE=true（让 send-verification 在响应里返回 devCode，免真实邮件）
//   2) 通过 `pnpm test:e2e` 运行（playwright.config 会自动 build + start）
// 说明：本用例走 /en 路由，使用稳定的英文 placeholder/按钮文案。

test('auth smoke: register with email code creates account', async ({ page }) => {
  const email = `smoke-${Date.now()}@example.com`

  await page.goto('/en/register')

  // 填写邮箱并发送验证码
  await page.getByPlaceholder('name@example.com').fill(email)
  await page.getByRole('button', { name: 'Send verification code' }).click()

  // 开发模式下验证码会回显在页面上（Dev mode: code 123456）
  await expect(page.getByText(/Dev mode: code (\d{6})/)).toBeVisible({ timeout: 10000 })
  const code = (await page.getByText(/Dev mode: code (\d{6})/).textContent())!.match(/(\d{6})/)![1]

  // 填写验证码、昵称、密码
  await page.getByPlaceholder('Enter 6-digit code').fill(code)
  await page.getByPlaceholder('Name').fill('SmokeUser')
  await page.getByPlaceholder('••••••••').first().fill('Password123')
  await page.getByPlaceholder('••••••••').nth(1).fill('Password123')

  // 提交注册
  await page.getByRole('button', { name: 'Register' }).click()

  // 注册成功应跳转登录页或显示成功提示
  await expect(page).toHaveURL(/\/en\/login/, { timeout: 15000 })
})
