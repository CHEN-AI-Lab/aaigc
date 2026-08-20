# 项目问题修复规划

> 状态：🔄 计划中
> 创建：2026-08-07

## 问题清单

### 🔴 高优先级

#### #3 忘记密码功能缺失
- 登录页 "忘记密码？" 目前是 `<span>` 无功能
- 需要：点击后进入密码重置模式（输入邮箱→验证码→新密码）
- 参考 skill `nextauth-password-auth` 的 Setup Mode 模式
- 涉及：LoginClient 改造 + API 复用（已有 send-verification/verify-email）

#### #4 密码登录无次数限制
- 目前密码登录可以无限尝试，暴力破解风险
- 需要：登录失败 N 次后临时锁定（temporary lockout）
- 方案：用内存 Map 记录失败次数，5 次失败后锁定 15 分钟
- 涉及：auth.ts 的 Credentials provider

### 🟡 中优先级

#### #5 邮箱验证码防刷
- 后端已有 rateLimited 检查（send-verification/route.ts）
- 需要确认前端的防刷是否有效（发送按钮禁用 + 60s 倒计时已有）
- 实际风险可控，可暂不处理

#### #6 CI 跑 E2E 测试
- 目前 CI 只跑单元测试，没跑 E2E
- 需要：在 CI 中启动 dev server，跑 Playwright E2E
- 涉及：.github/workflows/ci.yml

#### #7 工具测试覆盖
- 38 个工具只有 3 个有测试（Timer、PdfTool、Calculator）
- 需要：给关键工具加测试
- 优先：JsonFormatter、Base64Codec、TimestampConverter、WordCounter
- 涉及：tests/unit/components/

#### #8 E2E dev server 自动启动
- 目前跑 E2E 前需要手动 pnpm dev
- 需要：在 playwright.config.ts 中配置 webServer 自动启动
- 涉及：playwright.config.ts

## 执行顺序

1. #3 忘记密码功能（最高，用户直接可见）
2. #4 密码登录次数限制（安全）
3. #7 工具测试覆盖（质量）
4. #6 + #8 CI E2E 测试（质量）
5. #5 邮箱验证码防刷（可选，确认即可）

## 文件清单

| # | 任务 | 文件 | 状态 |
|---|------|------|------|
| 3a | 登录页加密码重置模式 | LoginClient.tsx | [x] ✅ 已完成 |
| 3b | 复用 set-password API（新建） | api/auth/set-password/route.ts | [x] ✅ 已完成 |
| 3c | 翻译 key 补充 | shared/messages/*.json | [x] ✅ 已完成 |
| 4a | 登录次数限制逻辑 | auth.ts | [x] ✅ 已完成 |
| 7a | 工具测试（JsonFormatter 等） | tests/unit/components/ | [x] ✅ 已完成 |
| 6a | CI 加 E2E | .github/workflows/ci.yml | [x] ✅ 已完成 |
| 8a | E2E webServer 自动启动 | playwright.config.ts | [x] ✅ 已完成 |