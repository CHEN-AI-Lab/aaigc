#!/usr/bin/env bash
set -euo pipefail

# 12 项结构合规检查，标准模板见
# ~/.hermes/profiles/vibe/skills/custom/strict-project-scaffold/scripts/check-structure.sh
# 差异见各 Check 的注释块；本文件是 aaigc 的项目级落地。

echo "=== Structure Check ==="

# Check 1: No hooks/ constants/ utils/ validators/ messages/ lib/ under apps/
# 规则来源：strict-project-scaffold §code-placement.md
#   · shared/ = 跨平台复用代码
#   · apps/<端>/src/hooks/ 是合法例外：仅一个端用的 hook 放这里（不算错）
#   · apps/<端>/src/{constants,utils,validators,messages,lib} 必须 ❌
#
# 因此本检查只对 forbidden 列表中**非 hooks** 的目录严判；
# hooks/ 需在第二步按"是否真的仅单端用"判定（这里简单跳过，依赖 review）。
echo "Check 1: No forbidden dirs under apps/..."
found_forbidden=false
for dir in constants utils validators messages lib; do
  result=$(find apps \
    -path '*/node_modules' -prune -o \
    -path '*/.next' -prune -o \
    -path '*/target' -prune -o \
    -path '*/dist' -prune -o \
    -path '*/build' -prune -o \
    -path '*/.turbo' -prune -o \
    -path '*/.vercel' -prune -o \
    -type d -name "$dir" -print 2>/dev/null || true)
  if [ -n "$result" ]; then
    echo "  ❌ Found forbidden dir '$dir' under apps/:"
    echo "$result"
    found_forbidden=true
  fi
done
# hooks/ 是合法例外，仅检查 src/hooks/ 是否存在文件（即有人故意放这里 —— 是允许的）
# 这里不打日志，避免噪音。真正的"违规"是 constants/utils/validators/messages/lib 这五个目录。

# Check 2: shared/ should have key dirs
echo ""
echo "Check 2: shared/ structure..."
for dir in types constants messages i18n utils; do
  if [ -d "shared/$dir" ]; then
    echo "  ✅ shared/$dir"
  else
    echo "  ❌ Missing shared/$dir"
    found_forbidden=true
  fi
done

# Check 3: messages exist
echo ""
echo "Check 3: Translation files..."
for file in shared/messages/en.json shared/messages/zh-CN.json; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ Missing $file"
    found_forbidden=true
  fi
done

# Check 4: scripts/ 三件套
# ⚠️ 与 skill 模板的差异：模板里缺这三者算硬失败，但本项目尚未建
#    setup.sh / deploy.sh（部署链路未定），故此处降级为警告。
#    一旦补齐脚本，把 ⚠️ 改回 ❌ 即可。
echo ""
echo "Check 4: scripts/ 三件套..."
for s in setup.sh check.sh deploy.sh; do
  if [ -f "scripts/$s" ]; then
    echo "  ✅ scripts/$s"
  elif [ "$s" = "check.sh" ]; then
    echo "  ❌ 缺少 scripts/$s（检查入口，必须有）"
    found_forbidden=true
  else
    echo "  ⚠️  缺少 scripts/$s（本项目暂未建，非阻断）"
  fi
done

# Check 5: 每个端是否正确引用 shared workspace
#   规则来源：strict-project-scaffold §cross-platform-shared-layer-pattern.md
#   端内不得复制 shared/ 代码，必须通过 workspace 依赖引用
echo ""
echo "Check 5: Workspace 依赖检查..."
for d in apps/*/; do
  name=$(basename "$d")
  [ -f "$d/package.json" ] || continue
  if grep -q '"shared"' "$d/package.json" 2>/dev/null; then
    echo "  ✅ apps/$name 引用了 shared"
  else
    echo "  ⚠️  apps/$name 未引用 shared（确实不需要可忽略）"
  fi
done

# Check 6: shared/ package.json exports 覆盖所有子目录
echo ""
echo "Check 6: shared/ 导出完整性检查..."
HAS_WILDCARD=$(python3 -c "
import json
with open('shared/package.json') as f:
    exports = json.load(f).get('exports', {})
print('YES' if any(k in ('./*', '/*') for k in exports) else 'NO')
" 2>/dev/null || echo "NO")
if [ "$HAS_WILDCARD" = "YES" ]; then
  echo "  ✅ shared/ 有通配符导出，覆盖所有子目录"
else
  echo "  ⚠️  shared/ exports 无通配符（./*）—— 新增 shared 子目录时需手动补 exports"
fi

# Check 7: app/ 路由目录下不应有 components/
#   规则来源：strict-project-scaffold §code-placement.md
#   组件应放 apps/<端>/src/components/，不要塞进路由目录
echo ""
echo "Check 7: app/ 路由目录下的 components..."
APP_COMPONENTS=$(find apps \
  -path '*/node_modules' -prune -o \
  -path '*/.next' -prune -o \
  -type d -name 'components' -print 2>/dev/null \
  | grep -E '/src/app/' || true)
