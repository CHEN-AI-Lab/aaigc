// ─────────────────────────────────────────────────────────────────────────────
// CLI 退出码契约 —— 脚本据此判定结果，语义不得随意扩展
//
//   0  成功
//   1  业务失败（API 报错、工具执行失败、未登录、设备码失效 …）
//   2  用法 / 配置错误（未知命令、非法选项、缺少必需参数、必需配置缺失）
//
// 130 不属于上面三档，仅在收到 SIGINT 时用于「清理后原样中断」。
// ─────────────────────────────────────────────────────────────────────────────

export const EXIT_OK = 0
export const EXIT_FAILURE = 1
export const EXIT_USAGE = 2

export type CliExitCode = typeof EXIT_OK | typeof EXIT_FAILURE | typeof EXIT_USAGE

/** SIGINT 的约定退出码（128 + SIGINT），仅用于中断清理，不属于业务语义 */
export const EXIT_INTERRUPTED = 130
