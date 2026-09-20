// 工具页 —— 表单由 ToolDefinition.inputs 驱动，执行走 runtime/tool-runtime.ts
//
// 本端对 38 个工具用的是**同一条**渲染路径：结果文本来自 ToolDefinition.render()。
// 也就是说 html-preview / markdown-preview 这类"结果本身是 HTML"的工具，本趟只把
// HTML 源码展示出来，还没有接 WebView 富渲染 —— 界面会明确标出需要的能力
// （capabilities 里的 dom / canvas / file），不做"看起来渲染了其实没有"的假象。

import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { ToolError, ToolInputField } from 'shared/types/tool'
import { requireAppApi, useSession } from '../../src/auth/session-provider'
import { useFavorites } from '../../src/favorites/favorites-provider'
import { useI18n } from '../../src/i18n/locale-provider'
import { AppConfigError } from '../../src/runtime/env'
import { createAppToolContext } from '../../src/runtime/tool-context'
import {
  canRunRemotely,
  getAppTool,
  renderAppToolResult,
  runAppTool,
} from '../../src/runtime/tool-runtime'
import { Button } from '../../src/ui/Button'
import { ErrorBox, ResultBox } from '../../src/ui/ResultBox'
import { Screen } from '../../src/ui/Screen'
import {
  ToolInputForm,
  formValuesToInput,
  initialFormValues,
  type ToolFormValues,
} from '../../src/ui/ToolInputForm'
import { colors, fontSize, radius, spacing } from '../../src/ui/theme'

const NO_FIELDS: readonly ToolInputField[] = []

export default function ToolScreen() {
  const params = useLocalSearchParams<{ id?: string }>()
  const id = typeof params.id === 'string' ? params.id : ''
  const { t, locale } = useI18n()
  const session = useSession()
  const { isFavorited, toggle } = useFavorites()
  const router = useRouter()

  const tool = useMemo(() => getAppTool(id), [id])
  const fields = tool?.inputs ?? NO_FIELDS
  const [values, setValues] = useState<ToolFormValues>(() => initialFormValues(fields))
  const [running, setRunning] = useState(false)
  const [output, setOutput] = useState<string | null>(null)
  const [failure, setFailure] = useState<ToolError | null>(null)

  const needsRemote = tool?.tier === 'T3'
  const remoteSupported = tool !== undefined && canRunRemotely(tool.id)
  const blockedByTier = needsRemote && !remoteSupported
  const blockedByConfig = session.api === null

  const onChange = useCallback((name: string, value: string) => {
    setValues((previous) => ({ ...previous, [name]: value }))
  }, [])

  const run = useCallback(async (): Promise<void> => {
    if (!tool) return
    setRunning(true)
    setFailure(null)
    setOutput(null)

    const ctx = createAppToolContext({ locale })
    try {
      const api = requireAppApi(session)
      const outcome = await runAppTool(tool.id, formValuesToInput(values), ctx, {
        api: api.client,
        locale,
      })
      if (outcome.ok) {
        setOutput(renderAppToolResult(tool.id, outcome.data, ctx))
      } else {
        setFailure(outcome.error)
      }
    } catch (caught) {
      // 走到这里只可能是"站点基址没配"——UI 已提前禁用按钮，兜一层避免白屏
      setFailure({
        code: 'networkFailed',
        messageKey: 'tools.networkFailed',
        ...(caught instanceof AppConfigError ? { detail: caught.message } : {}),
      })
    } finally {
      setRunning(false)
    }
  }, [tool, locale, session, values])

  if (!tool) {
    return (
      <Screen title={t('tools.toolNotFound')}>
        <ErrorBox title="toolNotFound" message={t('tools.toolNotFound')} />
      </Screen>
    )
  }

  return (
    <Screen title={t(`tools.${tool.id}.name`)} subtitle={t(`tools.${tool.id}.description`)}>
      <View style={styles.metaRow}>
        <Text style={styles.metaChip}>{tool.tier}</Text>
        {tool.capabilities.map((capability) => (
          <Text key={capability} style={styles.metaChip}>
            {capability}
          </Text>
        ))}
        <Text style={styles.metaChip}>
          {isFavorited(tool.id) ? '★' : '☆'}
        </Text>
      </View>

      <ToolInputForm fields={fields} values={values} onChange={onChange} t={t} />

      {blockedByTier ? (
        <ErrorBox
          title="unsupportedPlatform"
          message={t('tools.unsupportedPlatform')}
          detail={`${tool.id} has no remote endpoint registered in src/runtime/tool-runtime.ts`}
        />
      ) : null}

      {blockedByConfig ? (
        <ErrorBox
          title="configMissing"
          message={t('errors.networkFailed')}
          detail={session.configError?.reason === 'invalid' ? session.configError.raw : undefined}
        />
      ) : null}

      <View style={styles.actions}>
        <Button
          label={running ? t('auth.verifying') : t('tools.generate')}
          onPress={() => void run()}
          disabled={running || blockedByTier || blockedByConfig}
        />
        <Button
          label={t('tools.reset')}
          tone="secondary"
          onPress={() => {
            setValues(initialFormValues(fields))
            setOutput(null)
            setFailure(null)
          }}
        />
        <Button
          label={isFavorited(tool.id) ? t('auth.cancel') : t('auth.favorites')}
          tone="secondary"
          onPress={() => void toggle(tool.id)}
        />
        <Button
          label={t('common.close')}
          tone="secondary"
          onPress={() => router.back()}
        />
      </View>

      {failure ? (
        <ErrorBox
          title={failure.code}
          message={t(failure.messageKey, failure.params)}
          detail={failure.detail}
        />
      ) : null}

      {output !== null ? (
        <ResultBox text={output} copyLabel={t('tools.copy')} copiedLabel={t('tools.copied')} />
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metaChip: {
    color: colors.textSecondary,
    fontSize: fontSize.caption,
    borderWidth: 1,
    borderColor: colors.accentLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    overflow: 'hidden',
  },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
})
