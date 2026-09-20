// 首页 —— 38 个工具的列表（T1/T2 本地可跑，T3 走站点 API）
//
// 列表、名称、描述全部来自 shared：
//   列表 → shared/tools/registry.ts 的 listTools()
//   文案 → shared/messages 的 tools.<id>.name / tools.<id>.description
// 这里不维护任何工具清单副本。

import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { ToolTier } from 'shared/types/tool'
import { useSession } from '../src/auth/session-provider'
import { useFavorites } from '../src/favorites/favorites-provider'
import { useI18n } from '../src/i18n/locale-provider'
import { API_BASE_URL_ENV } from '../src/runtime/env'
import { canRunRemotely, listAppTools } from '../src/runtime/tool-runtime'
import { Screen } from '../src/ui/Screen'
import { colors, fontSize, radius, spacing } from '../src/ui/theme'

type TierFilter = 'all' | ToolTier

const TIER_FILTERS: readonly TierFilter[] = ['all', 'T1', 'T2', 'T3']

export default function ToolsScreen() {
  const { t } = useI18n()
  const { configError, status, user } = useSession()
  const { isFavorited, pendingCount, sync, syncing } = useFavorites()
  const router = useRouter()
  const [tier, setTier] = useState<TierFilter>('all')

  const allTools = useMemo(listAppTools, [])
  const tools = useMemo(() => {
    const filtered = tier === 'all' ? allTools : allTools.filter((tool) => tool.tier === tier)
    return [...filtered].sort((a, b) => a.id.localeCompare(b.id))
  }, [allTools, tier])

  return (
    <Screen title={t('ui.tools')} subtitle={`${tools.length} / ${allTools.length}`}>
      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={() => router.push('/favorites')}>
          <Text style={styles.actionLabel}>
            {t('auth.favorites')}
            {pendingCount > 0 ? ` (${pendingCount})` : ''}
          </Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => router.push('/settings')}>
          <Text style={styles.actionLabel}>{t('auth.settings')}</Text>
        </Pressable>
        {status === 'signedOut' ? (
          <Pressable style={styles.actionButton} onPress={() => router.push('/login')}>
            <Text style={styles.actionLabel}>{t('auth.login')}</Text>
          </Pressable>
        ) : null}
        {status === 'signedIn' && user?.email ? (
          <Pressable style={styles.actionButton} onPress={() => void sync()}>
            <Text style={styles.actionLabel} numberOfLines={1}>
              {syncing ? t('auth.verifying') : user.email}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {configError ? (
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>{API_BASE_URL_ENV}</Text>
          <Text style={styles.bannerText}>
            {configError.reason === 'invalid' ? configError.raw : t('errors.networkFailed')}
          </Text>
        </View>
      ) : null}

      <View style={styles.filters}>
        {TIER_FILTERS.map((item) => (
          <Pressable
            key={item}
            onPress={() => setTier(item)}
            style={[styles.filter, tier === item ? styles.filterActive : null]}
          >
            <Text style={styles.filterLabel}>{item === 'all' ? t('ui.all') : item}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.list}>
        {tools.map((tool) => {
          const blocked = tool.tier === 'T3' && !canRunRemotely(tool.id)
          return (
            <Pressable
              key={tool.id}
              style={styles.row}
              onPress={() => router.push(`/tools/${tool.id}`)}
            >
              <View style={styles.rowMain}>
                <View style={styles.rowTitleLine}>
                  <Text style={styles.rowTitle}>{t(`tools.${tool.id}.name`)}</Text>
                  <Text style={styles.tier}>{tool.tier}</Text>
                  {blocked ? <Text style={styles.blocked}>{t('tools.unsupportedPlatform')}</Text> : null}
                </View>
                <Text style={styles.rowDescription} numberOfLines={2}>
                  {t(`tools.${tool.id}.description`)}
                </Text>
              </View>
              <Text style={styles.star}>{isFavorited(tool.id) ? '★' : '☆'}</Text>
            </Pressable>
          )
        })}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actionButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.accentLight,
    backgroundColor: colors.surface,
  },
  actionLabel: { color: colors.accent, fontSize: fontSize.caption, fontWeight: '700' },
  banner: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  bannerText: { color: colors.text, fontSize: fontSize.body },
  bannerTitle: { color: colors.accent, fontSize: fontSize.caption, fontWeight: '700' },
  filters: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  filter: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.accentLight,
    backgroundColor: colors.surface,
  },
  filterActive: { backgroundColor: colors.accentLight },
  filterLabel: { color: colors.text, fontSize: fontSize.caption, fontWeight: '600' },
  list: { marginTop: spacing.md, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accentLight,
  },
  rowMain: { flex: 1, gap: spacing.xs },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowTitle: { color: colors.text, fontSize: fontSize.title, fontWeight: '600' },
  tier: {
    color: colors.textSecondary,
    fontSize: fontSize.caption,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    overflow: 'hidden',
  },
  blocked: { color: colors.accent, fontSize: fontSize.caption },
  rowDescription: { color: colors.textSecondary, fontSize: fontSize.caption },
  star: { color: colors.accent, fontSize: fontSize.heading },
})
