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

import Taro, { useRouter } from '@tarojs/taro'
import { useMemo, useState } from 'react'
import { View, Text, Input, Textarea, Button, Switch, Picker } from '@tarojs/components'

import { getTool, runToolById } from 'shared/tools/registry'
import type { ToolInputField } from 'shared/types/tool'

import { toolLabel, useI18n } from '../../runtime/i18n'
import { createWeappToolContext } from '../../runtime/tool-context'

/**
 * 小程序端**不支持**的输入类型。
 *
 * `file` 指的是浏览器 File/Blob API（不是"能不能选文件"），小程序没有，
 * 所以这类工具不会出现在本页 —— 真出现了要**明确提示**而不是静默留空。
 */
const UNSUPPORTED_KINDS = new Set(['file'])

/** 按字段默认值构造初始表单值 */
function initialValues(fields: ToolInputField[]): Record<string, string | number | boolean> {
  const values: Record<string, string | number | boolean> = {}
  for (const field of fields) {
    if (field.default !== undefined) {
      values[field.name] = field.default
      continue
    }
    values[field.name] = field.kind === 'boolean' ? false : ''
  }
  return values
}

export default function ToolScreen() {
  const router = useRouter()
  const id = typeof router.params.id === 'string' ? router.params.id : ''
  const { locale, t, translator } = useI18n()

  const tool = useMemo(() => (id.length > 0 ? getTool(id) : undefined), [id])

  const [values, setValues] = useState<Record<string, string | number | boolean>>(() =>
    tool ? initialValues(tool.inputs) : {},
  )
  const [output, setOutput] = useState<string>('')
  const [errorText, setErrorText] = useState<string>('')
  const [running, setRunning] = useState(false)

  if (tool === undefined) {
    return (
      <View className='page'>
        <View className='aaigc-card'>
          <Text className='card-title'>{t('ui.toolNotFound')}</Text>
        </View>
      </View>
    )
  }

  const setValue = (name: string, value: string | number | boolean) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const hasUnsupported = tool.inputs.some((field) => UNSUPPORTED_KINDS.has(field.kind))

  const onRun = async () => {
    setRunning(true)
    setErrorText('')
    setOutput('')
    try {
      const ctx = createWeappToolContext({ locale })
      const outcome = await runToolById(tool.id, values, ctx)
      if (outcome.ok) {
        setOutput(tool.render(outcome.data, ctx))
      } else {
        // 先渲染稳定错误码对应的文案，再把引擎原始报错作次要信息附挂（架构 §4.1 ToolError.detail）
        const main = t(outcome.error.messageKey, outcome.error.params ?? {})
        const detail = outcome.error.detail
        setErrorText(detail ? `${main}\n${detail}` : main)
      }
    } catch (error) {
      setErrorText(`ERROR: ${(error as Error).message}`)
    } finally {
      setRunning(false)
    }
  }

  const onCopy = () => {
    if (output.length === 0) return
    void Taro.setClipboardData({ data: output })
  }

  return (
    <View className='page'>
      <View className='aaigc-card'>
        <Text className='card-title'>{toolLabel(translator, tool.id, 'name') ?? tool.id}</Text>
        <Text className='card-hint'>{toolLabel(translator, tool.id, 'description') ?? ''}</Text>
      </View>

      {hasUnsupported ? (
        <View className='aaigc-card'>
          <Text className='card-warn'>{t('ui.unsupportedInput')}</Text>
        </View>
      ) : null}

      {tool.inputs.map((field) => {
        const label = t(field.labelKey)
        const value = values[field.name]

        return (
          <View key={field.name} className='field'>
            <Text className='field-label'>{label}</Text>

            {field.kind === 'textarea' ? (
              <Textarea
                className='field-input'
                value={String(value ?? '')}
                placeholder={field.placeholderKey ? t(field.placeholderKey) : ''}
                onInput={(e) => setValue(field.name, e.detail.value)}
              />
            ) : field.kind === 'number' ? (
              <Input
                className='field-input'
                type='number'
                value={String(value ?? '')}
                placeholder={field.placeholderKey ? t(field.placeholderKey) : ''}
                onInput={(e) => setValue(field.name, e.detail.value)}
              />
            ) : field.kind === 'boolean' ? (
              <Switch
                checked={Boolean(value)}
                onChange={(e) => setValue(field.name, e.detail.value)}
              />
            ) : field.kind === 'select' && field.options ? (
              <Picker
                mode='selector'
                range={field.options.map((option) => t(option.labelKey))}
                value={Math.max(
                  0,
                  field.options.findIndex((option) => option.value === String(value ?? '')),
                )}
                onChange={(e) => {
                  const index = Number(e.detail.value)
                  const picked = field.options?.[index]
                  if (picked) setValue(field.name, picked.value)
                }}
              >
                <View className='field-input'>
                  {field.options.find((option) => option.value === String(value ?? ''))
                    ? t(
                        field.options.find((option) => option.value === String(value ?? ''))!
                          .labelKey,
                      )
                    : t('ui.selectPlaceholder')}
                </View>
              </Picker>
            ) : UNSUPPORTED_KINDS.has(field.kind) ? (
              <Text className='field-input field-disabled'>{t('ui.unsupportedInput')}</Text>
            ) : (
              <Input
                className='field-input'
                value={String(value ?? '')}
                placeholder={field.placeholderKey ? t(field.placeholderKey) : ''}
                onInput={(e) => setValue(field.name, e.detail.value)}
              />
            )}
          </View>
        )
      })}

      <Button className='run-button' loading={running} onClick={() => void onRun()}>
        {t('ui.run')}
      </Button>

      {errorText.length > 0 ? (
        <View className='aaigc-card'>
          <Text className='card-error'>{errorText}</Text>
        </View>
      ) : null}

      {output.length > 0 ? (
        <View className='aaigc-card'>
          <Text className='card-title'>{t('ui.result')}</Text>
          <Text className='output' selectable>
            {output}
          </Text>
          <Button className='copy-button' onClick={onCopy}>
            {t('ui.copy')}
          </Button>
        </View>
      ) : null}
    </View>
  )
}
