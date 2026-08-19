'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import JSZip from 'jszip'
import {
  applyRules,
  type FileWithPath,
  type RenameRule,
  type RenameRuleType,
  type PreviewItem,
} from 'shared/utils/fileRename'


// ─── Rule with all fields (for UI rendering without narrowing) ──
type RuleWithFields = RenameRule & {
  find?: string
  replace?: string
  text?: string
  start?: number
  digits?: number
  level?: number
  position?: string
  mode?: string
  removeSpaces?: boolean
  removeSpecialChars?: boolean
  spaceReplacement?: string
  pattern?: string
  replacement?: string
  replaceOriginal?: boolean
  perFolder?: boolean
  folderMode?: boolean
  folderLevel?: number
}

// ─── Rule type config ──────────────────────────

interface RuleConfig {
  type: RenameRuleType
  labelKey: string
  hasFind: boolean
  hasReplace: boolean
  hasText: boolean
  hasDelete: boolean
  hasStart: boolean
  hasDigits: boolean
  hasPosition: boolean
  hasMode: boolean
  hasRemoveSpaces: boolean
  hasRemoveSpecial: boolean
  hasSpaceReplacement: boolean
  hasPattern: boolean
  hasReplacement: boolean
  hasReplaceOriginal: boolean
  hasFolderMode: boolean
}

const ruleConfigs: RuleConfig[] = [
  { type: 'findReplace', labelKey: 'ruleFindReplace', hasFind: true, hasReplace: true, hasText: false, hasDelete: false, hasStart: false, hasDigits: false, hasPosition: false, hasMode: false, hasRemoveSpaces: false, hasRemoveSpecial: false, hasSpaceReplacement: false, hasPattern: false, hasReplacement: false, hasReplaceOriginal: false, hasFolderMode: true },
  { type: 'prefix', labelKey: 'rulePrefix', hasFind: false, hasReplace: false, hasText: true, hasDelete: false, hasStart: false, hasDigits: false, hasPosition: false, hasMode: false, hasRemoveSpaces: false, hasRemoveSpecial: false, hasSpaceReplacement: false, hasPattern: false, hasReplacement: false, hasReplaceOriginal: false, hasFolderMode: true },
  { type: 'suffix', labelKey: 'ruleSuffix', hasFind: false, hasReplace: false, hasText: true, hasDelete: false, hasStart: false, hasDigits: false, hasPosition: false, hasMode: false, hasRemoveSpaces: false, hasRemoveSpecial: false, hasSpaceReplacement: false, hasPattern: false, hasReplacement: false, hasReplaceOriginal: false, hasFolderMode: true },
  { type: 'numbering', labelKey: 'ruleNumbering', hasFind: false, hasReplace: false, hasText: false, hasDelete: false, hasStart: true, hasDigits: true, hasPosition: true, hasMode: false, hasRemoveSpaces: false, hasRemoveSpecial: false, hasSpaceReplacement: false, hasPattern: false, hasReplacement: false, hasReplaceOriginal: true, hasFolderMode: false },
  { type: 'case', labelKey: 'ruleCase', hasFind: false, hasReplace: false, hasText: false, hasDelete: false, hasStart: false, hasDigits: false, hasPosition: false, hasMode: true, hasRemoveSpaces: false, hasRemoveSpecial: false, hasSpaceReplacement: false, hasPattern: false, hasReplacement: false, hasReplaceOriginal: false, hasFolderMode: true },
  { type: 'clean', labelKey: 'ruleClean', hasFind: false, hasReplace: false, hasText: false, hasDelete: false, hasStart: false, hasDigits: false, hasPosition: false, hasMode: false, hasRemoveSpaces: true, hasRemoveSpecial: true, hasSpaceReplacement: true, hasPattern: false, hasReplacement: false, hasReplaceOriginal: false, hasFolderMode: true },
  { type: 'regex', labelKey: 'ruleRegex', hasFind: false, hasReplace: false, hasText: false, hasDelete: false, hasStart: false, hasDigits: false, hasPosition: false, hasMode: false, hasRemoveSpaces: false, hasRemoveSpecial: false, hasSpaceReplacement: false, hasPattern: true, hasReplacement: true, hasReplaceOriginal: false, hasFolderMode: true },
  { type: 'keepNumber', labelKey: 'ruleKeepNumber', hasFind: false, hasReplace: false, hasText: false, hasDelete: false, hasStart: false, hasDigits: true, hasPosition: true, hasMode: false, hasRemoveSpaces: false, hasRemoveSpecial: false, hasSpaceReplacement: false, hasPattern: false, hasReplacement: false, hasReplaceOriginal: false, hasFolderMode: false },
  { type: 'deleteBefore', labelKey: 'ruleDeleteBefore', hasFind: false, hasReplace: false, hasText: false, hasDelete: true, hasStart: false, hasDigits: false, hasPosition: false, hasMode: false, hasRemoveSpaces: false, hasRemoveSpecial: false, hasSpaceReplacement: false, hasPattern: false, hasReplacement: false, hasReplaceOriginal: false, hasFolderMode: true },
  { type: 'deleteAfter', labelKey: 'ruleDeleteAfter', hasFind: false, hasReplace: false, hasText: false, hasDelete: true, hasStart: false, hasDigits: false, hasPosition: false, hasMode: false, hasRemoveSpaces: false, hasRemoveSpecial: false, hasSpaceReplacement: false, hasPattern: false, hasReplacement: false, hasReplaceOriginal: false, hasFolderMode: true },
  { type: 'numberFolders', labelKey: 'ruleNumberFolders', hasFind: false, hasReplace: false, hasText: false, hasDelete: false, hasStart: true, hasDigits: true, hasPosition: false, hasMode: false, hasRemoveSpaces: false, hasRemoveSpecial: false, hasSpaceReplacement: false, hasPattern: false, hasReplacement: false, hasReplaceOriginal: false, hasFolderMode: false },
]

