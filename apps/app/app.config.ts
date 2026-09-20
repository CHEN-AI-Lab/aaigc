// ─────────────────────────────────────────────────────────────────────────────
// Expo app 配置（iOS + Android）
//
// 这里**不写任何站点 / API 地址**：站点基址一律由 `EXPO_PUBLIC_AAIGC_API_BASE_URL`
// 在打包时注入，未配置时 App 进入「未配置」状态并明确提示（SK-8：禁止非空 fallback）。
// 见 src/runtime/env.ts。
//
// bundleIdentifier / package 是**应用标识**（反向域名），不是网络端点，
// 取自 shared/constants/domains.ts 里已确认的第一方域名 PUBLIC_SITE_DOMAIN。
// ─────────────────────────────────────────────────────────────────────────────

import type { ExpoConfig } from 'expo/config'

/** 与 PUBLIC_SITE_DOMAIN 对齐的反向域名（应用标识，非 URL） */
const APP_ID = 'online.aaigc.app'

const config: ExpoConfig = {
  name: 'AAIGC',
  slug: 'aaigc',
  scheme: 'aaigc',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  plugins: ['expo-router', 'expo-secure-store', 'expo-localization'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: APP_ID,
  },
  android: {
    package: APP_ID,
  },
  experiments: {
    typedRoutes: false,
  },
}

export default config
