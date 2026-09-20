/**
 * 把任意抛出物转成一句可读文案。
 *
 * Tauri 命令失败时 reject 的是 Rust 侧 `Err(String)` 的**字符串**，不是 Error，
 * 所以不能只判断 `instanceof Error`。
 */
export function errorText(error: unknown): string {
  if (typeof error === 'string') {
    return error
  }

  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}
