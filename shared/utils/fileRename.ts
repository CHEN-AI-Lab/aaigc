// ─── Types ─────────────────────────────────────

export interface FileWithPath {
  /** Original filename (e.g. "IMG_1234.jpg") */
  name: string
  /** Full relative path (e.g. "2024-photos/IMG_1234.jpg") */
  path: string
}

export type RenameRuleType =
  | 'findReplace'
  | 'prefix'
  | 'suffix'
  | 'numbering'
  | 'case'
  | 'clean'
  | 'regex'
  | 'keepNumber'
  | 'deleteBefore'
  | 'deleteAfter'
  | 'numberFolders'

export interface FindReplaceRule {
  type: 'findReplace'
  find: string
  replace: string
  folderMode?: boolean
  folderLevel?: number
}

export interface DeleteBeforeRule {
  type: 'deleteBefore'
  text: string
  folderMode?: boolean
  folderLevel?: number
}

export interface DeleteAfterRule {
  type: 'deleteAfter'
  text: string
  folderMode?: boolean
  folderLevel?: number
}

export interface PrefixRule {
  type: 'prefix'
  text: string
  folderMode?: boolean
  folderLevel?: number
}

export interface SuffixRule {
  type: 'suffix'
  text: string
  folderMode?: boolean
  folderLevel?: number
}

export interface NumberingRule {
  type: 'numbering'
  start: number
  digits: number
  position: 'prefix' | 'suffix'
  replaceOriginal?: boolean
  perFolder?: boolean
  folderMode?: boolean
  folderLevel?: number
}

export interface CaseRule {
  type: 'case'
  mode: 'upper' | 'lower' | 'capitalize'
  folderMode?: boolean
  folderLevel?: number
}

export interface CleanRule {
  type: 'clean'
  removeSpaces: boolean
  removeSpecialChars: boolean
  spaceReplacement: string
  folderMode?: boolean
  folderLevel?: number
}

export interface RegexRule {
  type: 'regex'
  pattern: string
  replacement: string
  folderMode?: boolean
  folderLevel?: number
}

export interface KeepNumberRule {
  type: 'keepNumber'
  digits: number
  position: 'prefix' | 'suffix'
  folderMode?: boolean
  folderLevel?: number
}

export interface NumberFoldersRule {
  type: 'numberFolders'
  start: number
  digits: number
  level?: number
  perFolder?: boolean
  folderMode?: boolean
  folderLevel?: number
}

export type RenameRule =
  | FindReplaceRule
  | DeleteBeforeRule
  | DeleteAfterRule
  | PrefixRule
  | SuffixRule
  | NumberingRule
  | CaseRule
  | CleanRule
  | RegexRule
  | KeepNumberRule
  | NumberFoldersRule

export interface PreviewItem {
  id: string
  originalPath: string
  originalName: string
  newPath: string
  newName: string
  /** true if this new name collides with another file's new name */
  conflict: boolean
  /** true if the name actually changed */
  changed: boolean
}

// ─── Helpers ───────────────────────────────────

let _idCounter = 0
function uid(): string {
  return `fr_${++_idCounter}`
}

/**
 * Split "IMG_1234.jpg" into ["IMG_1234", ".jpg"].
 * Handles dotfiles ("file" → ["file", ""]), multiple extensions (".tar.gz" → treated as one).
 */
function splitName(name: string): [string, string] {
  const dot = name.lastIndexOf('.')
  if (dot <= 0) return [name, ''] // dotfiles or no extension
  return [name.slice(0, dot), name.slice(dot)]
}

function padNumber(n: number, digits: number): string {
  return String(n).padStart(digits, '0')
}

// ─── Rule application ──────────────────────────

