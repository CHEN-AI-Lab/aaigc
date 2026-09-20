// 结果 / 错误展示块 —— 等宽字体 + 一键复制
//
// 结果文本来自 ToolDefinition.render()（与 CLI stdout / 小程序兜底同一条路径），
// 所以这里不做任何格式化，只负责呈现与复制。

import * as Clipboard from 'expo-clipboard'
import { useState, type ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, fontSize, monospaceFontFamily, radius, spacing } from './theme'

export interface ResultBoxProps {
  text: string
  copyLabel: string
  copiedLabel: string
}

export function ResultBox({ text, copyLabel, copiedLabel }: ResultBoxProps) {
  const [copied, setCopied] = useState(false)

  const copy = (): void => {
    void Clipboard.setStringAsync(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <View style={styles.box}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Output</Text>
        <Pressable accessibilityRole="button" onPress={copy} style={styles.copyButton}>
          <Text style={styles.copyLabel}>{copied ? copiedLabel : copyLabel}</Text>
        </Pressable>
      </View>
      <Text selectable style={styles.resultText}>
        {text}
      </Text>
    </View>
  )
}

export interface ErrorBoxProps {
  title: string
  /** 已本地化的主文案（t(error.messageKey) 的结果） */
  message: string
  /** 引擎原始报错，可空 */
  detail?: string | undefined
  children?: ReactNode
}

export function ErrorBox({ title, message, detail, children }: ErrorBoxProps) {
  return (
    <View style={[styles.box, styles.errorBox]}>
      <Text style={styles.errorTitle}>{title}</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      {detail !== undefined && detail.length > 0 ? (
        <Text style={styles.errorDetail}>{detail}</Text>
      ) : null}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accentLight,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLabel: { fontSize: fontSize.caption, color: colors.textSecondary, letterSpacing: 1 },
  copyButton: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  copyLabel: { color: colors.accent, fontSize: fontSize.caption, fontWeight: '700' },
  resultText: { fontFamily: monospaceFontFamily, fontSize: fontSize.caption, color: colors.text },
  errorBox: { borderColor: colors.accent },
  errorTitle: { fontSize: fontSize.caption, color: colors.accent, fontWeight: '700', letterSpacing: 1 },
  errorMessage: { fontSize: fontSize.body, color: colors.text },
  errorDetail: { fontSize: fontSize.caption, color: colors.textSecondary },
})
