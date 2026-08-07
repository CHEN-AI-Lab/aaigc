# Phase 7: 收藏 + 点赞 — 实现计划

## 任务清单

### 1. Prisma Schema 加模型
- [x] 添加 Favorite 模型（user_id, tool_id, createdAt, UNIQUE(user_id, tool_id)）
- [x] 添加 Like 模型（user_id, tool_id, createdAt, UNIQUE(user_id, tool_id)）
- [x] 执行 prisma migrate

### 2. 类型定义
- [x] shared/types/index.ts 加 FavoriteItem, LikeStatus

### 3. API 路由
- [x] POST /api/favorites — 切换收藏（已收藏→取消，未收藏→添加）
- [x] GET /api/favorites — 获取当前用户收藏列表
- [x] POST /api/likes — 切换点赞

### 4. 翻译文件
- [x] shared/messages/*.json 加 favorite/favorited/like/liked/myFavorites/noFavorites 等 key

### 5. 前端组件
- [x] FavoriteButton.tsx — ❤️ 按钮，登录后显示，点击切换
- [x] LikeButton.tsx — 👍 按钮 + 点赞数，登录后显示，点击切换
- [x] ToolPageClient.tsx 集成收藏/点赞按钮
- [x] account page 加"我的收藏"区块

### 6. 测试
- [x] tests/unit/favorites-likes.test.ts

### 7. 文档同步
- [ ] 更新 docs/project-plan.md Phase 7 状态