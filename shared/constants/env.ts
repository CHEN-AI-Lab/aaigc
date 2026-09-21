// ─────────────────────────────────────────────────────────────────────────────
// 环境变量读取 —— shared 层唯一入口。
//
// 为什么单独抽出来：小程序端**没有 process 对象**，`process.env` 访问必须先做存在性判断；
// 这个判断散落在多个常量文件里容易漏，故收敛到这一处，其它常量文件统一 import。
// ─────────────────────────────────────────────────────────────────────────────

/** 读取环境变量；运行环境无 process（如小程序）一律返回空串。 */
export function readEnv(name: string): string {
  return typeof process !== 'undefined' && process.env ? (process.env[name] ?? '') : ''
}

/** 逗号分隔 → 去空白 → 过滤空串 */
export function parseList(raw: string): string[] {
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
}
