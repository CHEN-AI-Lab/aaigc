// 收藏页 —— 跨设备同步的收藏列表
//
// 服务端是唯一真源：进入页面 / 下拉刷新会先拉增量（?since=），再提交本地离线队列。
// 未登录时列表仍然可见（读本地缓存），但切换只会入队，登录后自动补交。

import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSession } from '../src/auth/session-provider'
import { useFavorites } from '../src/favorites/favorites-provider'
import { useI18n } from '../src/i18n/locale-provider'
import { getAppTool } from '../src/runtime/tool-runtime'
import { Button } from '../src/ui/Button'
import { ErrorBox } from '../src/ui/ResultBox'
import { Screen } from '../src/ui/Screen'
import { colors, fontSize, radius, spacing } from '../src/ui/theme'

export default function FavoritesScreen() {
  const { t } = useI18n()
  const { status } = useSession()
  const { favorites, sync, syncing, error, pendingCount, toggle } = useFavorites()
  const router = useRouter()

  const rows = useMemo(
    () =>
      favorites
        .filter((item) => item.type === 'tool')
        .map((item) => ({ item, tool: getAppTool(item.toolId) })),
    [favorites],
  )

  return (
    <Screen
      title={t('auth.favorites')}
      subtitle={pendingCount > 0 ? t('app.pendingSync', { count: pendingCount }) : undefined}
      onRefresh={() => void sync()}
      refreshing={syncing}
    >
      {status !== 'signedIn' ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>{t('errors.loginRequired')}</Text>
          <Button label={t('auth.login')} onPress={() => router.push('/login')} />
        </View>
      ) : null}

      {error ? <ErrorBox title={error.code} message={t(`errors.${error.code}`)} /> : null}

      {rows.length === 0 ? (
        <Text style={styles.empty}>{t('app.noFavorites')}</Text>
      ) : (
        <View style={styles.list}>
          {rows.map(({ item, tool }) => (
            <Pressable
              key={item.id}
              style={styles.row}
              onPress={() => router.push(`/tools/${item.toolId}`)}
            >
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle}>
                  {tool ? t(`tools.${item.toolId}.name`) : item.toolId}
                </Text>
                <Text style={styles.rowMeta}>{item.toolId}</Text>
              </View>
              <Text
                accessibilityRole="button"
                style={styles.remove}
                onPress={() => void toggle(item.toolId)}
              >
                ★
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  notice: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accentLight,
  },
  noticeText: { color: colors.text, fontSize: fontSize.body },
  empty: { color: colors.textSecondary, fontSize: fontSize.body },
  list: { gap: spacing.sm },
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
  rowTitle: { color: colors.text, fontSize: fontSize.title, fontWeight: '600' },
  rowMeta: { color: colors.textSecondary, fontSize: fontSize.caption },
  remove: { color: colors.accent, fontSize: fontSize.heading, paddingHorizontal: spacing.sm },
})