function applyRule(baseName: string, rule: RenameRule, index: number, _all: string[]): string {
  switch (rule.type) {
    case 'findReplace':
      return baseName.split(rule.find).join(rule.replace)

    case 'deleteBefore': {
      const idx = baseName.indexOf(rule.text)
      return idx >= 0 ? baseName.slice(idx) : baseName
    }

    case 'deleteAfter': {
      const idx = baseName.indexOf(rule.text)
      return idx >= 0 ? baseName.slice(0, idx + rule.text.length) : baseName
    }

    case 'prefix':
      return rule.text + baseName

    case 'suffix':
      return baseName + rule.text

    case 'numbering': {
      const num = padNumber(rule.start + index, rule.digits)
      if (rule.replaceOriginal) return num
      return rule.position === 'prefix' ? num + baseName : baseName + num
    }

    case 'case': {
      switch (rule.mode) {
        case 'upper':
          return baseName.toUpperCase()
        case 'lower':
          return baseName.toLowerCase()
        case 'capitalize':
          // Capitalize first letter of each word (separated by non-letters)
          return baseName.replace(/\b[a-z]/g, (c) => c.toUpperCase())
      }
    }

    case 'clean': {
      let s = baseName
      if (rule.removeSpaces) {
        s = s.replace(/\s+/g, rule.spaceReplacement || '')
      }
      if (rule.removeSpecialChars) {
        // Build a set of allowed chars: letters, numbers, CJK, kana, hangul, hyphens, underscores
        // If removeSpaces is false, also keep spaces
        const allowed = rule.removeSpaces
          ? /[^a-zA-Z0-9\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af_-]/g
          : /[^a-zA-Z0-9\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af_-\s]/g
        s = s.replace(allowed, '')
      }
      return s
    }

    case 'regex': {
      try {
        return baseName.replace(new RegExp(rule.pattern, 'g'), rule.replacement)
      } catch {
        return baseName // invalid regex, leave unchanged
      }
    }

    case 'keepNumber': {
      const nums = baseName.match(/\d+/g)
      if (!nums) return baseName
      const num = padNumber(parseInt(nums[0], 10), rule.digits)
      return rule.position === 'prefix' ? num + baseName : baseName + num
    }

    default:
      return baseName // renameFolder rules are handled separately
  }
}

// ─── Public API ────────────────────────────────

/** Sort names: English first, then Chinese by pinyin, then others. */
function compareNames(a: string, b: string): number {
  const isEngA = /^[a-zA-Z]/.test(a)
  const isEngB = /^[a-zA-Z]/.test(b)
  if (isEngA !== isEngB) return isEngA ? -1 : 1
  const isCnA = /[\u4e00-\u9fff]/.test(a)
  const isCnB = /[\u4e00-\u9fff]/.test(b)
  if (isCnA && isCnB) return a.localeCompare(b, 'zh-CN', { numeric: true })
  return a.localeCompare(b, 'en', { numeric: true })
}

/**
 * Apply a rule with folderMode enabled to each folder segment in a path.
 */
function applyRuleToFolderSegments(path: string, rule: RenameRule, fileIndex: number, allNames: string[]): string {
  const parts = path.split('/')
  const level = rule.folderLevel ?? 1
  if (parts.length <= level) return path // not enough segments
  parts[level] = applyRule(parts[level], rule, fileIndex, allNames)
  return parts.join('/')
}

/**
 * Apply a list of rename rules to a set of files.
 * Rules are applied in order, each building on the previous result.
 * Returns a preview array with conflict detection.
 */

