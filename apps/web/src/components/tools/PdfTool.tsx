'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { PDFDocument } from 'pdf-lib'

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

  const addFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList) return
    setError('')
    const newFiles: PdfFile[] = []
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      if (file.type !== 'application/pdf') {
        setError(`"${file.name}" ${t('pdfNotPdf')}`)
        continue
      }
      const data = await file.arrayBuffer()
      const doc = await PDFDocument.load(data, { ignoreEncryption: true })
      newFiles.push({ id: crypto.randomUUID(), name: file.name, data, pageCount: doc.getPageCount() })
    }
    setFiles(prev => [...prev, ...newFiles])
  }, [t])

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
      downloadBlob(bytes, 'merged.pdf')
    } catch (e) {
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
      for (let i = 0; i < total; i++) {
        const newDoc = await PDFDocument.create()
        const [page] = await newDoc.copyPages(doc, [i])
        newDoc.addPage(page)
        const bytes = await newDoc.save()
        downloadBlob(bytes, `${files[0].name.replace('.pdf', '')}_page_${i + 1}.pdf`)
      }
    } catch (e) {
      setError(t('pdfError'))
    }
    setProcessing(false)
  }, [files, t])

  return (
    <div className="mt-6 max-w-2xl mx-auto space-y-6">
      {/* Mode toggle */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => { setMode('merge'); setFiles([]); setError('') }}
          className={`px-5 py-2 text-sm rounded-lg transition-colors ${
            mode === 'merge' ? 'bg-accent text-white' : 'bg-surface text-text-secondary border border-[rgba(127,99,21,0.15)]'
          }`}
        >{t('pdfMerge')}</button>
        <button
          onClick={() => { setMode('split'); setFiles([]); setError('') }}
          className={`px-5 py-2 text-sm rounded-lg transition-colors ${
            mode === 'split' ? 'bg-accent text-white' : 'bg-surface text-text-secondary border border-[rgba(127,99,21,0.15)]'
          }`}
        >{t('pdfSplit')}</button>
      </div>

      {/* Upload area */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files) }}
        className="border-2 border-dashed border-accent/20 rounded-lg p-8 text-center hover:border-accent/40 transition-colors cursor-pointer"
        onClick={() => document.getElementById('pdf-input')?.click()}
      >
        <input
          id="pdf-input" type="file" accept=".pdf" multiple
          onChange={e => addFiles(e.target.files)}
          className="hidden"
        />
        <p className="text-sm text-text-secondary">{mode === 'merge' ? t('pdfDropMerge') : t('pdfDropSplit')}</p>
        <p className="text-xs text-text-secondary/50 mt-1">{t('pdfClickOrDrag')}</p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
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
            className="px-6 py-3 bg-surface text-text-primary text-sm font-medium rounded-lg border border-[rgba(127,99,21,0.15)] hover:bg-accent/5 transition-colors"
          >{t('pdfClear')}</button>
        )}
      </div>
    </div>
  )
}

function downloadBlob(data: Uint8Array, filename: string) {
  const blob = new Blob([Buffer.from(data)], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}