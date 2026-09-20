// 页面外壳 —— 统一背景色、安全区与标题排版

import type { ReactNode } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, fontSize, spacing } from './theme'

export interface ScreenProps {
  title: string
  subtitle?: string
  children: ReactNode
  /** 是否包一层 ScrollView（表单页需要，列表页通常自己管滚动） */
  scrollable?: boolean
  /** 下拉刷新（列表页用；同时给 refreshing 才会显示指示器） */
  onRefresh?: () => void
  refreshing?: boolean
}

export function Screen({
  title,
  subtitle,
  children,
  scrollable = true,
  onRefresh,
  refreshing = false,
}: ScreenProps) {
  const insets = useSafeAreaInsets()

  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {subtitle !== undefined ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  )

  if (!scrollable) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + spacing.lg }]}>
        {header}
        {children}
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl },
      ]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        ) : undefined
      }
    >
      {header}
      {children}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  header: { gap: spacing.xs, marginBottom: spacing.sm },
  title: { fontSize: fontSize.display, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: fontSize.body, color: colors.textSecondary },
})
