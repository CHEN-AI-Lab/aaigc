// `aaigc favorites list` / `aaigc favorites add|remove <toolId>`
//
// 收藏的服务端是唯一真源（shared/api/favorites.ts），CLI 只做读写与展示：
//   list   → GET  /api/favorites[?since=<ISO>]（增量拉取）
//   add    → POST /api/favorites { toolId, type, action }
//   remove → 同上，action = 'remove'
// 请求体一律先过 shared/validators/api.ts 的 schema，与 Web route 用的是同一份契约。

import { favoritePostSchema, parseOrFail } from 'shared/validators/api'
import { createCliApi } from '../core/api-client'
import type { CliArgValues } from '../core/args'
import { requireApiBaseUrl } from '../core/config'
import { failureError, usageErrorFor } from '../core/errors'
import { createFileTokenStore } from '../core/token-store'
import { renderTable } from '../format/table'
import { localizedToolName } from './tool-label'
import type { CommandContext } from './types'

/**
 * 收藏全部需要登录。
 *
 * 先读本地凭证再发请求：没有凭证时服务端只会回一个 401 tokenExpired，
 * 对用户来说「访问令牌已过期」是误导 —— 他从来没登录过。这里提前拦下，
 * 用 shared 的 loginRequired（401 语义）报错，并附上可执行的登录提示。
 */
async function buildApi(ctx: CommandContext) {
  const baseUrl = requireApiBaseUrl(ctx.config, ctx.translator)
  const store = createFileTokenStore(ctx.config.configDir, (message) => ctx.io.diag(message))
  if ((await store.read()) === null) {
    throw failureError('loginRequired', undefined, ctx.translator.c('hintLoginRequired'))
  }
  return createCliApi({ ...ctx.config, apiBaseUrl: baseUrl }, store, ctx.io, ctx.translator)
}

function normalizeSince(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined
  if (Number.isNaN(Date.parse(raw))) {
    throw usageErrorFor('invalidParams', undefined, `Invalid --since value: ${raw}`)
  }
  return raw
}

export async function favoritesListCommand(ctx: CommandContext, values: CliArgValues): Promise<void> {
  const api = await buildApi(ctx)
  const snapshot = await api.favorites.list(normalizeSince(values.since))

  if (ctx.io.json) {
    ctx.io.writeJson({ favorites: snapshot.favorites, serverTime: snapshot.serverTime })
    return
  }

  if (snapshot.favorites.length === 0) {
    ctx.io.write(ctx.translator.c('favoritesEmpty'))
    return
  }

  const { translator } = ctx
  const rows = snapshot.favorites.map((item) => [
    localizedToolName(translator, item.toolId),
    item.type,
    item.createdAt,
  ])
  ctx.io.write(
    renderTable(
      [translator.c('favoritesColTool'), translator.c('favoritesColType'), translator.c('favoritesColCreated')],
      rows,
      { borders: ctx.io.stdoutIsTty },
    ),
  )
}

async function mutate(
  ctx: CommandContext,
  action: 'add' | 'remove',
  positionals: string[],
  values: CliArgValues,
): Promise<void> {
  const toolId = positionals[0]
  if (toolId === undefined || toolId.length === 0) throw usageErrorFor('missingToolId')

  const parsed = parseOrFail(favoritePostSchema, {
    toolId,
    type: values.type ?? 'tool',
    action,
  })
  if (!parsed.ok) {
    throw usageErrorFor(
      'invalidParams',
      undefined,
      `favorites payload rejected by shared validator: ${toolId} / ${values.type ?? 'tool'}`,
    )
  }

  const api = await buildApi(ctx)
  const result = await api.favorites.mutate(parsed.data.toolId, parsed.data.action, parsed.data.type)

  if (ctx.io.json) {
    ctx.io.writeJson({ isFavorited: result.isFavorited })
    return
  }
  ctx.io.write(
    ctx.translator.c(action === 'add' ? 'favoritesAdded' : 'favoritesRemoved', {
      toolId: parsed.data.toolId,
    }),
  )
}

export async function favoritesAddCommand(
  ctx: CommandContext,
  positionals: string[],
  values: CliArgValues,
): Promise<void> {
  await mutate(ctx, 'add', positionals, values)
}

export async function favoritesRemoveCommand(
  ctx: CommandContext,
  positionals: string[],
  values: CliArgValues,
): Promise<void> {
  await mutate(ctx, 'remove', positionals, values)
}
