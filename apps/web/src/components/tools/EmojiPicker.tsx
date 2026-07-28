'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

const EMOJIS: Record<string, { emoji: string; name: string }[]> = {
  'Smileys': [
    { emoji: '😀', name: 'Grinning Face' }, { emoji: '😃', name: 'Grinning Face with Big Eyes' }, { emoji: '😄', name: 'Grinning Face with Smiling Eyes' },
    { emoji: '😁', name: 'Beaming Face with Smiling Eyes' }, { emoji: '😅', name: 'Grinning Face with Sweat' }, { emoji: '😂', name: 'Face with Tears of Joy' },
    { emoji: '🤣', name: 'Rolling on the Floor Laughing' }, { emoji: '😊', name: 'Smiling Face with Smiling Eyes' }, { emoji: '😇', name: 'Smiling Face with Halo' },
    { emoji: '🙂', name: 'Slightly Smiling Face' }, { emoji: '😉', name: 'Winking Face' }, { emoji: '😌', name: 'Relieved Face' },
    { emoji: '😍', name: 'Smiling Face with Heart-Eyes' }, { emoji: '🥰', name: 'Smiling Face with Hearts' }, { emoji: '😘', name: 'Face Blowing a Kiss' },
    { emoji: '😗', name: 'Kissing Face' }, { emoji: '😋', name: 'Face Savoring Food' }, { emoji: '😛', name: 'Face with Tongue' },
    { emoji: '😜', name: 'Winking Face with Tongue' }, { emoji: '🤪', name: 'Zany Face' }, { emoji: '😝', name: 'Squinting Face with Tongue' },
    { emoji: '🤑', name: 'Money-Mouth Face' }, { emoji: '🤗', name: 'Hugging Face' }, { emoji: '🤭', name: 'Face with Hand Over Mouth' },
    { emoji: '🤫', name: 'Shushing Face' }, { emoji: '🤔', name: 'Thinking Face' }, { emoji: '🤐', name: 'Zipper-Mouth Face' },
    { emoji: '🤨', name: 'Face with Raised Eyebrow' }, { emoji: '😐', name: 'Neutral Face' }, { emoji: '😑', name: 'Expressionless Face' },
    { emoji: '😶', name: 'Face Without Mouth' }, { emoji: '😏', name: 'Smirking Face' }, { emoji: '😒', name: 'Unamused Face' },
    { emoji: '🙄', name: 'Face with Rolling Eyes' }, { emoji: '😬', name: 'Grimacing Face' }, { emoji: '😮', name: 'Face with Open Mouth' },
    { emoji: '😯', name: 'Hushed Face' }, { emoji: '😲', name: 'Astonished Face' }, { emoji: '😳', name: 'Flushed Face' },
    { emoji: '🥺', name: 'Pleading Face' }, { emoji: '😢', name: 'Crying Face' }, { emoji: '😭', name: 'Loudly Crying Face' },
    { emoji: '😤', name: 'Face with Steam From Nose' }, { emoji: '😡', name: 'Pouting Face' }, { emoji: '🤬', name: 'Face with Symbols on Mouth' },
    { emoji: '😈', name: 'Smiling Face with Horns' }, { emoji: '👿', name: 'Angry Face with Horns' }, { emoji: '💀', name: 'Skull' }, { emoji: '☠️', name: 'Skull and Crossbones' }, { emoji: '💩', name: 'Pile of Poo' },
  ],
  'Gestures': [
    { emoji: '👍', name: 'Thumbs Up' }, { emoji: '👎', name: 'Thumbs Down' }, { emoji: '👌', name: 'OK Hand' }, { emoji: '✌️', name: 'Victory Hand' },
    { emoji: '🤞', name: 'Crossed Fingers' }, { emoji: '🤟', name: 'Love-You Gesture' }, { emoji: '🤘', name: 'Sign of the Horns' },
    { emoji: '🤙', name: 'Call Me Hand' }, { emoji: '👋', name: 'Waving Hand' }, { emoji: '🖐️', name: 'Hand with Fingers Splayed' },
    { emoji: '✋', name: 'Raised Hand' }, { emoji: '🖖', name: 'Vulcan Salute' }, { emoji: '👏', name: 'Clapping Hands' },
    { emoji: '🙌', name: 'Raising Hands' }, { emoji: '🤲', name: 'Palms Up Together' }, { emoji: '🤝', name: 'Handshake' },
    { emoji: '🙏', name: 'Folded Hands' }, { emoji: '✍️', name: 'Writing Hand' }, { emoji: '💅', name: 'Nail Polish' },
    { emoji: '👀', name: 'Eyes' }, { emoji: '👅', name: 'Tongue' }, { emoji: '👄', name: 'Mouth' },
  ],
  'Animals': [
    { emoji: '🐶', name: 'Dog Face' }, { emoji: '🐱', name: 'Cat Face' }, { emoji: '🐭', name: 'Mouse Face' }, { emoji: '🐹', name: 'Hamster' },
    { emoji: '🐰', name: 'Rabbit Face' }, { emoji: '🦊', name: 'Fox' }, { emoji: '🐻', name: 'Bear' }, { emoji: '🐼', name: 'Panda' },
    { emoji: '🐨', name: 'Koala' }, { emoji: '🐯', name: 'Tiger Face' }, { emoji: '🦁', name: 'Lion' }, { emoji: '🐮', name: 'Cow Face' },
    { emoji: '🐷', name: 'Pig Face' }, { emoji: '🐸', name: 'Frog' }, { emoji: '🐵', name: 'Monkey Face' },
    { emoji: '🐔', name: 'Chicken' }, { emoji: '🐧', name: 'Penguin' }, { emoji: '🐦', name: 'Bird' },
    { emoji: '🐤', name: 'Baby Chick' }, { emoji: '🐣', name: 'Hatching Chick' }, { emoji: '🐥', name: 'Front-Facing Baby Chick' },
    { emoji: '🦆', name: 'Duck' }, { emoji: '🦅', name: 'Eagle' }, { emoji: '🦉', name: 'Owl' },
    { emoji: '🦇', name: 'Bat' }, { emoji: '🐺', name: 'Wolf' }, { emoji: '🐗', name: 'Boar' },
    { emoji: '🐴', name: 'Horse Face' }, { emoji: '🦄', name: 'Unicorn' }, { emoji: '🐝', name: 'Honeybee' },
    { emoji: '🐛', name: 'Bug' }, { emoji: '🦋', name: 'Butterfly' }, { emoji: '🐌', name: 'Snail' },
    { emoji: '🐞', name: 'Lady Beetle' }, { emoji: '🐜', name: 'Ant' }, { emoji: '🦟', name: 'Mosquito' },
    { emoji: '🦗', name: 'Cricket' }, { emoji: '🕷️', name: 'Spider' }, { emoji: '🦂', name: 'Scorpion' },
    { emoji: '🐢', name: 'Turtle' }, { emoji: '🐍', name: 'Snake' }, { emoji: '🦎', name: 'Lizard' },
    { emoji: '🦖', name: 'T-Rex' }, { emoji: '🦕', name: 'Sauropod' }, { emoji: '🐙', name: 'Octopus' },
    { emoji: '🦑', name: 'Squid' }, { emoji: '🦐', name: 'Shrimp' }, { emoji: '🦞', name: 'Lobster' },
    { emoji: '🦀', name: 'Crab' }, { emoji: '🐡', name: 'Blowfish' }, { emoji: '🐠', name: 'Tropical Fish' },
    { emoji: '🐟', name: 'Fish' }, { emoji: '🐬', name: 'Dolphin' }, { emoji: '🐳', name: 'Spouting Whale' },
    { emoji: '🐋', name: 'Whale' }, { emoji: '🦈', name: 'Shark' }, { emoji: '🐊', name: 'Crocodile' },
    { emoji: '🐅', name: 'Tiger' }, { emoji: '🐆', name: 'Leopard' }, { emoji: '🦓', name: 'Zebra' },
    { emoji: '🦍', name: 'Gorilla' }, { emoji: '🦧', name: 'Orangutan' }, { emoji: '🐘', name: 'Elephant' },
  ],
  'Food': [
    { emoji: '🍏', name: 'Green Apple' }, { emoji: '🍎', name: 'Red Apple' }, { emoji: '🍐', name: 'Pear' },
    { emoji: '🍊', name: 'Tangerine' }, { emoji: '🍋', name: 'Lemon' }, { emoji: '🍌', name: 'Banana' },
    { emoji: '🍉', name: 'Watermelon' }, { emoji: '🍇', name: 'Grapes' }, { emoji: '🍓', name: 'Strawberry' },
    { emoji: '🫐', name: 'Blueberries' }, { emoji: '🍈', name: 'Melon' }, { emoji: '🍒', name: 'Cherries' },
    { emoji: '🍑', name: 'Peach' }, { emoji: '🥭', name: 'Mango' }, { emoji: '🍍', name: 'Pineapple' },
    { emoji: '🥥', name: 'Coconut' }, { emoji: '🥝', name: 'Kiwi' }, { emoji: '🍅', name: 'Tomato' },
    { emoji: '🍆', name: 'Eggplant' }, { emoji: '🥑', name: 'Avocado' }, { emoji: '🥦', name: 'Broccoli' },
    { emoji: '🥬', name: 'Leafy Green' }, { emoji: '🥒', name: 'Cucumber' }, { emoji: '🌶️', name: 'Hot Pepper' },
    { emoji: '🫑', name: 'Bell Pepper' }, { emoji: '🌽', name: 'Corn' }, { emoji: '🥕', name: 'Carrot' },
    { emoji: '🧄', name: 'Garlic' }, { emoji: '🧅', name: 'Onion' }, { emoji: '🥔', name: 'Potato' },
    { emoji: '🍠', name: 'Roasted Sweet Potato' }, { emoji: '🥐', name: 'Croissant' }, { emoji: '🍞', name: 'Bread' },
    { emoji: '🥖', name: 'Baguette Bread' }, { emoji: '🥨', name: 'Pretzel' }, { emoji: '🧀', name: 'Cheese Wedge' },
    { emoji: '🥚', name: 'Egg' }, { emoji: '🍳', name: 'Cooking' }, { emoji: '🥞', name: 'Pancakes' },
    { emoji: '🧇', name: 'Waffle' }, { emoji: '🥓', name: 'Bacon' }, { emoji: '🥩', name: 'Lump of Meat' },
    { emoji: '🍗', name: 'Poultry Leg' }, { emoji: '🍖', name: 'Meat on Bone' }, { emoji: '🌭', name: 'Hot Dog' },
    { emoji: '🍔', name: 'Hamburger' }, { emoji: '🍟', name: 'French Fries' }, { emoji: '🍕', name: 'Pizza' },
    { emoji: '🥪', name: 'Sandwich' }, { emoji: '🥙', name: 'Stuffed Flatbread' }, { emoji: '🌮', name: 'Taco' },
    { emoji: '🌯', name: 'Burrito' }, { emoji: '🥗', name: 'Green Salad' }, { emoji: '🥘', name: 'Shallow Pan of Food' },
    { emoji: '🫕', name: 'Fondue' }, { emoji: '🥫', name: 'Canned Food' }, { emoji: '🍝', name: 'Spaghetti' },
    { emoji: '🍜', name: 'Steaming Bowl' }, { emoji: '🍲', name: 'Pot of Food' }, { emoji: '🍛', name: 'Curry Rice' },
    { emoji: '🍣', name: 'Sushi' }, { emoji: '🍱', name: 'Bento Box' }, { emoji: '🥟', name: 'Dumpling' },
    { emoji: '🦪', name: 'Oyster' }, { emoji: '🍤', name: 'Fried Shrimp' }, { emoji: '🍙', name: 'Rice Ball' },
    { emoji: '🍚', name: 'Cooked Rice' }, { emoji: '🍘', name: 'Rice Cracker' }, { emoji: '🍥', name: 'Fish Cake with Swirl' },
    { emoji: '🥠', name: 'Fortune Cookie' }, { emoji: '🥮', name: 'Moon Cake' }, { emoji: '🍢', name: 'Oden' },
    { emoji: '🍡', name: 'Dango' }, { emoji: '🍧', name: 'Shaved Ice' }, { emoji: '🍨', name: 'Ice Cream' },
    { emoji: '🍦', name: 'Soft Ice Cream' }, { emoji: '🥧', name: 'Pie' }, { emoji: '🧁', name: 'Cupcake' },
    { emoji: '🍰', name: 'Shortcake' }, { emoji: '🎂', name: 'Birthday Cake' }, { emoji: '🍮', name: 'Custard' },
    { emoji: '🍭', name: 'Lollipop' }, { emoji: '🍬', name: 'Candy' }, { emoji: '🍫', name: 'Chocolate Bar' },
    { emoji: '🍿', name: 'Popcorn' }, { emoji: '🍩', name: 'Doughnut' }, { emoji: '🍪', name: 'Cookie' },
    { emoji: '🌰', name: 'Chestnut' }, { emoji: '🥜', name: 'Peanuts' },
  ],
  'Symbols': [
    { emoji: '❤️', name: 'Red Heart' }, { emoji: '🧡', name: 'Orange Heart' }, { emoji: '💛', name: 'Yellow Heart' },
    { emoji: '💚', name: 'Green Heart' }, { emoji: '💙', name: 'Blue Heart' }, { emoji: '💜', name: 'Purple Heart' },
    { emoji: '🖤', name: 'Black Heart' }, { emoji: '🤍', name: 'White Heart' }, { emoji: '🤎', name: 'Brown Heart' },
    { emoji: '💔', name: 'Broken Heart' }, { emoji: '❣️', name: 'Heart Exclamation' }, { emoji: '💕', name: 'Two Hearts' },
    { emoji: '💞', name: 'Revolving Hearts' }, { emoji: '💓', name: 'Beating Heart' }, { emoji: '💗', name: 'Growing Heart' },
    { emoji: '💖', name: 'Sparkling Heart' }, { emoji: '💘', name: 'Heart with Arrow' }, { emoji: '💝', name: 'Heart with Ribbon' },
    { emoji: '💟', name: 'Heart Decoration' }, { emoji: '☮️', name: 'Peace Symbol' }, { emoji: '✝️', name: 'Latin Cross' },
    { emoji: '☪️', name: 'Star and Crescent' }, { emoji: '☸️', name: 'Wheel of Dharma' }, { emoji: '✡️', name: 'Star of David' },
    { emoji: '🔯', name: 'Six Pointed Star' }, { emoji: '☯️', name: 'Yin Yang' }, { emoji: '🛐', name: 'Place of Worship' },
    { emoji: '♈', name: 'Aries' }, { emoji: '♉', name: 'Taurus' }, { emoji: '♊', name: 'Gemini' },
    { emoji: '♋', name: 'Cancer' }, { emoji: '♌', name: 'Leo' }, { emoji: '♍', name: 'Virgo' },
    { emoji: '♎', name: 'Libra' }, { emoji: '♏', name: 'Scorpio' }, { emoji: '♐', name: 'Sagittarius' },
    { emoji: '♑', name: 'Capricorn' }, { emoji: '♒', name: 'Aquarius' }, { emoji: '♓', name: 'Pisces' },
    { emoji: '🆔', name: 'ID Button' }, { emoji: '⚕️', name: 'Medical Symbol' }, { emoji: '♻️', name: 'Recycling Symbol' },
    { emoji: '⚜️', name: 'Fleur-de-lis' }, { emoji: '🔱', name: 'Trident Emblem' }, { emoji: '📛', name: 'Name Badge' },
    { emoji: '🔰', name: 'Japanese Symbol for Beginner' }, { emoji: '⭕', name: 'Hollow Red Circle' },
    { emoji: '✅', name: 'Check Mark Button' }, { emoji: '☑️', name: 'Check Box with Check' },
    { emoji: '✔️', name: 'Check Mark' }, { emoji: '❌', name: 'Cross Mark' }, { emoji: '❎', name: 'Cross Mark Button' },
    { emoji: '➖', name: 'Minus' }, { emoji: '➕', name: 'Plus' }, { emoji: '➗', name: 'Divide' },
    { emoji: '➰', name: 'Curly Loop' }, { emoji: '〰️', name: 'Wavy Dash' },
    { emoji: '💲', name: 'Heavy Dollar Sign' }, { emoji: '💱', name: 'Currency Exchange' },
    { emoji: '✖️', name: 'Multiply' }, { emoji: '❗', name: 'Red Exclamation Mark' }, { emoji: '❕', name: 'White Exclamation Mark' },
    { emoji: '❓', name: 'Red Question Mark' }, { emoji: '❔', name: 'White Question Mark' },
    { emoji: '‼️', name: 'Double Exclamation Mark' }, { emoji: '⁉️', name: 'Exclamation Question Mark' },
    { emoji: '🔅', name: 'Dim Button' }, { emoji: '🔆', name: 'Bright Button' },
  ],
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
            className={`px-3 py-1.5 text-xs rounded-sm transition-colors ${cat === c ? 'bg-accent text-white' : 'bg-surface text-text-primary border border-[rgba(127,99,21,0.15)]'}`}>{t('emoji' + c)}</button>
        ))}
      </div>
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1">
        {EMOJIS[cat].map((item, i) => (
          <button key={i} onClick={() => copy(item.emoji)}
            className={`text-xl p-2 rounded-sm hover:bg-accent/10 transition-colors text-center ${copied === item.emoji ? 'bg-green-500/20' : ''}`}
            title={item.name}>{item.emoji}</button>
        ))}
      </div>
      {copied && <p className="text-xs text-green-500 text-center">✓ {t('copied')}</p>}
    </div>
  )
}