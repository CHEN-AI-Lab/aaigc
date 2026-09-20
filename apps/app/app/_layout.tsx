// 根布局 —— 只做 Provider 装配，不放任何业务逻辑
//
// Provider 顺序（由外到内）：
//   SafeAreaProvider → I18nProvider → SessionProvider → FavoritesProvider
//   · Session 需要 I18n（Accept-Language 与错误文案）
//   · Favorites 需要 Session（未登录时只在本地排队，不上传）

import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { SessionProvider } from '../src/auth/session-provider'
import { FavoritesProvider } from '../src/favorites/favorites-provider'
import { I18nProvider, useI18n } from '../src/i18n/locale-provider'
import { colors } from '../src/ui/theme'

function RootNavigator() {
  const { t } = useI18n()

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: t('common.appName') }} />
        <Stack.Screen name="login" options={{ title: t('auth.login') }} />
        <Stack.Screen name="favorites" options={{ title: t('auth.favorites') }} />
        <Stack.Screen name="settings" options={{ title: t('auth.settings') }} />
        <Stack.Screen name="tools/[id]" options={{ title: t('ui.tools') }} />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <SessionProvider>
          <FavoritesProvider>
            <RootNavigator />
          </FavoritesProvider>
        </SessionProvider>
      </I18nProvider>
    </SafeAreaProvider>
  )
}
