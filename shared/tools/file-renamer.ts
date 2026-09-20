// file-renamer —— T1 纯计算：批量重命名规则引擎
// 规则引擎已在 shared/utils/fileRename.ts（既有真源），本模块只做输入适配与结果渲染，
// 不复制任何规则逻辑。

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolFail, toolOk } from './common'
import type { FileWithPath, PreviewItem, RenameRule } from '../utils/fileRename'
import { applyRules } from '../utils/fileRename'

export interface FileRenamerInput {
  files: FileWithPath[]
  rules: RenameRule[]
  renameFolder: boolean
  newFolderName: string
}

export interface FileRenamerOutput {
  items: PreviewItem[]
  changed: number
  conflicts: number
}

function isFileWithPath(value: unknown): value is FileWithPath {
  if (value === null || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return typeof record.name === 'string' && typeof record.path === 'string'
}

export function parseFileRenamer(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<FileRenamerInput> {
  const rawFiles = raw.files
  if (!Array.isArray(rawFiles) || rawFiles.length === 0) {
    return toolFail('emptyInput', 'tools.emptyInput')
  }
  const files: FileWithPath[] = []
  for (const item of rawFiles) {
    if (!isFileWithPath(item)) return toolFail('invalidInput', 'tools.invalidInput')
    files.push({ name: item.name, path: item.path })
  }
  const rawRules = raw.rules
  const rules: RenameRule[] = Array.isArray(rawRules) ? (rawRules as RenameRule[]) : []
  return toolOk({
    files,
    rules,
    renameFolder: raw.renameFolder === true,
    newFolderName: typeof raw.newFolderName === 'string' ? raw.newFolderName : '',
  })
}

export function runFileRenamer(
  input: FileRenamerInput,
  _ctx: ToolContext,
): ToolOutcome<FileRenamerOutput> {
  const items = applyRules(input.files, input.rules, input.renameFolder, input.newFolderName)
  let changed = 0
  let conflicts = 0
  for (const item of items) {
    if (item.newName !== item.originalName) changed++
    if (item.conflict) conflicts++
  }
  return toolOk({ items, changed, conflicts })
}

export function renderFileRenamer(out: FileRenamerOutput, _ctx: ToolContext): string {
  return out.items
    .map((item) => `${item.originalName}\t->\t${item.newName}${item.conflict ? '\t(conflict)' : ''}`)
    .join('\n')
}

export const fileRenamerTool: ToolDefinition<FileRenamerInput, FileRenamerOutput> = {
  id: 'file-renamer',
  tier: 'T1',
  capabilities: [],
  inputs: [
    { name: 'files', kind: 'file', required: true, labelKey: 'tools.files' },
    { name: 'rules', kind: 'textarea', required: false, labelKey: 'tools.rules' },
    { name: 'renameFolder', kind: 'boolean', required: false, labelKey: 'tools.renameFolder', default: false },
    { name: 'newFolderName', kind: 'text', required: false, labelKey: 'tools.newFolderName' },
  ],
  parse: parseFileRenamer,
  run: runFileRenamer,
  render: renderFileRenamer,
}
