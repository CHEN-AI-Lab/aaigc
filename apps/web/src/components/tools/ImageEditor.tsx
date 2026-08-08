'use client'

import { useState, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'

type Mode = 'crop' | 'rotate' | 'flip'
interface CropRect { x: number; y: number; w: number; h: number }

function getDisplayContent(img: HTMLImageElement) {
  const elW = img.width, elH = img.height
  const natW = img.naturalWidth, natH = img.naturalHeight
  const scale = Math.min(elW / natW, elH / natH)
  return { contentW: natW * scale, contentH: natH * scale, offsetX: (elW - natW * scale) / 2, offsetY: (elH - natH * scale) / 2 }
}

export default function ImageEditor() {
  const t = useTranslations('tools')
  const [file, setFile] = useState<File | null>(null)
  const [dataUrl, setDataUrl] = useState('')
  const [originalDataUrl, setOriginalDataUrl] = useState('')
  const [mode, setMode] = useState<Mode>('crop')
  const [isDragOver, setIsDragOver] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [cropping, setCropping] = useState(false)
  const [cropStart, setCropStart] = useState({ x: 0, y: 0 })
  const [cropRect, setCropRect] = useState<CropRect | null>(null)
  const [angle, setAngle] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [showZoom, setShowZoom] = useState(false)
  const lbImgRef = useRef<HTMLImageElement>(null)
  const lbContainerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((f: File) => {
    if (f.size > 20 * 1024 * 1024) { setError(t('fileTooLarge')); return }
    setError(''); setCropRect(null); setAngle(0); setFlipH(false); setFlipV(false)
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      setDataUrl(url)
      setOriginalDataUrl(url)
    }
    reader.readAsDataURL(f)
    setFile(f)
  }, [t])

  const addFiles = useCallback((files: FileList | File[]) => {
    const f = Array.from(files).find(f => f.type.startsWith('image/'))
    if (f) handleFile(f); else setError(t('invalidInput'))
  }, [handleFile, t])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false)
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files)
  }, [addFiles])

  // ── Crop mouse handlers ──
  const getCropPos = useCallback((e: React.MouseEvent, container: HTMLElement, img: HTMLImageElement) => {
    const rect = container.getBoundingClientRect()
    const { contentW, contentH, offsetX, offsetY } = getDisplayContent(img)
    const natW = img.naturalWidth, natH = img.naturalHeight
    return {
      x: ((e.clientX - rect.left - offsetX) / contentW) * natW,
      y: ((e.clientY - rect.top - offsetY) / contentH) * natH,
    }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (mode !== 'crop' || !containerRef.current || !imgRef.current) return
    const pos = getCropPos(e, containerRef.current, imgRef.current)
    const natW = imgRef.current.naturalWidth, natH = imgRef.current.naturalHeight
    // Ignore clicks outside the image content area
    if (pos.x < 0 || pos.x > natW || pos.y < 0 || pos.y > natH) return
    setCropping(true); setCropStart(pos)
    setCropRect({ x: pos.x, y: pos.y, w: 0, h: 0 })
  }, [mode, getCropPos])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cropping || mode !== 'crop' || !imgRef.current || !containerRef.current) return
    const pos = getCropPos(e, containerRef.current, imgRef.current)
    const natW = imgRef.current.naturalWidth, natH = imgRef.current.naturalHeight
    const x = Math.max(0, Math.min(cropStart.x, pos.x))
    const y = Math.max(0, Math.min(cropStart.y, pos.y))
    const w = Math.min(Math.abs(pos.x - cropStart.x), natW - x)
    const h = Math.min(Math.abs(pos.y - cropStart.y), natH - y)
    setCropRect({ x, y, w, h })
  }, [cropping, mode, cropStart, getCropPos])

  // ── Lightbox crop handlers ──
  const handleLbMouseDown = useCallback((e: React.MouseEvent) => {
    if (mode !== 'crop' || !lbContainerRef.current || !lbImgRef.current) return
    const pos = getCropPos(e, lbContainerRef.current, lbImgRef.current)
    const natW = lbImgRef.current.naturalWidth, natH = lbImgRef.current.naturalHeight
    if (pos.x < 0 || pos.x > natW || pos.y < 0 || pos.y > natH) return
    setCropping(true); setCropStart(pos)
    setCropRect({ x: pos.x, y: pos.y, w: 0, h: 0 })
  }, [mode, getCropPos])

  const handleLbMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cropping || mode !== 'crop' || !lbImgRef.current || !lbContainerRef.current) return
    const pos = getCropPos(e, lbContainerRef.current, lbImgRef.current)
    const natW = lbImgRef.current.naturalWidth, natH = lbImgRef.current.naturalHeight
    const x = Math.max(0, Math.min(cropStart.x, pos.x))
    const y = Math.max(0, Math.min(cropStart.y, pos.y))
    const w = Math.min(Math.abs(pos.x - cropStart.x), natW - x)
    const h = Math.min(Math.abs(pos.y - cropStart.y), natH - y)
    setCropRect({ x, y, w, h })
  }, [cropping, mode, cropStart, getCropPos])

  const handleMouseUp = useCallback(() => setCropping(false), [])

  // ── Apply ──
  const applyEdit = useCallback(async () => {
    setProcessing(true); setError('')
    try {
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error(t('failedToRead')))
        img.src = dataUrl
      })

      let cw = img.width, ch = img.height
      let sx = 0, sy = 0, sw = img.width, sh = img.height

      if (mode === 'crop' && cropRect && cropRect.w > 5 && cropRect.h > 5) {
        sx = cropRect.x; sy = cropRect.y; sw = cropRect.w; sh = cropRect.h; cw = sw; ch = sh
      }

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      if (mode === 'rotate' && angle !== 0) {
        const rad = Math.abs(angle) * Math.PI / 180
        canvas.width = Math.abs(cw * Math.cos(rad)) + Math.abs(ch * Math.sin(rad))
        canvas.height = Math.abs(cw * Math.sin(rad)) + Math.abs(ch * Math.cos(rad))
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate(angle * Math.PI / 180)
        ctx.drawImage(img, sx, sy, sw, sh, -cw / 2, -ch / 2, cw, ch)
      } else {
        canvas.width = cw; canvas.height = ch
        if (mode === 'flip' && (flipH || flipV)) {
          ctx.translate(flipH ? cw : 0, flipV ? ch : 0)
          ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch)
      }

      const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'))
      if (!blob) throw new Error(t('conversionFailed'))

      const url = URL.createObjectURL(blob)
      // Revoke previous blob URL (but not the original data: URL)
      if (dataUrl !== originalDataUrl) URL.revokeObjectURL(dataUrl)
      setDataUrl(url)
      setCropRect(null); setAngle(0); setFlipH(false); setFlipV(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('conversionFailed'))
    } finally { setProcessing(false) }
  }, [dataUrl, originalDataUrl, mode, cropRect, angle, flipH, flipV, t])

  const download = useCallback(() => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const ts = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = file ? `${file.name.replace(/\.[^.]+$/, '')}_${ts}.png` : `edited_${ts}.png`
    a.click()
  }, [dataUrl, file])

  const resetAll = useCallback(() => {
    if (dataUrl !== originalDataUrl) URL.revokeObjectURL(dataUrl)
    setDataUrl(originalDataUrl)
    setCropRect(null); setAngle(0); setFlipH(false); setFlipV(false); setError('')
  }, [dataUrl, originalDataUrl])

  const clearAll = useCallback(() => {
    if (dataUrl !== originalDataUrl) URL.revokeObjectURL(dataUrl)
    setFile(null); setDataUrl(''); setOriginalDataUrl(''); setCropRect(null); setAngle(0); setFlipH(false); setFlipV(false); setError('')
  }, [dataUrl, originalDataUrl])

  const hasEdited = dataUrl !== originalDataUrl

  return (
    <div className="mt-6 space-y-4">
      <input ref={inputRef} type="file" accept="image/*" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} className="hidden" />

      {!dataUrl && (
        <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setIsDragOver(true) }} onDragLeave={() => setIsDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={`flex items-center justify-center w-full h-40 border-2 border-dashed rounded-sm bg-surface cursor-pointer hover:border-accent/30 transition-colors ${isDragOver ? 'border-accent bg-accent/5' : 'border-[rgba(127,99,21,0.2)]'}`}>
          <div className="text-center pointer-events-none">
            <div className="text-3xl mb-2">🖼️</div>
            <p className="text-sm text-text-secondary">{t('dropImage')}</p>
            <p className="text-xs text-text-secondary mt-1">{t('maxSize')}</p>
          </div>
        </div>
      )}

      {dataUrl && (
        <>
          {/* Preview */}
          <div ref={containerRef} className="relative bg-surface border border-[rgba(127,99,21,0.1)] rounded-sm overflow-hidden cursor-crosshair select-none"
            onMouseDown={handleMouseDown} onMouseMove={(e) => {
              handleMouseMove(e)
              if (imgRef.current) {
                const { offsetX, offsetY, contentW, contentH } = getDisplayContent(imgRef.current)
                const rect = containerRef.current?.getBoundingClientRect()
                if (rect) {
                  const mx = e.clientX - rect.left, my = e.clientY - rect.top
                  setShowZoom(mx >= offsetX && mx <= offsetX + contentW && my >= offsetY && my <= offsetY + contentH)
                }
              }
            }} onMouseUp={handleMouseUp} onMouseLeave={(e) => { handleMouseUp(); setShowZoom(false) }}>
            <img ref={imgRef} src={dataUrl} alt="Preview" className="w-full h-auto max-h-[60vh] object-contain" draggable={false} />
            {showZoom && imgRef.current && (() => {
              const { offsetX, offsetY, contentW } = getDisplayContent(imgRef.current)
              return (
                <button onClick={() => setLightboxOpen(true)}
                  className="absolute text-xs px-2 py-1 bg-surface/80 border border-border rounded-sm text-text-secondary hover:bg-surface transition-opacity z-10"
                  style={{ left: offsetX + contentW - 36, top: offsetY + 4 }}>
                  🔍
                </button>
              )
            })()}
            {mode === 'crop' && cropRect && cropRect.w > 0 && cropRect.h > 0 && imgRef.current && (() => {
              const { contentW, contentH, offsetX, offsetY } = getDisplayContent(imgRef.current)
              const natW = imgRef.current.naturalWidth, natH = imgRef.current.naturalHeight
              const l = offsetX + (cropRect.x / natW) * contentW
              const t2 = offsetY + (cropRect.y / natH) * contentH
              const w = (cropRect.w / natW) * contentW
              const h = (cropRect.h / natH) * contentH
              return <div className="absolute border-2 border-accent bg-accent/20 pointer-events-none" style={{ left: l, top: t2, width: w, height: h }} />
            })()}
          </div>

          {/* Controls */}
          <div className="bg-surface border border-[rgba(127,99,21,0.1)] rounded-sm p-4 space-y-4">
            <div className="flex gap-2">
              {(['crop', 'rotate', 'flip'] as Mode[]).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={`px-3 py-1.5 text-xs rounded-sm border transition-colors ${mode === m ? 'bg-accent text-white border-accent' : 'bg-surface text-text-secondary border-border hover:border-accent/30'}`}>
                  {t(m)}
                </button>
              ))}
            </div>
            {mode === 'crop' && !hasEdited && <p className="text-xs text-text-secondary px-3 py-1.5">{t('cropHint')}</p>}
            {mode === 'rotate' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => setAngle(a => (a - 90 + 360) % 360)} className="px-3 py-1.5 text-xs rounded-sm border border-border bg-surface text-text-secondary hover:border-accent/30 transition-colors">{t('rotateLeft')}</button>
                  <button onClick={() => setAngle(a => (a + 90) % 360)} className="px-3 py-1.5 text-xs rounded-sm border border-border bg-surface text-text-secondary hover:border-accent/30 transition-colors">{t('rotateRight')}</button>
                  <span className="text-xs text-text-secondary ml-1">{angle}°</span>
                  <input type="range" min={0} max={360} value={angle} onChange={e => setAngle(Number(e.target.value))} className="w-20 accent-accent" />
                </div>
              </div>
            )}

            {mode === 'flip' && (
              <div className="flex gap-2">
                <button onClick={() => setFlipH(h => !h)}
                  className={`px-3 py-1.5 text-xs rounded-sm border transition-colors ${flipH ? 'bg-accent text-white border-accent' : 'bg-surface text-text-secondary border-border hover:border-accent/30'}`}>{t('flipH')}</button>
                <button onClick={() => setFlipV(v => !v)}
                  className={`px-3 py-1.5 text-xs rounded-sm border transition-colors ${flipV ? 'bg-accent text-white border-accent' : 'bg-surface text-text-secondary border-border hover:border-accent/30'}`}>{t('flipV')}</button>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={applyEdit} disabled={processing}
                className="px-3 py-2 bg-accent text-white text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 min-w-[5rem]">
                {processing ? t('renProcessing') : t('apply')}
              </button>
              <button onClick={resetAll} disabled={!hasEdited}
                className="px-3 py-2 text-sm text-text-secondary border border-border rounded-sm bg-surface hover:border-accent/30 transition-colors disabled:opacity-30">{t('reset')}</button>
              <button onClick={clearAll} className="px-3 py-2 text-sm text-text-secondary border border-border rounded-sm bg-surface hover:border-accent/30 transition-colors">{t('renClear')}</button>
              {hasEdited && (
                <button onClick={download}
                  className="px-3 py-2 bg-accent text-white text-sm rounded-lg hover:opacity-90 transition-opacity">
                  {t('download')}
                </button>
              )}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Lightbox */}
          {lightboxOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
              onClick={(e) => { if (e.target === e.currentTarget) setLightboxOpen(false) }}>
              <div ref={lbContainerRef}
                className={`relative ${mode === 'crop' ? 'cursor-crosshair select-none' : ''}`}
                onMouseDown={handleLbMouseDown} onMouseMove={handleLbMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                <img ref={lbImgRef} src={dataUrl} alt="Full size" className="max-w-[95vw] max-h-[95vh] object-contain" draggable={false} />
                {mode === 'crop' && cropRect && cropRect.w > 0 && cropRect.h > 0 && lbImgRef.current && (() => {
                  const { contentW, contentH, offsetX, offsetY } = getDisplayContent(lbImgRef.current)
                  const natW = lbImgRef.current.naturalWidth, natH = lbImgRef.current.naturalHeight
                  const l = offsetX + (cropRect.x / natW) * contentW
                  const t2 = offsetY + (cropRect.y / natH) * contentH
                  const w = (cropRect.w / natW) * contentW
                  const h = (cropRect.h / natH) * contentH
                  return <div className="absolute border-2 border-accent bg-accent/20 pointer-events-none" style={{ left: l, top: t2, width: w, height: h }} />
                })()}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}