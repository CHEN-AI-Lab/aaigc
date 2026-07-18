'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useLocale } from 'next-intl'

export default function YamlJsonConverter() {
  const locale = useLocale()
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'yaml2json' | 'json2yaml'>('yaml2json')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [animating, setAnimating] = useState(false)
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const outputRef = useRef<HTMLTextAreaElement>(null)

  const autoResize = useCallback(() => {
    const el = outputRef.current
    if (!el) return
    el.style.height = '0'
    el.style.height = `${el.scrollHeight}px`
  }, [])

  useEffect(() => { autoResize() }, [output, autoResize])

  const convert = useCallback(async () => {
    setError('')
    setOutput('')
    if (!input.trim()) {
      setError(locale === 'en' ? 'Please enter content' : '请输入内容')
      return
    }
    try {
      const yaml = await import('js-yaml')
      if (mode === 'yaml2json') {
        const obj = yaml.load(input)
        // yaml.load() can return undefined for empty/null documents
        if (obj === undefined || obj === null) {
          setError(locale === 'en' ? 'Empty or invalid YAML content' : 'YAML 内容为空或无效')
          return
        }
        setOutput(JSON.stringify(obj, null, 2))
      } else {
        const obj = JSON.parse(input)
        setOutput(yaml.dump(obj, { indent: 2 }))
      }
    } catch (e) {
      setError(`${locale === 'en' ? 'Conversion failed' : '转换失败'}: ${(e as Error).message}`)
    }
  }, [input, mode, locale])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(output)
    setAnimating(true)
    if (animTimer.current) clearTimeout(animTimer.current)
    animTimer.current = setTimeout(() => setAnimating(false), 400)
  }, [output])

  return (
    <div className="mt-6 space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setMode('yaml2json')} className={`px-4 py-1.5 text-sm rounded-sm transition-colors ${mode === 'yaml2json' ? 'bg-accent text-white' : 'bg-surface text-text-primary'}`}>YAML → JSON</button>
        <button onClick={() => setMode('json2yaml')} className={`px-4 py-1.5 text-sm rounded-sm transition-colors ${mode === 'json2yaml' ? 'bg-accent text-white' : 'bg-surface text-text-primary'}`}>JSON → YAML</button>
      </div>
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={mode === 'yaml2json' ? 'key: value' : '{"key": "value"}'} className="w-full h-36 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
      <button onClick={convert} className="px-6 py-2 bg-accent text-white text-sm rounded-sm hover:opacity-90">{locale === 'en' ? 'Convert' : '转换'}</button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {output && (
        <div className="relative">
          <textarea
            ref={outputRef}
            readOnly
            value={output}
            className="w-full min-h-[180px] max-h-[60vh] p-3 pr-16 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary resize-none overflow-y-auto"
          />
          <button
            onClick={handleCopy}
            className={`absolute top-2 right-6 text-xs px-2.5 py-1.5 bg-accent text-white rounded-sm hover:opacity-90 transition-all ${animating ? 'scale-110 opacity-70' : 'opacity-100'}`}
          >
            {locale === 'en' ? 'Copy' : '复制'}
          </button>
        </div>
      )}
    </div>
  )
}