'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import JSZip from 'jszip'

type Format = 'png' | 'jpeg' | 'webp' | 'bmp' | 'gif'

interface InputFile {
  id: string
  file: File
  dataUrl: string
  width: number
  height: number
}

interface OutputFile {
  blob: Blob
  url: string
  name: string
  size: number
}

const FORMAT_OPTIONS: { value: Format; label: string; mime: string; ext: string }[] = [
  { value: 'png',  label: 'PNG',  mime: 'image/png',           ext: '.png' },
  { value: 'jpeg', label: 'JPG',  mime: 'image/jpeg',          ext: '.jpg' },
  { value: 'webp', label: 'WebP', mime: 'image/webp',          ext: '.webp' },
  { value: 'bmp',  label: 'BMP',  mime: 'image/bmp',           ext: '.bmp' },
  { value: 'gif',  label: 'GIF',  mime: 'image/gif',           ext: '.gif' },
]

const PRESETS: { label: string; w: number; h: number; title: string; group: string }[] = [
  { label: '16:9',  w: 1920, h: 1080, title: '1920×1080',  group: '16:9' },
  { label: '4:3',   w: 1024, h: 768,  title: '1024×768',   group: '4:3' },
  { label: '1:1',   w: 1080, h: 1080, title: '1080×1080',  group: '1:1' },
  { label: '9:16',  w: 1080, h: 1920, title: '1080×1920',  group: '9:16' },
  { label: '3:4',   w: 768,  h: 1024, title: '768×1024',   group: '3:4' },
]

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function getInputFormat(file: File): Format | null {
  const map: Record<string, Format> = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
    'image/gif': 'gif',
  }
  return map[file.type] ?? null
}

