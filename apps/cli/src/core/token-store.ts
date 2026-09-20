// ─────────────────────────────────────────────────────────────────────────────
// 凭证落盘 —— TokenStore 的文件实现（0600 文件 / 0700 目录，原子写入）
//
// 落点必须**在仓库之外**（用户配置目录），否则 `git status` 会把 token 带进提交。
// 读取一律「校验后使用」：文件被截断 / 被手工改坏 / 结构不认识，都按「未登录」处理
// 并把原因写到 stderr —— 不猜、不修补、不静默。
// ─────────────────────────────────────────────────────────────────────────────

import { chmod, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import type { TokenPair, TokenStore, UserBrief } from 'shared/types/api'
import { CONFIG_DIR_MODE, SECRET_FILE_MODE, TOKEN_FILE_NAME } from './config'
import { errorCode, errorMessage } from './errors'

export interface FileTokenStore extends TokenStore {
  readonly filePath: string
  /** 与 get() 同源；logout 需要 refreshToken 原文，故显式暴露读入口 */
  read(): Promise<TokenPair | null>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseUserBrief(raw: unknown): UserBrief | null {
  if (!isRecord(raw)) return null
  const { id, email, name, role } = raw
  if (typeof id !== 'string' || id.length === 0) return null
  if (typeof role !== 'string' || role.length === 0) return null
  if (email !== null && typeof email !== 'string') return null
  if (name !== null && typeof name !== 'string') return null
  return { id, email, name, role }
}

/** 逐字段校验落盘内容；任何一处不符合 TokenPair 契约都返回 null */
function parseTokenPair(raw: unknown): TokenPair | null {
  if (!isRecord(raw)) return null
  const { accessToken, refreshToken, tokenType, expiresAt } = raw
  if (typeof accessToken !== 'string' || accessToken.length === 0) return null
  if (typeof refreshToken !== 'string' || refreshToken.length === 0) return null
  if (tokenType !== 'Bearer') return null
  if (typeof expiresAt !== 'string' || Number.isNaN(Date.parse(expiresAt))) return null
  const user = parseUserBrief(raw.user)
  if (!user) return null
  return { accessToken, refreshToken, tokenType: 'Bearer', expiresAt, user }
}

async function ensureConfigDir(configDir: string): Promise<void> {
  // 只在自己创建目录时收紧权限：避免把用户显式传入的既有目录（如 ~/.config）改权限
  const existed = existsSync(configDir)
  await mkdir(configDir, { recursive: true, mode: CONFIG_DIR_MODE })
  if (!existed) await chmod(configDir, CONFIG_DIR_MODE)
}

export function createFileTokenStore(
  configDir: string,
  onDiagnostic?: (message: string) => void,
): FileTokenStore {
  const filePath = path.join(configDir, TOKEN_FILE_NAME)

  async function read(): Promise<TokenPair | null> {
    let raw: string
    try {
      raw = await readFile(filePath, 'utf8')
    } catch (error) {
      // 没有文件 = 未登录，不是错误
      if (errorCode(error) !== 'ENOENT') {
        onDiagnostic?.(`Cannot read ${filePath}: ${errorMessage(error)}`)
      }
      return null
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      onDiagnostic?.(`Ignoring corrupted credentials at ${filePath} (invalid JSON)`)
      return null
    }

    const pair = parseTokenPair(parsed)
    if (!pair) {
      onDiagnostic?.(`Ignoring credentials at ${filePath} (unexpected shape)`)
      return null
    }
    return pair
  }

  return {
    filePath,
    read,

    async get(): Promise<TokenPair | null> {
      return read()
    },

    async set(pair: TokenPair): Promise<void> {
      await ensureConfigDir(configDir)
      // 先写临时文件再 rename：避免进程中断留下半截 JSON 把用户「登出」
      const tempPath = `${filePath}.${process.pid}.tmp`
      await writeFile(tempPath, `${JSON.stringify(pair, null, 2)}\n`, {
        encoding: 'utf8',
        mode: SECRET_FILE_MODE,
      })
      await chmod(tempPath, SECRET_FILE_MODE)
      await rename(tempPath, filePath)
    },

    async clear(): Promise<void> {
      await rm(filePath, { force: true })
    },
  }
}