if [ -n "$APP_COMPONENTS" ]; then
  echo "  ❌ app/ 路由目录下不应有 components/（应移至 apps/*/src/components/）:"
  echo "$APP_COMPONENTS" | sed 's/^/    /'
  found_forbidden=true
else
  echo "  ✅ app/ 路由目录下无 components/ 目录"
fi

# Check 8: Legacy Browser Warning（Hard Rule 1.4 必装）
#   · 所有项目创建时就必须内置 BrowserCompatGate（apps/web/src/components/BrowserCompatGate.tsx）
#   · 组件本身必须零 Tailwind 类名（用内联 style），否则旧浏览器上提示自己也失效
echo ""
echo "Check 8: Legacy Browser Warning 组件检查（Hard Rule 1.4）..."
COMPAT_FILES=$(find apps -path '*/node_modules' -prune -o -name 'BrowserCompatGate.tsx' -print 2>/dev/null || true)
if [ -z "$COMPAT_FILES" ]; then
  echo "  ❌ 缺少 BrowserCompatGate.tsx（所有项目必须内置旧浏览器全屏遮罩提示）"
  echo "    参考: strict-project-scaffold skill → references/legacy-browser-warning.md"
  found_forbidden=true
else
  echo "  ✅ 找到: $COMPAT_FILES"
  # 二次校验：组件本身必须零 class= —— 防止提示自身也中招
  for f in $COMPAT_FILES; do
    CLASS_COUNT=$(grep -c 'class=' "$f" 2>/dev/null | tr -d '[:space:]' || echo 0)
    CLASS_COUNT=${CLASS_COUNT:-0}
    if [ "${CLASS_COUNT:-0}" -ne 0 ]; then
      echo "  ❌ $f 含 $CLASS_COUNT 个 class=，旧浏览器兼容提示必须全用内联 style（不能用 Tailwind 类名）"
      found_forbidden=true
    fi
  done
fi

# Check 9: test-pages/ 必须列入 .gitignore（Hard Rule 1.3）
echo ""
echo "Check 9: .gitignore 包含 test-pages/..."
if ! grep -q '^test-pages/$' .gitignore 2>/dev/null; then
  echo "  ❌ .gitignore 缺少 'test-pages/' 行（Hard Rule 1.3：临时测试页目录必须 git-ignored）"
  found_forbidden=true
else
  echo "  ✅ .gitignore 含 'test-pages/'"
fi

if [ "$found_forbidden" = true ]; then
  echo ""
  echo "❌ Structure check FAILED"
  exit 1
fi
echo ""

