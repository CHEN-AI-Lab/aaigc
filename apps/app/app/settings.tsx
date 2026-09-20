// 设置页 —— 账号 / 语言 / 运行环境
//
// 运行环境一节刻意把「站点 API 基址有没有配」明写出来：App 不做任何地址兜底
// （SK-8），用户必须能一眼看到自己缺的是哪个环境变量。

import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { localeNames } from 'shared/constants/locales'
import type { Locale } from 'shared/types'
import { useSession } from '../src/auth/session-provider'
import { useI18n, type LocalePreference } from '../src/i18n/locale-provider'
import { API_BASE_URL_ENV, apiEndpoint } from '../src/runtime/env'
import { resolveSystemTimezone } from '../src/runtime/tool-context'
import { Button } from '../src/ui/Button'
import { Screen } from '../src/ui/Screen'
import { colors, fontSize, radius, spacing } from '../src/ui/theme'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} selectable>
        {value}
      </Text>
    </View>
  )
}

export default function SettingsScreen() {
  const { t, locale, preference, systemLocale, supported, setPreference } = useI18n()
  const { status, user, signOut } = useSession()
  const router = useRouter()

  const apiState = apiEndpoint.ok
    ? apiEndpoint.baseUrl
    : apiEndpoint.reason === 'invalid'
      ? `${t('errors.invalidParams')}: ${apiEndpoint.raw}`
      : `${t('auth.notSet')} — ${API_BASE_URL_ENV}`

  const preferences: readonly LocalePreference[] = ['system', ...supported]

  return (
    <Screen title={t('auth.settings')}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('auth.account')}</Text>
        {status === 'signedIn' && user ? (
          <>
            <Row label={t('auth.email')} value={user.email ?? t('auth.notSet')} />
            <Row label={t('auth.name')} value={user.name ?? t('auth.noName')} />
            <Row label={t('auth.user')} value={user.role} />
            <Button label={t('auth.logout')} tone="danger" onPress={() => void signOut()} />
          </>
        ) : (
          <>
            <Text style={styles.hint}>{t('auth.notLoggedIn')}</Text>
            <Button label={t('auth.login')} onPress={() => router.push('/login')} />
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('about.languages')}</Text>
        <View style={styles.options}>
          {preferences.map((item) => {
            const selected = preference === item
            const label =
              item === 'system'
                ? `${t('app.followSystem')} (${localeNames[systemLocale]})`
                : localeNames[item as Locale]
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setPreference(item)}
                style={[styles.option, selected ? styles.optionActive : null]}
              >
                <Text style={styles.optionLabel}>{label}</Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('app.runtime')}</Text>
        <Row label={t('app.apiBaseUrl')} value={apiState} />
        <Row label={t('app.timezone')} value={resolveSystemTimezone() ?? 'UTC'} />
        <Row label={t('about.languages')} value={locale} />
        <Row label={t('app.version')} value={Constants.expoConfig?.version ?? '0.0.0'} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accentLight,
  },
  sectionTitle: { color: colors.accent, fontSize: fontSize.body, fontWeight: '700' },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  rowLabel: { color: colors.textSecondary, fontSize: fontSize.caption, minWidth: 120 },
  rowValue: { color: colors.text, fontSize: fontSize.caption, flex: 1 },
  hint: { color: colors.textSecondary, fontSize: fontSize.body },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.accentLight,
    backgroundColor: colors.bg,
  },
  optionActive: { backgroundColor: colors.accentLight },
  optionLabel: { color: colors.text, fontSize: fontSize.body },
})
