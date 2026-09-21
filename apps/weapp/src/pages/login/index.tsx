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
import { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, Button } from '@tarojs/components'

import { apiBaseUrl, clientId, isApiBaseUrlConfigured } from '../../runtime/env'
import { useI18n } from '../../runtime/i18n'

const TOKEN_STORAGE_KEY = 'aaigc.weapp.token'

interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresAt?: string
}

/** 设备码轮询的终态错误码 —— 出现即停止轮询（架构 §4.2.3） */
const TERMINAL_CODES = new Set([
  'deviceCodeExpired',
  'deviceCodeNotFound',
  'deviceCodeConsumed',
  'missingDeviceCode',
  'missingClientId',
  'grantTypeUnsupported',
])

export default function Login() {
  const { t } = useI18n()
  const [phase, setPhase] = useState<'idle' | 'requesting' | 'waiting' | 'done' | 'error'>('idle')
  const [userCode, setUserCode] = useState('')
  const [message, setMessage] = useState('')

  // deviceCode 只用于轮询，不展示给用户，所以用 ref 而不是 state（避免触发无谓渲染）
  const deviceCodeRef = useRef('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => stopPolling, [stopPolling])

  const requestCode = async () => {
    if (!isApiBaseUrlConfigured()) {
      setPhase('error')
      setMessage(t('ui.apiBaseMissing'))
      return
    }

    setPhase('requesting')
    setMessage(t('ui.requestingCode'))

    try {
      const response = await Taro.request({
        url: `${apiBaseUrl()}/api/auth/device/code`,
        method: 'POST',
        data: { clientId: clientId() },
        dataType: 'json',
      })

      const body = response.data as
        | { deviceCode?: string; userCode?: string }
        | { error?: string }
        | null

      if (response.statusCode >= 400 || !body || !('deviceCode' in body)) {
        const code = body && 'error' in body ? String(body.error ?? '') : ''
        setPhase('error')
        setMessage(code ? t(`errors.${code}`) : `HTTP ${response.statusCode}`)
        return
      }

      deviceCodeRef.current = String(body.deviceCode ?? '')
      setUserCode(String(body.userCode ?? ''))
      setPhase('waiting')
      setMessage(t('ui.waitingApproval'))
      startPolling()
    } catch (error) {
      setPhase('error')
      setMessage(`ERROR: ${(error as Error).message}`)
    }
  }

  const startPolling = () => {
    stopPolling()
    timerRef.current = setInterval(() => {
      void pollOnce()
    }, 3000)
  }

  const pollOnce = async () => {
    const deviceCode = deviceCodeRef.current
    if (deviceCode.length === 0) return

    try {
      const response = await Taro.request({
        url: `${apiBaseUrl()}/api/auth/device/token`,
        method: 'POST',
        data: { deviceCode },
        dataType: 'json',
      })

      const body = response.data as (TokenPair & { error?: string }) | null

      if (response.statusCode === 200 && body && 'accessToken' in body) {
        stopPolling()
        try {
          Taro.setStorageSync(TOKEN_STORAGE_KEY, body)
        } catch {
          // 存储失败不阻断登录流程（本次会话仍可用）
        }
        setPhase('done')
        setMessage(t('ui.loginSuccess'))
        return
      }

      const code = body?.error ?? ''
      // authorizationPending（以及 429 限流）不是终态，继续轮询
      if (TERMINAL_CODES.has(code)) {
        stopPolling()
        setPhase('error')
        setMessage(t(`errors.${code}`))
      }
    } catch {
      // 网络抖动：保持轮询，不切换状态（轮询会自然重试）
    }
  }

  return (
    <View className='page'>
      <View className='aaigc-card'>
        <Text className='card-title'>{t('ui.login')}</Text>
        {userCode.length > 0 ? (
          <Text className='card-code' selectable>
            {userCode}
          </Text>
        ) : null}
        <Text className='card-hint'>{message}</Text>
      </View>

      {phase !== 'done' ? (
        <Button
          className='run-button'
          loading={phase === 'requesting' || phase === 'waiting'}
          disabled={phase === 'requesting' || phase === 'waiting'}
          onClick={() => void requestCode()}
        >
          {t('ui.getDeviceCode')}
        </Button>
      ) : null}

      {userCode.length > 0 && phase !== 'done' ? (
        <Button
          className='copy-button'
          onClick={() => void Taro.setClipboardData({ data: userCode })}
        >
          {t('ui.copy')}
        </Button>
      ) : null}

      {userCode.length > 0 && phase !== 'done' ? (
        <View className='aaigc-card'>
          <Text className='card-hint'>{t('ui.openInBrowser')}</Text>
        </View>
      ) : null}
    </View>
  )
}
