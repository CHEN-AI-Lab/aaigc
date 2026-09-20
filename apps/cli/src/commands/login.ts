// `aaigc login` —— device flow 登录
//
// 没有浏览器回调通道，所以整条链路是：
//   device/code（拿 userCode + 验证地址）→ 用户在浏览器确认 → 轮询 device/token
// 拿到 TokenPair 后立刻按 0600 落盘到用户配置目录，绝不写进仓库。

import { createApiClient } from 'shared/api/http-client'
import type { UserBrief } from 'shared/types/api'
import { CLI_PLATFORM, requireApiBaseUrl } from '../core/config'
import { runDeviceFlow } from '../core/device-flow'
import { readOrCreateClientId } from '../core/device-id'
import { createFileTokenStore } from '../core/token-store'
import type { CommandContext } from './types'

function displayName(user: UserBrief): string {
  return user.name ?? user.email ?? user.id
}

export async function loginCommand(ctx: CommandContext): Promise<void> {
  const baseUrl = requireApiBaseUrl(ctx.config, ctx.translator)
  const store = createFileTokenStore(ctx.config.configDir, (message) => ctx.io.diag(message))
  const clientId = await readOrCreateClientId(ctx.config.configDir)

  // 登录前必然没有凭证，tokenStore.get() 返回 null，客户端不会带 Authorization
  const client = createApiClient({
    baseUrl,
    tokenStore: store,
    platform: CLI_PLATFORM,
    locale: ctx.config.lang,
  })

  const { pair, device } = await runDeviceFlow({
    client,
    clientId,
    io: ctx.io,
    translator: ctx.translator,
  })

  await store.set(pair)

  if (ctx.io.json) {
    // 只回非敏感字段：token 绝不进 stdout（会被 shell 历史 / CI 日志留存）
    ctx.io.writeJson({
      user: pair.user,
      expiresAt: pair.expiresAt,
      userCode: device.userCode,
      verificationUri: device.verificationUri,
    })
    return
  }
  ctx.io.write(ctx.translator.c('loginApproved', { name: displayName(pair.user) }))
}
