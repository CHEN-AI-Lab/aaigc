// ─────────────────────────────────────────────────────────────────────────────
// Metro 配置 —— pnpm workspace 单仓模式
//
// 关键点（缺一不可）：
//   · watchFolders 必须包含仓库根，否则 `shared/**` 的改动不会触发重新打包，
//     且 Metro 会拒绝解析仓库根之外的模块；
//   · nodeModulesPaths 同时给出 app 与根的 node_modules —— pnpm 的隔离布局下
//     依赖可能挂在任一层的 `.pnpm` 虚拟目录里；
//   · 关掉层级查找，避免 Metro 顺着目录树爬到仓库根之外拿到另一份 react。
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
config.resolver.disableHierarchicalLookup = true

module.exports = config
