# 卡片收藏按钮（列表页直接收藏）

> 状态：🔄 进行中
> 创建：2026-08-07
> 前置条件：收藏按钮 SVG 改版（已完成）

## 目标

在**列表页卡片上**直接显示收藏按钮，用户不用点进详情页就能收藏。对标 Futurepedia（每张工具卡片有"Add bookmark"）。

## 改动内容

### 新建组件：`FavoriteStar.tsx`（卡片专用，纯图标）

给列表卡片用的小型收藏按钮：
- 只有 ☆/★ 图标，无文字（卡片空间有限）
- 未收藏：灰色空心星
- 已收藏：accent 橙色实心星
- **关键：阻止冒泡**，因为整张卡片是 `<Link>`，点击收藏不能触发跳转

### 修改文件

| # | 文件 | 改什么 | 状态 |
|---|------|--------|------|
| 1 | 新建 `apps/web/src/components/FavoriteStar.tsx` | 卡片专用收藏图标 | [x] ✅ |
| 2 | `apps/web/src/components/ToolsClient.tsx` | 工具卡片（搜索视图 + 分类视图）加收藏图标 | [x] ✅ |
| 3 | `apps/web/src/components/ProductCard.tsx` | 产品卡片加收藏图标 | [x] ✅ |

### 无需改

- 详情页按钮保留（FavoriteButton 已有）
- API 已支持 type
- 数据库已支持 type

## 技术要点

### 阻止冒泡

卡片是 `<Link>`，收藏按钮点击要 `e.preventDefault()` + `e.stopPropagation()`，否则会跳转到详情页：

```tsx
const handleClick = (e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  // ... toggle favorite
}
```

### 卡片布局

工具卡片右上角放星形图标，用 `absolute` 定位或 `flex justify-between`：

```tsx
<div className="flex items-start justify-between">
  <div className="text-xs font-mono text-accent">{tool.icon}</div>
  <FavoriteStar itemId={tool.id} type="tool" />
</div>
```

## 执行顺序

1. 新建 FavoriteStar 组件
2. ToolsClient 工具卡片加收藏（2 处：搜索视图 + 分类视图）
3. ProductCard 加收藏
4. 验证 + 提交 + 推送