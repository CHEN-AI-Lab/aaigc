// ─────────────────────────────────────────────────────────────────────────────
// 设备标识 —— device flow 的 clientId 与埋点 deviceId 共用同一份稳定标识
//
// 为什么要持久化：device/code 的 clientId 会被写进 RefreshToken 记录用于审计，
// 每次登录都换一个新值会让「同一台设备」在服务端变成 N 个客户端。
// 该文件不是密钥，但仍按 0600 落盘，避免同机其它用户读到设备指纹。
// ─────────────────────────────────────────────────────────────────────────────

import { randomUUID } from 'node:crypto'
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { CONFIG_DIR_MODE, DEVICE_ID_FILE_NAME, SECRET_FILE_MODE } from './config'

/** 只接受我们自己写出的 uuid 形态，被改坏就重新生成 */
const DEVICE_ID_PATTERN = /^[0-9a-fA-F-]{8,64}$/

export async function readOrCreateDeviceId(configDir: string): Promise<string> {
  const filePath = path.join(configDir, DEVICE_ID_FILE_NAME)

  try {
    const existing = (await readFile(filePath, 'utf8')).trim()
    if (DEVICE_ID_PATTERN.test(existing)) return existing
  } catch {
    // 文件不存在 / 不可读 / 内容被改坏 —— 一律重建，登录流程不因设备标识而中断
  }

  const deviceId = randomUUID()
  const existed = existsSync(configDir)
  await mkdir(configDir, { recursive: true, mode: CONFIG_DIR_MODE })
  if (!existed) await chmod(configDir, CONFIG_DIR_MODE)
  await writeFile(filePath, `${deviceId}\n`, { encoding: 'utf8', mode: SECRET_FILE_MODE })
  return deviceId
}

/**
 * device flow 的 clientId：`aaigc-cli-<uuid>`，长度 45，
 * 满足 shared/validators/api.ts 的 `clientId: z.string().trim().min(1).max(128)`。
 */
export async function readOrCreateClientId(configDir: string): Promise<string> {
  const deviceId = await readOrCreateDeviceId(configDir)
  return `aaigc-cli-${deviceId}`
}
