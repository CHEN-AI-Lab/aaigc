'use client'

import { useState, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { PDFDocument } from 'pdf-lib'
import JSZip from 'jszip'

type Mode = 'merge' | 'split'

interface PdfFile {
  id: string
  name: string
  data: ArrayBuffer
  pageCount: number
}

export default function PdfTool() {
  const t = useTranslations('tools')
  const [mode, setMode] = useState<Mode>('merge')
  const [files, setFiles] = useState<PdfFile[]>([])
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [pagesPerGroup, setPagesPerGroup] = useState(1)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isDuplicate = useCallback((file: File) => {
    return files.some(f => f.name === file.name && f.data.byteLength === file.size)
  }, [files])

  const addFiles = useCallback(async (list: FileList) => {
    setError('')
    const newFiles: PdfFile[] = []
    for (let i = 0; i < list.length; i++) {
      if (mode === 'split' && (files.length + newFiles.length) >= 1) {
        setError(t('pdfSplitLimit'))
        break
      }
      const file = list[i]
      if (file.type !== 'application/pdf') {
        setError(`"${file.name}" ${t('pdfNotPdf')}`)
        continue
      }
      if (isDuplicate(file)) continue
      const data = await file.arrayBuffer()
      const doc = await PDFDocument.load(data, { ignoreEncryption: true })
      newFiles.push({ id: crypto.randomUUID(), name: file.name, data, pageCount: doc.getPageCount() })
    }
    setFiles(prev => [...prev, ...newFiles])
  }, [t, isDuplicate, mode, files.length])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (mode === 'split' && files.length >= 1) return
      addFiles(e.target.files)
    }
  }, [addFiles, mode, files.length])

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }, [])

  const handleMerge = useCallback(async () => {
    if (files.length < 2) return
    setProcessing(true)
    setError('')
    try {
      const merged = await PDFDocument.create()
      for (const f of files) {
        const doc = await PDFDocument.load(f.data, { ignoreEncryption: true })
        const pages = await merged.copyPages(doc, doc.getPageIndices())
        pages.forEach(p => merged.addPage(p))
      }
      const bytes = await merged.save()
      // Use first file's name + _merged
      const baseName = files[0].name.replace(/\.pdf$/i, '')
      downloadBlob(bytes, `${baseName}_merged.pdf`)
    } catch {
      setError(t('pdfError'))
    }
    setProcessing(false)
  }, [files, t])

  const handleSplit = useCallback(async () => {
    if (files.length !== 1) return
    setProcessing(true)
    setError('')
    try {
      const doc = await PDFDocument.load(files[0].data, { ignoreEncryption: true })
      const total = doc.getPageCount()
      const baseName = files[0].name.replace(/\.pdf$/i, '')
      const groupSize = Math.max(1, pagesPerGroup)
      const zip = new JSZip()
      let groupIndex = 0

      for (let i = 0; i < total; i += groupSize) {
        groupIndex++
        const end = Math.min(i + groupSize, total)
        const newDoc = await PDFDocument.create()
        const pages = await newDoc.copyPages(doc, Array.from({ length: end - i }, (_, k) => i + k))
        pages.forEach(p => newDoc.addPage(p))
        const bytes = await newDoc.save()
        const label = groupSize === 1 ? `page_${i + 1}` : `pages_${i + 1}-${end}`
        zip.file(`${baseName}_${label}.pdf`, Buffer.from(bytes))
      }

      const zipBytes = await zip.generateAsync({ type: 'uint8array' })
      downloadBlob(zipBytes, `${baseName}.zip`)
    } catch {
      setError(t('pdfError'))
    }
    setProcessing(false)
  }, [files, pagesPerGroup, t])

  return (
    <div className="mt-6 max-w-2xl mx-auto space-y-6">
      {/* Mode toggle */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => { setMode('merge'); setFiles([]); setError('') }}
          className={`px-5 py-2 text-sm rounded-lg transition-colors ${
            mode === 'merge' ? 'bg-accent text-white' : 'bg-surface text-text-secondary border border-border'
          }`}
        >{t('pdfMerge')}</button>
        <button
          onClick={() => { setMode('split'); setFiles([]); setError('') }}
          className={`px-5 py-2 text-sm rounded-lg transition-colors ${
            mode === 'split' ? 'bg-accent text-white' : 'bg-surface text-text-secondary border border-border'
          }`}
        >{t('pdfSplit')}</button>
      </div>

      {/* Upload area */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={e => {
          e.preventDefault()
          // Only set false if mouse actually left the drop zone, not entering a child
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false)
        }}
        onDrop={e => { e.preventDefault(); setDragOver(false); if (mode === 'split' && files.length >= 1) { setError(t('pdfSplitLimit')); return }; addFiles(e.dataTransfer.files) }}
        onClick={() => {
          if (mode === 'split' && files.length >= 1) {
            setError(t('pdfSplitLimit'))
            return
          }
          inputRef.current?.click()
        }}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
          dragOver ? 'border-accent bg-accent/5 scale-[1.02]' : 'border-accent/20 hover:border-accent/40'
        }`}
      >
        <input ref={inputRef} type="file" accept=".pdf" multiple={mode === 'merge'} onChange={handleChange} className="hidden" />
        <p className="text-sm text-text-secondary">{mode === 'merge' ? t('pdfDropMerge') : t('pdfDropSplit')}</p>
        <p className="text-xs text-text-secondary/50 mt-1">{mode === 'merge' ? t('pdfClickOrDrag') : t('pdfSplitSingle')}</p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {mode === 'split' && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-text-secondary">{t('pdfSplitPerGroup')}</span>
              <input
                type="number" min="1" max="100" value={pagesPerGroup}
                onChange={e => setPagesPerGroup(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 p-1.5 text-center bg-surface border border-border rounded-lg text-sm text-text-primary"
              />
              <span className="text-text-secondary">{t('pdfPages')}</span>
            </div>
          )}
          {files.map(f => (
            <div key={f.id} className="flex items-center justify-between px-3 py-2 bg-surface rounded-lg text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-accent">📄</span>
                <span className="text-text-primary truncate">{f.name}</span>
                <span className="text-text-secondary/50 text-xs shrink-0">({f.pageCount} {t('pdfPages')})</span>
              </div>
              <button onClick={() => removeFile(f.id)} className="text-xs text-red-500 hover:text-red-600 shrink-0 ml-2">{t('pdfRemove')}</button>
            </div>
          ))}
          {mode === 'merge' && files.length > 0 && (
            <p className="text-xs text-text-secondary/50 text-center">{t('pdfTotalPages', { count: files.reduce((s, f) => s + f.pageCount, 0) })}</p>
          )}
        </div>
      )}

      {/* Error */}
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {/* Action buttons */}
      <div className="flex justify-center gap-3">
        {mode === 'merge' && files.length >= 2 && (
          <button onClick={handleMerge} disabled={processing}
            className="px-8 py-3 bg-accent text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-30"
          >{processing ? t('pdfProcessing') : t('pdfMergeBtn')}</button>
        )}
        {mode === 'split' && files.length === 1 && (
          <button onClick={handleSplit} disabled={processing}
            className="px-8 py-3 bg-accent text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-30"
          >{processing ? t('pdfProcessing') : t('pdfSplitBtn')}</button>
        )}
        {files.length > 0 && (
          <button onClick={() => { setFiles([]); setError('') }}
            className="px-6 py-3 bg-surface text-text-primary text-sm font-medium rounded-lg border border-border hover:bg-accent/5 transition-colors"
          >{t('pdfClear')}</button>
        )}
      </div>
    </div>
  )
}

function downloadBlob(data: Uint8Array, filename: string) {
  const blob = new Blob([Buffer.from(data)], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}