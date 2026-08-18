# 账号页功能补全

> 状态：✅ 已完成
> 创建：2026-08-18
> 完成：2026-08-18

---

## 一、新增功能

| # | 功能 | 状态 |
|---|------|------|
| 1 | 注册时间显示 | ✅ |
| 2 | 邮箱验证状态 | ✅ |
| 3 | OAuth 绑定信息 | ✅ |
| 4 | 最近收藏快捷区 | ✅ |
| 5 | 修改名字弹窗 | ✅ |
| 6 | 修改密码弹窗 | ✅ |

## 二、文件变更

### 新建文件
- `apps/web/src/app/api/user/profile/route.ts` — GET 用户资料（含 OAuth 账号）
- `apps/web/src/app/api/user/update/route.ts` — POST 修改名字
- `docs/plans/account-page-upgrade.md` — 计划文件

### 修改文件
- `apps/web/src/app/[locale]/account/AccountClient.tsx` — 大改，加入全部 6 项功能
- `shared/messages/{en,zh-CN,zh-TW,ja}.json` — 新增 12 个翻译 key

## 三、验证结果
- ✅ typecheck 通过
- ✅ 172 tests 全部通过
- ✅ lint 0 errors 0 warnings
- ✅ check-translations 1225 keys 一致