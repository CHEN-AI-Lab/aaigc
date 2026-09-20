// ─────────────────────────────────────────────────────────────────────────────
// JSON 输出 —— `--json` 模式唯一的 stdout 形态，不得夹带任何装饰性文字
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 2 空格缩进的可解析 JSON。
 *
 * `JSON.stringify(undefined)` 会返回 undefined（不是字符串），直接写 stdout 会
 * 变成空输出且没有换行，脚本解析起来会当成「截断」。这里统一收敛成 `null`。
 */
export function renderJson(value: unknown): string {
  const text = JSON.stringify(value, null, 2)
  return text === undefined ? 'null' : text
}