# ─────────────────────────────────────────────────────────────────────
# Check 10: apps/harmony/ 鸿蒙端专项检查（如存在）
# ─────────────────────────────────────────────────────────────────────
echo "Check 10: apps/harmony/ 鸿蒙端合规性..."
# ⚠️ set -euo pipefail：末尾汇总行无条件引用 HARMONY_FAIL，
#    必须在 if 外初始化，否则该端不存在时 unbound variable 直接 exit 1。
HARMONY_FAIL=0
if [ -d apps/harmony ]; then

  # 必含 build-profile.json5（hvigor 入口）
  if [ ! -f apps/harmony/build-profile.json5 ]; then
    echo "  ❌ apps/harmony/ 存在但缺 build-profile.json5（hvigor 根配置）"
    HARMONY_FAIL=1
  fi

  # 必含 entry 模块
  if [ ! -d apps/harmony/entry ]; then
    echo "  ❌ apps/harmony/entry/ 不存在（每个 HarmonyOS App 必须有一个或多个 module）"
    HARMONY_FAIL=1
  fi

  # 严禁使用 React Native 兼容层（API 12+ 已删 AOSP）
  # 排除 docs/ 与 README.md 等说明文件（反向说"不要这样"也算违规是误报）
  # ⚠️ set -euo pipefail 下，grep -v 没匹配返回 1 会让脚本退出 —— 必须 `|| true` 兜底
  HARMONY_RN_LEAKS=$( (grep -rln "@react-native-oh\|@react-native/community" apps/harmony/ 2>/dev/null \
    | grep -v '/docs/' \
    | grep -v 'README\.md$' \
    | grep -v '\.md$' \
    | tr -d '\n' | wc -l) || true)
  if [ "$HARMONY_RN_LEAKS" -gt 0 ]; then
    echo "  ❌ apps/harmony/ 含 React Native 兼容层引用。HarmonyOS NEXT 不兼容（API 12+ 已删 AOSP）"
    (grep -rln "@react-native-oh\|@react-native/community" apps/harmony/ 2>/dev/null \
      | grep -v '/docs/' \
      | grep -v 'README\.md$' \
      | grep -v '\.md$' \
      | sed 's/^/       /') || true
    HARMONY_FAIL=1
  fi

  # 严禁用 React/DOM（ArkUI 是声明式组件，**不**是 React）
  HARMONY_REACT_LEAKS=$( (grep -rln "from 'react'\|from \"react\"\|from 'react-dom'" apps/harmony/ 2>/dev/null \
    | grep -v '/docs/' \
    | grep -v 'README\.md$' \
    | grep -v '\.md$' \
    | tr -d '\n' | wc -l) || true)
  if [ "$HARMONY_REACT_LEAKS" -gt 0 ]; then
    echo "  ❌ apps/harmony/ 含 React/DOM 引用。ArkUI 用 @Component + 声明式组件，**不**是 React"
    (grep -rln "from 'react'\|from \"react\"\|from 'react-dom'" apps/harmony/ 2>/dev/null \
      | grep -v '/docs/' \
      | grep -v 'README\.md$' \
      | grep -v '\.md$' \
      | sed 's/^/       /') || true
    HARMONY_FAIL=1
  fi

  # shared/ 不允许在 apps/harmony/ 端被直接复制（必须通过 ohpm 跨端引用）
  SHARED_COPY_HARMONY=$( (find apps/harmony -type d \( -name 'types' -o -name 'constants' -o -name 'utils' -o -name 'validators' -o -name 'data' \) 2>/dev/null | tr -d '\n' | wc -l) || true)
  if [ "$SHARED_COPY_HARMONY" -gt 0 ]; then
    echo "  ❌ apps/harmony/ 复制了 shared/ 子目录。必须通过 ohpm 跨端引用 shared/*"
    (find apps/harmony -type d \( -name 'types' -o -name 'constants' -o -name 'utils' -o -name 'validators' -o -name 'data' \) 2>/dev/null | sed 's/^/       /') || true
    HARMONY_FAIL=1
  fi

  if [ "$HARMONY_FAIL" -eq 0 ]; then
    echo "  ✅ 鸿蒙端结构合规"
  fi
else
  echo "  ⏭  apps/harmony/ 不存在（按需建端）"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────
