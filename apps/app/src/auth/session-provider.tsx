// ─────────────────────────────────────────────────────────────────────────────
// 会话 Provider —— Bearer 凭证的生命周期
//
//   启动    读 SecureStore → 有合法 TokenPair 就是已登录
//   401     分两条路（这是本端最容易写错的地方）：
//             · tokenExpired      → shared/api/http-client 自己 refresh 后重试，App 不插手
//             · refresh 失败      → http-client 调 onUnauthorized（这里）→ 清凭证回登录页
//             · tokenInvalid      → http-client **直接抛 ApiError**，不走 onUnauthorized，
//                                   必须由 handleApiError() 兜住，否则界面会卡在"已登录"
//                                   却每个请求都 401 的状态
//   登出     best-effort 调 /api/auth/token/revoke 撤销 refresh token，再清本地
//            （不撤销的话，本地清掉了但服务端那条 refresh 还有 30 天有效期）
// ─────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ApiError } from 'shared/api/http-client'
import type { TokenPair, UserBrief } from 'shared/types/api'
import { clearFavoritesCache } from '../favorites/store'
import { useI18n } from '../i18n/locale-provider'
import { createAppApi, type AppApi } from '../runtime/api'
import { AppConfigError } from '../runtime/env'
import { createSecureTokenStore, type SecureTokenStore } from './token-store'

/** 让"该重新登录了"的错误码集中在一处，避免各调用点各写一份判断 */
const SESSION_DEAD_CODES: ReadonlySet<string> = new Set([
  'tokenInvalid',
  'refreshTokenInvalid',
  'loginRequired',
])

export type SessionStatus = 'loading' | 'signedOut' | 'signedIn'

export interface SessionContextValue {
  status: SessionStatus
  user: UserBrief | null
  /** 站点基址未配置时为 null（此时任何联网动作都应被界面禁用） */
  api: AppApi | null
  /** 非 null 表示 App 处于"未配置"状态，设置页据此给出配置指引 */
  configError: AppConfigError | null
  tokenStore: SecureTokenStore
  signIn: (pair: TokenPair) => Promise<void>
  signOut: () => Promise<void>
  /** 把请求异常归一到会话层：该清凭证就清，其余原样交给调用方展示 */
  handleApiError: (error: unknown) => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }): ReactNode {
  const { locale } = useI18n()
  const tokenStore = useMemo(createSecureTokenStore, [])
  const [status, setStatus] = useState<SessionStatus>('loading')
  const [user, setUser] = useState<UserBrief | null>(null)

  const clearSession = useCallback(async (): Promise<void> => {
    await tokenStore.clear().catch(() => undefined)
    await clearFavoritesCache()
    setUser(null)
    setStatus('signedOut')
  }, [tokenStore])

  // 未配置站点基址 → 不构造 api，也不猜地址；状态由 configError 表达
  const { api, configError } = useMemo((): {
    api: AppApi | null
    configError: AppConfigError | null
  } => {
    try {
      return {
        api: createAppApi({
          store: tokenStore,
          locale,
          onUnauthorized: () => {
            void clearSession()
          },
        }),
        configError: null,
      }
    } catch (error) {
      if (error instanceof AppConfigError) return { api: null, configError: error }
      throw error
    }
  }, [tokenStore, locale, clearSession])

  // 启动引导：有合法凭证就直接进已登录态
  useEffect(() => {
    let alive = true
    tokenStore
      .read()
      .then((pair) => {
        if (!alive) return
        if (pair) {
          setUser(pair.user)
          setStatus('signedIn')
        } else {
          setStatus('signedOut')
        }
      })
      .catch(() => {
        if (alive) setStatus('signedOut')
      })
    return () => {
      alive = false
    }
  }, [tokenStore])

  const signIn = useCallback(
    async (pair: TokenPair): Promise<void> => {
      await tokenStore.set(pair)
      setUser(pair.user)
      setStatus('signedIn')
    },
    [tokenStore],
  )

  const signOut = useCallback(async (): Promise<void> => {
    if (api) {
      const pair = await tokenStore.read().catch(() => null)
      if (pair) {
        // best-effort：撤销失败也要让本地登出成功，不能把用户锁在已登录态
        await api.client
          .post<void>('/api/auth/token/revoke', { refreshToken: pair.refreshToken })
          .catch(() => undefined)
      }
    }
    await clearSession()
  }, [api, tokenStore, clearSession])

  const handleApiError = useCallback(
    (error: unknown): void => {
      if (error instanceof ApiError && SESSION_DEAD_CODES.has(error.code)) {
        void clearSession()
      }
    },
    [clearSession],
  )

  const value = useMemo<SessionContextValue>(
    () => ({ status, user, api, configError, tokenStore, signIn, signOut, handleApiError }),
    [status, user, api, configError, tokenStore, signIn, signOut, handleApiError],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext)
  if (!value) throw new Error('useSession must be used inside <SessionProvider>')
  return value
}

/**
 * 需要联网的界面用它取 api。
 * `api === null` 与 `configError !== null` 在本 Provider 内恒等价（见上面的 useMemo），
 * 因此未配置时抛出的必定是那条真实的配置错误。
 */
export function requireAppApi(session: SessionContextValue): AppApi {
  if (session.api) return session.api
  throw session.configError ?? new AppConfigError({ ok: false, reason: 'missing', raw: '' })
}
