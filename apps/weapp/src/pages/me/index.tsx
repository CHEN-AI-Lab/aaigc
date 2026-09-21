// ============================================================================
// Copyright (c) 2025-present Furinaaa
//
// This source code is dual-licensed under:
//
//   - GNU Affero General Public License v3.0 (AGPL-3.0)
//     Free for open-source use. See LICENSE for details.
//
//   - Commercial License
//     For closed-source or commercial use.
//     Contact: 2445821022@qq.com
//
// You must comply with at least one of the above licenses to use this file.
// ============================================================================

import Taro from '@tarojs/taro'
import { useCallback, useEffect, useState } from 'react'
import { View, Text, Picker, Button } from '@tarojs/components'

import type { FavoriteItemRecord } from 'shared/types/api'

import { useI18n } from '../../runtime/i18n'
import { apiBaseUrl, isApiBaseUrlConfigured } from '../../runtime/env'
import { clearSession, getApi, hasSession } from '../../runtime/api'

export default function Me() {
  const { locale, t, setLocale, supportedLocales, localeNames, followingSystem } = useI18n()

  const [loggedIn, setLoggedIn] = useState(false)
  const [favorites, setFavorites] = useState<FavoriteItemRecord[]>([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    const api = getApi()
    if (api === null) {
      setStatus(t('ui.apiBaseMissing'))
      return
    }
    const signedIn = await hasSession()
    setLoggedIn(signedIn)
    if (!signedIn) {
      setFavorites([])
      return
    }
    setLoading(true)
    try {
      const snapshot = await api.favorites.list()
      setFavorites(snapshot.favorites)
      setStatus('')
    } catch (error) {
      // 401 已由 shared/api 处理（refresh → 仍失败则 onUnauthorized）；
      // 走到这里的是其它错误，按错误码取文案展示
      const code = (error as { code?: string }).code
      setStatus(code ? t(`errors.${code}`) : t('ui.syncFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const options = supportedLocales.map((code) => localeNames[code] ?? code)
  const currentIndex = Math.max(0, supportedLocales.indexOf(locale))

  return (
    <View className='page'>
      <View className='aaigc-card'>
        <Text className='card-title'>{t('auth.account')}</Text>
        <Text className='card-hint'>
          {isApiBaseUrlConfigured() ? apiBaseUrl() : t('ui.apiBaseMissing')}
        </Text>
        {status.length > 0 ? <Text className='card-hint'>{status}</Text> : null}
      </View>

      <View className='field'>
        <Text className='field-label'>{t('ui.language')}</Text>
        <Picker
          mode='selector'
          range={options}
          value={currentIndex}
          onChange={(e) => {
            const index = Number(e.detail.value)
            const next = supportedLocales[index]
            if (next) setLocale(next)
          }}
        >
          <View className='field-input'>{options[currentIndex]}</View>
        </Picker>
        <Text className='field-hint'>
          {followingSystem ? t('ui.followingSystem') : t('ui.manuallySet')}
        </Text>
      </View>

      {loggedIn ? (
        <>
          <View className='aaigc-card'>
            <Text className='card-title'>{t('ui.favorites')}</Text>
            {loading ? <Text className='card-hint'>{t('ui.loading')}</Text> : null}
            {!loading && favorites.length === 0 ? (
              <Text className='card-hint'>{t('ui.emptyFavorites')}</Text>
            ) : null}
            {favorites.map((item) => (
              <Text key={`${item.type}:${item.toolId}`} className='card-hint'>
                {item.toolId}
              </Text>
            ))}
          </View>

          <Button
            className='run-button'
            onClick={() => {
              void (async () => {
                await clearSession()
                setLoggedIn(false)
                setFavorites([])
                void Taro.showToast({ title: t('common.logout'), icon: 'none' })
              })()
            }}
          >
            {t('common.logout')}
          </Button>
        </>
      ) : (
        <Button
          className='run-button'
          onClick={() => {
            void Taro.navigateTo({ url: '/pages/login/index' })
          }}
        >
          {t('auth.login')}
        </Button>
      )}

      <View className='aaigc-card'>
        <Text className='card-title'>{t('common.about')}</Text>
        <Text className='card-hint'>{t('common.tagline')}</Text>
      </View>
    </View>
  )
}
