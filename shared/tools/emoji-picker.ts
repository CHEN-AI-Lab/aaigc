// emoji-picker —— T1 纯数据：emoji 表检索
// emoji 的英文名为数据（非 UI 文案），端侧优先用 nameKey 取本地化名，缺失时回退 name。

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolOk, readString } from './common'

export type EmojiCategoryId = 'smileys' | 'gestures' | 'animals' | 'food' | 'symbols'

export interface EmojiEntry {
  emoji: string
  category: EmojiCategoryId
  categoryKey: string
  name: string
  /** tools.emojiName<HEX>，HEX 为码点大写十六进制 */
  nameKey: string
}

export interface EmojiPickerInput {
  category: string
  query: string
}

export interface EmojiPickerOutput {
  entries: EmojiEntry[]
  categories: { id: EmojiCategoryId; key: string }[]
  total: number
}

const CATEGORY_KEYS: Record<EmojiCategoryId, string> = {
  smileys: 'tools.emojiSmileys',
  gestures: 'tools.emojiGestures',
  animals: 'tools.emojiAnimals',
  food: 'tools.emojiFood',
  symbols: 'tools.emojiSymbols',
}

interface RawEmoji {
  category: EmojiCategoryId
  emoji: string
  name: string
}

const RAW: readonly RawEmoji[] = [
  { category: 'smileys', emoji: '😀', name: 'Grinning Face' },
  { category: 'smileys', emoji: '😃', name: 'Grinning Face with Big Eyes' },
  { category: 'smileys', emoji: '😄', name: 'Grinning Face with Smiling Eyes' },
  { category: 'smileys', emoji: '😁', name: 'Beaming Face with Smiling Eyes' },
  { category: 'smileys', emoji: '😂', name: 'Face with Tears of Joy' },
  { category: 'smileys', emoji: '🤣', name: 'Rolling on the Floor Laughing' },
  { category: 'smileys', emoji: '😊', name: 'Smiling Face with Smiling Eyes' },
  { category: 'smileys', emoji: '😇', name: 'Smiling Face with Halo' },
  { category: 'smileys', emoji: '🙂', name: 'Slightly Smiling Face' },
  { category: 'smileys', emoji: '😉', name: 'Winking Face' },
  { category: 'smileys', emoji: '😍', name: 'Smiling Face with Heart-Eyes' },
  { category: 'smileys', emoji: '🥰', name: 'Smiling Face with Hearts' },
  { category: 'smileys', emoji: '😘', name: 'Face Blowing a Kiss' },
  { category: 'smileys', emoji: '😋', name: 'Face Savoring Food' },
  { category: 'smileys', emoji: '😜', name: 'Winking Face with Tongue' },
  { category: 'smileys', emoji: '🤪', name: 'Zany Face' },
  { category: 'smileys', emoji: '🤗', name: 'Hugging Face' },
  { category: 'smileys', emoji: '🤔', name: 'Thinking Face' },
  { category: 'smileys', emoji: '🤨', name: 'Face with Raised Eyebrow' },
  { category: 'smileys', emoji: '😐', name: 'Neutral Face' },
  { category: 'smileys', emoji: '😑', name: 'Expressionless Face' },
  { category: 'smileys', emoji: '🙄', name: 'Face with Rolling Eyes' },
  { category: 'smileys', emoji: '😬', name: 'Grimacing Face' },
  { category: 'smileys', emoji: '😮', name: 'Face with Open Mouth' },
  { category: 'smileys', emoji: '😲', name: 'Astonished Face' },
  { category: 'smileys', emoji: '😳', name: 'Flushed Face' },
  { category: 'smileys', emoji: '🥺', name: 'Pleading Face' },
  { category: 'smileys', emoji: '😢', name: 'Crying Face' },
  { category: 'smileys', emoji: '😭', name: 'Loudly Crying Face' },
  { category: 'smileys', emoji: '😤', name: 'Face with Steam From Nose' },
  { category: 'smileys', emoji: '😡', name: 'Pouting Face' },
  { category: 'smileys', emoji: '💀', name: 'Skull' },
  { category: 'smileys', emoji: '👻', name: 'Ghost' },
  { category: 'smileys', emoji: '🤖', name: 'Robot' },
  { category: 'smileys', emoji: '🎉', name: 'Party Popper' },
  { category: 'smileys', emoji: '✨', name: 'Sparkles' },

  { category: 'gestures', emoji: '👍', name: 'Thumbs Up' },
  { category: 'gestures', emoji: '👎', name: 'Thumbs Down' },
  { category: 'gestures', emoji: '👌', name: 'OK Hand' },
  { category: 'gestures', emoji: '✌️', name: 'Victory Hand' },
  { category: 'gestures', emoji: '🤞', name: 'Crossed Fingers' },
  { category: 'gestures', emoji: '🤟', name: 'Love-You Gesture' },
  { category: 'gestures', emoji: '🤘', name: 'Sign of the Horns' },
  { category: 'gestures', emoji: '👋', name: 'Waving Hand' },
  { category: 'gestures', emoji: '👏', name: 'Clapping Hands' },
  { category: 'gestures', emoji: '🙌', name: 'Raising Hands' },
  { category: 'gestures', emoji: '🤝', name: 'Handshake' },
  { category: 'gestures', emoji: '🙏', name: 'Folded Hands' },
  { category: 'gestures', emoji: '✍️', name: 'Writing Hand' },
  { category: 'gestures', emoji: '👀', name: 'Eyes' },
  { category: 'gestures', emoji: '💪', name: 'Flexed Biceps' },
  { category: 'gestures', emoji: '🫡', name: 'Saluting Face' },

  { category: 'animals', emoji: '🐶', name: 'Dog Face' },
  { category: 'animals', emoji: '🐱', name: 'Cat Face' },
  { category: 'animals', emoji: '🐭', name: 'Mouse Face' },
  { category: 'animals', emoji: '🐹', name: 'Hamster' },
  { category: 'animals', emoji: '🐰', name: 'Rabbit Face' },
  { category: 'animals', emoji: '🦊', name: 'Fox' },
  { category: 'animals', emoji: '🐻', name: 'Bear' },
  { category: 'animals', emoji: '🐼', name: 'Panda' },
  { category: 'animals', emoji: '🐨', name: 'Koala' },
  { category: 'animals', emoji: '🐯', name: 'Tiger Face' },
  { category: 'animals', emoji: '🦁', name: 'Lion' },
  { category: 'animals', emoji: '🐮', name: 'Cow Face' },
  { category: 'animals', emoji: '🐷', name: 'Pig Face' },
  { category: 'animals', emoji: '🐸', name: 'Frog' },
  { category: 'animals', emoji: '🐵', name: 'Monkey Face' },
  { category: 'animals', emoji: '🐔', name: 'Chicken' },
  { category: 'animals', emoji: '🐧', name: 'Penguin' },
  { category: 'animals', emoji: '🐦', name: 'Bird' },
  { category: 'animals', emoji: '🦆', name: 'Duck' },
  { category: 'animals', emoji: '🦉', name: 'Owl' },
  { category: 'animals', emoji: '🦇', name: 'Bat' },
  { category: 'animals', emoji: '🐺', name: 'Wolf' },
  { category: 'animals', emoji: '🐴', name: 'Horse Face' },
  { category: 'animals', emoji: '🦄', name: 'Unicorn' },
  { category: 'animals', emoji: '🐝', name: 'Honeybee' },
  { category: 'animals', emoji: '🦋', name: 'Butterfly' },
  { category: 'animals', emoji: '🐌', name: 'Snail' },
  { category: 'animals', emoji: '🐢', name: 'Turtle' },
  { category: 'animals', emoji: '🐍', name: 'Snake' },
  { category: 'animals', emoji: '🐙', name: 'Octopus' },
  { category: 'animals', emoji: '🐟', name: 'Fish' },
  { category: 'animals', emoji: '🐬', name: 'Dolphin' },
  { category: 'animals', emoji: '🐳', name: 'Spouting Whale' },
  { category: 'animals', emoji: '🦈', name: 'Shark' },
  { category: 'animals', emoji: '🐘', name: 'Elephant' },

  { category: 'food', emoji: '🍎', name: 'Red Apple' },
  { category: 'food', emoji: '🍊', name: 'Tangerine' },
  { category: 'food', emoji: '🍋', name: 'Lemon' },
  { category: 'food', emoji: '🍌', name: 'Banana' },
  { category: 'food', emoji: '🍉', name: 'Watermelon' },
  { category: 'food', emoji: '🍇', name: 'Grapes' },
  { category: 'food', emoji: '🍓', name: 'Strawberry' },
  { category: 'food', emoji: '🍒', name: 'Cherries' },
  { category: 'food', emoji: '🍑', name: 'Peach' },
  { category: 'food', emoji: '🥭', name: 'Mango' },
  { category: 'food', emoji: '🍍', name: 'Pineapple' },
  { category: 'food', emoji: '🥝', name: 'Kiwi' },
  { category: 'food', emoji: '🍅', name: 'Tomato' },
  { category: 'food', emoji: '🥑', name: 'Avocado' },
  { category: 'food', emoji: '🌽', name: 'Corn' },
  { category: 'food', emoji: '🥕', name: 'Carrot' },
  { category: 'food', emoji: '🍞', name: 'Bread' },
  { category: 'food', emoji: '🧀', name: 'Cheese Wedge' },
  { category: 'food', emoji: '🍔', name: 'Hamburger' },
  { category: 'food', emoji: '🍟', name: 'French Fries' },
  { category: 'food', emoji: '🍕', name: 'Pizza' },
  { category: 'food', emoji: '🌮', name: 'Taco' },
  { category: 'food', emoji: '🍜', name: 'Steaming Bowl' },
  { category: 'food', emoji: '🍣', name: 'Sushi' },
  { category: 'food', emoji: '🍚', name: 'Cooked Rice' },
  { category: 'food', emoji: '🍰', name: 'Shortcake' },
  { category: 'food', emoji: '🎂', name: 'Birthday Cake' },
  { category: 'food', emoji: '🍫', name: 'Chocolate Bar' },
  { category: 'food', emoji: '🍩', name: 'Doughnut' },
  { category: 'food', emoji: '☕', name: 'Hot Beverage' },
  { category: 'food', emoji: '🍺', name: 'Beer Mug' },

  { category: 'symbols', emoji: '❤️', name: 'Red Heart' },
  { category: 'symbols', emoji: '🧡', name: 'Orange Heart' },
  { category: 'symbols', emoji: '💛', name: 'Yellow Heart' },
  { category: 'symbols', emoji: '💚', name: 'Green Heart' },
  { category: 'symbols', emoji: '💙', name: 'Blue Heart' },
  { category: 'symbols', emoji: '💜', name: 'Purple Heart' },
  { category: 'symbols', emoji: '🖤', name: 'Black Heart' },
  { category: 'symbols', emoji: '💔', name: 'Broken Heart' },
  { category: 'symbols', emoji: '💯', name: 'Hundred Points' },
  { category: 'symbols', emoji: '🔥', name: 'Fire' },
  { category: 'symbols', emoji: '⭐', name: 'Star' },
  { category: 'symbols', emoji: '✅', name: 'Check Mark Button' },
  { category: 'symbols', emoji: '❌', name: 'Cross Mark' },
  { category: 'symbols', emoji: '⚠️', name: 'Warning' },
  { category: 'symbols', emoji: '❓', name: 'Red Question Mark' },
  { category: 'symbols', emoji: '❗', name: 'Red Exclamation Mark' },
  { category: 'symbols', emoji: '♻️', name: 'Recycling Symbol' },
  { category: 'symbols', emoji: '⚡', name: 'High Voltage' },
  { category: 'symbols', emoji: '💡', name: 'Light Bulb' },
  { category: 'symbols', emoji: '🚀', name: 'Rocket' },
]