// ─── Helpers ───────────────────────────────────

function downloadBlob(data: Uint8Array, filename: string) {
  const blob = new Blob([Buffer.from(data)], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Sort parallel entries+paths arrays by directory first, then filename. */
function sortFiles(entries: File[], paths: FileWithPath[]): [File[], FileWithPath[]] {
  const combined = entries.map((f, i) => ({ file: f, path: paths[i] }))
  combined.sort((a, b) => {
    // Extract directory and filename from path
    const dirA = a.path.path.includes('/') ? a.path.path.slice(0, a.path.path.lastIndexOf('/')) : ''
    const dirB = b.path.path.includes('/') ? b.path.path.slice(0, b.path.path.lastIndexOf('/')) : ''
    // Sort by directory first, then by filename
    const dirCmp = compareNames(dirA, dirB)
    if (dirCmp !== 0) return dirCmp
    return a.path.name.localeCompare(b.path.name, undefined, { numeric: true })
  })
  return [combined.map(c => c.file), combined.map(c => c.path)]
}

// ─── Tree view for preview ─────────────────────

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

interface TreeNode {
  name: string
  newName?: string
  children: TreeNode[]
  isFile: boolean
  changed: boolean
  conflict: boolean
}

function buildTree(items: PreviewItem[], hideFiles = false): TreeNode[] {
  const root: TreeNode[] = []

  for (const item of items) {
    const parts = item.newPath.split('/')
    let currentLevel = root

    for (let i = 0; i < parts.length; i++) {
      const isLast = i === parts.length - 1
      const part = parts[i]

      // Find the original path segment for comparison
      const origParts = item.originalPath.split('/')
      const origPart = origParts[i] || part

      // For files, check if name changed
      // For dirs, compute newName if the dir name changed
      let newName: string | undefined
      let changed: boolean
      let conflict: boolean

      if (isLast) {
        // File - only check if the filename itself changed, not the folder path
        if (hideFiles) continue // skip files when folderMode is active
        changed = item.originalName !== item.newName
        conflict = item.conflict
        newName = changed ? item.newName : undefined
      } else {
        // Directory - compare individual segment, not cumulative path
        changed = origPart !== part
        conflict = false
        newName = changed ? part : undefined
      }

      let existing = currentLevel.find(n => n.name === origPart && n.isFile === isLast)
      if (!existing) {
        existing = { name: origPart, newName, children: [], isFile: isLast, changed, conflict }
        currentLevel.push(existing)
      }

      if (!isLast) {
        currentLevel = existing.children
      }
    }
  }

  // Sort children: directories first, then files, alphabetically within each group
  function sortTree(nodes: TreeNode[]) {
    nodes.sort((a, b) => {
      // Directories before files
      if (a.isFile !== b.isFile) return a.isFile ? 1 : -1
      // English before Chinese, then within each group use appropriate locale
      return compareNames(a.name, b.name)
    })
    for (const node of nodes) {
      if (node.children.length > 0) sortTree(node.children)
    }
  }
  sortTree(root)

  return root
}

function renderTreeNode(node: TreeNode, depth: number, isLast: boolean): React.ReactNode {
  const indent = depth * 20
  const prefix = depth === 0 ? '' : (isLast ? '└── ' : '├── ')
  const name = node.newName
    ? <><span className="text-text-secondary line-through">{node.name}</span><span className="text-accent"> → {node.newName}</span></>
    : <span className={node.changed ? 'text-accent' : 'text-text-secondary'}>{node.name}</span>

  const icon = node.isFile ? '📄' : '📁'

  const children = node.children.map((child, i) =>
    renderTreeNode(child, depth + 1, i === node.children.length - 1)
  )

  return (
    <div key={node.name + depth}>
      <div className="flex items-center gap-1 py-0.5" style={{ paddingLeft: `${indent}px` }}>
        <span className="shrink-0">{icon}</span>
        <span className="text-text-secondary/40 shrink-0">{prefix}</span>
        <span className="truncate">{name}</span>
        {node.conflict && <span className="text-red-500 shrink-0">⚠️</span>}
      </div>
      {children}
    </div>
  )
}

// ─── Component ─────────────────────────────────

export default function FileRenamer() {
  const t = useTranslations('tools')
  const [files, setFiles] = useState<FileWithPath[]>([])
  const [fileEntries, setFileEntries] = useState<File[]>([])
  const [rules, setRules] = useState<RenameRule[]>([])
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [origFolderName, setOrigFolderName] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [showExamples, setShowExamples] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [canDirectRename, setCanDirectRename] = useState<boolean | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setCanDirectRename(typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function')
  }, [])

  // ── File selection ────────────────────────────

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    setError(''); setSuccessMsg('')
    const entries: File[] = []
    const paths: FileWithPath[] = []
    const seen = new Set<string>()

    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i]
      // webkitRelativePath gives the full relative path including folder
      const relPath = f.webkitRelativePath || f.name
      if (seen.has(relPath)) continue
      seen.add(relPath)
      entries.push(f)
      paths.push({ name: f.name, path: relPath })
    }

    if (paths.length === 0) return
    const [sortedEntries, sortedPaths] = sortFiles(entries, paths)
    setFileEntries(sortedEntries)
    setFiles(sortedPaths)

    // Auto-detect folder name from first path
    const firstSlash = sortedPaths[0].path.indexOf('/')
    if (firstSlash > 0) {
      setOrigFolderName(sortedPaths[0].path.slice(0, firstSlash))
    }
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }, [handleFiles])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    setError(''); setSuccessMsg('')

    async function handleFolderDrop(items: DataTransferItemList, fallbackFiles: FileList) {
      const entries: File[] = []
      const paths: FileWithPath[] = []
      const seen = new Set<string>()

      async function walk(entry: FileSystemEntry, basePath: string) {
        if (entry.isDirectory) {
          const reader = (entry as FileSystemDirectoryEntry).createReader()
          const readBatch = (): Promise<void> =>
            new Promise((resolve, reject) => {
              reader.readEntries((batch) => {
                if (batch.length === 0) return resolve()
                Promise.all(batch.map(e => walk(e, `${basePath}${entry.name}/`)))
                  .then(() => readBatch().then(resolve))
                  .catch(reject)
              }, reject)
            })
          await readBatch()
        } else {
          const file = await new Promise<File>((resolve, reject) =>
            (entry as FileSystemFileEntry).file(resolve, reject)
          )
          const relPath = `${basePath}${file.name}`
          if (seen.has(relPath)) return
          seen.add(relPath)
          entries.push(file)
          paths.push({ name: file.name, path: relPath })
        }
      }

      try {
        const tasks: Promise<void>[] = []
        for (let i = 0; i < items.length; i++) {
          const entry = items[i].webkitGetAsEntry?.()
          if (entry) tasks.push(walk(entry, ''))
        }
        await Promise.all(tasks)

        if (paths.length === 0) {
          handleFiles(fallbackFiles)
          return
        }
        const [sortedEntries, sortedPaths] = sortFiles(entries, paths)
        setFileEntries(sortedEntries)
        setFiles(sortedPaths)
        const firstSlash = sortedPaths[0].path.indexOf('/')
        if (firstSlash > 0) {
          setOrigFolderName(sortedPaths[0].path.slice(0, firstSlash))
        }
      } catch {
        handleFiles(fallbackFiles)
      }
    }

    try {
      // Try folder drag via webkitGetAsEntry (Chrome/Edge/Firefox/Safari)
      const items = e.dataTransfer.items
      if (items?.length) {
        const hasDir = Array.from(items).some(item => {
          const entry = item.webkitGetAsEntry?.()
          return entry?.isDirectory
        })
        if (hasDir) {
          handleFolderDrop(items, e.dataTransfer.files)
          return
        }
      }
      // Fallback: plain file drag
      handleFiles(e.dataTransfer.files)
    } catch {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleClick = useCallback(async () => {
    // Try showDirectoryPicker first (Chrome/Edge) — clean native dialog, no scary warning
    try {
      if (typeof window.showDirectoryPicker === 'function') {
        const dirHandle = await window.showDirectoryPicker()
        const entries: File[] = []
        const paths: FileWithPath[] = []
        const seen = new Set<string>()

        async function walk(dir: FileSystemDirectoryHandle, basePath: string) {
          const iter = dir.entries()
          for await (const [name, handle] of iter) {
            if (handle.kind === 'directory') {
              await walk(handle as FileSystemDirectoryHandle, `${basePath}${name}/`)
            } else {
              const file = await (handle as FileSystemFileHandle).getFile()
              const relPath = `${basePath}${name}`
              if (seen.has(relPath)) continue
              seen.add(relPath)
              entries.push(file)
              paths.push({ name: file.name, path: relPath })
            }
          }
        }

        await walk(dirHandle, `${dirHandle.name}/`)
        if (paths.length === 0) return
        const [sortedEntries, sortedPaths] = sortFiles(entries, paths)
        setFileEntries(sortedEntries)
        setFiles(sortedPaths)
        setOrigFolderName(dirHandle.name)
        return
      }
    } catch {
      // User cancelled — do nothing
      return
    }
    // Fallback: showDirectoryPicker not available, use file input
    inputRef.current?.click()
  }, [])

  // ── Rule management ───────────────────────────

  const addRule = useCallback(() => {
    setRules(prev => [...prev, { type: 'findReplace', find: '', replace: '' }])
  }, [])

  const removeRule = useCallback((index: number) => {
    setRules(prev => prev.filter((_, i) => i !== index))
  }, [])

  const updateRule = useCallback((index: number, updater: (rule: RenameRule) => RenameRule) => {
    setRules(prev => prev.map((r, i) => i === index ? updater(r) : r))
  }, [])

  const changeRuleType = useCallback((index: number, type: RenameRuleType) => {
    const cfg = ruleConfigs.find(c => c.type === type)
    if (!cfg) return
    switch (type) {
      case 'findReplace': updateRule(index, () => ({ type: 'findReplace', find: '', replace: '' })); break
      case 'prefix': updateRule(index, () => ({ type: 'prefix', text: '' })); break
      case 'suffix': updateRule(index, () => ({ type: 'suffix', text: '' })); break
      case 'numbering': updateRule(index, () => ({ type: 'numbering', start: 1, digits: 3, position: 'prefix', replaceOriginal: true, perFolder: true })); break
      case 'case': updateRule(index, () => ({ type: 'case', mode: 'upper' })); break
      case 'clean': updateRule(index, () => ({ type: 'clean', removeSpaces: false, removeSpecialChars: false, spaceReplacement: '' })); break
      case 'regex': updateRule(index, () => ({ type: 'regex', pattern: '', replacement: '' })); break
      case 'keepNumber': updateRule(index, () => ({ type: 'keepNumber', digits: 4, position: 'prefix' })); break
      case 'deleteBefore': updateRule(index, () => ({ type: 'deleteBefore', text: '' })); break
      case 'deleteAfter': updateRule(index, () => ({ type: 'deleteAfter', text: '' })); break
      case 'numberFolders': updateRule(index, () => ({ type: 'numberFolders', start: 1, digits: 2, level: 1, perFolder: true })); break
    }
  }, [updateRule])

  // ── Preview ─────────────────────────────────

  const preview = useMemo(() => {
    if (files.length === 0 || rules.length === 0) return []
    return applyRules(files, rules, false, origFolderName)
  }, [files, rules, origFolderName])

  const hasConflicts = useMemo(() => preview.some(p => p.conflict), [preview])
  const treeNodes = useMemo(() => {
    const hasFolderMode = rules.some(r => r.folderMode || r.type === 'numberFolders')
    return buildTree(preview, hasFolderMode)
  }, [preview, rules])

  // ── Rename/Download helpers ──────────────────

  const directRename = useCallback(async (origFolderName: string) => {
    if (typeof window.showDirectoryPicker !== 'function') {
      setError(t('renFsApiUnsupported'))
      return
    }
    const dirHandle = await window.showDirectoryPicker()
    if (dirHandle.name !== origFolderName) {
      setError(t('renWrongFolder', { folder: origFolderName }))
      return
    }

    let renamed = 0
    for (const item of preview) {
      if (!item.changed) continue
      const relPath = item.originalPath.slice(origFolderName.length + 1)
      const parts = relPath.split('/')
      let handle = dirHandle

      for (let i = 0; i < parts.length - 1; i++) {
        handle = await handle.getDirectoryHandle(parts[i])
      }

      const newName = item.newName
      const oldName = parts[parts.length - 1]
      if (oldName !== newName) {
        try {
          const file = await handle.getFileHandle(oldName)
          const blob = await file.getFile()
          const writable = await handle.getFileHandle(newName, { create: true }).then(h => h.createWritable())
          await writable.write(blob)
          await writable.close()
          await handle.removeEntry(oldName)
          renamed++
        } catch {
          // skip files that can't be renamed
        }
      }
    }
    setSuccessMsg(t('renamedCount', { count: renamed }))
  }, [preview, t])

  const zipDownload = useCallback(async () => {
    const zip = new JSZip()

    for (let i = 0; i < preview.length; i++) {
      const item = preview[i]
      const entry = fileEntries[i]
      if (!entry) continue
      zip.file(item.newPath, entry)
    }

    const zipBytes = await zip.generateAsync({ type: 'uint8array' })
    const zipName = origFolderName ? `${origFolderName}_renamed.zip` : 'renamed_files.zip'
    downloadBlob(zipBytes, zipName)
    setSuccessMsg(t('renZipped', { count: files.length }))
  }, [preview, fileEntries, origFolderName, files, t])

  // ── Execute ─────────────────────────────────

  const handleExecute = useCallback(async () => {
    if (files.length === 0 || rules.length === 0) return
    if (hasConflicts) {
      setError(t('renConflictError'))
      return
    }
    setProcessing(true)
    setError(''); setSuccessMsg('')

    try {
      // Try showDirectoryPicker (File System Access API) for direct rename
      if (typeof window.showDirectoryPicker === 'function') {
        const firstSlash = files[0].path.indexOf('/')
        const origFolderName = firstSlash > 0 ? files[0].path.slice(0, firstSlash) : ''
        if (origFolderName) {
          try {
            await directRename(origFolderName)
            setProcessing(false)
            return
          } catch {
            // User cancelled the folder picker — do nothing
            setProcessing(false)
            return
          }
        }
      }
      // Fallback: zip download
      await zipDownload()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('renError'))
    }
    setProcessing(false)
  }, [files, rules, hasConflicts, t, directRename, zipDownload])

  // ── Render ──────────────────────────────────

  return (
    <div className="mt-6 max-w-3xl mx-auto space-y-6">
      {/* Help toggle - always visible at top */}
      <button
        onClick={() => setShowHelp(v => !v)}
        className="text-xs text-accent hover:text-accent/80 transition-colors"
      >
        {showHelp ? '▼ ' : '▶ '}{t('renHowToUse')}
      </button>

      {showHelp && (
        <div className="p-4 bg-surface rounded-lg text-xs space-y-3 text-text-secondary">
          <div>
            <p className="font-medium text-text-primary mb-1">{t('renHelpStep1')}</p>
            <p className="text-text-secondary/70">{t('renHelpStep1Desc')}</p>
          </div>
          <div>
            <p className="font-medium text-text-primary mb-1">{t('renHelpStep2')}</p>
            <p className="text-text-secondary/70">{t('renHelpStep2Desc')}</p>
          </div>
          <div>
            <p className="font-medium text-text-primary mb-1">{t('renHelpStep3')}</p>
            <p className="text-text-secondary/70">{t('renHelpStep3Desc')}</p>
          </div>
        </div>
      )}

      {/* File selection */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={e => {
          e.preventDefault()
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false)
        }}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer ${
          dragOver ? 'border-accent bg-accent/5 scale-[1.02]' : 'border-accent/20 hover:border-accent/40'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleChange}
          className="hidden"
        />
        <p className="text-sm text-text-secondary">{t('renDrop')}</p>
        <p className="text-xs text-text-secondary/50 mt-1">{t('renDropHint')}</p>
      </div>

      {canDirectRename === false && (
        <p className="text-xs text-text-secondary/60 text-center bg-surface py-2 px-4 rounded-lg border border-[rgba(127,99,21,0.1)]">
          {t('renBrowserHint')}
        </p>
      )}

      {/* Rules panel */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-primary">{t('renRules')}</h3>
            <button
              onClick={addRule}
              className="text-xs px-3 py-1.5 bg-accent text-white rounded-lg hover:opacity-90 transition-opacity"
            >+ {t('renAddRule')}</button>
          </div>

          {rules.length === 0 && (
            <p className="text-xs text-text-secondary/50 text-center py-6">{t('renNoRules')}</p>
          )}

          {rules.map((rule, i) => {
            const cfg = ruleConfigs.find(c => c.type === rule.type)
    const r = rule as RuleWithFields
            return (
              <div key={i} className="flex flex-wrap items-center gap-2 p-3 bg-surface rounded-lg">
                {/* Rule type selector */}
                <select
                  value={rule.type}
                  onChange={e => changeRuleType(i, e.target.value as RenameRuleType)}
                  className="p-1.5 bg-bg border border-border rounded-lg text-xs text-text-primary"
                >
                  {ruleConfigs.map(c => (
                    <option key={c.type} value={c.type}>{t(c.labelKey)}</option>
                  ))}
                </select>

                {/* Rule-specific fields */}
                {cfg?.hasFind && (
                  <input
                    type="text" placeholder={t('renFind')} value={r.find}
                    onChange={e => updateRule(i, r => ({ ...r, find: e.target.value }))}
                    className="w-28 p-1.5 bg-bg border border-border rounded-lg text-xs text-text-primary"
                  />
                )}
                {cfg?.hasReplace && (
                  <input
                    type="text" placeholder={t('renReplace')} value={r.replace}
                    onChange={e => updateRule(i, r => ({ ...r, replace: e.target.value }))}
                    className="w-28 p-1.5 bg-bg border border-border rounded-lg text-xs text-text-primary"
                  />
                )}
                {cfg?.hasText && (
                  <input
                    type="text" placeholder={t('renText')} value={r.text}
                    onChange={e => updateRule(i, r => ({ ...r, text: e.target.value }))}
                    className="w-28 p-1.5 bg-bg border border-border rounded-lg text-xs text-text-primary"
                  />
                )}
                {cfg?.hasDelete && (
                  <input
                    type="text" placeholder={t('renDeleteText')} value={r.text}
                    onChange={e => updateRule(i, r => ({ ...r, text: e.target.value }))}
                    className="w-28 p-1.5 bg-bg border border-border rounded-lg text-xs text-text-primary"
                  />
                )}
                {cfg?.hasStart && (
                  <label className="flex items-center gap-1 text-xs text-text-secondary">
                    {t('renStart')}
                    <input
                      type="number" min="0" value={r.start}
                      onChange={e => updateRule(i, r => ({ ...r, start: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-16 p-1.5 bg-bg border border-border rounded-lg text-xs text-text-primary"
                    />
                  </label>
                )}
                {cfg?.hasDigits && (
                  <label className="flex items-center gap-1 text-xs text-text-secondary">
                    {t('renDigits')}
                    <input
                      type="number" min="1" max="10" value={r.digits}
                      onChange={e => updateRule(i, r => ({ ...r, digits: Math.max(1, Math.min(10, parseInt(e.target.value) || 1)) }))}
                      className="w-14 p-1.5 bg-bg border border-border rounded-lg text-xs text-text-primary"
                    />
                  </label>
                )}
                {rule.type === 'numberFolders' && (
                  <label className="flex items-center gap-1 text-xs text-text-secondary">
                    <span>{t('renFolderLevel')}</span>
                    <input
                      type="number" min="0" max="5" value={r.level ?? 1}
                      onChange={e => updateRule(i, r => ({ ...r, level: Math.max(0, Math.min(5, parseInt(e.target.value) || 0)) }))}
                      className="w-12 p-1 bg-bg border border-border rounded-lg text-xs text-text-primary text-center"
                    />
                  </label>
                )}
                {rule.type === 'numberFolders' && (
                  <label className="flex items-center gap-1 text-xs text-text-secondary cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox" checked={rule.perFolder ?? false}
                      onChange={e => updateRule(i, r => ({ ...r, perFolder: e.target.checked }))}
                      className="accent-accent"
                    />
                    {t('renPerFolder')}
                  </label>
                )}
                {cfg?.hasPosition && (
                  <select
                    value={r.position}
                    onChange={e => updateRule(i, r => ({ ...r, position: e.target.value as 'prefix' | 'suffix' }))}
                    className="p-1.5 bg-bg border border-border rounded-lg text-xs text-text-primary"
                  >
                    <option value="prefix">{t('renPrefix')}</option>
                    <option value="suffix">{t('renSuffix')}</option>
                  </select>
                )}
                {cfg?.hasReplaceOriginal && (
                  <label className="flex items-center gap-1 text-xs text-text-secondary cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox" checked={r.replaceOriginal ?? false}
                      onChange={e => updateRule(i, r => ({ ...r, replaceOriginal: e.target.checked }))}
                      className="accent-accent"
                    />
                    {t('renReplaceOriginal')}
                  </label>
                )}
                {rule.type === 'numbering' && (
                  <label className="flex items-center gap-1 text-xs text-text-secondary cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox" checked={rule.perFolder ?? false}
                      onChange={e => updateRule(i, r => ({ ...r, perFolder: e.target.checked }))}
                      className="accent-accent"
                    />
                    {t('renPerFolder')}
                  </label>
                )}
                {cfg?.hasMode && (
                  <select
                    value={r.mode}
                    onChange={e => updateRule(i, r => ({ ...r, mode: e.target.value as 'upper' | 'lower' | 'capitalize' }))}
                    className="p-1.5 bg-bg border border-border rounded-lg text-xs text-text-primary"
                  >
                    <option value="upper">{t('renUpper')}</option>
                    <option value="lower">{t('renLower')}</option>
                    <option value="capitalize">{t('renCapitalize')}</option>
                  </select>
                )}
                {cfg?.hasRemoveSpaces && (
                  <label className="flex items-center gap-1 text-xs text-text-secondary cursor-pointer">
                    <input
                      type="checkbox" checked={r.removeSpaces}
                      onChange={e => updateRule(i, r => ({ ...r, removeSpaces: e.target.checked }))}
                      className="accent-accent"
                    />
                    {t('renRemoveSpaces')}
                  </label>
                )}
                {cfg?.hasRemoveSpecial && (
                  <label className="flex items-center gap-1 text-xs text-text-secondary cursor-pointer">
                    <input
                      type="checkbox" checked={r.removeSpecialChars}
                      onChange={e => updateRule(i, r => ({ ...r, removeSpecialChars: e.target.checked }))}
                      className="accent-accent"
                    />
                    {t('renRemoveSpecial')}
                  </label>
                )}
                {cfg?.hasSpaceReplacement && r.removeSpaces && (
                  <label className="flex items-center gap-1 text-xs text-text-secondary">
                    {t('renReplaceWith')}
                    <input
                      type="text" maxLength={2} value={r.spaceReplacement}
                      onChange={e => updateRule(i, r => ({ ...r, spaceReplacement: e.target.value }))}
                      className="w-12 p-1.5 bg-bg border border-border rounded-lg text-xs text-text-primary"
                    />
                  </label>
                )}
                {cfg?.hasPattern && (
                  <input
                    type="text" placeholder={t('renPattern')} value={r.pattern}
                    onChange={e => updateRule(i, r => ({ ...r, pattern: e.target.value }))}
                    className="w-28 p-1.5 bg-bg border border-border rounded-lg text-xs text-text-primary"
                  />
                )}
                {(cfg?.hasReplacement && rule.type === 'regex') && (
                  <input
                    type="text" placeholder={t('renReplace')} value={r.replacement}
                    onChange={e => updateRule(i, r => ({ ...r, replacement: e.target.value }))}
                    className="w-28 p-1.5 bg-bg border border-border rounded-lg text-xs text-text-primary"
                  />
                )}

                {cfg?.hasFolderMode && (
                  <label className="flex items-center gap-1 text-xs text-text-secondary cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox" checked={rule.folderMode ?? false}
                      onChange={e => updateRule(i, r => ({ ...r, folderMode: e.target.checked }))}
                      className="accent-accent"
                    />
                    {t('renFolderMode')}
                  </label>
                )}
                {rule.folderMode && cfg?.hasFolderMode && (
                  <label className="flex items-center gap-1 text-xs text-text-secondary whitespace-nowrap">
                    <span>{t('renFolderLevel')}</span>
                    <input
                      type="number" min="0" max="5" value={rule.folderLevel ?? 1}
                      onChange={e => updateRule(i, r => ({ ...r, folderLevel: Math.max(0, Math.min(5, parseInt(e.target.value) || 0)) }))}
                      className="w-12 p-1 bg-bg border border-border rounded-lg text-xs text-text-primary text-center"
                    />
                  </label>
                )}

                {/* Delete rule */}
                <button
                  onClick={() => removeRule(i)}
                  className="ml-auto text-xs text-red-500 hover:text-red-600 shrink-0"
                >✕</button>
              </div>
            )
          })}
        </div>
      )}

      {/* Examples */}
      <div className="space-y-2">
        <button
          onClick={() => setShowExamples(v => !v)}
          className="text-xs text-accent hover:text-accent/80 transition-colors"
        >
          {showExamples ? '▼ ' : '▶ '}{t('renExamples')}
        </button>

        {showExamples && (
          <div className="space-y-4 p-4 bg-surface rounded-lg text-xs">
            <div>
              <p className="font-medium text-text-primary mb-1">{t('renEx5Title')}</p>
              <div className="grid grid-cols-[1fr_auto_1fr] gap-x-3 gap-y-0.5 text-text-secondary">
                <span className="text-right truncate">📁 旅行/</span>
                <span className="text-text-secondary/40">→</span>
                <span>01/</span>
                <span className="text-right truncate">📁 工作/</span>
                <span className="text-text-secondary/40">→</span>
                <span>02/</span>
                <span className="text-right truncate">📁 学习/</span>
                <span className="text-text-secondary/40">→</span>
                <span>03/</span>
              </div>
              <p className="text-text-secondary/60 mt-1">{t('renEx5Desc')}</p>
            </div>
            <hr className="border-[rgba(127,99,21,0.08)]" />
            <div>
              <p className="font-medium text-text-primary mb-1">{t('renEx6Title')}</p>
              <div className="grid grid-cols-[1fr_auto_1fr] gap-x-3 gap-y-0.5 text-text-secondary">
                <span className="text-right truncate">📁 旅行/</span>
                <span className="text-text-secondary/40">→</span>
                <span>📁 vacation/</span>
                <span className="text-right truncate">📁 工作/</span>
                <span className="text-text-secondary/40">→</span>
                <span>📁 work/</span>
              </div>
              <p className="text-text-secondary/60 mt-1">{t('renEx6Desc')}</p>
            </div>
            <hr className="border-[rgba(127,99,21,0.08)]" />
            <div>
              <p className="font-medium text-text-primary mb-1">{t('renEx3Title')}</p>
              <div className="grid grid-cols-[1fr_auto_1fr] gap-x-3 gap-y-0.5 text-text-secondary">
                <span className="text-right truncate">IMG_20240101.jpg</span>
                <span className="text-text-secondary/40">→</span>
                <span>001.jpg</span>
                <span className="text-right truncate">Screenshot.png</span>
                <span className="text-text-secondary/40">→</span>
                <span>002.png</span>
                <span className="text-right truncate">文档.pdf</span>
                <span className="text-text-secondary/40">→</span>
                <span>003.pdf</span>
              </div>
              <p className="text-text-secondary/60 mt-1">
  <span className="mb-0.5 block">{t('renEx3Desc')}</span>
  <span className="mb-0.5 pl-[3em] block">{t('renEx3Desc2')}</span>
  <span className="pl-[3em] block">{t('renEx3Desc3')}</span>
</p>
            </div>
            <hr className="border-[rgba(127,99,21,0.08)]" />
            <div>
              <p className="font-medium text-text-primary mb-1">{t('renEx1Title')}</p>
              <div className="grid grid-cols-[1fr_auto_1fr] gap-x-3 gap-y-0.5 text-text-secondary">
                <span className="text-right">IMG_001.jpg</span>
                <span className="text-text-secondary/40">→</span>
                <span>photo_001.jpg</span>
                <span className="text-right">IMG_002.jpg</span>
                <span className="text-text-secondary/40">→</span>
                <span>photo_002.jpg</span>
              </div>
              <p className="text-text-secondary/60 mt-1">{t('renEx1Desc')}</p>
            </div>
            <hr className="border-[rgba(127,99,21,0.08)]" />
            <div>
              <p className="font-medium text-text-primary mb-1">{t('renEx2Title')}</p>
              <div className="grid grid-cols-[1fr_auto_1fr] gap-x-3 gap-y-0.5 text-text-secondary">
                <span className="text-right truncate">My Photo 2.jpg</span>
                <span className="text-text-secondary/40">→</span>
                <span>my_photo_2.jpg</span>
                <span className="text-right truncate">Screenshot 1.png</span>
                <span className="text-text-secondary/40">→</span>
                <span>screenshot_1.png</span>
              </div>
              <p className="text-text-secondary/60 mt-1">{t('renEx2Desc')}</p>
            </div>
            <hr className="border-[rgba(127,99,21,0.08)]" />
            <div>
              <p className="font-medium text-text-primary mb-1">{t('renEx4Title')}</p>
              <div className="grid grid-cols-[1fr_auto_1fr] gap-x-3 gap-y-0.5 text-text-secondary">
                <span className="text-right truncate">IMG_2024_001.jpg</span>
                <span className="text-text-secondary/40">→</span>
                <span>2024_001.jpg</span>
                <span className="text-right truncate">photo_2024_002.jpg</span>
                <span className="text-text-secondary/40">→</span>
                <span>2024_002.jpg</span>
              </div>
              <p className="text-text-secondary/60 mt-1">{t('renEx4Desc')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Preview table */}
      {preview.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-text-primary">
            {t('renPreview')} ({preview.length} {t('renFiles')})
          </h3>
          <div className="max-h-96 overflow-y-auto space-y-0.5 font-mono text-xs">
            {treeNodes.map((node, i) => renderTreeNode(node, 0, i === treeNodes.length - 1))}
          </div>
        </div>
      )}

      {/* Error / info message */}
      {(error || successMsg) && (
        <p className={`text-sm text-center ${successMsg ? 'text-green-500' : 'text-red-500'}`}>
          {successMsg || error}
        </p>
      )}

      {/* Execute button */}
      {rules.length > 0 && preview.length > 0 && (
        <div className="flex flex-col items-center gap-3">
          <div className="flex justify-center gap-3">
            <button
              onClick={handleExecute}
              disabled={processing || hasConflicts}
              className="px-8 py-3 bg-accent text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-30"
            >{processing ? t('renProcessing') : t('renExecute')}</button>
            <button
              onClick={() => { setFiles([]); setFileEntries([]); setRules([]); setError(''); setSuccessMsg('') }}
              className="px-6 py-3 bg-surface text-text-primary text-sm font-medium rounded-lg border border-border hover:bg-accent/5 transition-colors"
            >{t('renClear')}</button>
          </div>
          {canDirectRename !== undefined && (
            <p className="text-xs text-text-secondary/60 text-center max-w-md">
              {canDirectRename ? t('renDirectHint') : t('renZipHint')}
            </p>
          )}
        </div>
      )}

      </div>
  )
}