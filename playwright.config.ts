import { defineConfig, devices } from '@playwright/test'

// Only override executable path when env var is explicitly set.
// On CI / default machines, use Playwright's bundled Chromium (installed via `npx playwright install chromium`).
const CHROMIUM_PATH = process.env.PLAYWRIGHT_CHROMIUM_PATH;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    // 允许 localhost 兜底：这里是**测试基础设施**，不是产品运行时路径。
    // E2E 默认就是打本地 dev/preview server，写死兜底不会掩盖任何"生产配置缺失"，
    // 反而让 `pnpm test:e2e` 开箱可用；生产/CI 需要别的地址时仍用环境变量覆盖。
    // （对照：产品运行时路径禁止非空 fallback，见 shared/constants/endpoints.ts）
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm build && pnpm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    cwd: './apps/web',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(CHROMIUM_PATH ? { launchOptions: { executablePath: CHROMIUM_PATH } } : {}),
      },
    },
    // Install additional browsers (npx playwright install firefox webkit) to enable:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    // { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    // { name: 'Mobile Safari', use: { ...devices['iPhone 13'] } },
  ],
})