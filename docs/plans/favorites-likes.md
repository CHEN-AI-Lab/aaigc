# Phase 7: 收藏 + 点赞

> 状态：✅ 已完成
> 创建：2026-08-07
> 前置条件：Phase 6 用户系统（已上线）

---

## 一、文件清单

### 新建文件

| # | 文件 | 说明 | 状态 |
|---|------|------|------|
| 1 | `prisma/migrations/20260807105608_add_favorites_likes/migration.sql` | Favorite + Like 建表 | [x] ✅ |
| 2 | `apps/web/src/app/api/favorites/route.ts` | 收藏切换 + 查询 API | [x] ✅ |
| 3 | `apps/web/src/app/api/likes/route.ts` | 点赞切换 API | [x] ✅ |
| 4 | `apps/web/src/components/FavoriteButton.tsx` | 收藏按钮 | [x] ✅ |
| 5 | `apps/web/src/components/LikeButton.tsx` | 点赞按钮 | [x] ✅ |
| 6 | `docs/plans/favorites-likes.md` | 本计划文件 | [x] ✅ |
| 7 | `tests/unit/favorites-likes.test.ts` | 单元测试 | [x] ✅ |

### 修改文件

| # | 文件 | 改什么 | 状态 |
|---|------|--------|------|
| 8 | `prisma/schema.prisma` | 新增 Favorite + Like 模型 | [x] ✅ |
| 9 | `shared/types/index.ts` | 加 FavoriteItem, LikeStatus | [x] ✅ |
| 10 | `shared/messages/{en,zh-CN,zh-TW,ja}.json` | 加收藏/点赞翻译 key | [x] ✅ |
| 11 | `apps/web/src/components/ToolPageClient.tsx` | 标题下加收藏/点赞按钮 | [x] ✅ |
| 12 | `apps/web/src/app/[locale]/account/AccountClient.tsx` | 加"我的收藏"区块 | [x] ✅ |
| 13 | `docs/project-plan.md` | Phase 7 标记完成 | [x] ✅ |

---

## 二、数据模型

```prisma
model Favorite {
  id        String   @id @default(cuid())
  userId    String
  toolId    String
  createdAt DateTime @default(now())
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, toolId])
}

model Like {
  id        String   @id @default(cuid())
  userId    String
  toolId    String
  createdAt DateTime @default(now())
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, toolId])
}
```

User 模型加 opposite relation：`favorites Favorite[]`、`likes Like[]`

## 三、API 设计

| 路由 | 方法 | 请求 | 响应 |
|------|------|------|------|
| `/api/favorites` | POST | `{ toolId }` | `{ isFavorited }`（切换） |
| `/api/favorites` | GET | — | `{ favorites: [{id, toolId, createdAt}] }` |
| `/api/likes` | POST | `{ toolId }` | `{ liked, count }`（切换 + 计数） |

未登录返回 401。toolId 缺失返回 400。

## 四、UI 设计

**工具详情页** 标题下方两个按钮：
- ❤️ 收藏（未收藏 🤍 / 已收藏 ❤️ + accent 色）
- 👍 点赞（显示点赞数）
- 未登录点击 → 跳转 /login

**账号页** 用户卡片下方"我的收藏"区块：
- 空态："暂无收藏"
- 列表：工具名（翻译 key）+ 查看链接

## 五、依赖

无新增 npm 包。

## 六、环境变量

无新增。

## 七、翻译 Key

| Key | en | zh-CN |
|-----|----|-------|
| tools.favorite | Favorite | 收藏 |
| tools.favorited | Favorited | 已收藏 |
| tools.like | Like | 点赞 |
| tools.liked | Liked | 已点赞 |
| tools.myFavorites | My Favorites | 我的收藏 |
| tools.noFavorites | No favorites yet | 暂无收藏 |
| tools.favoritesCount | Favorites | 收藏 |
| auth.view | View | 查看 |

## 八、执行顺序

1. ✅ prisma schema 加模型 → migrate
2. ✅ shared/types 加类型
3. ✅ 翻译文件加 key
4. ✅ API 路由（favorites + likes）
5. ✅ FavoriteButton + LikeButton
6. ✅ ToolPageClient 集成
7. ✅ account 页加收藏
8. ✅ 写测试
9. ✅ 更新 project-plan.md
10. ✅ 提交 + 推送