export const EMOJI_ENTRIES: readonly EmojiEntry[] = RAW.map((item) => ({
  emoji: item.emoji,
  category: item.category,
  categoryKey: CATEGORY_KEYS[item.category],
  name: item.name,
  nameKey: `tools.emojiName${(item.emoji.codePointAt(0) ?? 0).toString(16).toUpperCase()}`,
}))

export const EMOJI_CATEGORIES: readonly { id: EmojiCategoryId; key: string }[] = (
  ['smileys', 'gestures', 'animals', 'food', 'symbols'] as EmojiCategoryId[]
).map((id) => ({ id, key: CATEGORY_KEYS[id] }))

const CATEGORY_IDS = EMOJI_CATEGORIES.map((c) => c.id)

export function parseEmojiPicker(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<EmojiPickerInput> {
  const rawCategory = readString(raw, 'category') ?? 'smileys'
  const category = (CATEGORY_IDS as string[]).includes(rawCategory) ? rawCategory : 'smileys'
  return toolOk({ category, query: (readString(raw, 'query') ?? '').trim() })
}

export function runEmojiPicker(input: EmojiPickerInput, _ctx: ToolContext): ToolOutcome<EmojiPickerOutput> {
  const query = input.query.toLowerCase()
  const entries = EMOJI_ENTRIES.filter((entry) => {
    if (query.length === 0) return entry.category === input.category
    return entry.name.toLowerCase().includes(query) || entry.emoji === input.query
  })
  return toolOk({ entries, categories: [...EMOJI_CATEGORIES], total: entries.length })
}

export function renderEmojiPicker(out: EmojiPickerOutput, _ctx: ToolContext): string {
  return out.entries.map((entry) => `${entry.emoji}\t${entry.name}`).join('\n')
}

export const emojiPickerTool: ToolDefinition<EmojiPickerInput, EmojiPickerOutput> = {
  id: 'emoji-picker',
  tier: 'T1',
  capabilities: [],
  inputs: [
    { name: 'category', kind: 'select', required: false, labelKey: 'tools.category', default: 'smileys' },
    { name: 'query', kind: 'text', required: false, labelKey: 'tools.search' },
  ],
  parse: parseEmojiPicker,
  run: runEmojiPicker,
  render: renderEmojiPicker,
}
