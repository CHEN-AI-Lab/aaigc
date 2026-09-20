// ─────────────────────────────────────────────────────────────────────────────
// Metro 配置 —— pnpm workspace 单仓模式
//
// 关键点（缺一不可）：
//   · watchFolders 必须包含仓库根，否则 `shared/**` 的改动不会触发重新打包，
//     且 Metro 会拒绝解析仓库根之外的模块；
//   · nodeModulesPaths 同时给出 app 与根的 node_modules —— pnpm 的隔离布局下
//     依赖可能挂在任一层的 `.pnpm` 虚拟目录里。
//
// 关于 disableHierarchicalLookup：**这里刻意不关**。
// Expo 的 monorepo 文档建议关掉它（针对 npm/yarn 的 hoisted 布局），
// 但在 pnpm 下每个包的依赖只软链在**自己**的 node_modules 里
// （例如 expo-router 的 entry 会 `import '@expo/metro-runtime'`，该包位于
//  node_modules/.pnpm/expo-router@…/node_modules/@expo/metro-runtime）。
// 关掉层级查找后 Metro 不再回看导入方自己的 node_modules，打包会直接失败：
//   Unable to resolve module @expo/metro-runtime from …/expo-router/entry-classic.js
// 实测（expo export --platform android）：关掉 = 失败，打开 = 成功。
//
// 不在这里放任何地址 / 端口。
// ─────────────────────────────────────────────────────────────────────────────

const path = require('node:path')
const { getDefaultConfig } = require('expo/metro-config')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '..', '..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

module.exports = config
