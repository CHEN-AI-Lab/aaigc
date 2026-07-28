'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

const EMOJIS: Record<string, string[]> = {
  'Smileys': ['😀','😃','😄','😁','😅','😂','🤣','😊','😇','🙂','😉','😌','😍','🥰','😘','😗','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','😮','😯','😲','😳','🥺','😢','😭','😤','😡','🤬','😈','👿','💀','☠️','💩'],
  'Gestures': ['👍','👎','👌','✌️','🤞','🤟','🤘','🤙','👋','🖐️','✋','🖖','👏','🙌','🤲','🤝','🙏','✍️','💅','👀','👅','👄'],
  'Animals': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🐘'],
  'Food': ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🧄','🧅','🥔','🍠','🥐','🍞','🥖','🥨','🧀','🥚','🍳','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🥗','🥘','🫕','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜'],
  'Symbols': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚕️','♻️','⚜️','🔱','📛','🔰','⭕','✅','☑️','✔️','❌','❎','➖','➕','➗','➰','〰️','💲','💱','✖️','❗','❕','❓','❔','‼️','⁉️','🔅','🔆'],
}

export default function EmojiPicker() {
  const t = useTranslations('tools')
  const [cat, setCat] = useState('Smileys')
  const [copied, setCopied] = useState('')

  const copy = async (emoji: string) => {
    try { await navigator.clipboard.writeText(emoji); setCopied(emoji); setTimeout(() => setCopied(''), 1500) } catch {}
  }

  return (
    <div className="mt-6 space-y-4">
      <p className="text-xs text-text-secondary mb-3">点击任意 Emoji 即可复制到剪贴板，粘贴到聊天、文档或社交媒体中使用</p>
      <div className="flex gap-2 flex-wrap">
        {Object.keys(EMOJIS).map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-3 py-1.5 text-xs rounded-sm transition-colors ${cat === c ? 'bg-accent text-white' : 'bg-surface text-text-primary border border-[rgba(127,99,21,0.15)]'}`}>{c}</button>
        ))}
      </div>
      <div className="grid grid-cols-8 sm:grid-cols-12 gap-1">
        {EMOJIS[cat].map((e, i) => (
          <button key={i} onClick={() => copy(e)}
            className={`text-xl p-2 rounded-sm hover:bg-accent/10 transition-colors text-center ${copied === e ? 'bg-green-500/20' : ''}`}
            title={e}>{e}</button>
        ))}
      </div>
      {copied && <p className="text-xs text-green-500 text-center">✓ {t('copied')}</p>}
    </div>
  )
}