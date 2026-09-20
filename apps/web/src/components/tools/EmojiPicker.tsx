'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
// 旧行为：组件内嵌 emoji 数据集 → 新行为：以 shared/tools/emoji-picker 的 EMOJI_ENTRIES 为准（条目/分类可能不同），已确认接受
import { EMOJI_CATEGORIES, EMOJI_ENTRIES } from 'shared/tools/emoji-picker'
import type { EmojiCategoryId, EmojiEntry } from 'shared/tools/emoji-picker'

/** shared 返回完整 i18n key（tools.xxx），本组件 t 已限定在 tools 命名空间 */
function localKey(fullKey: string): string {
  return fullKey.replace(/^tools\./, '')
}

export default function EmojiPicker() {
  const t = useTranslations('tools')
  const locale = useLocale()

  const emojiName = (item: EmojiEntry) => {
    if (locale !== 'en') {
      const localized = t(localKey(item.nameKey))
      if (localized && !localized.startsWith('emojiName')) return localized
    }
    return item.name
  }
  const [cat, setCat] = useState<EmojiCategoryId>('smileys')
  const [copied, setCopied] = useState('')

  const copy = async (emoji: string) => {
    try { await navigator.clipboard.writeText(emoji); setCopied(emoji); setTimeout(() => setCopied(''), 1500) } catch { /* clipboard write may fail silently */ }
  }

  const entries = EMOJI_ENTRIES.filter((entry) => entry.category === cat)

  return (
    <div className="mt-6 space-y-4">
      <p className="text-xs text-text-secondary mb-3">{t('emojiDesc')}</p>
      <div className="flex gap-2 flex-wrap">
        {EMOJI_CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)}
            className={`px-3 py-1.5 text-xs rounded-sm transition-colors ${cat === c.id ? 'bg-accent text-white' : 'bg-surface text-text-primary border border-border'}`}>{t(localKey(c.key))}</button>
        ))}
      </div>
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1">
        {entries.map((item, i) => (
          <button key={i} onClick={() => copy(item.emoji)}
            className={`text-xl p-2 rounded-sm hover:bg-accent/10 transition-colors text-center ${copied === item.emoji ? 'bg-success/20' : ''}`}
            title={emojiName(item)}>{item.emoji}</button>
        ))}
      </div>
      {copied && <p className="text-xs text-success text-center">✓ {t('copied')}</p>}
    </div>
  )
}
