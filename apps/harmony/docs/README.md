# AAIGC HarmonyOS NEXT App

AAIGC 的鸿蒙 App 端（HarmonyOS NEXT API 12+，**ArkTS + ArkUI**，**与 React Native Expo 不通用**）。

## 功能

完整的 AAIGC 展示壳 App，包含：

- **4 个 Tab 导航**（Home / Tools / Products / About）
- **38 个在线工具**（按分类浏览，全部来自 `shared/data/tools.ts`）
- **11 个产品矩阵**（来自 `shared/data/products.ts`，带 Live / Coming Soon 状态标签）
- **4 语言 i18n 切换**（en / zh-CN / zh-TW / ja，持久化到 PersistentStorage）
- **工具详情页**（点击 ToolCard 跳转，含元数据 + 收藏 + 跳 web）
- **favorites 收藏**（用 `@ohos.data.preferences` 持久化到设备本地）
- **OpenLink 跳 web 工具页**（用 `toolUrl(locale, toolId)` 拼 URL）
- **主题色系统**（Mistral 暖色调，与 web/iOS/App 完全一致）
- **hypium 单元测试**（11 个用例覆盖 tools 数据 + i18n bundle）

## 目录结构

```
apps/harmony/
├── build-profile.json5                  // hvigor 根配置（API 12+, runtimeOS HarmonyOS）
├── package.json                         // ohpm 依赖声明 + shared:workspace:*
├── docs/README.md                       // 本文件
├── scripts/
│   └── build-hvigor-hook.mjs            // 构建期注入 i18n bundle 到 .hap
├── entry/
│   ├── build-profile.json5              // 模块级 hvigor
│   └── src/main/
│       ├── module.json5                 // 应用清单（bundleName/abilities/pages）
│       ├── tsconfig.json                // TypeScript 配置
│       ├── resources/                   // 字符串/颜色/路由资源
│       │   ├── base/element/{string,color}.json
│       │   ├── base/profile/main_pages.json
│       │   └── en_US/element/string.json
│       └── ets/
│           ├── MainAbility/MyAbility.ets  // UIAbility 入口
│           ├── pages/
│           │   ├── Index.ets              // 首页（4 Tab）
│           │   └── ToolDetail.ets         // 工具详情页（router 跳转）
│           ├── components/                // 复用组件
│           │   ├── LanguageSwitcher.ets   // 语言切换器（4 语言）
│           │   ├── ToolCard.ets           // 工具卡片（带 onToolTap 事件）
│           │   ├── ProductCard.ets        // 产品卡片
│           │   ├── CategoryHeader.ets     // 分类标题
│           │   ├── web-url.ets            // web URL 拼装（PUBLIC_SITE_ORIGIN）
│           │   └── theme/colors.ets       // 主题色常量
│           ├── i18n/messages.ets          // t() / tPath() 翻译函数
│           ├── store/
│           │   ├── locale.ets             // AppStorage + PersistentStorage 全局 Locale
│           │   └── favorites.ets          // @ohos.data.preferences 持久化收藏
│           ├── data/index.ets             // 转发 shared/data 导入
│           └── generated/                 // 构建期生成（**不**手改）
│               └── messages.generated.ets // 4 语言 messages 内联字面量
│       └── ohosTest/ets/                  // hypium 测试套件（macOS/Windows 真机跑）
│           ├── TestAbility.ets            // 测试入口
│           └── tools.test.ets             // 11 个单元测试
```

## shared/ 复用路径

```
shared/
├── types/                          // Locale / ToolCategory / ProductStatus 等
│   └── → apps/harmony/entry/src/main/ets/data/index.ets
├── constants/locales.ts            // locales / defaultLocale / localeNames
│   └── → apps/harmony/entry/src/main/ets/{i18n,store}/locale.ets + data/index.ets
├── data/tools.ts                   // 38 个工具 + 10 个分类
│   └── → apps/harmony/entry/src/main/ets/data/index.ets
├── data/products.ts                // 11 个产品
│   └── → apps/harmony/entry/src/main/ets/data/index.ets
└── messages/{en,zh-CN,zh-TW,ja}.json  // 4 语言翻译文件
    └── → 通过 apps/harmony/scripts/build-hvigor-hook.mjs 注入到 messages.generated.ets
```

## 构建流程（HarmonyOS 开发机）

```bash
# 1. 准备 i18n bundle（生成 messages.generated.ets）
cd apps/harmony
node scripts/build-hvigor-hook.mjs

# 2. 安装依赖
ohpm install

# 3. 构建
./node_modules/.bin/hvigorw assembleHap --mode module -p product=default
```

或者直接在 DevEco Studio 5.0+ 中打开 `apps/harmony/`，按 IDE 提示 build/run。

## 关键约束

| 约束 | 原因 |
|---|---|
| ❌ 不要 import `@react-native-oh` / `@react-native/community` | HarmonyOS NEXT（API 12+）剔除 AOSP，**不**兼容 React Native |
| ❌ 不要 import `react` / `react-dom` | ArkUI 用 `@Component`，**不**是 React |
| ❌ 不要硬编码 `process.env.*` | ArkTS 不能用 Node 的 `process`，用 `hvigor` 注入或 `AppStorage` |
| ❌ 不要硬编码中英文案 | 必须走 `t(ns, key, locale)` 从 shared/messages 拿 |
| ❌ 不要在 `apps/harmony/` 下建 `constants/utils/validators/messages/lib/` | 这些目录**只能**放在 `shared/` |
| ✅ shared/* 可以直接 import | 纯 TS，无 DOM 依赖的部分 100% 复用 |
| ✅ shared/messages/* 通过构建期注入 | hvigor hook 把 JSON 内联为 ArkTS 字面量 |
| ✅ 端专用 hook 放 `apps/harmony/entry/src/main/ets/store/` 或 `components/` | 不污染 shared/hooks/（G-2 规则） |

## 当前进度

- ✅ 鸿蒙 App 端骨架（已实装）
- ✅ 4 Tab 导航（Home/Tools/Products/About）
- ✅ 38 工具 + 11 产品展示（共享 shared/data）
- ✅ 4 语言 i18n（共享 shared/messages）
- ✅ 语言切换器（持久化到 AppStorage）
- ✅ 主题色系统（与 web 对齐）
- ⚠️ 真实运行时构建未验证（需 DevEco Studio 5.0+）
- ⚠️ 真机端到端测试未跑（需 HarmonyOS 设备）

## 参考文档

- profile 层：`~/.hermes/profiles/vibe/skills/custom/strict-project-scaffold/references/harmony-planning.md`
- 官方文档：https://developer.huawei.com/consumer/cn/harmonyos/
- DevEco Studio 下载：https://developer.huawei.com/consumer/cn/deveco-studio/
