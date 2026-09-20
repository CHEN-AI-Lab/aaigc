// ─────────────────────────────────────────────────────────────────────────────
// SPIKE 页面：验证 Taro 能否直接编译 pnpm workspace 里 shared/ 的 TS 源码
//
// 这里刻意从**包名说明符**导入（而非相对路径），走的是
//   node_modules/shared -> ../../shared  (pnpm workspace symlink)
//   + shared/package.json 的 exports 映射
// 这条真实链路，与 apps/web / apps/cli / apps/app 的用法完全一致。
// ─────────────────────────────────────────────────────────────────────────────

import { View, Text } from '@tarojs/components'
import { createToolContext } from 'shared/tools/context'
import { base64Tool, parseBase64, renderBase64, runBase64 } from 'shared/tools/base64'

/** 产物里用于定位本页面的唯一标记 */
const SPIKE_MARKER = 'SPIKE_SHARED_MARKER_9f3a'

export default function Index() {
  const ctx = createToolContext({ locale: 'zh-CN', timezone: 'Asia/Shanghai' })

  // 真实调用 shared/tools/base64.ts 的纯函数
  const parsed = parseBase64({ text: '你好 AAIGC', mode: 'encode' }, ctx)
  let output = '<parse failed>'
  if (parsed.ok) {
    const ran = runBase64(parsed.data, ctx)
    output = ran.ok ? renderBase64(ran.data, ctx) : `<run failed: ${ran.error.code}>`
  }

  return (
    <View className='spike'>
      <Text>{SPIKE_MARKER}</Text>
      <Text>toolId: {base64Tool.id}</Text>
      <Text>tier: {base64Tool.tier}</Text>
      <Text>base64: {output}</Text>
    </View>
  )
}
