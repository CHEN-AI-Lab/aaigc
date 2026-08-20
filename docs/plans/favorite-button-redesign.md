# 收藏按钮改版（SVG 图标）+ 产品页支持 + 删除点赞

> 状态：🔄 进行中
> 创建：2026-08-07
> 前置条件：Phase 7 收藏/点赞（已完成）

## 改动

1. **删除点赞功能** — 工具站不需要点赞，调研确认无用
2. **收藏按钮 emoji→SVG 图标** — 对标 GitHub 星形风格
3. **产品详情页加收藏按钮** — 同时支持工具和产品

## 文件清单

### 删除文件

| # | 文件 | 说明 | 状态 |
|---|------|------|------|
| 1 | `apps/web/src/components/LikeButton.tsx` | 删除点赞组件 | [x] ✅ |
| 2 | `apps/web/src/app/api/likes/route.ts` | 删除点赞 API | [x] ✅ |

### 修改文件

| # | 文件 | 改什么 | 状态 |
|---|------|--------|------|
| 3 | `prisma/schema.prisma` | 删除 Like 模型 | [x] ✅ |
| 4 | `prisma/migrations/` | 删除 Like 表迁移 | [x] ✅ |
| 5 | `apps/web/src/components/ToolPageClient.tsx` | 删除 LikeButton 引用，FavoriteButton 传 type | [x] ✅ |
| 6 | `apps/web/src/components/FavoriteButton.tsx` | emoji→SVG 星形 + type prop | [x] ✅ |
| 7 | `apps/web/src/app/api/favorites/route.ts` | 接收 type 字段 | [x] ✅ |
| 8 | `apps/web/src/app/[locale]/products/[slug]/page.tsx` | 加收藏按钮 | [x] ✅ |
| 9 | `apps/web/src/app/[locale]/account/AccountClient.tsx` | 收藏列表支持 type 区分 | [x] ✅ |
| 10 | `shared/types/index.ts` | FavoriteItem 加 type | [x] ✅ |
| 11 | `tests/unit/favorites-likes.test.ts` | 删除点赞测试，更新收藏测试 | [x] ✅ |
| 12 | `docs/project-plan.md` | 更新 Phase 7 状态 | [~] 待提交 |

## SVG 图标设计

### 收藏（星形）
- 未操作：☆ 空心星，`text-text-secondary/50` 灰色
- 已操作：★ 实心星，`text-accent` 橙色 + `bg-accent/10` 背景
- 参考 GitHub 的 star 按钮风格

## 执行顺序

1. 删除 LikeButton 组件 + 点赞 API
2. Prisma 删除 Like 模型 → migrate
3. shared/types 更新
4. API favorites 接收 type
5. FavoriteButton 改 SVG + type
6. ToolPageClient 清理
7. 产品详情页加收藏
8. 测试更新
9. 验证 + 提交 + 推送