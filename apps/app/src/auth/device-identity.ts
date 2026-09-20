// ─────────────────────────────────────────────────────────────────────────────
// 设备标识 —— clientId 与埋点 deviceId 共用同一份稳定标识
//
// 为什么要持久化：clientId 会被写进服务端的 RefreshToken / DeviceCode 记录用于审计。
// 每次登录换一个新值，会让"同一台手机"在服务端变成 N 个客户端，refresh token
// rotation 的重放检测也会失去参考点。
//
// 该值不是机密 → 放 AsyncStorage；只有 token 才进 SecureStore（见 token-store.ts）。
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Crypto from 'expo-crypto'
import type { Platform } from 'shared/types'

export const CLIENT_ID_STORAGE_KEY = 'aaigc.client-id.v1'

/** 只接受我们自己写出的 uuid 形态；被改坏就重新生成 */
const DEVICE_ID_PATTERN = /^[0-9a-fA-F-]{8,64}$/

/**
 * `aaigc-<platform>-<uuid>`，长度 45，
 * 满足 shared/validators/api.ts 的 `clientId: z.string().trim().min(1).max(128)`。
 */
export function formatClientId(platform: Platform, deviceId: string): string {
  return `aaigc-${platform}-${deviceId}`
}

/** 读不到 / 被改坏时重建 —— 登录流程不因设备标识而中断 */
export async function readOrCreateDeviceId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(CLIENT_ID_STORAGE_KEY)
    if (existing !== null && DEVICE_ID_PATTERN.test(existing.trim())) return existing.trim()
  } catch {
    // AsyncStorage 不可用 → 退化为"本次进程内有效"的标识，不阻断登录
  }

  const deviceId = Crypto.randomUUID()
  try {
    await AsyncStorage.setItem(CLIENT_ID_STORAGE_KEY, deviceId)
  } catch {
    // 写不进去也不阻断：本次会话仍能用这个 id 完成登录
  }
  return deviceId
}

export async function readOrCreateClientId(platform: Platform): Promise<string> {
  return formatClientId(platform, await readOrCreateDeviceId())
}
