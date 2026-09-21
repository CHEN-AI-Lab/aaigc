// ============================================================================
// Copyright (c) 2025-present Furinaaa
//
// This source code is dual-licensed under:
//
//   - GNU Affero General Public License v3.0 (AGPL-3.0)
//     Free for open-source use. See LICENSE for details.
//
//   - Commercial License
//     For closed-source or commercial use.
//     Contact: 2445821022@qq.com
//
// You must comply with at least one of the above licenses to use this file.
// ============================================================================

import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'

import { supportedTools } from 'shared/tools/registry'
import type { ToolCapability } from 'shared/types/tool'

import { toolLabel, useI18n } from '../../runtime/i18n'

// ─────────────────────────────────────────────────────────────────────────────
// 小程序端具备的平台能力。
//
// 与架构 §4.1 的 ToolCapability 对齐：
//   · network   —— Taro.request 可用
//   · clipboard —— Taro.setClipboardData 可用
//   · timer     —— setTimeout / setInterval 可用
//   · dom / canvas / file —— **小程序没有**（file 指浏览器 File/Blob API，
//     不是指"能不能选文件"，所以 image-* / pdf-tool 在小程序端不开）
//
// 只列真正具备的能力，不为了凑数虚报 —— 虚报会让工具在运行时炸。
// ─────────────────────────────────────────────────────────────────────────────
const WEAPP_CAPABILITIES: ToolCapability[] = ['network', 'clipboard', 'timer']

/**
 * 在小程序端是「shared 降级实现」的工具（架构 §4.4「Web 增强实现」）。
 *
 * 这些工具在 Web 端有更好的实现（unified / 完整 js-yaml / DOMParser 完整实体表），
 * 而 shared/tools 提供的是受限子集。小程序只能用 shared 版，所以必须**明确告知**，
 * 否则用户会遇到「GFM 表格渲染不出来」却不知道为什么。
 */
const DEGRADED_TOOL_IDS = new Set(['markdown-preview', 'yaml-json', 'html-entities'])

export default function ToolsIndex() {
  const { t, translator } = useI18n()
  const tools = supportedTools(WEAPP_CAPABILITIES)

  return (
    <View className='page'>
      <View className='aaigc-card'>
        <Text className='card-title'>{t('ui.tools')}</Text>
        <Text className='card-hint'>
          {t('ui.toolCount', { count: tools.length })}
        </Text>
      </View>

      {tools.map((tool) => {
        const name = toolLabel(translator, tool.id, 'name') ?? tool.id
        const degraded = DEGRADED_TOOL_IDS.has(tool.id)

        return (
          <View
            key={tool.id}
            className='tool-row'
            onClick={() => {
              void Taro.navigateTo({ url: `/pages/tool/index?id=${tool.id}` })
            }}
          >
            <View className='tool-row-main'>
              <Text className='tool-name'>{name}</Text>
              <Text className='tool-id'>{tool.id}</Text>
            </View>

            <View className='tool-row-side'>
              {degraded ? <Text className='badge-degraded'>{t('ui.degraded')}</Text> : null}
              <Text className={`badge-tier badge-tier-${tool.tier}`}>{tool.tier}</Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}
