// 登录页 —— 两条 Bearer 通道
//
//   密码授权：邮箱 + 密码 → POST /api/auth/token
//   设备码  ：POST /api/auth/device/code → 浏览器里确认 → 轮询 /api/auth/device/token
//
// 设备码通道是给"没有密码的账号"（Google / GitHub 注册）准备的：
// 服务端的 /api/auth/send-verification 走裸 isSameOrigin()，原生端恒 403，
// 所以邮箱验证码登录在本端不可用（详见 src/auth/login.ts 顶部说明）。

import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { ApiError } from 'shared/api/http-client'
import { APP_PLATFORM } from '../src/runtime/api'
import { readOrCreateClientId } from '../src/auth/device-identity'
import { loginWithDeviceCode, loginWithPassword } from '../src/auth/login'
import { useSession } from '../src/auth/session-provider'
import { useI18n } from '../src/i18n/locale-provider'
import { API_BASE_URL_ENV } from '../src/runtime/env'
import { Button } from '../src/ui/Button'
import { ErrorBox } from '../src/ui/ResultBox'
import { Screen } from '../src/ui/Screen'
import { colors, fontSize, monospaceFontFamily, radius, spacing } from '../src/ui/theme'

type Mode = 'password' | 'device'

interface DevicePromptState {
  userCode: string
  verificationUri: string
}

/** ApiError.code 本身就是 i18n key（SK-2），缺失时 t() 会原样返回 key —— 可见的缺口 */
function describeError(error: unknown): { title: string; messageKey: string } {
  if (error instanceof ApiError) return { title: error.code, messageKey: `errors.${error.code}` }
  if (error instanceof Error) return { title: error.name, messageKey: error.message }
  return { title: 'unknown', messageKey: 'errors.requestFailed' }
}

export default function LoginScreen() {
  const { t } = useI18n()
  const { api, configError, signIn } = useSession()
  const router = useRouter()

  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<{ title: string; messageKey: string } | null>(null)
  const [devicePrompt, setDevicePrompt] = useState<DevicePromptState | null>(null)
  const [waitedSeconds, setWaitedSeconds] = useState(0)
  const [clientId, setClientId] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    readOrCreateClientId(APP_PLATFORM)
      .then((value) => {
        if (alive) setClientId(value)
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])

  const submitPassword = useCallback(async (): Promise<void> => {
    if (!api || !clientId) return
    setBusy(true)
    setError(null)
    try {
      const pair = await loginWithPassword(api.client, { email, password, clientId })
      await signIn(pair)
      router.replace('/')
    } catch (caught) {
      setError(describeError(caught))
    } finally {
      setBusy(false)
    }
  }, [api, clientId, email, password, signIn, router])

  const submitDeviceCode = useCallback(async (): Promise<void> => {
    if (!api || !clientId) return
    setBusy(true)
    setError(null)
    setDevicePrompt(null)
    setWaitedSeconds(0)
    try {
      const pair = await loginWithDeviceCode({
        client: api.client,
        clientId,
        onPrompt: (prompt) => {
          setDevicePrompt({ userCode: prompt.userCode, verificationUri: prompt.verificationUri })
        },
        onWaiting: (elapsedMs) => setWaitedSeconds(Math.floor(elapsedMs / 1000)),
      })
      await signIn(pair)
      router.replace('/')
    } catch (caught) {
      setError(describeError(caught))
    } finally {
      setBusy(false)
    }
  }, [api, clientId, signIn, router])

  if (!api) {
    return (
      <Screen title={t('auth.login')} subtitle={t('auth.loginSubtitle')}>
        <ErrorBox
          title="configMissing"
          message={t('errors.networkFailed')}
          detail={configError?.reason === 'invalid' ? configError.raw : API_BASE_URL_ENV}
        />
      </Screen>
    )
  }

  return (
    <Screen title={t('auth.login')} subtitle={t('auth.loginSubtitle')}>
      <View style={styles.tabs}>
        <Text
          accessibilityRole="button"
          onPress={() => setMode('password')}
          style={[styles.tab, mode === 'password' ? styles.tabActive : null]}
        >
          {t('auth.tabPassword')}
        </Text>
        <Text
          accessibilityRole="button"
          onPress={() => setMode('device')}
          style={[styles.tab, mode === 'device' ? styles.tabActive : null]}
        >
          {t('app.deviceLogin')}
        </Text>
      </View>

      {mode === 'password' ? (
        <View style={styles.form}>
          <Text style={styles.label}>{t('auth.email')}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.email')}
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
          <Text style={styles.label}>{t('auth.password')}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder={t('auth.password')}
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button
            label={busy ? t('auth.loginVerifying') : t('auth.loginButton')}
            onPress={() => void submitPassword()}
            disabled={busy || email.length === 0 || password.length === 0}
          />
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.hint}>{t('errors.authorizationPending')}</Text>
          <Button
            label={busy ? t('auth.verifying') : t('auth.login')}
            onPress={() => void submitDeviceCode()}
            disabled={busy}
          />
          {devicePrompt ? (
            <View style={styles.deviceBox}>
              <Text style={styles.deviceCode}>{devicePrompt.userCode}</Text>
              {devicePrompt.verificationUri.length > 0 ? (
                <>
                  <Button
                    label={t('auth.verifyCode')}
                    tone="secondary"
                    onPress={() => void Linking.openURL(devicePrompt.verificationUri)}
                  />
                  <Text style={styles.hint}>{devicePrompt.verificationUri}</Text>
                </>
              ) : (
                // 契约要求：verificationUri 为空串时原样提示"服务未配置"，
                // 绝不用公开站域名自己拼一个 URL（那个站点不认识本次 device_code）
                <Text style={styles.hint}>{t('errors.networkFailed')}</Text>
              )}
              <Text style={styles.hint}>
                {t('auth.codeVerifying')} {waitedSeconds}s
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {error ? <ErrorBox title={error.title} message={t(error.messageKey)} /> : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.accentLight,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: fontSize.body,
    overflow: 'hidden',
  },
  tabActive: { backgroundColor: colors.accentLight, fontWeight: '700' },
  form: { gap: spacing.md },
  label: { fontSize: fontSize.body, fontWeight: '600', color: colors.text },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accentLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.body,
    color: colors.text,
  },
  deviceBox: { gap: spacing.sm, alignItems: 'flex-start' },
  deviceCode: {
    fontFamily: monospaceFontFamily,
    fontSize: fontSize.heading,
    fontWeight: '700',
    color: colors.accent,
  },
  hint: { fontSize: fontSize.caption, color: colors.textSecondary },
})