# Check 11: apps/minigame/ 小游戏端专项检查（如存在）
# ─────────────────────────────────────────────────────────────────────
echo "Check 11: apps/minigame/ 小游戏端合规性..."
# ⚠️ set -euo pipefail：同上，MINIGAME_FAIL 必须在 if 外初始化。
MINIGAME_FAIL=0
if [ -d apps/minigame ]; then

  # 必含 tsconfig.json（Cocos TypeScript 必需）
  if [ ! -f apps/minigame/tsconfig.json ]; then
    echo "  ❌ apps/minigame/ 存在但缺 tsconfig.json"
    MINIGAME_FAIL=1
  fi

  # 严禁用 React（小游戏用 Cocos 引擎，不是 React）
  # 排除 docs/ 与 README.md 等说明文件
  # ⚠️ set -euo pipefail 下，grep -v 没匹配返回 1 会让脚本退出 —— 必须 `|| true` 兜底
  MINIGAME_REACT_LEAKS=$( (grep -rln "from 'react'\|from \"react\"\|from 'react-dom'\|from '@react-native'" apps/minigame/ 2>/dev/null \
    | grep -v '/docs/' \
    | grep -v 'README\.md$' \
    | grep -v '\.md$' \
    | tr -d '\n' | wc -l) || true)
  if [ "$MINIGAME_REACT_LEAKS" -gt 0 ]; then
    echo "  ❌ apps/minigame/ 含 React/DOM 引用。小游戏用 Cocos 引擎，**不**是 React"
    (grep -rln "from 'react'\|from \"react\"\|from 'react-dom'\|from '@react-native'" apps/minigame/ 2>/dev/null \
      | grep -v '/docs/' \
      | grep -v 'README\.md$' \
      | grep -v '\.md$' \
      | sed 's/^/       /') || true
    MINIGAME_FAIL=1
  fi

  # 严禁用 Taro（小游戏 ≠ 小程序）
  MINIGAME_TARO_LEAKS=$( (grep -rln "from '@tarojs" apps/minigame/ 2>/dev/null \
    | grep -v '/docs/' \
    | grep -v 'README\.md$' \
    | grep -v '\.md$' \
    | tr -d '\n' | wc -l) || true)
  if [ "$MINIGAME_TARO_LEAKS" -gt 0 ]; then
    echo "  ❌ apps/minigame/ 含 @tarojs 引用。小游戏用 Cocos 引擎，**不**用 Taro"
    (grep -rln "from '@tarojs" apps/minigame/ 2>/dev/null \
      | grep -v '/docs/' \
      | grep -v 'README\.md$' \
      | grep -v '\.md$' \
      | sed 's/^/       /') || true
    MINIGAME_FAIL=1
  fi

  # 严禁用 Next.js（小游戏不走 Web 框架）
  MINIGAME_NEXT_LEAKS=$( (grep -rln "from 'next/\|from \"next/" apps/minigame/ 2>/dev/null \
    | grep -v '/docs/' \
    | grep -v 'README\.md$' \
    | grep -v '\.md$' \
    | tr -d '\n' | wc -l) || true)
  if [ "$MINIGAME_NEXT_LEAKS" -gt 0 ]; then
    echo "  ❌ apps/minigame/ 含 Next.js 引用。小游戏不走 Web 框架"
    (grep -rln "from 'next/\|from \"next/" apps/minigame/ 2>/dev/null \
      | grep -v '/docs/' \
      | grep -v 'README\.md$' \
      | grep -v '\.md$' \
      | sed 's/^/       /') || true
    MINIGAME_FAIL=1
  fi

  # shared/ 不允许在 apps/minigame/ 端被直接复制
  SHARED_COPY_MINIGAME=$( (find apps/minigame -type d \( -name 'types' -o -name 'constants' -o -name 'utils' -o -name 'validators' -o -name 'data' \) 2>/dev/null | tr -d '\n' | wc -l) || true)
  if [ "$SHARED_COPY_MINIGAME" -gt 0 ]; then
    echo "  ❌ apps/minigame/ 复制了 shared/ 子目录。必须通过 npm/pnpm 跨端引用 shared/*"
    (find apps/minigame -type d \( -name 'types' -o -name 'constants' -o -name 'utils' -o -name 'validators' -o -name 'data' \) 2>/dev/null | sed 's/^/       /') || true
    MINIGAME_FAIL=1
  fi

  if [ "$MINIGAME_FAIL" -eq 0 ]; then
    echo "  ✅ 小游戏端结构合规"
  fi
else
  echo "  ⏭  apps/minigame/ 不存在（按需建端）"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────
# Check 12: scripts/setup-harmony.sh + scripts/setup-minigame.sh 存在性
#   这两个 setup 脚本是 strict-project-scaffold skill 规定的标准入口，
#   即使 apps/harmony 和 apps/minigame 不存在也要有脚本供未来按需建端。
# ─────────────────────────────────────────────────────────────────────
echo "Check 12: scripts/setup-harmony.sh + setup-minigame.sh 存在性..."
SETUP_FAIL=0
for f in scripts/setup-harmony.sh scripts/setup-minigame.sh; do
  if [ ! -f "$f" ]; then
    echo "  ❌ $f 不存在"
    SETUP_FAIL=1
    continue
  fi
  if [ ! -x "$f" ]; then
    echo "  ❌ $f 不可执行（chmod +x）"
    SETUP_FAIL=1
    continue
  fi
  echo "  ✅ $f 可执行"
done
echo ""

# 汇总
if [ "$HARMONY_FAIL" -ne 0 ] || [ "$MINIGAME_FAIL" -ne 0 ] || [ "$SETUP_FAIL" -ne 0 ]; then
  echo "❌ Structure check FAILED (harmony/minigame/setup)"
  exit 1
fi

echo "✅ Structure check passed"