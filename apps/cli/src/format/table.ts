// ─────────────────────────────────────────────────────────────────────────────
// 纯文本表格渲染（CJK 对齐）
//
// 边框属于「交互装饰」：stdout 不是 TTY（被管道接走）时必须退化成
// 双空格分隔的纯文本，保证 `aaigc tools list | cut -d' ' -f1` 之类可用。
// ─────────────────────────────────────────────────────────────────────────────

import { padEndWidth, displayWidth } from './width'

export interface TableOptions {
  /** false = 无边框（管道场景），列间用两个空格分隔 */
  borders: boolean
}

function cellWidths(headers: readonly string[], rows: readonly string[][]): number[] {
  return headers.map((header, column) => {
    let width = displayWidth(header)
    for (const row of rows) {
      width = Math.max(width, displayWidth(row[column] ?? ''))
    }
    return width
  })
}

function renderRow(cells: readonly string[], widths: readonly number[]): string {
  return cells.map((cell, index) => padEndWidth(cell, widths[index] ?? 0)).join('  ').trimEnd()
}

export function renderTable(
  headers: readonly string[],
  rows: readonly string[][],
  options: TableOptions,
): string {
  if (headers.length === 0) return ''
  const widths = cellWidths(headers, rows)

  if (!options.borders) {
    return [renderRow(headers, widths), ...rows.map((row) => renderRow(row, widths))].join('\n')
  }

  const line = (left: string, mid: string, right: string): string =>
    `${left}${widths.map((width) => '─'.repeat(width + 2)).join(mid)}${right}`

  const body = rows.map((row) => {
    const cells = widths.map((width, index) => ` ${padEndWidth(row[index] ?? '', width)} `)
    return `│${cells.join('│')}│`
  })

  return [
    line('┌', '┬', '┐'),
    `│${widths.map((width, index) => ` ${padEndWidth(headers[index] ?? '', width)} `).join('│')}│`,
    line('├', '┼', '┤'),
    ...body,
    line('└', '┴', '┘'),
  ].join('\n')
}