export default function ImageConverter() {
  const t = useTranslations('tools')
  const [inputs, setInputs] = useState<InputFile[]>([])
  const [targetFormat, setTargetFormat] = useState<Format>('png')
  const [quality, setQuality] = useState(90)
  const [outputs, setOutputs] = useState<OutputFile[]>([])
  const [converting, setConverting] = useState(false)
  const [, setError] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const showToast = useCallback((message: string) => {
    setToast({ message, key: Date.now() })
    setTimeout(() => setToast(null), 2000)
  }, [])

  // Resize state
  const [resizeEnabled, setResizeEnabled] = useState(false)
  const [targetWidth, setTargetWidth] = useState(0)
  const [targetHeight, setTargetHeight] = useState(0)
  const [keepAspectRatio, setKeepAspectRatio] = useState(true)
  const [collapsed, setCollapsed] = useState(true)
  const inputWidthRef = useRef<HTMLInputElement>(null)
  const inputHeightRef = useRef<HTMLInputElement>(null)

  // When the first image loads, fill in its dimensions and set default format
  useEffect(() => {
    if (inputs.length > 0) {
      setTargetWidth(inputs[0].width)
      setTargetHeight(inputs[0].height)
      const fmt = getInputFormat(inputs[0].file)
      if (fmt) setTargetFormat(fmt)
    }
  }, [inputs])

  const originalAspect = inputs.length > 0
    ? inputs[0].width / inputs[0].height
    : 1

  const handleWidthChange = useCallback((val: string) => {
    const w = parseInt(val, 10) || 0
    setTargetWidth(w)
    if (keepAspectRatio && w > 0 && inputs[0]) {
      setTargetHeight(Math.round(w / originalAspect))
    }
  }, [keepAspectRatio, originalAspect, inputs])

  const handleHeightChange = useCallback((val: string) => {
    const h = parseInt(val, 10) || 0
    setTargetHeight(h)
    if (keepAspectRatio && h > 0 && inputs[0]) {
      setTargetWidth(Math.round(h * originalAspect))
    }
  }, [keepAspectRatio, originalAspect, inputs])

  const applyPreset = useCallback((w: number, h: number) => {
    setResizeEnabled(true)
    if (inputs[0]) {
      const presetRatio = w / h
      const origRatio = inputs[0].width / inputs[0].height
      // Same aspect ratio → keep/re-check; different → uncheck
      if (Math.abs(presetRatio - origRatio) < 0.01) {
        setKeepAspectRatio(true)
      } else {
        setKeepAspectRatio(false)
      }
    }
    setTargetWidth(w)
    setTargetHeight(h)
  }, [inputs])

  const applyOriginal = useCallback(() => {
    if (inputs[0]) {
      setTargetWidth(inputs[0].width)
      setTargetHeight(inputs[0].height)
    }
  }, [inputs])

  const loadImage = useCallback((file: File): Promise<InputFile> => {
    return new Promise((resolve, reject) => {
      if (file.size > 20 * 1024 * 1024) {
        reject(new Error(`${file.name}: ${t('fileTooLarge')}`))
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          resolve({
            id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            file,
            dataUrl: reader.result as string,
            width: img.width,
            height: img.height,
          })
        }
        img.onerror = () => reject(new Error(`${file.name}: ${t('failedToRead')}`))
        img.src = reader.result as string
      }
      reader.onerror = () => reject(new Error(`${file.name}: ${t('failedToRead')}`))
      reader.readAsDataURL(file)
    })
  }, [t])

  const addFiles = useCallback(async (files: FileList | File[]) => {
    setError('')
    setOutputs([])
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (imageFiles.length === 0) {
      setError(t('invalidInput'))
      return
    }
    // Deduplicate by name + size
    const existing = new Set(inputs.map(i => `${i.file.name}-${i.file.size}`))
    const newFiles = imageFiles.filter(f => !existing.has(`${f.name}-${f.size}`))
    if (newFiles.length === 0) {
      showToast(t('duplicateFile'))
      return
    }
    const results = await Promise.allSettled(newFiles.map(loadImage))
    const loaded: InputFile[] = []
    for (const r of results) {
      if (r.status === 'fulfilled') loaded.push(r.value)
      else setError(r.reason.message)
    }
    if (loaded.length > 0) setInputs(prev => [...prev, ...loaded])
    if (loaded.length === 0) setError(t('failedToRead'))
  }, [inputs, loadImage, t, showToast])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files)
  }, [addFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files)
      e.target.value = ''
    }
  }, [addFiles])

  const convert = useCallback(async () => {
    if (inputs.length === 0) return
    setConverting(true)
    setError('')
    setOutputs([])

    const useResize = resizeEnabled && targetWidth > 0 && targetHeight > 0

    try {
      const fmt = FORMAT_OPTIONS.find(f => f.value === targetFormat)!
      const results: OutputFile[] = []

      for (const input of inputs) {
        const img = new Image()
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error(t('failedToRead')))
          img.src = input.dataUrl
        })

        const cw = useResize ? targetWidth : img.width
        const ch = useResize ? targetHeight : img.height

        const canvas = document.createElement('canvas')
        canvas.width = cw
        canvas.height = ch
        const ctx = canvas.getContext('2d')!

        // JPEG doesn't support alpha; fill with white background
        if (targetFormat === 'jpeg') {
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, cw, ch)
        }

        ctx.drawImage(img, 0, 0, cw, ch)

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(
            (b) => resolve(b),
            fmt.mime,
            targetFormat === 'png' || targetFormat === 'bmp' || targetFormat === 'gif'
              ? undefined
              : quality / 100
          )
        })

        if (!blob) throw new Error(t('conversionFailed'))

        const baseName = input.file.name.replace(/\.[^.]+$/, '')
        const suffix = useResize ? `_${cw}x${ch}` : ''
        results.push({
          blob,
          url: URL.createObjectURL(blob),
          name: `${baseName}${suffix}${fmt.ext}`,
          size: blob.size,
        })
      }

      setOutputs(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('conversionFailed'))
    } finally {
      setConverting(false)
    }
  }, [inputs, targetFormat, quality, targetWidth, targetHeight, resizeEnabled, t])

  const downloadAll = useCallback(async () => {
    if (outputs.length === 1) {
      const a = document.createElement('a')
      a.href = outputs[0].url
      a.download = outputs[0].name
      a.click()
      return
    }
    const zip = new JSZip()
    for (const out of outputs) {
      const blob = await fetch(out.url).then(r => r.blob())
      zip.file(out.name, blob)
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const zipUrl = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = zipUrl
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const y = now.getFullYear()
    const mo = pad(now.getMonth() + 1)
    const d = pad(now.getDate())
    const h = pad(now.getHours())
    const mi = pad(now.getMinutes())
    const s = pad(now.getSeconds())
    a.download = `images-${y}${mo}${d}${h}${mi}${s}.zip`
    a.click()
    URL.revokeObjectURL(zipUrl)
  }, [outputs])

  const clearAll = useCallback(() => {
    outputs.forEach(o => URL.revokeObjectURL(o.url))
    setInputs([])
    setOutputs([])
    setError('')
    setResizeEnabled(false)
    setTargetWidth(0)
    setTargetHeight(0)
  }, [outputs])

  const showQuality = targetFormat === 'jpeg' || targetFormat === 'webp'

  return (
    <div className="mt-6 space-y-4">
      {/* Drop zone — hidden input always rendered so "Add more" works */}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/bmp,image/gif"
        multiple
        onChange={handleFileInput}
        className="hidden"
      />
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => inputRef.current?.click()}
              className={`flex items-center justify-center w-full border-2 border-dashed rounded-sm bg-surface cursor-pointer hover:border-accent/30 transition-colors ${
                isDragOver
                  ? 'border-accent bg-accent/5'
                  : 'border-[rgba(127,99,21,0.2)]'
              } ${inputs.length === 0 ? 'h-40' : 'h-16'}`}
            >
              <div className="text-center pointer-events-none flex items-center gap-2">
                <span className={inputs.length === 0 ? 'text-3xl' : 'text-lg'}>🖼️</span>
                <div>
                  <p className="text-sm text-text-secondary">{t('dropImage')}</p>
                  {inputs.length === 0 && <p className="text-xs text-text-secondary mt-1">{t('maxSize')}</p>}
                </div>
              </div>
            </div>

            {/* Input list */}
      {inputs.length > 0 && (
        <div className="space-y-3 relative">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">
              {t('renSelected', { count: inputs.length })}
            </span>
            <div className="flex items-center gap-3">
              {inputs.length > 4 && (
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="text-xs text-accent hover:underline"
                >
                  {collapsed ? t('showAll', { count: inputs.length }) : t('collapse')}
                </button>
              )}
            </div>
          </div>
          {toast && (
            <div
              key={toast.key}
              className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 text-sm text-red-500 bg-red-50 border border-red-200 rounded-sm px-4 py-2 shadow-md whitespace-nowrap"
            >
              {toast.message}
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {(collapsed ? inputs.slice(0, 4) : inputs).map((input) => (
              <div
                key={input.id}
                className="bg-surface border border-[rgba(127,99,21,0.1)] rounded-sm p-2 relative"
              >
                <button
                  onClick={() => {
                    setInputs(prev => prev.filter(i => i.id !== input.id))
                    setOutputs([])
                  }}
                  className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-xs bg-surface border border-border rounded-sm text-text-secondary hover:text-error hover:border-error/30 transition-colors z-10"
                  title={t('renClear')}
                >
                  ✕
                </button>
                <div className="w-full h-24 bg-[rgba(127,99,21,0.05)] rounded-sm mb-2 flex items-center justify-center overflow-hidden">
                  <img
                    src={input.dataUrl}
                    alt={input.file.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <p className="text-xs text-text-secondary truncate">{input.file.name}</p>
                <p className="text-xs text-text-secondary">
                  {input.width}×{input.height} · {formatSize(input.file.size)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {inputs.length > 0 && (
        <div className="bg-surface border border-[rgba(127,99,21,0.1)] rounded-sm p-4 space-y-4">
          {/* Format target */}
          <div>
            <label className="text-sm text-text-secondary block mb-2">{t('convertTo')}</label>
            <div className="flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map((fmt) => {
                const isCurrent = getInputFormat(inputs[0]?.file) === fmt.value
                return (
                  <button
                    key={fmt.value}
                    onClick={() => setTargetFormat(fmt.value)}
                    className={`px-3 py-1.5 text-xs rounded-sm border transition-colors ${
                      targetFormat === fmt.value
                        ? 'bg-accent text-white border-accent'
                        : 'bg-surface text-text-secondary border-border hover:border-accent/30'
                    } ${isCurrent ? 'opacity-60' : 'cursor-pointer'}`}
                  >
                    {fmt.label}
                  </button>
                )
              })}
            </div>
            {inputs.length > 1 && (
              <p className="text-xs text-text-secondary mt-1">{t('convertAllTo')}</p>
            )}
          </div>

          {/* Resize section */}
                    <div>
                      <label className="text-sm text-text-secondary mb-2 block">{t('resizeOptions')}</label>

                      <div className="space-y-3">
                        {/* Preset buttons */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                          <button
                            onClick={applyOriginal}
                            className={`px-2 py-1 text-xs rounded-sm border transition-colors ${
                              inputs[0] && targetWidth === inputs[0].width && targetHeight === inputs[0].height
                                ? 'bg-accent text-white border-accent'
                                : 'bg-surface text-text-secondary border-border hover:border-accent/30'
                            }`}
                          >
                            {t('resizeOriginal')}
                          </button>
                          {PRESETS.map((p) => (
                            <button
                              key={p.label}
                              onClick={() => applyPreset(p.w, p.h)}
                              title={p.title}
                              className={`px-2 py-1 text-xs rounded-sm border transition-colors ${
                                targetWidth === p.w && targetHeight === p.h
                                  ? 'bg-accent text-white border-accent'
                                  : 'bg-surface text-text-secondary border-border hover:border-accent/30'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>

                        {/* Width & Height inputs */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-text-secondary">{t('resizeWidth')}</label>
                            <input
                              ref={inputWidthRef}
                              type="number"
                              min={1}
                              max={10000}
                              value={targetWidth || ''}
                              onChange={(e) => handleWidthChange(e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-20 p-1.5 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent/30"
                            />
                          </div>
                          <span className="text-text-secondary text-xs">×</span>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-text-secondary">{t('resizeHeight')}</label>
                            <input
                              ref={inputHeightRef}
                              type="number"
                              min={1}
                              max={10000}
                              value={targetHeight || ''}
                              onChange={(e) => handleHeightChange(e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-20 p-1.5 text-xs bg-surface border border-border rounded-sm text-text-primary focus:outline-none focus:border-accent/30"
                            />
                          </div>
                          <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={keepAspectRatio}
                              onChange={(e) => setKeepAspectRatio(e.target.checked)}
                              className="accent-accent"
                            />
                            {t('resizeKeepRatio')}
                          </label>
                        </div>

                        <p className="text-xs text-text-secondary">
                          {inputs[0]?.width}×{inputs[0]?.height} → {targetWidth || '?'}×{targetHeight || '?'}
                        </p>
                      </div>
                    </div>

          {/* Quality slider */}
          {showQuality && (
            <div>
              <label className="text-sm text-text-secondary block mb-1">
                {t('quality')}: {quality}%
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full max-w-xs accent-accent"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={convert}
              disabled={converting}
              className="px-3 py-2 bg-accent text-white text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 min-w-[5rem]"
            >
              {converting ? t('renProcessing') : t('convert')}
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-2 bg-surface text-text-primary text-sm rounded-sm border border-border hover:bg-accent/10 transition-colors min-w-[5rem]"
            >
              {t('renClear')}
            </button>
          </div>
        </div>
      )}

      {/* Outputs */}
      {(outputs.length > 0 || converting) && (
        <div className="space-y-3 relative">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary font-medium">{t('result')}</span>
            {outputs.length > 0 && (
              <button
                onClick={downloadAll}
                className="text-xs px-3 py-1 bg-accent text-white rounded-sm hover:opacity-90 transition-opacity"
              >
                {t('downloadZip')} ({outputs.length})
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {converting && outputs.length === 0 && (
              <>
                {inputs.map((_, i) => (
                  <div key={i} className="bg-surface border border-[rgba(127,99,21,0.1)] rounded-sm p-2 animate-pulse">
                    <div className="w-full h-32 bg-[rgba(127,99,21,0.08)] rounded-sm mb-2" />
                    <div className="h-3 bg-[rgba(127,99,21,0.08)] rounded w-3/4 mb-1" />
                    <div className="h-3 bg-[rgba(127,99,21,0.08)] rounded w-1/2 mb-2" />
                    <div className="h-6 bg-[rgba(127,99,21,0.08)] rounded" />
                  </div>
                ))}
              </>
            )}
            {outputs.map((out, i) => (
              <div
                key={i}
                className="bg-surface border border-[rgba(127,99,21,0.1)] rounded-sm p-2"
              >
                <div className="w-full h-32 bg-[rgba(127,99,21,0.05)] rounded-sm mb-2 flex items-center justify-center overflow-hidden">
                  <img
                    src={out.url}
                    alt={out.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <p className="text-xs text-text-secondary truncate">{out.name}</p>
                <p className="text-xs text-text-secondary">
                  {formatSize(out.size)}
                </p>
                <a
                  href={out.url}
                  download={out.name}
                  className="block mt-2 text-xs text-center text-white bg-accent px-2 py-1 rounded-sm hover:opacity-90 transition-opacity"
                >
                  {t('download')} {FORMAT_OPTIONS.find(f => f.value === targetFormat)?.label ?? targetFormat.toUpperCase()}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}