export function applyRules(
  files: FileWithPath[],
  rules: RenameRule[],
  renameFolder = false,
  newFolderName = '',
): PreviewItem[] {
  // Determine folder prefix from common path prefix
  const commonPrefix = renameFolder && newFolderName
    ? getCommonPrefix(files.map(f => f.path))
    : ''

  // Collect all new names first for conflict detection
  const newNames: string[] = []

  // Separate rules: normal file rules, folder-mode rules, and numberFolders
  const fileRules = rules.filter(r => r.type !== 'numberFolders' && !r.folderMode)
  const folderModeRules = rules.filter(r => r.folderMode && r.type !== 'numberFolders')
  const numberFolderRules = rules.filter(r => r.type === 'numberFolders') as NumberFoldersRule[]

  // Pre-compute folder numbering mapping
  let folderNumberMap: Record<string, string> | null = null
  if (numberFolderRules.length > 0) {
    const nf = numberFolderRules[0] // use first rule
    const folderLevel = nf.level ?? 1
    const usePerFolder = nf.perFolder ?? false

    if (usePerFolder) {
      // Per-folder: group by parent, number subfolders within each parent separately
      folderNumberMap = {}
      const parentGroups: Record<string, Set<string>> = {}
      for (const file of files) {
        const parts = file.path.split('/')
        if (parts.length <= folderLevel + 1) continue
        // Parent is the path up to folderLevel - 1
        const parent = parts.slice(0, folderLevel).join('/')
        if (!parentGroups[parent]) parentGroups[parent] = new Set()
        parentGroups[parent].add(parts[folderLevel])
      }
      // Number each group separately
      for (const [parent, nameSet] of Object.entries(parentGroups)) {
        const sorted = Array.from(nameSet).sort((a, b) => compareNames(a, b))
        sorted.forEach((name, i) => {
          folderNumberMap![`${parent}/${name}`] = padNumber(nf.start + i, nf.digits)
        })
      }
    } else {
      // Global: collect all unique folder names at the specified level
      const folderNames = new Set<string>()
      for (const file of files) {
        const parts = file.path.split('/')
        if (parts.length <= folderLevel + 1) continue
        folderNames.add(parts[folderLevel])
      }
      const sorted = Array.from(folderNames).sort((a, b) => compareNames(a, b))
      folderNumberMap = {}
      sorted.forEach((name, i) => {
        folderNumberMap![name] = padNumber(nf.start + i, nf.digits)
      })
    }
  }

  // Pre-compute per-folder numbering indices
  let folderIndexMap: Record<string, number> | null = null
  const hasPerFolder = rules.some(r => r.type === 'numbering' && r.perFolder)
  if (hasPerFolder) {
    folderIndexMap = {}
    const folderCounts: Record<string, number> = {}
    for (const file of files) {
      const dir = file.path.includes('/') ? file.path.slice(0, file.path.lastIndexOf('/')) : ''
      if (!folderCounts[dir]) folderCounts[dir] = 0
      folderIndexMap[file.path] = folderCounts[dir]
      folderCounts[dir]++
    }
  }

  const items: PreviewItem[] = files.map((file, fileIndex) => {
    const [baseName, ext] = splitName(file.name)
    let newBase = baseName

    for (const rule of fileRules) {
      // For per-folder numbering, use the folder-specific index instead of global index
      const effectiveIndex = (rule.type === 'numbering' && rule.perFolder && folderIndexMap)
        ? folderIndexMap[file.path]
        : fileIndex
      newBase = applyRule(newBase, rule, effectiveIndex, newNames)
    }

    const newName = newBase + ext
    newNames.push(newName)

    let newPath = file.path
    if (commonPrefix && newFolderName) {
      newPath = newFolderName + file.path.slice(commonPrefix.length)
    }
    // Replace the filename part of the path
    const lastSlash = newPath.lastIndexOf('/')
    newPath = lastSlash >= 0
      ? newPath.slice(0, lastSlash + 1) + newName
      : newName

    // Apply folder numbering
    if (folderNumberMap) {
      const nf = numberFolderRules[0]
      const folderLevel = nf.level ?? 1
      const usePerFolder = nf.perFolder ?? false
      const parts = newPath.split('/')
      if (parts.length > folderLevel) {
        const oldName = parts[folderLevel]
        // For per-folder mode, use parentPath/name as key; otherwise use just name
        const key = usePerFolder
          ? parts.slice(0, folderLevel).join('/') + '/' + oldName
          : oldName
        const newName = folderNumberMap[key]
        if (newName) {
          parts[folderLevel] = newName
          newPath = parts.join('/')
        }
      }
    }

    // Apply folder-mode rules to folder segments
    for (const rule of folderModeRules) {
      newPath = applyRuleToFolderSegments(newPath, rule, fileIndex, newNames)
    }

    const origPath = file.path
    // Rebuild newPath without filename for folder-only change detection
    const origDir = lastSlash >= 0 ? origPath.slice(0, lastSlash + 1) : ''
    const newDir = lastSlash >= 0 ? newPath.slice(0, newPath.lastIndexOf('/') + 1) : ''

    return {
      id: uid(),
      originalPath: file.path,
      originalName: file.name,
      newPath,
      newName,
      conflict: false,
      changed: newName !== file.name || origDir !== newDir,
    }
  })

  // Conflict detection: same newName in the same directory
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (items[i].newPath === items[j].newPath) {
        items[i].conflict = true
        items[j].conflict = true
      }
    }
  }

  return items
}

/**
 * Extract the common directory prefix from a list of paths.
 * E.g. ["2024-photos/1.jpg", "2024-photos/sub/2.jpg"] → "2024-photos/"
 */
function getCommonPrefix(paths: string[]): string {
  if (paths.length === 0) return ''
  const firstSlash = paths[0].indexOf('/')
  if (firstSlash < 0) return ''
  const candidate = paths[0].slice(0, firstSlash + 1)
  return paths.every(p => p.startsWith(candidate)) ? candidate : ''
}