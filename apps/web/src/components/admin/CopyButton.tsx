'use client'
import { useState } from 'react'

interface Props {
  value: string
  label: string
  copiedLabel: string
}

// 复制按钮：优先走 navigator.clipboard（安全上下文），否则降级到临时 textarea。
// 复制成功后 1.5s 内显示「已复制」反馈。
export default function CopyButton({ value, label, copiedLabel }: Props) {
  const [copied, setCopied] = useState(false)
  const onClick = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
      } else {
        // 降级：非安全上下文或旧浏览器
        const ta = document.createElement('textarea')
        ta.value = value
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        try { document.execCommand('copy') } catch { /* swallow */ }
        document.body.removeChild(ta)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // 静默失败：复制不可用时不让按钮报错
    }
  }
  return (
    <button
      onClick={onClick}
      type="button"
      className="rounded-sm border border-border bg-bg/60 px-2.5 py-1 text-xs font-medium text-text-primary hover:bg-accent/10 transition-colors"
    >
      {copied ? copiedLabel : label}
    </button>
  )
}
