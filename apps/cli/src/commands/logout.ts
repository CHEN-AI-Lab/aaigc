// `aaigc logout` —— 撤销服务端 refresh token 并清除本地凭证
//
// 语义取舍：
//   · 本地清除是「登出」的本质，必须无条件成功；
//   · 服务端 revoke（POST /api/auth/token/revoke，RFC 7009 幂等，204）失败只告警，
//     不让用户陷入「点了登出却还留着凭证」的更差状态。
// 未配置 AAIGC_API_BASE_URL 时不猜地址，只告警说明「服务端撤销被跳过」。

import { createApiClient } from 'shared/api/http-client'
import { API_BASE_URL_ENV, CLI_PLATFORM } from '../core/config'
import { errorMessage } from '../core/errors'
import { createFileTokenStore } from '../core/token-store'
import type { CommandContext } from './types'

export async function logoutCommand(ctx: CommandContext): Promise<void> {
  const store = createFileTokenStore(ctx.config.configDir, (message) => ctx.io.diag(message))
  const pair = await store.read()

  if (!pair) {
    if (ctx.io.json) ctx.io.writeJson({ loggedOut: true })
    else ctx.io.write(ctx.translator.t('cli.logoutNotSignedIn'))
    return
  }

  if (ctx.config.apiBaseUrl.length === 0) {
    ctx.io.warn(
      `${ctx.translator.t('cli.logoutRevokeFailed')} ${ctx.translator.t('cli.hintApiBaseUrl', { env: API_BASE_URL_ENV })}`,
    )
  } else {
    try {
      const client = createApiClient({
        baseUrl: ctx.config.apiBaseUrl,
        tokenStore: store,
        platform: CLI_PLATFORM,
        locale: ctx.config.lang,
      })
      await client.post('/api/auth/token/revoke', { refreshToken: pair.refreshToken })
    } catch (error) {
      ctx.io.warn(`${ctx.translator.t('cli.logoutRevokeFailed')} (${errorMessage(error)})`)
    }
  }

  await store.clear()

  if (ctx.io.json) ctx.io.writeJson({ loggedOut: true })
  else ctx.io.write(ctx.translator.t('cli.logoutDone'))
}
