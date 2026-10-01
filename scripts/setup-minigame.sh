#!/usr/bin/env bash
# scripts/setup-minigame.sh —— 在当前项目内建小游戏端骨架
#
# 用法（项目根）：
#   pnpm run setup:minigame
#
# 作用：
#   · 在 apps/minigame/ 写入最小骨架（如果目录不存在）
#   · 提示后续步骤（必须用 Cocos Creator 4.x 打开）
#
# 此脚本是 strict-project-scaffold skill 的项目级落地。
# 注意：场景文件 .scene / 预制体 .prefab 必须用 Cocos Creator IDE 编辑，**不能**手写。

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="$ROOT/apps/minigame"

if [ -d "$TARGET" ]; then
  echo "❌ apps/minigame/ 已存在。删除或重命名后再试。"
  exit 1
fi

echo "🔍 检查 Cocos Creator 4.x 是否安装..."

if [ ! -d "/Applications/Cocos/Creator/4.x" ] && [ ! -d "/Applications/Cocos Creator.app" ]; then
  echo "⚠️ Cocos Creator 没检测到（macOS 检查 /Applications/Cocos/Creator/）。"
  echo "   下载：https://www.cocos.com/creator"
  echo "   注意：必须用 Cocos Creator 4.x（不支持 3.x 及以下）"
fi

echo "📁 在 $TARGET 建骨架..."
mkdir -p "$TARGET/assets/scripts"
mkdir -p "$TARGET/assets/scripts/i18n"
mkdir -p "$TARGET/assets/scripts/generated"
mkdir -p "$TARGET/assets/scripts/hooks"
mkdir -p "$TARGET/assets/resources"
mkdir -p "$TARGET/assets/scene"
mkdir -p "$TARGET/assets/prefab"
mkdir -p "$TARGET/settings"
mkdir -p "$TARGET/scripts"
mkdir -p "$TARGET/docs"

cat > "$TARGET/package.json" <<'EOF'
{
  "name": "minigame",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "node scripts/build-all-platforms.mjs",
    "build:wechatgame": "node scripts/build-one-platform.mjs --platform wechatgame",
    "build:bytedanceminigame": "node scripts/build-one-platform.mjs --platform bytedanceminigame",
    "build:huawei": "node scripts/build-one-platform.mjs --platform huawei",
    "build:xiaomi": "node scripts/build-one-platform.mjs --platform xiaomi",
    "build:web-mobile": "node scripts/build-one-platform.mjs --platform web-mobile",
    "typecheck": "tsc --noEmit -p tsconfig.json"
  },
  "dependencies": {
    "shared": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.4.5"
  }
}
EOF

cat > "$TARGET/tsconfig.json" <<'EOF'
{
  "compilerOptions": {
    "target": "es2017", "module": "esnext", "moduleResolution": "node",
    "strict": true, "esModuleInterop": true, "skipLibCheck": true,
    "experimentalDecorators": true, "noEmit": true, "lib": ["es2017", "dom"]
  },
  "include": ["assets/scripts/**/*.ts"]
}
EOF

cat > "$TARGET/assets/scripts/i18n.ts" <<'EOF'
// 占位：i18n 接口契约。真实实现由 scripts/build-cocos-bundle.mjs 注入 __AAIGC_MINIGAME_MESSAGES__。
export function t(locale: string, namespace: string, key: string): string {
  return `${locale}.${namespace}.${key}`
}
EOF

echo "✅ 小游戏端骨架已写入 $TARGET"
echo ""
echo "📖 后续步骤："
echo "   1. 安装 Cocos Creator 4.x（macOS / Windows）"
echo "   2. Cocos Dashboard → 打开 $TARGET 目录"
echo "   3. Cocos 编辑器 → 项目 → 构建发布 → 选目标平台"
echo "   4. 填 AppID/签名等 → 构建 → 对应 IDE 上传"
echo ""
echo "📚 完整规划参考："
echo "   ~/.hermes/profiles/vibe/skills/custom/strict-project-scaffold/references/minigame-planning.md"