#!/usr/bin/env bash
# scripts/setup-harmony.sh —— 在当前项目内建鸿蒙端骨架
#
# 用法（项目根）：
#   pnpm run setup:harmony
#
# 作用：
#   · 检查 hvigor + ohpm + DevEco Studio 是否安装
#   · 在 apps/harmony/ 写入最小骨架（如果目录不存在）
#   · 提示后续步骤
#
# 此脚本是 strict-project-scaffold skill 的项目级落地。

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="$ROOT/apps/harmony"

if [ -d "$TARGET" ]; then
  echo "❌ apps/harmony/ 已存在。删除或重命名后再试。"
  exit 1
fi

echo "🔍 检查 hvigor + ohpm 是否可用..."

if ! command -v ohpm >/dev/null 2>&1; then
  echo "⚠️ ohpm 没装。ohpm 来自 DevEco Studio。"
  echo "   下载：https://developer.huawei.com/consumer/cn/deveco-studio/"
  echo "   建议：装 DevEco Studio 5.0+（含 ohpm + hvigor）"
fi

if ! command -v hvigorw >/dev/null 2>&1 && [ ! -f "$TARGET/node_modules/.bin/hvigorw" ]; then
  echo "⚠️ hvigorw 也不可用 —— 需要先 ohpm install 才能跑 hvigorw"
fi

echo "📁 在 $TARGET 建骨架..."
mkdir -p "$TARGET/entry/src/main/ets/MainAbility"
mkdir -p "$TARGET/entry/src/main/ets/pages"
mkdir -p "$TARGET/entry/src/main/ets/i18n"
mkdir -p "$TARGET/entry/src/main/ets/generated"
mkdir -p "$TARGET/entry/src/main/ets/hooks"
mkdir -p "$TARGET/entry/src/main/resources/base/element"
mkdir -p "$TARGET/entry/src/main/resources/base/profile"
mkdir -p "$TARGET/entry/src/main/resources/en_US/element"
mkdir -p "$TARGET/entry/src/main/resources/zh_CN/element"
mkdir -p "$TARGET/entry/src/ohosTest/ets"
mkdir -p "$TARGET/entry/src/test"
mkdir -p "$TARGET/hvigor"
mkdir -p "$TARGET/scripts"
mkdir -p "$TARGET/docs"

cat > "$TARGET/package.json" <<'EOF'
{
  "name": "harmony",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "ohpm:install": "ohpm install",
    "build": "hvigorw assembleHap --mode module -p product=default",
    "typecheck": "tsc --noEmit -p entry/src/main/tsconfig.json"
  },
  "dependencies": {
    "shared": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.4.5"
  }
}
EOF

cat > "$TARGET/build-profile.json5" <<'EOF'
{
  "app": {
    "signingConfigs": {},
    "products": [{ "name": "default", "signingConfig": "default", "compatibleSdkVersion": "5.0.0(12)", "runtimeOS": "HarmonyOS" }],
    "buildModeSet": [{ "name": "debug" }, { "name": "release" }]
  },
  "modules": [{ "name": "entry", "srcPath": "./entry", "targets": [{ "name": "default", "applyToProducts": ["default"] }] }]
}
EOF

cat > "$TARGET/entry/build-profile.json5" <<'EOF'
{
  "modelVersion": "5.0.0",
  "description": "HarmonyOS App entry module",
  "dependencies": {},
  "buildOption": { "arkOptions": { "runtimeOnly": { "sources": [], "packages": [] } } }
}
EOF

cat > "$TARGET/entry/src/main/module.json5" <<'EOF'
{
  "app": {
    "bundleName": "online.aaigc.harmony",
    "vendor": "AAIGC",
    "versionCode": 1,
    "versionName": "0.1.0"
  },
  "module": {
    "packageName": "entry",
    "name": "entry",
    "mainAbility": "EntryAbility",
    "srcEntry": "./ets/MainAbility/MyAbility.ets"
  }
}
EOF

cat > "$TARGET/entry/src/main/tsconfig.json" <<'EOF'
{
  "compilerOptions": {
    "target": "es2021", "module": "esnext", "moduleResolution": "node",
    "strict": true, "esModuleInterop": true, "skipLibCheck": true,
    "experimentalDecorators": true, "noEmit": true, "lib": ["es2021"]
  },
  "include": ["src/main/ets/**/*.ets"]
}
EOF

echo "✅ 鸿蒙端骨架已写入 $TARGET"
echo ""
echo "📖 后续步骤："
echo "   1. 在 DevEco Studio 5.0+ 中打开 $TARGET"
echo "   2. cd $TARGET && ohpm install"
echo "   3. ./node_modules/.bin/hvigorw assembleHap"
echo ""
echo "📚 完整规划参考："
echo "   ~/.hermes/profiles/vibe/skills/custom/strict-project-scaffold/references/harmony-planning.md"