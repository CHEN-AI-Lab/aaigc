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
import { View, Text, Picker, Button } from '@tarojs/components'

import { useI18n } from '../../runtime/i18n'
import { apiBaseUrl, isApiBaseUrlConfigured } from '../../runtime/env'

export default function Me() {
  const { locale, t, setLocale, supportedLocales, localeNames, followingSystem } = useI18n()

  const options = supportedLocales.map((code) => localeNames[code] ?? code)
  const currentIndex = Math.max(0, supportedLocales.indexOf(locale))

  return (
    <View className='page'>
      <View className='aaigc-card'>
        <Text className='card-title'>{t('auth.account')}</Text>
        <Text className='card-hint'>
          {isApiBaseUrlConfigured() ? apiBaseUrl() : t('ui.apiBaseMissing')}
        </Text>
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

      <Button
        className='run-button'
        onClick={() => {
          void Taro.navigateTo({ url: '/pages/login/index' })
        }}
      >
        {t('auth.login')}
      </Button>

      <View className='aaigc-card'>
        <Text className='card-title'>{t('common.about')}</Text>
        <Text className='card-hint'>{t('common.tagline')}</Text>
      </View>
    </View>
  )
}
