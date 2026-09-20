// ─────────────────────────────────────────────────────────────────────────────
// 语言偏好 Provider —— 跟随系统 + App 内手动切换
//
// 偏好取值：'system'（默认）或某个受支持的 Locale。
// 偏好本身不是机密 → AsyncStorage（SecureStore 只留给 token）。
// 首帧就用系统语言渲染，避免"先英文再跳中文"的闪烁。
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Localization from 'expo-localization'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { isLocale } from 'shared/constants/locales'
import type { Locale } from 'shared/types'
import { createTranslator, resolveSystemLocale, supportedLocales, type Translator } from './translator'

export const LOCALE_PREFERENCE_KEY = 'aaigc.locale.v1'

/** 'system' = 跟随系统；否则为显式选择的 Locale */
export type LocalePreference = 'system' | Locale

export interface I18nContextValue {
  /** 当前生效的 Locale */
  locale: Locale
  /** 用户偏好（可能是 'system'） */
  preference: LocalePreference
  /** 系统语言解析出的 Locale（设置页展示"跟随系统（xx）"用） */
  systemLocale: Locale
  supported: Locale[]
  t: Translator['t']
  setPreference: (preference: LocalePreference) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

function readSystemLocale(): Locale {
  try {
    const [first] = Localization.getLocales()
    return resolveSystemLocale(first?.languageTag)
  } catch {
    return resolveSystemLocale(undefined)
  }
}

function parsePreference(raw: string | null): LocalePreference {
  if (raw === null) return 'system'
  if (raw === 'system') return 'system'
  return isLocale(raw) ? raw : 'system'
}

export function I18nProvider({ children }: { children: ReactNode }): ReactNode {
  const systemLocale = useMemo(readSystemLocale, [])
  const [preference, setPreferenceState] = useState<LocalePreference>('system')

  useEffect(() => {
    let alive = true
    AsyncStorage.getItem(LOCALE_PREFERENCE_KEY)
      .then((raw) => {
        if (alive) setPreferenceState(parsePreference(raw))
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])

  const setPreference = useCallback((next: LocalePreference) => {
    setPreferenceState(next)
    AsyncStorage.setItem(LOCALE_PREFERENCE_KEY, next).catch(() => undefined)
  }, [])

  const locale = preference === 'system' ? systemLocale : preference
  const translator = useMemo(() => createTranslator(locale), [locale])

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      preference,
      systemLocale,
      supported: supportedLocales(),
      t: translator.t,
      setPreference,
    }),
    [locale, preference, systemLocale, translator, setPreference],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used inside <I18nProvider>')
  return value
}
