'use client'

import { useState, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'

export default function YamlJsonConverter() {
  const t = useTranslations('tools')
  const locale = useLocale()
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'yaml2json' | 'json2yaml'>('yaml2json')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const convert = useCallback(async () => {
    setError('')
    if (!input.trim()) { setError(t('pleaseEnterContent')); return }
    try {
      if (mode === 'yaml2json') {
        const yaml = await import('js-yaml')
        const obj = yaml.load(input)
        if (!obj) { setError(t('emptyYaml')); return }
        setOutput(JSON.stringify(obj, null, 2))
      } else {
        const yaml = await import('js-yaml')
        const obj = JSON.parse(input)
        setOutput(yaml.dump(obj, { indent: 2 }))
      }
    } catch (e) {
      setError(`${t('conversionFailed')}: ${(e as Error).message}`)
    }
  }, [input, mode, t])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }, [output])

  return (
    <div className="mt-6 space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setMode('yaml2json')} className={`px-4 py-1.5 text-sm rounded-md transition-colors ${mode === 'yaml2json' ? 'bg-accent text-white' : 'bg-surface text-text-primary'}`}>YAML → JSON</button>
        <button onClick={() => setMode('json2yaml')} className={`px-4 py-1.5 text-sm rounded-md transition-colors ${mode === 'json2yaml' ? 'bg-accent text-white' : 'bg-surface text-text-primary'}`}>JSON → YAML</button>
      </div>
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={mode === 'yaml2json' ? 'key: value' : '{"key": "value"}'} className="w-full h-36 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-md text-sm font-mono text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
      <button onClick={convert} className="px-6 py-2 bg-accent text-white text-sm rounded-md hover:opacity-90">{t('convert')}</button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {output && (
        <div className="relative">
          <textarea readOnly value={output} className="w-full h-36 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-md text-sm font-mono text-text-primary resize-none" />
          <button onClick={handleCopy}
            className={`text-xs px-2 py-1 rounded-md transition-all duration-200 min-w-[4.5rem] text-center absolute top-2 right-6 ${
              copied
                ? 'bg-green-500 text-white scale-105'
                : 'bg-accent text-white hover:opacity-90'
            }`}>
            {copied ? t('copied') : t('copy')}
          </button>
        </div>
      )}
    </div>
  )
}