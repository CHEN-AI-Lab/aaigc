# 决策记录

本项目的重要技术决策与实测数据。凡涉及"多端"的取舍，一律记在这里，不要只留在对话里。

---

## 小程序端技术选型

### 选型：Taro v4 + React（放弃原生 + `shared/js/shared.mjs`）

**决策日期**：2026-09-20

**结论**：小程序端用 **Taro v4 + React**，直接编译 `shared/` 的 TS 源码，不再单独打包 `shared.mjs`。

**理由**：
- 项目后期还会持续新增工具，端上要长期复用 `shared/tools/` 的纯函数实现
- 原生小程序没有 TS 编译器，`shared.mjs` 是为此存在的；选了 Taro 之后这个前提消失，留着它等于维护两份逻辑、两套构建、一个漂移面

**连带处置**：
- `T01.3`（`shared/js/shared.mjs` 及配套构建/校验）**取消**
- 保留 `T01.2`（`build-shared-messages.mjs`）—— 小程序端仍需按 namespace 切片 messages
- 保留 `T01.5` 纯度门禁 —— 它是"工具逻辑不碰 DOM/Node API"的唯一自动化防线，Taro 下更重要（编译期不报错、运行期才炸）

---

### 实证：Taro 能编译 pnpm workspace 里 `shared/` 的 TS 源码

**结论日期**：2026-09-20 ｜ **结论**：**通过**，无需 `node-linker=hoisted`

**生效配置**（`apps/weapp/config/index.ts`）：

```ts
compiler: { type: 'webpack5', prebundle: { enable: false } },
mini: { compile: { include: [SHARED_DIR] } },
h5:   { compile: { include: [SHARED_DIR] } },   // mini 与 h5 是两套 module，必须各写一次
```

**易错点**：
- 默认 `rule.include` 只含 `[sourceDir, taro 自身 node_modules]`，**不含 `shared/`**，不配 `compile.include` 直接 `ModuleParseError`（卡在 `import type`）
- 数组元素必须是合法 webpack condition（绝对路径 / RegExp / 函数），**不能写 `{ path, type: 'folder' }`**，会被 Taro 配置校验拒绝

**验证证据**（不看"构建成功"，看产物内容）：
- `dist/pages/index/index.js` 命中 `tools.invalidBase64`（shared 的 i18n key）、`invalidBase64`（错误码）、`SPIKE_SHARED_MARKER_9f3a`（页面标记）
- 产物中**无其它工具错误码** → barrel 未被整包拖入
- **无 `require('shared...')` 残留** → 是内联，不是运行时才炸的外部引用

---

## 主包体积（2MB 上限）

### 实测数据

| 阶段 | 总大小 | 占 2MB | 备注 |
|---|---|---|---|
| T05.2.2 spike（**仅 base64 一个工具**） | 376 KB | 17.9% | Taro runtime 132 KB 为固定成本 |
| 四页面 + messages 切片接入后 | **674.6 KB** | **32.9%** | 见下方拆解 |

**第二次实测（674.6 KB）拆解**：

| 文件 | 大小 | 性质 |
|---|---|---|
| `common.js` | 351.5 KB | **messages 切片**（4 语言 × 6 namespace）—— 当前最大项 |
| `taro.js` | 129.9 KB | Taro runtime（固定成本） |
| `app.js` | 94.7 KB | 应用壳 |
| `base.wxml` | 59.8 KB | Taro 基础模板 |
| `vendors.js` | 18.5 KB | 公共依赖 |
| 三个页面合计 | ~10 KB | 单页 3–5 KB |

⚠️ **结论修正（重要）**：此前按"单工具约 4 KB"外推全量仅增 150–200 KB，实测表明**真正的体积大头不是工具代码，而是 messages 切片**（351 KB，占比过半）。工具代码本身只占约 10 KB。
后续若要控体积，优先级应为 **① messages 按 toolId 切片 / 减少预置 namespace ② 分包**，而不是压缩工具实现。

> 每接入一批工具或 namespace 必须重新测量，并更新本表。

### 自动化门禁

`scripts/check-weapp-bundle-size.py`
- **告警 1.5 MB / 失败 1.8 MB**（2MB 上限留 200KB 反应边距）
- **下限 sanity check**：`dist` 缺失或 < 100 KB 时报红，并明确打印「本检查实际上什么都没量到」
  —— 防止出现「没量到却报绿」的假绿（本项目已因假绿门禁栽过三次）
- 已接进 `check.sh`，在 `pnpm --filter weapp build` 之后执行
- `--record` 可追加记录到本文件

### 缓解手段（余量不足时按顺序启用）

1. messages 按 `toolId` 切片
2. tabBar 页瘦身
3. 工具全量分包 + `preloadRule`

### 口径待修正

当前脚本统计 **dist 整体**。接入 subpackages 后，主包只等于根层级 + `pages/`，**子包目录必须排除**，否则会把子包体积算进主包导致误报超限。分包落地时须回来改脚本。

---

## 小程序端 env 注入

### ⚠️ `defineConstants` 不能作为唯一手段

**实测**：`defineConstants` 是**字面量文本替换**，只对源码里静态写死的 `process.env.XXX` 生效。
`shared/constants/endpoints.ts` 用的是 `process.env[name]`（**动态下标**），**替换不到**。

后果：小程序无 `process` 对象，且 SK-8 禁止非空 fallback → 拿到 `undefined`，**不报错、不兜底、静默失效**。

### 采用方案

**weapp 专属 constants 模块 + alias 覆盖**，**不改 `shared/` 的 `readEnv` 写法**。
理由：`readEnv` 的动态下标是"禁硬编码 + 禁非空 fallback"统一约束的一部分，为小程序开例外会让约束出现裂缝。

### 安全约束

小程序产物是公开的，**禁止注入任何密钥**。

---

## i18n 硬编码

### 规则

**含中日韩字符、且不在注释里的字符串字面量**视为违规，需下沉到 `shared/messages` 对应命名空间（4 语种齐备）。

**明确豁免**：
- 代码注释 —— 注释给维护者看，本项目文档一律中文，翻成英文反而损失信息
- `.i18n-hardcode-allowlist.json` 中登记的文件 —— 每条必须写明原因与跟进动作，**无理由豁免会被移除**

**当前豁免清单**：`apps/desktop/vite.config.ts`（构建期诊断）、`apps/weapp/.../index.tsx`（spike 演示输入）、`apps/web/.../about|account|auth.ts|ip-lookup`（既有欠账，跟进 T02.4）、`apps/web/.../Calculator.tsx`（文化概念映射，需产品先定策略）

**不扫描 Rust**：桌面端原生菜单/托盘文案在 `src-tauri/src/locale.rs` 自持一份四语文案（菜单在页面加载前建好，无站点 i18n 运行时可用），语言集合一致性由 `scripts/check-desktop-locale-sync.py` 单独把关。
⚠️ 本机无 Rust 工具链，`locale.rs` **从未编译验证**。让 Rust 侧也做到单一真源的正解是 `build.rs` 构建期生成 `locales.rs` —— **该方案尚未实现**。
